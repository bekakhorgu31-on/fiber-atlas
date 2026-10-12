<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Support\DatabaseScope;

return new class extends Migration {
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            throw new RuntimeException('Fiber Atlas persistence requires PostgreSQL.');
        }
        Schema::table('users', fn (Blueprint $t) => $t->string('role')->default('viewer'));
        Schema::create('network_revisions', function (Blueprint $t) {
            $t->string('id')->primary();
            $t->string('baseline_sha256', 64)->unique();
            $t->string('topology_revision');
            $t->string('display_revision');
            $t->string('status');
            $t->json('validation');
            $t->timestampTz('created_at');
        });
        Schema::create('active_network_state', function (Blueprint $t) {
            $t->unsignedInteger('id')->primary();
            $t->string('network_revision')->nullable();
            $t->foreign('network_revision')->references('id')->on('network_revisions');
        });
        DB::table('active_network_state')->insert(['id' => 1, 'network_revision' => null]);
        Schema::create('source_documents', function (Blueprint $t) {
            $t->string('id')->primary();
            $t->string('title');
            $t->timestampTz('created_at');
        });
        Schema::create('source_revisions', function (Blueprint $t) {
            $t->string('id')->primary();
            $t->string('document_id');
            $t->string('sha256',64);
            $t->string('original_name');
            $t->string('stored_path')->nullable();
            $t->jsonb('metadata');
            $t->timestampTz('created_at');
            $t->foreign('document_id')->references('id')->on('source_documents');
            $t->unique(['document_id','sha256']);
        });
        Schema::create('network_sources', function (Blueprint $t) {
            $t->string('network_revision'); $t->string('source_revision');
            $t->primary(['network_revision','source_revision']);
            $t->foreign('network_revision')->references('id')->on('network_revisions');
            $t->foreign('source_revision')->references('id')->on('source_revisions');
        });
        Schema::create('canonical_nodes', function (Blueprint $t) {
            $this->record($t); $t->string('kind'); $t->string('local_id');
            $t->unique(['network_revision','kind','local_id']);
        });
        Schema::create('cable_segments', function (Blueprint $t) {
            $this->record($t); $t->string('endpoint_a'); $t->string('endpoint_b');
            $t->unsignedInteger('fiber_count'); $t->string('legacy_label')->nullable();
            $t->foreign(['network_revision','endpoint_a'])->references(['network_revision','id'])->on('canonical_nodes');
            $t->foreign(['network_revision','endpoint_b'])->references(['network_revision','id'])->on('canonical_nodes');
        });
        Schema::create('tubes', function (Blueprint $t) {
            $this->record($t); $t->string('cable_id'); $t->integer('number')->nullable();
            $t->foreign(['network_revision','cable_id'])->references(['network_revision','id'])->on('cable_segments');
        });
        Schema::create('fibers', function (Blueprint $t) {
            $this->record($t); $t->string('cable_id'); $t->unsignedInteger('number'); $t->string('tube_id')->nullable();
            $t->unique(['network_revision','cable_id','number']);
            $t->foreign(['network_revision','cable_id'])->references(['network_revision','id'])->on('cable_segments');
            $t->foreign(['network_revision','tube_id'])->references(['network_revision','id'])->on('tubes');
        });
        Schema::create('ports', function (Blueprint $t) {
            $this->record($t); $t->string('owner_kind'); $t->string('owner_id'); $t->unsignedInteger('number');
            $t->unique(['network_revision','owner_kind','owner_id','number']);
        });
        Schema::create('node_fiber_transitions', function (Blueprint $t) {
            $this->record($t); $t->string('node_id'); $t->string('fiber_a'); $t->string('fiber_z')->nullable();
            $t->boolean('active'); $t->string('transition_type');
            $t->foreign(['network_revision','node_id'])->references(['network_revision','id'])->on('canonical_nodes');
            foreach (['fiber_a','fiber_z'] as $key) $t->foreign(['network_revision',$key])->references(['network_revision','id'])->on('fibers');
        });
        Schema::create('port_topology_bindings', function (Blueprint $t) {
            $this->record($t); $t->string('port_id'); $t->string('fiber_id');
            $t->foreign(['network_revision','port_id'])->references(['network_revision','id'])->on('ports');
            $t->foreign(['network_revision','fiber_id'])->references(['network_revision','id'])->on('fibers');
        });
        // All remaining collections retain one immutable record per domain item.
        // Core authority is in the constrained tables above, never an Inventory blob.
        Schema::create('domain_records', function (Blueprint $t) {
            $this->record($t); $t->string('collection');
            $t->index(['network_revision','collection']);
        });
        Schema::create('network_attributes', function (Blueprint $t) {
            $t->string('network_revision'); $t->string('name'); $t->json('payload');
            $t->primary(['network_revision','name']);
            $t->foreign('network_revision')->references('id')->on('network_revisions');
        });
        Schema::create('fiber_paths', function (Blueprint $t) {
            $this->record($t); $t->string('fiber_id'); $t->string('signature');
            $t->foreign(['network_revision','fiber_id'])->references(['network_revision','id'])->on('fibers');
        });
        Schema::create('projection_snapshots', function (Blueprint $t) {
            $t->string('network_revision'); $t->string('kind'); $t->longText('payload'); $t->string('sha256',64);
            $t->primary(['network_revision','kind']);
            $t->foreign('network_revision')->references('id')->on('network_revisions');
        });
        Schema::create('review_subject_versions', function (Blueprint $t) {
            $t->string('network_revision'); $t->string('subject_id'); $t->unsignedInteger('version')->default(0);
            $t->primary(['network_revision','subject_id']);
            $t->foreign('network_revision')->references('id')->on('network_revisions');
        });
        Schema::create('review_events', function (Blueprint $t) {
            $t->uuid('id')->primary(); $t->string('network_revision'); $t->string('subject_id');
            $t->unsignedInteger('version'); $t->foreignId('actor_id')->constrained('users');
            $t->string('action'); $t->text('reason'); $t->jsonb('correction')->nullable();
            $t->string('source_revision')->nullable(); $t->timestampTz('created_at');
            $t->unique(['network_revision','subject_id','version']);
            $t->foreign('network_revision')->references('id')->on('network_revisions');
            $t->foreign('source_revision')->references('id')->on('source_revisions');
        });
        Schema::create('activation_events', function (Blueprint $t) {
            $t->uuid('id')->primary(); $t->string('previous_revision')->nullable(); $t->string('new_revision');
            $t->string('operation'); $t->string('actor'); $t->timestampTz('created_at');
            $t->foreign('new_revision')->references('id')->on('network_revisions');
            $t->foreign('previous_revision')->references('id')->on('network_revisions');
        });
        Schema::create('import_runs', function (Blueprint $t) {
            $t->uuid('id')->primary(); $t->string('source_revision');
            $t->string('extractor_version'); $t->string('interpreter_version');
            $t->string('extraction_status'); $t->string('semantic_status'); $t->string('network_status');
            $t->string('artifact_path')->nullable(); $t->jsonb('summary')->nullable();
            $t->jsonb('warnings'); $t->text('error')->nullable(); $t->foreignId('actor_id')->nullable()->constrained('users');
            $t->timestampTz('created_at'); $t->timestampTz('finished_at')->nullable();
            $t->foreign('source_revision')->references('id')->on('source_revisions');
            $t->unique(['source_revision','extractor_version','interpreter_version']);
        });
        Schema::create('import_candidates', function (Blueprint $t) {
            $t->uuid('id')->primary(); $t->uuid('import_run'); $t->string('kind'); $t->string('status'); $t->jsonb('payload');
            $t->foreign('import_run')->references('id')->on('import_runs');
        });
        $schema='"'.DatabaseScope::schema().'"';
        DB::unprepared(str_replace('__SCHEMA__',$schema,<<<'SQL'
CREATE OR REPLACE FUNCTION __SCHEMA__.fiber_assert_transition_node() RETURNS trigger LANGUAGE plpgsql SET search_path=__SCHEMA__,pg_catalog AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM __SCHEMA__.fibers f JOIN __SCHEMA__.cable_segments c
    ON c.network_revision=f.network_revision AND c.id=f.cable_id
    WHERE f.network_revision=NEW.network_revision AND f.id IN (NEW.fiber_a,NEW.fiber_z)
    AND NEW.node_id NOT IN (c.endpoint_a,c.endpoint_b)
  ) THEN RAISE EXCEPTION 'Fiber transition must share its real cable endpoint node'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER enforce_transition_node BEFORE INSERT OR UPDATE ON node_fiber_transitions
FOR EACH ROW EXECUTE FUNCTION __SCHEMA__.fiber_assert_transition_node();
CREATE OR REPLACE FUNCTION __SCHEMA__.fiber_append_only() RETURNS trigger LANGUAGE plpgsql SET search_path=__SCHEMA__,pg_catalog AS $$
BEGIN RAISE EXCEPTION 'Audit history is append-only'; END $$;
CREATE TRIGGER immutable_review_events BEFORE UPDATE OR DELETE ON review_events
FOR EACH ROW EXECUTE FUNCTION __SCHEMA__.fiber_append_only();
CREATE TRIGGER immutable_activation_events BEFORE UPDATE OR DELETE ON activation_events
FOR EACH ROW EXECUTE FUNCTION __SCHEMA__.fiber_append_only();
SQL));
    }
    private function record(Blueprint $t): void
    {
        $t->string('network_revision'); $t->string('id'); $t->unsignedInteger('ordinal'); $t->json('payload');
        $t->primary(['network_revision','id']);
        $t->foreign('network_revision')->references('id')->on('network_revisions');
    }
    public function down(): void
    {
        foreach (['import_candidates','import_runs','activation_events','review_events','review_subject_versions','projection_snapshots','fiber_paths','network_attributes','domain_records','port_topology_bindings','node_fiber_transitions','ports','fibers','tubes','cable_segments','canonical_nodes','network_sources','source_revisions','source_documents','active_network_state','network_revisions'] as $table) Schema::dropIfExists($table);
        DB::unprepared('DROP FUNCTION IF EXISTS '.DatabaseScope::qualifiedFunction('fiber_assert_transition_node').'(); DROP FUNCTION IF EXISTS '.DatabaseScope::qualifiedFunction('fiber_append_only').'();');
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn('role'));
    }
};
