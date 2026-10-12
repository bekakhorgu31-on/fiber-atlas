<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\ImportedNetworkStore;
use App\Services\ImportStore;
use App\Services\OwnerSetup;
use App\Support\DatabaseScope;
use Illuminate\Http\UploadedFile;
use Illuminate\Process\Factory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

final class OwnerImportTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (DatabaseScope::schema() !== 'fiber_isolation') {
            $this->markTestSkipped('Fresh import replay requires the non-public local isolation schema.');
        }
        DatabaseScope::assertDestructiveTestTarget();
        $this->artisan('migrate:fresh', ['--force' => true])->assertExitCode(0);
        config(['fiber_atlas.python' => str_replace('\\', '/', getenv('USERPROFILE').'/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe')]);
    }

    public function test_empty_state_and_account_setup_without_network(): void
    {
        $this->getJson('/api/v1/network')->assertOk()->assertJsonPath('networkState', 'empty')->assertJsonPath('networkRevision', null);
        $this->getJson('/api/v1/imports')->assertOk()->assertJsonPath('runs', []);
        $this->getJson('/api/v1/session')->assertOk()->assertJsonPath('setupAvailable', true);
        $this->postJson('/api/v1/owner-setup', ['name' => 'Owner', 'email' => 'owner@test.local', 'password' => 'private-test-password', 'setupToken' => 'wrong'])->assertForbidden();
        $setup = app(OwnerSetup::class);
        $this->assertTrue($setup->issue());
        $ticket = json_decode(file_get_contents(dirname(base_path()).'/.dev-runtime/owner-setup-local.json'), true);
        $this->postJson('/api/v1/owner-setup', ['name' => 'Owner', 'email' => 'owner@test.local', 'password' => 'private-test-password', 'setupToken' => $ticket['token']])->assertOk()->assertJsonPath('user.name', 'Owner');
        $this->assertFalse($setup->issue());
        $this->assertFalse($setup->valid($ticket['token']));
        $this->assertSame(0, DB::table('network_revisions')->count());
    }

    public function test_geometry_reprocessing_is_reviewer_only(): void
    {
        $run = (string) Str::uuid();
        $this->postJson('/api/v1/imports/'.$run.'/reprocess', [])->assertUnauthorized();
        $viewer = User::factory()->create(['role' => 'viewer']);
        $this->actingAs($viewer)->postJson('/api/v1/imports/'.$run.'/reprocess', [])->assertForbidden();
        $this->assertSame(0, DB::table('import_runs')->count());
        $this->assertSame(0, DB::table('network_revisions')->count());
    }

    public function test_older_validated_source_proposal_cannot_override_a_newer_interpretation(): void
    {
        $owner = User::factory()->create(['role' => 'reviewer']);
        $this->actingAs($owner);
        $document = 'LOCAL-PROPOSAL-SUPERSESSION';
        $revision = $document.'/'.str_repeat('a', 64);
        DB::table('source_documents')->insert(['id' => $document, 'title' => 'Local supersession fixture', 'created_at' => now()]);
        DB::table('source_revisions')->insert(['id' => $revision, 'document_id' => $document, 'sha256' => str_repeat('a', 64), 'original_name' => 'fixture.vsdx', 'metadata' => '{}', 'created_at' => now()]);
        $older = (string) Str::uuid();
        foreach ([$older, (string) Str::uuid()] as $i => $id) {
            DB::table('import_runs')->insert(['id' => $id, 'source_revision' => $revision, 'extractor_version' => 'local-test', 'interpreter_version' => 'local-test/'.$i, 'extraction_status' => 'completed', 'semantic_status' => 'validated', 'network_status' => 'staged', 'warnings' => '[]', 'actor_id' => $owner->id, 'created_at' => now()->subMinutes(2 - $i), 'summary' => json_encode(['proposal' => ['ready' => true, 'networkRevision' => 'unused-fixture-revision', 'expectedNetworkRevision' => null]])]);
        }
        $this->postJson('/api/v1/imports/'.$older.'/apply', ['expectedNetworkRevision' => null])->assertConflict();
        $this->assertNull(DB::table('active_network_state')->value('network_revision'));
        $this->assertSame(0, DB::table('network_revisions')->count());
        $this->assertSame(2, DB::table('import_runs')->count());
    }

    public function test_large_source_staging_reprocess_proposal_and_isolated_owner_apply(): void
    {
        $path = dirname(dirname(base_path())).'/შიდა ქართლი 2026.vsdx';
        if (! is_file($path)) {
            $this->markTestSkipped('Owner-supplied large drawing is a local acceptance fixture.');
        }
        Storage::fake('local');
        $owner = User::factory()->create(['role' => 'reviewer']);
        $this->actingAs($owner);

        $response = $this->post('/api/v1/imports', ['file' => new UploadedFile($path, 'შიდა ქართლი 2026.vsdx', null, null, true), 'newDocument' => '1', 'title' => 'Large source staging'], ['Accept' => 'application/json'])->assertCreated();

        $runId = $response->json('id');
        $run = DB::table('import_runs')->where('id', $runId)->first();
        $this->assertSame('completed', $run->extraction_status, $run->error ?? '');
        $this->assertSame('unsupported', $run->semantic_status);
        $this->assertSame('staged', $run->network_status);
        $summary = json_decode($run->summary, true);
        $this->assertSame('package_inventory', $summary['extractionScope']);
        $this->assertFalse($summary['geometryDecoded']);
        $this->assertFalse($summary['topologyProjected']);
        $this->assertFalse($summary['proposal']['ready']);
        $this->assertGreaterThan(50000, $summary['summary']['all_page_shapes_including_subshapes']);
        $this->assertSame($summary['summary']['all_page_shapes_including_subshapes'], DB::table('source_shapes')->where('import_run', $runId)->count());
        $revision = DB::table('source_revisions')->where('id', $response->json('sourceRevision'))->first();
        $this->assertSame(hash_file('sha256', $path), hash_file('sha256', Storage::disk('local')->path($revision->stored_path)));
        $shape = DB::table('source_shapes')->where('import_run', $runId)->first();
        $this->getJson('/api/v1/source-shape?'.http_build_query(['sourceRevision' => $revision->id, 'importRun' => $runId, 'pageId' => $shape->page_id, 'shapeId' => $shape->shape_id]))->assertOk()->assertJsonPath('shape.geometry_status', 'not_decoded');
        $this->postJson('/api/v1/imports/'.$runId.'/apply', ['expectedNetworkRevision' => null])->assertUnprocessable();
        $this->assertSame(0, DB::table('network_revisions')->count());
        $this->assertNull(DB::table('active_network_state')->value('network_revision'));
        $duplicate = $this->post('/api/v1/imports', ['file' => new UploadedFile($path, 'renamed.vsdx', null, null, true), 'newDocument' => '1', 'title' => 'Duplicate'], ['Accept' => 'application/json'])->assertOk();
        $duplicate->assertJsonPath('id', $runId)->assertJsonPath('reused', true);
        $this->assertSame(1, DB::table('source_documents')->count());
        $this->assertSame(1, DB::table('import_runs')->count());

        $reprocess = $this->postJson('/api/v1/imports/'.$runId.'/reprocess', [])->assertOk();
        $geometryId = $reprocess->json('id');
        $this->assertNotSame($runId, $geometryId);
        $geometry = DB::table('import_runs')->where('id', $geometryId)->first();
        $this->assertSame($revision->id, $geometry->source_revision);
        $this->assertSame('completed', $geometry->extraction_status, $geometry->error ?? '');
        $this->assertSame('validated', $geometry->semantic_status, $geometry->error ?? '');
        $this->assertSame('staged', $geometry->network_status);
        $geometrySummary = json_decode($geometry->summary, true);
        $this->assertSame('geometry_evidence', $geometrySummary['extractionScope']);
        $this->assertTrue($geometrySummary['geometryDecoded']);
        $this->assertTrue($geometrySummary['topologyProjected']);
        $this->assertTrue($geometrySummary['proposal']['ready']);
        $this->assertGreaterThan(0, $geometrySummary['proposal']['partialFibers']);
        $this->assertSame($runId, $geometrySummary['priorInventoryRun']);
        $this->assertSame(62670, $geometrySummary['summary']['shapes_including_subshapes']);
        $this->assertSame(62670, DB::table('source_shapes')->where('import_run', $geometryId)->count());
        $this->assertSame(330, $geometrySummary['summary']['connect_rows_valid']);
        $this->assertGreaterThan(0, $geometrySummary['pages'][0]['dimensions']['width']);
        $this->assertLessThanOrEqual(256 * 1024 * 1024, $geometrySummary['resources']['peak_working_set_bytes']);
        $this->assertSame('completed', $geometrySummary['progress']['phase']);
        $this->getJson('/api/v1/source-shape?'.http_build_query(['sourceRevision' => $revision->id, 'importRun' => $geometryId, 'pageId' => '0', 'shapeId' => '12643']))->assertOk()->assertJsonPath('shape.effective_style.FillForegnd.rgb', '#0000ff')->assertJsonPath('shape.parent_id', '12640');
        $this->assertSame($run->summary, DB::table('import_runs')->where('id', $runId)->value('summary'));
        $this->assertSame(hash_file('sha256', $path), hash_file('sha256', Storage::disk('local')->path($revision->stored_path)));
        $this->assertSame(0, DB::table('network_revisions')->count());
        $this->postJson('/api/v1/imports/'.$runId.'/reprocess', [])->assertOk()->assertJsonPath('id', $geometryId)->assertJsonPath('reused', true);
        $this->assertSame(1, DB::table('source_documents')->count());
        $this->assertSame(1, DB::table('source_revisions')->count());
        $this->assertSame(2, DB::table('import_runs')->count());
        $this->assertSame(0, DB::table('network_revisions')->count());
        $this->assertNull(DB::table('active_network_state')->value('network_revision'));
        $this->postJson('/api/v1/imports/'.$geometryId.'/apply', ['expectedNetworkRevision' => 'stale-network'])->assertConflict();
        $proposalPath = 'imports/'.$geometryId.'/'.$geometrySummary['proposal']['artifact'];
        $candidate = json_decode(Storage::disk('local')->get($proposalPath), true);
        $data = $candidate['authority'];
        $ap20 = collect($data['networkNodes'])->first(fn ($node) => ($node['apEvidence']['number'] ?? null) === 20)['id'];
        $ap20Cable = collect($data['cables'])->first(fn ($cable) => in_array('25-134-25024-20-20', $cable['legacyLabels'], true));
        $this->assertSame(24, $ap20Cable['fiberCount']);
        $this->assertCount(24, collect($data['fibers'])->where('cableId', $ap20Cable['id']));
        $this->assertCount(24, collect($data['apPorts'])->filter(fn ($port) => $port['canonicalNode']['id'] === $ap20));
        $capacityConflict = collect($data['sourceConflicts'])->firstWhere('kind', 'source_cable_capacity_conflict');
        $this->assertSame(20, $capacityConflict['declaredCapacity']);
        $this->assertSame(24, $capacityConflict['resolvedCapacity']);
        $this->assertSame($ap20Cable['id'], $capacityConflict['cableId']);
        $ap16 = collect($data['networkNodes'])->first(fn ($n) => ($n['apEvidence']['number'] ?? null) === 16)['id'];
        $binding = collect($data['portTopologyBindings'])->first(fn ($b) => $b['ownerId'] === $ap16 && $b['portNumber'] === 1);
        $fiber = collect($data['fibers'])->first(fn ($f) => $f['cableId'] === $binding['segmentId'] && $f['number'] === $binding['fiberNumber']);
        $this->assertSame('blue', $fiber['physicalColor']['key']);
        $this->assertSame(1, $binding['fiberNumber']);
        $this->assertSame(count($data['fibers']), count($data['fiberPathProjection']['paths']));
        $this->assertSame(0, $data['fiberPathProjection']['counts']['unsupportedEdges']);
        unset($candidate, $data);
        $applied = $this->postJson('/api/v1/imports/'.$geometryId.'/apply', ['expectedNetworkRevision' => null])->assertOk()->json('networkRevision');
        $this->assertSame($applied, DB::table('active_network_state')->value('network_revision'));
        $this->assertSame($geometrySummary['proposal']['counts']['fibers'], DB::table('fibers')->where('network_revision', $applied)->count());
        $this->assertSame(24, DB::table('ports')->where('network_revision', $applied)->where('owner_id', $ap20)->count());
        $this->assertSame(1, DB::table('ports')->where('network_revision', $applied)->where('owner_id', $ap16)->where('number', 1)->count());
        $this->assertSame(0, DB::table('ports')->where('network_revision', $applied)->where('owner_id', '16')->count());
        $this->assertSame(1, DB::table('canonical_nodes')->where('network_revision', $applied)->where('local_id', $ap16)->count());
        $this->postJson('/api/v1/imports/'.$geometryId.'/apply', ['expectedNetworkRevision' => $applied])->assertOk()->assertJsonPath('reused', true);
    }

    public function test_package_limits_reject_before_source_records_are_created(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create(['role' => 'reviewer']);
        $this->actingAs($owner);
        $path = dirname(dirname(base_path())).'/Tsageri-Lentekhi 2025.vsdx';
        $upload = fn () => $this->post('/api/v1/imports', ['file' => new UploadedFile($path, 'source.vsdx', null, null, true), 'newDocument' => '1', 'title' => 'Limits'], ['Accept' => 'application/json']);

        config(['fiber_atlas.max_entry_bytes' => 1024 * 1024]);
        $upload()->assertUnprocessable()->assertJsonPath('message', 'VSDX internal file exceeds the 1 MiB staging limit: visio/pages/page1.xml.');
        config(['fiber_atlas.max_entry_bytes' => 128 * 1024 * 1024, 'fiber_atlas.max_uncompressed_bytes' => 1024 * 1024]);
        $upload()->assertUnprocessable()->assertJsonPath('message', 'Expanded VSDX package exceeds the 1 MiB staging limit.');

        $this->assertSame(0, DB::table('source_revisions')->count());
        $this->assertSame(0, DB::table('import_runs')->count());
    }

    public function test_geometry_failure_retry_leases_and_cache_integrity_preserve_history(): void
    {
        $this->assertSame('UTC', DB::selectOne("SELECT current_setting('TimeZone') AS zone")->zone);
        Storage::fake('local');
        $owner = User::factory()->create(['role' => 'reviewer']);
        $this->actingAs($owner);
        $path = Storage::disk('local')->path('bounded-fixture.vsdx');
        $zip = new \ZipArchive;
        $zip->open($path, \ZipArchive::CREATE);
        $zip->addFromString('[Content_Types].xml', '<Types/>');
        $zip->addFromString('visio/document.xml', '<Document/>');
        $zip->addFromString('visio/pages/pages.xml', '<Pages xmlns="http://schemas.microsoft.com/office/visio/2012/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><Page ID="0"><PageSheet><Cell N="PageWidth" V="10"/><Cell N="PageHeight" V="20"/></PageSheet><Rel r:id="r1"/></Page></Pages>');
        $zip->addFromString('visio/pages/_rels/pages.xml.rels', '<Relationships><Relationship Id="r1" Target="page1.xml"/></Relationships>');
        $zip->addFromString('visio/pages/page1.xml', '<PageContents xmlns="http://schemas.microsoft.com/office/visio/2012/main"><Shapes><Shape ID="1"><Text>source evidence</Text></Shape></Shapes></PageContents>');
        $zip->close();
        config(['fiber_atlas.full_extraction_max_bytes' => 1]);
        $original = app(ImportStore::class)->stage($path, 'bounded-fixture.vsdx', null, 'Resource workflow fixture', $owner->id);
        $oldSummary = DB::table('import_runs')->where('id', $original['id'])->value('summary');

        Process::fake(['*' => Process::result(errorOutput: 'Simulated interruption.', exitCode: 1)]);
        $this->postJson('/api/v1/imports/'.$original['id'].'/reprocess', [])->assertServerError();
        $failed = DB::table('import_runs')->where('id', '<>', $original['id'])->first();
        $this->assertSame('failed', $failed->extraction_status);
        $this->assertSame('staged', $failed->network_status);
        Process::swap(new Factory);
        $retry = $this->postJson('/api/v1/imports/'.$original['id'].'/reprocess', [])->assertOk()->json('id');
        $this->assertNotSame($failed->id, $retry);
        $this->assertSame('completed', DB::table('import_runs')->where('id', $retry)->value('extraction_status'));

        $summary = json_decode(DB::table('import_runs')->where('id', $retry)->value('summary'), true);
        $summary['processingLeaseExpiresAt'] = now()->addMinutes(15)->toIso8601String();
        DB::table('import_runs')->where('id', $retry)->update(['extraction_status' => 'running', 'summary' => json_encode($summary)]);
        $this->postJson('/api/v1/imports/'.$original['id'].'/reprocess', [])->assertOk()->assertJsonPath('id', $retry)->assertJsonPath('inProgress', true);
        $summary['processingLeaseExpiresAt'] = now()->subMinute()->toIso8601String();
        DB::table('import_runs')->where('id', $retry)->update(['summary' => json_encode($summary)]);
        $recovered = $this->postJson('/api/v1/imports/'.$original['id'].'/reprocess', [])->assertOk()->json('id');
        $this->assertNotSame($retry, $recovered);
        $this->assertSame('failed', DB::table('import_runs')->where('id', $retry)->value('extraction_status'));
        Storage::disk('local')->delete('imports/'.$recovered.'/geometry/shapes.ndjson.gz');
        $repaired = $this->postJson('/api/v1/imports/'.$original['id'].'/reprocess', [])->assertOk()->json('id');
        $this->assertNotSame($recovered, $repaired);
        $this->assertSame('failed', DB::table('import_runs')->where('id', $recovered)->value('extraction_status'));
        $this->assertSame('completed', DB::table('import_runs')->where('id', $repaired)->value('extraction_status'));
        $this->assertFalse(app(ImportedNetworkStore::class)->prepare($repaired)['ready']);
        $this->assertSame('unsupported', DB::table('import_runs')->where('id', $repaired)->value('semantic_status'));
        $this->assertSame($oldSummary, DB::table('import_runs')->where('id', $original['id'])->value('summary'));
        $this->assertSame(5, DB::table('import_runs')->count());
        $this->assertSame(1, DB::table('source_revisions')->count());
        $this->assertSame(0, DB::table('network_revisions')->count());
        $this->assertSame(0, DB::table('fibers')->count());
        $this->getJson('/api/v1/session')->assertOk()->assertJsonPath('reviewCount', 1);
        $preservedSummary = DB::table('import_runs')->where('id', $repaired)->value('summary');
        DB::table('import_runs')->where('id', $repaired)->update(['interpreter_version' => 'previous-source-rule/33']);
        $upgraded = $this->postJson('/api/v1/imports/'.$original['id'].'/reprocess', [])->assertOk()->json('id');
        $this->assertNotSame($repaired, $upgraded);
        $newSummary = json_decode(DB::table('import_runs')->where('id', $upgraded)->value('summary'), true);
        $this->assertSame($repaired, $newSummary['geometryReusedFrom']);
        $this->assertSame(1, DB::table('source_shapes')->where('import_run', $upgraded)->count());
        $this->assertSame($preservedSummary, DB::table('import_runs')->where('id', $repaired)->value('summary'));
        $this->postJson('/api/v1/imports/'.$original['id'].'/reprocess', [])->assertOk()->assertJsonPath('id', $upgraded)->assertJsonPath('reused', true);
    }

    public function test_original_bytes_first_second_duplicate_revision_and_atomic_apply(): void
    {
        $owner = User::factory()->create(['role' => 'reviewer']);
        $this->actingAs($owner);
        $root = dirname(base_path());
        $sources = dirname($root);
        $import = app(ImportStore::class);
        $network = app(ImportedNetworkStore::class);
        $first = $import->stage($sources.'/Tsageri-Lentekhi 2025.vsdx', 'first.vsdx', null, 'Source A', $owner->id);
        $run = DB::table('import_runs')->where('id', $first['id'])->first();
        $this->assertSame('validated', $run->semantic_status, $run->error ?? '');
        $this->assertNull(DB::table('active_network_state')->value('network_revision'));
        $this->assertSame(0, DB::table('fibers')->count());
        $candidate = DB::table('import_candidates')->where('import_run', $first['id'])->first();
        $p = json_decode($candidate->payload, true);
        $this->getJson('/api/v1/source-shape?'.http_build_query(['sourceRevision' => $first['sourceRevision'], 'importRun' => $first['id'], 'pageId' => $p['pageId'], 'shapeId' => $p['shapeId']]))->assertOk();
        $applied = $network->apply($first['id'], null, $owner->id);
        $revision = $applied['networkRevision'];
        $this->assertSame(1176, DB::table('fibers')->where('network_revision', $revision)->count());
        $duplicate = $import->stage($sources.'/Tsageri-Lentekhi 2025.vsdx', 'renamed.vsdx', null, 'Renamed source', $owner->id);
        $this->assertSame($first['id'], $duplicate['id']);
        $this->assertTrue($duplicate['reused']);
        $this->assertTrue($network->apply($first['id'], $revision, $owner->id)['reused']);
        $second = $import->stage($sources.'/Tsageri-Alpana-Tvishi.vsdx', 'second.vsdx', null, 'Source B', $owner->id);
        $run = DB::table('import_runs')->where('id', $second['id'])->first();
        $this->assertSame('validated', $run->semantic_status, $run->error ?? '');
        $this->postJson('/api/v1/imports/'.$second['id'].'/apply', ['expectedNetworkRevision' => null])->assertConflict();
        $combined = $network->apply($second['id'], $revision, $owner->id)['networkRevision'];
        $this->assertSame(37, DB::table('cable_segments')->where('network_revision', $combined)->count());
        $this->assertSame(2088, DB::table('fibers')->where('network_revision', $combined)->count());
        $this->assertSame(2, DB::table('network_sources')->where('network_revision', $combined)->count());
        $c172 = DB::table('cable_segments')->where('network_revision', $combined)->where('legacy_label', '172')->get();
        $this->assertCount(2, $c172);
        foreach (DB::table('fiber_paths')->where('network_revision', $combined)->get() as $record) {
            $path = json_decode($record->payload, true);
            $this->assertNotEmpty($path['signature']);
            foreach ($path['sides'] as $side) {
                $this->assertNotSame('invalid_transition', $side['stop']['kind']);
            }
        }
        $path = function ($cable, $fiber) use ($combined) {
            return json_decode(DB::table('fiber_paths')->where('network_revision', $combined)->where('id', $cable.':'.$fiber)->value('payload'), true);
        };
        $f32 = $path('CAB-000176', 32);
        $all = json_encode($f32);
        $this->assertStringContainsString('CAB-000175', $all);
        $this->assertStringNotContainsString('CAB-000173', $all);
        $this->assertStringNotContainsString('CAB-000174', $all);
        $this->assertSame('black', $f32['sides'][0]['legs'][0]['fiberColor']['key']);
        $p38 = $path('CAB-000184', 38);
        $all = json_encode($p38);
        $this->assertStringContainsString('CAB-000181', $all);
        $this->assertStringNotContainsString('CAB-000180', $all);
        $this->assertSame('no_transition', $p38['sides'][1]['stop']['kind']);
        $this->assertSame('225', $p38['sides'][1]['stop']['node']['id']);
        foreach ([10, 11, 12] as $n) {
            $p = $path('CAB-000169', $n);
            $this->assertTrue((bool) array_filter($p['sides'], fn ($s) => $s['stop']['segmentId'] === 'CAB-000184' && $s['stop']['fiberNumber'] === $n));
        }
        $this->assertSame(0, DB::table('node_fiber_transitions')->where('network_revision', $combined)->where('transition_type', 'intentional_termination')->count());
        $gap = $path('CAB-000151', 118);
        $this->assertTrue((bool) array_filter($gap['sides'], fn ($s) => $s['stop']['node']['id'] === '207' && $s['stop']['kind'] === 'no_transition'));
        $this->assertStringNotContainsString('SOURCE-B-C152', json_encode($gap));
        $this->assertSame(1615, DB::table('node_fiber_transitions')->where('network_revision', $combined)->count());
        $this->assertSame(384, DB::table('port_topology_bindings')->where('network_revision', $combined)->count());
        $this->assertSame(2088, DB::table('fiber_paths')->where('network_revision', $combined)->count());
        $this->getJson('/api/v1/network')->assertOk()->assertJsonPath('networkRevision', $combined);
        $changed = $root.'/.dev-runtime/iteration32/changed-a.vsdx';
        copy($sources.'/Tsageri-Lentekhi 2025.vsdx', $changed);
        $zip = new \ZipArchive;
        $zip->open($changed);
        $xml = $zip->getFromName('visio/document.xml');
        $zip->addFromString('visio/document.xml', $xml."\n<!-- fresh revision replay -->");
        $zip->close();
        $document = DB::table('source_revisions')->where('id', $first['sourceRevision'])->value('document_id');
        $new = $import->stage($changed, 'changed-a.vsdx', $document, null, $owner->id);
        $job = DB::table('import_runs')->where('id', $new['id'])->first();
        $this->assertSame('validated', $job->semantic_status, $job->error ?? '');
        $this->assertSame($combined, DB::table('active_network_state')->value('network_revision'));
        $updated = $network->apply($new['id'], $combined, $owner->id)['networkRevision'];
        $this->assertNotSame($combined, $updated);
        $this->assertSame(37, DB::table('cable_segments')->where('network_revision', $updated)->count());
        $this->assertSame(2088, DB::table('fibers')->where('network_revision', $updated)->count());
        $renumbered = $root.'/.dev-runtime/iteration32/renumbered-a.vsdx';
        copy($sources.'/Tsageri-Lentekhi 2025.vsdx', $renumbered);
        $zip = new \ZipArchive;
        $zip->open($renumbered);
        $xml = $zip->getFromName('visio/pages/page1.xml');
        $xml = str_replace('172-217-218-48', '999-217-218-48', $xml);
        $zip->addFromString('visio/pages/page1.xml', $xml);
        $zip->close();
        $bad = $import->stage($renumbered, 'renumbered-a.vsdx', $document, null, $owner->id);
        $job = DB::table('import_runs')->where('id', $bad['id'])->first();
        $this->assertSame('unsupported', $job->semantic_status);
        $this->postJson('/api/v1/imports/'.$bad['id'].'/apply', ['expectedNetworkRevision' => $updated])->assertUnprocessable();
        $this->assertSame($updated, DB::table('active_network_state')->value('network_revision'));
        $this->assertSame(2088, DB::table('fibers')->where('network_revision', $updated)->count());
        $this->assertSame(2, DB::table('network_sources')->where('network_revision', $updated)->count());
    }
}
