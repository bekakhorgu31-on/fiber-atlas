<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\NetworkStore;
use App\Services\PortCorrectionStore;
use App\Support\DatabaseScope;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

final class PortCorrectionTest extends TestCase
{
    private array $fixture;

    private User $reviewer;

    protected function setUp(): void
    {
        parent::setUp();
        if (DatabaseScope::schema() !== 'fiber_isolation') {
            $this->markTestSkipped('Correction tests require disposable isolation.');
        }
        DatabaseScope::assertDestructiveTestTarget();
        $this->artisan('migrate:fresh', ['--force' => true])->assertExitCode(0);
        $file = Storage::disk('local')->path('port-correction-test-fixture.json');
        $mode = str_contains($this->name(), 'partial_bank') ? 'partial-bank' : (str_contains($this->name(), 'legacy_bank') ? 'legacy-bank' : (str_starts_with($this->name(), 'test_bank') ? 'bank' : 'single'));
        $result = Process::path(dirname(base_path()))->run([config('fiber_atlas.node'), '--import', 'tsx', dirname(base_path()).'/scripts/export-port-correction-fixture.ts', $file, $mode]);
        $this->assertTrue($result->successful(), $result->errorOutput());
        $this->fixture = json_decode(file_get_contents($file), true, flags: JSON_THROW_ON_ERROR);
        $this->reviewer = User::factory()->create(['role' => 'reviewer']);
        $store = app(NetworkStore::class);
        $c = $this->fixture;
        $store->persistAuthority($c['authority'], $c['networkRevision'], $c['authoritySha256'], NetworkStore::json($c['operational']), NetworkStore::json($c['details']), ['freshImport' => true, 'pathsCompared' => $c['counts']['fibers'], 'counts' => $c['counts']]);
        $store->activate($c['networkRevision'], null, 'test-fixture');
        $source = $c['authority']['sourceReviewCases'][0]['source'];
        DB::table('import_runs')->insert(['id' => $source['importRunId'], 'source_revision' => $source['sourceRevision'], 'extractor_version' => 'test', 'interpreter_version' => 'test', 'extraction_status' => 'completed', 'semantic_status' => 'validated', 'network_status' => 'applied', 'warnings' => '[]', 'created_at' => now()]);
        DB::table('source_shapes')->insert(['source_revision' => $source['sourceRevision'], 'import_run' => $source['importRunId'], 'page_id' => '0', 'shape_id' => 'PORT-A-7', 'payload' => NetworkStore::json(['id' => 'PORT-A-7', 'text' => '7', 'geometry' => ['world_bounds' => ['min_x' => 0, 'max_x' => 1, 'min_y' => 0, 'max_y' => 1, 'width' => 1, 'height' => 1], 'global_pin' => ['x' => .5, 'y' => .5]]])]);
    }

    private function input(int $version = 0): array
    {
        $data = $this->fixture['authority'];

        return ['subjectId' => 'TEST-CASE', 'expectedNetworkRevision' => $this->fixture['networkRevision'], 'expectedReviewVersion' => $version, 'sourceRevision' => $data['sourceReviewCases'][0]['source']['sourceRevision'], 'portId' => 'TEST-PORT', 'operation' => 'set', 'segmentId' => collect($data['cables'])->firstWhere('legacyCableId', '25-123')['id'], 'fiberNumber' => 13, 'evidenceBasis' => 'engineer_review', 'evidenceShapeIds' => ['PORT-A-7'], 'reason' => 'Known test connection from exact fixture evidence.'];
    }

    private function validated(): array
    {
        $this->actingAs($this->reviewer);
        $draft = $this->postJson('/api/v1/port-corrections', $this->input())->assertCreated()->json();

        return $this->postJson('/api/v1/port-corrections/'.$draft['draftId'].'/validate', ['expectedNetworkRevision' => $this->fixture['networkRevision'], 'expectedReviewVersion' => $draft['reviewVersion']])->assertOk()->json();
    }

