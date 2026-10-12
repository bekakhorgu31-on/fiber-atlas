<?php

namespace App\Services;

use App\Support\DatabaseScope;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

final class NetworkStore
{
    public const CORE = ['cables' => 'cable_segments', 'tubes' => 'tubes', 'fibers' => 'fibers', 'nodeFiberTransitions' => 'node_fiber_transitions', 'portTopologyBindings' => 'port_topology_bindings'];

    public static function json(mixed $value): string
    {
        return json_encode($value, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION);
    }

    private function node(array $node): string
    {
        return $node['kind'].':'.$node['id'];
    }

    public function seedBaseline(): string
    {
        DatabaseScope::assertWritable();
        $directory = dirname(base_path()).'/migration/iteration29/baseline/';
        $manifest = json_decode(file_get_contents($directory.'active-28l-manifest.json'), true, flags: JSON_THROW_ON_ERROR);
        $operationalManifest = json_decode(file_get_contents($directory.'active-28l-operational-manifest.json'), true, flags: JSON_THROW_ON_ERROR);
        $authorityText = gzdecode(file_get_contents($directory.'active-28l-authority.json.gz'));
        $operationalText = gzdecode(file_get_contents($directory.'active-28l-operational.json.gz'));
        $detailText = gzdecode(file_get_contents($directory.'active-28l-details.json.gz'));
        if (hash('sha256', $authorityText) !== $operationalManifest['authoritySha256'] || hash('sha256', $operationalText) !== $operationalManifest['operationalSha256']) {
            throw new RuntimeException('Baseline artifact hash mismatch.');
        }
        $data = json_decode($authorityText, true, flags: JSON_THROW_ON_ERROR);
        $revision = $operationalManifest['networkRevision'];
        if (count($data['fibers']) !== 2088 || count($data['fiberPathProjection']['paths']) !== 2088 || $data['fiberPathProjection']['topologyRevision'] !== $manifest['activeGraph']['topologyRevision']) {
            throw new RuntimeException('Incomplete reviewed baseline.');
        }

        return $this->persistAuthority($data, $revision, $manifest['content']['uncompressedSha256'], $operationalText, $detailText, ['reviewedBaseline' => true, 'pathsCompared' => 2088, 'counts' => ['cable_segments' => 37, 'fibers' => 2088, 'node_fiber_transitions' => 1631, 'port_topology_bindings' => 384, 'fiber_paths' => 2088]]);
    }

