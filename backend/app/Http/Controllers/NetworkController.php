<?php

namespace App\Http\Controllers;

use App\Services\NetworkStore;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class NetworkController extends Controller
{
    public function current(Request $request, NetworkStore $store)
    {
        return DB::transaction(function () use ($request, $store) {
            $state = DB::table('active_network_state')->where('id', 1)->first();
            abort_unless($state, 503, 'Network state is missing.');
            $revision = $state->network_revision;
            if ($revision === null) {
                return response()->json(['apiVersion' => 1, 'networkState' => 'empty', 'networkRevision' => null], 200, ['Cache-Control' => 'no-store']);
            }

            return $this->jsonResponse($request, $store->projection($revision, 'operational'));
        });
    }

    public function details(Request $request, string $revision, NetworkStore $store)
    {
        return $this->jsonResponse($request, $store->projection($revision, 'details'));
    }

    public function records(string $revision, string $collection)
    {
        abort_unless(isset(NetworkStore::CORE[$collection]), 404);
        abort_unless(DB::table('network_revisions')->where('id', $revision)->exists(), 404);
        $rows = DB::table(NetworkStore::CORE[$collection])->where('network_revision', $revision)->orderBy('ordinal')->pluck('payload')->map(fn ($text) => json_decode($text, true, flags: JSON_THROW_ON_ERROR));

        return response()->json(['networkRevision' => $revision, 'collection' => $collection, 'records' => $rows]);
    }

    private function jsonResponse(Request $request, string $text)
    {
        $headers = ['Content-Type' => 'application/json; charset=utf-8', 'Cache-Control' => 'no-store', 'Vary' => 'Accept-Encoding'];
        if (str_contains($request->header('Accept-Encoding', ''), 'gzip')) {
            $text = gzencode($text, 6);
            $headers['Content-Encoding'] = 'gzip';
        }
        $headers['Content-Length'] = (string) strlen($text);

        return response($text, 200, $headers);
    }
}
