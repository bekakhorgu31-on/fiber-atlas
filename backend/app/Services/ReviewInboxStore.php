<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

final class ReviewInboxStore
{
    public const MAX_CASES = 10000;

    public const SHAPE_BOX = "box(point((payload->'geometry'->'world_bounds'->>'min_x')::float8,(payload->'geometry'->'world_bounds'->>'min_y')::float8),point((payload->'geometry'->'world_bounds'->>'max_x')::float8,(payload->'geometry'->'world_bounds'->>'max_y')::float8))";

    public const MAX_INDEX_BYTES = 8388608;

    public function candidateIndex(array $data, string $revision): array
    {
        return ['version' => 1, 'networkRevision' => $revision, 'sources' => $data['sourceDocuments'] ?? [], 'cases' => $this->describe($data)];
    }

    private function describe(array $data): array
    {
        $records = [];
        foreach (['cables', 'fibers', 'networkNodes', 'accessPoints', 'closures', 'apPorts'] as $collection) {
            foreach ($data[$collection] ?? [] as $item) {
                $records[$item['id']] = $item;
            }
        }
        $label = fn (array $ref) => $records[$ref['id']]['displayName'] ?? $records[$ref['id']]['name'] ?? (($ref['kind'] === 'closure' ? 'SC' : $ref['kind']).$ref['id']);
        $result = [];
        foreach ($data['sourceReviewCases'] ?? [] as $case) {
            $asset = $records[$case['affectedIds'][0] ?? ''] ?? [];
            $category = $case['category'];
            $port = $category === 'fiber_port_binding_ambiguous';
            $cable = isset($asset['cableId']) ? ($records[$asset['cableId']] ?? []) : (isset($asset['endpointA']) ? $asset : []);
            $fiberConflict = $category === 'source_conflict' && isset($asset['cableId'], $asset['number']);
            $capacityConflict = $category === 'source_conflict' && isset($asset['endpointA']);
            $node = $asset['canonicalNode'] ?? (isset($asset['assetType']) ? ['kind' => 'network_node', 'id' => $asset['id']] : null);
            $document = null;
            foreach ($data['sourceDocuments'] ?? [] as $doc) {
                $explicit = ($case['source']['sourceRevision'] ?? null) === $doc['id'].'/'.$doc['sourceSha256'];
                $member = $cable && in_array($cable['id'], $doc['importedAssetIds'], true);
                $root = $asset['shapeId'] ?? $asset['source']['shapeIds'][0] ?? null;
                $kind = $port ? 'PORT' : 'NODE';
                $scoped = $root && ($asset['id'] ?? null) === 'SHIDA-'.$kind.'-'.substr(hash('sha256', $doc['id'].'/'.$root), 0, 24);
                $raw = $data['_duplicateText'][$doc['id']][$case['source']['shapeIds'][0] ?? ''] ?? null;
                $duplicate = $raw && $case['id'] === 'SHIDA-REVIEW-'.substr(hash('sha256', $doc['id'].'/duplicate-'.$raw), 0, 24);
                $matches = isset($case['source']['sourceRevision']) ? $explicit : ($member || $scoped || $duplicate);
                if ($matches) {
                    if ($document) {
                        $document = null;
                        break;
                    } $document = $doc;
                }
            }
            $object = $port && $node ? $label($node).' / Port '.$asset['number'] : ($cable ? $label($cable['endpointA']).' ↔ '.$label($cable['endpointB']).' · '.$cable['fiberCount'].'F' : ($node ? $label($node) : ($case['source']['rawValue'] ?? $case['question'])));
            if ($fiberConflict) {
                $object .= ' / F'.($asset['number'] ?? '?');
            }
            if ($category === 'source_representation_ambiguous' && $document) {
                $object = $data['_duplicateText'][$document['id']][$case['source']['shapeIds'][0]] ?? $object;
            }
            $texts = [
                'fiber_port_binding_ambiguous' => ['ზუსტი Port–Fiber მიბმა უცნობია', 'პორტი წყაროში დანომრილია; ზუსტი ჟილა არ არის დადგენილი.', 'გამოყენება და ხელმისაწვდომობა ამით არ დგინდება.'],
                'source_bank_association' => ['ჟილების ბანკის კავშირი დასადგენია', 'მონაკვეთის ბოლოები და ტევადობა ცნობილია; ბანკთან სრული კავშირი უცნობია.', ($cable['fiberCount'] ?? '?').' ადგილობრივ ჟილას ეხება; აღდგენილი გზების რაოდენობა ჯერ უცნობია.'],
                'source_conflict' => ['ჟილის ფერები წყაროში განსხვავდება', 'ორი ადგილობრივი მარკერი განსხვავებულ ფერს აჩვენებს.', 'ფერის სხვაობა არ ამტკიცებს გაწყვეტილ ოპტიკურ გზას.'],
                'source_port_numbering' => ['პორტების ნუმერაცია შესამოწმებელია', 'წყაროში ნაბეჭდი ნომრები სრულ 1–24 ბანკს არ ქმნის.', 'თავდაპირველი ნომრები შენარჩუნებულია; ავტომატური შესწორება არ გამოიყენება.'],
                'source_representation_ambiguous' => ['განმეორებული მონაკვეთის იდენტობა უცნობია', 'ორი წყაროს ჩანაწერის ფიზიკური ეკვივალენტობა დასადგენია.', 'ჩანაწერები არ არის გაერთიანებული ან დუბლირებული ფიზიკურ ქსელში.'],
            ];
            [$title, $known, $impact] = $texts[$category] ?? [$case['question'], $case['observation'], 'გავლენა შესამოწმებელია.'];
            if ($capacityConflict) {
                $title = 'კაბელის ჟილების რაოდენობა წყაროში განსხვავდება';
                $known = 'წარწერა და სრული დანომრილი ჟილების ბანკები სხვადასხვა რაოდენობას აჩვენებს.';
                $impact = 'რაოდენობა სრული ბანკებისა და დახაზული ხაზების მტკიცებულებითაა განსაზღვრული; თავდაპირველი წარწერა შენარჩუნებულია.';
            }
            $rejections = $asset['alignment']['diagnostics'] ?? [];
            $reasons = array_unique(array_column($rejections, 'reason'));
            $reasonLabels = ['bank_without_unique_cable_association' => 'ხაზის მარკერის ბანკს ზუსტად ერთი Cable არ უკავშირდება.', 'printed_marker_number_not_established' => 'მარკერის ნაბეჭდი ნომერი ზუსტად არ არის დადგენილი.', 'ambiguous_port_docking' => 'ხაზს ერთზე მეტი პორტის ადგილთან აქვს კანდიდატი.', 'marker_outside_owning_ap_body' => 'კანდიდატი მარკერი ამ AP-ის საკუთარ კონტექსტს არ ეკუთვნის.', 'multiple_distinct_fibers_drawn_to_one_port' => 'ერთ პორტთან რამდენიმე განსხვავებული ჟილის კანდიდატია.'];
            $diagnosisReason = $rejections ? implode(' ', array_map(fn ($r) => $reasonLabels[$r] ?? 'კანდიდატის უარყოფის მიზეზი ტექნიკურ მტკიცებულებაშია.', $reasons)) : 'მიღებული კავშირის არქონა არ არის უარყოფის მიზეზის დიაგნოზი. შეამოწმეთ ბანკები და ხაზები.';
            $group = $port ? ($node['id'] ?? $case['id']) : ($cable['id'] ?? $case['id']);
            $assets = $node ? [$node] : ($cable ? [['kind' => 'segment', 'id' => $cable['id']]] : []);
            if ($fiberConflict && $cable) {
                $assets = [['kind' => 'fiber', 'id' => $cable['id'], 'number' => $asset['number']]];
            }
            $result[] = ['id' => $case['id'], 'category' => $category, 'title' => $title, 'object' => $object, 'known' => $known, 'impact' => $impact, 'groupId' => $category.':'.$group, 'groupTitle' => $port && $node ? $label($node) : ($cable ? $label($cable['endpointA']).' ↔ '.$label($cable['endpointB']) : $object), 'sourceRevision' => $document ? $document['id'].'/'.$document['sourceSha256'] : null, 'sourceTitle' => $document['title'] ?? 'წყაროს იდენტობა დასადგენია', 'sourceSha256' => $document['sourceSha256'] ?? null, 'assets' => $assets, 'case' => $case, 'diagnosis' => ['state' => $rejections ? 'source_supported_rejection' : 'not_yet_established', 'reason' => $diagnosisReason, 'rejectedCandidates' => $rejections], 'search' => implode(' ', [$object, $title, $case['question'], $case['observation'], $cable['legacyLabels'][0] ?? '', $case['id']])];
        }
        foreach ($data['issues'] ?? [] as $issue) {
            if (in_array($issue['id'], array_column($result, 'id'), true)) {
                continue;
            }
            $result[] = ['id' => $issue['id'], 'category' => 'legacy_issue', 'title' => $issue['title'] ?? 'საკითხი', 'object' => $issue['subjectId'] ?? $issue['id'], 'groupId' => 'legacy:'.$issue['id'], 'groupTitle' => $issue['title'] ?? 'საკითხი', 'sourceRevision' => null, 'sourceTitle' => 'სხვა საკითხი', 'assets' => [], 'case' => $issue, 'search' => json_encode($issue)];
        }
        abort_if(count($result) > self::MAX_CASES, 422, 'Review inventory exceeds its bounded limit.');

        return $result;
    }

