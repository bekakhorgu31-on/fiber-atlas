<?php
// Metadata only. Do not boot Laravel or print protected configuration/errors.
require dirname(__DIR__).'/backend/vendor/autoload.php';
$root=dirname(__DIR__);
$env=Dotenv\Dotenv::parse(file_get_contents($root.'/backend/.env'));
$schema='bkhorguashvili';
try {
    $dsn='pgsql:host='.$env['DB_HOST'].';port='.$env['DB_PORT'].';dbname='.$env['DB_DATABASE'].';connect_timeout=6;sslmode='.($env['DB_SSLMODE']??'prefer');
    foreach(['DB_SSLROOTCERT'=>'sslrootcert','DB_SSLCERT'=>'sslcert','DB_SSLKEY'=>'sslkey'] as $key=>$option)if(!empty($env[$key]))$dsn.=';'.$option.'='.$env[$key];
    $db=new PDO($dsn,$env['DB_USERNAME'],$env['DB_PASSWORD'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
    $db->exec('BEGIN READ ONLY');$db->exec("SET LOCAL statement_timeout='5s'");
    $fetch=function(string $sql,array $args=[])use($db){$q=$db->prepare($sql);$q->execute($args);return $q->fetchAll(PDO::FETCH_ASSOC);};
    $report=['checkedAt'=>gmdate('c'),'scope'=>$schema,'readOnly'=>true];
    $report['connection']=$fetch("SELECT current_database() AS database,current_user AS role,version(),current_setting('search_path') AS search_path,current_setting('transaction_read_only') AS read_only")[0];
    $report['tls']=$fetch('SELECT ssl,version,cipher,bits FROM pg_stat_ssl WHERE pid=pg_backend_pid()')[0];
    $report['schema']=$fetch('SELECT n.nspname,pg_get_userbyid(n.nspowner) AS owner,has_schema_privilege(n.oid,\'USAGE\') AS usage,has_schema_privilege(n.oid,\'CREATE\') AS can_create FROM pg_namespace n WHERE n.nspname=?',[$schema]);
    $report['tables']=$fetch("SELECT c.relname,c.relkind,pg_get_userbyid(c.relowner) AS owner,has_table_privilege(c.oid,'SELECT') AS can_select,has_table_privilege(c.oid,'INSERT') AS can_insert,has_table_privilege(c.oid,'UPDATE') AS can_update FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=? AND c.relkind IN ('r','p','v','m','S','f') ORDER BY c.relname",[$schema]);
    $report['columns']=$fetch('SELECT table_name,column_name,ordinal_position,data_type,udt_name,is_nullable,column_default,is_identity,identity_generation FROM information_schema.columns WHERE table_schema=? ORDER BY table_name,ordinal_position',[$schema]);
    $report['constraints']=$fetch('SELECT c.relname AS table_name,k.conname,k.contype,pg_get_constraintdef(k.oid,true) AS definition FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=? ORDER BY c.relname,k.conname',[$schema]);
    $report['indexes']=$fetch('SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname=? ORDER BY tablename,indexname',[$schema]);
    $report['functions']=$fetch('SELECT p.proname,pg_get_function_identity_arguments(p.oid) AS arguments,pg_get_userbyid(p.proowner) AS owner,p.prokind,p.proconfig,pg_get_functiondef(p.oid) AS definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname=? AND p.prokind IN (\'f\',\'p\') ORDER BY p.proname',[$schema]);
    $report['triggers']=$fetch('SELECT c.relname AS table_name,t.tgname,pg_get_triggerdef(t.oid,true) AS definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=? AND NOT t.tgisinternal ORDER BY c.relname,t.tgname',[$schema]);
    $report['types']=$fetch("SELECT t.typname,t.typtype,string_agg(e.enumlabel,',' ORDER BY e.enumsortorder) AS enum_values FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace LEFT JOIN pg_enum e ON e.enumtypid=t.oid WHERE n.nspname=? GROUP BY t.typname,t.typtype ORDER BY t.typname",[$schema]);
    $report['sequences']=$fetch('SELECT sequencename,sequenceowner,data_type,start_value,min_value,max_value,increment_by,cycle FROM pg_sequences WHERE schemaname=? ORDER BY sequencename',[$schema]);
    $report['rowCounts']=[];
    foreach($report['tables'] as $table)if(in_array($table['relkind'],['r','p'],true)&&$table['can_select']) {
        $name='"'.$schema.'"."'.str_replace('"','""',$table['relname']).'"';
        $report['rowCounts'][$table['relname']]=$db->query('SELECT count(*) FROM '.$name)->fetchColumn();
    }
    $db->rollBack();
    $output=$argv[1]??'iteration30-server-inventory.json';
    if(!preg_match('/^iteration30-[a-z0-9-]+\.json$/D',$output))throw new RuntimeException('Invalid report filename.');
    file_put_contents($root.'/docs/'.$output,json_encode($report,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)."\n");
    echo json_encode(['schema'=>$schema,'objects'=>count($report['tables']),'functions'=>count($report['functions']),'types'=>count($report['types']),'tls'=>$report['tls'],'readOnly'=>true],JSON_THROW_ON_ERROR).PHP_EOL;
}catch(Throwable $e){if(isset($db)&&$db->inTransaction())$db->rollBack();fwrite(STDERR,'Scoped metadata inspection failed; credentials and raw connection errors withheld. '.get_class($e).PHP_EOL);exit(1);}
