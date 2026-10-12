<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\ReviewReadCache;
use App\Support\DatabaseScope;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

final class ReviewPerformanceTest extends TestCase
{
    private string $revision = 'LOCAL-REVIEW-34';

    private array $sources = [];

    private array $runs = [];

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
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
        $port = 'SHIDA-PORT-'.substr(hash('sha256', 'DOC-A/50'), 0, 24);
        for ($i = 0; $i < 40; $i++) {
            $this->record('operatorPortCorrections', $i, ['id' => 'HISTORY-'.$i, 'subjectId' => 'CASE-A', 'portId' => $port, 'sourceRevision' => $this->sources['A'], 'newBinding' => ['id' => 'MISSING-BINDING-'.$i]]);
        }
        DB::table('network_revisions')->where('id', $this->revision)->update(['status' => 'validated']);
    }

    private function record(string $collection, int $ordinal, array $payload): void
    {
        DB::table('domain_records')->insert(['network_revision' => $this->revision, 'id' => $collection.':'.$ordinal, 'logical_id' => $payload['id'], 'collection' => $collection, 'ordinal' => $ordinal, 'payload' => json_encode($payload)]);
    }

    public function test_cached_metadata_never_freezes_review_version_authorization_or_active_state(): void
    {
        $this->getJson('/api/v1/review-inbox')->assertOk();
        $this->getJson('/api/v1/review-inbox/detail?case=CASE-A')->assertOk()->assertJsonPath('record.open', true)->assertJsonPath('record.reviewVersion', 0);
        $owner = User::factory()->create(['role' => 'reviewer']);
        $this->actingAs($owner)->postJson('/api/v1/review-events', ['subjectId' => 'CASE-A', 'expectedNetworkRevision' => $this->revision, 'sourceRevision' => $this->sources['A'], 'expectedReviewVersion' => 0, 'action' => 'rejected', 'reason' => 'Dismissed after exact source review'])->assertCreated();
        $this->getJson('/api/v1/review-inbox/detail?case=CASE-A')->assertOk()->assertJsonPath('record.open', false)->assertJsonPath('record.reviewVersion', 1)->assertJsonCount(1, 'events');
        $this->getJson('/api/v1/review-inbox?status=open')->assertOk()->assertJsonPath('filtered', 1);
        $this->getJson('/api/v1/session')->assertOk()->assertJsonPath('reviewCount', 1);
        DB::table('active_network_state')->where('id', 1)->update(['network_revision' => null]);
        $this->getJson('/api/v1/review-inbox/detail?revision='.$this->revision.'&case=CASE-A')->assertOk()->assertJsonPath('context.kind', 'historical')->assertJsonPath('context.readOnly', true);
        $this->postJson('/api/v1/review-events', ['subjectId' => 'CASE-A', 'expectedNetworkRevision' => $this->revision, 'expectedReviewVersion' => 1, 'action' => 'unresolved', 'reason' => 'Cannot write this historical revision'])->assertConflict();
    }

    public function test_exact_run_crop_cache_is_source_isolated_corruption_safe_and_checks_missing_anchor(): void
    {
        $a = $this->getJson('/api/v1/review-inbox/evidence?case=CASE-A')->assertOk()->json();
        $this->assertSame($this->runs['A'], $a['importRun']);
        DB::table('source_shapes')->where('import_run', $this->runs['B'])->update(['payload' => DB::raw("jsonb_set(payload,'{text}','\"REGION-B\"'::jsonb)")]);
        $b = $this->getJson('/api/v1/review-inbox/evidence?case=CASE-B')->assertOk()->json();
        $this->assertSame('REGION-B', $b['views'][0]['shapes'][0]['text']);
        $this->assertSame($a, $this->getJson('/api/v1/review-inbox/evidence?case=CASE-A')->assertOk()->json());
        foreach (Storage::disk('local')->files('review-read-cache/36-1') as $file) {
            $entry = json_decode(Storage::disk('local')->get($file), true);
            if (str_starts_with($entry['key'], 'crop/')) {
                Storage::disk('local')->put($file, 'invalid cache');
            }
        }
        $this->assertSame($a, $this->getJson('/api/v1/review-inbox/evidence?case=CASE-A')->assertOk()->json());
        DB::table('source_shapes')->where('import_run', $this->runs['A'])->delete();
        $this->getJson('/api/v1/review-inbox/evidence?case=CASE-A')->assertNotFound();
    }

    public function test_selective_cold_detail_does_not_load_unrelated_cases_and_compression_is_private(): void
    {
        DB::flushQueryLog();
        DB::enableQueryLog();
        $this->getJson('/api/v1/review-inbox/detail?case=CASE-A')->assertOk()->assertJsonPath('record.id', 'CASE-A');
        $log = DB::getQueryLog();
        DB::disableQueryLog();
        $caseReads = array_filter($log, fn ($q) => str_contains($q['query'], 'domain_records') && in_array('sourceReviewCases', $q['bindings'], true));
        $this->assertNotEmpty($caseReads);
        foreach ($caseReads as $query) {
            $this->assertContains('CASE-A', $query['bindings']);
        }
        $response = $this->get('/api/v1/review-inbox/evidence?case=CASE-A', ['Accept' => 'application/json', 'Accept-Encoding' => 'gzip'])->assertOk()->assertHeader('Content-Encoding', 'gzip')->assertHeader('Vary', 'Accept-Encoding, Cookie');
        $this->assertStringContainsString('private', $response->headers->get('Cache-Control'));
        $this->assertSame($this->runs['A'], json_decode(gzdecode($response->getContent()), true)['importRun']);
        $this->getJson('/api/v1/review-inbox/detail?source='.$this->sources['B'].'&case=CASE-A')->assertNotFound();
    }

    public function test_derived_cache_growth_is_bounded_and_expired_or_corrupt_entries_are_not_used(): void
    {
        $cache = new ReviewReadCache(2, 4096);
        $cache->put('first', ['value' => 1]);
        $cache->put('second', ['value' => 2]);
        $cache->put('third', ['value' => 3]);
        $this->assertTrue($cache->get('first') === null || $cache->get('second') === null);
        $this->assertSame(['value' => 3], $cache->get('third'));
        $this->assertCount(2, Storage::disk('local')->files('review-read-cache/36-1'));
        foreach (Storage::disk('local')->files('review-read-cache/36-1') as $file) {
            touch(Storage::disk('local')->path($file), time() - ReviewReadCache::TTL - 10);
        }
        $this->assertNull($cache->get('third'));
    }

    public function test_many_correction_memberships_are_checked_in_one_query_not_one_per_record(): void
    {
        $this->getJson('/api/v1/review-inbox')->assertOk();
        DB::flushQueryLog();
        DB::enableQueryLog();
        $this->getJson('/api/v1/review-inbox/detail?case=CASE-A')->assertOk()->assertJsonPath('record.networkFactResolved', false);
        $queries = DB::getQueryLog();
        DB::disableQueryLog();
        $membership = array_filter($queries, fn ($q) => str_contains($q['query'], 'port_topology_bindings'));
        $this->assertCount(1, $membership);
        $this->assertGreaterThanOrEqual(40, count(array_values($membership)[0]['bindings']));
    }
}
