<?php

namespace App\Http\Controllers;

use App\Services\NetworkStore;
use App\Services\ReviewInboxStore;
use App\Support\DatabaseScope;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class ReviewEventController extends Controller
{
    public function index(string $revision)
    {
        abort_unless(DB::table('network_revisions')->where('id', $revision)->exists(), 404);
        $events = DB::table('review_events')->join('users', 'users.id', '=', 'review_events.actor_id')->where('network_revision', $revision)->orderBy('review_events.created_at')->select('review_events.*', 'users.name as actor_name')->get();

        return response()->json(['networkRevision' => $revision, 'events' => $events]);
    }

    public function store(Request $request)
    {
        abort_unless($request->user(), 401);
        abort_unless($request->user()->role === 'reviewer', 403);
        DatabaseScope::assertWritable();
        $input = $request->validate(['expectedNetworkRevision' => 'required|string|max:200', 'subjectId' => 'required|string|max:200', 'expectedReviewVersion' => 'required|integer|min:0', 'action' => 'required|in:accepted,corrected,rejected,unresolved', 'reason' => 'required|string|max:2000', 'correction' => 'nullable|array', 'sourceRevision' => 'nullable|string|max:255']);

        return DB::transaction(function () use ($request, $input) {
            $active = DB::table('active_network_state')->where('id', 1)->lockForUpdate()->value('network_revision');
            if ($active !== $input['expectedNetworkRevision']) {
                return response()->json(['message' => 'Active network changed.', 'activeRevision' => $active], 409);
            }
            $subject = DB::table('domain_records')->where('network_revision', $active)->whereIn('collection', ['assertions', 'sourceReviewCases', 'evidenceRecords', 'issues'])->where('logical_id', $input['subjectId'])->exists();
            $candidate = Str::isUuid($input['subjectId']) ? DB::table('import_candidates')->join('import_runs', 'import_runs.id', '=', 'import_candidates.import_run')->where('import_candidates.id', $input['subjectId'])->select('import_runs.source_revision')->first() : null;
            abort_unless($subject || $candidate, 422, 'Unknown review subject.');
            if ($subject && isset($input['sourceRevision'])) {
                $context = app(ReviewInboxStore::class)->context($active, null, true);
                $record = collect($context['cases'])->firstWhere('id', $input['subjectId']);
                if ($record) {
                    abort_unless($record['sourceRevision'] === $input['sourceRevision'], 422, 'Review case source identity mismatch.');
                }
            }
            if (isset($input['correction'])) {
                abort_if(($input['correction']['type'] ?? null) === 'port_binding', 422, 'Typed Port corrections use the validated correction workflow.');
                $input['correction']['applied'] = false;
                $input['correction']['fieldVerified'] = false;
                $changes = $input['correction']['sourceChanges'] ?? [];
                abort_unless(is_array($changes) && count($changes) <= 24, 422);
                if ($changes) {
                    $record ??= collect(app(ReviewInboxStore::class)->context($active, null, true)['cases'])->firstWhere('id', $input['subjectId']);
                    abort_unless($record, 422);
                    foreach ($changes as $change) {
                        abort_unless(is_array($change) && in_array($change['shapeId'] ?? null, $record['case']['source']['shapeIds'] ?? [], true) && array_key_exists('oldValue', $change) && array_key_exists('newValue', $change), 422, 'Correction must identify this case’s exact source Shape and old/new values.');
                    }
                }
            }
            if ($candidate) {
                if (isset($input['sourceRevision'])) {
                    abort_unless($input['sourceRevision'] === $candidate->source_revision, 422, 'Candidate source revision mismatch.');
                }
                $input['sourceRevision'] = $candidate->source_revision;
            } elseif (isset($input['sourceRevision'])) {
                abort_unless(DB::table('network_sources')->where('network_revision', $active)->where('source_revision', $input['sourceRevision'])->exists(), 422, 'Source revision is not part of this network.');
            }
            DB::table('review_subject_versions')->insertOrIgnore(['network_revision' => $active, 'subject_id' => $input['subjectId'], 'version' => 0]);
            $subjectVersion = DB::table('review_subject_versions')->where('network_revision', $active)->where('subject_id', $input['subjectId'])->lockForUpdate()->first();
            if ($subjectVersion->version !== $input['expectedReviewVersion']) {
                return response()->json(['message' => 'Review changed.', 'currentVersion' => $subjectVersion->version], 409);
            }
            $version = $subjectVersion->version + 1;
            $event = ['id' => (string) Str::uuid(), 'network_revision' => $active, 'subject_id' => $input['subjectId'], 'version' => $version, 'actor_id' => $request->user()->id, 'action' => $input['action'], 'reason' => $input['reason'], 'correction' => isset($input['correction']) ? NetworkStore::json($input['correction']) : null, 'source_revision' => $input['sourceRevision'] ?? null, 'created_at' => now()];
            DB::table('review_events')->insert($event);
            DB::table('review_subject_versions')->where('network_revision', $active)->where('subject_id', $input['subjectId'])->update(['version' => $version]);

            return response()->json(['networkRevision' => $active, 'event' => $event], 201);
        });
    }
}
