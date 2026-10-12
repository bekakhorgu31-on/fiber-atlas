<?php

use App\Support\DatabaseScope;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DatabaseScope::assertWritable();
        DB::statement("CREATE INDEX source_shapes_bounds_gist ON source_shapes USING gist (box(point((payload->'geometry'->'world_bounds'->>'min_x')::float8,(payload->'geometry'->'world_bounds'->>'min_y')::float8),point((payload->'geometry'->'world_bounds'->>'max_x')::float8,(payload->'geometry'->'world_bounds'->>'max_y')::float8)))");
    }

    public function down(): void
    {
        DatabaseScope::assertWritable();
        DB::statement('DROP INDEX IF EXISTS source_shapes_bounds_gist');
    }
};
