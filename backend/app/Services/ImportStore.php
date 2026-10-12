<?php

namespace App\Services;

use App\Support\DatabaseScope;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use ZipArchive;

final class ImportStore
{
    public function stage(string $path, string $originalName, ?string $documentId, ?string $title, ?int $actor): array
    {
        DatabaseScope::assertWritable();
        $package = $this->validatePackage($path);
        $sha = hash_file('sha256', $path);
        $sameBytes = DB::table('source_revisions')->where('sha256', $sha)->first();
        if ($sameBytes) {
            $documentId = $sameBytes->document_id;
        }
        $documentId ??= 'DOC-'.Str::uuid();
        $originalName = mb_substr(basename(str_replace('\\', '/', $originalName)), 0, 240);
        $sourceRevision = $documentId.'/'.$sha;
        $storage = Storage::disk('local');
        $storedPath = 'source-files/'.$sha.'.vsdx';
        if (! $storage->exists($storedPath)) {
            $storage->makeDirectory('source-files');
            $temporary = tempnam(dirname($storage->path($storedPath)), 'upload-');
            try {
                if (! copy($path, $temporary) || hash_file('sha256', $temporary) !== $sha) {
                    throw new RuntimeException('Source changed during storage.');
                }
                if (! $storage->exists($storedPath) && ! @rename($temporary, $storage->path($storedPath)) && ! $storage->exists($storedPath)) {
                    throw new RuntimeException('Could not atomically store source bytes.');
                }
            } finally {
                if (is_file($temporary)) {
                    unlink($temporary);
                }
            }
        }
        if (hash_file('sha256', $storage->path($storedPath)) !== $sha) {
            throw new RuntimeException('Stored source checksum mismatch.');
        }
        $root = dirname(base_path());
        $extractor = config('fiber_atlas.extractor_version').'/'.substr(hash_file('sha256', $root.'/scripts/extract-vsdx.py'), 0, 12);
        if ($package['inventoryOnly']) {
            $extractor = 'stream-inventory/1/'.substr(hash_file('sha256', $root.'/scripts/stage-vsdx-inventory.py'), 0, 12);
        }
        $interpreter = config('fiber_atlas.interpreter_version').'/'.substr(hash('sha256', implode('', array_map(fn ($file) => hash_file('sha256', $root.'/scripts/'.$file), ['interpret-upload.py', 'compile-upload.ts', 'interpret-iteration23-source.py', 'interpret-iteration27-source.py', 'marker_geometry.py', 'source-b-ap-grammar.mjs', 'source-b-closure-grammar.mjs']))), 0, 24);
        $interpreter .= '/'.substr(hash('sha256', implode('', array_map(fn ($file) => hash_file('sha256', $root.'/src/domain/'.$file), ['types.ts', 'currentFiberPath.ts', 'iteration28c.ts', 'operationalPayload.ts', 'importedUsage.ts', 'iteration28f.ts']))), 0, 16);
        $result = DB::transaction(function () use ($documentId, $title, $originalName, $sourceRevision, $sha, $storedPath, $actor, $extractor, $interpreter) {
            DB::table('source_documents')->insertOrIgnore(['id' => $documentId, 'title' => $title ?: $originalName, 'created_at' => now()]);
            DB::table('source_revisions')->insertOrIgnore(['id' => $sourceRevision, 'document_id' => $documentId, 'sha256' => $sha, 'original_name' => $originalName, 'stored_path' => $storedPath, 'metadata' => NetworkStore::json(['stage' => 'uploaded', 'fieldVerified' => false]), 'created_at' => now()]);
            DB::table('source_revisions')->where('id', $sourceRevision)->whereNull('stored_path')->update(['stored_path' => $storedPath]);
            DB::table('source_revisions')->where('id', $sourceRevision)->lockForUpdate()->first();
            $existing = DB::table('import_runs')->where('source_revision', $sourceRevision)->where('extractor_version', $extractor)->where('interpreter_version', $interpreter)->first();
            if ($existing) {
                return ['id' => $existing->id, 'sourceRevision' => $sourceRevision, 'reused' => true];
            }
            $id = (string) Str::uuid();
            DB::table('import_runs')->insert(['id' => $id, 'source_revision' => $sourceRevision, 'extractor_version' => $extractor, 'interpreter_version' => $interpreter, 'extraction_status' => 'running', 'semantic_status' => 'not_evaluated', 'network_status' => 'staged', 'warnings' => '[]', 'actor_id' => $actor, 'created_at' => now()]);

            return ['id' => $id, 'sourceRevision' => $sourceRevision, 'reused' => false];
        });
        if ($result['reused']) {
            $existing = DB::table('import_runs')->where('id', $result['id'])->first();
            if ($existing->extraction_status === 'completed' && $existing->network_status !== 'applied') {
                $this->prepareSafely($existing->id);
            }

            return $result;
        }
        $run = $result['id'];
        register_shutdown_function(static function () use ($run): void {
            $last = error_get_last();
            if (! $last || ! in_array($last['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
                return;
            }
            try {
                $job = DB::table('import_runs')->where('id', $run)->first();
                if ($job && $job->network_status === 'staged' && $job->semantic_status !== 'validated') {
                    DB::table('import_runs')->where('id', $run)->update(['semantic_status' => 'failed', 'error' => 'Processing was interrupted. Reupload the same source to retry; the active network was preserved.']);
                }
            } catch (\Throwable) {
            }
        });
        $directory = 'imports/'.$run;
        $storage->makeDirectory($directory);
        $artifact = $storage->path($directory.'/raw.json.gz');
        $summaryPath = $storage->path($directory.'/summary.json');
        $index = $storage->path($directory.'/shapes.ndjson');
        try {
            if ($package['inventoryOnly']) {
                $this->run([$root.'/scripts/stage-vsdx-inventory.py', $storage->path($storedPath), $summaryPath, $index, '--max-shapes', (string) config('fiber_atlas.max_inventory_shapes')]);
            } else {
                $this->run([$root.'/scripts/extract-vsdx.py', $storage->path($storedPath), $artifact, '--summary', $summaryPath]);
                $this->run([$root.'/scripts/index-source-shapes.py', $artifact, $index]);
            }
            $summary = json_decode(file_get_contents($summaryPath), true, flags: JSON_THROW_ON_ERROR);
            if (($summary['source']['sha256'] ?? null) !== $sha) {
                throw new RuntimeException('Extractor source checksum mismatch.');
            }
            $shapeRows = [];
            $candidateRows = [];
            $labels = [];
            $handle = fopen($index, 'rb');
            try {
                while (($line = fgets($handle)) !== false) {
                    $shape = json_decode($line, true, flags: JSON_THROW_ON_ERROR);
                    $shapeRows[] = ['source_revision' => $sourceRevision, 'import_run' => $run, 'page_id' => $shape['page_id'], 'shape_id' => $shape['shape_id'], 'payload' => NetworkStore::json($shape['payload'])];
                    $text = trim($shape['payload']['text'] ?? '');
                    if (preg_match('/^\d+-\d+-\d+-\d+$/D', $text)) {
                        $labels[] = $text;
                        $candidateRows[] = ['id' => (string) Str::uuid(), 'import_run' => $run, 'kind' => 'cable_label', 'status' => 'unreviewed', 'payload' => NetworkStore::json(['rawText' => $text, 'sourceRevision' => $sourceRevision, 'pageId' => $shape['page_id'], 'shapeId' => $shape['shape_id'], 'basis' => 'literal label only; no canonical identity or optical edge asserted'])];
                    }
                    if (count($shapeRows) >= 100) {
                        DB::table('source_shapes')->insert($shapeRows);
                        $shapeRows = [];
                    }
                }
            } finally {
                fclose($handle);
            }
            if ($shapeRows) {
                DB::table('source_shapes')->insert($shapeRows);
            }
            foreach (array_chunk($candidateRows, 100) as $chunk) {
                DB::table('import_candidates')->insert($chunk);
            }
            $prior = DB::table('import_runs')->join('source_revisions', 'source_revisions.id', '=', 'import_runs.source_revision')->where('document_id', $documentId)->where('import_runs.id', '<>', $run)->where('extraction_status', 'completed')->orderByDesc('import_runs.created_at')->select('import_runs.id', 'import_runs.extractor_version', 'import_runs.interpreter_version')->first();
            $previousLabels = $prior ? DB::table('import_candidates')->where('import_run', $prior->id)->where('kind', 'cable_label')->get()->map(fn ($c) => json_decode($c->payload, true)['rawText'])->all() : [];
            $summary['candidateLabels'] = $labels;
            $summary['package'] = $package;
            $summary['stagedLabelDiff'] = ['added' => array_values(array_diff($labels, $previousLabels)), 'removed' => array_values(array_diff($previousLabels, $labels)), 'scope' => 'detected literal labels only; not an accepted-network diff'];
            $changes = $prior ? DB::select(<<<'SQL'
WITH old_shapes AS (SELECT * FROM source_shapes WHERE import_run=?),
new_shapes AS (SELECT * FROM source_shapes WHERE import_run=?)
SELECT coalesce(a.page_id,b.page_id) AS page_id,coalesce(a.shape_id,b.shape_id) AS shape_id,
CASE WHEN a.shape_id IS NULL THEN 'added' WHEN b.shape_id IS NULL THEN 'removed' ELSE 'changed' END AS disposition,
md5(a.payload::text) AS before_fingerprint,md5(b.payload::text) AS after_fingerprint
FROM old_shapes a FULL OUTER JOIN new_shapes b ON a.page_id=b.page_id AND a.shape_id=b.shape_id
WHERE a.payload IS DISTINCT FROM b.payload
SQL, [$prior->id, $run]) : [];
            $changeCounts = ['added' => 0, 'removed' => 0, 'changed' => 0, 'canonicalImpactUnresolved' => count($changes)];
            $rows = [];
            foreach ($changes as $change) {
                $changeCounts[$change->disposition]++;
                $rows[] = ['id' => (string) Str::uuid(), 'import_run' => $run, 'kind' => 'source_shape_change', 'status' => 'unreviewed', 'payload' => NetworkStore::json((array) $change + ['priorRun' => $prior->id, 'canonicalImpact' => 'unresolved; local Shape key correspondence requires semantic review'])];
            }
            foreach (array_chunk($rows, 100) as $chunk) {
                DB::table('import_candidates')->insert($chunk);
            }
            $summary['sourceShapeDiff'] = ['status' => $prior ? 'compared' : 'no_previous_interpretation', 'priorRun' => $prior?->id, 'counts' => $changeCounts, 'interpretationChanged' => $prior && ($prior->extractor_version !== $extractor || $prior->interpreter_version !== $interpreter), 'basis' => 'same-document local Shape keys; canonical identity and active-network impact remain unreviewed'];
            DB::table('import_runs')->where('id', $run)->update(['extraction_status' => 'completed', 'semantic_status' => 'not_evaluated', 'network_status' => 'staged', 'artifact_path' => $directory.($package['inventoryOnly'] ? '/summary.json' : '/raw.json.gz'), 'summary' => NetworkStore::json($summary), 'warnings' => NetworkStore::json(['Extraction success is not semantic/topology certification.', 'Candidates remain unreviewed; active graph and accepted decisions are unchanged.']), 'finished_at' => now()]);
        } catch (\Throwable $error) {
            DB::table('import_runs')->where('id', $run)->update(['extraction_status' => 'failed', 'error' => substr($error->getMessage(), 0, 2000), 'finished_at' => now()]);
            throw $error;
        }
        $this->prepareSafely($run);

        return $result;
    }

    public function reprocessGeometry(string $priorRunId, int $actor): array
    {
        DatabaseScope::assertWritable();
        $storage = Storage::disk('local');
        $prior = DB::table('import_runs')->where('id', $priorRunId)->first();
        abort_unless($prior, 404);
        $priorSummary = json_decode($prior->summary ?? '{}', true, flags: JSON_THROW_ON_ERROR);
        abort_unless(($priorSummary['extractionScope'] ?? null) === 'package_inventory', 422, 'Only a preserved inventory-only source can be reprocessed by this action.');
        $revision = DB::table('source_revisions')->where('id', $prior->source_revision)->first();
        abort_unless($revision && preg_match('/^source-files\/[a-f0-9]{64}\.vsdx$/D', $revision->stored_path ?? '') && $storage->exists($revision->stored_path), 409, 'The preserved source file is unavailable.');
        $sourcePath = $storage->path($revision->stored_path);
        if (hash_file('sha256', $sourcePath) !== $revision->sha256) {
            abort(409, 'The preserved source checksum does not match its recorded revision.');
        }

        $root = dirname(base_path());
        $extractorPath = $root.'/scripts/extract-vsdx-geometry-stream.py';
        $extractor = 'stream-geometry/1/'.substr(hash('sha256', hash_file('sha256', $extractorPath).hash_file('sha256', $root.'/scripts/extract-vsdx.py')), 0, 16);
        $versionFiles = ['scripts/interpret-shida-upload.py', 'scripts/audit-iteration33-shida.py', 'scripts/shida_geometry.py', 'scripts/marker_geometry.py', 'scripts/compile-shida.ts', 'scripts/compile-upload.ts', 'src/domain/currentFiberPath.ts', 'src/domain/iteration28c.ts', 'src/domain/operationalPayload.ts', 'src/domain/importedUsage.ts', 'src/domain/iteration28f.ts', 'src/domain/types.ts'];
        $interpreterBase = 'shida-source-local/33/'.substr(hash('sha256', implode('', array_map(fn ($file) => hash_file('sha256', $root.'/'.$file), $versionFiles))), 0, 24);
        $reprocessing = DB::transaction(function () use ($revision, $extractor, $interpreterBase, $actor, $priorRunId, $storage) {
            DB::table('source_revisions')->where('id', $revision->id)->lockForUpdate()->first();
            $existingRuns = DB::table('import_runs')->where('source_revision', $revision->id)->where('extractor_version', $extractor)->orderByDesc('created_at')->lockForUpdate()->get();
            $geometryReuse = null;
            foreach ($existingRuns as $existing) {
                if ($existing->extraction_status === 'completed') {
                    $cached = json_decode($existing->summary ?? '{}', true, flags: JSON_THROW_ON_ERROR);
                    $intact = ($cached['extractionScope'] ?? null) === 'geometry_evidence' && $storage->exists('imports/'.$existing->id.'/geometry/summary.json') && DB::table('source_shapes')->where('import_run', $existing->id)->count() === ($cached['summary']['shapes_including_subshapes'] ?? null);
                    foreach (['shapes' => 'shapes.ndjson.gz', 'connects' => 'connects.ndjson.gz'] as $key => $file) {
                        $path = 'imports/'.$existing->id.'/geometry/'.$file;
                        $intact = $intact && $storage->exists($path) && hash_file('sha256', $storage->path($path)) === ($cached['artifacts'][$key]['sha256'] ?? null);
                    }
                    if (! $intact) {
                        DB::table('import_runs')->where('id', $existing->id)->update(['extraction_status' => 'failed', 'error' => 'Cached geometry evidence is missing or damaged; the preserved source can be reprocessed.', 'finished_at' => now()]);

                        continue;
                    }

                    $current = str_starts_with($existing->interpreter_version, $interpreterBase.'/attempt-');
                    $proposal = $cached['proposal'] ?? [];
                    $candidateIntact = ! ($proposal['ready'] ?? false) || (preg_match('/^candidate-\d+\.json$/D', $proposal['artifact'] ?? '') && $storage->exists('imports/'.$existing->id.'/'.$proposal['artifact']) && hash_file('sha256', $storage->path('imports/'.$existing->id.'/'.$proposal['artifact'])) === ($proposal['artifactSha256'] ?? null));
                    $expected = DB::table('active_network_state')->where('id', 1)->value('network_revision');
                    $fresh = ! ($proposal['ready'] ?? false) || ($existing->network_status === 'applied' ? ($proposal['networkRevision'] ?? null) === $expected : ($proposal['expectedNetworkRevision'] ?? null) === $expected);
                    if ($current && $candidateIntact && $fresh && in_array($existing->semantic_status, ['validated', 'unsupported'], true)) {
                        return ['id' => $existing->id, 'reused' => true];
                    }
                    $geometryReuse ??= $existing->id;
                }
                if ($existing->extraction_status === 'running') {
                    $processingSummary = json_decode($existing->summary ?? '{}', true, flags: JSON_THROW_ON_ERROR);
                    $lease = $processingSummary['processingLeaseExpiresAt'] ?? null;
                    if ($lease && Carbon::parse($lease)->lt(now())) {
                        DB::table('import_runs')->where('id', $existing->id)->update(['extraction_status' => 'failed', 'error' => 'The previous processing attempt was interrupted; a new versioned attempt is required.', 'finished_at' => now()]);

                        continue;
                    }

                    if (! $lease) {
                        $processingSummary['processingLeaseExpiresAt'] = now()->addSeconds(config('fiber_atlas.reprocess_lease_seconds', 900))->toIso8601String();
                        DB::table('import_runs')->where('id', $existing->id)->update(['summary' => NetworkStore::json($processingSummary)]);
                    }

                    return ['id' => $existing->id, 'reused' => true, 'inProgress' => true];
                }
            }
            $id = (string) Str::uuid();
            $interpreter = $interpreterBase.'/attempt-'.(count($existingRuns) + 1);
            DB::table('import_runs')->insert(['id' => $id, 'source_revision' => $revision->id, 'extractor_version' => $extractor, 'interpreter_version' => $interpreter, 'extraction_status' => 'running', 'semantic_status' => 'not_evaluated', 'network_status' => 'staged', 'warnings' => '[]', 'actor_id' => $actor, 'created_at' => now(), 'summary' => NetworkStore::json(['priorInventoryRun' => $priorRunId, 'processingLeaseExpiresAt' => now()->addSeconds(config('fiber_atlas.reprocess_lease_seconds', 900))->toIso8601String(), 'extractionScope' => 'geometry_processing', 'progress' => ['phase' => 'extracting', 'shapesIndexed' => 0]])]);

            return ['id' => $id, 'reused' => false, 'geometryReuse' => $geometryReuse];
        });
        if ($reprocessing['reused']) {
            return ['id' => $reprocessing['id'], 'sourceRevision' => $revision->id, 'reused' => true, 'inProgress' => $reprocessing['inProgress'] ?? false];
        }
        $runId = $reprocessing['id'];
        $processingStarted = hrtime(true);
        register_shutdown_function(static function () use ($runId): void {
            $last = error_get_last();
            if (! $last || ! in_array($last['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
                return;
            }
            try {
                DB::table('import_runs')->where('id', $runId)->where('extraction_status', 'running')->update(['extraction_status' => 'failed', 'error' => 'Geometry processing was interrupted. Reprocess the preserved inventory run to retry.', 'finished_at' => now()]);
            } catch (\Throwable) {
            }
        });
        $directory = 'imports/'.$runId.'/geometry';
        $storage->makeDirectory($directory);
        $outputDirectory = $storage->path($directory);

        try {
            $geometryReuse = $reprocessing['geometryReuse'] ?? null;
            if ($geometryReuse) {
                foreach (['summary.json', 'shapes.ndjson.gz', 'connects.ndjson.gz'] as $file) {
                    $storage->copy('imports/'.$geometryReuse.'/geometry/'.$file, $directory.'/'.$file);
                }
            } else {
                $this->run([$extractorPath, $sourcePath, $outputDirectory]);
            }
            $summaryPath = $outputDirectory.'/summary.json';
            $summary = json_decode(file_get_contents($summaryPath), true, flags: JSON_THROW_ON_ERROR);
            abort_unless(($summary['source']['sha256'] ?? null) === $revision->sha256, 409, 'Geometry extraction checksum mismatch.');
            abort_unless(($summary['summary']['geometry_decoded'] ?? false) === true && ($summary['summary']['topology_projected'] ?? true) === false, 422, 'The geometry artifact has an unexpected interpretation scope.');
            abort_unless(($summary['summary']['shape_index'] ?? null) === 'shapes.ndjson.gz' && ($summary['summary']['connect_index'] ?? null) === 'connects.ndjson.gz', 422, 'Unexpected geometry artifact paths.');
            foreach (['shapes' => 'shapes.ndjson.gz', 'connects' => 'connects.ndjson.gz'] as $key => $file) {
                $artifact = $summary['artifacts'][$key] ?? [];
                abort_unless(($artifact['file'] ?? null) === $file && is_file($outputDirectory.'/'.$file) && hash_file('sha256', $outputDirectory.'/'.$file) === ($artifact['sha256'] ?? null), 409, 'Geometry artifact integrity failed.');
            }
            abort_unless(($summary['summary']['shapes_including_subshapes'] ?? 0) > 0 && $summary['summary']['shapes_including_subshapes'] <= config('fiber_atlas.max_inventory_shapes'), 422, 'Geometry Shape count exceeds the indexed evidence limit.');
            $summary['masterCount'] = count($summary['masters'] ?? []);
            unset($summary['masters']);
            $summary['priorInventoryRun'] = $priorRunId;
            $summary['extractionScope'] = 'geometry_processing';
            $summary['processingLeaseExpiresAt'] = now()->addSeconds(config('fiber_atlas.reprocess_lease_seconds', 900))->toIso8601String();
            $summary['progress'] = ['phase' => 'indexing', 'shapesIndexed' => 0, 'shapesTotal' => $summary['summary']['shapes_including_subshapes']];
            DB::table('import_runs')->where('id', $runId)->update(['summary' => NetworkStore::json($summary)]);

            $shapeRows = [];
            $candidateRows = [];
            $shapeCount = 0;
            $indexingStarted = hrtime(true);
            if ($geometryReuse) {
                DB::table('source_shapes')->insertUsing(['source_revision', 'page_id', 'shape_id', 'payload', 'import_run'], DB::table('source_shapes')->where('import_run', $geometryReuse)->select('source_revision', 'page_id', 'shape_id', 'payload')->selectRaw('? as import_run', [$runId]));
                $shapeCount = DB::table('source_shapes')->where('import_run', $runId)->count();
                DB::table('import_candidates')->where('import_run', $geometryReuse)->orderBy('id')->chunk(100, function ($rows) use ($runId) {
                    DB::table('import_candidates')->insert($rows->map(fn ($row) => ['id' => (string) Str::uuid(), 'import_run' => $runId, 'kind' => $row->kind, 'status' => 'unreviewed', 'payload' => $row->payload])->all());
                });
                $summary['geometryReusedFrom'] = $geometryReuse;
            } else {
                $handle = gzopen($outputDirectory.'/'.$summary['summary']['shape_index'], 'rb');
                abort_unless($handle !== false, 500, 'The compressed geometry index could not be opened.');
                try {
                    while (($line = gzgets($handle)) !== false) {
                        $shape = json_decode($line, true, flags: JSON_THROW_ON_ERROR);
                        $shapeRows[] = ['source_revision' => $revision->id, 'import_run' => $runId, 'page_id' => $shape['page_id'], 'shape_id' => $shape['shape_id'], 'payload' => NetworkStore::json($shape['payload'])];
                        $shapeCount++;
                        $text = trim($shape['payload']['text'] ?? '');
                        if (preg_match('/^\d+(?:-\d+){3,4}$/D', $text)) {
                            $candidateRows[] = ['id' => (string) Str::uuid(), 'import_run' => $runId, 'kind' => 'cable_label', 'status' => 'unreviewed', 'payload' => NetworkStore::json(['rawText' => $text, 'sourceRevision' => $revision->id, 'pageId' => $shape['page_id'], 'shapeId' => $shape['shape_id'], 'basis' => 'literal source label; field roles and optical topology are not asserted'])];
                        }
                        if (count($shapeRows) >= 100) {
                            DB::table('source_shapes')->insert($shapeRows);
                            $shapeRows = [];
                            if ($shapeCount % 1000 === 0) {
                                $summary['progress']['shapesIndexed'] = $shapeCount;
                                $summary['processingLeaseExpiresAt'] = now()->addSeconds(config('fiber_atlas.reprocess_lease_seconds', 900))->toIso8601String();
                                DB::table('import_runs')->where('id', $runId)->update(['summary' => NetworkStore::json($summary)]);
                            }
                        }
                        if (count($candidateRows) >= 100) {
                            DB::table('import_candidates')->insert($candidateRows);
                            $candidateRows = [];
                        }
                    }
                } finally {
                    gzclose($handle);
                }
                if ($shapeRows) {
                    DB::table('source_shapes')->insert($shapeRows);
                }
                if ($candidateRows) {
                    DB::table('import_candidates')->insert($candidateRows);
                }
            }
            abort_unless($shapeCount === ($summary['summary']['shapes_including_subshapes'] ?? null), 409, 'Geometry index Shape count does not match its summary.');

            $summary['extractionScope'] = 'geometry_evidence';
            $summary['geometryDecoded'] = true;
            $summary['topologyProjected'] = false;
            $summary['priorInventoryRun'] = $priorRunId;
            $summary['interpretationStatus'] = 'source-specific topology not evaluated';
            $summary['progress'] = ['phase' => 'interpreting', 'shapesIndexed' => $shapeCount, 'shapesTotal' => $shapeCount];
            $summary['resources']['indexing_seconds'] = round((hrtime(true) - $indexingStarted) / 1e9, 3);
            $summary['resources']['total_processing_seconds'] = round((hrtime(true) - $processingStarted) / 1e9, 3);
            $summary['resources']['php_peak_memory_bytes'] = memory_get_peak_usage(true);
            $warnings = ['Geometry is decoded and source evidence is available; source-specific network topology has not been evaluated.', 'No network proposal or active-network change was produced.'];
            DB::table('import_runs')->where('id', $runId)->update(['semantic_status' => 'not_evaluated', 'network_status' => 'staged', 'artifact_path' => $directory.'/summary.json', 'summary' => NetworkStore::json($summary), 'warnings' => NetworkStore::json($warnings)]);
            $this->prepareSafely($runId);
            $summary = json_decode(DB::table('import_runs')->where('id', $runId)->value('summary'), true, flags: JSON_THROW_ON_ERROR);
            $summary['progress']['phase'] = 'completed';
            $summary['resources']['total_processing_seconds'] = round((hrtime(true) - $processingStarted) / 1e9, 3);
            $summary['resources']['php_peak_memory_bytes'] = memory_get_peak_usage(true);
            unset($summary['processingLeaseExpiresAt']);
            DB::table('import_runs')->where('id', $runId)->update(['extraction_status' => 'completed', 'summary' => NetworkStore::json($summary), 'finished_at' => now()]);
        } catch (\Throwable $error) {
            DB::table('import_runs')->where('id', $runId)->update(['extraction_status' => 'failed', 'semantic_status' => 'not_evaluated', 'network_status' => 'staged', 'error' => substr($error->getMessage(), 0, 2000), 'finished_at' => now()]);
            throw $error;
        }

        return ['id' => $runId, 'sourceRevision' => $revision->id, 'reused' => false];
    }

    private function prepareSafely(string $run): void
    {
        try {
            app(ImportedNetworkStore::class)->prepare($run);
        } catch (\Throwable $error) {
            $summary = json_decode(DB::table('import_runs')->where('id', $run)->value('summary') ?? '{}', true, flags: JSON_THROW_ON_ERROR);
            $summary['proposal'] = ['ready' => false, 'blockers' => ['Source interpretation did not pass. Previous network remains unchanged.'], 'warnings' => []];
            DB::table('import_runs')->where('id', $run)->update(['semantic_status' => 'failed', 'summary' => NetworkStore::json($summary), 'error' => substr($error->getMessage(), 0, 2000)]);
        }
    }

    private function run(array $arguments): void
    {
        $result = Process::path(dirname(base_path()))->env(['PYTHONUTF8' => '1', 'PYTHONIOENCODING' => 'utf-8'])->timeout(config('fiber_atlas.timeout_seconds'))->run([config('fiber_atlas.python'), ...$arguments]);
        if (! $result->successful()) {
            throw new RuntimeException('Bounded extraction failed: '.substr($result->errorOutput(), 0, 1200));
        }
    }

    private function validatePackage(string $path): array
    {
        if (filesize($path) > config('fiber_atlas.max_upload_bytes')) {
            abort(422, 'Source package exceeds the upload limit.');
        }
        $zip = new ZipArchive;
        if ($zip->open($path) !== true) {
            abort(422, 'Invalid VSDX ZIP package.');
        }
        try {
            if ($zip->numFiles > 4096) {
                abort(422, 'Too many package entries.');
            }
            foreach (['[Content_Types].xml', 'visio/document.xml', 'visio/pages/pages.xml'] as $required) {
                if ($zip->locateName($required) === false) {
                    abort(422, 'Incomplete VSDX package.');
                }
            }
            $total = 0;
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $info = $zip->statIndex($i);
                $name = str_replace('\\', '/', $info['name']);
                $total += $info['size'];
                if (str_starts_with($name, '/') || preg_match('/(^|\/)\.\.(\/|$)|^[A-Za-z]:/', $name) || ($info['encryption_method'] ?? 0) !== 0) {
                    abort(422, 'VSDX contains an unsafe path or encrypted entry.');
                }
                if ($info['size'] > config('fiber_atlas.max_entry_bytes')) {
                    abort(422, 'VSDX internal file exceeds the '.(config('fiber_atlas.max_entry_bytes') / 1024 / 1024).' MiB staging limit: '.$name.'.');
                }
                if ($total > config('fiber_atlas.max_uncompressed_bytes')) {
                    abort(422, 'Expanded VSDX package exceeds the '.(config('fiber_atlas.max_uncompressed_bytes') / 1024 / 1024).' MiB staging limit.');
                }
            }

            return ['uncompressedBytes' => $total, 'entries' => $zip->numFiles, 'inventoryOnly' => $total > config('fiber_atlas.full_extraction_max_bytes')];
        } finally {
            $zip->close();
        }
    }
}