    public function test_exact_draft_preview_apply_refresh_and_reversal_preserve_history(): void
    {
        $candidate = $this->validated();
        $base = $this->fixture['networkRevision'];
        $this->assertSame($base, DB::table('active_network_state')->value('network_revision'));
        $preview = $this->getJson('/api/v1/port-corrections/'.$candidate['draftId'].'/preview')->assertOk()->assertJsonPath('stage', 'validated')->assertJsonPath('fieldVerified', false)->json();
        $this->assertGreaterThanOrEqual(2, $preview['counts']['changedPaths']);
        $this->getJson('/api/v1/port-corrections/'.$candidate['draftId'].'/preview?facet=facts')->assertOk();
        $revision = $this->postJson('/api/v1/port-corrections/'.$candidate['draftId'].'/apply', ['expectedNetworkRevision' => $base, 'expectedReviewVersion' => $candidate['reviewVersion'], 'acknowledgeImpact' => true, 'candidateSha256' => $candidate['candidateSha256']])->assertOk()->json('networkRevision');
        $this->assertNotSame($base, $revision);
        $this->assertSame(2, DB::table('network_revisions')->count());
        $this->getJson('/api/v1/review-inbox/detail?case=TEST-CASE')->assertOk()->assertJsonPath('record.networkFactResolved', true)->assertJsonPath('record.reviewVersion', 3)->assertJsonCount(3, 'events');
        $this->getJson('/api/v1/review-inbox/detail?revision='.$base.'&case=TEST-CASE')->assertOk()->assertJsonPath('record.networkFactResolved', false)->assertJsonCount(2, 'events');
        $this->getJson('/api/v1/port-corrections/options?revision='.$revision.'&subjectId=TEST-CASE')->assertOk()->assertJsonCount(1, 'history');
        $reverse = [...$this->input(3), 'expectedNetworkRevision' => $revision, 'operation' => 'revert', 'reverts' => $candidate['draftId']];
        unset($reverse['segmentId'], $reverse['fiberNumber']);
        $draft = $this->postJson('/api/v1/port-corrections', $reverse)->assertCreated()->json();
        $v = $this->postJson('/api/v1/port-corrections/'.$draft['draftId'].'/validate', ['expectedNetworkRevision' => $revision, 'expectedReviewVersion' => $draft['reviewVersion']])->assertOk()->json();
        $this->postJson('/api/v1/port-corrections/'.$draft['draftId'].'/apply', ['expectedNetworkRevision' => $revision, 'expectedReviewVersion' => $v['reviewVersion'], 'acknowledgeImpact' => true, 'candidateSha256' => $v['candidateSha256']])->assertOk();
        $this->getJson('/api/v1/review-inbox/detail?case=TEST-CASE')->assertOk()->assertJsonPath('record.networkFactResolved', false)->assertJsonCount(6, 'events');
        $this->assertSame('7', json_decode(DB::table('source_shapes')->value('payload'), true)['text']);
        $this->assertSame(3, DB::table('network_revisions')->count());
    }

    public function test_authentication_scope_range_evidence_and_conflicts_are_refused(): void
    {
        $this->postJson('/api/v1/port-corrections', $this->input())->assertUnauthorized();
        $this->actingAs(User::factory()->create(['role' => 'viewer']))->postJson('/api/v1/port-corrections', $this->input())->assertForbidden();
        $this->actingAs($this->reviewer);
        foreach ([['portId' => 'OTHER-PORT'], ['fiberNumber' => 999], ['segmentId' => 'OTHER-CABLE'], ['sourceRevision' => 'OTHER-SOURCE'], ['evidenceShapeIds' => ['MISSING']]] as $patch) {
            $this->postJson('/api/v1/port-corrections', [...$this->input(), ...$patch])->assertUnprocessable();
        }
        $draft = $this->postJson('/api/v1/port-corrections', [...$this->input(), 'fiberNumber' => 1])->assertCreated()->json();
        $this->postJson('/api/v1/port-corrections/'.$draft['draftId'].'/validate', ['expectedNetworkRevision' => $this->fixture['networkRevision'], 'expectedReviewVersion' => $draft['reviewVersion']])->assertUnprocessable()->assertJsonPath('validation.code', 'fiber_endpoint_occupied')->assertJsonPath('validation.conflicts.0.portNumber', 1)->assertJsonPath('validation.selected.fiberNumber', 1)->assertJsonPath('networkChanged', false);
        $this->assertSame(1, DB::table('network_revisions')->count());
        $this->postJson('/api/v1/review-events', [...$this->input(1), 'action' => 'corrected', 'correction' => ['type' => 'port_binding', 'stage' => 'applied']])->assertUnprocessable();
    }

