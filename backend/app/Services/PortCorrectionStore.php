<?php

namespace App\Services;

use App\Support\DatabaseScope;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

final class PortCorrectionStore
{
    public function context(string $subject, string $expected): array
    {
        abort_unless(DB::table('active_network_state')->where('id', 1)->value('network_revision') === $expected, 409, 'Active network changed.');
        $context = app(ReviewInboxStore::class)->context($expected, null, true);
        $case = collect($context['cases'])->firstWhere('id', $subject);
        $bank = str_starts_with($subject, 'AP-BANK:');
        $portIds = $bank ? [substr($subject, 8)] : ($case['case']['affectedIds'] ?? []);
        $row = DB::table('domain_records')->where('network_revision', $expected)->where('collection', 'apPorts')->whereIn('logical_id', $portIds)->first();
        abort_unless($row, 422, 'Canonical Port is missing.');
        $port = json_decode($row->payload, true, flags: JSON_THROW_ON_ERROR);
        if ($bank) {
            $source = $port['source'];
            $documents = collect($context['sources'])->filter(function ($d) use ($source, $port) {
                if (isset($source['sourceRevision'])) {
                    return $source['sourceRevision'] === $d['id'].'/'.$d['sourceSha256'];
                }
                if (isset($source['documentId'])) {
                    return $d['id'] === $source['documentId'] && (! isset($source['sourceSha256']) || $source['sourceSha256'] === $d['sourceSha256']);
                }

                return isset($port['shapeId']) && $port['id'] === 'SHIDA-PORT-'.substr(hash('sha256', $d['id'].'/'.$port['shapeId']), 0, 24);
            });
            abort_unless($documents->count() === 1, 422, 'Exact bank source is missing or ambiguous.');
            $document = $documents->first();
            $sourceRevision = $document['id'].'/'.$document['sourceSha256'];
            $source = [...$source, 'documentId' => $document['id'], 'sourceRevision' => $sourceRevision, 'sourceSha256' => $document['sourceSha256'], 'importRunId' => $source['importRunId'] ?? $document['interpretationRunId'] ?? $document['source']['importRunId'] ?? null];
            $case = ['id' => $subject, 'category' => 'fiber_port_binding_ambiguous', 'sourceRevision' => $sourceRevision, 'object' => $this->assetLabel($port['canonicalNode'], $expected).' · AP Port bank', 'case' => ['source' => $source, 'affectedIds' => [$port['id']]]];
        }
        abort_unless($case && $case['category'] === 'fiber_port_binding_ambiguous' && $case['sourceRevision'], 422, 'Only an exact active Port-binding context supports this correction.');
        $samePorts = DB::table('domain_records')->where('network_revision', $expected)->where('collection', 'apPorts')->whereRaw("payload->'canonicalNode'->>'id'=? AND payload->'canonicalNode'->>'kind'=? AND (payload->>'number')::int=?", [$port['canonicalNode']['id'], $port['canonicalNode']['kind'], $port['number']])->count();
        abort_unless($samePorts === 1, 422, 'Physical Port identity is ambiguous.');
        $version = DB::table('review_subject_versions')->where('network_revision', $expected)->where('subject_id', $subject)->value('version') ?? 0;

        return ['case' => $case, 'port' => $port, 'reviewVersion' => (int) $version, 'revision' => $expected];
    }

    private function fresh(string $subject, string $revision, int $version): array
    {
        $state = DB::table('active_network_state')->where('id', 1)->lockForUpdate()->first();
        abort_unless($state->network_revision === $revision, 409, 'Active network changed.');
        DB::table('review_subject_versions')->insertOrIgnore(['network_revision' => $revision, 'subject_id' => $subject, 'version' => 0]);
        $row = DB::table('review_subject_versions')->where('network_revision', $revision)->where('subject_id', $subject)->lockForUpdate()->first();
        abort_unless((int) $row->version === $version, 409, 'Review changed. Refresh before continuing.');

        return $this->context($subject, $revision);
    }

