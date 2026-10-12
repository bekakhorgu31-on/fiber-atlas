<?php

namespace App\Http\Controllers;

use App\Services\PortCorrectionStore;
use Illuminate\Http\Request;

final class PortCorrectionController extends Controller
{
    private function authorizeReviewer(Request $request): void
    {
        abort_unless($request->user(), 401);
        abort_unless($request->user()->role === 'reviewer', 403);
    }

    public function options(Request $request, PortCorrectionStore $store)
    {
        $this->authorizeReviewer($request);
        $input = $request->validate(['subjectId' => 'required|string|max:200', 'revision' => 'required|string|max:200']);

        return response()->json($store->options($input['subjectId'], $input['revision']));
    }

    public function draft(Request $request, PortCorrectionStore $store)
    {
        $this->authorizeReviewer($request);
        $input = $request->validate(['subjectId' => 'required|string|max:200', 'expectedNetworkRevision' => 'required|string|max:200', 'expectedReviewVersion' => 'required|integer|min:0', 'sourceRevision' => 'required|string|max:255', 'portId' => 'required|string|max:200', 'operation' => 'required|in:set,remap,revert', 'reverts' => 'required_if:operation,revert|uuid', 'segmentId' => 'required_if:operation,set,remap|string|max:200', 'fiberNumber' => 'required_if:operation,set|integer|min:1|max:4096', 'evidenceBasis' => 'required|in:source_geometry,owner_confirmation,engineer_review', 'evidenceShapeIds' => 'required|array|min:1|max:24', 'evidenceShapeIds.*' => 'required|string|max:64|distinct', 'reason' => 'required|string|min:5|max:2000']);

        return response()->json($store->draft($input, $request->user()->id), 201);
    }

    public function validateDraft(Request $request, string $draft, PortCorrectionStore $store)
    {
        $this->authorizeReviewer($request);
        $input = $request->validate(['expectedNetworkRevision' => 'required|string|max:200', 'expectedReviewVersion' => 'required|integer|min:0']);

        return response()->json($store->validateDraft($draft, $input['expectedNetworkRevision'], $input['expectedReviewVersion'], $request->user()->id));
    }

    public function preview(Request $request, string $draft, PortCorrectionStore $store)
    {
        $this->authorizeReviewer($request);
        $input = $request->validate(['facet' => 'nullable|in:paths,facts', 'page' => 'nullable|integer|min:1|max:10000']);

        return response()->json($store->preview($draft, $input['facet'] ?? 'paths', (int) ($input['page'] ?? 1)));
    }

    public function apply(Request $request, string $draft, PortCorrectionStore $store)
    {
        $this->authorizeReviewer($request);
        $input = $request->validate(['expectedNetworkRevision' => 'required|string|max:200', 'expectedReviewVersion' => 'required|integer|min:0', 'candidateSha256' => 'required|string|size:64', 'acknowledgeImpact' => 'required|accepted']);

        return response()->json($store->apply($draft, $input['expectedNetworkRevision'], $input['expectedReviewVersion'], $input['candidateSha256'], $request->user()->id));
    }

    public function importPreview(Request $request, string $run, PortCorrectionStore $store)
    {
        $this->authorizeReviewer($request);
        $input = $request->validate(['facet' => 'nullable|in:paths,facts', 'page' => 'nullable|integer|min:1|max:10000']);

        return response()->json($store->importPreview($run, $input['facet'] ?? 'paths', (int) ($input['page'] ?? 1)));
    }

    public function reconcileImport(Request $request, string $run, PortCorrectionStore $store)
    {
        $this->authorizeReviewer($request);
        $input = $request->validate(['expectedNetworkRevision' => 'required|string|max:200', 'candidateSha256' => 'required|string|size:64', 'draftIds' => 'required|array|min:1|max:10000', 'draftIds.*' => 'required|uuid|distinct', 'reason' => 'required|string|min:5|max:2000', 'acknowledgeImpact' => 'required|accepted']);

        return response()->json($store->acceptImportedSource($run, $input, $request->user()->id));
    }
}
