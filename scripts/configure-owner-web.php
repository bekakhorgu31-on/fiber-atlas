<?php
/** Add missing local web settings without replacing protected database credentials or an existing key. */
$root=dirname(__DIR__);require $root.'/backend/vendor/autoload.php';
$path=$root.'/backend/.env';$text=file_get_contents($path);$settings=Dotenv\Dotenv::parse($text);
if(($settings['DB_PROFILE']??'')!=='server'||($settings['DB_SCHEMA']??'')!=='bkhorguashvili')throw new RuntimeException('Owner launcher requires the protected server profile.');
$backup=$root.'/.dev-runtime/server-profile-before-owner-web.env';if(!is_file($backup))file_put_contents($backup,$text);
$runtime=str_replace('\\','/',getenv('USERPROFILE').'/.cache/codex-runtimes/codex-primary-runtime/dependencies/');
$defaults=['APP_KEY'=>'base64:'.base64_encode(random_bytes(32)),'APP_DEBUG'=>'false','APP_URL'=>'http://127.0.0.1:8000','SESSION_DRIVER'=>'file','CACHE_STORE'=>'file','FIBER_PYTHON'=>'"'.$runtime.'python/python.exe"','FIBER_NODE'=>'"'.$runtime.'node/bin/node.exe"'];
$added=[];
foreach($defaults as $key=>$value){if(!isset($settings[$key])||$settings[$key]===''){if(preg_match('/^'.preg_quote($key,'/').'=.*$/m',$text))$text=preg_replace('/^'.preg_quote($key,'/').'=.*$/m',$key.'='.$value,$text);else$text.="\n".$key.'='.$value; $added[]=$key;}}
if($added)file_put_contents($path,rtrim($text)."\n");
echo $added?'Missing owner-web settings added; protected credentials and existing settings preserved.'.PHP_EOL:'Owner-web settings already present.'.PHP_EOL;