    private function event(string $revision, string $subject, int $version, int $actor, array $correction, string $action = 'unresolved'): array
    {
        $event = ['id' => (string) Str::uuid(), 'network_revision' => $revision, 'subject_id' => $subject, 'version' => $version + 1, 'actor_id' => $actor, 'action' => $action, 'reason' => $correction['input']['reason'], 'correction' => NetworkStore::json($correction), 'source_revision' => $correction['input']['sourceRevision'], 'created_at' => now()];
        DB::table('review_events')->insert($event);
        DB::table('review_subject_versions')->where('network_revision', $revision)->where('subject_id', $subject)->update(['version' => $version + 1]);

        return $event;
    }

    private function assetLabel(array $node, string $revision): string
    {
        if ($node['kind'] === 'network_node') {
            $payload = DB::table('domain_records')->where('network_revision', $revision)->where('collection', 'networkNodes')->where('logical_id', $node['id'])->value('payload');

            return $payload ? (json_decode($payload, true)['displayName'] ?? $node['id']) : $node['id'];
        }

        return match ($node['kind']) {
            'closure' => 'SC', 'ap' => 'AP', 'aggregation' => 'AGG', 'odf' => 'ODF', default => ''
        }.$node['id'];
    }

    public function options(string $subject, string $revision): array
    {
        $context = $this->context($subject, $revision);
        $node = $context['port']['canonicalNode'];
        $key = $node['kind'].':'.$node['id'];
        $cables = DB::table('cable_segments')->where('network_revision', $revision)->where(fn ($q) => $q->where('endpoint_a', $key)->orWhere('endpoint_b', $key))->limit(257)->get(['id', 'payload']);
        abort_if($cables->count() > 256, 422, 'Incident inventory exceeds this correction builder limit.');
        $localFibers = DB::table('fibers')->where('network_revision', $revision)->whereIn('cable_id', $cables->pluck('id'))->count();
        abort_if($localFibers > 4096, 422, 'Local inventory exceeds the supported correction selector bound.');
        $history = DB::table('domain_records')->where('network_revision', $revision)->where('collection', 'operatorPortCorrections')->whereRaw("payload->>'portId'=?", [$context['port']['id']])->orderBy('ordinal')->pluck('payload')->map(fn ($p) => json_decode($p, true))->all();
        $events = DB::table('review_events')->where('network_revision', $revision)->where('subject_id', $subject)->whereRaw("correction->>'type'='port_binding' AND correction->>'draftId' IS NOT NULL")->orderByDesc('version')->limit(20)->get(['id', 'version', 'correction'])->map(fn ($e) => ['eventId' => $e->id, 'version' => $e->version, ...json_decode($e->correction, true)])->all();

        $ports = DB::table('domain_records')->where('network_revision', $revision)->where('collection', 'apPorts')->whereRaw("payload->'canonicalNode'->>'id'=? AND payload->'canonicalNode'->>'kind'=?", [$node['id'], $node['kind']])->limit(257)->pluck('payload')->map(fn ($p) => json_decode($p, true))->all();
        abort_if(count($ports) > 256, 422, 'Port bank exceeds the supported bound.');
        $bindings = DB::table('port_topology_bindings')->where('network_revision', $revision)->whereRaw("payload->>'ownerType'='ap' AND payload->>'ownerId'=?", [$node['id']])->pluck('payload')->map(fn ($p) => json_decode($p, true))->all();

        return ['context' => $context, 'bankPorts' => $ports, 'bankBindings' => $bindings, 'cables' => $cables->map(function ($c) use ($revision) {
            $cable = json_decode($c->payload, true);

            return ['id' => $c->id, 'displayName' => $this->assetLabel($cable['endpointA'], $revision).' ↔ '.$this->assetLabel($cable['endpointB'], $revision).' · '.$cable['fiberCount'].'F', 'endpointA' => $cable['endpointA'], 'endpointB' => $cable['endpointB'], 'fiberCount' => $cable['fiberCount'], 'labels' => $cable['legacyLabels'], 'fibers' => DB::table('fibers')->where('network_revision', $revision)->where('cable_id', $c->id)->orderBy('number')->get(['number', 'payload'])->map(fn ($f) => ['number' => $f->number, 'color' => json_decode($f->payload, true)['physicalColor']])->all()];
        })->all(), 'history' => $history, 'events' => $events];
    }

