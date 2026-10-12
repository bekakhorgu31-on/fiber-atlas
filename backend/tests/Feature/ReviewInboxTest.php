<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\ReviewInboxStore;
use App\Support\DatabaseScope;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

final class ReviewInboxTest extends TestCase
{
    private string $revision = 'LOCAL-REVIEW-34';

    private array $sources = [];

    private array $runs = [];

    protected function setUp(): void
    {
        parent::setUp();
        if (DatabaseScope::schema() !== 'fiber_isolation') {
            $this->markTestSkipped('Review replay requires disposable local isolation.');
        }
        DatabaseScope::assertDestructiveTestTarget();
        $this->artisan('migrate:fresh', ['--force' => true])->assertExitCode(0);
        DB::table('network_revisions')->insert(['id' => $this->revision, 'baseline_sha256' => str_repeat('a', 64), 'topology_revision' => 'fixed', 'display_revision' => 'fixed', 'status' => 'preparing', 'validation' => '{}', 'created_at' => now()]);
        DB::table('active_network_state')->where('id', 1)->update(['network_revision' => $this->revision]);
        foreach (['A', 'B'] as $i => $key) {
            $sha = str_repeat($i ? 'b' : 'c', 64);
            $doc = 'DOC-'.$key;
            $source = $doc.'/'.$sha;
            $run = (string) Str::uuid();
            $this->sources[$key] = $source;
            $this->runs[$key] = $run;
            DB::table('source_documents')->insert(['id' => $doc, 'title' => 'Region '.$key, 'created_at' => now()]);
            DB::table('source_revisions')->insert(['id' => $source, 'document_id' => $doc, 'sha256' => $sha, 'original_name' => 'same-name.vsdx', 'metadata' => '{}', 'created_at' => now()]);
            DB::table('network_sources')->insert(['network_revision' => $this->revision, 'source_revision' => $source]);
            DB::table('import_runs')->insert(['id' => $run, 'source_revision' => $source, 'extractor_version' => 'test', 'interpreter_version' => 'test', 'extraction_status' => 'completed', 'semantic_status' => 'validated', 'network_status' => 'applied', 'warnings' => '[]', 'created_at' => now()->subMinutes(2), 'summary' => json_encode(['proposal' => ['networkRevision' => $this->revision, 'ready' => true]])]);
            $port = 'SHIDA-PORT-'.substr(hash('sha256', $doc.'/50'), 0, 24);
            $node = 'NODE-'.$key;
            $src = ['file' => 'same-name.vsdx', 'page' => 'page', 'pageId' => '0', 'shapeIds' => ['50']];
            $this->record('sourceDocuments', $i, ['id' => $doc, 'title' => 'Region '.$key, 'sourceSha256' => $sha, 'importedAssetIds' => []]);
            $this->record('sourceAnnotations', $i, ['id' => 'TEXT-'.$key, 'sourceSha256' => $sha, 'extractionRunId' => $run]);
            $this->record('networkNodes', $i, ['id' => $node, 'assetType' => 'ap', 'displayName' => 'AP51 · Region '.$key, 'source' => $src]);
            $this->record('apPorts', $i, ['id' => $port, 'number' => 1, 'apNumber' => 51, 'shapeId' => '50', 'canonicalNode' => ['kind' => 'network_node', 'id' => $node], 'source' => $src]);
            $this->record('sourceReviewCases', $i, ['id' => 'CASE-'.$key, 'category' => 'fiber_port_binding_ambiguous', 'question' => 'Port binding', 'observation' => 'not known', 'source' => $src, 'affectedIds' => [$port], 'candidates' => []]);
            $payload = ['id' => '50', 'text' => '1', 'parent_id' => null, 'attributes' => ['Type' => 'Shape'], 'geometry' => ['global_pin' => ['x' => 1, 'y' => 1], 'world_bounds' => ['min_x' => .9, 'max_x' => 1.1, 'min_y' => .9, 'max_y' => 1.1, 'width' => .2, 'height' => .2], 'local_to_page' => [1, 0, 0, 1, 0, 0], 'local_bounds' => ['width' => .2, 'height' => .2], 'world_geometry_sections' => []], 'effective_style' => []];
            DB::table('source_shapes')->insert(['source_revision' => $source, 'import_run' => $run, 'page_id' => '0', 'shape_id' => '50', 'payload' => json_encode($payload)]);
        }
        DB::table('network_revisions')->where('id', $this->revision)->update(['status' => 'validated']);
    }

    private function record(string $collection, int $ordinal, array $payload): void
    {
        DB::table('domain_records')->insert(['network_revision' => $this->revision, 'id' => $collection.':'.$ordinal, 'logical_id' => $payload['id'], 'collection' => $collection, 'ordinal' => $ordinal, 'payload' => json_encode($payload)]);
    }

    public function test_source_scope_groups_and_exact_evidence_do_not_merge_region_ap_numbers(): void
    {
        $this->getJson('/api/v1/review-inbox?q=AP51%20Port1')->assertOk()->assertJsonPath('filtered', 2);
        $this->getJson('/api/v1/review-inbox')->assertOk()->assertJsonPath('total', 2)->assertJsonPath('categories.fiber_port_binding_ambiguous', 2)->assertJsonCount(2, 'groups');
        $q = http_build_query(['source' => $this->sources['A']]);
        $this->getJson('/api/v1/review-inbox?'.$q)->assertOk()->assertJsonPath('total', 1)->assertJsonPath('rows.0.id', 'CASE-A')->assertJsonPath('rows.0.object', 'AP51 · Region A / Port 1');
        $this->getJson('/api/v1/review-inbox/detail?'.$q.'&case=CASE-B')->assertNotFound();
        $this->getJson('/api/v1/review-inbox/evidence?case=CASE-A')->assertOk()->assertJsonPath('importRun', $this->runs['A'])->assertJsonPath('views.0.shapes.0.text', '1');
        DB::table('source_shapes')->where('import_run', $this->runs['A'])->delete();
        $this->getJson('/api/v1/review-inbox/evidence?case=CASE-A')->assertNotFound();
        $this->assertSame(0, DB::table('review_events')->count());
    }

