<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Throwable;

/** Private, bounded derived artifacts; never store review disposition or authorization. */
final class ReviewReadCache
{
    public const MAX_BYTES = 134217728;

    public const MAX_ENTRIES = 256;

    public const MAX_ENTRY_BYTES = 16777216;

    public const TTL = 86400;

    public function __construct(private int $maxEntries = self::MAX_ENTRIES, private int $maxBytes = self::MAX_BYTES)
    {
        $this->maxEntries = min(self::MAX_ENTRIES, max(1, $this->maxEntries));
        $this->maxBytes = min(self::MAX_BYTES, max(1, $this->maxBytes));
    }

    private function path(string $key): string
    {
        $scope = json_encode([config('database.connections.pgsql.host'), config('database.connections.pgsql.port'), config('database.connections.pgsql.database'), config('database.connections.pgsql.search_path'), config('fiber_atlas.review_cache_namespace', '')]);

        return 'review-read-cache/36-1/'.hash('sha256', $scope.'/'.$key).'.json';
    }

    public function get(string $key): ?array
    {
        $disk = Storage::disk('local');
        $path = $this->path($key);
        clearstatcache(true, $disk->path($path));
        try {
            if (! $disk->exists($path) || $disk->size($path) > self::MAX_ENTRY_BYTES || $disk->lastModified($path) < time() - self::TTL) {
                return null;
            }
            $text = $disk->get($path);
            $envelope = json_decode($text, true, flags: JSON_THROW_ON_ERROR);
            if (($envelope['key'] ?? null) !== $key || ! is_string($envelope['payload'] ?? null) || ! hash_equals($envelope['sha256'] ?? '', hash('sha256', $envelope['payload']))) {
                return null;
            }

            return json_decode($envelope['payload'], true, flags: JSON_THROW_ON_ERROR);
        } catch (Throwable) {
            return null;
        }
    }

    public function put(string $key, array $value): void
    {
        $disk = Storage::disk('local');
        $payload = NetworkStore::json($value);
        $text = NetworkStore::json(['key' => $key, 'sha256' => hash('sha256', $payload), 'payload' => $payload]);
        if (strlen($text) > self::MAX_ENTRY_BYTES) {
            return;
        }
        try {
            $path = $this->path($key);
            $disk->makeDirectory(dirname($path));
            $temporary = $path.'.'.bin2hex(random_bytes(6)).'.tmp';
            $disk->put($temporary, $text);
            if (! rename($disk->path($temporary), $disk->path($path))) {
                $disk->delete($temporary);

                return;
            }
            $files = $disk->files(dirname($path));
            $entries = [];
            $bytes = 0;
            foreach ($files as $file) {
                $size = $disk->size($file);
                $modified = $disk->lastModified($file);
                if ($modified < time() - self::TTL) {
                    $disk->delete($file);

                    continue;
                }
                $entries[] = ['file' => $file, 'size' => $size, 'modified' => $modified];
                $bytes += $size;
            }
            usort($entries, fn ($a, $b) => ($a['modified'] <=> $b['modified']) ?: (($a['file'] === $path) <=> ($b['file'] === $path)));
            while ($bytes > $this->maxBytes || count($entries) > $this->maxEntries) {
                $old = array_shift($entries);
                $disk->delete($old['file']);
                $bytes -= $old['size'];
            }
        } catch (Throwable) { /* Cache failure must never deny correct uncached evidence. */
        }
    }
}