    public function draft(array $input, int $actor): array
    {
        DatabaseScope::assertWritable();

        return DB::transaction(function () use ($input, $actor) {
            $context = $this->fresh($input['subjectId'], $input['expectedNetworkRevision'], $input['expectedReviewVersion']);
            abort_unless($input['portId'] === $context['port']['id'] && $input['sourceRevision'] === $context['case']['sourceRevision'], 422, 'Port/source scope mismatch.');
            $source = $context['case']['case']['source'];
            $doc = collect(app(ReviewInboxStore::class)->context($context['revision'], null, true)['sources'])->first(fn ($d) => $input['sourceRevision'] === $d['id'].'/'.$d['sourceSha256']);
            $run = $source['importRunId'] ?? $doc['interpretationRunId'] ?? null;
            abort_unless($run && DB::table('import_runs')->where('id', $run)->where('source_revision', $input['sourceRevision'])->where('extraction_status', 'completed')->exists(), 409, 'Exact evidence run is unavailable.');
            $ids = array_values(array_unique($input['evidenceShapeIds']));
            $count = DB::table('source_shapes')->where('import_run', $run)->where('source_revision', $input['sourceRevision'])->where('page_id', $source['pageId'] ?? '0')->whereIn('shape_id', $ids)->count();
            abort_unless($count === count($ids), 422, 'Evidence must exist in this exact source/run/page.');
            if (in_array($input['operation'] ?? 'set', ['set', 'remap'], true)) {
                $node = $context['port']['canonicalNode'];
                $key = $node['kind'].':'.$node['id'];
                abort_unless(DB::table('cable_segments')->where('network_revision', $context['revision'])->where('id', $input['segmentId'])->where(fn ($q) => $q->where('endpoint_a', $key)->orWhere('endpoint_b', $key))->exists(), 422, 'Cable is not incident to the Port node.');
                if ($input['operation'] === 'set') {
                    abort_unless(DB::table('fibers')->where('network_revision', $context['revision'])->where('cable_id', $input['segmentId'])->where('number', $input['fiberNumber'])->exists(), 422, 'Fiber does not exist in this Cable.');
                }
                abort_if($input['operation'] === 'remap' && $input['evidenceBasis'] !== 'owner_confirmation', 422, 'Bank Remap requires owner confirmation.');
                $cable = json_decode(DB::table('cable_segments')->where('network_revision', $context['revision'])->where('id', $input['segmentId'])->value('payload'), true);
                $cableSource = $cable['source'];
                $scopeMatches = isset($cableSource['sourceRevision']) ? $cableSource['sourceRevision'] === $input['sourceRevision'] : (isset($cableSource['documentId']) ? $cableSource['documentId'] === $doc['id'] && (! isset($cableSource['sourceSha256']) || $cableSource['sourceSha256'] === $doc['sourceSha256']) : in_array($cable['id'], $doc['importedAssetIds'], true) || in_array('segment:'.$cable['id'], $doc['importedAssetIds'], true));
                abort_unless($scopeMatches, 422, 'Cross-source binding needs a separately scoped correction type.');
            }
            $id = (string) Str::uuid();
            $typed = ['id' => $id, 'subjectId' => $input['subjectId'], 'sourceRevision' => $input['sourceRevision'], 'portId' => $input['portId'], 'actorId' => $actor, 'operation' => $input['operation'] ?? 'set', 'reason' => $input['reason'], 'evidenceBasis' => $input['evidenceBasis'], 'evidence' => [...$source, 'importRunId' => $run, 'sourceRevision' => $input['sourceRevision'], 'shapeIds' => $ids]];
            foreach (['segmentId', 'fiberNumber', 'reverts'] as $key) {
                if (isset($input[$key])) {
                    $typed[$key] = $input[$key];
                }
            }
            $old = DB::table('port_topology_bindings')->where('network_revision', $context['revision'])->whereRaw("payload->>'ownerType'='ap' AND payload->>'ownerId'=? AND (payload->>'portNumber')::int=?", [$context['port']['canonicalNode']['id'], $context['port']['number']])->pluck('payload')->map(fn ($p) => json_decode($p, true))->all();
            abort_if(count($old) > 1, 422, 'Ambiguous existing bindings require another operation.');
            $affectedVersions = [];
            if ($input['operation'] === 'remap' || $input['operation'] === 'revert') {
                $bank = $this->options($input['subjectId'], $context['revision']);
                $portIds = array_column($bank['bankPorts'], 'id');
                foreach (app(ReviewInboxStore::class)->context($context['revision'], null, true)['cases'] as $case) {
                    if ($case['id'] !== $input['subjectId'] && $case['category'] === 'fiber_port_binding_ambiguous' && $case['sourceRevision'] === $input['sourceRevision'] && array_intersect($portIds, $case['case']['affectedIds'])) {
                        $affectedVersions[$case['id']] = (int) (DB::table('review_subject_versions')->where('network_revision', $context['revision'])->where('subject_id', $case['id'])->value('version') ?? 0);
                    }
                }
                $this->freshAffected($context['revision'], $affectedVersions);
            }
            $event = $this->event($context['revision'], $input['subjectId'], $input['expectedReviewVersion'], $actor, ['type' => 'port_binding', 'stage' => 'draft', 'draftId' => $id, 'baseNetworkRevision' => $context['revision'], 'oldBinding' => $old[0] ?? null, 'input' => $typed, 'affectedVersions' => $affectedVersions, 'applied' => false, 'fieldVerified' => false]);

            return ['draftId' => $id, 'reviewVersion' => $event['version'], 'stage' => 'draft'];
        });
    }

