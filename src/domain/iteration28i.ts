import type {AssetRef, Inventory, SearchResult} from './types';
import {currentAssetLabel, type CurrentFiberPath, type CurrentPathSide, type CurrentStopKind} from './currentFiberPath';
import {compactSearchResult} from './iteration28g';

export interface RouteStep {node:AssetRef;label:string;remap:string|null;legAfter:{segmentId:string;fiberNumber:number}|null;stopKind:CurrentStopKind|null;stopLabel:string|null}
export const localLegLabel=(data:Inventory,leg:{segmentId:string;fiberNumber:number})=>`C${data.cables.find(c=>c.id===leg.segmentId)?.legacyCableId??leg.segmentId}/F${String(leg.fiberNumber).padStart(2,'0')}`;
export function hasConstructionConflict(data:Inventory,segmentId:string,fiberNumber?:number):boolean {
  const cable=data.cables.find(c=>c.id===segmentId);if(!cable)return false;
  return (data.sourceConflicts??[]).some(c=>String(c.id)===`CONFLICT-C${cable.legacyCableId}-TUBE-COLOR`&&(fiberNumber===undefined||Array.isArray(c.affectedRanges)&&c.affectedRanges.some(r=>fiberNumber>=r.firstFiber&&fiberNumber<=r.lastFiber)));
}
export function stopMeaning(kind:CurrentStopKind):string {
  return kind==='termination'?'აქ მთავრდება':kind==='port'?'პორტთან აღწევს':kind==='loop'?'განმეორებითი გზა · აქ ვჩერდებით':kind==='external_boundary'?'გარე დოკუმენტის საზღვარი':kind==='invalid_transition'?'გადასვლის შეუსაბამობა':kind==='unresolved_transition'?'შემდეგი ჟილა დაუდგენელია':'გაგრძელება წყაროში არ არის დადგენილი';
}
/** Display order over resolver output only; this function creates no connectivity. */
export function orderedJourneySteps(data:Inventory,path:CurrentFiberPath):RouteStep[][] {
  const same=(a:AssetRef,b:AssetRef)=>a.kind===b.kind&&a.id===b.id;
  const outward=(side:CurrentPathSide):RouteStep[]=>{
    const steps:RouteStep[]=[{node:side.startNode,label:currentAssetLabel(data,side.startNode),remap:null,legAfter:null,stopKind:null,stopLabel:null}];
    for(const t of side.transitions){if(!same(steps.at(-1)!.node,t.node))steps.push({node:t.node,label:currentAssetLabel(data,t.node),remap:null,legAfter:null,stopKind:null,stopLabel:null});
      const step=steps.at(-1)!;const changed=t.to&&(t.from.fiberNumber!==t.to.fiberNumber||t.from.tubeNumber!==t.to.tubeNumber||t.from.fiberColor?.key!==t.to.fiberColor?.key||t.from.tubeColor?.key!==t.to.tubeColor?.key);step.remap=changed?`${localLegLabel(data,t.from)} → ${localLegLabel(data,t.to!)}`:null;step.legAfter=t.to?{segmentId:t.to.segmentId,fiberNumber:t.to.fiberNumber}:null;
    }
    if(!same(steps.at(-1)!.node,side.stop.node))steps.push({node:side.stop.node,label:currentAssetLabel(data,side.stop.node),remap:null,legAfter:null,stopKind:null,stopLabel:null});
    const last=steps.at(-1)!,binding=data.portTopologyBindings?.find(b=>b.id===side.stop.portBindingId);
    if(binding)last.label+=` / Port ${binding.portNumber}`;
    last.stopKind=side.stop.kind;last.stopLabel=stopMeaning(side.stop.kind);return steps;
  };
  if(path.sides.length!==2||path.sides.some(s=>s.ambiguous||s.stop.kind==='loop'))return path.sides.map(outward);
  const origin=path.sides.findIndex(s=>s.stop.kind==='port'&&s.stop.node.kind==='aggregation'),a=origin>=0?origin:0,b=1-a;
  const first=outward(path.sides[a]),second=outward(path.sides[b]);
  const reversed=first.slice().reverse().map((step,index)=>({...step,remap:step.remap?step.remap.split(' → ').reverse().join(' → '):null,legAfter:index<first.length-1?first[first.length-index-2].legAfter:{segmentId:path.cableId,fiberNumber:path.fiberNumber}}));
  return [[...reversed,...second]];
}

/** Collapse consecutive unremarkable middle steps; retain exact indices and counts. */
export function visibleJourneyGroups(steps:RouteStep[],active:number,expanded:boolean):Array<{index:number}|{start:number;count:number}> {
  const groups:Array<{index:number}|{start:number;count:number}>=[];
  for(let index=0;index<steps.length;index++){
    const step=steps[index],hide=!expanded&&steps.length>9&&index>2&&index<steps.length-3&&!step.remap&&!step.stopKind&&index!==active;
    if(hide){const previous=groups.at(-1);if(previous&&'count'in previous)previous.count++;else groups.push({start:index,count:1});}
    else groups.push({index});
  }
  return groups;
}

/** Operator cards keep construction and evidence in the selected-object disclosures. */
export function operatorSearchCard(data:Inventory,result:SearchResult):SearchResult {
  const card=compactSearchResult(data,result);
  if(card.category==='Cable'){
    const c=data.cables.find(c=>card.id===`cable:${c.id}`)!;
    return {...card,title:`C${c.legacyCableId} · ${currentAssetLabel(data,c.endpointA)} ↔ ${currentAssetLabel(data,c.endpointB)}`,subtitle:`${c.fiberCount} ჟილა · ${data.tubes.filter(t=>t.cableId===c.id).length} ტუბი`,facts:[]};
  }
  const operatorText=(text:string)=>text.replace(/Ports/g,'პორტი').replace(/unused/g,'არ გამოიყენება').replace(/used/g,'გამოიყენება').replace(/unknown/g,'უცნობია');
  return {...card,subtitle:operatorText(card.subtitle),facts:(card.facts??[]).slice(0,1).map(operatorText)};
}