    public function context(?string $revision, ?string $runId, bool $authenticated, ?string $subject = null, bool $mutable = true): array
    {
        $active = DB::table('active_network_state')->where('id', 1)->value('network_revision');
        $run = null;
        if ($runId) {
            abort_unless($authenticated, 401);
            $run = DB::table('import_runs')->where('id', $runId)->first();
            abort_unless($run, 404);
            $summary = json_decode($run->summary ?? '{}', true);
            $revision = $summary['proposal']['networkRevision'] ?? null;
            if ($run->network_status !== 'applied') {
                $artifact = $summary['proposal']['reviewIndexArtifact'] ?? 'review-index.json';
                abort_unless(preg_match('/^review-index(?:-[a-f0-9-]{36})?\.json$/D', $artifact), 409);
                $path = 'imports/'.$runId.'/'.$artifact;
                $disk = Storage::disk('local');
                abort_unless((($summary['proposal']['ready'] ?? false) || $run->semantic_status === 'validated' && isset($summary['proposal']['portCorrectionReconciliation'])) && $disk->exists($path), 409, 'A bounded review index is unavailable for this older staged attempt. Reprocess the preserved source.');
                abort_unless($disk->size($path) <= self::MAX_INDEX_BYTES && hash_file('sha256', $disk->path($path)) === ($summary['proposal']['reviewIndexSha256'] ?? null), 409, 'Review index integrity failed.');
                $index = json_decode($disk->get($path), true, flags: JSON_THROW_ON_ERROR);
                abort_unless($index['networkRevision'] === $revision, 409);

                return ['kind' => 'staged', 'revision' => $revision, 'activeRevision' => $active, 'runId' => $runId, 'runSource' => $run->source_revision, 'sources' => $index['sources'], 'cases' => $subject ? array_values(array_filter($index['cases'], fn ($c) => $c['id'] === $subject)) : $index['cases'], 'events' => [], 'readOnly' => true];
            }
        }
        $revision ??= $active;
        if (! $revision) {
            return ['kind' => 'empty', 'revision' => null, 'activeRevision' => $active, 'sources' => [], 'cases' => [], 'events' => [], 'readOnly' => true];
        }
        $authority = DB::table('network_revisions')->where('id', $revision)->where('status', 'validated')->first(['baseline_sha256']);
        abort_unless($authority, 404);
        $metadata = $this->immutableMetadata($revision, $subject, $authority->baseline_sha256);
        $cases = $metadata['cases'];
        $data = ['sourceDocuments' => $metadata['sources'], 'sourceReviewCases' => array_column($cases, 'case')];
        if (! $mutable) {
            return ['kind' => $revision === $active ? 'active' : 'historical', 'revision' => $revision, 'activeRevision' => $active, 'runId' => $runId, 'runSource' => $run?->source_revision, 'sources' => $metadata['sources'], 'cases' => $cases, 'events' => [], 'readOnly' => $revision !== $active];
        }
        $ancestry = app(NetworkStore::class)->ancestors($revision);
        $caseIds = array_column($cases, 'id');
        $sourceIds = array_map(fn ($doc) => $doc['id'].'/'.$doc['sourceSha256'], $data['sourceDocuments']);
        $events = DB::table('review_events')->join('users', 'users.id', '=', 'review_events.actor_id')->whereIn('network_revision', $ancestry)->where(function ($q) use ($revision, $caseIds, $sourceIds) {
            $q->where('network_revision', $revision)->orWhere(fn ($history) => $history->whereIn('subject_id', $caseIds)->whereIn('source_revision', $sourceIds));
        })->when($subject, fn ($q) => $q->where('subject_id', $subject))->when(! $mutable, fn ($q) => $q->whereRaw('false'))->orderBy('review_events.created_at')->orderBy('review_events.version')->get(['review_events.*', 'users.name as actor_name'])->map(fn ($e) => (array) $e)->all();
        $rank = array_flip(array_reverse($ancestry));
        usort($events, fn ($a, $b) => ($rank[$a['network_revision']] <=> $rank[$b['network_revision']]) ?: ($a['version'] <=> $b['version']));
        $data['operatorPortCorrections'] = DB::table('domain_records')->where('network_revision', $revision)->where('collection', 'operatorPortCorrections')->when(! $mutable, fn ($q) => $q->whereRaw('false'))->when($subject, fn ($q) => $q->whereIn(DB::raw("payload->>'portId'"), array_merge([], ...array_map(fn ($c) => $c['case']['affectedIds'] ?? [], $cases))))->orderBy('ordinal')->pluck('payload')->map(fn ($p) => json_decode($p, true))->all();
        $versions = DB::table('review_subject_versions')->where('network_revision', $revision)->when($subject, fn ($q) => $q->where('subject_id', $subject))->when(! $mutable, fn ($q) => $q->whereRaw('false'))->pluck('version', 'subject_id');
        $bindingIds = array_filter(array_column(array_column($data['operatorPortCorrections'], 'newBinding'), 'id'));
        $activeBindings = DB::table('port_topology_bindings')->where('network_revision', $revision)->whereIn('id', $bindingIds)->pluck('id')->flip()->all();
        foreach ($cases as &$case) {
            $case['currentReviewVersion'] = (int) ($versions[$case['id']] ?? 0);
            $corrections = array_values(array_filter($data['operatorPortCorrections'], fn ($c) => ($c['subjectId'] === $case['id'] || in_array($case['id'], $c['affectedSubjectIds'] ?? [], true)) && $c['sourceRevision'] === $case['sourceRevision'] && in_array($c['portId'], $case['case']['affectedIds'] ?? [], true)));
            $case['appliedCorrection'] = $corrections ? $corrections[count($corrections) - 1] : null;
            $case['operatorBindingActive'] = isset($case['appliedCorrection']['newBinding']['id']) && isset($activeBindings[$case['appliedCorrection']['newBinding']['id']]);
        }

        return ['kind' => $revision === $active ? 'active' : 'historical', 'revision' => $revision, 'activeRevision' => $active, 'runId' => $runId, 'runSource' => $run?->source_revision, 'sources' => $data['sourceDocuments'], 'cases' => $cases, 'events' => $events, 'readOnly' => $revision !== $active];
    }

