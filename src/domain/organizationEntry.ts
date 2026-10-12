import type {Inventory} from './types';
import {ORGANIZATION_ALIASES} from './iteration28f';
const normalize=(s:string)=>s.toLocaleLowerCase().replace(/\s+/g,' ').trim();
/** Only a complete canonical name/alias enters the unfiltered organization overview. */
export function exactOrganizationEntry(data:Inventory,input:string){
 const q=normalize(input);return data.organizationNetworkProjection?.organizations.find(o=>[o.name,...o.aliases,...(ORGANIZATION_ALIASES[o.organizationId.toUpperCase()]??[])].some(a=>normalize(a)===q));
}