    public function persistAuthority(array $data, string $revision, string $authoritySha, string $operationalText, string $detailText, array $validation): string
    {
        DatabaseScope::assertWritable();

        return DB::transaction(function () use ($data, $revision, $authoritySha, $operationalText, $detailText, $validation) {
            DB::table('active_network_state')->where('id', 1)->lockForUpdate()->first();
            if (DB::table('network_revisions')->where('id', $revision)->exists()) {
                $this->certifyRecords($revision, $data);
                $this->validateRevision($revision);

                return $revision;
            }
            DB::table('network_revisions')->insert(['id' => $revision, 'baseline_sha256' => $authoritySha, 'topology_revision' => $data['fiberPathProjection']['topologyRevision'], 'display_revision' => $data['fiberPathProjection']['displayRevision'], 'status' => 'preparing', 'validation' => self::json($validation), 'created_at' => now()]);
            foreach ($data['sourceDocuments'] as $document) {
                DB::table('source_documents')->insertOrIgnore(['id' => $document['id'], 'title' => $document['title'], 'created_at' => now()]);
                $sourceRevision = $document['id'].'/'.$document['sourceSha256'];
                DB::table('source_revisions')->insertOrIgnore(['id' => $sourceRevision, 'document_id' => $document['id'], 'sha256' => $document['sourceSha256'], 'original_name' => $document['sourceFile'], 'stored_path' => null, 'metadata' => self::json(['basis' => 'reviewed-baseline', 'source' => $document['source']]), 'created_at' => now()]);
                DB::table('network_sources')->insert(['network_revision' => $revision, 'source_revision' => $sourceRevision]);
            }
            $nodes = [];
            foreach ($data['cables'] as $cable) {
                foreach (['endpointA', 'endpointB'] as $side) {
                    $nodes[$this->node($cable[$side])] = $cable[$side];
                }
            }
            foreach ($data['nodeFiberTransitions'] as $transition) {
                $nodes[$this->node($transition['node'])] = $transition['node'];
            }
            foreach ($data['networkNodes'] ?? [] as $item) {
                $node = ['kind' => 'network_node', 'id' => $item['id']];
                $nodes[$this->node($node)] = $node;
            }
            $rows = [];
            foreach ($nodes as $id => $node) {
                $rows[] = ['network_revision' => $revision, 'id' => $id, 'kind' => $node['kind'], 'local_id' => $node['id'], 'ordinal' => count($rows), 'payload' => self::json($node)];
            }
            $this->insertRows('canonical_nodes', $rows);
            $fiberKeys = [];
            foreach ($data['fibers'] as $fiber) {
                $fiberKeys[$fiber['cableId'].':'.$fiber['number']] = $fiber['id'];
            }
            $ports = [];
            foreach ($data['odfPorts'] as $port) {
                $ports['odf:'.$port['odfId'].':'.$port['number']] = ['owner_kind' => 'odf', 'owner_id' => $port['odfId'], 'number' => $port['number'], 'payload' => $port];
            }
            foreach ($data['apPorts'] as $port) {
                $ownerId = $port['canonicalNode']['id'] ?? (string) $port['apNumber'];
                $ports['ap:'.$ownerId.':'.$port['number']] = ['owner_kind' => 'ap', 'owner_id' => $ownerId, 'number' => $port['number'], 'payload' => $port];
            }
            foreach ($data['portTopologyBindings'] as $binding) {
                $key = $binding['ownerType'].':'.$binding['ownerId'].':'.$binding['portNumber'];
                $ports[$key] ??= ['owner_kind' => $binding['ownerType'], 'owner_id' => $binding['ownerId'], 'number' => $binding['portNumber'], 'payload' => ['id' => $key, 'inventoryBasis' => 'exact_binding_only', 'occupancy' => 'unknown']];
            }
            $rows = [];
            foreach ($ports as $id => $port) {
                $rows[] = ['network_revision' => $revision, 'id' => $id, 'ordinal' => count($rows), 'owner_kind' => $port['owner_kind'], 'owner_id' => $port['owner_id'], 'number' => $port['number'], 'payload' => self::json($port['payload'])];
            }
            $this->insertRows('ports', $rows);
            foreach (self::CORE as $collection => $table) {
                $rows = [];
                foreach ($data[$collection] as $index => $record) {
                    $row = ['network_revision' => $revision, 'id' => $record['id'], 'ordinal' => $index, 'payload' => self::json($record)];
                    $row += match ($collection) {
                        'cables' => ['endpoint_a' => $this->node($record['endpointA']), 'endpoint_b' => $this->node($record['endpointB']), 'fiber_count' => $record['fiberCount'], 'legacy_label' => $record['legacyCableId']],
                        'tubes' => ['cable_id' => $record['cableId'], 'number' => $record['number']],
                        'fibers' => ['cable_id' => $record['cableId'], 'number' => $record['number'], 'tube_id' => $record['tubeId']],
                        'nodeFiberTransitions' => ['node_id' => $this->node($record['node']), 'fiber_a' => $fiberKeys[$record['a']['segmentId'].':'.$record['a']['fiberNumber']] ?? throw new RuntimeException('Unknown incoming Fiber.'), 'fiber_z' => $record['z'] ? ($fiberKeys[$record['z']['segmentId'].':'.$record['z']['fiberNumber']] ?? throw new RuntimeException('Unknown outgoing Fiber.')) : null, 'active' => $record['active'], 'transition_type' => $record['transitionType']],
                        'portTopologyBindings' => ['port_id' => $record['ownerType'].':'.$record['ownerId'].':'.$record['portNumber'], 'fiber_id' => $fiberKeys[$record['segmentId'].':'.$record['fiberNumber']] ?? throw new RuntimeException('Unknown bound Fiber.')],
                    };
                    $rows[] = $row;
                }
                $this->insertRows($table, $rows);
            }
            foreach ($data as $collection => $value) {
                if (isset(self::CORE[$collection])) {
                    continue;
                }
                if ($collection === 'fiberPathProjection') {
                    $rows = [];
                    foreach ($value['paths'] as $id => $path) {
                        $rows[] = ['network_revision' => $revision, 'id' => $id, 'ordinal' => count($rows), 'fiber_id' => $fiberKeys[$path['cableId'].':'.$path['fiberNumber']], 'signature' => $path['signature'], 'payload' => self::json($path)];
                    }
                    $this->insertRows('fiber_paths', $rows);
                    unset($value['paths']);
                }
                if (is_array($value) && array_is_list($value)) {
                    $rows = [];
                    foreach ($value as $index => $record) {
                        $rows[] = ['network_revision' => $revision, 'id' => $collection.':'.$index, 'logical_id' => is_array($record) ? ($record['id'] ?? null) : null, 'collection' => $collection, 'ordinal' => $index, 'payload' => self::json($record)];
                    }
                    $this->insertRows('domain_records', $rows);
                    DB::table('network_attributes')->insert(['network_revision' => $revision, 'name' => $collection, 'payload' => '[]']);
                } else {
                    DB::table('network_attributes')->insert(['network_revision' => $revision, 'name' => $collection, 'payload' => self::json($value)]);
                }
            }
            foreach (['operational' => $operationalText, 'details' => $detailText] as $kind => $text) {
                DB::table('projection_snapshots')->insert(['network_revision' => $revision, 'kind' => $kind, 'payload' => $text, 'sha256' => hash('sha256', $text)]);
            }
            $this->certifyRecords($revision, $data);
            DB::table('network_revisions')->where('id', $revision)->update(['status' => 'validated']);
            $this->validateRevision($revision);

            return $revision;
        });
    }

