import { resolveCurrentFiberPath, currentAssetLabel, currentStopLabel } from './currentFiberPath';
import type { AssetRef, Inventory, Route, SearchResult } from './types';
import { cableDisplayName, findFiber, fiberLabel, typedAssetLabel, sameAsset } from './network';
import { sourceBAP, sourceBPort } from './iteration28d';
import { routeWithSelection } from './routeWorkspace';
import { ORGANIZATION_ALIASES } from './iteration28f';
import {exactOrganizationEntry} from './organizationEntry';
import { compactPath, portOperationalView, portOperationalRoute, portOperationalLabel, compactSearchResult } from './iteration28g';

export type QueryIntent = 'search' | 'trace_fiber' | 'node_connections' | 'node_transitions' | 'fibers_to_segment' | 'availability' | 'occupancy' | 'company_usage' | 'organization_network' | 'aggregation_usage' | 'organization_scope' | 'fiber_usage_state' | 'conflict' | 'port' | 'unknown';
export type AnswerState = 'exact' | 'partial' | 'conflict' | 'unknown' | 'disambiguation' | 'annotation';
export type QueryOutcome = AnswerState|'derived_from_exact_lineage'|'unknown_port'|'unknown_occupancy'|'review_required';
export interface NetworkQuery { intent: QueryIntent; raw: string; cableToken?: string; fiberNumber?: number; nodeToken?: string; company?: string; portNumber?: number; targetSegment?: string }
export interface EngineerAnswer { query: NetworkQuery; state: AnswerState; outcome:QueryOutcome; title: string; answer: string; facts: string[]; results: SearchResult[]; pathSignature?: string; transitions: Array<{ at: string; from: string; to: string; source: string; localIdentity: string }>; actions: Route[] }
export interface TransitionTrace { signature?: string; topologyRevision?: string; sides: Array<{ endpoint: string; legs: Array<{ cableId: string; fiberNumber: number }>; transitions: EngineerAnswer['transitions']; stop: string; terminal: boolean; complete: boolean; ambiguous: boolean }> }

const normalize = (s: string) => s.toLocaleLowerCase().replace(/[↔→·/_,–—-]+/g, ' ').replace(/([a-z])(\d)/g, '$1 $2').replace(/(\d)([a-z])/g, '$1 $2').replace(/\s+/g, ' ').trim();
const organizationMatch=(data:Inventory,input:string)=>{const q=normalize(input);for(const [id,aliases] of Object.entries(ORGANIZATION_ALIASES)){const org=data.organizations.find(o=>o.id===id)||data.organizations.find(o=>aliases.some(a=>o.aliases.some(x=>normalize(x)===normalize(a))));if(!org)continue;for(const alias of [...aliases,org.name,...org.aliases]){const a=normalize(alias);if(a&&(q===a||q.startsWith(a+' ')||q.includes(' '+a+' ')))return org;}}return undefined;};
const sourceName = (file: string) => /alpana|tvishi/i.test(file) ? 'ცაგერი–ალპანა–ტვიში' : /tsageri|lentekhi|სვანეთი/i.test(file) ? 'ცაგერი–ლენტეხი' : file;
const evidenceLabel = (source: { file: string; page: string; shapeIds: string[] }) => `${source.file} · ${source.page}${source.shapeIds.length ? ` · Shape ${source.shapeIds.join(', ')}` : ''}`;
const cableSource = (c: Inventory['cables'][number]) => sourceName(c.source.file);
const endpointLabel = (a: AssetRef, data?: Inventory) => data ? currentAssetLabel(data,a) : typedAssetLabel(a);
const cableTokens = (c: Inventory['cables'][number]) => [c.id, c.legacyCableId, `C${c.legacyCableId}`, `Cable ${c.legacyCableId}`, ...c.legacyLabels];
const exactCableMatches = (data: Inventory, token: string) => {
  const q = normalize(token);
  return data.cables.filter(c => cableTokens(c).some(t => normalize(t) === q));
};
const displayFiber = (data: Inventory, cableId: string, n: number) => {
  const cable = data.cables.find(c => c.id === cableId);
  return `${cable ? `C${cable.legacyCableId}` : cableId}/${fiberLabel(n)} · ${cable ? cableDisplayName(cable, data) : cableId}`;
};

export function traceFiberThroughTransitions(data: Inventory, cableId: string, fiberNumber: number): TransitionTrace {
  const canonical = data.cables.find(c => c.id === cableId) ?? data.cables.filter(c => c.legacyLabels.includes(cableId) || `C${c.legacyCableId}` === cableId).filter((_,index,all)=>all.length===1)[0];
  if (!canonical || !findFiber(data,canonical.id,fiberNumber)) return { sides: [] };
  const path = resolveCurrentFiberPath(data,canonical.id,fiberNumber);
  return { signature:path.signature, topologyRevision:path.topologyRevision, sides:path.sides.map(side=>({
    endpoint:currentAssetLabel(data,side.startNode), legs:side.legs.map(l=>({cableId:l.segmentId,fiberNumber:l.fiberNumber})),
    transitions:side.transitions.map(t=>({at:currentAssetLabel(data,t.node),from:`C${data.cables.find(c=>c.id===t.from.segmentId)?.legacyCableId}/F${t.from.fiberNumber}`,to:t.to?`C${data.cables.find(c=>c.id===t.to!.segmentId)?.legacyCableId}/F${t.to.fiberNumber}`:'ცნობილი დასრულება',source:evidenceLabel(t.evidence.source),localIdentity:`Tube ${t.from.tubeNumber??'?'} · ${t.from.fiberColor?.nameKa??'?'} → Tube ${t.to?.tubeNumber??'—'} · ${t.to?.fiberColor?.nameKa??'—'}`})),
    stop:currentStopLabel(data,side.stop),terminal:side.stop.kind==='termination',complete:side.stop.kind==='termination'||side.stop.kind==='port',ambiguous:side.ambiguous,
  })) };
}
export function parseNetworkQuery(input: string): NetworkQuery {
  const raw = input.trim(), q = normalize(raw);
  if(/aggregation|აგრეგაცი/i.test(raw)&&/იყენ|გამოიყენ|fiber|ჟილ|port|პორტ/i.test(raw))return {intent:'aggregation_usage',raw,nodeToken:/lentekhi|ლენტეხ/i.test(raw)?'AGG-LENTEKHI':'5'};
  const closureOrganization=/\bSC\s*(\d+)/i.exec(raw);
  if(closureOrganization&&/ორგანიზაცი|კომპანი|organization|company/i.test(raw))return {intent:'organization_scope',raw,nodeToken:closureOrganization[1]};
  const cableOrganization=/\bC\s*(\d+)/i.exec(raw);
  if(cableOrganization&&/ვინ იყენ|რომელ ორგანიზაცი|which organization|who uses/i.test(raw))return {intent:'organization_scope',raw,cableToken:`C${cableOrganization[1]}`};
  const orgAlias=Object.values(ORGANIZATION_ALIASES).flat().find(alias=>{const a=normalize(alias);return q===a||q.startsWith(a+' ')||q.includes(' '+a+' ');});
  if(orgAlias)return {intent:'organization_network',raw,company:orgAlias};
  const apToken=/\bAP\s*(\d+)/i.exec(raw)?.[1];
  if(apToken&&/დაკავებული|occupied|in.use/i.test(raw)) return {intent:'occupancy',raw,nodeToken:apToken};
  if (/თავისუფალ|free|available|availability|დაკავებული/i.test(raw)) {
    const id = raw.match(/(?:C|Cable)\s*(\d+)/i), f = /(?:\/|\s+)F(?:iber)?\s*(\d+)/i.exec(raw);
    return { intent: 'availability', raw, cableToken: id ? `C${id[1]}` : undefined, fiberNumber: f ? Number(f[1]) : undefined };
  }
  const node = raw.match(/\b(?:SC\s*(\d+)|Node\s*(\d+)|ქურო\s*(\d+)|კვანძი\s*(\d+))\b/i);
  if (node) {
    const id = node.slice(1).find(Boolean)!;
    if (/კაბელ|ერთდებ|connected|attached/i.test(raw)) return { intent: 'node_connections', raw, nodeToken: id };
    if (/გადაერთ|transition|mapping|შეერთებ|fiber|\bF\d+/i.test(raw)) return { intent: 'node_transitions', raw, nodeToken: id, fiberNumber: Number(/\bF\s*(\d+)/i.exec(raw)?.[1]) || undefined };
    return { intent: 'search', raw, nodeToken: id };
  }
  const canonicalFiber = raw.match(/^\s*([A-Z0-9_-]+)\s*\/\s*(?:F|Fiber\s*)?(\d+)\b/i);
  if (canonicalFiber) return { intent: 'trace_fiber', raw, cableToken: canonicalFiber[1], fiberNumber: Number(canonicalFiber[2]) };
  const reversedFiber = raw.match(/^\s*(?:Fiber|ჟილა)\s*(\d+)\s*(?:on\s*)?(?:C|Cable)?\s*(\d+)\b/i);
  const fiber = reversedFiber ?? raw.match(/(?:\bC(?:able)?\s*)?(\d+)\s*(?:\/|\s+)\s*(?:F(?:iber)?\s*)?(\d+)\b/i);
  if (fiber) {
    const reversed = !!reversedFiber;
    return { intent: 'trace_fiber', raw, cableToken: `C${reversed ? fiber[2] : fiber[1]}`, fiberNumber: Number(reversed ? fiber[1] : fiber[2]) };
  }
  if (/\b(\d+)-(\d+)-(\d+)-(\d+)\b/.test(raw)) return { intent: 'search', raw };
  const port = raw.match(/(?:Port|პორტი)\s*(\d+)/i);
  if (port) return { intent: 'port', raw, portNumber: Number(port[1]), nodeToken: /AP\s*(\d+)/i.exec(raw)?.[1] };
  if (/თავისუფალ|free|available|availability|დაკავებული/i.test(raw)) return { intent: 'availability', raw };
  const targetCable = raw.match(/(?:C|Cable)\s*(\d+)\s*(?:ზე|ზე\s*რომელი|on\s*which|which)?/i);
  if (targetCable && /რომელ|which/i.test(raw) && /fiber|ჟილ/i.test(raw) && /გადადის|გადის|leading|into/i.test(raw)) return { intent: 'fibers_to_segment', raw, targetSegment: `C${targetCable[1]}` };
  if (/otdr/i.test(raw)||/გადასამოწმ|review required|red dashed/i.test(raw)||/გამოუყენ|არ გამოიყენება|unused/i.test(raw)) return { intent:'fiber_usage_state',raw };
  if (/რომელ.*(fiber|ჟილ)|იყენებ|uses|გამოიყენ|ვინ იყენებს/i.test(raw)) return { intent: 'company_usage', raw, company: raw.match(/magti|silknet|skytel|opennet|სილქნეტი|მაგთი|სქაიტელ|ოპენნეტ/i)?.[0], cableToken:/\bC\s*\d+\b/i.test(raw)?`C${/\bC\s*(\d+)\b/i.exec(raw)?.[1]}`:undefined };
  if (/C148/i.test(raw) && /tube|ტუბ/i.test(raw)) return { intent: 'conflict', raw, cableToken: 'C148' };
  if (/\bC\s*\d+\b/i.test(raw) && /მიდის|გზა|trace|where|სად/i.test(raw)) return { intent: 'search', raw, cableToken: `C${/\bC\s*(\d+)\b/i.exec(raw)?.[1]}` };
  return { intent: raw ? 'search' : 'unknown', raw };
}