    private function immutableMetadata(string $revision, ?string $subject, string $authoritySha): array
    {
        $cache = app(ReviewReadCache::class);
        $fullKey = 'case-metadata/2/'.$revision.'/'.$authoritySha;
        $key = $subject ? $fullKey.'/'.$subject : $fullKey;
        $stored = $cache->get($fullKey);
        if ($stored) {
            return [...$stored, 'cases' => $subject ? array_values(array_filter($stored['cases'], fn ($c) => $c['id'] === $subject)) : $stored['cases']];
        }
        if ($subject && ($stored = $cache->get($key))) {
            return $stored;
        }
        $value = $this->buildMetadata($revision, $subject);
        $cache->put($key, $value);

        return $value;
    }

    private function buildMetadata(string $revision, ?string $subject): array
    {
        $data = [];
        foreach (['sourceReviewCases', 'sourceDocuments', 'networkNodes', 'accessPoints', 'closures', 'issues'] as $collection) {
            $query = DB::table('domain_records')->where('network_revision', $revision)->where('collection', $collection);
            if ($subject && in_array($collection, ['sourceReviewCases', 'issues'], true)) {
                $query->where('logical_id', $subject);
            }
            if ($subject && in_array($collection, ['networkNodes', 'accessPoints', 'closures'], true)) {
                continue;
            }
            $rows = $query->orderBy('ordinal')->limit(self::MAX_CASES + 1)->pluck('payload');
            abort_if($rows->count() > self::MAX_CASES, 422);
            $data[$collection] = $rows->map(fn ($p) => json_decode($p, true))->all();
        }
        $affected = array_values(array_unique(array_merge([], ...array_map(fn ($c) => $c['affectedIds'] ?? [], $data['sourceReviewCases']))));
        $data['apPorts'] = DB::table('domain_records')->where('network_revision', $revision)->where('collection', 'apPorts')->whereIn('logical_id', $affected)->pluck('payload')->map(fn ($p) => json_decode($p, true))->all();
        $data['fibers'] = DB::table('fibers')->where('network_revision', $revision)->whereIn('id', $affected)->pluck('payload')->map(fn ($p) => json_decode($p, true))->all();
        $cables = DB::table('cable_segments')->where('network_revision', $revision);
        if ($subject) {
            $cables->whereIn('id', array_unique([...$affected, ...array_column($data['fibers'], 'cableId')]));
        }
        $data['cables'] = $cables->limit(self::MAX_CASES)->pluck('payload')->map(fn ($p) => json_decode($p, true))->all();
        if ($subject) {
            $nodeIds = $affected;
            foreach ($data['apPorts'] as $port) {
                $nodeIds[] = $port['canonicalNode']['id'];
            }
            foreach ($data['cables'] as $cable) {
                $nodeIds[] = $cable['endpointA']['id'];
                $nodeIds[] = $cable['endpointB']['id'];
            }
            foreach (['networkNodes', 'accessPoints', 'closures'] as $collection) {
                $data[$collection] = DB::table('domain_records')->where('network_revision', $revision)->where('collection', $collection)->whereIn('logical_id', array_unique($nodeIds))->pluck('payload')->map(fn ($p) => json_decode($p, true))->all();
            }
        }
        $shaValues = array_column($data['sourceDocuments'], 'sourceSha256');
        $annotationRuns = DB::table('domain_records')->where('network_revision', $revision)->where('collection', 'sourceAnnotations')->whereIn(DB::raw("payload->>'sourceSha256'"), $shaValues)->selectRaw("payload->>'sourceSha256' AS sha, payload->>'extractionRunId' AS run")->distinct()->get()->groupBy('sha');
        $runIds = $annotationRuns->flatten()->pluck('run')->filter(fn ($id) => Str::isUuid($id ?? ''))->unique();
        $acceptedRuns = DB::table('import_runs')->whereIn('id', $runIds)->where('network_status', 'applied')->get()->keyBy('id');
        foreach ($data['sourceDocuments'] as &$doc) {
            $source = $doc['id'].'/'.$doc['sourceSha256'];
            $runIds = collect($annotationRuns[$doc['sourceSha256']] ?? [])->pluck('run')->unique();
            $doc['interpretationRunId'] = $runIds->count() === 1 && Str::isUuid($runIds[0] ?? '') ? $runIds[0] : null;
            $accepted = $doc['interpretationRunId'] ? ($acceptedRuns[$doc['interpretationRunId']] ?? null) : null;
            if ($accepted && $accepted->source_revision !== $source) {
                $accepted = null;
            }
            if (! $accepted) {
                continue;
            }
            $duplicates = array_filter($data['sourceReviewCases'], fn ($c) => $c['category'] === 'source_representation_ambiguous');
            foreach (collect($duplicates)->groupBy(fn ($c) => $c['source']['pageId'] ?? '0') as $page => $cases) {
                $ids = $cases->map(fn ($c) => $c['source']['shapeIds'][0] ?? '')->all();
                $texts = DB::table('source_shapes')->where('source_revision', $source)->where('import_run', $accepted->id)->where('page_id', (string) $page)->whereIn('shape_id', $ids)->selectRaw("shape_id, payload->>'text' AS text")->get();
                foreach ($texts as $shape) {
                    $data['_duplicateText'][$doc['id']][$shape->shape_id] = $shape->text ?? '';
                }
            }
        }
        unset($doc);

        return ['sources' => $data['sourceDocuments'], 'cases' => $this->describe($data)];
    }