    public function test_stale_review_candidate_and_digest_cannot_activate(): void
    {
        $candidate = $this->validated();
        $apply = ['expectedNetworkRevision' => $this->fixture['networkRevision'], 'expectedReviewVersion' => $candidate['reviewVersion'], 'acknowledgeImpact' => true, 'candidateSha256' => $candidate['candidateSha256']];
        $path = '/api/v1/port-corrections/'.$candidate['draftId'].'/apply';
        $this->postJson($path, [...$apply, 'candidateSha256' => str_repeat('0', 64)])->assertConflict();
        $this->postJson($path, [...$apply, 'expectedNetworkRevision' => 'OLD'])->assertConflict();
        $this->postJson('/api/v1/review-events', [...$this->input(2), 'action' => 'unresolved', 'reason' => 'Concurrent evidence observation'])->assertCreated();
        $this->postJson($path, $apply)->assertConflict();
        $this->assertSame(1, DB::table('network_revisions')->count());
    }

    public function test_reprocess_requires_explicit_source_reconciliation_without_replaying_or_erasing_human_history(): void
    {
        $validated = $this->validated();
        $base = $this->postJson('/api/v1/port-corrections/'.$validated['draftId'].'/apply', ['expectedNetworkRevision' => $this->fixture['networkRevision'], 'expectedReviewVersion' => $validated['reviewVersion'], 'candidateSha256' => $validated['candidateSha256'], 'acknowledgeImpact' => true])->assertOk()->json('networkRevision');
        $run = (string) Str::uuid();
        $path = 'imports/'.$run.'/candidate-1.json';
        Storage::disk('local')->makeDirectory('imports/'.$run);
        $sourceCandidate = [...$this->fixture, 'expectedRevision' => $base];
        $candidate = app(PortCorrectionStore::class)->prepareImportReconciliation($sourceCandidate, $base, $run, $path);
        $this->assertTrue($candidate['portCorrectionReconciliation']['requiresDecision']);
        $this->assertCount(1, $candidate['authority']['operatorPortCorrections']);
        $proposal = ['ready' => false, 'expectedNetworkRevision' => $base, 'networkRevision' => $candidate['networkRevision'], 'artifact' => 'candidate-1.json', 'artifactSha256' => hash_file('sha256', Storage::disk('local')->path($path)), 'counts' => $candidate['counts'], 'blockers' => ['Human correction disagreement'], 'portCorrectionReconciliation' => $candidate['portCorrectionReconciliation'], 'portCorrectionImpactSha256' => hash_file('sha256', Storage::disk('local')->path('imports/'.$run.'/correction-import-impact.json'))];
        DB::table('import_runs')->update(['created_at' => now()->subMinutes(5)]);
        DB::table('import_runs')->insert(['id' => $run, 'source_revision' => $this->input()['sourceRevision'], 'extractor_version' => 'test-reprocess', 'interpreter_version' => 'test-reprocess', 'extraction_status' => 'completed', 'semantic_status' => 'validated', 'network_status' => 'staged', 'warnings' => '[]', 'created_at' => now(), 'summary' => NetworkStore::json(['proposal' => $proposal])]);
        $this->postJson('/api/v1/imports/'.$run.'/apply', ['expectedNetworkRevision' => $base, 'candidateSha256' => $proposal['artifactSha256']])->assertUnprocessable();
        $preview = $this->getJson('/api/v1/imports/'.$run.'/correction-preview')->assertOk()->json();
        $this->assertGreaterThanOrEqual(2, $preview['counts']['changedPaths']);
        $input = ['expectedNetworkRevision' => $base, 'candidateSha256' => $proposal['artifactSha256'], 'draftIds' => [$validated['draftId']], 'reason' => 'Explicit isolated decision: accept fresh unknown source result.', 'acknowledgeImpact' => true];
        $this->postJson('/api/v1/imports/'.$run.'/reconcile-corrections', [...$input, 'draftIds' => [(string) Str::uuid()]])->assertUnprocessable();
        $this->postJson('/api/v1/imports/'.$run.'/reconcile-corrections', $input)->assertOk()->assertJsonPath('applied', false);
        $this->assertSame($base, DB::table('active_network_state')->value('network_revision'));
        $latest = json_decode(DB::table('import_runs')->where('id', $run)->value('summary'), true)['proposal'];
        $this->postJson('/api/v1/imports/'.$run.'/apply', ['expectedNetworkRevision' => $base, 'candidateSha256' => $proposal['artifactSha256']])->assertConflict();
        $this->postJson('/api/v1/imports/'.$run.'/apply', ['expectedNetworkRevision' => $base, 'candidateSha256' => $latest['artifactSha256']])->assertOk();
        $active = DB::table('active_network_state')->value('network_revision');
        $this->assertSame(1, DB::table('domain_records')->where('network_revision', $active)->where('collection', 'operatorPortCorrections')->count());
        $this->getJson('/api/v1/review-inbox/detail?case=TEST-CASE')->assertOk()->assertJsonPath('record.networkFactResolved', false)->assertJsonCount(3, 'events');
        $this->assertSame(3, DB::table('network_revisions')->count());
    }

