<?php

namespace App\Services;

use App\Support\DatabaseScope;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

final class ImportedNetworkStore
{
    public function prepare(string $runId): array
    {
        DatabaseScope::assertWritable();
        $storage = Storage::disk('local');
        $run = DB::table('import_runs')->where('id', $runId)->first();
        $source = DB::table('source_revisions')->where('id', $run->source_revision)->first();
        $directory = 'imports/'.$runId;
        $root = dirname(base_path());
        $summary = json_decode($run->summary, true, flags: JSON_THROW_ON_ERROR);
        if (($summary['extractionScope'] ?? null) === 'geometry_processing') {
            $summary['proposal'] = ['ready' => false, 'blockers' => ['Geometry evidence is available, but the source-specific topology interpreter has not evaluated it.'], 'warnings' => []];
            DB::table('import_runs')->where('id', $runId)->update(['semantic_status' => 'not_evaluated', 'summary' => NetworkStore::json($summary)]);

            return $summary['proposal'];
        }
        if (($summary['extractionScope'] ?? null) === 'package_inventory') {
            $summary['proposal'] = ['ready' => false, 'blockers' => ['The large drawing is stored as a source inventory. Geometry and Fiber topology require source-specific interpretation before it can be added to the network.'], 'warnings' => []];
            DB::table('import_runs')->where('id', $runId)->update(['semantic_status' => 'unsupported', 'summary' => NetworkStore::json($summary)]);

            return $summary['proposal'];
        }
        $geometry = ($summary['extractionScope'] ?? null) === 'geometry_evidence';
        $input = $storage->path($run->artifact_path);
        $this->process([config('fiber_atlas.python'), $root.'/scripts/'.($geometry ? 'interpret-shida-upload.py' : 'interpret-upload.py'), $geometry ? dirname($input) : $input, $storage->path($directory.'/semantic.json')]);
        $semantic = json_decode($storage->get($directory.'/semantic.json'), true, flags: JSON_THROW_ON_ERROR);
        if (($semantic['source']['sha256'] ?? null) !== $source->sha256) {
            throw new RuntimeException('Semantic source checksum does not match the recorded source revision.');
        }
        $summary = json_decode($run->summary, true, flags: JSON_THROW_ON_ERROR);
        if ($semantic['blockers']) {
            $summary['proposal'] = ['ready' => false, 'blockers' => $semantic['blockers'], 'warnings' => $semantic['warnings']];
            DB::table('import_runs')->where('id', $runId)->update(['semantic_status' => 'unsupported', 'summary' => NetworkStore::json($summary)]);

            return $summary['proposal'];
        }
        $expected = DB::table('active_network_state')->where('id', 1)->value('network_revision');
        $sources = [];
        if ($expected) {
            $linked = DB::table('network_sources')->join('source_revisions', 'source_revisions.id', '=', 'network_sources.source_revision')->where('network_revision', $expected)->get(['source_revisions.*']);
            foreach ($linked as $prior) {
                if ($prior->document_id === $source->document_id) {
                    continue;
                }
                $accepted = DB::table('import_runs')->where('source_revision', $prior->id)->where('network_status', 'applied')->orderByDesc('created_at')->first();
                if (! $accepted) {
                    throw new RuntimeException('Active source has no accepted fresh import; historical baseline cannot enter this pipeline.');
                }
                $sources[$prior->document_id] = ['source' => $prior, 'run' => $accepted];
            }
        }
        $sources[$source->document_id] = ['source' => $source, 'run' => $run];
        uasort($sources, function ($a, $b) use ($storage) {
            $family = function ($item) use ($storage) {
                return json_decode($storage->get('imports/'.$item['run']->id.'/semantic.json'), true, flags: JSON_THROW_ON_ERROR)['family'];
            };

            $rank = ['tsageri-lentekhi' => 0, 'tsageri-alpana-tvishi' => 1, 'shida-kartli' => 2];

            return ($rank[$family($a)] ?? 1) <=> ($rank[$family($b)] ?? 1);
        });
        $authority = null;
        $index = 0;
        $final = null;
        foreach ($sources as $item) {
            $index++;
            $revision = $item['source'];
            $inputRun = $item['run'];
            $manifest = ['documentId' => $revision->document_id, 'sourceRevision' => $revision->id, 'runId' => $inputRun->id, 'originalName' => $revision->original_name, 'expectedRevision' => $expected, 'priorAuthority' => $authority];
            $manifestPath = $storage->path($directory.'/compile-'.$index.'.json');
            file_put_contents($manifestPath, NetworkStore::json($manifest));
            $output = $storage->path($directory.'/candidate-'.$index.'.json');
            $this->process([config('fiber_atlas.node'), '--import', 'tsx', $root.'/scripts/compile-upload.ts', $storage->path('imports/'.$inputRun->id.'/semantic.json'), $storage->path($inputRun->artifact_path), $manifestPath, $output]);
            $final = json_decode(file_get_contents($output), true, flags: JSON_THROW_ON_ERROR);
            $authority = $storage->path($directory.'/authority-'.$index.'.json');
            file_put_contents($authority, NetworkStore::json($final['authority']));
        }
        if ($expected && DB::table('domain_records')->where('network_revision', $expected)->where('collection', 'operatorPortCorrections')->exists()) {
            $final = app(PortCorrectionStore::class)->prepareImportReconciliation($final, $expected, $runId, $directory.'/candidate-'.$index.'.json');
        }
        $reconciliation = $final['portCorrectionReconciliation'] ?? null;
        $blocked = $reconciliation['requiresDecision'] ?? false;
        $summary['proposal'] = ['ready' => ! $blocked, 'expectedNetworkRevision' => $expected, 'networkRevision' => $final['networkRevision'], 'counts' => $final['counts'], 'warnings' => array_values(array_unique([...$semantic['warnings'], ...$final['warnings']])), 'blockers' => $blocked ? ['Fresh source disagrees with a human Port correction. Review all impacts and explicitly reconcile before Add.'] : [], 'partialFibers' => $final['authority']['fiberPathProjection']['counts']['partial'], 'sourceOnly' => true, 'acceptedSources' => count($sources), 'artifact' => 'candidate-'.$index.'.json'];
        if ($reconciliation) {
            $summary['proposal']['portCorrectionReconciliation'] = $reconciliation;
            $summary['proposal']['portCorrectionImpactSha256'] = hash_file('sha256', $storage->path($directory.'/correction-import-impact.json'));
        }
        $summary['proposal']['artifactSha256'] = hash_file('sha256', $output);
        $reviewIndex = app(ReviewInboxStore::class)->candidateIndex($final['authority'], $final['networkRevision']);
        $reviewText = NetworkStore::json($reviewIndex);
        if (strlen($reviewText) > ReviewInboxStore::MAX_INDEX_BYTES) {
            throw new RuntimeException('Bounded review index exceeds its limit.');
        }
        $storage->put($directory.'/review-index.json', $reviewText);
        $summary['proposal']['reviewIndexSha256'] = hash('sha256', $reviewText);
        $summary['proposal']['sourceReviewItems'] = count(array_filter($reviewIndex['cases'], fn ($c) => $c['sourceRevision'] === $source->id));
        $summary['proposal']['sourceConflicts'] = count(array_filter($reviewIndex['cases'], fn ($c) => $c['sourceRevision'] === $source->id && $c['category'] === 'source_conflict'));
        $summary['proposal']['reviewItems'] = count($final['authority']['sourceReviewCases']);
        $summary['proposal']['conflicts'] = count($final['authority']['sourceConflicts']);
        $summary['proposal']['coverage'] = $semantic['coverage'] ?? null;
        $summary['topologyProjected'] = true;
        $summary['interpretationStatus'] = 'validated source-local proposal; partial coverage; not activated';
        $summary['resources']['semantic'] = $semantic['resources'] ?? null;
        $before = $expected ? DB::table('cable_segments')->where('network_revision', $expected)->count() : 0;
        $summary['proposal']['changes'] = ['previousSegments' => $before, 'proposedSegments' => $final['counts']['cable_segments'], 'netAddedSegments' => $final['counts']['cable_segments'] - $before];
        DB::table('import_runs')->where('id', $runId)->update(['semantic_status' => 'validated', 'summary' => NetworkStore::json($summary), 'warnings' => NetworkStore::json($summary['proposal']['warnings'])]);

        return $summary['proposal'];
    }