export function createEngineerQueryService(data: Inventory) {
  const searchIndex: SearchResult[] = [];
  for (const c of data.cables) searchIndex.push({ id: `cable:${c.id}`, title: cableDisplayName(c, data), subtitle: `კაბელი · Legacy C${c.legacyCableId} · ${cableSource(c)}`, category: 'Cable', route: { view: 'cable', id: c.id } });
  for (const c of data.closures) searchIndex.push({ id: `closure:${c.id}`, title: `SC${c.id}`, subtitle: 'ქურო · Closure', category: 'Closure', route: { view: 'closure', id: c.id } });
  for (const a of data.accessPoints) searchIndex.push({ id: `ap:${a.id}`, title: `AP${a.id} · ${a.name}`, subtitle: 'დაშვების წერტილი · AP', category: 'AP', route: { view: 'ap', id: a.id } });
  for (const a of data.aggregations) searchIndex.push({ id: `aggregation:${a.id}`, title: a.name, subtitle: 'აგრეგაცია · Aggregation', category: 'Aggregation', route: { view: 'aggregation', id: a.id } });
  for (const n of data.networkNodes ?? []) {
    const typedClosure = n.assetType === 'closure';
    const typedAP=n.assetType==='ap', ap=typedAP?(n.apEvidence??sourceBAP(n.id)):undefined;
    searchIndex.push({ id: `node:${n.id}`, title: typedClosure ? `${n.displayName} · Closure` : typedAP?`${n.displayName} · ${ap?.place??''}`:n.displayName, subtitle: typedClosure ? 'ქურო · source-symbol certified' : typedAP?`${ap?.capacity??'?'} Ports · AP symbol certified`:'ფიზიკური კვანძი · ტიპი დაუდგენელია', category: typedClosure ? 'Closure' : typedAP?'AP':'Node', route: (typedAP||typedClosure)&&data.cableRoutes?.[0]?{...routeWithSelection(data.cableRoutes[0].id,{type:'network_node',id:n.id}),target:`network_node:${n.id}`}:{ view: 'engineer', query: `Node ${n.id}` } });
  }
  for (const odf of data.odfs ?? []) searchIndex.push({ id: `odf:${odf.id}`, title: odf.displayLabel, subtitle: 'ODF · ფიზიკური ინვენტარი', category: 'ODF', route: { view: 'engineer', query: odf.displayLabel } });
  for (const p of data.odfPorts ?? []) searchIndex.push({ id: `port:${p.id}`, title: `${p.odfId} / Port ${p.number}`, subtitle: 'ODF Port · Port semantics as recorded', category: 'Port', route: { view: 'odf_port', odfId: p.odfId, port: p.number } });
  for (const p of data.portTopologyBindings ?? []) { const cable=data.cables.find(c=>c.id===p.segmentId); searchIndex.push({ id: `port-binding:${p.id}`, title: `${p.ownerType === 'ap' ? 'AP' : ''}${p.ownerId} / Port ${p.portNumber}`, subtitle: `C${cable?.legacyCableId??p.segmentId}/F${p.fiberNumber} · exact Port binding`, category: 'Port', route: { view: 'fiber', cableId:p.segmentId, fiber:p.fiberNumber } }); }
  for (const a of data.sourceAnnotations ?? []) {
    const org = data.organizations.find(o => o.id === a.associatedOrganizationIds[0] || o.aliases.some(alias => normalize(alias) === normalize(a.rawText)) || normalize(o.name) === normalize(a.rawText));
    searchIndex.push({ id: `annotation:${a.id}`, title: a.rawText, subtitle: `${a.category === 'service_commercial_note' ? `Company annotation${org ? ` · ${org.name} ${org.aliases.join(' ')}` : ''}` : a.category === 'direction' ? 'Direction annotation' : 'Place / source annotation'} · ${sourceName(a.source.file)}`, category: a.category === 'service_commercial_note' ? 'Company annotation' : 'Place annotation', route: { view: 'engineer', query: a.rawText } });
  }
  for (const doc of data.sourceDocuments ?? []) searchIndex.push({ id: `document:${doc.id}`, title: doc.title, subtitle: 'წყარო დოკუმენტი · Source document', category: 'Source document', route: { view: 'document', id: doc.id } });

  const tokenIndex = new Map<string, Set<SearchResult>>();
  for (const item of searchIndex) {
    const cable = data.cables.find(c => `cable:${c.id}` === item.id);
    const node = item.id.startsWith('node:') ? data.networkNodes?.find(n => item.id === `node:${n.id}`) : undefined;
    const closure = item.id.startsWith('closure:') ? data.closures.find(c => item.id === `closure:${c.id}`) : undefined;
    const annotation = item.id.startsWith('annotation:') ? data.sourceAnnotations?.find(a => item.id === `annotation:${a.id}`) : undefined;
    const org = annotation && data.organizations.find(o => o.id === annotation.associatedOrganizationIds[0] || o.aliases.some(alias => normalize(alias) === normalize(annotation.rawText)) || normalize(o.name) === normalize(annotation.rawText));
    const nodeReferences = node ? (node.externalReferences ?? []).flatMap(reference => [reference.externalId, reference.rawText ?? '', `${reference.system}-${reference.externalId}`, `GIS-${reference.externalId}`, `GIS ${reference.externalId}`]).join(' ') : '';
    const closureReferences = closure ? closure.sourceSymbolEvidence?.externalReferences.flatMap(reference => [reference.externalId, reference.rawText ?? '', `${reference.system}-${reference.externalId}`, `GIS-${reference.externalId}`, `GIS ${reference.externalId}`]).join(' ') ?? '' : '';
    const text = normalize(`${item.title} ${item.subtitle} ${cable ? cableTokens(cable).join(' ') : ''} ${node ? `${node.assetType==='ap'?'AP':'SC'}${node.id} Node ${node.id} ${node.displayName} ${node.sourceEndpointTokens.join(' ')} ${nodeReferences}` : ''} ${closureReferences} ${annotation ? `${annotation.rawText} ${org?.name ?? ''} ${org?.aliases.join(' ') ?? ''}` : ''}`);
    for (const token of new Set(text.split(' '))) if (token) { const bucket = tokenIndex.get(token) ?? new Set<SearchResult>(); bucket.add(item); tokenIndex.set(token, bucket); }
  }

  const search = (input: string): SearchResult[] => {
    const q = normalize(input); if (!q) return [];
    const apOwners=(number:string)=>[...data.accessPoints.filter(a=>a.id===number||a.aliases.some(alias=>normalize(alias)===normalize('AP'+number))).map(a=>a.id),...(data.networkNodes??[]).filter(n=>n.assetType==='ap'&&(n.apEvidence?.number===Number(number)||n.id===number)).map(n=>n.id)];
    const exactAP=/^\s*AP\s*(\d+)\s*$/i.exec(input);
    if(exactAP){const owners=new Set(apOwners(exactAP[1]));return searchIndex.filter(r=>r.category==='AP'&&owners.has(r.id.replace(/^(?:ap|node):/,'')));}
    const scopedPort=/\b(?:AP\s*(\d+)\s*|Lentekhi\s*|ლენტეხის\s*|Tsageri\s*|ცაგერის\s*)Port\s*(\d+)\b/i.exec(input);
    if(scopedPort){
      const apId=scopedPort[1],n=Number(scopedPort[2]),lentekhi=/Lentekhi|ლენტეხის/i.test(input),tsageri=/Tsageri|ცაგერის/i.test(input);
      const odf=apId?undefined:data.odfs?.find(o=>o.containedBy.kind==='aggregation'&&o.containedBy.id===(lentekhi?'AGG-LENTEKHI':'5'));
      const ownerType=apId?'ap' as const:'odf' as const,ownerIds=apId?apOwners(apId):odf?[odf.id]:[];
      if(!Number.isInteger(n)||n<=0)return [];
      return ownerIds.flatMap(ownerId=>{
      const ap=data.accessPoints.find(a=>a.id===ownerId),sourceAP=data.networkNodes?.find(a=>a.id===ownerId&&a.assetType==='ap');
      const exists=apId
        ? !!(data.apPorts?.some(p=>(p.canonicalNode?p.canonicalNode.id===ownerId:String(p.apNumber)===ownerId)&&p.number===n)||((ap?.portCount??sourceAP?.apEvidence?.capacity??0)>=n))
        : !!odf&&(data.odfPorts?.some(p=>p.odfId===odf.id&&p.number===n)??false);
      if(!exists)return [];
      const view=portOperationalView(data,ownerType,ownerId,n);
      const title=apId?`AP${apId} / Port ${n}`:`${odf!.displayLabel} · Port ${n}`;
      const workspaceRoute=data.cableRoutes?.[0]?routeWithSelection(data.cableRoutes[0].id,{type:'port',ownerType,ownerId,number:n}):null;
      return [{id:view.bindingId?`port-binding:${view.bindingId}`:`port:${ownerId}:${n}`,title,subtitle:view.bindingId?portOperationalLabel(view):tsageri?'Fiber მიბმა და Port-ის ფიზიკური სტატუსი წყაროდან დაუდგენელია':view.evidenceStatus,category:'Port',facts:view.bindingId?[view.occupancy,`Tube ${view.tubeNumber??'?'} · ${view.tubeColor??'?'} · F${view.fiberNumber} · ${view.fiberColor??'?'}`,view.pathSummary??''].filter(Boolean):[view.occupancy],pathSummary:view.pathSummary??undefined,route:workspaceRoute??portOperationalRoute(view,data)}];
      });
    }
    const bareCable=/^\s*(?:C|Cable)\s*(\d+)\s*$/i.exec(input);
    if(bareCable){const exact=exactCableMatches(data,`C${bareCable[1]}`);if(exact.length)return exact.map(c=>searchIndex.find(r=>r.id===`cable:${c.id}`)!);}
    const apPlace=data.accessPoints.find(a=>a.name.toLocaleLowerCase()===input.trim().toLocaleLowerCase());
    if(apPlace){const r=searchIndex.find(x=>x.id===`ap:${apPlace.id}`);if(r)return [r];}
    const fiber = parseNetworkQuery(input);
    if (fiber.intent === 'trace_fiber' && fiber.cableToken && fiber.fiberNumber) {
      const cables = exactCableMatches(data, fiber.cableToken);
      return cables.filter(c => findFiber(data, c.id, fiber.fiberNumber!)).map(c => ({ id: `fiber:${c.id}:${fiber.fiberNumber}`, title: displayFiber(data, c.id, fiber.fiberNumber!), subtitle: `Fiber · Legacy C${c.legacyCableId} · ${cableSource(c)}`, category: 'Fiber', route: data.cableRoutes?.[0] ? routeWithSelection(data.cableRoutes[0].id,{type:'fiber',cableId:c.id,number:fiber.fiberNumber!}) : { view: 'engineer', query: `${c.id}/F${fiber.fiberNumber}` } }));
    }
    if (/tube|ტუბ/i.test(input)) {
      const token = /(?:C|Cable)\s*(\d+)/i.exec(input)?.[1];
      const matches = token ? exactCableMatches(data, `C${token}`) : data.cables;
      const ids = new Set(matches.map(c => c.id));
      return (data.tubes ?? []).filter(t => ids.has(t.cableId) && (!/tube\s*\d+|ტუბ\s*\d+/i.test(input) || normalize(input).includes(normalize(`Tube ${t.number}`)))).map(t => {
        const c = data.cables.find(item => item.id === t.cableId)!;
        const fiberSample = data.fibers.find(f => f.cableId === c.id && f.tubeId === t.id);
        return { id: `tube:${t.id}`, title: `C${c.legacyCableId} / Tube ${t.number ?? '?'}`, subtitle: `Tube · ${t.physicalColor.nameKa ?? 'ფერი უცნობია'} · ${cableDisplayName(c, data)} · ${cableSource(c)}`, category: 'Tube', route: fiberSample ? { view: 'engineer' as const, query: `${c.id}/F${fiberSample.number}` } : { view: 'cable' as const, id: c.id } };
      });
    }
    const org=organizationMatch(data,input),organizationProjection=org&&data.organizationNetworkProjection?.organizations.find(item=>item.organizationId===org.id);
    if(org&&organizationProjection){const organizationResult:SearchResult={id:`organization:${org.id}`,title:org.name,subtitle:`${organizationProjection.strands.length} logical Fiber paths · ${organizationProjection.cableIds.length} Cables`,category:'Organization',route:exactOrganizationEntry(data,input)?{view:'organization',id:org.id,query:input}:{view:'engineer',query:input}},strandResults=organizationProjection.strands.slice(0,8).flatMap(strand=>{const leg=strand.localFiberLegs[0],c=leg&&data.cables.find(x=>x.id===leg.segmentId),f=leg&&data.fibers.find(x=>x.cableId===leg.segmentId&&x.number===leg.fiberNumber);if(!leg||!c||!f)return [];const tube=data.tubes.find(t=>t.id===f.tubeId),label=`C${c.legacyCableId}/F${leg.fiberNumber}`,path=compactPath(data,leg.segmentId,leg.fiberNumber);return [{id:`organization-strand:${strand.id}`,title:label,subtitle:`Tube ${tube?.number??'?'} · ${tube?.physicalColor.nameKa??'?'} · F${leg.fiberNumber} · ${f.physicalColor.nameKa??'?'}`,category:'Fiber',facts:[`${org.name} · ${strand.usageState}`,path],pathSummary:path,tubeColorHex:tube?.physicalColor.hex??undefined,fiberColorHex:f.physicalColor.hex??undefined,route:exactOrganizationEntry(data,input)?{view:'organization' as const,id:org.id,strand:strand.id,mode:'path' as const,query:input}:{view:'engineer' as const,query:input}}];}),sourceLabel=searchIndex.find(item=>item.category==='Company annotation'&&normalize(`${item.title} ${item.subtitle}`).includes(normalize(org.name)));return [organizationResult,...strandResults,...(sourceLabel?[{...sourceLabel,id:`organization-source-label:${sourceLabel.id}`,title:'წყაროს წარწერა',subtitle:'ზუსტი local Fiber annotation · source details',details:[sourceLabel.title,sourceLabel.subtitle]}]:[])];}
    const exactLabel = /^\d+-\d+-\d+-\d+$/.test(input.trim()) ? data.cables.filter(c => c.legacyLabels.some(label => normalize(label) === q)) : [];
    if (exactLabel.length) return exactLabel.map(c => searchIndex.find(r => r.id === `cable:${c.id}`)!);
    const terms = [...new Set(q.split(' '))];
    let candidates = new Set(tokenIndex.get(terms[0]) ?? []);
    for (const term of terms.slice(1)) { const bucket = tokenIndex.get(term) ?? new Set<SearchResult>(); candidates = new Set([...candidates].filter(item => bucket.has(item))); }
    return [...candidates].sort((a,b) => Number(normalize(a.title) !== q) - Number(normalize(b.title) !== q));
  };

  const run = (input: string): EngineerAnswer => {
    const query = parseNetworkQuery(input), lookupText = query.nodeToken && query.intent === 'search' ? `Node ${query.nodeToken}` : query.intent === 'search' && query.cableToken ? query.cableToken : input, results = search(lookupText);
    const answer = (state: AnswerState, title: string, text: string, facts: string[] = [], transitions: EngineerAnswer['transitions'] = [], actions: Route[] = []): EngineerAnswer => ({ query, state, outcome:state, title, answer: text, facts, results, transitions, actions });
    if(query.intent==='organization_network'){
      const org=organizationMatch(data,input),projection=org&&data.organizationNetworkProjection?.organizations.find(item=>item.organizationId===org.id);
      if(!org||!projection)return answer('unknown','ორგანიზაციის ქსელური გამოყენება ვერ მოიძებნა','აქტიურ Fiber usage projection-ში ამ ზუსტ სახელზე გამოყენება არ არის დადგენილი.');
      const qualifiedCable=/\bC\s*(\d+)\b/i.exec(input);
      if(qualifiedCable){const matches=exactCableMatches(data,`C${qualifiedCable[1]}`);if(matches.length!==1)return answer(matches.length?'disambiguation':'unknown',`${org.name} · Cable scope`,'აირჩიეთ ზუსტი source-scoped Cable.');const cable=matches[0],legs=projection.localFiberLegs.filter(l=>l.segmentId===cable.id);return {...answer(legs.length?'partial':'unknown',`${org.name} · C${cable.legacyCableId} use`, 'პასუხი შეზღუდულია მოთხოვნილ კაბელზე; გამოყენება საკუთრებას არ ნიშნავს.',legs.map(l=>`C${cable.legacyCableId}/F${l.fiberNumber}`),[],[{view:'cable',id:cable.id}]),results:results.filter(r=>r.category==='Organization'||r.id===`cable:${cable.id}`)};}
      if(/review|გადასამოწმ|მიმოხილვ|conflict|კონფლიქტ/i.test(input)){const cases=projection.reviewCaseIds.flatMap(id=>{const r=data.fiberUsageProjection?.reviewCases.find(r=>r.id===id);return r?[r]:[]});return {...answer(cases.length?'partial':'unknown',`${org.name} · Review cases`,'მხოლოდ დაკავშირებული მიმოხილვის ჩანაწერები; ასოციაცია მთელ გზას ავტომატურად არ უარყოფს.',cases.map(r=>`${r.id} · ${r.question}`),[],[{view:'review',query:input}]),outcome:cases.length?'review_required':'unknown',results:[]};}
      if(/otdr/i.test(input)){const views=(data.fiberUsageProjection?.localViews??[]).filter(v=>v.organization===org.name&&/otdr/i.test(v.purpose??''));return views.length?answer('exact',`${org.name} · OTDR purpose`,'OTDR ინიშნება მხოლოდ შესაბამისი source purpose ჩანაწერებისთვის.',views.map(v=>`C${data.cables.find(c=>c.id===v.segmentId)?.legacyCableId}/F${v.fiberNumber} · ${v.purpose} · ${v.usageState}`)):answer('unknown',`${org.name} · OTDR purpose unknown`,'ზუსტ OTDR purpose-ზე Fiber არ მოიძებნა.');}
      const cableFacts=projection.cableIds.map(id=>{const cable=data.cables.find(c=>c.id===id)!;const legs=projection.localFiberLegs.filter(l=>l.segmentId===id);const ranges=legs.map(l=>l.fiberNumber).sort((a,b)=>a-b).map(n=>`C${cable.legacyCableId}/F${String(n).padStart(2,'0')}`).join(', ');return `C${cable.legacyCableId} · ${cableDisplayName(cable,data)} — ${ranges}`;});
      const portFacts=projection.portBindingIds.map(id=>{const b=data.portTopologyBindings?.find(x=>x.id===id);return b?`${b.ownerType==='ap'?'AP':''}${b.ownerId} / Port ${b.portNumber} ↔ C${data.cables.find(c=>c.id===b.segmentId)?.legacyCableId}/F${b.fiberNumber}; Port occupancy: ${b.ownerType==='ap'?sourceBPort(b.ownerId,b.portNumber)?.occupancy??'unknown':'unknown'}.`:''}).filter(Boolean);
      const aggFacts=projection.aggregationIds.map(id=>`Fiber reaches ${currentAssetLabel(data,{kind:'aggregation',id})}.`);
      const closureFacts=projection.closureIds.map(id=>`Organization Fiber path passes through ${data.networkNodes?.find(n=>n.id===id)?.displayName??`SC${id}`}.`);
      const strands=projection.strands.map(s=>`${s.usageState} · ${s.localFiberLegs.map(l=>`C${data.cables.find(c=>c.id===l.segmentId)?.legacyCableId}/F${String(l.fiberNumber).padStart(2,'0')}`).join(' → ')} · ${s.pathEndpoints.join(' ↔ ')}`);
      const reviewFacts=projection.reviewCaseIds.map(id=>{const item=data.fiberUsageProjection?.reviewCases.find(r=>r.id===id);return item?`${item.id}: ${item.question}`:id;});
      const facts=[`${projection.strands.length} logical strand groups · ${projection.localFiberLegs.length} local Fiber legs · ${projection.cableIds.length} Cables · ${projection.aggregationIds.length} Aggregations · ${projection.portBindingIds.length} exact Port bindings.`,`Cables / local Fibers`,...cableFacts,...(aggFacts.length?['Aggregations reached',...aggFacts]:[]),...(portFacts.length?['Certified APs / exact Ports',...[...new Set([...projection.apIds.map(id=>`AP${id}`),...portFacts])]]:[]),...(closureFacts.length?['Closure path context',...closureFacts]:[]),...(projection.aggregationIds.length&&projection.strands.some(s=>s.unknownPort)?['ზოგიერთ aggregation-side Fiber-ზე პორტის ზუსტი მიბმა წყაროდან არ არის დადგენილი.']:[]),...(projection.conflicts.length?['Conflicts',...projection.conflicts]:[]),...(reviewFacts.length?['Review cases',...reviewFacts]:[]),'Maximum-known logical Fiber paths',...strands.slice(0,30)];
      const linked:SearchResult[]=[
        ...projection.cableIds.map(id=>({id:`cable:${id}`,title:`C${data.cables.find(c=>c.id===id)?.legacyCableId}`,subtitle:'Fiber usage claim on this exact Cable Segment',category:'Cable',route:{view:'cable' as const,id}})),
        ...projection.aggregationIds.map(id=>({id:`aggregation:${id}`,title:currentAssetLabel(data,{kind:'aggregation',id}),subtitle:'Reached by current exact Fiber path',category:'Aggregation',route:{view:'aggregation' as const,id}})),
        ...projection.apIds.map(id=>{const node=data.networkNodes?.find(n=>n.id===id&&n.assetType==='ap');return {id:`organization-ap:${id}`,title:node?.displayName??`AP${id}`,subtitle:`Exact Fiber path · ${projection.portBindingIds.filter(bindingId=>data.portTopologyBindings?.find(b=>b.id===bindingId)?.ownerId===id).length} exact Port bindings`,category:'AP',route:node&&data.cableRoutes?.[0]?{...routeWithSelection(data.cableRoutes[0].id,{type:'network_node',id}),target:`network_node:${id}`}:{view:'engineer' as const,query:`AP${id}`}};}),
        ...projection.portBindingIds.map(id=>{const b=data.portTopologyBindings!.find(x=>x.id===id)!;return {id:`org-port:${id}`,title:`${b.ownerType==='ap'?'AP':''}${b.ownerId} / Port ${b.portNumber}`,subtitle:`Exact Port binding · C${data.cables.find(c=>c.id===b.segmentId)?.legacyCableId}/F${b.fiberNumber}`,category:'Port',route:{view:'engineer' as const,query:`C${data.cables.find(c=>c.id===b.segmentId)?.legacyCableId}/F${b.fiberNumber}`}};}),
        ...projection.closureIds.map(id=>({id:`closure:${id}`,title:data.networkNodes?.find(n=>n.id===id)?.displayName??`SC${id}`,subtitle:'Passed by exact organization Fiber path',category:'Closure',route:{view:'engineer' as const,query:`SC${id}`}})),
      ];
      const sourceResults=projection.sourceOccurrenceIds.flatMap(id=>{const assignment=(data.networkUseAssignments??[]).find(a=>a.occurrenceIds.includes(id));return assignment?[{id:`source-occurrence:${id}`,title:`Source label occurrence ${id}`,subtitle:`${evidenceLabel(assignment.source)} · direct local label evidence`,category:'Source evidence',route:{view:'engineer' as const,query:org.name}}]:[];});
      const directAssignments=(data.networkUseAssignments??[]).filter(a=>a.organizationId===org.id).length;
      return {...answer('exact',`${org.name} · Network usage`,`${directAssignments} წყაროთი ინტერპრეტირებული assignment და 28E Fiber usage projection. ეს ქსელური გამოყენებაა; ownership, service, customer ან rights/IRU არ გამომდინარეობს.`,facts,[],projection.cableIds.slice(0,4).map(id=>({view:'cable',id} as Route)).concat(projection.aggregationIds.slice(0,2).map(id=>({view:'aggregation',id} as Route)))),outcome:projection.strands.some(s=>s.usageState==='review_required')?'review_required':projection.strands.some(s=>s.unknownPort)?'unknown_port':'derived_from_exact_lineage',results:[{id:`organization:${org.id}`,title:org.name,subtitle:'Network usage',category:'Organization',route:exactOrganizationEntry(data,input)?{view:'organization',id:org.id,query:input}:{view:'engineer',query:input}},...linked,...sourceResults]};
    }
    if(query.intent==='aggregation_usage'){
      const projection=data.aggregationOperationalProjection?.aggregations.find(a=>a.aggregationId===query.nodeToken);
      if(!projection)return answer('unknown','Aggregation Fiber usage ვერ მოიძებნა','ამ Aggregation-ისთვის operational Fiber projection არ არის წარმოდგენილი.');
      const facts=[`${projection.fibers.length} local Fibers · ${projection.usageCounts.in_use??0} in use · ${projection.usageCounts.unused??0} unused · ${projection.usageCounts.review_required??0} review · ${projection.usageCounts.unknown??0} unknown.`,...Object.entries(projection.organizationCounts).map(([org,count])=>`${org}: ${count} local Fiber legs`),...projection.fibers.filter(f=>f.portNumber!==null).map(f=>`C${f.legacyCableId}/F${f.fiberNumber} ↔ Port ${f.portNumber} · Fiber ${f.usageState} · Port occupancy ${f.portOccupancy}`),...projection.fibers.filter(f=>f.portNumber===null).slice(0,8).map(f=>`C${f.legacyCableId}/F${f.fiberNumber} · ${f.usageState} · პორტის ზუსტი მიბმა წყაროდან არ არის დადგენილი`),...projection.unknownReasons];
      return {...answer('partial',`${projection.name} · Fiber usage`,`Port binding და Port occupancy Fiber usage-სგან დამოუკიდებლად არის ნაჩვენები.`,facts,[],[{view:'aggregation',id:projection.aggregationId}]),outcome:projection.unknownPortFibers?'unknown_port':projection.fibers.some(f=>f.portOccupancy==='unknown')?'unknown_occupancy':'partial'};
    }
    if(query.intent==='organization_scope'){
      if(query.cableToken){const cable=exactCableMatches(data,query.cableToken)[0];if(!cable)return answer('unknown','Cable ვერ მოიძებნა','');const rows=(data.fiberUsageProjection?.localViews??[]).filter(v=>v.segmentId===cable.id&&v.organization);const names=[...new Set(rows.map(v=>v.organization!))];const facts=names.map(name=>`${name}: ${rows.filter(v=>v.organization===name).map(v=>`F${v.fiberNumber}`).join(', ')}`);return rows.length?answer('exact',`C${cable.legacyCableId} · Organization Fiber use`,`${rows.length} exact local Fiber legs have organization evidence.`,facts):answer('unknown',`C${cable.legacyCableId} · organization use unknown`,'ამ Cable-ზე ზუსტი organization assignment არ არის.');}
      const strands=(data.organizationNetworkProjection?.organizations??[]).flatMap(o=>o.strands.filter(s=>s.closureIds.includes(query.nodeToken??'')).map(s=>({org:o.name,s}))),names=[...new Set(strands.map(x=>x.org))];return strands.length?answer('exact',`SC${query.nodeToken} · Fiber path organizations`,'These organization Fiber paths traverse the Closure; this does not imply Closure ownership.',names.map(n=>`${n}: ${strands.filter(x=>x.org===n).length} logical paths`),[],strands.slice(0,8).map(x=>({view:'engineer',query:x.org} as Route))):answer('unknown',`SC${query.nodeToken} · no organization path established`,'Exact organization Fiber Lineage through this Closure was not found.');
    }
    if(query.intent==='occupancy'&&query.nodeToken) {
      const ap=data.networkNodes?.some(n=>n.id===query.nodeToken&&n.assetType==='ap')?sourceBAP(query.nodeToken):undefined;
      if(!ap) return answer('unknown','Port occupancy დაუდგენელია','ამ AP-ის წყაროს occupancy ბანკი არ არის სერტიფიცირებული.');
      const occupied=ap.ports.filter(p=>p.occupancy==='in_use');
      return answer('exact',`AP${ap.apNumber} · ფიზიკურად გამოყენებული პორტები`,`${occupied.length} Port: ${occupied.map(p=>p.number).join(', ')}. ეს არ არის კომერციული ხელმისაწვდომობის მტკიცება.`,occupied.map(p=>`Port ${p.number} · in_use · Shape ${p.shapeId}`),[],[{...routeWithSelection(data.cableRoutes![0].id,{type:'network_node',id:String(ap.apNumber)}),target:`network_node:${ap.apNumber}`}]);
    }
    if (!query.raw) return answer('unknown', 'მოძებნე ან ჰკითხე Fiber Atlas-ს', 'შეიყვანეთ Cable, Fiber, Node, Port ან ქსელის კითხვა.');
    if (query.intent === 'trace_fiber' && query.cableToken && query.fiberNumber) {
      const matches = exactCableMatches(data, query.cableToken).filter(c => findFiber(data, c.id, query.fiberNumber!));
      if (!matches.length) return answer('unknown', 'ჟილა ვერ მოიძებნა', `${query.cableToken}/F${query.fiberNumber} აქტიურ ინვენტარში არ მოიძებნა.`);
      if (matches.length > 1) return answer('disambiguation', 'აირჩიეთ სწორი Cable', `Legacy ${query.cableToken} რამდენიმე წყაროში გვხვდება. წყაროს არჩევამდე კვალი არ გაიხსნება.`, matches.map(c => `${cableDisplayName(c, data)} · ${cableSource(c)}`), [], matches.map(c => ({ view: 'engineer', query: `${c.id}/F${query.fiberNumber}` })));
      const c = matches[0], route: Route = { view: 'trace', cableId: c.id, fiber: query.fiberNumber };
      const trace = traceFiberThroughTransitions(data, c.id, query.fiberNumber);
      const transitions = trace.sides.flatMap(side => side.transitions);
      const path = trace.sides.map((side,i) => `${i === 0 ? 'ერთი ბოლო' : 'მეორე ბოლო'} (${side.endpoint}): ${side.legs.map(leg => `C${data.cables.find(x => x.id === leg.cableId)?.legacyCableId ?? leg.cableId}/F${leg.fiberNumber}`).join(' → ')}${side.transitions.length ? ` · ${side.transitions.map(t => `${t.at}: ${t.from} → ${t.to}`).join(' · ')}` : ''} · ${side.stop}`).join('\n');
      const stops = trace.sides.map(side => side.stop);
      const partial = trace.sides.some(side => !side.complete);
      const stopFacts = stops;
      if (/terminated|ტერმინირ|დასრულ/i.test(query.raw) && partial) stopFacts.unshift('აქტიურ ქსელში ეს Fiber terminated-ად არ არის მონიშნული; ცნობილი გზა source/transition საზღვარზე ჩერდება.');
      const ambiguous = trace.sides.some(side => side.ambiguous);
      if (ambiguous) stopFacts.unshift('ამ Node-ზე რამდენიმე აქტიური local transition არის შესაძლებელი; არჩევანი ცალ-ცალკე არის ნაჩვენები და ავტომატურად არ იკვრება.');
      return { ...answer(ambiguous ? 'disambiguation' : partial ? 'partial' : 'exact', `C${c.legacyCableId}/F${query.fiberNumber}`, path || `${cableDisplayName(c, data)} / F${query.fiberNumber}`, stopFacts, transitions, [{ view: 'engineer', query: `${c.id}/F${query.fiberNumber}` }, { view: 'cable', id: c.id }]), pathSignature: trace.signature };
    }
    if (query.intent === 'search' && query.cableToken && /მიდის|გზა|where|trace/i.test(query.raw)) {
      const matches = exactCableMatches(data, query.cableToken);
      if (matches.length > 1) return answer('disambiguation', `${query.cableToken} რამდენიმე წყაროში გვხვდება`, 'აირჩიეთ Cable წყაროსა და endpoint-ების მიხედვით.', matches.map(c => `${cableDisplayName(c, data)} · ${cableSource(c)}`));
      if (matches.length === 1) { const c = matches[0]; return answer('exact', cableDisplayName(c, data), `Cable ${c.legacyLabels[0] ?? c.id} აკავშირებს მის ორ source-supported endpoint-ს.`, [`ერთი ბოლო: ${endpointLabel(c.endpointA, data)}`, `მეორე ბოლო: ${endpointLabel(c.endpointB, data)}`, `ტევადობა: ${c.fiberCount}F · წყარო: ${cableSource(c)}`], [], [{ view: 'cable', id: c.id }]); }
    }
    if (query.intent === 'node_connections' || query.intent === 'node_transitions') {
      const token = query.nodeToken!, closure = data.closures.find(n => n.id === token), node = data.networkNodes?.find(n => n.id === token);
      const ref: AssetRef | undefined = closure ? { kind: 'closure', id: closure.id } : node ? { kind: 'network_node', id: node.id } : undefined;
      if (!ref) return answer('unknown', `Node ${token} ვერ მოიძებნა`, 'ასეთი Node ან Closure აქტიურ ქსელში არ არის.');
      const nodeSegments = new Set((data.nodeFiberTransitions ?? []).filter(t => t.active && sameAsset(t.node, ref)).flatMap(t => [t.a.segmentId, ...(t.z ? [t.z.segmentId] : [])]));
      const cables = data.cables.filter(c => sameAsset(c.endpointA, ref) || sameAsset(c.endpointB, ref) || nodeSegments.has(c.id));
      const edges = (data.nodeFiberTransitions ?? []).filter(t => t.active && sameAsset(t.node, ref));
      const segmentFiber = (segmentId: string, number: number) => { const c = data.cables.find(item => item.id === segmentId); return `C${c?.legacyCableId ?? segmentId}/F${number}`; };
      const trans = edges.map(t => ({ at: endpointLabel(t.node, data), from: segmentFiber(t.a.segmentId, t.a.fiberNumber), to: t.z ? segmentFiber(t.z.segmentId, t.z.fiberNumber) : t.transitionType === 'intentional_termination' ? 'ცნობილი დასრულება' : 'გაგრძელება დაუდგენელია', source: evidenceLabel(t.source), localIdentity: `A: Tube ${t.a.tubeNumber ?? '?'} · ${t.a.fiberColor?.nameKa ?? 'ფერი უცნობია'} → Z: Tube ${t.z?.tubeNumber ?? '—'} · ${t.z?.fiberColor?.nameKa ?? '—'}` }));
      const filteredEdges = query.fiberNumber ? edges.filter(t => t.a.fiberNumber === query.fiberNumber || t.z?.fiberNumber === query.fiberNumber) : edges;
      const grouped = new Map<string, number>();
      for (const t of filteredEdges) { if (!t.z) continue; const a = t.a.segmentId, z = t.z.segmentId, key = [a,z].sort().join(' ↔ '); grouped.set(key, (grouped.get(key) ?? 0) + 1); }
      const segmentName = (id: string) => { const c = data.cables.find(item => item.id === id); return c ? `C${c.legacyCableId}` : id; };
      const facts = query.intent === 'node_connections' ? cables.map(c => `${cableDisplayName(c, data)} · ${c.fiberCount}F`) : [...grouped].map(([pair,n]) => `${pair.split(' ↔ ').map(segmentName).join(' ↔ ')}: ${n} exact Fiber transitions`).concat(filteredEdges.filter(t => !t.z).map(t => `${segmentFiber(t.a.segmentId, t.a.fiberNumber)} → ${t.transitionType === 'intentional_termination' ? 'ცნობილი დასრულება' : 'გაგრძელება დაუდგენელია'}`));
      const text = query.intent === 'node_connections' ? `${endpointLabel(ref, data)}-ზე ფიზიკურად წარმოდგენილია ${cables.length} Cable.` : `${endpointLabel(ref, data)}-ზე აქტიურ გრაფში ${filteredEdges.length} ზუსტი local Fiber transition არის${query.fiberNumber ? `, რომელიც F${query.fiberNumber}-ს მოიცავს` : ''}.`;
      const actions: Route[] = closure ? [{ view: 'closure', id: closure.id }, { view: 'splice', nodeKind: 'closure', nodeId: closure.id }] : node?.assetType === 'closure' ? [{ view: 'splice', nodeKind: 'network_node', nodeId: node.id }] : [];
      return answer('exact', query.intent === 'node_connections' ? 'რა ერთდება აქ' : 'Fiber გადასვლები', text, facts, trans.filter(t => !query.fiberNumber || t.from.endsWith(`/F${query.fiberNumber}`) || t.to.endsWith(`/F${query.fiberNumber}`)), actions);
    }
    if (query.intent === 'fibers_to_segment' && query.targetSegment) {
      const cables = exactCableMatches(data, query.targetSegment), targets = new Set(cables.map(c => c.id));
      const rows = (data.nodeFiberTransitions ?? []).filter(t => t.active && t.z && (targets.has(t.a.segmentId) || targets.has(t.z.segmentId))).map(t => {
        const fromSide = targets.has(t.a.segmentId) ? t.z! : t.a, toSide = targets.has(t.a.segmentId) ? t.a : t.z!;
        const fromCable = data.cables.find(c => c.id === fromSide.segmentId), toCable = data.cables.find(c => c.id === toSide.segmentId);
        return { at: endpointLabel(t.node, data), from: `C${fromCable?.legacyCableId ?? fromSide.segmentId}/F${fromSide.fiberNumber}`, to: `C${toCable?.legacyCableId ?? toSide.segmentId}/F${toSide.fiberNumber}`, source: t.source.file, localIdentity: `${fromSide.tubeColor?.nameKa ?? 'Tube color unknown'} / ${fromSide.fiberColor?.nameKa ?? 'Fiber color unknown'} → ${toSide.tubeColor?.nameKa ?? 'Tube color unknown'} / ${toSide.fiberColor?.nameKa ?? 'Fiber color unknown'}` };
      });
      return answer(rows.length ? 'exact' : 'unknown', `Fiber-ები ${query.targetSegment}-ზე`, rows.length ? `${rows.length} ზუსტი local mapping მოიძებნა${rows.length > 60 ? `; ნაჩვენებია პირველი 60, დარჩენილია ${rows.length - 60}` : ''}.` : 'აქტიურ გადასვლებში შესაბამისი local mapping არ მოიძებნა.', rows.slice(0, 60).map(r => `${r.from} → ${r.to} · ${r.at}`), rows.slice(0, 60));
    }
    if (query.intent === 'availability') {
      const cable = query.cableToken ? exactCableMatches(data, query.cableToken)[0] : undefined;
      const who = cable && query.fiberNumber ? `C${cable.legacyCableId}/F${query.fiberNumber}` : 'ეს Fiber';
      const explicit = cable && query.fiberNumber ? (data.fibers.find(f => f.cableId === cable.id && f.number === query.fiberNumber)?.allocation === 'assigned' || data.fibers.find(f => f.cableId === cable.id && f.number === query.fiberNumber)?.allocation === 'reserved') : false;
      return explicit ? answer('exact', `${who} მინიჭებული ან რეზერვირებულია`, 'Fiber Atlas-ში explicit allocation ჩანს; ეს არ ნიშნავს კომერციული/ადმინისტრაციული თავისუფლების უფრო ფართო მდგომარეობას.') : answer('unknown', `${who} თავისუფლება დადგენილი არ არის`, 'ქსელთან კავშირი ან “unused” სტატუსი კომერციულ/ადმინისტრაციულ თავისუფლებას არ ადასტურებს. აქტიურ მონაცემებში authoritative availability ჩანაწერი არ მოიძებნა.');
    }
    if (query.intent === 'fiber_usage_state') {
      const views=data.fiberUsageProjection?.localViews??[];
      const wanted=/otdr/i.test(input)?views.filter(view=>view.purpose?.toLowerCase().includes('otdr')):/გამოუყენ|არ გამოიყენება|unused/i.test(input)?views.filter(view=>view.usageState==='unused'):/გადასამოწმ|review required|red dashed/i.test(input)?views.filter(view=>view.usageState==='review_required'):[];
      const selected= query.cableToken ? exactCableMatches(data,query.cableToken) : [];
      const scoped=selected.length?wanted.filter(view=>selected.some(c=>c.id===view.segmentId)):wanted;
      const facts=scoped.slice(0,80).map(view=>{const cable=data.cables.find(item=>item.id===view.segmentId);return `C${cable?.legacyCableId??view.segmentId}/F${view.fiberNumber} · ${view.usageState}${view.purpose?` · ${view.purpose}`:''}`;});
      return scoped.length?answer('exact',/otdr/i.test(input)?'OTDR დანიშნულების Fibers':/გამოუყენ|unused/i.test(input)?'გამოუყენებელი Fibers':'გადასამოწმებელი Fibers',`${scoped.length} ზუსტი ადგილობრივი Fiber ჩანაწერი; unused არ ნიშნავს ხელმისაწვდომს.`,facts):answer('unknown','შესაბამისი Fiber გამოყენება არ მოიძებნა','აქტიურ Fiber-გამოყენების პროექტციაში შესაბამისი ზუსტი ჩანაწერი არ არის.');
    }
    if (query.intent === 'company_usage') {
      const term = normalize(query.company ?? input), orgs = data.organizations.filter(o => [o.name, ...o.aliases].some(value => normalize(value).includes(term) || term.includes(normalize(value)))), orgIds = new Set(orgs.map(o => o.id));
      const annotations = (data.sourceAnnotations ?? []).filter(a => normalize(a.rawText).includes(term) || a.associatedOrganizationIds.some(id => orgIds.has(id)) || orgs.some(o => o.aliases.some(alias => normalize(alias) === normalize(a.rawText))));
      const assignments = (data.networkUseAssignments ?? []).filter(a => orgIds.has(a.organizationId));
      const assigned = assignments.flatMap(a => a.fibers.map(f => ({ a, f }))).map(({a,f}) => { const c = data.cables.find(item => item.id === f.segmentId); return `${c ? `C${c.legacyCableId}` : f.segmentId}/F${f.fiberNumber} · ${sourceName(a.source.file)}`; });
      const lineageUsage=(data.fiberUsageProjection?.localViews??[]).filter(view=>view.organization&&[...orgs].some(org=>normalize(view.organization!).includes(normalize(org.name))||org.aliases.some(alias=>normalize(view.organization!).includes(normalize(alias))))&&(!query.cableToken||exactCableMatches(data,query.cableToken).some(c=>c.id===view.segmentId))).map(view=>{const c=data.cables.find(item=>item.id===view.segmentId);return `C${c?.legacyCableId??view.segmentId}/F${view.fiberNumber} · ${view.usageState}${view.purpose?` · ${view.purpose}`:''} · წყარო ${[...view.sourceLabelShapeIds,...view.sourceLineShapeIds].map(id=>'Shape '+id).join(', ')}`;});
      const sourceBAnnotations = annotations.filter(a => /alpana|tvishi/i.test(a.source.file));
      const boundOccurrences=new Set(assignments.flatMap(a=>a.occurrenceIds));
      const unresolved=sourceBAnnotations.filter(a=>!boundOccurrences.has(a.id.replace(/^27D-/,'')));
      return assignments.length||lineageUsage.length ? answer('exact', 'დადასტურებული ქსელის გამოყენება', `${assignments.length} წყაროთი ინტერპრეტირებული assignment; ${lineageUsage.length} მიმდინარე Fiber leg-ია ზუსტ scope-ში. Ownership/service არ იგულისხმება.`, [...new Set([...lineageUsage,...assigned]), ...(unresolved.length ? [`Source B: ${unresolved.length} unresolved company occurrences`] : [])]) : annotations.length ? answer('annotation', 'წყაროში მხოლოდ წარწერებია ნაპოვნი', `Visio-ში ${query.company ?? input}-ის წარწერები აღმოჩენილია, მაგრამ კონკრეტულ Fiber/Port range-ზე მიბმა დადგენილი არ არის.`, annotations.slice(0, 12).map(a => `${a.rawText} · ${sourceName(a.source.file)}`)) : answer('unknown', 'კომპანიის ჩანაწერი ვერ მოიძებნა', 'აქტიურ ქსელში დადასტურებული Fiber გამოყენება არ მოიძებნა.');
    }
    if (query.intent === 'conflict') {
      const conflicts = (data.sourceConflicts ?? []).filter(c => JSON.stringify(c).includes('C148') || JSON.stringify(c).includes('148'));
      const ranges = (conflicts[0]?.affectedRanges as Array<{ firstFiber:number; lastFiber:number; tubeNumber:number; sourceA:{tubeColor:string}; sourceB:{tubeColor:string} }> | undefined) ?? [];
      const facts = ranges.map(r => `F${r.firstFiber}–F${r.lastFiber} · Tube ${r.tubeNumber}: V1 ${r.sourceA.tubeColor} ↔ Source B ${r.sourceB.tubeColor}`);
      return answer('conflict', 'C148-ის Fiber მარშრუტი ცნობილია; Tube ფერზე წყაროები განსხვავდება', conflicts.length ? 'კონფლიქტი ეხება მხოლოდ Tube-ის ფერს F121–F192 დიაპაზონში. Cable/Fiber identity და topology ამით არ უქმდება.' : 'C148-ის Tube-ის ფერის წყაროთა კონფლიქტი შენარჩუნებულია; topology query დამოუკიდებელია.', facts);
    }
    if (query.intent === 'port' && query.portNumber) {
      const requestedAP=/\bAP\s*(\d+)/i.exec(input)?.[1];
      const owners=requestedAP?new Set([...data.accessPoints.filter(a=>a.id===requestedAP||a.aliases.some(alias=>normalize(alias)===normalize('AP'+requestedAP))).map(a=>a.id),...(data.networkNodes??[]).filter(n=>n.assetType==='ap'&&(n.apEvidence?.number===Number(requestedAP)||n.id===requestedAP)).map(n=>n.id)]):null;
      const bindings = (data.portTopologyBindings ?? []).filter(b => b.portNumber === query.portNumber && (owners?b.ownerType==='ap'&&owners.has(b.ownerId):!query.nodeToken || b.ownerId === query.nodeToken) && (!/lentekhi|ლენტეხ/i.test(input) || /LENTEKHI/i.test(b.ownerId)));
      if (bindings.length) {
        const sourcePort=query.nodeToken?sourceBPort(query.nodeToken,query.portNumber):undefined;
        const facts = bindings.flatMap(b => {
          const trace = traceFiberThroughTransitions(data, b.segmentId, b.fiberNumber);
          return [`${b.ownerType} ${b.ownerId} / Port ${b.portNumber} → C${data.cables.find(c => c.id === b.segmentId)?.legacyCableId ?? b.segmentId}/F${b.fiberNumber}`, ...trace.sides.map(side => `${side.endpoint}: ${side.legs.map(leg => `C${data.cables.find(c => c.id === leg.cableId)?.legacyCableId ?? leg.cableId}/F${leg.fiberNumber}`).join(' → ')} · ${side.stop}`)];
        });
        if(sourcePort) facts.unshift(`Physical occupancy: ${sourcePort.occupancy} · commercialAvailability unknown · administrativeAllocation unknown · condition unknown.`);
        return {...answer(owners&&owners.size>1?'disambiguation':'exact', /lentekhi|ლენტეხ/i.test(input) ? `Lentekhi Port ${query.portNumber}` : `${query.nodeToken?'AP'+query.nodeToken+' / ':''}Port ${query.portNumber}`, owners&&owners.size>1?'AP ნომერი რამდენიმე წყაროში გვხვდება. აირჩიეთ შესაბამისი ობიექტი.':'დადასტურებული Port-to-Fiber binding და მისი transition-ზე დაფუძნებული ცნობილი გზა.', facts, [], bindings.map(b => {if(!data.cableRoutes?.[0])return {view:'fiber' as const,cableId:b.segmentId,fiber:b.fiberNumber};const state=routeWithSelection(data.cableRoutes[0].id,{type:'port',ownerType:b.ownerType,ownerId:b.ownerId,number:b.portNumber});return b.ownerType==='ap'?{...state,target:`port:ap:${b.ownerId}:${b.portNumber}`} :state;})),pathSignature:bindings.length===1 ? resolveCurrentFiberPath(data,bindings[0].segmentId,bindings[0].fiberNumber).signature : undefined};
      }
      return answer('unknown', `Port ${query.portNumber} ვერ დადგინდა`, 'ამ owner/source-სთვის Port-ის ზუსტი binding არ არის დადასტურებული.');
    }
    const normalizedReference = normalize(input);
    const closureReferenceCandidates = [
      ...data.closures.filter(closure => closure.sourceSymbolEvidence).map(closure => ({ id: closure.id, label: `SC${closure.id}`, refs: closure.sourceSymbolEvidence!.externalReferences })),
      ...(data.networkNodes ?? []).filter(node => node.assetType === 'closure' && node.closureEvidence).map(node => ({ id: node.id, label: node.displayName, refs: node.externalReferences ?? [] })),
    ];
    const repeatedReferenceNodes = closureReferenceCandidates.filter(closure => closure.refs.some(reference => normalizedReference.includes(normalize(reference.externalId))));
    if (repeatedReferenceNodes.length > 1 && results.some(result => repeatedReferenceNodes.some(closure => result.id === `node:${closure.id}` || result.id === `closure:${closure.id}`))) {
      return answer('disambiguation', `Source reference repeats across ${repeatedReferenceNodes.length} Closures`, 'The Visio source reuses the same GJS reference on several Closure blocks. The raw source value is preserved; choose the Closure by its own SC number. No objects were merged.', repeatedReferenceNodes.map(closure => `${closure.label} · ${closure.refs[0]?.rawText?.trim() ?? closure.refs[0]?.externalId}`));
    }
    const isAnnotation = results.some(r => /annotation/i.test(r.category));
    if (!results.length) return answer('unknown', 'შესაბამისი ჩანაწერი ვერ მოიძებნა', 'შეამოწმეთ Cable/Fiber ნომერი ან სცადეთ SC, Node, AP, Port, ადგილი ან დოკუმენტის სახელი.');
    if (/C\s*172|172/i.test(input) && results.filter(r => r.category === 'Cable').length > 1) return answer('disambiguation', 'C172 რამდენიმე წყაროში გვხვდება', 'აირჩიეთ endpoint-ებისა და წყაროს მიხედვით. Legacy Cable ნომერი მარტო საკმარისი არ არის.', results.map(r => `${r.title} · ${r.subtitle}`));
    if (isAnnotation) return answer('annotation', 'წყაროს annotation', 'ეს ტექსტი წყაროშია ნაპოვნი, მაგრამ ფიზიკურ topology asset-ს არ წარმოადგენს.', results.map(r => `${r.title} · ${r.subtitle}`));
    return answer('exact', results.length === 1 ? results[0].title : `${results.length} ჩანაწერი მოიძებნა`, 'შედეგი აქტიური ქსელის ინდექსიდან მოიძებნა.', results.map(r => `${r.category}: ${r.title} · ${r.subtitle}`));
  };
  return { search, run, indexSize: searchIndex.length };
}

export function queryFiberAtlas(data: Inventory, input: string) { return createEngineerQueryService(data).run(input); }