    public function test_bank_remap_preview_apply_and_whole_group_reversal(): void
    {
        $this->actingAs($this->reviewer);
        $base = $this->fixture['networkRevision'];
        $input = [...$this->input(), 'subjectId' => 'AP-BANK:TEST-PORT', 'operation' => 'remap', 'evidenceBasis' => 'owner_confirmation'];
        unset($input['fiberNumber']);
        $this->getJson('/api/v1/port-corrections/options?subjectId=AP-BANK:TEST-PORT&revision='.$base)->assertOk()->assertJsonCount(24, 'bankPorts')->assertJsonCount(23, 'bankBindings');
        $this->postJson('/api/v1/port-corrections', [...$input, 'evidenceBasis' => 'engineer_review'])->assertUnprocessable();
        $draft = $this->postJson('/api/v1/port-corrections', $input)->assertCreated()->json();
        $validated = $this->postJson('/api/v1/port-corrections/'.$draft['draftId'].'/validate', ['expectedNetworkRevision' => $base, 'expectedReviewVersion' => $draft['reviewVersion']])->assertOk()->json();
        $this->getJson('/api/v1/port-corrections/'.$draft['draftId'].'/preview')->assertOk()->assertJsonCount(24, 'bankRows')->assertJsonPath('bankRows.0.after.fiberNumber', 1)->assertJsonPath('bankRows.1.before.fiberNumber', 1)->assertJsonPath('bankRows.1.after.fiberNumber', 2);
        $this->assertSame($base, DB::table('active_network_state')->value('network_revision'));
        $apply = ['expectedNetworkRevision' => $base, 'expectedReviewVersion' => $validated['reviewVersion'], 'acknowledgeImpact' => true, 'candidateSha256' => $validated['candidateSha256']];
        $revision = $this->postJson('/api/v1/port-corrections/'.$draft['draftId'].'/apply', $apply)->assertOk()->json('networkRevision');
        $this->postJson('/api/v1/port-corrections/'.$draft['draftId'].'/apply', $apply)->assertConflict();
        $this->assertSame(24, DB::table('domain_records')->where('network_revision', $revision)->where('collection', 'operatorPortCorrections')->count());
        $this->getJson('/api/v1/review-inbox/detail?case=TEST-CASE')->assertOk()->assertJsonPath('record.networkFactResolved', true);
        $this->getJson('/api/v1/review-inbox/detail?case=TEST-BANK-CASE-2')->assertOk()->assertJsonPath('record.networkFactResolved', true);
        $memberEvent = json_decode(DB::table('review_events')->where('network_revision', $revision)->where('subject_id', 'TEST-BANK-CASE-2')->value('correction'), true);
        $this->assertSame(2, $memberEvent['oldBinding']['portNumber']);
        $this->assertSame(1, $memberEvent['oldBinding']['fiberNumber']);
        $reverse = [...$input, 'expectedNetworkRevision' => $revision, 'expectedReviewVersion' => 3, 'operation' => 'revert', 'reverts' => $draft['draftId']];
        unset($reverse['segmentId']);
        $r = $this->postJson('/api/v1/port-corrections', $reverse)->assertCreated()->json();
        $v = $this->postJson('/api/v1/port-corrections/'.$r['draftId'].'/validate', ['expectedNetworkRevision' => $revision, 'expectedReviewVersion' => $r['reviewVersion']])->assertOk()->json();
        $reversed = $this->postJson('/api/v1/port-corrections/'.$r['draftId'].'/apply', ['expectedNetworkRevision' => $revision, 'expectedReviewVersion' => $v['reviewVersion'], 'acknowledgeImpact' => true, 'candidateSha256' => $v['candidateSha256']])->assertOk()->json('networkRevision');
        $this->getJson('/api/v1/review-inbox/detail?case=TEST-CASE')->assertOk()->assertJsonPath('record.networkFactResolved', false);
        $owner = $this->fixture['authority']['apPorts'][array_search('TEST-PORT', array_column($this->fixture['authority']['apPorts'], 'id'))]['canonicalNode']['id'];
        $bank = DB::table('port_topology_bindings')->where('network_revision', $reversed)->whereRaw("payload->>'ownerId'=?", [$owner])->pluck('payload')->map(fn ($p) => json_decode($p, true));
        $this->assertCount(23, $bank);
        $this->assertTrue($bank->every(fn ($b) => $b['portNumber'] === $b['fiberNumber'] + 1));
        $this->assertSame(3, DB::table('network_revisions')->count());
    }