    public function latest(string $id): array
    {
        $row = DB::table('review_events')->whereRaw("correction->>'type'='port_binding' AND correction->>'draftId'=?", [$id])->orderByDesc('created_at')->orderByDesc('version')->first();
        abort_unless($row, 404, 'Correction draft is missing.');

        return [...json_decode($row->correction, true, flags: JSON_THROW_ON_ERROR), 'eventVersion' => (int) $row->version, 'baseRevision' => $row->network_revision];
    }

    private function freshAffected(string $revision, array $versions): void
    {
        ksort($versions);
        foreach ($versions as $subject => $version) {
            DB::table('review_subject_versions')->insertOrIgnore(['network_revision' => $revision, 'subject_id' => $subject, 'version' => 0]);
            $current = DB::table('review_subject_versions')->where('network_revision', $revision)->where('subject_id', $subject)->lockForUpdate()->value('version');
            abort_unless((int) $current === $version, 409, 'Another Port review in this bank changed. Refresh the Remap draft.');
        }
    }

    public function validateDraft(string $id, string $revision, int $version, int $actor): array
    {
        DatabaseScope::assertWritable();
        $draft = $this->latest($id);
        abort_unless($draft['stage'] === 'draft' && $draft['baseRevision'] === $revision && $draft['eventVersion'] === $version, 409, 'Draft is stale or already validated.');
        DB::transaction(function () use ($draft, $revision, $version) {
            $this->fresh($draft['input']['subjectId'], $revision, $version);
            $this->freshAffected($revision, $draft['affectedVersions'] ?? []);
        });
        $storage = Storage::disk('local');
        $directory = 'corrections/'.$id.'/'.Str::uuid();
        $manifest = ['expectedRevision' => $revision, 'correction' => $draft['input'], 'operational' => json_decode(app(NetworkStore::class)->projection($revision, 'operational'), true), 'details' => json_decode(app(NetworkStore::class)->projection($revision, 'details'), true)];
        $storage->put($directory.'/input.json', NetworkStore::json($manifest));
        $result = Process::path(dirname(base_path()))->timeout(240)->run([config('fiber_atlas.node'), '--import', 'tsx', dirname(base_path()).'/scripts/compile-port-correction.ts', $storage->path($directory.'/input.json'), $storage->path($directory.'/candidate.json')]);
        if (! $result->successful()) {
            $errorPath = $directory.'/candidate.json.validation-error.json';
            $failure = $storage->exists($errorPath) && $storage->size($errorPath) <= 131072 ? json_decode($storage->get($errorPath), true) : null;
            if (! is_array($failure) || ! is_string($failure['message'] ?? null)) {
                $failure = ['code' => 'validator_unavailable', 'message' => 'ვალიდაცია ვერ დასრულდა. ხელახლა სცადეთ; თუ განმეორდა, საჭიროა ვალიდატორის შემოწმება.'];
            }
            abort(response()->json(['message' => $failure['message'], 'validation' => $failure, 'networkChanged' => false], 422));
        }
        $candidate = json_decode($storage->get($directory.'/candidate.json'), true, flags: JSON_THROW_ON_ERROR);
        $storage->put($directory.'/impact.json', NetworkStore::json($candidate['impact']));
        $correction = [...$draft, 'stage' => 'validated', 'artifact' => $directory.'/candidate.json', 'artifactSha256' => hash_file('sha256', $storage->path($directory.'/candidate.json')), 'impactArtifact' => $directory.'/impact.json', 'impactSha256' => hash_file('sha256', $storage->path($directory.'/impact.json')), 'candidateRevision' => $candidate['networkRevision'], 'impactCounts' => $candidate['impact']['counts']];
        unset($correction['eventVersion'], $correction['baseRevision']);

        return DB::transaction(function () use ($correction, $revision, $version, $actor) {
            $this->fresh($correction['input']['subjectId'], $revision, $version);
            $this->freshAffected($revision, $correction['affectedVersions'] ?? []);
            $event = $this->event($revision, $correction['input']['subjectId'], $version, $actor, $correction);

            return ['draftId' => $correction['draftId'], 'reviewVersion' => $event['version'], 'stage' => 'validated', 'candidateRevision' => $correction['candidateRevision'], 'candidateSha256' => $correction['artifactSha256'], 'counts' => $correction['impactCounts']];
        });
    }