    private function insertRows(string $table, array $rows): void
    {
        foreach (array_chunk($rows, 100) as $chunk) {
            DB::table($table)->insert($chunk);
        }
    }

    public function recordDigests(string $revision): array
    {
        $digests = [];
        foreach ([...array_values(self::CORE), 'canonical_nodes', 'ports', 'fiber_paths', 'domain_records', 'network_attributes'] as $table) {
            // A validation fingerprint only. Signature-sensitive payloads remain JSON.
            $ordering = $table === 'network_attributes' ? 'name' : 'id';
            $digests[$table] = DB::selectOne("SELECT md5(string_agg(md5((to_jsonb(t) - 'network_revision' - 'logical_id')::text), '' ORDER BY $ordering)) AS digest FROM $table t WHERE network_revision=?", [$revision])->digest;
        }

        return $digests;
    }

    private function certifyRecords(string $revision, array $baseline): void
    {
        foreach (self::CORE as $collection => $table) {
            $records = DB::table($table)->where('network_revision', $revision)->orderBy('ordinal')->pluck('payload')->all();
            if (count($records) !== count($baseline[$collection])) {
                throw new RuntimeException('Persisted collection incomplete: '.$collection);
            }
            foreach ($records as $i => $payload) {
                if (json_decode($payload, true, flags: JSON_THROW_ON_ERROR) !== $baseline[$collection][$i]) {
                    throw new RuntimeException('Persisted record differs from reviewed authority: '.$collection.'/'.$i);
                }
            }
        }
        $record = DB::table('network_revisions')->where('id', $revision)->first();
        $validation = json_decode($record->validation, true, flags: JSON_THROW_ON_ERROR);
        $existing = $validation['recordDigests'] ?? null;
        $digests = $this->recordDigests($revision);
        if ($existing !== null && $existing !== $digests) {
            throw new RuntimeException('Immutable authority was changed.');
        }
        if ($existing === null) {
            $validation['recordDigests'] = $digests;
            DB::table('network_revisions')->where('id', $revision)->update(['validation' => self::json($validation)]);
        }
    }

