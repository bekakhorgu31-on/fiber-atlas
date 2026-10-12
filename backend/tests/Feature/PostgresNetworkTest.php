<?php
namespace Tests\Feature;

use App\Models\User;
use App\Services\NetworkStore;
use App\Services\ImportStore;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

final class PostgresNetworkTest extends TestCase
{
    private string $revision;
    protected function setUp(): void
    {
        parent::setUp();
        \App\Support\DatabaseScope::assertDestructiveTestTarget();
        if (DB::getDriverName()!=='pgsql') throw new \RuntimeException('Integration tests require PostgreSQL.');
        $this->artisan('migrate:fresh',['--force'=>true])->assertExitCode(0);
        $store=app(NetworkStore::class);
        $this->revision=$store->seedBaseline();
        $store->activate($this->revision,null,'integration-test');
    }
    public function test_seed_reseed_and_every_persisted_path_transition_binding_match(): void
    {
        $store=app(NetworkStore::class);
        $before=DB::table('fibers')->count();
        $this->assertSame($this->revision,$store->seedBaseline());
        $this->assertSame($before,DB::table('fibers')->count());
        $this->assertSame(37,DB::table('cable_segments')->count());
        $this->assertSame(2088,DB::table('fibers')->count());
        $this->assertSame(1631,DB::table('node_fiber_transitions')->count());
        $this->assertSame(384,DB::table('port_topology_bindings')->count());
        $baseline=json_decode(gzdecode(file_get_contents(dirname(base_path()).'/migration/iteration29/baseline/active-28l-authority.json.gz')),true,flags:JSON_THROW_ON_ERROR);
        foreach (DB::table('fiber_paths')->orderBy('ordinal')->cursor() as $row) $this->assertSame($baseline['fiberPathProjection']['paths'][$row->id],json_decode($row->payload,true,flags:JSON_THROW_ON_ERROR));
        foreach (NetworkStore::CORE as $collection=>$table) {
            $actual=DB::table($table)->where('network_revision',$this->revision)->orderBy('ordinal')->pluck('payload')->map(fn($text)=>json_decode($text,true,flags:JSON_THROW_ON_ERROR))->all();
            $this->assertSame($baseline[$collection],$actual,$collection);
        }
        $this->getJson('/api/v1/network')->assertOk()->assertJsonPath('networkRevision',$this->revision)->assertJsonPath('counts.fibers',2088);
        $this->getJson('/api/v1/network/'.$this->revision.'/details')->assertOk()->assertJsonPath('networkRevision',$this->revision);
        $this->getJson('/api/v1/network/wrong/details')->assertNotFound();
        $row=DB::table('node_fiber_transitions')->where('network_revision',$this->revision)->where('node_id','closure:219')->first();
        try {
            DB::table('node_fiber_transitions')->insert(array_merge((array)$row,['id'=>'INVALID-SKIPPED-NODE','node_id'=>'closure:218']));
            $this->fail('A skipped-node transition was accepted.');
        } catch (QueryException $error) { $this->assertTrue(str_contains($error->getMessage(),'real cable endpoint')||str_contains($error->getMessage(),'immutable')); }
        try {
            DB::table('fibers')->where('network_revision',$this->revision)->where('id',$baseline['fibers'][0]['id'])->update(['payload'=>NetworkStore::json(['id'=>'corrupt'])]);
            $this->fail('Validated authority was changed.');
        } catch(QueryException $error) { $this->assertStringContainsString('immutable',$error->getMessage()); }
        $store->validateRevision($this->revision);
    }
    public function test_review_is_authorized_attributed_append_only_and_rejects_stale_versions(): void
    {
        $subject=json_decode(DB::table('domain_records')->where('collection','sourceReviewCases')->first()->payload,true)['id'];
        $input=['expectedNetworkRevision'=>$this->revision,'subjectId'=>$subject,'expectedReviewVersion'=>0,'action'=>'unresolved','reason'=>'PostgreSQL integration review; no topology mutation.'];
        $this->postJson('/api/v1/review-events',$input)->assertUnauthorized();
        $viewer=User::factory()->create(['role'=>'viewer']);
        $reviewer=User::factory()->create(['role'=>'reviewer']);
        $this->actingAs($viewer)->postJson('/api/v1/review-events',$input)->assertForbidden();
        $digest=app(NetworkStore::class)->recordDigests($this->revision);
        $this->actingAs($reviewer)->postJson('/api/v1/review-events',$input+['actor_id'=>$viewer->id])->assertCreated()->assertJsonPath('event.actor_id',$reviewer->id)->assertJsonPath('event.version',1);
        $this->postJson('/api/v1/review-events',$input)->assertConflict();
        $this->postJson('/api/v1/review-events',array_replace($input,['expectedNetworkRevision'=>'stale']))->assertConflict();
        $this->postJson('/api/v1/review-events',array_replace($input,['subjectId'=>'unknown']))->assertUnprocessable();
        $this->assertSame($digest,app(NetworkStore::class)->recordDigests($this->revision));
        DB::purge(); DB::reconnect();
        $this->getJson('/api/v1/network/'.$this->revision.'/review-events')->assertOk()->assertJsonPath('events.0.reason',$input['reason']);
        $this->assertSame(1,DB::table('review_events')->count());
        try { DB::table('review_events')->update(['reason'=>'overwrite']); $this->fail('Audit history was overwritten.'); }
        catch (QueryException $error) { $this->assertStringContainsString('append-only',$error->getMessage()); }
        $this->assertSame($input['reason'],DB::table('review_events')->value('reason'));
    }
    public function test_failed_activation_preserves_active_revision_and_rollback_keeps_pinned_reads(): void
    {
        $store=app(NetworkStore::class);
        $record=(array)DB::table('network_revisions')->where('id',$this->revision)->first();
        DB::table('network_revisions')->insert(array_replace($record,['id'=>'INCOMPLETE-REVISION']));
        try { $store->activate('INCOMPLETE-REVISION',$this->revision,'test');$this->fail('Incomplete activation succeeded.'); }
        catch (\RuntimeException $error) { $this->assertStringContainsString('stale',$error->getMessage()); }
        $this->assertSame($this->revision,$store->activeRevision());
        $other=$this->revision.'-SECOND';
        DB::table('network_revisions')->insert(array_replace($record,['id'=>$other,'status'=>'preparing']));
        $tables=['network_sources','canonical_nodes','cable_segments','tubes','fibers','ports','node_fiber_transitions','port_topology_bindings','domain_records','network_attributes','fiber_paths'];
        foreach ($tables as $table) {
            foreach (DB::table($table)->where('network_revision',$this->revision)->orderBy('network_revision')->get()->chunk(100) as $chunk) {
                DB::table($table)->insert($chunk->map(fn($row)=>array_replace((array)$row,['network_revision'=>$other]))->all());
            }
        }
        foreach (DB::table('projection_snapshots')->where('network_revision',$this->revision)->get() as $projection) {
            $payload=json_decode($projection->payload,true,flags:JSON_THROW_ON_ERROR);$payload['networkRevision']=$other;$text=NetworkStore::json($payload);
            DB::table('projection_snapshots')->insert(['network_revision'=>$other,'kind'=>$projection->kind,'payload'=>$text,'sha256'=>hash('sha256',$text)]);
        }
        DB::table('network_revisions')->where('id',$other)->update(['status'=>'validated']);
        $store->activate($other,$this->revision,'test');
        $this->getJson('/api/v1/network')->assertOk()->assertJsonPath('networkRevision',$other);
        $this->getJson('/api/v1/network/'.$this->revision.'/details')->assertOk()->assertJsonPath('networkRevision',$this->revision);
        $store->activate($this->revision,$other,'test','rollback');
        $this->assertSame($this->revision,$store->activeRevision());
        $this->assertSame('rollback',DB::table('activation_events')->orderByDesc('created_at')->value('operation'));
    }
    public function test_staging_preserves_source_revisions_repeat_interpretations_and_active_graph(): void
    {
        $reviewer=User::factory()->create(['role'=>'reviewer']);
        $this->actingAs($reviewer);
        $root=dirname(base_path());$sourceDirectory=dirname($root);
        $digest=app(NetworkStore::class)->recordDigests($this->revision);
        $sourceA=DB::table('source_revisions')->where('original_name','Tsageri-Lentekhi 2025.vsdx')->first();
        $sourceB=DB::table('source_revisions')->where('original_name','Tsageri-Alpana-Tvishi.vsdx')->first();
        $upload=fn($path,$name,$doc)=>$this->post('/api/v1/imports',['file'=>new UploadedFile($path,$name,null,null,true),'documentId'=>$doc],['Accept'=>'application/json']);
        $first=$upload($sourceDirectory.'/Tsageri-Lentekhi 2025.vsdx','Tsageri-Lentekhi 2025.vsdx',$sourceA->document_id)->assertCreated()->json();
        $candidate=DB::table('import_candidates')->where('import_run',$first['id'])->first();
        $this->postJson('/api/v1/review-events',['expectedNetworkRevision'=>$this->revision,'subjectId'=>$candidate->id,'expectedReviewVersion'=>0,'action'=>'accepted','reason'=>'Candidate review only; no network activation.','sourceRevision'=>$first['sourceRevision']])->assertCreated();
        $upload($sourceDirectory.'/Tsageri-Lentekhi 2025.vsdx','renamed.vsdx',$sourceA->document_id)->assertOk()->assertJsonPath('id',$first['id'])->assertJsonPath('reused',true);
        $second=$upload($sourceDirectory.'/Tsageri-Alpana-Tvishi.vsdx','Tsageri-Alpana-Tvishi.vsdx',$sourceB->document_id)->assertCreated()->json();
        $this->assertSame(2,DB::table('source_documents')->count());
        $this->assertSame(2,DB::table('source_revisions')->count());
        $this->assertSame(2,DB::table('import_runs')->count());
        $this->assertSame('completed',DB::table('import_runs')->where('id',$first['id'])->value('extraction_status'));
        $this->assertSame('failed',DB::table('import_runs')->where('id',$first['id'])->value('semantic_status'));
        $this->assertStringContainsString('historical baseline cannot enter',DB::table('import_runs')->where('id',$first['id'])->value('error'));
        $this->assertSame('staged',DB::table('import_runs')->where('id',$first['id'])->value('network_status'));
        $this->assertSame(17056,DB::table('source_shapes')->count());
        foreach([$first,$second] as $run) {
            $query=http_build_query(['networkRevision'=>$this->revision,'sourceRevision'=>$run['sourceRevision'],'pageId'=>'4','shapeId'=>'17661','importRun'=>$run['id']]);
            $this->getJson('/api/v1/source-shape?'.$query)->assertOk()->assertJsonPath('sourceRevision',$run['sourceRevision'])->assertJsonPath('importRun',$run['id'])->assertJsonPath('shape.text',$run['id']===$first['id']?'Open net':'ოუფენ ნეტი');
        }
        config(['fiber_atlas.interpreter_version'=>'integration-next-rule-version']);
        $third=$upload($sourceDirectory.'/Tsageri-Lentekhi 2025.vsdx','same.vsdx',$sourceA->document_id)->assertCreated()->json();
        $this->assertNotSame($first['id'],$third['id']);
        $this->assertSame($first['sourceRevision'],$third['sourceRevision']);
        $this->assertSame(2,DB::table('source_revisions')->count());
        config(['fiber_atlas.interpreter_version'=>'staged-label-candidate/1']);
        $changed=$root.'/.dev-runtime/integration-changed-source.vsdx';
        copy($sourceDirectory.'/Tsageri-Lentekhi 2025.vsdx',$changed);
        $zip=new \ZipArchive();$this->assertTrue($zip->open($changed));
        $xml=$zip->getFromName('visio/pages/page1.xml');
        $this->assertStringContainsString('172-217-218-48',$xml);
        $zip->addFromString('visio/pages/page1.xml',str_replace('172-217-218-48','172-217-218-47',$xml));$zip->close();
        $changedRun=$upload($changed,'Tsageri-Lentekhi 2025.vsdx',$sourceA->document_id)->assertCreated()->json();
        $this->assertNotSame($first['sourceRevision'],$changedRun['sourceRevision']);
        $this->assertSame(3,DB::table('source_revisions')->count());
        $summary=json_decode(DB::table('import_runs')->where('id',$changedRun['id'])->value('summary'),true);
        $this->assertContains('172-217-218-47',$summary['stagedLabelDiff']['added']);
        $this->assertContains('172-217-218-48',$summary['stagedLabelDiff']['removed']);
        $this->assertGreaterThan(0,$summary['sourceShapeDiff']['counts']['changed']);
        $this->assertGreaterThan(0,$summary['sourceShapeDiff']['counts']['canonicalImpactUnresolved']);
        $this->post('/api/v1/imports',['file'=>UploadedFile::fake()->create('corrupt.vsdx',1),'documentId'=>$sourceA->document_id],['Accept'=>'application/json'])->assertUnprocessable();
        $this->post('/api/v1/imports',['file'=>new UploadedFile($sourceDirectory.'/Tsageri-Lentekhi 2025.vsdx','same.vsdx',null,null,true)],['Accept'=>'application/json'])->assertUnprocessable();
        $this->assertSame($digest,app(NetworkStore::class)->recordDigests($this->revision));
        $this->assertSame($this->revision,app(NetworkStore::class)->activeRevision());
        $this->assertSame(2088,DB::table('fibers')->count());
        $this->assertSame(1,DB::table('review_events')->where('subject_id',$candidate->id)->count());
        $this->assertSame('accepted',DB::table('review_events')->where('subject_id',$candidate->id)->value('action'));
    }
}
