<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        // The same authority can have a new immutable transport/projection version.
        Schema::table('network_revisions',function(Blueprint $t) {
            $t->dropUnique(['baseline_sha256']);
            $t->index('baseline_sha256');
        });
    }
    public function down(): void {
        // Do not collapse distinct retained projection revisions during rollback.
        Schema::table('network_revisions',fn(Blueprint $t)=>$t->dropIndex(['baseline_sha256']));
    }
};