    public function preview(string $id, string $facet, int $page): array
    {
        $draft = $this->latest($id);
        abort_unless(in_array($draft['stage'], ['validated', 'applied'], true), 409, 'Validate the draft before preview.');
        $text = Storage::disk('local')->get($draft['impactArtifact']);
        abort_unless(hash('sha256', $text) === $draft['impactSha256'], 409, 'Impact artifact integrity failed.');
        $impact = json_decode($text, true, flags: JSON_THROW_ON_ERROR);
        $rows = $impact[$facet];

        return ['draftId' => $id, 'stage' => $draft['stage'], 'candidateRevision' => $draft['candidateRevision'], 'candidateSha256' => $draft['artifactSha256'], 'reviewVersion' => $draft['eventVersion'], 'baseRevision' => $draft['baseNetworkRevision'] ?? $draft['baseRevision'], 'input' => $draft['input'], 'counts' => $impact['counts'], 'bankRows' => $impact['bankRows'] ?? [], 'facet' => $facet, 'page' => $page, 'pages' => max(1, (int) ceil(count($rows) / 20)), 'rows' => array_slice($rows, ($page - 1) * 20, 20), 'fieldVerified' => false];
    }

    public function apply(string $id, string $expected, int $version, string $sha, int $actor): array
    {
        DatabaseScope::assertWritable();

        return DB::transaction(function () use ($id, $expected, $version, $sha, $actor) {
            $draft = $this->latest($id);
            abort_unless($draft['stage'] === 'validated' && $draft['baseRevision'] === $expected && $draft['eventVersion'] === $version && hash_equals($draft['artifactSha256'], $sha), 409, 'Candidate/preview is stale or mismatched.');
            $this->fresh($draft['input']['subjectId'], $expected, $version);
            $this->freshAffected($expected, $draft['affectedVersions'] ?? []);
            $text = Storage::disk('local')->get($draft['artifact']);
            abort_unless(hash('sha256', $text) === $sha, 409, 'Candidate artifact integrity failed.');
            $candidate = json_decode($text, true, flags: JSON_THROW_ON_ERROR);
            abort_unless($candidate['expectedRevision'] === $expected && $candidate['networkRevision'] === $draft['candidateRevision'], 409);
            $store = app(NetworkStore::class);
            $revision = $store->persistAuthority($candidate['authority'], $candidate['networkRevision'], $candidate['authoritySha256'], NetworkStore::json($candidate['operational']), NetworkStore::json($candidate['details']), ['freshImport' => true, 'operatorCorrection' => $id, 'pathsCompared' => $candidate['counts']['fibers'], 'counts' => $candidate['counts']]);
            DB::table('review_subject_versions')->insertUsing(['network_revision', 'subject_id', 'version'], DB::table('review_subject_versions')->where('network_revision', $expected)->selectRaw('? as network_revision, subject_id, version', [$revision]));
            $store->activate($revision, $expected, 'owner:'.$actor, 'port_binding_correction');
            $records = collect($candidate['authority']['operatorPortCorrections'])->filter(fn ($c) => $c['networkRevision'] === $revision);
            $applied = $records->firstWhere('portId', $draft['input']['portId']);
            $this->event($revision, $draft['input']['subjectId'], $version, $actor, [...$draft, 'stage' => 'applied', 'applied' => true, 'appliedRevision' => $revision, 'newBinding' => $applied['newBinding']], 'corrected');
            foreach ($draft['affectedVersions'] ?? [] as $subject => $subjectVersion) {
                $member = $records->first(fn ($c) => $c['subjectId'] === $subject || in_array($subject, $c['affectedSubjectIds'] ?? [], true));
                if ($member) {
                    $this->event($revision, $subject, $subjectVersion, $actor, [...$draft, 'draftId' => null, 'groupDraftId' => $id, 'oldBinding' => $member['oldBinding'], 'input' => [...$draft['input'], 'subjectId' => $subject, 'portId' => $member['portId']], 'stage' => 'applied', 'applied' => true, 'appliedRevision' => $revision, 'newBinding' => $member['newBinding']], 'corrected');
                }
            }

            return ['draftId' => $id, 'networkRevision' => $revision, 'stage' => 'applied', 'fieldVerified' => false];
        });
    }

