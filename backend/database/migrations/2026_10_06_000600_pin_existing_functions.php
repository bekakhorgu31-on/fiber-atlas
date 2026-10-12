<?php
use App\Support\DatabaseScope;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
return new class extends Migration {
    public function up():void {
        foreach(['fiber_assert_transition_node','fiber_append_only','fiber_immutable_snapshot']as $name)
            DB::unprepared('ALTER FUNCTION '.DatabaseScope::qualifiedFunction($name).'() SET search_path TO "'.DatabaseScope::schema().'", pg_catalog');
    }
    public function down():void { /* Keep the schema restriction during retained-table rollback. */ }
};