    public function evidence(array $context, array $record): array
    {
        $source = $record['sourceRevision'];
        abort_unless($source, 409, 'Source identity is unresolved; filename-only fallback is not allowed.');
        $exactRun = $record['case']['source']['importRunId'] ?? null;
        if (! $exactRun) {
            $doc = collect($context['sources'])->first(fn ($d) => $source === $d['id'].'/'.$d['sourceSha256']);
            $exactRun = $doc['interpretationRunId'] ?? null;
        }
        if (! $exactRun && ($context['runSource'] ?? null) === $source) {
            $exactRun = $context['runId'] ?? null;
        }
        abort_unless($exactRun, 409, 'The interpretation run is not recorded for this historical context. No latest-run fallback is allowed.');
        $runs = DB::table('import_runs')->where('source_revision', $source)->where('extraction_status', 'completed')->where('id', $exactRun);
        $run = $runs->orderByDesc('created_at')->first();
        abort_unless($run, 404, 'The exact source interpretation run is unavailable.');
        $page = $record['case']['source']['pageId'] ?? '0';
        $ids = array_slice($record['case']['source']['shapeIds'] ?? [], 0, 2);
        $views = [];
        if ($record['category'] === 'source_port_numbering') {
            $ids = array_slice($record['case']['source']['shapeIds'], 0, 1);
        }
        foreach ($ids as $id) {
            $bank = [];
            $anchor = DB::table('source_shapes')->where('source_revision', $source)->where('import_run', $run->id)->where('page_id', $page)->where('shape_id', $id)->value('payload');
            abort_unless($anchor, 404, 'An exact source anchor is missing.');
            $anchor = json_decode($anchor, true);
            abort_unless(isset($anchor['geometry']['world_bounds']), 409, 'Geometry has not been decoded for this run.');
            $parent = isset($anchor['parent_id']) ? DB::table('source_shapes')->where('source_revision', $source)->where('import_run', $run->id)->where('page_id', $page)->where('shape_id', $anchor['parent_id'])->value('payload') : null;
            $b = $parent ? (json_decode($parent, true)['geometry']['world_bounds'] ?? $anchor['geometry']['world_bounds']) : $anchor['geometry']['world_bounds'];
            $pad = max($record['category'] === 'fiber_port_binding_ambiguous' ? 1.5 : .7, min(3, ($b['width'] ?? 1) * .25));
            if ($record['category'] === 'source_port_numbering') {
                $bank = DB::table('source_shapes')->where('source_revision', $source)->where('import_run', $run->id)->where('page_id', $page)->whereIn('shape_id', $record['case']['source']['shapeIds'])->pluck('payload');
                foreach ($bank as $item) {
                    $bounds = json_decode($item, true)['geometry']['world_bounds'];
                    foreach (['min_x', 'min_y'] as $key) {
                        $b[$key] = min($b[$key], $bounds[$key]);
                    }foreach (['max_x', 'max_y'] as $key) {
                        $b[$key] = max($b[$key], $bounds[$key]);
                    }
                }
            }
            $box = ['minX' => $b['min_x'] - $pad, 'maxX' => $b['max_x'] + $pad, 'minY' => $b['min_y'] - $pad, 'maxY' => $b['max_y'] + $pad];
            $cacheKey = 'crop/2/'.hash('sha256', NetworkStore::json([$source, $run->id, $run->extractor_version, $page, $id, $box, $anchor, $parent, $bank ?? []]));
            $base = app(ReviewReadCache::class)->get($cacheKey);
            if (! $base) {
                $rows = DB::table('source_shapes')->where('source_revision', $source)->where('import_run', $run->id)->where('page_id', $page)->whereRaw(self::SHAPE_BOX.' && box(point(?::float8, ?::float8), point(?::float8, ?::float8))', [$box['minX'], $box['minY'], $box['maxX'], $box['maxY']])->orderByRaw('CASE WHEN shape_id=? THEN 0 ELSE 1 END', [$id])->orderBy('shape_id')->limit(601)->pluck('payload');
                $shapes = $rows->take(600)->map(function ($p) {
                    $s = json_decode($p, true);

                    return ['id' => $s['id'], 'text' => $s['text'] ?? '', 'type' => $s['attributes']['Type'] ?? 'Shape', 'geometry' => array_intersect_key($s['geometry'], array_flip(['global_pin', 'world_angle', 'world_bounds', 'world_geometry_sections', 'local_to_page', 'local_bounds'])), 'style' => array_intersect_key($s['effective_style'] ?? [], array_flip(['FillForegnd', 'FillPattern', 'LineColor', 'LinePattern', 'LineWeight']))];
                })->all();
                $base = ['shapes' => $shapes, 'truncated' => $rows->count() > 600];
                app(ReviewReadCache::class)->put($cacheKey, $base);
            }
            $shapes = $base['shapes'];
            $highlights = $record['category'] === 'fiber_port_binding_ambiguous' ? $this->portEvidenceHighlights($anchor, $shapes, $record['diagnosis']['rejectedCandidates'] ?? []) : [];
            $views[] = ['anchor' => $id, 'mode' => $record['category'] === 'source_port_numbering' ? 'port_bank' : 'issue', 'bounds' => $box, 'truncated' => $base['truncated'], 'shapes' => $shapes, 'highlights' => $highlights, 'diagnosticState' => $record['diagnosis']['state'] ?? 'not_yet_established'];
        }

        return ['sourceRevision' => $source, 'importRun' => $run->id, 'pageId' => $page, 'views' => $views, 'simplified' => false, 'fieldVerified' => false];
    }

