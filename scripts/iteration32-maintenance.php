<?php
/** Narrow seed cleanup. Backup/restore and exact row fingerprints are mandatory gates. */
require dirname(__DIR__).'/backend/vendor/autoload.php';
$root=dirname(__DIR__);$directory=$root.'/.dev-runtime/iteration32-backup';
if(!is_dir($directory))mkdir($directory,0700,true);
$mode=$argv[1]??'backup';$schema='bkhorguashvili';$manifestPath=$directory.'/manifest.json';
$business=['review_events','review_subject_versions','activation_events','fiber_paths','projection_snapshots','network_attributes','domain_records','port_topology_bindings','node_fiber_transitions','ports','fibers','tubes','cable_segments','canonical_nodes','network_sources','network_revisions','source_shapes','import_candidates','import_runs','source_revisions','source_documents'];
$preserved=['migrations','users','password_reset_tokens','sessions','cache','cache_locks','jobs','job_batches','failed_jobs','active_network_state'];
$bin=$root.'/.dev-runtime/postgresql/pgsql/bin/';
function connection(array $settings):PDO {
    $db=new PDO('pgsql:host='.$settings['host'].';port='.$settings['port'].';dbname='.$settings['database'].';sslmode='.($settings['sslmode']??'disable').';connect_timeout=8',$settings['user'],$settings['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
    $db->exec("SET TIME ZONE 'UTC'; SET search_path TO bkhorguashvili");return $db;
}
function runPg(array $command,array $settings):void {
    $environment=getenv();$environment['PGPASSWORD']=$settings['password'];$environment['PGSSLMODE']=$settings['sslmode']??'disable';$environment['PGCONNECT_TIMEOUT']='8';
    $process=proc_open($command,[0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']],$pipes,null,$environment);
    if(!is_resource($process))throw new RuntimeException('Could not launch PostgreSQL utility.');
    fclose($pipes[0]);$output=stream_get_contents($pipes[1]);$error=stream_get_contents($pipes[2]);fclose($pipes[1]);fclose($pipes[2]);
    if(proc_close($process)!==0)throw new RuntimeException('PostgreSQL utility failed. '.substr($error,0,1000));
}
function inventory(PDO $db,string $schema,bool $stable=true):array {
    $tables=$db->prepare("SELECT table_name FROM information_schema.tables WHERE table_schema=? AND table_type='BASE TABLE' ORDER BY table_name");$tables->execute([$schema]);$rows=[];
    foreach($tables->fetchAll(PDO::FETCH_COLUMN)as $table){if(!preg_match('/^[a-z_]+$/D',$table))throw new RuntimeException('Unexpected table identifier.');$order='to_jsonb(t)::text'.($stable?' COLLATE "C"':'');$rows[$table]=$db->query('SELECT count(*)::integer AS count,md5(string_agg(md5(to_jsonb(t)::text),\'\' ORDER BY '.$order.')) AS fingerprint FROM "'.$schema.'"."'.$table.'" t')->fetch(PDO::FETCH_ASSOC);}
    return $rows;
}
function objects(PDO $db,string $schema):array {
    $q=$db->prepare("SELECT p.proname,pg_get_functiondef(p.oid) AS definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname=? AND p.prokind='f' ORDER BY p.proname");$q->execute([$schema]);$functions=$q->fetchAll(PDO::FETCH_ASSOC);
    $q=$db->prepare("SELECT c.relname,t.tgname,t.tgenabled,pg_get_triggerdef(t.oid) AS definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=? AND NOT t.tgisinternal ORDER BY c.relname,t.tgname");$q->execute([$schema]);$triggers=$q->fetchAll(PDO::FETCH_ASSOC);
    $q=$db->prepare("SELECT c.relname,k.conname,pg_get_constraintdef(k.oid,true) AS definition FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=? ORDER BY c.relname,k.conname");$q->execute([$schema]);
    return ['functions'=>$functions,'triggers'=>$triggers,'constraints'=>$q->fetchAll(PDO::FETCH_ASSOC)];
}
try{
    $env=Dotenv\Dotenv::parse(file_get_contents($root.'/backend/.env'));
    if(($env['DB_PROFILE']??'')!=='server'||$env['DB_HOST']!=='10.0.61.15'||$env['DB_DATABASE']!=='on'||$env['DB_USERNAME']!==$schema||$env['DB_SCHEMA']!==$schema||$env['DB_SSLMODE']!=='require')throw new RuntimeException('Protected server target differs from the approved scope.');
    $server=['host'=>$env['DB_HOST'],'port'=>$env['DB_PORT'],'database'=>$env['DB_DATABASE'],'user'=>$env['DB_USERNAME'],'password'=>$env['DB_PASSWORD'],'sslmode'=>$env['DB_SSLMODE']];
    $cluster=json_decode(file_get_contents($root.'/.dev-runtime/postgres-settings.json'),true,flags:JSON_THROW_ON_ERROR);
    $local=['host'=>'127.0.0.1','port'=>$cluster['port'],'database'=>'fiber_atlas_restore32','user'=>$cluster['user'],'password'=>$cluster['password']];
    if($mode==='backup'){
        $db=connection($server);$db->exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
        $identity=$db->query('SELECT current_database() AS database,current_user AS role,inet_server_addr()::text AS address,(SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()) AS tls')->fetch(PDO::FETCH_ASSOC);
        if($identity['database']!=='on'||$identity['role']!==$schema||!$identity['tls'])throw new RuntimeException('Server identity/TLS mismatch.');
        $rows=inventory($db,$schema);$definitions=objects($db,$schema);
        $revisions=$db->query('SELECT id,status FROM bkhorguashvili.network_revisions ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
        if(count($revisions)!==1||$revisions[0]['id']!=='NETWORK-28L-397cb29f8c3b0280-OP1-8109aecedeb6'||$revisions[0]['status']!=='validated')throw new RuntimeException('Unidentified or newer network data; cleanup is not eligible.');
        if($db->query('SELECT network_revision FROM bkhorguashvili.active_network_state WHERE id=1')->fetchColumn()!==null)throw new RuntimeException('An active network has appeared.');
        if(($rows['import_runs']['count']??0)!==0||($rows['review_events']['count']??0)!==0||($rows['activation_events']['count']??0)!==0)throw new RuntimeException('New import/review/activation data appeared; do not classify it as seed.');
        $seedSources=$db->query("SELECT s.id,s.document_id,s.sha256,s.stored_path,s.metadata->>'basis' AS basis FROM bkhorguashvili.source_revisions s JOIN bkhorguashvili.network_sources n ON n.source_revision=s.id")->fetchAll(PDO::FETCH_ASSOC);
        if(count($seedSources)!==2||$rows['source_revisions']['count']!==2||$rows['source_documents']['count']!==2)throw new RuntimeException('Unidentified source records appeared.');
        foreach($seedSources as $source)if($source['basis']!=='reviewed-baseline'||$source['stored_path']!==null||!in_array($source['sha256'],['caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa','419def34f310a581f0194023da0d25f6b8b44172e45b0a7b2d7785beeb11dd6d'],true))throw new RuntimeException('Source is not the identified historical seed.');
        $dump=$directory.'/schema-'.gmdate('Ymd-His').'.dump';
        runPg([$bin.'pg_dump.exe','-h',$server['host'],'-p',(string)$server['port'],'-U',$server['user'],'-d',$server['database'],'--no-password','--format=custom','--schema='.$schema,'--file='.$dump],$server);
        $db->commit();
        $manifest=['version'=>1,'createdAt'=>gmdate('c'),'target'=>array_diff_key($server,['password'=>true]),'schema'=>$schema,'dump'=>$dump,'dumpSha256'=>hash_file('sha256',$dump),'rows'=>$rows,'objects'=>$definitions,'revisions'=>array_column($revisions,'id'),'seedSources'=>$seedSources,'businessTables'=>$business,'exclusions'=>$preserved,'physicalFiles'=>'All original and shared content-addressed files retained.','restorationVerified'=>false,'cleanupLocalVerified'=>false];
        file_put_contents($manifestPath,json_encode($manifest,JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR));
        echo "Schema-scoped backup saved; target fingerprints recorded. No server writes.\n";
    }elseif($mode==='normalize-fingerprints'){
        $manifest=json_decode(file_get_contents($manifestPath),true,flags:JSON_THROW_ON_ERROR);$db=connection($server);
        if(inventory($db,$schema,false)!==$manifest['rows']||objects($db,$schema)!==$manifest['objects'])throw new RuntimeException('Original backup target changed; cannot normalize verification.');
        $normalized=inventory($db,$schema);$restored=connection($local);
        if(inventory($restored,$schema)!==$normalized||objects($restored,$schema)!==$manifest['objects'])throw new RuntimeException('Restored row contents still differ under byte ordering.');
        $manifest['rows']=$normalized;$manifest['fingerprintMethod']='json-row-md5-ordered-by-C-collation/1';file_put_contents($manifestPath,json_encode($manifest,JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR));echo "Cross-platform fingerprint ordering normalized; every restored row and safeguard matches.\n";
    }elseif(in_array($mode,['restore','verify-restore'],true)){
        $manifest=json_decode(file_get_contents($manifestPath),true,flags:JSON_THROW_ON_ERROR);
        if(hash_file('sha256',$manifest['dump'])!==$manifest['dumpSha256'])throw new RuntimeException('Backup checksum mismatch.');
        $admin=connection(array_replace($local,['database'=>'postgres']));
        $q=$admin->prepare('SELECT 1 FROM pg_database WHERE datname=?');$q->execute([$local['database']]);
        $exists=(bool)$q->fetchColumn();
        if($mode==='restore'){
            if($exists)throw new RuntimeException('Restore target already exists; preserve it rather than resetting it.');
            $admin->exec('CREATE DATABASE fiber_atlas_restore32 TEMPLATE template0 ENCODING \'UTF8\'');
            runPg([$bin.'pg_restore.exe','-h','127.0.0.1','-p',(string)$local['port'],'-U',$local['user'],'-d',$local['database'],'--no-password','--no-owner','--no-privileges','--exit-on-error',$manifest['dump']],$local);
        }elseif(!$exists){throw new RuntimeException('No restored target exists.');}
        $db=connection($local);
        $restoredRows=inventory($db,$schema);$restoredObjects=objects($db,$schema);
        if($restoredRows!==$manifest['rows']||$restoredObjects!==$manifest['objects']){
            $diff=['tables'=>[],'objects'=>[]];foreach($restoredRows as $table=>$row)if($row!==$manifest['rows'][$table])$diff['tables'][$table]=['expected'=>$manifest['rows'][$table],'actual'=>$row];foreach($restoredObjects as $kind=>$rows)if($rows!==$manifest['objects'][$kind])$diff['objects'][$kind]=['expected'=>$manifest['objects'][$kind],'actual'=>$rows];
            file_put_contents($directory.'/restore-diff.json',json_encode($diff,JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR));
            throw new RuntimeException('Restoration differs in tables '.implode(',',array_keys($diff['tables'])).'; object groups '.implode(',',array_keys($diff['objects'])).'.');
        }
        $manifest['restorationVerified']=true;$manifest['restoreDatabase']=$local['database'];$manifest['restoredAt']=gmdate('c');file_put_contents($manifestPath,json_encode($manifest,JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR));
        echo "Restoration verified: every table fingerprint, constraint, function and trigger matches.\n";
    }elseif(in_array($mode,['cleanup-local','cleanup-server'],true)){
        $manifest=json_decode(file_get_contents($manifestPath),true,flags:JSON_THROW_ON_ERROR);
        if(!$manifest['restorationVerified']||hash_file('sha256',$manifest['dump'])!==$manifest['dumpSha256'])throw new RuntimeException('Verified backup is required.');
        if($mode==='cleanup-server'&&!$manifest['cleanupLocalVerified'])throw new RuntimeException('Successful local cleanup/rollback proof required.');
        if($mode==='cleanup-server'&&($env['FIBER_SERVER_WRITES_ENABLED']??'')!=='true')throw new RuntimeException('Explicit protected server write gate is closed.');
        if($mode==='cleanup-server'&&is_file($root.'/.dev-runtime/api-server.json'))throw new RuntimeException('Stop the loopback app before server maintenance.');
        $db=connection($mode==='cleanup-local'?$local:$server);$db->beginTransaction();
        foreach([...$business,...$preserved]as $table){$db->exec('LOCK TABLE "'.$schema.'"."'.$table.'" IN ACCESS EXCLUSIVE MODE');}
        $before=inventory($db,$schema);$definitions=objects($db,$schema);
        if($before!==$manifest['rows']||$definitions!==$manifest['objects'])throw new RuntimeException('Fresh locked target differs from backup manifest; cleanup aborted.');
        $external=$db->prepare("SELECT count(*) FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_class d ON d.oid=k.confrelid JOIN pg_namespace m ON m.oid=d.relnamespace WHERE k.contype='f' AND m.nspname=? AND n.nspname<>?");$external->execute([$schema,$schema]);if($external->fetchColumn()!=0)throw new RuntimeException('Cross-schema dependent foreign keys require a new plan.');
        $disabled=[];
        foreach($definitions['triggers']as $trigger)if(in_array($trigger['relname'],$business,true)&&($before[$trigger['relname']]['count']??0)>0&&in_array($trigger['tgname'],['sealed_snapshot','immutable_review_events','immutable_activation_events'],true)){$db->exec('ALTER TABLE "'.$schema.'"."'.$trigger['relname'].'" DISABLE TRIGGER "'.$trigger['tgname'].'"');$disabled[]=$trigger;}
        foreach($business as $table){
            if(($before[$table]['count']??0)===0)continue;
            if(in_array($table,['source_revisions','source_documents'],true)){$ids=array_column($manifest['seedSources'],$table==='source_revisions'?'id':'document_id');$q=$db->prepare('DELETE FROM "'.$schema.'"."'.$table.'" WHERE id IN (?,?)');$q->execute($ids);}
            else{$column=$table==='network_revisions'?'id':'network_revision';$q=$db->prepare('DELETE FROM "'.$schema.'"."'.$table.'" WHERE "'.$column.'"=?');$q->execute([$manifest['revisions'][0]]);}
        }
        foreach($disabled as $trigger)$db->exec('ALTER TABLE "'.$schema.'"."'.$trigger['relname'].'" ENABLE TRIGGER "'.$trigger['tgname'].'"');
        $after=inventory($db,$schema);
        foreach($business as $table)if($after[$table]['count']!==0)throw new RuntimeException('Network business records remain: '.$table);
        foreach($preserved as $table)if($before[$table]!==$after[$table])throw new RuntimeException('Excluded records changed: '.$table);
        if(objects($db,$schema)!==$definitions)throw new RuntimeException('Normal safeguards changed.');
        if($mode==='cleanup-local'){
            $db->rollBack();if(inventory($db,$schema)!==$before||objects($db,$schema)!==$definitions)throw new RuntimeException('Rollback failed to preserve the restored schema.');
            $manifest['cleanupLocalVerified']=true;$manifest['localProofAt']=gmdate('c');file_put_contents($manifestPath,json_encode($manifest,JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR));echo "Exact cleanup and rollback verified on restored local schema. Server unchanged.\n";
        }else{
            $db->commit();$report=['completedAt'=>gmdate('c'),'schema'=>$schema,'database'=>'on','backupSha256'=>$manifest['dumpSha256'],'before'=>$before,'after'=>$after,'preserved'=>$preserved,'objectsUnchanged'=>true,'activeRevision'=>null,'physicalFilesDeleted'=>0];
            file_put_contents($root.'/docs/iteration32-server-cleanup.json',json_encode($report,JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR));echo "Named-schema seeded network removed. Accounts, migrations and safeguards preserved.\n";
        }
    }else{throw new RuntimeException('Unknown maintenance mode.');}
}catch(Throwable $error){if(isset($db)&&$db->inTransaction())$db->rollBack();fwrite(STDERR,'Maintenance stopped: '.get_class($error).': '.substr($error->getMessage(),0,1200).PHP_EOL);exit(1);}
