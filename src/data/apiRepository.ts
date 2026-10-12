import type { Inventory } from '../domain/types';
import type { NetworkRepository } from './repository';
import {repository as offlineRepository} from './repository';
import {hydrateOperationalPayload,unpackJson,DEFERRED_NETWORK_FIELDS,type OperationalNetworkPayload,type PackedJson} from '../domain/operationalPayload';

export class ApiNetworkRepository implements NetworkRepository {
  constructor(private readonly base='/api/v1',private readonly request:typeof fetch=globalThis.fetch.bind(globalThis)) {}
  async load():Promise<Inventory> {
    const response=await this.request(this.base+'/network',{credentials:'same-origin',headers:{Accept:'application/json'}});
    if(!response.ok) throw new Error('Database network connection failed: HTTP '+response.status);
    const parseStart=performance.now(),payload=await response.json() as OperationalNetworkPayload;
    if((payload as unknown as {networkState:string}).networkState==='empty'){
      if(payload.apiVersion!==1||(payload.networkRevision as string|null)!==null)throw new Error('Invalid empty network response.');
      throw new EmptyNetworkError();
    }
    performance.measure('fiber-atlas:api-json-parse',{start:parseStart,duration:performance.now()-parseStart});
    const hydrateStart=performance.now(),data=hydrateOperationalPayload(payload);
    performance.measure('fiber-atlas:api-hydrate',{start:hydrateStart,duration:performance.now()-hydrateStart});
    return data;
  }
  async loadDetails(data:Inventory):Promise<Inventory> {
    const revision=data.dataAvailability?.networkRevision;
    if(!revision)throw new Error('Missing pinned network revision.');
    const response=await this.request(`${this.base}/network/${encodeURIComponent(revision)}/details`,{credentials:'same-origin',headers:{Accept:'application/json'}});
    if(!response.ok)throw new Error('Evidence load failed: HTTP '+response.status);
    const envelope=await response.json() as {apiVersion:number;networkRevision:string;inventory:PackedJson};
    if(envelope.apiVersion!==1||envelope.networkRevision!==revision)throw new Error('Evidence revision mismatch.');
    const detail=unpackJson(envelope.inventory) as Record<string,unknown>;
    for(const field of [...DEFERRED_NETWORK_FIELDS,'fiberPathAudit']) if(!Array.isArray(detail[field]))throw new Error('Missing deferred evidence: '+field);
    const {fiberPathAudit,...collections}=detail;
    return {...data,...collections,fiberPathProjection:{...data.fiberPathProjection!,audit:fiberPathAudit as NonNullable<Inventory['fiberPathProjection']>['audit']},dataAvailability:{mode:'database',networkRevision:revision,deferredFields:[]}};
  }
}
export function selectNetworkRepository(search:string):NetworkRepository & {loadDetails?:(data:Inventory)=>Promise<Inventory>} {
  const mode=new URLSearchParams(search).get('data')??(globalThis.location?.protocol==='file:'?'offline-demo':'database');
  if(mode==='database')return new ApiNetworkRepository();
  if(mode==='offline-demo')return offlineRepository;
  return {load:async()=>{throw new Error('Unknown data mode. Choose database or offline-demo.');}};
}
export class EmptyNetworkError extends Error {constructor(){super('No network imported yet.');}}