    public function prepareImportReconciliation(array $candidate, string $expected, string $run, string $path, ?array $decision = null): array
    {
        $storage = Storage::disk('local');
        $directory = dirname($path);
        $storage->put($directory.'/correction-previous.json', app(NetworkStore::class)->projection($expected, 'operational'));
        $storage->put($path, NetworkStore::json($candidate));
        $arguments = [config('fiber_atlas.node'), '--import', 'tsx', dirname(base_path()).'/scripts/reconcile-import-corrections.ts', $storage->path($directory.'/correction-previous.json'), $storage->path($path), $storage->path($directory.'/correction-import-impact.json'), $run];
        if ($decision) {
            $storage->put($directory.'/correction-import-decision.json', NetworkStore::json($decision));
            $arguments[] = $storage->path($directory.'/correction-import-decision.json');
        }
        $result = Process::path(dirname(base_path()))->timeout(240)->run($arguments);
        abort_unless($result->successful(), 422, 'Human correction reconciliation failed: '.substr($result->errorOutput(), 0, 1200));

        return json_decode($storage->get($path), true, flags: JSON_THROW_ON_ERROR);
    }

    public function importPreview(string $run, string $facet, int $page): array
    {
        $row = DB::table('import_runs')->where('id', $run)->first();
        abort_unless($row, 404);
        $proposal = json_decode($row->summary, true)['proposal'] ?? [];
        abort_unless(isset($proposal['portCorrectionReconciliation']), 404);
        $artifact = $proposal['portCorrectionImpactArtifact'] ?? 'correction-import-impact.json';
        abort_unless(preg_match('/^correction-import-impact(?:-[a-f0-9-]{36})?\.json$/D', $artifact), 409);
        $text = Storage::disk('local')->get('imports/'.$run.'/'.$artifact);
        abort_unless(hash('sha256', $text) === $proposal['portCorrectionImpactSha256'], 409, 'Impact digest changed.');
        $impact = json_decode($text, true);

        return ['runId' => $run, 'expectedNetworkRevision' => $proposal['expectedNetworkRevision'], 'candidateSha256' => $proposal['artifactSha256'], 'reconciliation' => $proposal['portCorrectionReconciliation'], 'facet' => $facet, 'page' => $page, 'pages' => max(1, (int) ceil(count($impact[$facet]) / 20)), 'rows' => array_slice($impact[$facet], ($page - 1) * 20, 20), 'counts' => $impact['counts']];
    }

