import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import type {Inventory,AssetRef,SourceRef,PhysicalColor,PhysicalColorKey,CableRoute,NodeFiberTransitionSide} from '../src/domain/types';
import {applyIteration28C} from '../src/domain/iteration28c';
import {validateCurrentFiberPaths} from '../src/domain/currentFiberPath';
import {buildOperationalPayload,hydrateOperationalPayload,packJson,DEFERRED_NETWORK_FIELDS} from '../src/domain/operationalPayload';
import {projectImportedUsage} from '../src/domain/importedUsage';

type RecordData=Record<string,any>;
type Manifest={documentId:string;sourceRevision:string;runId:string;originalName:string;expectedRevision:string|null;priorAuthority?:string};
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
const unknown={state:'unknown'} as const;
const shades:Record<string,[PhysicalColorKey,string,string]>={'#0000ff':['blue','ლურჯი','Blue'],'#f48c37':['orange','ნარინჯისფერი','Orange'],'#008000':['green','მწვანე','Green'],'#9c4a09':['brown','ყავისფერი','Brown'],'#808080':['slate','ნაცრისფერი','Slate'],'#ffffff':['white','თეთრი','White'],'#ff0000':['red','წითელი','Red'],'#000000':['black','შავი','Black'],'#ffff00':['yellow','ყვითელი','Yellow'],'#cc99ff':['violet','იისფერი','Violet'],'#ff00ff':['rose','ვარდისფერი','Rose'],'#00ffff':['aqua','ცისფერი','Aqua']};
const color=(hex:string|null):PhysicalColor=>hex?{key:shades[hex]?.[0]??null,nameKa:shades[hex]?.[1]??null,nameEn:shades[hex]?.[2]??null,hex,basis:'documented',verification:'documentation_reviewed'}:{key:null,nameKa:null,nameEn:null,hex:null,basis:'unknown',verification:'needs_verification'};

