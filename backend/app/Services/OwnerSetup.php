<?php

namespace App\Services;

use App\Models\User;
use App\Support\DatabaseScope;
use Illuminate\Support\Facades\DB;

final class OwnerSetup
{
    private function path(): string
    {
        return dirname(base_path()).'/.dev-runtime/owner-setup-'.DatabaseScope::profile().'.json';
    }

    public function issue(): bool
    {
        DatabaseScope::assertTarget();
        if (User::query()->exists()) {
            return false;
        }
        file_put_contents($this->path(), NetworkStore::json(['token' => bin2hex(random_bytes(32)), 'database' => DB::connection()->getDatabaseName(), 'schema' => DatabaseScope::schema(), 'expires' => time() + 3600]));

        return true;
    }

    public function valid(?string $token): bool
    {
        if (! $token || ! is_file($this->path()) || User::query()->exists()) {
            return false;
        }
        $ticket = json_decode(file_get_contents($this->path()), true, flags: JSON_THROW_ON_ERROR);

        return hash_equals($ticket['token'], $token) && $ticket['expires'] > time() && $ticket['database'] === DB::connection()->getDatabaseName() && $ticket['schema'] === DatabaseScope::schema();
    }

    public function consume(): void
    {
        if (is_file($this->path())) {
            unlink($this->path());
        }
    }
}