    public function acceptImportedSource(string $run, array $input, int $actor): array
    {
        DatabaseScope::assertWritable();
        $row = DB::table('import_runs')->where('id', $run)->first();
        abort_unless($row && $row->semantic_status === 'validated' && $row->network_status !== 'applied', 409);
        $summary = json_decode($row->summary, true);
        $proposal = $summary['proposal'];
        abort_unless(isset($proposal['portCorrectionReconciliation']) && $proposal['expectedNetworkRevision'] === $input['expectedNetworkRevision'] && hash_equals($proposal['artifactSha256'], $input['candidateSha256']), 409, 'Import comparison is stale.');
        $text = Storage::disk('local')->get('imports/'.$run.'/'.$proposal['artifact']);
        abort_unless(hash('sha256', $text) === $input['candidateSha256'], 409);
        $directory = 'imports/'.$run.'/reconciliation-'.Str::uuid();
        Storage::disk('local')->makeDirectory($directory);
        $candidate = $this->prepareImportReconciliation(json_decode($text, true), $input['expectedNetworkRevision'], $run, $directory.'/candidate.json', ['draftIds' => $input['draftIds'], 'actorId' => $actor, 'reason' => $input['reason']]);

        return DB::transaction(function () use ($run, $input, $proposal, $candidate, $directory) {
            $state = DB::table('active_network_state')->where('id', 1)->lockForUpdate()->first();
            $row = DB::table('import_runs')->where('id', $run)->lockForUpdate()->first();
            $latest = json_decode($row->summary, true);
            abort_unless($state->network_revision === $input['expectedNetworkRevision'] && ($latest['proposal']['artifactSha256'] ?? null) === $input['candidateSha256'] && $row->network_status !== 'applied', 409);
            $storage = Storage::disk('local');
            $artifact = 'reconciled-'.Str::uuid().'.json';
            $storage->put('imports/'.$run.'/'.$artifact, NetworkStore::json($candidate));
            $impactArtifact = 'correction-import-impact-'.Str::uuid().'.json';
            $storage->put('imports/'.$run.'/'.$impactArtifact, $storage->get($directory.'/correction-import-impact.json'));
            $indexArtifact = 'review-index-'.Str::uuid().'.json';
            $index = NetworkStore::json(app(ReviewInboxStore::class)->candidateIndex($candidate['authority'], $candidate['networkRevision']));
            abort_if(strlen($index) > ReviewInboxStore::MAX_INDEX_BYTES, 422, 'Review index exceeds its bound.');
            $storage->put('imports/'.$run.'/'.$indexArtifact, $index);
            $latest['proposal'] = [...$proposal, 'artifact' => $artifact, 'artifactSha256' => hash_file('sha256', $storage->path('imports/'.$run.'/'.$artifact)), 'networkRevision' => $candidate['networkRevision'], 'portCorrectionReconciliation' => $candidate['portCorrectionReconciliation'], 'portCorrectionImpactArtifact' => $impactArtifact, 'portCorrectionImpactSha256' => hash_file('sha256', $storage->path('imports/'.$run.'/'.$impactArtifact)), 'reviewIndexArtifact' => $indexArtifact, 'reviewIndexSha256' => hash('sha256', $index), 'ready' => true, 'blockers' => []];
            DB::table('import_runs')->where('id', $run)->update(['summary' => NetworkStore::json($latest)]);

            return ['ready' => true, 'networkRevision' => $candidate['networkRevision'], 'applied' => false];
        });
    }
}
