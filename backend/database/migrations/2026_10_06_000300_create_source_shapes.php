<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up():void {
        Schema::create('source_shapes',function(Blueprint $t) {
            $t->string('source_revision');$t->uuid('import_run');$t->string('page_id',64);$t->string('shape_id',64);$t->jsonb('payload');
            $t->primary(['source_revision','import_run','page_id','shape_id']);
            $t->foreign('source_revision')->references('id')->on('source_revisions');
            $t->foreign('import_run')->references('id')->on('import_runs');
        });
    }
    public function down():void { Schema::dropIfExists('source_shapes'); }
};
