<?php

namespace App\Http\Controllers;

use App\Services\ReviewInboxStore;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

final class ReviewInboxController extends Controller
{
    private float $contextMs = 0;

    private float $cropMs = 0;

    private function respond(Request $request, array $value): Response
    {
        $start = hrtime(true);
        $text = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        $jsonMs = (hrtime(true) - $start) / 1e6;
        $headers = ['Content-Type' => 'application/json; charset=utf-8', 'Cache-Control' => 'private, no-store', 'Vary' => 'Accept-Encoding, Cookie'];
        if (str_contains($request->header('Accept-Encoding', ''), 'gzip')) {
            $text = gzencode($text, 6);
            $headers['Content-Encoding'] = 'gzip';
        }
        $headers['Server-Timing'] = sprintf('review_context;dur=%.2f, crop;dur=%.2f, json;dur=%.2f', $this->contextMs, $this->cropMs, $jsonMs);
        $headers['Content-Length'] = (string) strlen($text);

        return response($text, 200, $headers);
    }

    private function matchesSearch(string $text, string $query): bool
    {
        if (preg_match('/\bAP\s*(\d+)\b.*?\bPort\s*(\d+)\b/i', $query, $matches)) {
            return (bool) preg_match('/\bAP\s*'.preg_quote($matches[1], '/').'\b.*?\bPort\s*'.preg_quote($matches[2], '/').'(?!\d)/i', $text);
        }
        $normalize = fn ($value) => mb_strtolower(trim(preg_replace('/\s+/u', ' ', preg_replace('/([a-zA-Z])(\d)/u', '$1 $2', preg_replace('/[\/·↔–—-]+/u', ' ', $value)))));
        $text = $normalize($text);
        foreach (explode(' ', $normalize($query)) as $word) {
            if ($word !== '' && ! preg_match('/(?<![\p{L}\p{N}])'.preg_quote($word, '/').'(?![\p{L}\p{N}])/u', $text)) {
                return false;
            }
        }

        return true;
    }

    private function context(Request $request, ReviewInboxStore $store, bool $selective = false, bool $mutable = true): array
    {
        $input = $request->validate(['revision' => 'nullable|string|max:200', 'run' => 'nullable|uuid', 'source' => 'nullable|string|max:255', 'category' => 'nullable|string|max:80', 'status' => 'nullable|in:all,open,reviewed', 'group' => 'nullable|string|max:300', 'q' => 'nullable|string|max:200', 'page' => 'nullable|integer|min:1', 'case' => 'nullable|string|max:200', 'coverage' => 'nullable|in:banks,annotations,raw_ports,local_links,aggregation_ports,construction,endpoints', 'shape' => 'nullable|string|max:64']);
        $started = hrtime(true);
        $context = $store->context($input['revision'] ?? null, $input['run'] ?? null, (bool) $request->user(), $selective ? ($input['case'] ?? '') : null, $mutable);
        $this->contextMs = (hrtime(true) - $started) / 1e6;
        $source = $input['source'] ?? $context['runSource'] ?? null;
        if ($source) {
            abort_unless(collect($context['sources'])->contains(fn ($doc) => $source === $doc['id'].'/'.$doc['sourceSha256']), 404, 'Source is not part of this review context.');
            $context['cases'] = array_values(array_filter($context['cases'], fn ($c) => $c['sourceRevision'] === $source));
        }
        $context['sourceFilter'] = $source;
        $latest = [];
        foreach ($context['events'] as $event) {
            $latest[$event['subject_id']] = $event;
        }
        foreach ($context['cases'] as &$case) {
            $event = $latest[$case['id']] ?? null;
            $case['reviewVersion'] = $case['currentReviewVersion'] ?? $event['version'] ?? 0;
            $case['disposition'] = $event['action'] ?? 'unresolved';
            $case['open'] = ! $event || ! in_array($event['action'], ['accepted', 'rejected'], true);
            $case['networkFactResolved'] = $case['operatorBindingActive'] ?? false;
            if ($case['networkFactResolved'] && ($event['action'] ?? null) === 'corrected') {
                $case['open'] = false;
            }
        }

        return $context;
    }