    public function apply(string $runId, ?string $expected, int $actor, ?string $expectedCandidateSha = null): array
    {
        DatabaseScope::assertWritable();

        return DB::transaction(function () use ($runId, $expected, $actor, $expectedCandidateSha) {
            $state = DB::table('active_network_state')->where('id', 1)->lockForUpdate()->first();
            $run = DB::table('import_runs')->where('id', $runId)->lockForUpdate()->first();
            abort_unless($run, 404);
            $proposal = json_decode($run->summary ?? '{}', true, flags: JSON_THROW_ON_ERROR)['proposal'] ?? null;
            if ($run->network_status === 'applied' && $proposal && $state->network_revision === $proposal['networkRevision']) {
                return ['networkRevision' => $state->network_revision, 'reused' => true];
            }
            if (isset($proposal['portCorrectionReconciliation'])) {
                abort_unless($expectedCandidateSha && hash_equals($proposal['artifactSha256'], $expectedCandidateSha), 409, 'The compared source candidate changed.');
            }
            $latest = DB::table('import_runs')->where('source_revision', $run->source_revision)->where('semantic_status', 'validated')->where('extraction_status', 'completed')->orderByDesc('created_at')->value('id');
            abort_unless(! $latest || $latest === $runId, 409, 'A newer validated interpretation exists for this source. Use its proposal.');
            abort_unless($state->network_revision === $expected, 409, 'Active network changed. Reprocess this upload against the current network.');
            abort_unless($run->semantic_status === 'validated' && ($proposal['ready'] ?? false), 422, 'This source has not passed semantic validation.');
            abort_unless($proposal['expectedNetworkRevision'] === $expected, 409, 'Candidate is based on another network revision.');
            abort_unless(preg_match('/^(?:candidate-\d+|reconciled-[a-f0-9-]{36})\.json$/D', $proposal['artifact']), 422);
            $text = Storage::disk('local')->get('imports/'.$runId.'/'.$proposal['artifact']);
            abort_unless(hash('sha256', $text) === ($proposal['artifactSha256'] ?? null), 409, 'Candidate artifact integrity failed.');
            $candidate = json_decode($text, true, flags: JSON_THROW_ON_ERROR);
            abort_unless($candidate['networkRevision'] === $proposal['networkRevision'] && $candidate['expectedRevision'] === $expected, 409);
            $network = app(NetworkStore::class);
            $revision = $network->persistAuthority($candidate['authority'], $candidate['networkRevision'], $candidate['authoritySha256'], NetworkStore::json($candidate['operational']), NetworkStore::json($candidate['details']), ['freshImport' => true, 'pathsCompared' => $candidate['counts']['fibers'], 'counts' => $candidate['counts'], 'importRun' => $runId, 'sourceOnly' => true]);
            $network->activate($revision, $expected, 'owner:'.$actor, 'owner_import');
            DB::table('import_runs')->where('id', $runId)->update(['network_status' => 'applied']);

            return ['networkRevision' => $revision, 'reused' => false];
        });
    }

    private function process(array $arguments): void
    {
        $result = Process::path(dirname(base_path()))->env(['PYTHONUTF8' => '1', 'PYTHONIOENCODING' => 'utf-8'])->timeout(180)->run($arguments);
        if (! $result->successful()) {
            throw new RuntimeException('Fresh semantic interpretation failed: '.substr($result->errorOutput(), 0, 1800));
        }
    }
}
