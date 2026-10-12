<?php
$root=dirname(__DIR__);require $root.'/backend/vendor/autoload.php';
$app=require $root.'/backend/bootstrap/app.php';$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;
use App\Support\DatabaseScope;
use App\Services\NetworkStore;
try {
    DatabaseScope::assertTarget();
    if(DatabaseScope::profile()!=='server')throw new RuntimeException('Expected server profile.');
    DB::beginTransaction();DB::statement('SET TRANSACTION READ ONLY');DB::statement("SET LOCAL statement_timeout='30s'");
    $manifest=json_decode(file_get_contents($root.'/migration/iteration29/baseline/active-28l-operational-manifest.json'),true,flags:JSON_THROW_ON_ERROR);
    $revision=$manifest['networkRevision'];$store=app(NetworkStore::class);$store->validateRevision($revision);
    $baseline=json_decode(gzdecode(file_get_contents($root.'/migration/iteration29/baseline/active-28l-authority.json.gz')),true,flags:JSON_THROW_ON_ERROR);
    $counts=[];
    foreach(NetworkStore::CORE as $collection=>$table) {
        $rows=DB::table($table)->where('network_revision',$revision)->orderBy('ordinal')->pluck('payload')->all();
        if(count($rows)!==count($baseline[$collection]))throw new RuntimeException('Collection count mismatch.');
        foreach($rows as $i=>$text)if(json_decode($text,true,flags:JSON_THROW_ON_ERROR)!==$baseline[$collection][$i])throw new RuntimeException('Persisted authority differs.');
        $counts[$collection]=count($rows);
    }
    $paths=0;
    foreach(DB::table('fiber_paths')->where('network_revision',$revision)->orderBy('ordinal')->cursor()as$row) {
        if(json_decode($row->payload,true,flags:JSON_THROW_ON_ERROR)!==$baseline['fiberPathProjection']['paths'][$row->id])throw new RuntimeException('Persisted path differs.');
        $paths++;
    }
    $wrongRelations=DB::select("SELECT conname FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_class p ON p.oid=k.confrelid JOIN pg_namespace pn ON pn.oid=p.relnamespace WHERE n.nspname='bkhorguashvili' AND pn.nspname<>'bkhorguashvili'");
    if($wrongRelations)throw new RuntimeException('Cross-schema foreign key found.');
    $report=['verifiedAt'=>gmdate('c'),'schema'=>DatabaseScope::schema(),'profile'=>DatabaseScope::profile(),'connection'=>DB::selectOne('SELECT current_database() AS database,current_user AS role,current_schema() AS schema,current_setting(\'search_path\') AS search_path'),'tls'=>DB::selectOne('SELECT ssl,version,cipher FROM pg_stat_ssl WHERE pid=pg_backend_pid()'),'networkRevision'=>$revision,'activeRevision'=>DB::table('active_network_state')->where('id',1)->value('network_revision'),'counts'=>$counts,'exactPathsCompared'=>$paths,'currentLineages'=>count($baseline['currentFiberLineages']),'crossSchemaForeignKeys'=>0,'readOnly'=>true];
    DB::rollBack();
    file_put_contents($root.'/docs/iteration30-server-verification.json',json_encode($report,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)."\n");
    echo json_encode(['schema'=>$report['schema'],'counts'=>$counts,'paths'=>$paths,'activeRevision'=>$report['activeRevision'],'readOnly'=>true],JSON_THROW_ON_ERROR).PHP_EOL;
}catch(Throwable$e){if(DB::transactionLevel()>0)DB::rollBack();fwrite(STDERR,'Scoped server verification failed; sensitive details withheld. '.get_class($e).PHP_EOL);exit(1);}
