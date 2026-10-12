<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\OwnerSetup;
use App\Support\DatabaseScope;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

final class LocalSessionController extends Controller
{
    public function show(Request $request)
    {
        $revision = DB::table('active_network_state')->where('id', 1)->value('network_revision');
        $legacyIssues = $revision ? DB::table('domain_records as issue')->where('issue.network_revision', $revision)->where('issue.collection', 'issues')->whereNotExists(fn ($q) => $q->selectRaw('1')->from('domain_records as c')->whereColumn('c.network_revision', 'issue.network_revision')->whereColumn('c.logical_id', 'issue.logical_id')->where('c.collection', 'sourceReviewCases'))->count() : 0;
        $count = $revision ? DB::table('domain_records')->where('network_revision', $revision)->where('collection', 'sourceReviewCases')->count() : 0;
        $count += $legacyIssues;
        if ($revision) {
            $resolved = DB::selectOne("SELECT count(DISTINCT v.subject_id)::integer AS total FROM review_subject_versions v JOIN review_events e ON e.network_revision=v.network_revision AND e.subject_id=v.subject_id AND e.version=v.version JOIN domain_records d ON d.network_revision=v.network_revision AND d.logical_id=v.subject_id AND d.collection IN ('sourceReviewCases','issues') WHERE v.network_revision=? AND (e.action IN ('accepted','rejected') OR (e.action='corrected' AND e.correction->>'type'='port_binding' AND e.correction->>'stage'='applied' AND e.correction->'newBinding' IS NOT NULL AND e.correction->'newBinding'<>'null'::jsonb))", [$revision]);
            $count -= $resolved->total;
        }
        $pendingSources = DB::table('import_runs')->where('network_status', '<>', 'applied')->whereNotExists(function ($later) {
            $later->selectRaw('1')->from('import_runs as successor')->whereColumn('successor.source_revision', 'import_runs.source_revision')->whereColumn('successor.created_at', '>', 'import_runs.created_at')->whereIn('successor.semantic_status', ['validated', 'unsupported', 'failed']);
        })->where(function ($runs) {
            $runs->whereIn('semantic_status', ['unsupported', 'failed'])->orWhere(function ($pending) {
                $pending->where('semantic_status', 'not_evaluated')->where('extraction_status', 'completed');
            });
        })->distinct()->count('source_revision');
        $count += $pendingSources;

        return response()->json(['csrfToken' => csrf_token(), 'user' => $request->user()?->only('id', 'name', 'role'), 'setupAvailable' => ! User::query()->exists(), 'networkRevision' => $revision, 'reviewCount' => $count, 'pendingSources' => $pendingSources]);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate(['email' => 'required|email', 'password' => 'required|string|max:256']);
        if (! Auth::attempt($credentials)) {
            return response()->json(['message' => 'Sign-in failed.'], 422);
        }
        $request->session()->regenerate();

        return $this->show($request);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['csrfToken' => csrf_token(), 'user' => null]);
    }

    public function setup(Request $request, OwnerSetup $setup)
    {
        DatabaseScope::assertWritable();
        abort_unless(in_array($request->ip(), ['127.0.0.1', '::1'], true), 403);
        $input = $request->validate(['name' => 'required|string|max:120', 'email' => 'required|email|max:240', 'password' => 'required|string|min:12|max:256', 'setupToken' => 'required|string|max:128']);
        abort_unless($setup->valid($input['setupToken']), 403, 'Owner setup link is missing, expired or already used.');
        $user = DB::transaction(function () use ($input, $setup) {
            DB::table('active_network_state')->where('id', 1)->lockForUpdate()->first();
            abort_unless($setup->valid($input['setupToken']), 409);
            $user = new User;
            $user->forceFill(['name' => $input['name'], 'email' => $input['email'], 'password' => Hash::make($input['password']), 'role' => 'reviewer'])->save();

            return $user;
        });
        $setup->consume();
        Auth::login($user);
        $request->session()->regenerate();

        return $this->show($request);
    }
}
