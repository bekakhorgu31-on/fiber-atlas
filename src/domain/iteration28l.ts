import evidence from '../data/iteration28l-sc217-corrections.json';
import type {Inventory,NodeFiberTransitionSide,NodeFiberTransition} from './types';
export const SC217_CORRECTION_RULE=evidence.rule;
/** A scoped interpretation revision. Original Connect rows and frozen V1 are untouched. */
export function applyIteration28L(data:Inventory):Inventory{
 for(const row of evidence.corrections){
  const side=(marker:typeof row.a):NodeFiberTransitionSide=>{
   const segmentId=`CAB-${marker.segment.padStart(6,'0')}`,fiber=data.fibers.find(f=>f.cableId===segmentId&&f.number===marker.fiber);
   if(!fiber)throw Error('SC217 correction has no canonical local Fiber');const tube=data.tubes.find(t=>t.id===fiber.tubeId);
   return {segmentId,fiberNumber:fiber.number,tubeNumber:tube?.number??null,tubeColor:tube?.physicalColor??null,fiberColor:fiber.physicalColor};
  };
  const inside=(p:{x:number;y:number},m:typeof row.a)=>((p.x-m.pin.x)/(m.bounds.width/2))**2+((p.y-m.pin.y)/(m.bounds.height/2))**2<=1;
  if(row.endpointEllipseHits.some(n=>n!==1)||!inside(row.begin,row.a)||!inside(row.end,row.z)||row.oldTolerancePass)throw Error('SC217 correction failed its bounded source evidence gate');
  const a=side(row.a),z=side(row.z),id=`NFT-SC217-${row.connectorShapeId}`;
  const existing=data.nodeFiberTransitions?.find(t=>t.active&&t.node.kind==='closure'&&t.node.id==='217'&&[t.a,t.z].some(s=>s&&[a,z].some(p=>p.segmentId===s.segmentId&&p.fiberNumber===s.fiberNumber)));
  if(existing){if(existing.id===id)continue;throw Error('SC217 correction conflicts with an active local transition: '+existing.id);}
  const transition:NodeFiberTransition={id,node:{kind:'closure',id:'217'},a,z,port:null,transitionType:'optical_continuation',operation:'unknown',active:true,projectionStatus:'source_interpreted',
   sourceGeometry:{beginX:row.begin.x,beginY:row.begin.y,endX:row.end.x,endY:row.end.y,context:'Both connector endpoints uniquely fall inside the actual decoded marker ellipses; corroborated by Iteration09 raw cells.'},
   source:{file:'Tsageri-Lentekhi 2025.vsdx',page:'ცაგერი-ლენტეხი',pageId:'4',part:'visio/pages/page1.xml',shapeIds:[row.connectorShapeId,row.a.shape,row.z.shape],interpretationRule:SC217_CORRECTION_RULE,rawValue:`C171/F${a.fiberNumber} ↔ C172/F${z.fiberNumber}`,note:`Scoped SC217 interpretation revision; original source SHA-256 ${evidence.sourceSha256}; ${evidence.rawArtifact}`},
   interpretationBasis:'Source geometry establishes one exact pair. Earlier fixed ±0.015 X tolerance rejected the real marker attachment. No number/color/route-adjacency rule.',
   notes:['Added by Iteration 28L; old raw evidence and earlier interpretations are retained.','Owner reports F12 reaching Lentekhi independently of this source-derived local pair. Organization use remains separate.','Not field verified.']};
  (data.nodeFiberTransitions??=[]).push(transition);
 }
 return data;
}
export const sc217OwnerReport=evidence.ownerReport;