    /** Visual annotations on this exact run only; these never establish a Fiber mapping. */
    public function portEvidenceHighlights(array $anchor, array $shapes, array $rejections): array
    {
        $bounds = $anchor['geometry']['world_bounds'];
        $recorded = [];
        foreach ($rejections as $rejection) {
            foreach ([$rejection, ...($rejection['candidates'] ?? [])] as $candidate) {
                $id = $candidate['strokeShapeId'] ?? $candidate['connectorShapeId'] ?? null;
                if ($id) {
                    $recorded[(string) $id] = $rejection['reason'] ?? 'recorded_rejection';
                }
            }
        }
        $inside = fn (array $p): bool => $p['x'] >= $bounds['min_x'] - .000001 && $p['x'] <= $bounds['max_x'] + .000001 && $p['y'] >= $bounds['min_y'] - .000001 && $p['y'] <= $bounds['max_y'] + .000001;
        $highlights = [];
        foreach ($shapes as $shape) {
            if ($shape['id'] === $anchor['id'] || $shape['type'] === 'Group' || trim($shape['text']) !== '') {
                continue;
            }
            $rows = $shape['geometry']['world_geometry_sections'][0]['rows'] ?? [];
            if (! $rows || count(array_filter($rows, fn ($r) => ! in_array($r['attributes']['T'], ['MoveTo', 'LineTo'], true)))) {
                continue;
            }
            $points = array_values(array_filter(array_column($rows, 'world_point')));
            if (count($points) < 2) {
                continue;
            }
            $a = $points[0];
            $b = $points[count($points) - 1];
            if ($inside($a) === $inside($b)) {
                continue;
            }
            if ($recorded && ! isset($recorded[(string) $shape['id']])) {
                continue;
            }
            $highlights[] = ['shapeId' => $shape['id'], 'unresolvedEndpoint' => $inside($a) ? $b : $a, 'basis' => $recorded ? 'recorded_rejection' : 'exact_run_geometry_only', 'reason' => $recorded[(string) $shape['id']] ?? 'rejection_metadata_missing', 'status' => 'diagnostic_only_not_a_mapping'];
            if (count($highlights) >= 8) {
                break;
            }
        }

        return $highlights;
    }