    public function validateRevision(string $revision): void
    {
        $record = DB::table('network_revisions')->where('id', $revision)->first();
        if (! $record || $record->status !== 'validated') {
            throw new RuntimeException('Candidate revision is not validated.');
        }
        $validation = json_decode($record->validation, true, flags: JSON_THROW_ON_ERROR);
        if (! ($validation['reviewedBaseline'] ?? false) && ! ($validation['freshImport'] ?? false)) {
            throw new RuntimeException('Revision validation is missing.');
        }
        if (($validation['pathsCompared'] ?? 0) !== ($validation['counts']['fibers'] ?? 2088)) {
            throw new RuntimeException('Every Fiber requires a validated path.');
        }
        if (($validation['recordDigests'] ?? null) !== $this->recordDigests($revision)) {
            throw new RuntimeException('Authority/projection validation is stale.');
        }
        foreach (($validation['counts'] ?? ['cable_segments' => 37, 'fibers' => 2088, 'node_fiber_transitions' => 1631, 'port_topology_bindings' => 384, 'fiber_paths' => 2088]) as $table => $count) {
            if (! in_array($table, ['cable_segments', 'fibers', 'node_fiber_transitions', 'port_topology_bindings', 'fiber_paths'], true)) {
                throw new RuntimeException('Unknown validation collection.');
            }
            if (DB::table($table)->where('network_revision', $revision)->count() !== $count) {
                throw new RuntimeException('Incomplete revision: '.$table);
            }
        }
        foreach (['operational', 'details'] as $kind) {
            $projection = DB::table('projection_snapshots')->where('network_revision', $revision)->where('kind', $kind)->first();
            if (! $projection || hash('sha256', $projection->payload) !== $projection->sha256) {
                throw new RuntimeException('Projection integrity failure.');
            }
            if ((json_decode($projection->payload, true, flags: JSON_THROW_ON_ERROR)['networkRevision'] ?? null) !== $revision) {
                throw new RuntimeException('Mixed projection revision.');
            }
        }
    }

    public function activate(string $revision, ?string $expected, string $actor, string $operation = 'activate'): void
    {
        DatabaseScope::assertWritable();
        DB::transaction(function () use ($revision, $expected, $actor, $operation) {
            $state = DB::table('active_network_state')->where('id', 1)->lockForUpdate()->first();
            if ($state->network_revision !== $expected) {
                abort(409, 'Active network changed.');
            }
            $this->validateRevision($revision);
            if ($expected === $revision) {
                return;
            }
            DB::table('active_network_state')->where('id', 1)->update(['network_revision' => $revision]);
            DB::table('activation_events')->insert(['id' => (string) Str::uuid(), 'previous_revision' => $expected, 'new_revision' => $revision, 'operation' => $operation, 'actor' => $actor, 'created_at' => now()]);
        });
    }

    public function activeRevision(): string
    {
        return DB::table('active_network_state')->where('id', 1)->value('network_revision') ?? throw new RuntimeException('No validated network is active.');
    }

    /** Snapshot ancestry excludes future events from a historical review. */
    public function ancestors(string $revision): array
    {
        $rows = DB::select('WITH RECURSIVE chain AS (
            SELECT ?::text AS revision, ARRAY[?::text] AS path, 0 AS depth
            UNION ALL
            SELECT parent.previous_revision::text, chain.path || parent.previous_revision::text, chain.depth+1
            FROM chain JOIN LATERAL (
                SELECT previous_revision FROM activation_events WHERE new_revision=chain.revision
                ORDER BY created_at DESC, id DESC LIMIT 1
            ) parent ON true
            WHERE parent.previous_revision IS NOT NULL AND chain.depth<255 AND NOT(parent.previous_revision=ANY(chain.path))
        ) SELECT revision FROM chain ORDER BY depth', [$revision, $revision]);

        return array_map(fn ($row) => $row->revision, $rows);
    }

    public function projection(string $revision, string $kind): string
    {
        $projection = DB::table('projection_snapshots')->where('network_revision', $revision)->where('kind', $kind)->first();
        if (! $projection) {
            abort(404, 'Unknown revision or projection.');
        }
        if (hash('sha256', $projection->payload) !== $projection->sha256) {
            throw new RuntimeException('Projection hash mismatch.');
        }

        return $projection->payload;
    }
}
