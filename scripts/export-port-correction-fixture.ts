import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {correctionFixture,bankRemapFixture,partialBankRemapFixture} from '../tests/fixtures/port-correction';
import {buildOperationalPayload,packJson,DEFERRED_NETWORK_FIELDS} from '../src/domain/operationalPayload';
const data=process.argv[3]==='partial-bank'?partialBankRemapFixture():process.argv[3]==='legacy-bank'?bankRemapFixture(true):process.argv[3]==='bank'?bankRemapFixture():correctionFixture(),revision='LOCAL-PORT-CORRECTION-FIXTURE';
const detail:Record<string,unknown>=Object.fromEntries(DEFERRED_NETWORK_FIELDS.map(k=>[k,data[k]??[]]));detail.fiberPathAudit=data.fiberPathProjection!.audit;
writeFileSync(process.argv[2],JSON.stringify({authority:data,operational:buildOperationalPayload(data,revision),details:{apiVersion:1,networkRevision:revision,inventory:packJson(detail)},networkRevision:revision,authoritySha256:createHash('sha256').update(JSON.stringify(data)).digest('hex'),counts:{cable_segments:data.cables.length,fibers:data.fibers.length,node_fiber_transitions:data.nodeFiberTransitions!.length,port_topology_bindings:data.portTopologyBindings!.length,fiber_paths:data.fibers.length}}));