    public function test_partial_bank_remap_maps_twenty_fibers_preserves_four_spare_ports_and_reverses(): void
    {
        $this->actingAs($this->reviewer);
        $base = $this->fixture['networkRevision'];
        $input = [...$this->input(), 'operation' => 'remap', 'evidenceBasis' => 'owner_confirmation'];
        unset($input['fiberNumber']);
        $options = $this->getJson('/api/v1/port-corrections/options?subjectId=TEST-CASE&revision='.$base)->assertOk()->assertJsonCount(24, 'bankPorts')->assertJsonCount(0, 'bankBindings')->json();
        $this->assertSame(20, collect($options['cables'])->firstWhere('id', $input['segmentId'])['fiberCount']);
        $this->postJson('/api/v1/port-corrections', [...$input, 'evidenceBasis' => 'source_geometry'])->assertUnprocessable();
        $draft = $this->postJson('/api/v1/port-corrections', $input)->assertCreated()->json();
        $validated = $this->postJson('/api/v1/port-corrections/'.$draft['draftId'].'/validate', ['expectedNetworkRevision' => $base, 'expectedReviewVersion' => $draft['reviewVersion']])->assertOk()->json();
        $rows = $this->getJson('/api/v1/port-corrections/'.$draft['draftId'].'/preview')->assertOk()->assertJsonCount(20, 'bankRows')->assertJsonPath('bankRows.19.after.fiberNumber', 20)->json('bankRows');
        $this->assertTrue(collect($rows)->every(fn ($row) => $row['before'] === null && $row['after']['fiberNumber'] === $row['portNumber']));
        $this->assertSame($base, DB::table('active_network_state')->value('network_revision'));
        $revision = $this->postJson('/api/v1/port-corrections/'.$draft['draftId'].'/apply', ['expectedNetworkRevision' => $base, 'expectedReviewVersion' => $validated['reviewVersion'], 'candidateSha256' => $validated['candidateSha256'], 'acknowledgeImpact' => true])->assertOk()->json('networkRevision');
        $owner = collect($this->fixture['authority']['apPorts'])->firstWhere('id', 'TEST-PORT')['canonicalNode']['id'];
        $bindings = DB::table('port_topology_bindings')->where('network_revision', $revision)->whereRaw("payload->>'ownerId'=?", [$owner])->pluck('payload')->map(fn ($payload) => json_decode($payload, true));
        $this->assertCount(20, $bindings);
        $this->assertTrue($bindings->every(fn ($binding) => $binding['portNumber'] === $binding['fiberNumber'] && $binding['portNumber'] <= 20));
        $this->assertSame(20, DB::table('domain_records')->where('network_revision', $revision)->where('collection', 'operatorPortCorrections')->count());
        $this->getJson('/api/v1/review-inbox/detail?case=TEST-CASE')->assertOk()->assertJsonPath('record.networkFactResolved', true)->assertJsonPath('record.appliedCorrection.newBinding.fiberNumber', 1);
        $this->getJson('/api/v1/review-inbox/detail?case=TEST-BANK-CASE-24')->assertOk()->assertJsonPath('record.networkFactResolved', false)->assertJsonPath('record.open', true)->assertJsonCount(0, 'events');
        $reverse = [...$input, 'operation' => 'revert', 'reverts' => $draft['draftId'], 'expectedNetworkRevision' => $revision, 'expectedReviewVersion' => 3];
        unset($reverse['segmentId']);
        $r = $this->postJson('/api/v1/port-corrections', $reverse)->assertCreated()->json();
        $v = $this->postJson('/api/v1/port-corrections/'.$r['draftId'].'/validate', ['expectedNetworkRevision' => $revision, 'expectedReviewVersion' => $r['reviewVersion']])->assertOk()->json();
        $reversed = $this->postJson('/api/v1/port-corrections/'.$r['draftId'].'/apply', ['expectedNetworkRevision' => $revision, 'expectedReviewVersion' => $v['reviewVersion'], 'candidateSha256' => $v['candidateSha256'], 'acknowledgeImpact' => true])->assertOk()->json('networkRevision');
        $this->assertSame(0, DB::table('port_topology_bindings')->where('network_revision', $reversed)->whereRaw("payload->>'ownerId'=?", [$owner])->count());
        $this->getJson('/api/v1/review-inbox/detail?case=TEST-CASE')->assertOk()->assertJsonPath('record.networkFactResolved', false)->assertJsonPath('record.open', true);
        $this->assertSame('7', json_decode(DB::table('source_shapes')->value('payload'), true)['text']);
        $this->assertSame(3, DB::table('network_revisions')->count());
    }

