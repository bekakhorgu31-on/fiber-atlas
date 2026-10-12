<?php
namespace Tests\Feature;
use App\Support\DatabaseScope;
use App\Services\NetworkStore;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;
use Tests\TestCase;

final class SchemaIsolationTest extends TestCase
{
    public function test_non_public_schema_and_pinned_functions_leave_sentinel_schema_untouched():void
    {
        if(DatabaseScope::schema()!=='fiber_isolation')$this->markTestSkipped('Dedicated isolation profile only.');
        DatabaseScope::assertDestructiveTestTarget();
        $role=DB::selectOne('SELECT current_user AS name,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) AS super');
        $this->assertSame('fiber_schema_test',$role->name);$this->assertFalse($role->super);
        $before=$this->publicFingerprint();
        $this->artisan('migrate:fresh',['--force'=>true])->assertExitCode(0);
        $this->assertSame(0,DB::table('fibers')->count());
        $this->assertSame($before,$this->publicFingerprint());
        $store=app(NetworkStore::class);$revision=$store->seedBaseline();$store->activate($revision,null,'isolation-test');
        $this->getJson('/api/v1/network')->assertOk()->assertJsonPath('networkRevision',$revision);
        $this->assertSame(2088,DB::table('fibers')->count());
        $objects=DB::select("SELECT n.nspname,c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='migrations' AND n.nspname IN ('fiber_isolation','public')");
        $this->assertCount(2,$objects);
        $functions=DB::select("SELECT p.proname,p.proconfig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='fiber_isolation' AND p.proname LIKE 'fiber_%'");
        $this->assertCount(3,$functions);foreach($functions as $function)$this->assertStringContainsString('fiber_isolation',$function->proconfig);
        $record=(array)DB::table('network_revisions')->where('id',$revision)->first();$record['id']='ISOLATION-ONLY';DB::table('network_revisions')->insert($record);
        DB::statement('SET search_path TO public');
        try {
            DB::insert('INSERT INTO fiber_isolation.domain_records(network_revision,id,ordinal,payload,collection) VALUES (?,?,?,?,?)',['ISOLATION-ONLY','sentinel-probe',0,'{}','test']);
            $this->fail('Trigger read the caller/public schema instead of its pinned schema.');
        }catch(QueryException $e){$this->assertStringContainsString('immutable',$e->getMessage());}
        DB::statement('SET search_path TO fiber_isolation');
        $this->assertSame($before,$this->publicFingerprint());
        config(['database.fiber_profile'=>'server']);
        $this->expectException(\RuntimeException::class);$this->expectExceptionMessage('limited');DatabaseScope::assertDestructiveTestTarget();
    }
    private function publicFingerprint():array
    {
        $result=[];
        foreach(['migrations','users','fibers','network_revisions','projection_snapshots']as $table)$result[$table]=DB::selectOne("SELECT md5(string_agg(md5(to_jsonb(t)::text), '' ORDER BY to_jsonb(t)::text)) AS fingerprint FROM public.$table t")->fingerprint;
        $result['functions']=array_map(fn($row)=>(array)$row,DB::select("SELECT p.proname,pg_get_functiondef(p.oid) AS body FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname LIKE 'fiber_%' ORDER BY p.proname"));
        return $result;
    }
}