    public function test_historical_scope_and_superseded_imports_keep_their_original_meaning(): void
    {
        $older = (string) Str::uuid();
        DB::table('import_runs')->insert(['id' => $older, 'source_revision' => $this->sources['A'], 'extractor_version' => 'older', 'interpreter_version' => 'older', 'extraction_status' => 'completed', 'semantic_status' => 'unsupported', 'network_status' => 'staged', 'warnings' => '[]', 'created_at' => now()->subHours(1), 'summary' => '{}']);
        $this->getJson('/api/v1/session')->assertOk()->assertJsonPath('reviewCount', 2)->assertJsonPath('pendingSources', 0);
        DB::table('active_network_state')->where('id', 1)->update(['network_revision' => null]);
        $this->getJson('/api/v1/review-inbox?revision='.$this->revision)->assertOk()->assertJsonPath('context.kind', 'historical')->assertJsonPath('total', 2);
        $this->actingAs(User::factory()->create(['role' => 'reviewer']))->postJson('/api/v1/review-events', ['expectedNetworkRevision' => $this->revision, 'subjectId' => 'CASE-A', 'expectedReviewVersion' => 0, 'action' => 'unresolved', 'reason' => 'Historical observation'])->assertConflict();
        $this->assertSame(0, DB::table('review_events')->count());
    }

    public function test_notes_proposals_permission_and_concurrency_do_not_change_source_or_network(): void
    {
        $input = ['expectedNetworkRevision' => $this->revision, 'subjectId' => 'CASE-A', 'expectedReviewVersion' => 0, 'sourceRevision' => $this->sources['A'], 'action' => 'unresolved', 'reason' => 'Source observation', 'correction' => ['disposition' => 'proposal', 'applied' => true, 'fieldVerified' => true, 'sourceChanges' => [['shapeId' => '50', 'oldValue' => '1', 'newValue' => '24']]]];
        $viewer = User::factory()->create(['role' => 'viewer']);
        $this->actingAs($viewer)->postJson('/api/v1/review-events', $input)->assertForbidden();
        $owner = User::factory()->create(['role' => 'reviewer']);
        $this->actingAs($owner)->postJson('/api/v1/review-events', [...$input, 'sourceRevision' => $this->sources['B']])->assertUnprocessable();
        $this->postJson('/api/v1/review-events', $input)->assertCreated();
        $this->postJson('/api/v1/review-events', $input)->assertConflict();
        $this->postJson('/api/v1/review-events', [...$input, 'expectedNetworkRevision' => 'stale'])->assertConflict();
        $this->getJson('/api/v1/review-inbox/detail?case=CASE-A')->assertOk()->assertJsonPath('record.reviewVersion', 1)->assertJsonPath('record.open', true)->assertJsonPath('record.networkFactResolved', false)->assertJsonPath('events.0.actor_name', $owner->name);
        $event = DB::table('review_events')->first();
        $change = json_decode($event->correction, true);
        $this->assertFalse($change['applied']);
        $this->assertFalse($change['fieldVerified']);
        $this->assertSame($this->revision, DB::table('active_network_state')->value('network_revision'));
        $shape = json_decode(DB::table('source_shapes')->where('import_run', $this->runs['A'])->value('payload'), true);
        $this->assertSame('1', $shape['text']);
        $this->getJson('/api/v1/session')->assertOk()->assertJsonPath('reviewCount', 2);
    }

    public function test_staged_index_is_bounded_authenticated_and_pinned_without_candidate_download(): void
    {
        Storage::fake('local');
        $run = (string) Str::uuid();
        $context = app(ReviewInboxStore::class)->context($this->revision, null, true);
        $text = json_encode(['version' => 1, 'networkRevision' => 'DRAFT-34', 'sources' => $context['sources'], 'cases' => $context['cases']]);
        Storage::disk('local')->put('imports/'.$run.'/review-index.json', $text);
        DB::table('import_runs')->insert(['id' => $run, 'source_revision' => $this->sources['A'], 'extractor_version' => 'test', 'interpreter_version' => 'test/staged', 'extraction_status' => 'completed', 'semantic_status' => 'validated', 'network_status' => 'staged', 'warnings' => '[]', 'created_at' => now(), 'summary' => json_encode(['proposal' => ['ready' => true, 'networkRevision' => 'DRAFT-34', 'reviewIndexSha256' => hash('sha256', $text)]])]);
        $this->getJson('/api/v1/review-inbox?run='.$run)->assertUnauthorized();
        $this->actingAs(User::factory()->create(['role' => 'viewer']));
        $this->getJson('/api/v1/review-inbox?run='.$run)->assertOk()->assertJsonPath('context.kind', 'staged')->assertJsonPath('total', 1)->assertJsonPath('rows.0.id', 'CASE-A')->assertJsonPath('context.readOnly', true);
        Storage::disk('local')->put('imports/'.$run.'/review-index.json', 'damaged');
        $this->getJson('/api/v1/review-inbox?run='.$run)->assertConflict();
        $this->assertSame($this->revision, DB::table('active_network_state')->value('network_revision'));
    }
}
