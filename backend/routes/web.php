<?php

use App\Http\Controllers\ImportController;
use App\Http\Controllers\LocalSessionController;
use App\Http\Controllers\NetworkController;
use App\Http\Controllers\PortCorrectionController;
use App\Http\Controllers\ReviewEventController;
use App\Http\Controllers\ReviewInboxController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('api/v1')->group(function () {
    Route::get('network', [NetworkController::class, 'current']);
    Route::get('network/{revision}/details', [NetworkController::class, 'details']);
    Route::get('network/{revision}/records/{collection}', [NetworkController::class, 'records']);
    Route::get('network/{revision}/review-events', [ReviewEventController::class, 'index']);
    Route::get('session', [LocalSessionController::class, 'show']);
    Route::post('login', [LocalSessionController::class, 'login'])->middleware('throttle:10,1');
    Route::post('owner-setup', [LocalSessionController::class, 'setup'])->middleware('throttle:5,1');
    Route::post('logout', [LocalSessionController::class, 'logout']);
    Route::post('review-events', [ReviewEventController::class, 'store']);
    Route::get('port-corrections/options', [PortCorrectionController::class, 'options']);
    Route::post('port-corrections', [PortCorrectionController::class, 'draft']);
    Route::post('port-corrections/{draft}/validate', [PortCorrectionController::class, 'validateDraft'])->whereUuid('draft');
    Route::get('port-corrections/{draft}/preview', [PortCorrectionController::class, 'preview'])->whereUuid('draft');
    Route::post('port-corrections/{draft}/apply', [PortCorrectionController::class, 'apply'])->whereUuid('draft');
    Route::get('review-inbox', [ReviewInboxController::class, 'index']);
    Route::get('review-inbox/detail', [ReviewInboxController::class, 'detail']);
    Route::get('review-inbox/evidence', [ReviewInboxController::class, 'evidence']);
    Route::get('review-inbox/coverage', [ReviewInboxController::class, 'coverage']);
    Route::get('imports', [ImportController::class, 'index']);
    Route::get('documents', [ImportController::class, 'documents']);
    Route::post('imports', [ImportController::class, 'store']);
    Route::get('imports/{run}/candidates', [ImportController::class, 'candidates'])->whereUuid('run');
    Route::post('imports/{run}/reprocess', [ImportController::class, 'reprocess'])->whereUuid('run');
    Route::get('imports/{run}/correction-preview', [PortCorrectionController::class, 'importPreview'])->whereUuid('run');
    Route::post('imports/{run}/reconcile-corrections', [PortCorrectionController::class, 'reconcileImport'])->whereUuid('run');
    Route::post('imports/{run}/apply', [ImportController::class, 'apply'])->whereUuid('run');
    Route::get('source-shape', [ImportController::class, 'shape']);
});

Route::get('/assets/{file}', function (Request $request, string $file) {
    $path = dirname(base_path()).'/dist/assets/'.$file;
    abort_unless(is_file($path), 404);
    $text = file_get_contents($path);
    $type = str_ends_with($file, '.js') ? 'application/javascript' : (str_ends_with($file, '.css') ? 'text/css' : 'application/octet-stream');
    $headers = ['Content-Type' => $type, 'Cache-Control' => 'public, max-age=3600', 'Vary' => 'Accept-Encoding'];
    if (str_contains($request->header('Accept-Encoding', ''), 'gzip')) {
        $text = gzencode($text, 6);
        $headers['Content-Encoding'] = 'gzip';
    }
    $headers['Content-Length'] = (string) strlen($text);

    return response($text, 200, $headers);
})->where('file', '[A-Za-z0-9_.-]+');
Route::get('/favicon.svg', fn () => response()->file(dirname(base_path()).'/dist/favicon.svg'));

Route::get('/', function (Request $request) {
    if ($request->query('data') !== 'database') {
        return redirect('/?data=database');
    }
    $path = dirname(base_path()).'/dist/index.html';
    abort_unless(is_file($path), 503, 'Build the existing React application first.');

    return response(file_get_contents($path))->header('Cache-Control', 'no-store');
});
