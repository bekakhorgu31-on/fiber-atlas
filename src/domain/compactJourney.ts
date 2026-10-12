import type {Inventory} from './types';
import type {CurrentFiberPath} from './currentFiberPath';
import {currentAssetLabel,nodeKey} from './currentFiberPath';
import {orderedJourneySteps,type RouteStep} from './iteration28i';

export function compactJourneyOptions(data:Inventory,path:CurrentFiberPath):RouteStep[][] {
 const options=orderedJourneySteps(data,path),c=data.cables.find(c=>c.id===path.cableId)!;
 if(options.length===1)return options;
 // Independent alternatives each retain the selected local strand before traversal.
 return options.map((steps,i)=>{const other=nodeKey(path.sides[i].startNode)===nodeKey(c.endpointA)?c.endpointB:c.endpointA;return [{node:other,label:currentAssetLabel(data,other),remap:null,legAfter:{segmentId:c.id,fiberNumber:path.fiberNumber},stopKind:null,stopLabel:null},...steps];});
}
export function compactJourneyGroups(data:Inventory,path:CurrentFiberPath,steps:RouteStep[],active:number,expanded:boolean):Array<{index:number}|{start:number;count:number}> {
 const c=data.cables.find(c=>c.id===path.cableId)!,selected=new Set([nodeKey(c.endpointA),nodeKey(c.endpointB)]),degree=new Map<string,number>();
 for(const cable of data.cables)for(const node of [cable.endpointA,cable.endpointB])degree.set(nodeKey(node),(degree.get(nodeKey(node))??0)+1);
 const result:Array<{index:number}|{start:number;count:number}>=[];
 steps.forEach((step,i)=>{
   const keep=expanded||steps.length<=7||i===0||i===steps.length-1||i===active||!!step.remap||!!step.stopKind||selected.has(nodeKey(step.node))||(degree.get(nodeKey(step.node))??0)>2;
   if(keep)result.push({index:i});else {const last=result.at(-1);if(last&&'count'in last)last.count++;else result.push({start:i,count:1});}
 });
 return result;
}