    public function test_bank_remap_refuses_a_concurrent_review_on_another_port(): void
    {
        $this->actingAs($this->reviewer);
        $base = $this->fixture['networkRevision'];
        $input = [...$this->input(), 'operation' => 'remap', 'evidenceBasis' => 'owner_confirmation'];
        unset($input['fiberNumber']);
        $draft = $this->postJson('/api/v1/port-corrections', $input)->assertCreated()->json();
        DB::table('review_subject_versions')->where('network_revision', $base)->where('subject_id', 'TEST-BANK-CASE-2')->update(['version' => 1]);
        $this->postJson('/api/v1/port-corrections/'.$draft['draftId'].'/validate', ['expectedNetworkRevision' => $base, 'expectedReviewVersion' => $draft['reviewVersion']])->assertConflict();
        $this->assertSame($base, DB::table('active_network_state')->value('network_revision'));
        $this->assertSame(1, DB::table('network_revisions')->count());
        DB::table('review_subject_versions')->where('network_revision', $base)->where('subject_id', 'TEST-BANK-CASE-2')->update(['version' => 0]);
        $validated = $this->postJson('/api/v1/port-corrections/'.$draft['draftId'].'/validate', ['expectedNetworkRevision' => $base, 'expectedReviewVersion' => $draft['reviewVersion']])->assertOk()->json();
        DB::table('review_subject_versions')->where('network_revision', $base)->where('subject_id', 'TEST-BANK-CASE-2')->update(['version' => 1]);
        $this->postJson('/api/v1/port-corrections/'.$draft['draftId'].'/apply', ['expectedNetworkRevision' => $base, 'expectedReviewVersion' => $validated['reviewVersion'], 'acknowledgeImpact' => true, 'candidateSha256' => $validated['candidateSha256']])->assertConflict();
        $this->assertSame($base, DB::table('active_network_state')->value('network_revision'));
    }

