<?php

$root = dirname(__DIR__);
$runtime = $root.'/.dev-runtime/';
try {
    $cluster = json_decode(file_get_contents($runtime.'postgres-settings.json'), true, flags: JSON_THROW_ON_ERROR);
    $path = $runtime.'schema-isolation-settings.json';
    $settings = is_file($path) ? json_decode(file_get_contents($path), true, flags: JSON_THROW_ON_ERROR) : ['role' => 'fiber_schema_test', 'password' => bin2hex(random_bytes(32)), 'schema' => 'fiber_isolation'];
    file_put_contents($path, json_encode($settings, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
    $db = new PDO('pgsql:host=127.0.0.1;port='.$cluster['port'].';dbname=fiber_atlas_test', $cluster['user'], $cluster['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $q = $db->prepare('SELECT 1 FROM pg_roles WHERE rolname=?');
    $q->execute([$settings['role']]);
    if (! $q->fetchColumn()) {
        $db->exec('CREATE ROLE fiber_schema_test LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '.$db->quote($settings['password']));
    }
    $db->exec('GRANT CONNECT ON DATABASE fiber_atlas_test TO fiber_schema_test; CREATE SCHEMA IF NOT EXISTS fiber_isolation AUTHORIZATION fiber_schema_test; GRANT USAGE ON SCHEMA public TO fiber_schema_test; GRANT SELECT ON ALL TABLES IN SCHEMA public TO fiber_schema_test;');
    $content = "APP_ENV=testing\nDB_PROFILE=local\nDB_CONNECTION=pgsql\nDB_HOST=127.0.0.1\nDB_PORT=".$cluster['port']."\nDB_DATABASE=fiber_atlas_test\nDB_USERNAME=".$settings['role']."\nDB_PASSWORD=".$settings['password']."\nDB_SCHEMA=".$settings['schema']."\n";
    file_put_contents($root.'/backend/.env.isolation', $content."DB_SSLMODE=disable\n");
    echo "Restricted role/non-public schema ready in the loopback test database. Other-schema tables are read-only sentinels.\n";
} catch (Throwable $e) {
    fwrite(STDERR, 'Local isolation setup failed; sensitive SQL/errors withheld. '.get_class($e).PHP_EOL);
    exit(1);
}
