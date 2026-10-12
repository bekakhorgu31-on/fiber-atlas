import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {hydrateOperationalPayload,unpackJson,buildOperationalPayload,packJson,DEFERRED_NETWORK_FIELDS} from '../src/domain/operationalPayload';
import {projectPortCorrection,correctionImpact,portCorrectionFailure} from '../src/domain/portCorrection';
const [inputFile,outputFile]=process.argv.slice(2);
try {
const input=JSON.parse(readFileSync(inputFile,'utf8'));
const before=hydrateOperationalPayload(input.operational),details=unpackJson(input.details.inventory) as Record<string,unknown>;
Object.assign(before,Object.fromEntries(DEFERRED_NETWORK_FIELDS.map(k=>[k,details[k]??[]])));
const revision='CORRECTION-'+input.correction.id,after=projectPortCorrection(before,input.correction,revision),impact=correctionImpact(before,after);
const detail:Record<string,unknown>=Object.fromEntries(DEFERRED_NETWORK_FIELDS.map(k=>[k,after[k]??[]]));detail.fiberPathAudit=after.fiberPathProjection!.audit;
const authoritySha256=createHash('sha256').update(JSON.stringify(after)).digest('hex');
writeFileSync(outputFile,JSON.stringify({authority:after,operational:buildOperationalPayload(after,revision),details:{apiVersion:1,networkRevision:revision,inventory:packJson(detail)},networkRevision:revision,authoritySha256,expectedRevision:input.expectedRevision,counts:{cable_segments:after.cables.length,fibers:after.fibers.length,node_fiber_transitions:after.nodeFiberTransitions!.length,port_topology_bindings:after.portTopologyBindings!.length,fiber_paths:after.fibers.length},impact}));
} catch(error) {
 const failure=portCorrectionFailure(error);
 writeFileSync(outputFile+'.validation-error.json',JSON.stringify(failure));
 if(failure.code==='validator_unavailable')console.error(error);
 process.exitCode=1;
}
