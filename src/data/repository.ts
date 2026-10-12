import pilot from './pilot.json';
import type { Inventory } from '../domain/types';
import { buildTsageriImportRun } from '../domain/import';
import { applyConfirmedC172Construction } from '../domain/colors';
import { applyIteration07PathReview } from '../domain/pathReview';
import { applyIteration08CableRoute } from '../domain/cableRoutes';
import { applyIteration09Foundations } from '../domain/foundations';
import { applyIteration10AggregationTopology } from '../domain/aggregationTopology';
import { applyIteration12FullMigration } from '../domain/fullMigration';
import { applyIteration15Showcase } from '../domain/showcase';
import { applyIteration16CableContinuity } from '../domain/cableContinuity';
import { applyIteration17FiberLineage } from '../domain/fiberLineage';
import { applyIteration19 } from '../domain/iteration19';
import { applyIteration20 } from '../domain/iteration20';
import { applyIteration21 } from '../domain/iteration21';
import { applyIteration22 } from '../domain/iteration22';
import { applyIteration24CertifiedSource } from '../domain/iteration24';
import { applyIteration25 } from '../domain/iteration25';
import { applyIteration26 } from '../domain/iteration26';
import { applyIteration27D } from '../domain/iteration27d';
import { applyIteration28B } from '../domain/iteration28b';
import { applyIteration28D } from '../domain/iteration28d';
import { applyIteration28E } from '../domain/iteration28e';
import { applyIteration28F } from '../domain/iteration28f';
import { applyIteration28L } from '../domain/iteration28l';

// Replace this adapter with an API request; views do not depend on JSON imports.
export interface NetworkRepository { load(): Promise<Inventory> }
function timed<T>(name:string,work:()=>T):T {
  const start=performance.now(),result=work();
  performance.measure('fiber-atlas:'+name,{start,duration:performance.now()-start});
  return result;
}
export async function loadFrozenV1Reference(): Promise<Inventory> {
  let data=timed('clone',()=>structuredClone(pilot) as Inventory);
  const stages:[string,(data:Inventory)=>Inventory][]=[['construction',applyConfirmedC172Construction],['07',applyIteration07PathReview],['08',applyIteration08CableRoute],['09',applyIteration09Foundations],['10',applyIteration10AggregationTopology],['12',applyIteration12FullMigration],['15',applyIteration15Showcase],['16',applyIteration16CableContinuity],['17',applyIteration17FiberLineage],['19',applyIteration19],['20',applyIteration20],['24',applyIteration24CertifiedSource],['21',applyIteration21],['22',applyIteration22],['25',applyIteration25],['26',applyIteration26]];
  for(const [name,apply] of stages)data=timed('inventory:'+name,()=>apply(data));
  data.importRuns = [buildTsageriImportRun()];
  return data;
}
export const repository: NetworkRepository = {
  async load() {
    let data=await loadFrozenV1Reference();
    for(const [name,apply] of [['27D',applyIteration27D],['28B',applyIteration28B],['28L',applyIteration28L],['28D',applyIteration28D],['28E',applyIteration28E],['28F',applyIteration28F]] as [string,(data:Inventory)=>Inventory][])data=timed('inventory:'+name,()=>apply(data));
    return data;
  },
};

/** Historical delivered 28K snapshot for correction diffs; never the active UI authority. */
export async function loadIteration28KReference():Promise<Inventory>{
 let data=await loadFrozenV1Reference();
 for(const apply of [applyIteration27D,applyIteration28B,applyIteration28D,applyIteration28E,applyIteration28F])data=apply(data);
 return data;
}

