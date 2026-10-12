import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { AP_GRAMMAR, evaluateAPGrammar, uniqueAlignment } from './source-b-ap-grammar.mjs';
const hash = x => createHash('sha256').update(x).digest('hex');
const runs = ['a','b'].map(x => JSON.parse(gunzipSync(readFileSync(`migration/iteration27/run-${x}/tsageri-alpana-tvishi.raw.json.gz`))));
const sourceSha256 = hash(readFileSync('imports/inbox/Tsageri-Alpana-Tvishi.vsdx'));
if (runs.some(r => r.source.sha256 !== sourceSha256)) throw Error('Source cache hash mismatch');
const fingerprints = runs.map(r => hash(JSON.stringify(r.pages[0].shapes)));
if (new Set(fingerprints).size !== 1) throw Error('Independent Shape extractions disagree');
const raw = runs[0], page = raw.pages[0], shapes = page.shapes, byId = new Map(shapes.map(s=>[s.id,s]));
const projection = JSON.parse(readFileSync('src/data/iteration27d-network-projection.json'));
const decoded = JSON.parse(readFileSync('migration/iteration27/source-interpretation.json'));
const props = s => Object.fromEntries((s.sections?.find(x=>x.attributes?.N==='Property')?.rows??[]).map(r=>[r.attributes.N,r.cells?.find(c=>c.N==='Value')?.V??'']));
const pin = s => s.geometry.global_pin;
const children = s => shapes.filter(c=>c.parent_id===s.id);
const evidence = s => ({ id:s.id,text:s.text,attributes:s.attributes,parentId:s.parent_id,rootId:s.root_shape_id,masterId:s.master_id,masterShapeId:s.master_shape_id,geometry:s.geometry,effectiveStyle:s.effective_style,properties:props(s),cells:s.cells,sections:s.sections,connects:(page.connects??[]).filter(c=>JSON.stringify(c).includes('"'+s.id+'"')) });
const source = ids => ({file:'Tsageri-Alpana-Tvishi.vsdx',page:page.name??'Page-1',pageId:String(page.id),part:page.part??'visio/pages/page1.xml',shapeIds:ids,interpretationRule:AP_GRAMMAR});
const median = a => a.slice().sort((a,b)=>a-b)[Math.floor(a.length/2)];
const queue = [];
const canonicalCable = legacy => ['148','149','150','151','169'].includes(legacy)?'CAB-'+legacy.padStart(6,'0'):'SRC-TSAGERI-ALPANA-TVISHI-419DEF34-C'+legacy;
const canonicalAffected = alias => /^C\d+$/.test(alias)?canonicalCable(alias.slice(1)):/^AP\d+\/Port\d+$/.test(alias)?'SOURCE-B-'+alias.replace('/Port','-P'):/^AP\d+$/.test(alias)?(alias==='AP41'?'ap:41':'network_node:'+alias.slice(2)):alias;
function review(category, ids, affectedIds, question, observation, candidates=[], proposal=null) {
  const id='REVIEW-28D-'+category+'-'+ids[0];
  queue.push({id,category,status:'needs_review',source:source(ids),affectedIds:affectedIds.map(canonicalAffected),affectedAliases:affectedIds,question,rawText:ids.map(id=>byId.get(id)?.text??'').join(' | '),observation,suspiciousReason:observation,candidates,proposal,interpretationBasis:'source_geometry',engineerOptions:['confirm source interpretation','correct with reason and evidence','leave unresolved','reject'],confirmation:null,fieldVerified:false,bounds:ids.map(id=>({id,bounds:byId.get(id)?.geometry.world_bounds}))});
  return id;
}
// Numbered Fiber markers are identified by their own number-label row in the decoded bank.
// Tube labels lie above markers and cannot supply a Fiber number. Index/color is never a key.
const banks=[];
for (const [cable,construction] of Object.entries(decoded.physicalConstructionCandidates)) for (const bank of construction.banks??[]) {
  const root=byId.get(bank.groupShapeId); if(!root) continue;
  const kids=children(root), circles=kids.filter(s=>s.sections?.some(g=>g.attributes?.N==='Geometry'&&g.rows?.some(r=>r.attributes?.T==='EllipticalArcTo'))&&s.geometry.width>.045);
  if (!circles.length) continue;
  const cy=median(circles.map(s=>pin(s).y)), xs=circles.map(s=>pin(s).x).sort((a,b)=>a-b), pitch=median(xs.slice(1).map((x,i)=>x-xs[i]));
  const labels=kids.filter(s=>/^\d+$/.test(s.text?.trim())&&Math.abs(pin(s).y-cy)>.035&&Math.abs(pin(s).y-cy)<.07&&Number(s.text)<=circles.length);
  const markers=circles.map(s=>{
    const match=uniqueAlignment(pin(s),labels.map(l=>({x:pin(l).x,y:cy,id:l.id,number:Number(l.text)})),pitch*.28,.001);
    return {id:s.id,x:pin(s).x,y:pin(s).y,number:match.selected?.number??null,numberShapeId:match.selected?.id??null,fill:s.effective_style.FillForegnd?.rgb,diameter:s.geometry.width};
  });
  banks.push({cable,groupShapeId:root.id,pitch,cy,markers,evidenceIds:[root.id,...markers.flatMap(m=>[m.id,m.numberShapeId].filter(Boolean))]});
}
const decodedMarkerMap=new Map(banks.flatMap(b=>b.markers.filter(m=>m.number!=null).map(m=>[m.id,{cable:b.cable,number:m.number}])));
let verifiedTransitionMarkers=0;
for(const edge of decoded.fiberTopology.transitionEdges)for(const side of [edge.a,edge.z]){
  const marker=decodedMarkerMap.get(side.markerShapeId);
  if(marker){if(marker.number!==side.fiberNumber||marker.cable!=='C'+side.segment)throw Error('Explicit bank numbering conflicts with certified transition marker '+side.markerShapeId);verifiedTransitionMarkers++;}
}
const candidates=shapes.filter(s=>s.parent_id==null&&(s.attributes?.Type==='Group'||s.effective_style?.FillForegnd?.rgb?.toLowerCase()==='#cc99ff'));
const blocks=[], scan=[];
for (const group of candidates) {
  const kids=children(group), grammar=evaluateAPGrammar({group,properties:props(group),children:kids.map(c=>({...c,callout:props(c).msvCalloutField}))});
  scan.push({id:group.id,matched:grammar.matched,checks:grammar.checks});
  if(!grammar.matched) {
    if(group.attributes?.Type==='Group'&&group.effective_style?.FillForegnd?.rgb?.toLowerCase()==='#cc99ff') review('ap_symbol_uncertain',[group.id],[],'Does this purple group represent an AP?',JSON.stringify(grammar.checks));
    continue;
  }
  const b=group.geometry.world_bounds, inside=s=>pin(s).x>=b.min_x&&pin(s).x<=b.max_x&&pin(s).y>=b.min_y&&pin(s).y<=b.max_y;
  const cells=shapes.filter(s=>s.parent_id==null&&inside(s)&&/^\d+$/.test(s.text?.trim())&&s.geometry.width>0&&s.geometry.height>0&&String(s.effective_style?.FillPattern?.value)==='1').sort((a,b)=>Number(a.text)-Number(b.text));
  const numbers=cells.map(s=>Number(s.text)), ordered=cells.length===grammar.capacity&&new Set(numbers).size===grammar.capacity&&numbers.every((n,i)=>n===i+1);
  const rowY=cells.length?median(cells.map(s=>pin(s).y)):0, portPitch=cells.length>1?median(cells.slice(1).map((s,i)=>pin(s).x-pin(cells[i]).x)):0;
  const bankCertified=ordered&&portPitch>0&&cells.every(s=>Math.abs(pin(s).y-rowY)<.002);
  const cables=projection.cables.filter(c=>c.endpoints.includes(String(grammar.number)));
  const possibleBanks=banks.filter(bank=>cables.some(c=>'C'+c.legacyId===bank.cable)&&bank.cy>b.max_y&&bank.cy-b.max_y<1.5&&bank.markers.every(m=>m.x>=b.min_x&&m.x<=b.max_x));
  // Source projection legacy key differs across representations; endpoint label is authoritative cable key.
  const physicalCables=cables.map(c=>'C'+c.legacyId);
  let nearBanks=possibleBanks;
  nearBanks=nearBanks.sort((a,b)=>a.cy-b.cy);
  const bank=nearBanks[0], competingBank=nearBanks[1]&&Math.abs(nearBanks[1].cy-bank.cy)<.05;
  const localTolerance=bank?Math.min(portPitch,bank.pitch)*.28:0;
  const ports=cells.map(cell=>{
    const number=Number(cell.text), fill=cell.effective_style.FillForegnd?.rgb?.toLowerCase(), occupancy=bankCertified?(['#92d050','#00b050'].includes(fill)?'in_use':fill==='#ffffff'?'unused':'unknown'):'unknown';
    const align=bank&&!competingBank?uniqueAlignment({x:pin(cell).x,y:bank.cy},bank.markers.filter(m=>m.number!=null),localTolerance,.003):{certified:false,candidates:[],selected:null};
    // Each aligned strand must also have a drawn connector from its marker to the Port top edge.
    const connectors=shapes.filter(s=>s.parent_id==null&&s.geometry.global_begin&&s.geometry.global_end&&((Math.abs(s.geometry.global_begin.x-pin(cell).x)<localTolerance&&Math.abs(s.geometry.global_end.x-pin(cell).x)<localTolerance)&&((Math.abs(s.geometry.global_begin.y-(rowY+cell.geometry.height/2))<.02&&Math.abs(s.geometry.global_end.y-bank?.cy)<.05)||(Math.abs(s.geometry.global_end.y-(rowY+cell.geometry.height/2))<.02&&Math.abs(s.geometry.global_begin.y-bank?.cy)<.05))));
    const bindingCertified=bankCertified&&align.certified&&connectors.length===1;
    let reviewId=null;
    if(!bindingCertified) reviewId=review(align.candidates.length>1?'fiber_port_binding_ambiguous':'fiber_port_alignment_misaligned',[cell.id,...align.candidates.map(m=>m.id)],['AP'+grammar.number+'/Port'+number],'Which numbered Fiber is drawn into this Port?',`Bank-local alignment/connector not unique: ${align.candidates.length} markers, ${connectors.length} connectors.`,align.candidates);
    if(occupancy==='unknown') review('port_status_uncertain',[cell.id],['AP'+grammar.number+'/Port'+number],'What does this Port fill mean?',`Effective fill ${fill} is outside certified counterpart styles.`);
    return {id:`SOURCE-B-AP${grammar.number}-P${number}`,apNumber:grammar.number,number,shapeId:cell.id,occupancy,administrativeAllocation:'unknown',commercialAvailability:'unknown',physicalCondition:'unknown',sourceState:props(cell).State??null,certification:{bank:bankCertified,number:bankCertified,occupancy:occupancy!=='unknown',binding:bindingCertified},binding:bindingCertified?{cable:bank.cable,fiberNumber:align.selected.number,markerShapeId:align.selected.id,numberShapeId:align.selected.numberShapeId,connectorShapeId:connectors[0].id}:null,alignment:{observed:pin(cell),expected:align.selected?{x:align.selected.x,y:align.selected.y}:null,deltaX:align.selected?.dx??null,xTolerance:localTolerance,yTolerance:.003,portPitch,markerPitch:bank?.pitch??null,bankGroupId:bank?.groupShapeId??null,competingBank:!!competingBank,candidates:align.candidates,connectorIds:connectors.map(s=>s.id)},reviewId,source:source([cell.id,...(bindingCertified?[align.selected.id,align.selected.numberShapeId,connectors[0].id]:[])])};
  });
  if(!bankCertified) review('port_bank_uncertain',[group.id,...cells.map(s=>s.id)],['AP'+grammar.number],'Is this the complete logical Port bank?',`Capacity ${grammar.capacity}; observed numbers ${numbers.join(',')}.`);
  const inconsistent=ports.filter(p=>p.occupancy==='in_use'&&p.sourceState==='თავისუფალი');
  if(inconsistent.length) review('source_inconsistency',inconsistent.map(p=>p.shapeId),inconsistent.map(p=>p.id),'Does the green occupancy override the stored “free” Shape Data?',`Owner-confirmed green = physical in_use, while stored State says თავისუფალი for ${inconsistent.length} Ports. Administrative/commercial values remain unknown.`,[],{occupancy:'in_use',basis:'owner_confirmation',confirmationId:'OWNER-28D-GREEN-OCCUPANCY'});
  const numberShape=kids.find(s=>s.text?.trim()===String(grammar.number)),capShape=kids.find(s=>s.text?.trim()===String(grammar.capacity)),placeShape=kids.find(s=>s.text?.trim()===grammar.place);
  blocks.push({apNumber:grammar.number,place:grammar.place,capacity:grammar.capacity,rootShapeId:group.id,numberShapeId:numberShape?.id,capacityShapeId:capShape?.id,placeShapeId:placeShape?.id,grammarId:AP_GRAMMAR,certification:{block:true,portBank:bankCertified},ports,cableTokens:cables.map(c=>c.label),bankGroupId:bank?.groupShapeId??null,physicalCables,source:source([group.id,...kids.map(s=>s.id)]),evidence:evidence(group)});
  for(const cable of cables) if(!ports.some(p=>p.binding?.cable==='C'+cable.legacyId)) review('fiber_port_binding_ambiguous',cable.sourceShapeIds,['C'+cable.legacyId,'AP'+grammar.number],'Which AP Ports, if any, are associated with this additional cable?',`${cable.label} names this AP endpoint, but its Port correspondence is not established by this numbered bank. No additional binding projected.`,[],null);
}
blocks.sort((a,b)=>a.apNumber-b.apNumber);
for(const block of blocks) if(blocks.filter(b=>b.apNumber===block.apNumber).length>1) review('duplicate_asset_candidate',[block.rootShapeId],['AP'+block.apNumber],'Do these blocks describe the same physical asset?','Duplicate source AP numbers; not merged silently.');
const organizations=projection.annotations.filter(a=>a.organization);
const occurrences=organizations.map(a=>{
  const shape=byId.get(a.sourceShapeId), g=shape.geometry;
  const endpoints=[g.global_begin,g.global_end].filter(Boolean);
  const observations=endpoints.map(p=>{
    const alternatives=banks.flatMap(bank=>uniqueAlignment(p,bank.markers.filter(m=>m.number!=null).map(m=>({...m,cable:bank.cable,groupShapeId:bank.groupShapeId,pitch:bank.pitch})),bank.pitch*.28,median(bank.markers.map(m=>m.diameter))*.48).candidates);
    return {observed:p,certified:alternatives.length===1,candidates:alternatives};
  });
  const ambiguous=observations.some(o=>o.candidates.length>1), matches=observations.filter(o=>o.certified).map(o=>o.candidates[0]);
  const pairs=[...new Map(matches.map(m=>[m.cable+':'+m.number,{cable:m.cable,fiberNumber:m.number,markerShapeId:m.id,numberShapeId:m.numberShapeId,bankGroupId:m.groupShapeId}])).values()];
  const certified=!ambiguous&&pairs.length>0&&endpoints.length===2&&shape.cells?.some(c=>c.N==='BeginX');
  const reviewId=certified?null:review(ambiguous?'company_multiple_candidate_fibers':'company_scope_uncertain',[shape.id,...observations.flatMap(o=>o.candidates.map(m=>m.id))],pairs.map(p=>p.cable+'/F'+p.fiberNumber),'Which exact Fiber/Port/Cable scope does this company label describe?',ambiguous?'Several markers compete at a transformed line endpoint.':'No unique numbered-marker attachment at a transformed line endpoint.',observations);
  return {id:a.id,organization:a.organization,rawText:a.rawText,shapeId:shape.id,scope:certified?'fiber':'unresolved',status:certified?'source_interpreted':'needs_review',fibers:certified?pairs:[],observations,reviewId,evidence:evidence(shape),source:source([shape.id,...(certified?pairs.flatMap(p=>[p.markerShapeId,p.numberShapeId,p.bankGroupId]):[])])};
});
const grouped=new Map();
// A numbered Port-like row with the same source cell grammar but no matched AP block is
// suspicious evidence of a missing/outdated asset, never an automatically created AP.
const claimedPortIds=new Set(blocks.flatMap(b=>b.ports.map(p=>p.shapeId)));
const unclaimedPortLikeCells=shapes.filter(s=>s.parent_id==null&&/^\d+$/.test(s.text?.trim())&&props(s).State!=null&&String(s.effective_style?.FillPattern?.value)==='1'&&s.geometry.width>.08&&s.geometry.width<.11&&s.geometry.height>.21&&s.geometry.height<.25&&!claimedPortIds.has(s.id));
const orphanRows=new Map();
for(const s of unclaimedPortLikeCells){const key=pin(s).y.toFixed(3);const row=orphanRows.get(key)??[];row.push(s);orphanRows.set(key,row);}
for(const row of orphanRows.values()) {
  const numbers=row.map(s=>Number(s.text)).sort((a,b)=>a-b);
  const repeatedCapacity=blocks.some(b=>b.capacity===row.length);
  if(repeatedCapacity&&numbers.every((n,i)=>n===i+1))review('possible_missing_asset',row.map(s=>s.id),['source-port-bank:'+row[0].id],'Which physical AP or other asset owns this numbered bank absent a matching source block?','Complete repeated source Port-cell row has no certified AP block. Do not create an asset until engineer evidence establishes its identity.',[],{currentNetworkStatus:'added_after_source',sourceEvidence:'absent'});
  else review('port_bank_uncertain',row.map(s=>s.id),['source-port-bank:'+row[0].id],'What asset and logical numbering does this unclaimed Port-like row represent?',`Unclaimed numbered row: ${numbers.join(', ')}. It does not justify synthesizing missing Ports or an AP.`);
}
for(const o of occurrences.filter(o=>o.status==='source_interpreted')) {
  const key=o.organization+'/'+o.fibers.map(f=>f.cable+':'+f.fiberNumber).sort().join(',');
  const group=grouped.get(key)??{id:'SOURCE-B-USE-'+o.shapeId,organization:o.organization,scope:'fiber',fibers:o.fibers.map(f=>({cable:f.cable,fiberNumber:f.fiberNumber})),occurrenceIds:[],sourceShapeIds:[],source:source([])};
  group.occurrenceIds.push(o.id);group.sourceShapeIds.push(o.shapeId);group.source.shapeIds.push(...o.source.shapeIds);grouped.set(key,group);
}
const assignments=[...grouped.values()].map(g=>({...g,source:{...g.source,shapeIds:[...new Set(g.source.shapeIds)]}}));
const portShapeIds=new Set(blocks.flatMap(b=>b.ports.map(p=>p.shapeId)));
const markerShapeIds=new Set(banks.flatMap(b=>b.markers.map(m=>m.id)));
if([...portShapeIds].some(id=>markerShapeIds.has(id)))throw Error('Fiber marker misclassified as Port');
const negativeGoldenCases=[...scan.filter(c=>!c.matched).slice(0,5).map(c=>({shapeId:c.id,expected:'not_ap',observed:byId.get(c.id)?.attributes?.Name??'group',checks:c.checks})),{shapeId:'15997',expected:'green_fiber_marker_not_port',observed:'C153/F3 EllipticalArcTo, #008000, nested bank child'},{shapeId:'16006',expected:'fiber_number_label_not_port',observed:'C153/F1 numeric label, bank child, FillPattern=0'}];
const ownerConfirmations=[{id:'OWNER-28D-AP-GRAMMAR',basis:'owner_confirmation',statement:'Matching colored asset block with number/capacity/place/numbered Port bank represents AP.',fieldVerified:false},{id:'OWNER-28D-GREEN-OCCUPANCY',basis:'owner_confirmation',statement:'Green Port fill means in_use physical occupancy; does not establish commercial availability.',fieldVerified:false}];
const usedIds=new Set([...blocks.flatMap(b=>[b.rootShapeId,b.numberShapeId,b.capacityShapeId,b.placeShapeId,...b.ports.flatMap(p=>p.source.shapeIds)]),...occurrences.flatMap(o=>o.source.shapeIds),...queue.flatMap(q=>q.source.shapeIds)].filter(Boolean));
const counts={blocks:blocks.length,ports:blocks.reduce((n,b)=>n+b.ports.length,0),boundPorts:blocks.flatMap(b=>b.ports).filter(p=>p.binding).length,inUse:blocks.flatMap(b=>b.ports).filter(p=>p.occupancy==='in_use').length,unused:blocks.flatMap(b=>b.ports).filter(p=>p.occupancy==='unused').length,unknownOccupancy:blocks.flatMap(b=>b.ports).filter(p=>p.occupancy==='unknown').length,organizations:occurrences.length,certifiedOccurrences:occurrences.filter(o=>o.status==='source_interpreted').length,unresolvedOccurrences:occurrences.filter(o=>o.status!=='source_interpreted').length,assignments:assignments.length,reviewCases:queue.length};
const audit={schemaVersion:1,grammarId:AP_GRAMMAR,sourceSha256,extractionFingerprints:fingerprints,ownerConfirmations,counts,verifiedTransitionMarkers,negativeGoldenCases,numberedBanks:banks.map(b=>({cable:b.cable,groupShapeId:b.groupShapeId,pitch:b.pitch,markers:b.markers})),scan:{totalPageShapes:shapes.length,candidateCount:scan.length,candidates:scan,unclaimedPortLikeCellIds:unclaimedPortLikeCells.map(s=>s.id)},blocks};
mkdirSync('migration/iteration28d',{recursive:true});
const write=(p,data)=>writeFileSync(p,JSON.stringify(data,null,2)+'\n');
write('migration/iteration28d/source-b-ap-port-audit.json',audit);
write('migration/iteration28d/source-b-network-use-audit.json',{sourceSha256,counts,occurrences,assignments});
write('migration/iteration28d/review-queue.json',{sourceSha256,cases:queue});
// Complete raw cells/sections stay in audit artifacts; UI retains the evidence needed to inspect
// identities, transforms, number text and effective style without duplicating full source banks.
writeFileSync('src/data/source-b-ap-inventory.json',JSON.stringify({schemaVersion:1,grammarId:AP_GRAMMAR,sourceSha256,counts,ownerConfirmations,blocks:blocks.map(({evidence,...b})=>b),occurrences:occurrences.map(({evidence,...o})=>o),assignments,reviewCases:queue,evidenceShapes:[...usedIds].map(id=>{const {cells,sections,...s}=evidence(byId.get(id));return {...s,cells:cells?.filter(c=>['BeginX','BeginY','EndX','EndY','FillForegnd','FillPattern','LineColor','Angle'].includes(c.N))};})})+'\n');
console.log(JSON.stringify({counts,blocks:blocks.map(b=>({ap:b.apNumber,bank:b.bankGroupId,cables:b.cableTokens,bindings:b.ports.filter(p=>p.binding).length,inUse:b.ports.filter(p=>p.occupancy==='in_use').map(p=>p.number)})),organizations:occurrences.map(o=>({id:o.shapeId,org:o.organization,scope:o.scope,fibers:o.fibers.map(f=>f.cable+'/F'+f.fiberNumber)}))},null,2));
