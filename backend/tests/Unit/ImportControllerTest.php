<?php

namespace Tests\Unit;

use App\Http\Controllers\ImportController;
use App\Models\User;
use App\Services\ImportStore;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

final class ImportControllerTest extends TestCase
{
    public function test_geometry_reprocess_requires_a_signed_in_user(): void
    {
        $this->expectException(HttpException::class);

        (new ImportController)->reprocess(Request::create('/api/v1/imports/example/reprocess', 'POST'), 'example', app(ImportStore::class));
    }

    public function test_geometry_reprocess_is_reviewer_only(): void
    {
        $request = Request::create('/api/v1/imports/example/reprocess', 'POST');
        $request->setUserResolver(fn () => (new User)->forceFill(['id' => 7, 'role' => 'viewer']));
        $this->expectException(HttpException::class);

        (new ImportController)->reprocess($request, 'example', app(ImportStore::class));
    }
}