    public function test_bank_reprocessing_compares_all_members_and_never_replays_the_remap(): void
    {
        $this->actingAs($this->reviewer);
        $base = $this->fixture['networkRevision'];
        $draft = $this->postJson('/api/v1/port-corrections', [...$this->input(), 'operation' => 'remap', 'evidenceBasis' => 'owner_confirmation'])->assertCreated()->json();
        $validated = $this->postJson('/api/v1/port-corrections/'.$draft['draftId'].'/validate', ['expectedNetworkRevision' => $base, 'expectedReviewVersion' => $draft['reviewVersion']])->assertOk()->json();
        $active = $this->postJson('/api/v1/port-corrections/'.$draft['draftId'].'/apply', ['expectedNetworkRevision' => $base, 'expectedReviewVersion' => $validated['reviewVersion'], 'candidateSha256' => $validated['candidateSha256'], 'acknowledgeImpact' => true])->assertOk()->json('networkRevision');
        $run = (string) Str::uuid();
        $path = 'imports/'.$run.'/candidate-1.json';
        Storage::disk('local')->makeDirectory('imports/'.$run);
        $fresh = [...$this->fixture, 'expectedRevision' => $active];
        $compared = app(PortCorrectionStore::class)->prepareImportReconciliation($fresh, $active, $run, $path);
        $rows = $compared['portCorrectionReconciliation']['rows'];
        $this->assertCount(24, $rows);
        $this->assertCount(24, array_unique(array_column($rows, 'draftId')));
        $this->assertTrue($compared['portCorrectionReconciliation']['requiresDecision']);
        $this->assertTrue(collect($rows)->every(fn ($r) => $r['status'] === 'requires_owner_decision'));
        $this->assertSame($fresh['authority']['portTopologyBindings'], $compared['authority']['portTopologyBindings']);
        $this->assertCount(24, $compared['authority']['operatorPortCorrections']);
        $accepted = app(PortCorrectionStore::class)->prepareImportReconciliation($fresh, $active, $run, $path, ['draftIds' => array_column($rows, 'draftId'), 'actorId' => $this->reviewer->id, 'reason' => 'Explicit isolated fresh-source reconciliation for all bank members.']);
        $this->assertFalse($accepted['portCorrectionReconciliation']['requiresDecision']);
        $this->assertTrue(collect($accepted['portCorrectionReconciliation']['rows'])->every(fn ($r) => $r['status'] === 'superseded_by_source'));
        $this->assertSame($active, DB::table('active_network_state')->value('network_revision'));
    }