export function compileShida(semantic:RecordData,manifest:Manifest,output:string):void{
 if(semantic.family!=='shida-kartli'||semantic.blockers.length)throw Error('Shida source grammar was not evaluated successfully.');
 const source=(ids:string[],rawValue?:string):SourceRef=>({documentId:manifest.documentId,sourceRevision:manifest.sourceRevision,importRunId:manifest.runId,sourceSha256:semantic.source.sha256,file:manifest.originalName,page:semantic.page.name,pageId:String(semantic.page.id),part:semantic.page.part,shapeIds:[...new Set(ids)],rawValue,interpretationRule:semantic.version,note:'Source-only Shida interpretation. Leading construction references preserved; field verification and traffic direction unknown.'});
 const id=(kind:string,key:string)=>'SHIDA-'+kind+'-'+hash(manifest.documentId+'/'+key).slice(0,24);
 const data:Inventory={area:{id:id('AREA','shida'),name:'შიდა ქართლი'},cables:[],fibers:[],tubes:[],closures:[],accessPoints:[],aggregations:[],networkNodes:[],organizations:[],rights:[],services:[],assignments:[],connections:[],passiveComponents:[],issues:[],sourceCounts:{cables:0,closures:0,accessPoints:0,aggregations:0},snapshot:semantic.source.sha256,nodeFiberTransitions:[],portTopologyBindings:[],apPorts:[],odfs:[],odfPorts:[],cableRoutes:[],sourceDocuments:[],sourceAnnotations:[],sourceReviewCases:[],sourceConflicts:[],networkUseAssignments:[],evidenceRecords:[],fiberLineages:[],supersededFiberLineages:[],fiberLineageAudit:[],connectionSheets:[],importRuns:[]};
 const refs=new Map<string,AssetRef>(),byToken=new Map<string,AssetRef[]>();
 const addToken=(token:string,ref:AssetRef)=>byToken.set(token,[...(byToken.get(token)??[]),ref]);
 for(const node of semantic.nodes as RecordData[]){
  const ref:AssetRef={kind:'network_node',id:id('NODE',node.shapeId)};refs.set(node.shapeId,ref);addToken(node.token,ref);
  const ap=node.kind==='ap_triangle_capacity_symbol',label=ap?`AP${node.token}${node.names.length?' · '+node.names.join(' · '):''}`:'SC'+node.token;
  data.networkNodes!.push({id:ref.id,displayName:label,sourceEndpointTokens:[node.token,(ap?'AP':'SC')+node.token],assetType:ap?'ap':'closure',verification:'documentation_reviewed',source:source([node.shapeId,node.numberShapeId,node.coordinateShapeId,node.capacityShapeId].filter(Boolean),node.coordinateText??label),notes:node.coordinateText?[node.coordinateText]:[],...(ap?{apEvidence:{grammarId:'shida-triangle-capacity/1',number:Number(node.token),place:node.names.join(' · '),capacity:node.capacity,rootShapeId:node.shapeId,source:source([node.shapeId])}}:{})});
 }
 for(const station of semantic.stations as RecordData[]){
  const ref:AssetRef={kind:'aggregation',id:id('STATION',station.shapeId)};
  if(data.aggregations.some(a=>a.id===ref.id))continue;
  refs.set(station.shapeId,ref);if(station.token)addToken(station.token,ref);
  data.aggregations.push({id:ref.id,name:station.name,portCount:null,verification:'documentation_reviewed',source:source([station.shapeId,station.nameShapeId],station.name),contextOnly:true,owner:unknown});
 }
 const fallback=(token:string,labelShapeId:string):AssetRef=>{
  const choices=byToken.get(token)??[];if(choices.length===1)return choices[0];
  const nodeId=id('UNRESOLVED',token),existing=data.networkNodes!.find(n=>n.id===nodeId);
  if(!existing)data.networkNodes!.push({id:nodeId,displayName:'Node '+token+(choices.length?' · ტიპი დასადგენია':''),sourceEndpointTokens:[token],assetType:'unknown',verification:'needs_verification',source:source([labelShapeId],token),notes:[choices.length?'The endpoint token has multiple source equipment meanings; source geometry has not selected a physical object.':'No matching certified source symbol establishes this endpoint equipment class.']});
  return {kind:'network_node',id:nodeId};
 };
 const banks=new Map<string,RecordData>((semantic.banks as RecordData[]).map(b=>[b.groupShapeId,b]));
 const spans=new Map<string,RecordData>((semantic.physicalBankPairs as RecordData[]).filter(p=>p.status==='source_endpoint_bank_pair').map(p=>[p.labelShapeIds[0],p]));
 const repeatedLabels=new Set<string>((semantic.labels as RecordData[]).filter((l,_i,all)=>all.filter(other=>other.text===l.text).length>1).map(l=>l.text));
 const cableIds=new Map<string,string>();
 for(const label of semantic.labels as RecordData[]){
  if(repeatedLabels.has(label.text)&&!spans.has(label.shapeId))continue;
  const cableId=id('CABLE',label.shapeId),span=spans.get(label.shapeId);cableIds.set(label.shapeId,cableId);
  const endpoint=(token:string)=>{
   const owner=span?.banks.flatMap((bank:string)=>banks.get(bank)?.nodeOwners??[]).find((o:RecordData)=>o.token===token);
   return owner?refs.get(owner.symbolShapeId)!:fallback(token,label.shapeId);
  };
  const capacityEvidence=label.capacityEvidence;
  if(capacityEvidence&&(!span||capacityEvidence.rule!=='shida-complete-fo-banks-and-drawn-span/1'||JSON.stringify(span.capacityEvidence)!==JSON.stringify(capacityEvidence)||capacityEvidence.resolvedCapacity!==label.capacity||capacityEvidence.declaredCapacity!==label.declaredCapacity||Number(label.text.split('-').at(-1))!==label.declaredCapacity||span.lineCount!==label.capacity||capacityEvidence.foShapeIds?.length!==2||new Set(capacityEvidence.lineShapeIds??[]).size!==label.capacity||span.banks.some((bank:string)=>{const b=banks.get(bank);return !b||b.capacity!==label.capacity||b.markers?.length!==label.capacity||b.markers.some((m:RecordData,i:number)=>m.fiber!==i+1);})))throw Error('Capacity resolution lacks matching source span evidence.');
  const s=source([label.shapeId,...(span?.banks??[]),...(capacityEvidence?.foShapeIds??[]),...(capacityEvidence?.lineShapeIds??[])],label.text);
  if(capacityEvidence)data.sourceConflicts!.push({id:id('CAPACITY',label.shapeId),kind:'source_cable_capacity_conflict',cableId,declaredCapacity:label.declaredCapacity,resolvedCapacity:label.capacity,evidence:capacityEvidence,source:s});
  data.cables.push({id:cableId,recordType:'cable_segment',legacyCableId:label.constructionReference,legacyLabels:[label.text],fiberCount:label.capacity,endpointA:endpoint(label.fromToken),endpointB:endpoint(label.toToken),routeNodes:[],routeCompleteness:'endpoints_only',manufacturer:null,manufacturerVerification:'needs_verification',model:null,productCode:null,cableType:null,constructionType:null,tubeCount:null,colorScheme:null,territoryId:data.area.id,owner:unknown,lengthM:null,verification:'documentation_reviewed',notes:['Construction/contract reference: '+label.constructionReference,'Source label occurrence retained. Physical Cable parent, Tube convention and traffic direction are unknown.'],source:s,physicalCondition:'unknown',sourceRepresentations:[s]});
  for(let number=1;number<=label.capacity;number++){
   const markers=(span?.banks??[]).flatMap((bank:string)=>(banks.get(bank)?.markers??[]).filter((m:RecordData)=>m.fiber===number)),fills=[...new Set<string>(markers.map((m:RecordData)=>m.fill))];
   const physical=color(fills.length===1?fills[0]:null);
   data.fibers.push({id:cableId+'-F'+String(number).padStart(3,'0'),cableId,number,tubeId:null,physicalColor:physical,proposedColor:null,positionInTube:null,proposedPositionInTube:null,allocation:'unknown',condition:'unknown',connectivity:'unknown',verification:markers.length?'documentation_reviewed':'imported',rights:unknown,service:unknown,notes:[],physicalEvidence:{source:source(markers.map((m:RecordData)=>m.shapeId)),ruleVersion:semantic.version,convention:'Source bank inner fills; outer ring and Tube interpretation preserved separately.',rawInnerColor:fills.length===1?fills[0]:null,rawOuterColor:markers[0]?.ring??null,warnings:fills.length>1?['Source endpoint-bank fills conflict. No preferred physical color selected.']:[]}});
   if(fills.length>1)data.sourceConflicts!.push({id:id('COLOR',label.shapeId+'/'+number),kind:'source_bank_fill_conflict',fiberId:cableId+'-F'+String(number).padStart(3,'0'),colors:fills,source:source(markers.map((m:RecordData)=>m.shapeId))});
  }
 }
 const local=(side:RecordData):NodeFiberTransitionSide=>{
  const segmentId=cableIds.get(side.labelShapeId);const fiber=data.fibers.find(f=>f.cableId===segmentId&&f.number===side.fiber);
  if(!fiber)throw Error('Source transition references an unknown Cable/Fiber.');
  return {segmentId:segmentId!,fiberNumber:fiber.number,tubeNumber:null,tubeColor:null,fiberColor:fiber.physicalColor};
 };
 const seen=new Set<string>();
 for(const edge of semantic.transitions as RecordData[]){
  const node=refs.get(edge.aOwner.symbolShapeId)!,a=local(edge.a),z=local(edge.z);if(!node)throw Error('Source transition node is unknown.');
  const key=node.id+'/'+[a.segmentId+':'+a.fiberNumber,z.segmentId+':'+z.fiberNumber].sort().join('/');if(seen.has(key))continue;seen.add(key);
  for(const side of [a,z]){const c=data.cables.find(c=>c.id===side.segmentId)!;if(![c.endpointA,c.endpointB].some(e=>e.kind===node.kind&&e.id===node.id))throw Error('Source transition does not share its actual local node.');}
  data.nodeFiberTransitions!.push({id:id('EDGE',key),node,a,z,port:null,transitionType:'optical_continuation',operation:'unknown',sourceGeometry:{beginX:edge.begin?.x,beginY:edge.begin?.y,endX:edge.end?.x,endY:edge.end?.y,context:JSON.stringify({path:edge.path,docking:edge.attachmentEvidence})},source:source([edge.shapeId,edge.a.shapeId,edge.z.shapeId,edge.a.bankShapeId,edge.z.bankShapeId]),interpretationBasis:'Actual source stroke + unique printed marker docking + unique bank/Cable association + same node container; '+semantic.gapRule+'; '+semantic.ownerConfirmationId,projectionStatus:'source_interpreted',active:true,notes:['Owner confirmed the drafting convention; the individual mapping is derived from source geometry. Physical splice operation and traffic direction are unknown.']});
 }
 for(const port of semantic.ports as RecordData[]){
  if(!port.completePortBank)continue;
  const node=refs.get(port.nodeSymbolShapeId)!,links=port.bindings as RecordData[],first=links[0];let bindingId:string|null=null;
  if(first){const side=local(first),c=data.cables.find(c=>c.id===side.segmentId)!;if(![c.endpointA,c.endpointB].some(e=>e.kind===node.kind&&e.id===node.id))throw Error('Port binding teleports to a different node.');bindingId=id('BINDING',port.shapeId);
   data.portTopologyBindings!.push({id:bindingId,ownerType:'ap',ownerId:node.id,portNumber:port.number,...side,canonicalNode:node,role:'local_termination',directionLabel:`AP${port.apToken} · Port ${port.number}`,routeId:null,orientation:'from_port',lineageIds:[],projectionStatus:'source_interpreted',source:source([port.shapeId,...links.flatMap(l=>[l.connectorShapeId,l.shapeId,l.bankShapeId])]),notes:['Exact source Port rectangle and marker-attached stroke; service usage and physical operation unknown.']});
  }
  data.apPorts!.push({id:id('PORT',port.shapeId),apNumber:Number(port.apToken),number:port.number,shapeId:port.shapeId,occupancy:'unknown',administrativeAllocation:'unknown',commercialAvailability:'unknown',physicalCondition:'unknown',sourceState:port.sourceState,certification:{bank:port.completePortBank,number:true,occupancy:false,binding:!!bindingId},binding:null,alignment:{diagnostics:port.diagnostics??[],sourceFill:port.sourceFill,portBounds:port.bounds,portPitch:port.portPitch,docking:links.map(l=>({connectorShapeId:l.connectorShapeId,marker:l.markerAttachment,port:l.portAttachment}))},reviewId:null,canonicalNode:node,bindingId,source:source([port.shapeId],port.sourceState)});
 }
 const routeId=id('ROUTE','document'),nodeRefs=[...new Map(data.cables.flatMap(c=>[c.endpointA,c.endpointB]).map(n=>[n.kind+':'+n.id,n])).values()];
 const label=(ref:AssetRef)=>data.networkNodes!.find(n=>n.id===ref.id)?.displayName??data.aggregations.find(n=>n.id===ref.id)?.name??ref.id;
 const route:CableRoute={id:routeId,displayName:'შიდა ქართლი · წყაროს ქსელი',origin:{state:'known',asset:nodeRefs[0],label:label(nodeRefs[0]),verification:'documentation_reviewed',source:source([])},destination:{state:'known',asset:nodeRefs.at(-1)!,label:label(nodeRefs.at(-1)!),verification:'documentation_reviewed',source:source([])},nodes:nodeRefs.map((n,i)=>({id:routeId+'-N'+i,sequence:i+1,asset:n,label:label(n),treatment:'unknown',treatmentVerification:'needs_verification',verification:'documentation_reviewed',source:source([]),warnings:[]})),legs:[],branches:[],condition:'unknown',conditionVerification:'needs_verification',documentation:'incomplete',verification:'documentation_reviewed',physicalCableId:null,allowCircular:true,source:source([]),warnings:['Physical document graph context only. Node listing order creates no Fiber continuation.']};
 for(const [i,c]of data.cables.entries())route.legs.push({id:routeId+'-L'+i,sequence:i+1,fromNodeId:route.nodes.find(n=>n.asset?.id===c.endpointA.id)!.id,toNodeId:route.nodes.find(n=>n.asset?.id===c.endpointB.id)!.id,segmentId:c.id,relationship:'segment',verification:'documentation_reviewed',source:c.source,warnings:[]});
 data.cableRoutes!.push(route);
 for(const annotation of semantic.annotations as RecordData[])data.sourceAnnotations!.push({id:id('TEXT',annotation.shapeId),rawText:annotation.text,normalizedSummary:null,category:'unknown',scope:'unresolved',sourceSha256:semantic.source.sha256,source:source([annotation.shapeId],annotation.text),sourceGeometry:{pinX:annotation.point.x,pinY:annotation.point.y},associatedAssets:[],associatedRouteIds:[],associatedRouteNodeIds:[],associatedOrganizationIds:[],associationState:'unresolved',verification:'imported',warnings:[],importedAt:'source-import',extractionRunId:manifest.runId});
 data.sourceDocuments!.push({id:manifest.documentId,title:manifest.originalName,sourceFile:manifest.originalName,sourceSha256:semantic.source.sha256,sourcePages:[{id:String(semantic.page.id),name:semantic.page.name}],reviewState:'unreviewed',importedAssetIds:data.cables.map(c=>c.id),routeIds:[routeId],externalBoundaryIds:[],counts:{aggregations:data.aggregations.length,closures:semantic.nodes.filter((n:RecordData)=>n.kind==='closure_symbol').length,cableSegments:data.cables.length,logicalFibers:data.fibers.length,accessPointOdfAssets:semantic.nodes.filter((n:RecordData)=>n.kind==='ap_triangle_capacity_symbol').length,logicalOdfPorts:0,logicalApPorts:data.apPorts!.length,routes:1,externalContinuations:0,unresolvedAssertions:0,conflictingAssertions:data.sourceConflicts!.length},completeness:[{id:'inventory',label:'Canonical Cable inventory',state:'partial',summary:'All source Shapes retained; repeated full label identity remains review-only.',known:data.cables.length,total:semantic.labels.length},{id:'optical_mapping',label:'Bank / Port / Fiber topology',state:'partial',summary:JSON.stringify(semantic.coverage),known:spans.size,total:semantic.labels.length}],source:source([]),notes:semantic.warnings});
 let authority=data;
 if(manifest.priorAuthority){
  const prior=JSON.parse(readFileSync(manifest.priorAuthority,'utf8')) as Inventory;
  if(prior.sourceDocuments?.some(d=>d.id===manifest.documentId))throw Error('Changed source replacement requires explicit identity reconciliation.');
  // An unrelated region is unioned without name/number-only asset merging.
  const keys=['cables','fibers','tubes','closures','accessPoints','aggregations','networkNodes','organizations','rights','services','assignments','connections','passiveComponents','issues','nodeFiberTransitions','portTopologyBindings','apPorts','odfs','odfPorts','cableRoutes','sourceDocuments','sourceAnnotations','sourceReviewCases','sourceConflicts','networkUseAssignments','evidenceRecords','fiberLineages','supersededFiberLineages','fiberLineageAudit','connectionSheets','importRuns'] as const;
  for(const key of keys){const a=(prior[key]??[]) as RecordData[],b=(data[key]??[]) as RecordData[];if(b.some(x=>typeof x.id==='string'&&a.some(old=>old.id===x.id)))throw Error('Unexpected cross-source canonical ID collision.');(prior as unknown as Record<string,unknown>)[key]=[...a,...b];}
  authority=prior;
 }
 authority.sourceCounts={cables:authority.cables.length,closures:authority.closures.length+(authority.networkNodes??[]).filter(n=>n.assetType==='closure').length,accessPoints:authority.accessPoints.length+(authority.networkNodes??[]).filter(n=>n.assetType==='ap').length,aggregations:authority.aggregations.length};
 applyIteration28C(authority);projectImportedUsage(authority,authority.fiberUsageProjection?.sourceEvidence??[]);
 const review=(key:string,category:string,shapeIds:string[],affectedIds:string[],question:string,observation:string)=>authority.sourceReviewCases!.push({id:id('REVIEW',key),category,status:'needs_review',source:source(shapeIds),affectedIds,question,observation,suspiciousReason:observation,candidates:[],proposal:null,interpretationBasis:semantic.version,engineerOptions:['leave unresolved','record source evidence with a reason'],confirmation:null,fieldVerified:false,bounds:[]});
 for(const c of data.cables)if(!spans.has((semantic.labels as RecordData[]).find(l=>cableIds.get(l.shapeId)===c.id)!.shapeId))review('construction-'+c.id,'source_bank_association',c.source.shapeIds,[c.id],'მონაკვეთის ჟილების ბანკები დასადგენია','Label endpoints/capacity are preserved, but a unique complete bank association is not proven. No physical colors or node transition inferred.');
 for(const p of data.apPorts!)if(!p.bindingId)review('port-'+p.id,'fiber_port_binding_ambiguous',p.source.shapeIds,[p.id],`AP${p.apNumber}/Port${p.number}: ზუსტი ჟილა დასადგენია`,'Printed Port retained. No unique source-supported bank/Fiber binding established.');
 for(const conflict of data.sourceConflicts!)review(String(conflict.id),'source_conflict',(conflict.source as SourceRef).shapeIds,[String(conflict.cableId??conflict.fiberId)],conflict.kind==='source_cable_capacity_conflict'?'კაბელის წარწერა და სრული ჟილების ბანკები განსხვავებულ რაოდენობას აჩვენებს':'ჟილის ფერი წყაროში წინააღმდეგობრივია',JSON.stringify(conflict));
 for(const text of repeatedLabels)review('duplicate-'+text,'source_representation_ambiguous',(semantic.labels as RecordData[]).filter(l=>l.text===text).map(l=>l.shapeId),[],'განმეორებული მონაკვეთის იდენტობა დასადგენია','Identical label occurrences have no unique bank/physical-span association. Source occurrences remain preserved; no duplicate canonical Cable count is invented.');
 for(const problem of semantic.portReview as RecordData[])review('port-bank-'+(problem.nodeSymbolShapeId??problem.portShapeId),'source_port_numbering',problem.shapeIds??[problem.portShapeId].filter(Boolean),problem.nodeSymbolShapeId?[refs.get(problem.nodeSymbolShapeId)!.id]:[],'პორტების ნუმერაცია წყაროში შესამოწმებელია',JSON.stringify(problem));
 data.sourceDocuments![0].counts.unresolvedAssertions=authority.sourceReviewCases!.filter(r=>r.id.startsWith('SHIDA-')).length;
 const errors=validateCurrentFiberPaths(authority);if(errors.length)throw Error(errors.join('; '));
 const authorityText=JSON.stringify(authority),authoritySha256=hash(authorityText),revision='UPLOAD-'+authoritySha256.slice(0,32);
 const operational=buildOperationalPayload(authority,revision),hydrated=hydrateOperationalPayload(operational);
 if(Object.entries(authority.fiberPathProjection!.paths).some(([key,path])=>path.signature!==hydrated.fiberPathProjection!.paths[key].signature))throw Error('Shida operational projection changed an optical path.');
 const detail:Record<string,unknown>=Object.fromEntries(DEFERRED_NETWORK_FIELDS.map(key=>[key,authority[key]??[]]));detail.fiberPathAudit=authority.fiberPathProjection!.audit;
 writeFileSync(output,JSON.stringify({authority,operational,details:{apiVersion:1,networkRevision:revision,inventory:packJson(detail)},networkRevision:revision,authoritySha256,expectedRevision:manifest.expectedRevision,counts:{cable_segments:authority.cables.length,fibers:authority.fibers.length,node_fiber_transitions:authority.nodeFiberTransitions!.length,port_topology_bindings:authority.portTopologyBindings!.length,fiber_paths:authority.fibers.length},warnings:semantic.warnings}));
}
