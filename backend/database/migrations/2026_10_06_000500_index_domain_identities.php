<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up():void {
        Schema::table('domain_records',function(Blueprint $t){$t->string('logical_id')->nullable();$t->index(['network_revision','collection','logical_id']);});
        // Derived identity index only; immutable payloads and graph rows are untouched.
        DB::unprepared("ALTER TABLE domain_records DISABLE TRIGGER sealed_snapshot; UPDATE domain_records SET logical_id=payload->>'id'; ALTER TABLE domain_records ENABLE TRIGGER sealed_snapshot;");
    }
    public function down():void {
        Schema::table('domain_records',function(Blueprint $t){$t->dropIndex(['network_revision','collection','logical_id']);$t->dropColumn('logical_id');});
    }
};
