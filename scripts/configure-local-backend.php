<?php
// Workspace-only credentials and application/test databases. Never prints secrets.
$root=dirname(__DIR__);
require $root.'/backend/vendor/autoload.php';
$existingEnv=is_file($root.'/backend/.env')?Dotenv\Dotenv::parse(file_get_contents($root.'/backend/.env')):[];
$preserveServer=($existingEnv['DB_PROFILE']??'')==='server'||(!empty($existingEnv['DB_HOST'])&&!in_array($existingEnv['DB_HOST'],['127.0.0.1','localhost','::1'],true));
$runtime=$root.'/.dev-runtime/';
$cluster=json_decode(file_get_contents($runtime.'postgres-settings.json'),true,flags:JSON_THROW_ON_ERROR);
$settingsPath=$runtime.'backend-settings.json';
$settings=is_file($settingsPath) ? json_decode(file_get_contents($settingsPath),true,flags:JSON_THROW_ON_ERROR) : [
    'databaseUser'=>'fiber_app','databasePassword'=>bin2hex(random_bytes(32)),
    'reviewerPassword'=>bin2hex(random_bytes(16)),'viewerPassword'=>bin2hex(random_bytes(16)),
    'appKey'=>'base64:'.base64_encode(random_bytes(32)),
];
file_put_contents($settingsPath,json_encode($settings,JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR));
$pdo=new PDO('pgsql:host=127.0.0.1;port='.$cluster['port'].';dbname=postgres',$cluster['user'],$cluster['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$query=$pdo->prepare('SELECT 1 FROM pg_roles WHERE rolname=?');$query->execute([$settings['databaseUser']]);
if(!$query->fetchColumn()) $pdo->exec('CREATE ROLE fiber_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '.$pdo->quote($settings['databasePassword']));
foreach(['fiber_atlas','fiber_atlas_test'] as $name) {
    $query=$pdo->prepare('SELECT 1 FROM pg_database WHERE datname=?');$query->execute([$name]);
    if(!$query->fetchColumn())$pdo->exec('CREATE DATABASE '.$name.' OWNER fiber_app ENCODING \'UTF8\' TEMPLATE template0');
}
$profile=['host'=>'127.0.0.1','port'=>$cluster['port'],'database'=>'fiber_atlas','username'=>$settings['databaseUser'],'password'=>$settings['databasePassword']];
file_put_contents($runtime.'local-db-profile.json',json_encode($profile,JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR));
foreach([($preserveServer?'.env.local':'.env')=>'fiber_atlas','.env.testing'=>'fiber_atlas_test'] as $file=>$database) {
    $content="APP_NAME=\"Fiber Atlas\"\nAPP_ENV=".($file==='.env'?'local':'testing')."\nAPP_KEY=".$settings['appKey']."\nAPP_DEBUG=false\nAPP_URL=http://127.0.0.1:8000\nDB_CONNECTION=pgsql\nDB_HOST=127.0.0.1\nDB_PORT=".$cluster['port']."\nDB_DATABASE=$database\nDB_USERNAME=".$settings['databaseUser']."\nDB_PASSWORD=".$settings['databasePassword']."\nSESSION_DRIVER=file\nCACHE_STORE=file\nQUEUE_CONNECTION=sync\nLOG_CHANNEL=single\n";
    file_put_contents($root.'/backend/'.$file,$content);
    file_put_contents($root.'/backend/'.$file,"DB_PROFILE=local\nDB_SCHEMA=public\n",FILE_APPEND);
    $python=str_replace('\\','/',getenv('USERPROFILE').'/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe');
    if(is_file($python))file_put_contents($root.'/backend/'.$file,'FIBER_PYTHON="'.$python.'"'."\n",FILE_APPEND);
}
echo "Project-local application and test databases configured. Secrets remain in ignored files.\n";