    public function index(Request $request, ReviewInboxStore $store)
    {
        $context = $this->context($request, $store);
        $cases = $context['cases'];
        $categories = [];
        foreach ($cases as $case) {
            $categories[$case['category']] = ($categories[$case['category']] ?? 0) + 1;
        }
        $filtered = array_values(array_filter($cases, function ($c) use ($request) {
            return (! $request->filled('category') || $c['category'] === $request->query('category')) && (! $request->filled('group') || $c['groupId'] === $request->query('group')) && ($request->query('status', 'all') === 'all' || ($request->query('status') === 'open') === $c['open']) && (! $request->filled('q') || $this->matchesSearch($c['search'], $request->query('q')));
        }));
        $groups = [];
        foreach ($filtered as $c) {
            $id = $c['groupId'];
            $groups[$id] ??= ['id' => $id, 'title' => $c['groupTitle'], 'category' => $c['category'], 'count' => 0, 'open' => 0];
            $groups[$id]['count']++;
            $groups[$id]['open'] += (int) $c['open'];
        }
        $page = min((int) $request->query('page', 1), max(1, (int) ceil(count($filtered) / 50)));
        $rows = array_map(function ($c) {
            $c['sourceShapeIds'] = $c['case']['source']['shapeIds'] ?? [];
            unset($c['case'],$c['search']);

            return $c;
        }, array_slice($filtered, ($page - 1) * 50, 50));
        unset($context['cases'],$context['events']);

        return $this->respond($request, ['context' => $context, 'total' => count($cases), 'open' => count(array_filter($cases, fn ($c) => $c['open'])), 'reviewed' => count(array_filter($cases, fn ($c) => ! $c['open'])), 'unresolvedFacts' => count(array_filter($cases, fn ($c) => ! $c['networkFactResolved'])), 'categories' => $categories, 'groups' => array_values($groups), 'filtered' => count($filtered), 'page' => $page, 'pages' => (int) ceil(count($filtered) / 50), 'rows' => $rows]);
    }

    public function detail(Request $request, ReviewInboxStore $store)
    {
        $context = $this->context($request, $store, true);
        $case = collect($context['cases'])->firstWhere('id', $request->query('case'));
        abort_unless($case, 404, 'Case is not part of this review context.');

        return $this->respond($request, ['context' => array_diff_key($context, array_flip(['cases', 'events'])), 'record' => $case, 'events' => array_values(array_filter($context['events'], fn ($e) => $e['subject_id'] === $case['id']))]);
    }

    public function evidence(Request $request, ReviewInboxStore $store)
    {
        $context = $this->context($request, $store, true, false);
        $case = collect($context['cases'])->firstWhere('id', $request->query('case'));
        if (! $case && $request->filled('shape') && ($context['sourceFilter'] ?? null)) {
            $doc = collect($context['sources'])->first(fn ($d) => $context['sourceFilter'] === $d['id'].'/'.$d['sourceSha256']);
            $case = ['category' => 'coverage', 'sourceRevision' => $context['sourceFilter'], 'case' => ['source' => ['shapeIds' => [$request->query('shape')], 'pageId' => $doc['sourcePages'][0]['id'] ?? '0', 'importRunId' => $doc['source']['importRunId'] ?? $doc['interpretationRunId'] ?? null]]];
        }
        abort_unless($case, 404);

        $started = hrtime(true);
        $value = $store->evidence($context, $case);
        $this->cropMs = (hrtime(true) - $started) / 1e6;

        return $this->respond($request, $value);
    }

    public function coverage(Request $request, ReviewInboxStore $store)
    {
        $context = $this->context($request, $store);

        return $this->respond($request, $store->coverage($context, $request->query('coverage', 'banks'), (int) $request->query('page', 1)));
    }
}