    public function coverage(array $context, string $facet, int $page): array
    {
        $rows = [];
        $scopes = [];
        foreach ($context['sources'] as $doc) {
            $source = $doc['id'].'/'.$doc['sourceSha256'];
            if (($context['sourceFilter'] ?? null) && $context['sourceFilter'] !== $source) {
                continue;
            }
            $runId = $doc['source']['importRunId'] ?? $doc['interpretationRunId'] ?? (($context['runSource'] ?? null) === $source ? ($context['runId'] ?? null) : null);
            if (! $runId || ! Str::isUuid($runId) || ! DB::table('import_runs')->where('id', $runId)->where('source_revision', $source)->exists()) {
                $scopes[] = ['source' => $source, 'status' => 'exact_interpretation_run_unavailable'];

                continue;
            }
            $path = 'imports/'.$runId.'/semantic.json';
            $disk = Storage::disk('local');
            if (! $disk->exists($path) || $disk->size($path) > 16777216) {
                $scopes[] = ['source' => $source, 'status' => 'bounded_semantic_evidence_unavailable'];

                continue;
            }
            $semantic = json_decode($disk->get($path), true, flags: JSON_THROW_ON_ERROR);
            abort_unless(($semantic['source']['sha256'] ?? null) === $doc['sourceSha256'], 409, 'Coverage artifact source mismatch.');
            $scopes[] = ['source' => $source, 'runId' => $runId, 'basis' => 'stored interpreter diagnostics; not new optical facts'];
            if ($facet === 'banks') {
                foreach ($semantic['banks'] ?? [] as $bank) {
                    if (! ($bank['nodeOwners'] ?? [])) {
                        $rows[] = ['shapeId' => $bank['groupShapeId'], 'sourceRevision' => $source, 'title' => 'ბანკი · '.$bank['capacity'].'F', 'detail' => 'ქსელურ კვანძთან კავშირი არ არის დადგენილი. შეიძლება არსებულ საკითხებს ემთხვეოდეს.'];
                    }
                }
            } elseif ($facet === 'annotations') {
                foreach ($semantic['annotations'] ?? [] as $a) {
                    $rows[] = ['shapeId' => $a['shapeId'], 'sourceRevision' => $source, 'title' => $a['text'], 'detail' => 'ტექსტის ზუსტი scope და შესრულებული/დაგეგმილი სამუშაოს სტატუსი დასადგენია.'];
                }
            } elseif ($facet === 'raw_ports') {
                foreach ($semantic['ports'] ?? [] as $p) {
                    if (! $p['completePortBank']) {
                        $rows[] = ['shapeId' => $p['shapeId'], 'sourceRevision' => $source, 'title' => 'AP'.$p['apToken'].' · ნაბეჭდი '.$p['number'], 'detail' => 'ნუმერაციის საკითხის ნაწილია; დამატებით ხარვეზად არ ითვლება.'];
                    }
                }
            } elseif ($facet === 'local_links') {
                $count = $semantic['coverage']['nodeContainerAudit']['unresolvedLocalLinks'] ?? null;
                $rows[] = ['sourceRevision' => $source, 'title' => ($count ?? 'უცნობი').' ადგილობრივი ხაზის კავშირი შესამოწმებელია', 'detail' => 'აკლია ბანკის უნიკალური Cable ასოციაცია. ზუსტი ხაზის მატიანე სამუშაო ანგარიშშია; ყველა ხაზის აღდგენა არ არის დაპირებული.'];
            } else {
                $rows[] = ['sourceRevision' => $source, 'title' => ['aggregation_ports' => 'აგრეგაციის პორტები', 'construction' => 'ტუბების / რგოლის მნიშვნელობა', 'endpoints' => 'ბოლოების იდენტობა'][$facet] ?? $facet, 'detail' => 'საჭიროა წყაროს კონკრეტული მტკიცებულება. არსებული უცნობები არ არის დამატებითი დადასტურებული ქსელის ხარვეზები.'];
            }
        }

        return ['facet' => $facet, 'total' => count($rows), 'page' => $page, 'pages' => (int) ceil(count($rows) / 50), 'rows' => array_slice($rows, ($page - 1) * 50, 50), 'scopes' => $scopes, 'overlapWarning' => 'დაფარვის ერთეულები ხშირად ემთხვევა 606 საკითხს; ჯამში არ ემატება.', 'topologyChanged' => false];
    }
}