    public function test_legacy_bank_resolves_source_by_canonical_shape_identity(): void
    {
        $this->actingAs($this->reviewer);
        $port = collect($this->fixture['authority']['apPorts'])->first(fn ($p) => $p['apNumber'] === 9001 && $p['number'] === 1);
        $base = $this->fixture['networkRevision'];
        $subject = 'AP-BANK:'.$port['id'];
        $this->getJson('/api/v1/port-corrections/options?subjectId='.$subject.'&revision='.$base)->assertOk()->assertJsonPath('context.case.sourceRevision', $this->input()['sourceRevision'])->assertJsonCount(24, 'bankPorts');
        $input = [...$this->input(), 'subjectId' => $subject, 'portId' => $port['id'], 'operation' => 'remap', 'evidenceBasis' => 'owner_confirmation'];
        unset($input['fiberNumber']);
        $draft = $this->postJson('/api/v1/port-corrections', $input)->assertCreated()->json();
        $this->postJson('/api/v1/port-corrections/'.$draft['draftId'].'/validate', ['expectedNetworkRevision' => $base, 'expectedReviewVersion' => $draft['reviewVersion']])->assertOk();
        $this->getJson('/api/v1/port-corrections/'.$draft['draftId'].'/preview')->assertOk()->assertJsonCount(24, 'bankRows');
        $this->assertSame($base, DB::table('active_network_state')->value('network_revision'));
        $this->getJson('/api/v1/port-corrections/options?subjectId=AP-BANK:SHIDA-PORT-wrong&revision='.$base)->assertUnprocessable();
    }

    public function test_bank_remap_from_review_keeps_the_case_on_its_exact_port_and_reopens_on_reversal(): void
    {
        $this->actingAs($this->reviewer);
        $base = $this->fixture['networkRevision'];
        $input = [...$this->input(), 'operation' => 'remap', 'evidenceBasis' => 'owner_confirmation'];
        unset($input['fiberNumber']);
        $draft = $this->postJson('/api/v1/port-corrections', $input)->assertCreated()->json();
        $validated = $this->postJson('/api/v1/port-corrections/'.$draft['draftId'].'/validate', ['expectedNetworkRevision' => $base, 'expectedReviewVersion' => $draft['reviewVersion']])->assertOk()->json();
        $applied = $this->postJson('/api/v1/port-corrections/'.$draft['draftId'].'/apply', ['expectedNetworkRevision' => $base, 'expectedReviewVersion' => $validated['reviewVersion'], 'candidateSha256' => $validated['candidateSha256'], 'acknowledgeImpact' => true])->assertOk()->json('networkRevision');
        $this->getJson('/api/v1/review-inbox/detail?case=TEST-CASE')->assertOk()->assertJsonPath('record.networkFactResolved', true)->assertJsonPath('record.open', false)->assertJsonPath('record.appliedCorrection.newBinding.portNumber', 1)->assertJsonPath('record.appliedCorrection.newBinding.fiberNumber', 1);
        $this->getJson('/api/v1/review-inbox?status=open')->assertOk()->assertJsonPath('filtered', 0);
        $this->getJson('/api/v1/review-inbox?status=reviewed')->assertOk()->assertJsonPath('filtered', 2);
        $this->getJson('/api/v1/review-inbox/detail?case=TEST-CASE&revision='.$base)->assertOk()->assertJsonPath('record.networkFactResolved', false);
        $reverse = [...$input, 'operation' => 'revert', 'reverts' => $draft['draftId'], 'expectedNetworkRevision' => $applied, 'expectedReviewVersion' => 3];
        unset($reverse['segmentId']);
        $r = $this->postJson('/api/v1/port-corrections', $reverse)->assertCreated()->json();
        $v = $this->postJson('/api/v1/port-corrections/'.$r['draftId'].'/validate', ['expectedNetworkRevision' => $applied, 'expectedReviewVersion' => $r['reviewVersion']])->assertOk()->json();
        $this->postJson('/api/v1/port-corrections/'.$r['draftId'].'/apply', ['expectedNetworkRevision' => $applied, 'expectedReviewVersion' => $v['reviewVersion'], 'candidateSha256' => $v['candidateSha256'], 'acknowledgeImpact' => true])->assertOk();
        $this->getJson('/api/v1/review-inbox/detail?case=TEST-CASE')->assertOk()->assertJsonPath('record.networkFactResolved', false)->assertJsonPath('record.open', true)->assertJsonPath('record.appliedCorrection.newBinding', null);
        $this->getJson('/api/v1/review-inbox?status=open')->assertOk()->assertJsonPath('filtered', 1)->assertJsonPath('rows.0.id', 'TEST-CASE');
    }
}
