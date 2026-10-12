<?php

namespace App\Http\Controllers;

use App\Services\ImportedNetworkStore;
use App\Services\ImportStore;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class ImportController extends Controller
{
    public function index()
    {
        $runs = DB::table('import_runs')->join('source_revisions', 'source_revisions.id', '=', 'import_runs.source_revision')->orderByDesc('import_runs.created_at')->select('import_runs.*', 'source_revisions.document_id', 'source_revisions.original_name', 'source_revisions.sha256')->limit(100)->get();

        return response()->json(['runs' => $runs]);
    }

    public function documents()
    {
        return response()->json(['documents' => DB::table('source_documents')->orderBy('title')->get(['id', 'title'])]);
    }

    public function store(Request $request, ImportStore $store)
    {
        abort_unless($request->user(), 401);
        abort_unless($request->user()->role === 'reviewer', 403);
        $input = $request->validate(['file' => 'required|file|max:20480', 'documentId' => 'nullable|string|max:160|exists:source_documents,id', 'title' => 'nullable|string|max:240', 'newDocument' => 'nullable|boolean']);
        if (empty($input['documentId'])) {
            abort_unless($request->boolean('newDocument') && ! empty($input['title']), 422, 'Choose an existing document or explicitly create a named document.');
        }
        $file = $request->file('file');
        $result = $store->stage($file->getRealPath(), $file->getClientOriginalName(), $input['documentId'] ?? null, $input['title'] ?? null, $request->user()->id);

        return response()->json($result, $result['reused'] ? 200 : 201);
    }

    public function candidates(string $run)
    {
        abort_unless(DB::table('import_runs')->where('id', $run)->exists(), 404);

        return response()->json(['runId' => $run, 'candidates' => DB::table('import_candidates')->where('import_run', $run)->get()]);
    }

    public function reprocess(Request $request, string $run, ImportStore $store)
    {
        abort_unless($request->user(), 401);
        abort_unless($request->user()->role === 'reviewer', 403);

        return response()->json($store->reprocessGeometry($run, $request->user()->id));
    }

    public function shape(Request $request)
    {
        $input = $request->validate(['networkRevision' => 'nullable|string', 'sourceRevision' => 'required|string', 'pageId' => 'required|string|max:64', 'shapeId' => 'required|string|max:64', 'importRun' => 'nullable|uuid']);
        $revision = $input['networkRevision'] ?? null;
        if ($revision) {
            abort_unless(DB::table('network_revisions')->where('id', $revision)->exists(), 404);
        }
        $linked = $revision && DB::table('network_sources')->where('network_revision', $revision)->where('source_revision', $input['sourceRevision'])->exists();
        if (! $linked) {
            abort_unless($request->user(), 401, 'Sign in to inspect staged source evidence.');
        }
        $runs = DB::table('import_runs')->where('source_revision', $input['sourceRevision'])->where('extraction_status', 'completed');
        if (isset($input['importRun'])) {
            $runs->where('id', $input['importRun']);
        }
        $run = $runs->orderByDesc('created_at')->first();
        abort_unless($run, 404, 'No indexed extraction exists for this source revision.');
        $shape = DB::table('source_shapes')->where('source_revision', $input['sourceRevision'])->where('import_run', $run->id)->where('page_id', $input['pageId'])->where('shape_id', $input['shapeId'])->first();
        abort_unless($shape, 404, 'This exact source Shape has not been indexed.');

        return response()->json(['networkRevision' => $revision, 'sourceRevision' => $input['sourceRevision'], 'linkedToNetwork' => $linked, 'importRun' => $run->id, 'semanticStatus' => $run->semantic_status, 'networkStatus' => $run->network_status, 'pageId' => $input['pageId'], 'shape' => json_decode($shape->payload, true, flags: JSON_THROW_ON_ERROR)]);
    }

    public function apply(Request $request, string $run, ImportedNetworkStore $store)
    {
        abort_unless($request->user(), 401);
        abort_unless($request->user()->role === 'reviewer', 403);
        $input = $request->validate(['expectedNetworkRevision' => 'present|nullable|string', 'candidateSha256' => 'nullable|string|size:64']);

        return response()->json($store->apply($run, $input['expectedNetworkRevision'], $request->user()->id, $input['candidateSha256'] ?? null));
    }
}
