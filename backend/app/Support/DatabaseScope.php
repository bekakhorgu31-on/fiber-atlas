<?php
namespace App\Support;
use Illuminate\Support\Facades\DB;
use RuntimeException;

final class DatabaseScope
{
    public static function profile():string { return config('database.fiber_profile','local'); }
    public static function schema():string
    {
        $schema=DB::connection()->getConfig('search_path');
        if(!is_string($schema)||!preg_match('/^[a-z][a-z0-9_]{0,62}$/D',$schema)||in_array($schema,['pg_catalog','information_schema'],true))throw new RuntimeException('One explicit application schema is required.');
        if(self::profile()==='server'&&$schema!=='bkhorguashvili')throw new RuntimeException('Server profile is restricted to bkhorguashvili.');
        return $schema;
    }
    public static function qualifiedFunction(string $name):string { return '"'.self::schema().'"."'.$name.'"'; }
    public static function assertTarget():void
    {
        $connection=DB::connection();$schema=self::schema();
        if($connection->getConfig('url'))throw new RuntimeException('DB_URL overrides are not permitted for the scoped profiles.');
        if(self::profile()==='local'&&!in_array($connection->getConfig('host'),['127.0.0.1','localhost','::1'],true))throw new RuntimeException('Local profile must use loopback.');
        $actual=DB::selectOne('SELECT current_database() AS db,current_schema() AS schema,current_setting(\'search_path\') AS path');
        if($actual->schema!==$schema||$actual->db!==$connection->getConfig('database'))throw new RuntimeException('Database/schema target mismatch.');
        $path=str_replace('"','',$actual->path);
        if($path!==$schema)throw new RuntimeException('Unexpected schema fallback in search path.');
        if(self::profile()==='server') {
            $tls=DB::selectOne('SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()');
            if(!$tls?->ssl)throw new RuntimeException('Server profile requires an encrypted connection.');
        }
    }
    public static function assertDestructiveTestTarget():void
    {
        if(self::profile()!=='local'||!in_array(DB::connection()->getConfig('host'),['127.0.0.1','localhost','::1'],true)||DB::connection()->getDatabaseName()!=='fiber_atlas_test')throw new RuntimeException('Reset/destructive operations are limited to the loopback fiber_atlas_test database.');
        self::assertTarget();
    }
    public static function assertWritable():void
    {
        self::assertTarget();
        if(self::profile()==='server'&&!config('database.fiber_server_ready'))throw new RuntimeException('Server writes await schema-isolation and TLS prerequisites.');
    }
}
