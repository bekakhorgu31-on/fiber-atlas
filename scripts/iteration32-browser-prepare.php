<?php
require dirname(__DIR__).'/backend/vendor/autoload.php';$root=dirname(__DIR__);
$env=Dotenv\Dotenv::parse(file_get_contents($root.'/backend/.env.isolation'));
$local=Dotenv\Dotenv::parse(file_get_contents($root.'/backend/.env.local'));
$env['APP_KEY']=$local['APP_KEY'];$env['APP_ENV']='testing';$env['DB_PROFILE']='local';$env['SESSION_DRIVER']='file';
foreach($env as $key=>$value){$_ENV[$key]=$_SERVER[$key]=$value;putenv($key.'='.$value);}
$app=require $root.'/backend/bootstrap/app.php';$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
App\Support\DatabaseScope::assertDestructiveTestTarget();if(App\Support\DatabaseScope::schema()!=='fiber_isolation')throw new RuntimeException('Browser replay requires the disposable isolation schema.');
Illuminate\Support\Facades\Artisan::call('migrate:fresh',['--force'=>true]);
app(App\Services\OwnerSetup::class)->issue();
$settings=['email'=>'owner@fiber-atlas.test','name'=>'Local owner QA','password'=>bin2hex(random_bytes(20))];file_put_contents($root.'/.dev-runtime/iteration32-browser-owner.json',json_encode($settings,JSON_THROW_ON_ERROR));
echo "Empty local isolation schema and private setup ticket ready for browser replay. Server untouched.\n";
