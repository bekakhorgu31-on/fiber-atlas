<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use App\Support\DatabaseScope;
return new class extends Migration {
    private array $tables=['canonical_nodes','cable_segments','tubes','fibers','ports','node_fiber_transitions','port_topology_bindings','domain_records','network_attributes','fiber_paths','projection_snapshots','network_sources'];
    public function up():void {
        $schema='"'.DatabaseScope::schema().'"';
        DB::unprepared(str_replace('__SCHEMA__',$schema,<<<'SQL'
CREATE OR REPLACE FUNCTION __SCHEMA__.fiber_immutable_snapshot() RETURNS trigger LANGUAGE plpgsql SET search_path=__SCHEMA__,pg_catalog AS $$
BEGIN
 IF (SELECT status FROM __SCHEMA__.network_revisions WHERE id=COALESCE(NEW.network_revision,OLD.network_revision))='validated'
 THEN RAISE EXCEPTION 'Validated network snapshot is immutable'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;
SQL));
        foreach($this->tables as $table)DB::unprepared('CREATE TRIGGER sealed_snapshot BEFORE INSERT OR UPDATE OR DELETE ON '.$table.' FOR EACH ROW EXECUTE FUNCTION '.DatabaseScope::qualifiedFunction('fiber_immutable_snapshot').'();');
    }
    public function down():void {
        foreach($this->tables as $table)DB::unprepared("DROP TRIGGER IF EXISTS sealed_snapshot ON $table;");
        DB::unprepared('DROP FUNCTION IF EXISTS '.DatabaseScope::qualifiedFunction('fiber_immutable_snapshot').'();');
    }
};
