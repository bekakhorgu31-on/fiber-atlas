<?php
$root=dirname(__DIR__);require $root.'/backend/vendor/autoload.php';
$env=Dotenv\Dotenv::parse(file_get_contents($root.'/backend/.env.isolation'));
foreach($env as $key=>$value){$_ENV[$key]=$_SERVER[$key]=$value;putenv($key.'='.$value);}
$arguments=array_slice($argv,1);$report='iteration30-schema-tests.txt';
if(isset($arguments[0])&&str_starts_with($arguments[0],'--report=')){$report=substr(array_shift($arguments),9);if(!preg_match('/^iteration[0-9]+-[a-z0-9-]+\.txt$/D',$report))exit(2);}
$log=fopen($root.'/docs/'.$report,'w');
$process=proc_open([PHP_BINARY,'-d','memory_limit=1536M',$root.'/backend/vendor/bin/phpunit','--testdox',...$arguments],[0=>['pipe','r'],1=>$log,2=>$log],$pipes,$root.'/backend');
if(!is_resource($process))exit(1);fclose($pipes[0]);$code=proc_close($process);fclose($log);exit($code);
