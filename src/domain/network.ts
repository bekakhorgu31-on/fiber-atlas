import type { Allocation, AssetRef, Cable, PhysicalColor, Tube, Condition, Connection, ConnectionRow, Connectivity, Fiber, Inventory, KnownRef, OpticalEnd, Route, SearchResult, TraceResult, TraceStep, TraceStop, Verification } from './types';
import { accessPointOperatorSummary, closureOperatorSummary, segmentOperatorSummary } from './operatorTopology';
import { validateCableRoutes } from './cableRoutes';
import { validateFoundations } from './foundations';
import { TSAGERI_ODF_ID, validateIteration10 } from './aggregationTopology';
import { validateCableContinuations } from './cableContinuity';
import { validateFiberLineages } from './fiberLineage';
import { currentAssetLabel } from './currentFiberPath';

export const verificationLabels: Record<Verification, string> = { imported: 'იმპორტირებული', documentation_reviewed: 'დოკუმენტაციით გადამოწმებული', field_verified: 'ადგილზე გადამოწმებული', conflicting: 'კონფლიქტური', needs_verification: 'საჭიროებს გადამოწმებას' };
export const allocationLabels: Record<Allocation, string> = { unallocated: 'მიუნიჭებელი', reserved: 'რეზერვირებული', assigned: 'მინიჭებული', unknown: 'უცნობი' };
export const conditionLabels: Record<Condition, string> = { serviceable: 'გამართული', damaged: 'დაზიანებული', blocked: 'ბლოკირებული', suspect: 'საეჭვო', unknown: 'უცნობი' };
export const connectivityLabels: Record<Connectivity, string> = { spliced: 'გადაბმული', continuity: 'უწყვეტი ჟილა', terminated: 'ტერმინირებული', unconnected: 'დაუკავშირებელი', parked: 'განზრახ დაუკავშირებელი', passive_branch: 'პასიური კომპონენტის განშტოება', unknown: 'ტიპი უცნობია' };
export const fiberLabel = (n: number) => `F${String(n).padStart(2, '0')}`;
export const sameAsset = (a: AssetRef, b: AssetRef) => a.kind === b.kind && a.id === b.id;
export const typedAssetLabel = (r: AssetRef) => r.kind === 'boundary' ? `BOUNDARY · ${r.id.replace(/^BOUNDARY-/, '')}` : r.kind === 'network_node' ? `Node ${r.id}` : r.kind === 'aggregation' && !/^\d+$/.test(r.id) ? r.id : `${({ closure: 'SC', ap: 'AP', odf: 'ODF', aggregation: 'AGG', site: 'SITE' } as const)[r.kind]}${r.id}`;
export const assetLabel = (r: AssetRef) => r.kind === 'closure' ? `ქურო ${r.id}` : r.kind === 'aggregation' ? `აგრეგაცია ${r.id}` : typedAssetLabel(r);
const segmentEndpointLabel = (ref: AssetRef) => ref.kind === 'boundary'
  ? `${ref.id.replace(/^BOUNDARY-/, '')} boundary`
  : ref.kind === 'aggregation' && ref.id === 'AGG-LENTEKHI' ? 'ლენტეხის აგრეგაცია'
  : typedAssetLabel(ref);
export const getSegmentDisplayName = (c: Cable, data?: Inventory) => `${data ? currentAssetLabel(data,c.endpointA) : segmentEndpointLabel(c.endpointA)} ↔ ${data ? currentAssetLabel(data,c.endpointB) : segmentEndpointLabel(c.endpointB)} · ${c.fiberCount}F`;
export const segmentDisplayName = getSegmentDisplayName;
export const segmentLegacyLabel = (c: Cable) => `ძველი ID: ${c.legacyCableId} · კაბელის მონაკვეთი C${c.legacyCableId} · ${c.legacyLabels.join(' · ')}`;
/** Compatibility aliases for existing code and external consumers. */
export const cableDisplayName = segmentDisplayName;
export const cableLegacyLabel = segmentLegacyLabel;
export const manufacturerLabel = (c: Cable) => c.manufacturer ?? 'უცნობია';
export const colorLabel = (c: PhysicalColor | null | undefined) => !c || c.basis === 'unknown'
  ? 'უცნობია'
  : `${c.nameKa ?? 'უცნობია'}${c.nameEn ? ` · ${c.nameEn}${c.key ? ` [${c.key}]` : ''}` : ''}${c.basis === 'proposed_standard' ? ' · სავარაუდო — დაუდასტურებელი' : ''}`;
export const tubeLabel = (t: Tube | undefined) => !t ? 'ტუბი უცნობია' : t.basis === 'provisional' ? `სავარაუდო ჯგუფი ${t.proposedNumber ?? '?'}` : `ტუბი ${t.number ?? '?'}`;
export const fiberTube = (d: Inventory, f: Fiber) => d.tubes.find(t => t.id === f.tubeId && t.cableId === f.cableId);
export const orderedRouteNodes = (c: Cable) => [...c.routeNodes].sort((a, b) => a.sequence - b.sequence);
export const routeSpans = (c: Cable) => { const nodes = orderedRouteNodes(c); return nodes.slice(1).map((to, i) => ({ from: nodes[i], to })); };
export const routeSummary = (c: Cable) => ({ knownNodes: c.routeNodes.length, intermediateCount: c.routeCompleteness === 'endpoints_only' ? null : Math.max(0, c.routeNodes.length - 2), describedSpans: Math.max(0, c.routeNodes.length - 1), complete: c.routeCompleteness === 'ordered_documented' });
export const assetRoute = (r: AssetRef): Route | null => r.kind === 'closure' || r.kind === 'ap' || r.kind === 'aggregation' ? { view: r.kind, id: r.id } : null;
export const assetExists = (d: Inventory, r: AssetRef) => (r.kind === 'closure' ? d.closures : r.kind === 'ap' ? d.accessPoints : r.kind === 'aggregation' ? d.aggregations : r.kind === 'odf' ? d.odfs ?? [] : r.kind === 'site' ? d.sites ?? [] : r.kind === 'boundary' ? d.externalBoundaries ?? [] : d.networkNodes ?? []).some(a => a.id === r.id);
export function findCable(d: Inventory, token: string): Cable | undefined {
  const q = token.toLocaleLowerCase().trim();
  const exact = d.cables.find(c => c.id.toLocaleLowerCase() === q);
  if (exact) return exact;
  const matches = d.cables.filter(c => [c.legacyCableId, ...c.legacyLabels, `C${c.legacyCableId}`].some(a => a.toLocaleLowerCase() === q));
  return matches.length === 1 ? matches[0] : undefined;
}
export const findFiber = (d: Inventory, cableId: string, number: number) => { const id = findCable(d, cableId)?.id; return d.fibers.find(f => f.cableId === id && f.number === number); };
export const cableFibers = (d: Inventory, id: string) => { const canonical = findCable(d, id)?.id; return d.fibers.filter(f => f.cableId === canonical).sort((a, b) => a.number - b.number); };
export const attachedCables = (d: Inventory, r: AssetRef) => d.cables.filter(c => c.routeNodes.some(n => sameAsset(n.asset, r)));
const matchesFiber = (e: OpticalEnd, c: string, n: number) => e.kind === 'fiber' && e.cableId === c && e.fiber === n;
export const fiberConnections = (d: Inventory, c: string, n: number) => { const canonical = findCable(d, c)?.id ?? c; return d.connections.filter(x => matchesFiber(x.a, canonical, n) || matchesFiber(x.z, canonical, n)); };
export const endLabel = (r: OpticalEnd, d?: Inventory) => r.kind === 'fiber' ? `${d && findCable(d, r.cableId) ? cableDisplayName(findCable(d, r.cableId)!, d) : r.cableId} / ${fiberLabel(r.fiber)}` : r.kind === 'port' ? `${typedAssetLabel(r.at)} / პორტი ${r.port}` : `${typedAssetLabel(r.asset)} / პორტი უცნობია`;
export const endLegacyLabel = (r: OpticalEnd, d: Inventory) => r.kind === 'fiber' ? `C${findCable(d, r.cableId)?.legacyCableId ?? r.cableId} / ${fiberLabel(r.fiber)}` : endLabel(r, d);
export function otherEnd(c: Connection, cableId: string, n: number, d?: Inventory): OpticalEnd {
  const canonical = d ? findCable(d, cableId)?.id ?? cableId : cableId;
  if (matchesFiber(c.a, canonical, n)) return c.z;
  if (matchesFiber(c.z, canonical, n)) return c.a;
  throw new Error('ჟილა ამ კავშირს არ ეკუთვნის.');
}
export function rowsForClosure(d: Inventory, closureId: string, token: string): ConnectionRow[] {
  const location: AssetRef = { kind: 'closure', id: closureId }, cableId = findCable(d, token)?.id;
  if (!cableId || !attachedCables(d, location).some(c => c.id === cableId)) return [];
  return cableFibers(d, cableId).flatMap(record => {
    const cs = fiberConnections(d, cableId, record.number).filter(c => sameAsset(c.location, location));
    return (cs.length ? cs : [null]).map(connection => ({ key: `${record.id}:${connection?.id ?? 'unknown'}`, cableId, fiber: record.number, other: connection ? otherEnd(connection, cableId, record.number) : null, connection, record, location }));
  });
}
function referenceLabel(ref: KnownRef | undefined, lookup: (id: string) => string | undefined) {
  if (!ref || ref.state === 'unknown') return 'უცნობი';
  if (ref.state === 'none') return 'არ არის — დადასტურებული';
  return (ref.id && lookup(ref.id)) || 'მითითებული ჩანაწერი ვერ მოიძებნა';
}
export function commercialRoles(d: Inventory, cableId: string, fiberNumber?: number) {
  const cable = findCable(d, cableId), fiber = fiberNumber ? findFiber(d, cableId, fiberNumber) : undefined;
  const org = (id: string) => d.organizations.find(o => o.id === id)?.name;
  const right = fiber?.rights.state === 'known' ? d.rights.find(r => r.id === fiber.rights.id && r.fiberId === fiber.id) : undefined;
  const serviceIds = new Set(d.assignments.filter(a => a.fiberId === fiber?.id).map(a => a.serviceId));
  if (fiber?.service.state === 'known' && fiber.service.id) serviceIds.add(fiber.service.id);
  const services = [...serviceIds].map(id => d.services.find(s => s.id === id)).filter(s => s !== undefined);
  const noService = fiber?.service.state === 'none' && serviceIds.size === 0;
  const serviceValue = services.length ? services.map(s => s.name).join(' · ') : noService ? 'არ არის — დადასტურებული' : 'უცნობი';
  const serviceRole = (key: 'provider' | 'customer') => services.length ? [...new Set(services.map(s => referenceLabel(s[key], org)))].join(' · ') : noService ? 'არ არის — დადასტურებული' : 'უცნობი';
  return [
    { label: 'კაბელის მფლობელი', value: referenceLabel(cable?.owner, org), note: 'ფიზიკური ინფრასტრუქტურის მფლობელი' },
    { label: 'ჟილის უფლების მფლობელი', value: fiber ? referenceLabel(fiber.rights, () => right && org(right.holderId)) : 'აირჩიეთ ჟილა', note: 'იჯარა, IRU ან სარგებლობის სხვა უფლება' },
    { label: 'სერვისის მიმწოდებელი', value: fiber ? serviceRole('provider') : 'აირჩიეთ ჟილა', note: 'ვინ უზრუნველყოფს სერვისს' },
    { label: 'მომხმარებელი / მიმღები', value: fiber ? serviceRole('customer') : 'აირჩიეთ ჟილა', note: 'ვინ იღებს სერვისს' },
    { label: 'სერვისი', value: fiber ? serviceValue : 'აირჩიეთ ჟილა', note: 'ცალკე ჩანაწერი და მინიჭება' },
  ];
}
export function availabilitySummary(d: Inventory, fibers: Fiber[]) {
  const available = (f: Fiber) => f.allocation === 'unallocated' && f.condition === 'serviceable' && ['documentation_reviewed', 'field_verified'].includes(f.verification) && f.rights.state === 'none' && f.service.state === 'none' && !d.assignments.some(a => a.fiberId === f.id) && !d.rights.some(r => r.fiberId === f.id);
  return { assigned: fibers.filter(f => f.allocation === 'assigned').length, reserved: fibers.filter(f => f.allocation === 'reserved').length, available: fibers.filter(available).length, damaged: fibers.filter(f => f.condition === 'damaged' || f.condition === 'blocked').length, unknown: fibers.filter(f => !available(f) && !['assigned', 'reserved'].includes(f.allocation)).length };
}

export function traceFiber(d: Inventory, cableId: string, n: number, includeCandidates: boolean): TraceResult {
  const cable = findCable(d, cableId), fiber = findFiber(d, cableId, n);
  if (!cable || !fiber) return { steps: [], stops: [{ side: 'a', at: `C${cableId}/${fiberLabel(n)}`, code: 'missing', message: 'კაბელის მონაკვეთი ან ჟილა პილოტში ვერ მოიძებნა.' }], includesCandidates: false, complete: false };
  const cableStep = (id: string, number: number, candidate: boolean): TraceStep => {
    const c = findCable(d, id)!;
    return { id: `cable-${id}-${number}`, kind: 'cable', title: `${cableDisplayName(c, d)} / ${fiberLabel(number)}`, detail: `${typedAssetLabel(c.endpointA)} ↔ ${typedAssetLabel(c.endpointB)} · ფიზიკური მდგომარეობა ${conditionLabels[findFiber(d, id, number)!.condition]}`, verification: findFiber(d, id, number)!.verification, candidate, cableId: id, fiber: number, source: c.source, route: { view: 'fiber', cableId: id, fiber: number } };
  };
  cableId = cable.id;
  const visitedCables = new Set([`${cableId}/${n}`]);
  const stops: TraceStop[] = [];
  const walk = (side: 'a' | 'b'): TraceStep[] => {
    const steps: TraceStep[] = [];
    let currentCable = cableId, currentFiber = n, location = side === 'a' ? cable.endpointA : cable.endpointB;
    const stop = (code: TraceStop['code'], message: string) => stops.push({ side, at: assetLabel(location), code, message });
    if (cable.routeNodes.length > 2) {
      location = orderedRouteNodes(cable)[side === 'a' ? 1 : cable.routeNodes.length - 2].asset;
      stop('route_unknown', 'შუალედური წვდომა აღწერილია, მაგრამ ამ ჟილის უწყვეტობა ცალკე არ არის დადასტურებული. მონაკვეთის გზა ოპტიკურ კავშირს არ ქმნის.');
      return steps;
    }
    for (let count = 0; count < 100; count++) {
      const cs = fiberConnections(d, currentCable, currentFiber).filter(c => sameAsset(c.location, location));
      if (cs.some(c => c.verification === 'conflicting' || c.review?.state === 'conflicting')) { stop('conflicting', 'ამ ბოლოზე ურთიერთსაწინააღმდეგო მტკიცებულებაა; გაგრძელება გადამოწმებამდე შეჩერებულია.'); return steps; }
      const accepted = (connection: Connection) => connection.operationalStatus
        ? connection.operationalStatus === 'authoritative'
        : connection.review
          ? connection.review.state === 'accepted' && ['documentation_reviewed', 'field_verified'].includes(connection.review.opticalConnectivity)
          : connection.approved && ['documentation_reviewed', 'field_verified'].includes(connection.verification);
      const eligible = cs.filter(c => accepted(c) || (includeCandidates && (c.review?.state === 'candidate' || !c.approved)));
      if (eligible.length === 0) {
        if (cs.length) stop('unapproved', 'შემდეგი კავშირი დადასტურებული არ არის. სავარაუდო გზის სანახავად ჩართეთ კანდიდატები.');
        else if (location.kind === 'closure' && d.closures.find(c => c.id === location.id)?.contextOnly) stop('boundary', 'პილოტის საზღვარი: ამ წერტილის მიღმა კავშირები არ არის შემოტანილი.');
        else stop('missing', 'შემდეგი კავშირი ჩანაწერებში არ არის. ეს თავისუფალ ან გათიშულ ჟილას არ ნიშნავს.');
        return steps;
      }
      if (eligible.length !== 1) { stop('ambiguous', 'ერთ ბოლოზე რამდენიმე შესაძლო კავშირია; მარშრუტი არჩევანს ვერ აკეთებს.'); return steps; }
      const connection = eligible[0], end = otherEnd(connection, currentCable, currentFiber);
      if (connection.operation === 'parked' || connection.operation === 'unconnected') { stop('missing', 'ჟილა განზრახ დაუკავშირებლადაა აღწერილი; ოპტიკური გაგრძელება არ გამოიყენება.'); return steps; }
      if (connection.operation === 'passive_branch') { stop('component', 'პასიური კომპონენტის პორტების ზუსტი გზა ჯერ არ არის მოდელირებული; განშტოება ავტომატურად არ ირჩევა.'); return steps; }
      if (!sameAsset(end.at, location)) { stop('missing', 'კავშირის ბოლო და მდებარეობა ერთმანეთს არ შეესაბამება.'); return steps; }
      const isCandidate = !accepted(connection);
      steps.push({ id: connection.id, kind: 'connection', title: assetLabel(location), detail: `${endLabel(connection.a, d)} ↔ ${endLabel(connection.z, d)}${connection.operation === 'unknown' && !isCandidate ? ' · ოპტიკური კავშირი მიღებულია; ფიზიკური ოპერაცია უცნობია' : ''}`, operation: connection.operation, verification: connection.verification, candidate: isCandidate, relationshipState: connection.review?.state ?? (connection.approved ? 'accepted' : 'candidate'), source: connection.source, route: assetRoute(location) ?? undefined });
      if (end.kind === 'port') {
        steps.push({ id: `port-${end.assetId}-${end.port}`, kind: 'port', title: endLabel(end, d), operation: connection.operation, detail: isCandidate ? 'სავარაუდო ტერმინაცია; ადგილზე შესამოწმებელია' : 'პორტის ბოლო მიღებულ ჩანაწერში', verification: connection.verification, candidate: isCandidate, relationshipState: isCandidate ? 'candidate' : 'accepted', source: connection.source, route: { view: 'ap', id: end.assetId } });
        stop('terminal', isCandidate ? 'სავარაუდო გზა ამ პორტზე მთავრდება; სერვისი უცნობია.' : 'ჩანაწერი პორტზე მთავრდება.');
        return steps;
      }
      if (end.kind === 'asset') {
        steps.push({ id: `asset-${end.asset.kind}-${end.asset.id}`, kind: 'asset', title: typedAssetLabel(end.asset), detail: 'დანიშნულების ობიექტი მიღებულია; ზუსტი პორტი ჯერ არ არის მიღებული.', verification: connection.review?.destinationAsset ?? connection.verification, candidate: false, relationshipState: 'accepted', source: connection.source, route: assetRoute(end.asset) ?? undefined });
        const candidatePort = connection.review?.candidatePort;
        if (includeCandidates && candidatePort != null) {
          steps.push({ id: `port-${end.asset.id}-${candidatePort}-candidate`, kind: 'port', title: `${typedAssetLabel(end.asset)} / პორტი ${candidatePort}`, detail: 'პორტის ნომერი წყაროში გასწორებული კანდიდატია; AP/ODF კუთვნილება ჯერ არ არის მიღებული.', verification: connection.review?.port ?? 'needs_verification', candidate: true, relationshipState: 'candidate', source: connection.source, route: assetRoute(end.asset) ?? undefined });
          stop('terminal', `სავარაუდო გზა Port ${candidatePort}-ზე მთავრდება; პორტი და AP/ODF კუთვნილება გადასამოწმებელია.`);
        } else {
          stop('port_unknown', 'ოპტიკური გზა მიღებულია AP51-მდე; ზუსტი პორტი და AP/ODF კუთვნილება ჯერ არ არის მიღებული.');
        }
        return steps;
      }
      const next = findCable(d, end.cableId);
      if (!next || !findFiber(d, end.cableId, end.fiber) || (!sameAsset(next.endpointA, location) && !sameAsset(next.endpointB, location))) { stop('missing', 'კავშირის მეორე მონაკვეთი ან ჟილა ვერ მოიძებნა ამ წერტილში.'); return steps; }
      const key = `${end.cableId}/${end.fiber}`;
      if (visitedCables.has(key)) { stop('cycle', 'აღმოჩენილია განმეორებითი გზა. ავტომატური გაგრძელება შეჩერებულია.'); return steps; }
      if (next.routeNodes.length > 2) { stop('route_unknown', 'შემდეგი მონაკვეთი შუალედურ წვდომას შეიცავს; ჟილის უწყვეტობა მონაკვეთების მიხედვით დასადგენია.'); return steps; }
      visitedCables.add(key);
      steps.push(cableStep(end.cableId, end.fiber, isCandidate));
      currentCable = end.cableId; currentFiber = end.fiber;
      location = sameAsset(next.endpointA, location) ? next.endpointB : next.endpointA;
    }
    stop('limit', 'მიღწეულია მარშრუტის დამცავი ლიმიტი.');
    return steps;
  };
  const left = walk('a'), right = walk('b');
  const steps = [...left.reverse(), cableStep(cableId, n, false), ...right];
  return { steps, stops, includesCandidates: steps.some(s => s.candidate), complete: stops.length === 2 && stops.every(s => s.code === 'terminal') };
}

const norm = (s: string) => s.toLocaleLowerCase().replace(/[↔→·/_,–—-]+/g, ' ').replace(/\s+/g, ' ').trim();
export function searchInventory(d: Inventory, query: string): SearchResult[] {
  const raw = query.trim(), q = norm(raw);
  if (!q) return [];
  const exactFiber = raw.match(/^(CAB-[a-z0-9-]+|(?:c(?:able)?\s*)?\d+)\s*[/ :]\s*(?:f(?:iber)?\s*)?(\d+)$/i);
  if (exactFiber) {
    const token = exactFiber[1].replace(/^cable\s*/i, ''), cable = findCable(d, token), f = +exactFiber[2];
    if (!cable || !findFiber(d, cable.id, f)) return [];
    const topology = segmentOperatorSummary(d, cable);
    return [{ id: `fiber-${cable.id}-${f}`, title: `${cableDisplayName(cable, d)} / ${fiberLabel(f)}`, subtitle: `${topology.source} → ${topology.finalRouteEndpoint}`, category: 'ჟილა', route: { view: 'fiber', cableId: cable.id, fiber: f } }];
  }
  const out: SearchResult[] = [], terms = q.split(' ');
  const hit = (...values: string[]) => { const text = norm(values.join(' ')); return terms.every(t => text.includes(t)); };
  const orgWords = (ref: KnownRef) => { const o = ref.state === 'known' ? d.organizations.find(o => o.id === ref.id) : undefined; return o ? [o.name, ...o.aliases, o.id].join(' ') : ''; };
  for (const route of d.cableRoutes ?? []) {
    const segmentWords = [
      ...route.legs.flatMap(leg => {
        const legacyId = leg.segmentId ? findCable(d, leg.segmentId)?.legacyCableId : undefined;
        return leg.segmentId ? [leg.segmentId, legacyId ?? '', legacyId ? `C${legacyId}` : ''] : [];
      }),
      ...route.branches.flatMap(branch => branch.segmentIds.flatMap(id => {
        const legacyId = findCable(d, id)?.legacyCableId;
        return [id, legacyId ?? '', legacyId ? `C${legacyId}` : ''];
      })),
    ];
    const nodeWords = route.nodes.flatMap(node => node.asset ? [node.label, typedAssetLabel(node.asset), assetLabel(node.asset)] : [node.label]);
    const branchWords = route.branches.flatMap(branch => branch.destination
      ? [typedAssetLabel(branch.destination), assetLabel(branch.destination), branch.sourceLabel ?? '']
      : [branch.targetDirectionText ?? '', branch.sourceLabel ?? '']);
    if (hit(route.id, route.displayName, 'Cable Route', 'კაბელის მარშრუტი', route.origin.label, route.destination.label, ...nodeWords, ...segmentWords, ...branchWords)) {
      const segmentCount = route.legs.filter(leg => leg.segmentId).length;
      out.push({ id: `route-${route.id}`, title: route.displayName, subtitle: `${segmentCount} მონაკვეთი · ${route.branches.length} განშტოება · ${route.documentation === 'incomplete' ? 'დოკუმენტაცია არასრულია' : 'დოკუმენტაცია სრულია'}`, category: 'კაბელის მარშრუტი', route: { view: 'route', id: route.id } });
    }
  }
  for (const c of d.cables) {
    const fibers = cableFibers(d, c.id), fiberIds = new Set(fibers.map(f => f.id));
    const rights = d.rights.filter(r => fiberIds.has(r.fiberId)).map(r => orgWords({ state: 'known', id: r.holderId }));
    const serviceIds = new Set(d.assignments.filter(a => fiberIds.has(a.fiberId)).map(a => a.serviceId));
    fibers.forEach(f => { if (f.service.state === 'known' && f.service.id) serviceIds.add(f.service.id); });
    const serviceWords = d.services.filter(s => serviceIds.has(s.id)).flatMap(s => [s.id, s.name, orgWords(s.provider), orgWords(s.customer)]);
    const routeWords = c.routeNodes.flatMap(n => [typedAssetLabel(n.asset), assetLabel(n.asset), n.asset.kind === 'ap' ? d.accessPoints.find(a => a.id === n.asset.id)?.name ?? '' : '']);
    if (hit(c.id, c.legacyCableId, ...c.legacyLabels, `Cable ${c.legacyCableId}`, `Cable Segment ${c.legacyCableId}`, `C${c.legacyCableId}`, `კაბელი ${c.legacyCableId}`, `კაბელის მონაკვეთი ${c.legacyCableId}`, cableDisplayName(c, d), c.manufacturer ?? '', c.model ?? '', c.productCode ?? '', orgWords(c.owner), ...rights, ...serviceWords, ...routeWords)) {
      const topology = segmentOperatorSummary(d, c);
      out.push({ id: `c-${c.id}`, title: cableDisplayName(c, d), subtitle: `Legacy C${c.legacyCableId} · ${topology.source} → ${topology.finalRouteEndpoint} · PhysicalCable end: ${topology.physicalCableEndpoint}`, category: 'კაბელის მონაკვეთი', route: { view: 'cable', id: c.id } });
    }
  }
  d.closures.forEach(c => { if (hit(c.id, `Closure ${c.id}`, `SC${c.id}`, `ქურო ${c.id}`)) { const topology = closureOperatorSummary(d, c.id); out.push({ id: `sc-${c.id}`, title: `ქურო ${c.id} · SC${c.id}`, subtitle: `${topology.mainContinuation ? `Main → ${topology.mainContinuation}` : 'Main path ends here'}${topology.branches.length ? ` · Branch → ${topology.branches.map(item => item.label).join(' / ')}` : ''}`, category: 'ქურო', route: { view: 'closure', id: c.id } }); } });
  d.accessPoints.forEach(a => { if (hit(`AP${a.id}`, `AP ${a.id}`, `ODF ${a.id}`, ...a.aliases, a.name)) { const topology = accessPointOperatorSummary(d, a.id); out.push({ id: `ap-${a.id}`, title: `AP${a.id} · ${a.name}`, subtitle: `Fed from ${topology.source} · via ${topology.upstreamClosure} · ${topology.role === 'interconnect_backfeed' ? 'backfeed toward Ambrolauri' : 'AP endpoint'}`, category: 'AP', route: { view: 'ap', id: a.id } }); } });
  d.aggregations.forEach(a => { if (hit(a.name, `AGG${a.id}`, `აგრეგაცია ${a.id}`, `aggregation ${a.id}`, a.id)) out.push({ id: `agg-${a.id}`, title: a.id === 'AGG-LENTEKHI' ? a.name : `AGG${a.id} · ${a.name}`, subtitle: a.id === '5' ? '192 ports · Ambrolauri / SC205 / Chkhuteli / Lentekhi' : 'Known route endpoint · numeric legacy ID conflict retained', category: 'აგრეგაცია', route: { view: 'aggregation', id: a.id } }); });
  (d.externalBoundaries ?? []).forEach(boundary => { if (hit(boundary.id, boundary.directionLabel, boundary.likelyContinuationName ?? '')) out.push({ id: `boundary-${boundary.id}`, title: boundary.directionLabel, subtitle: 'External Documentation Boundary · continuation unresolved', category: 'საზღვარი', route: { view: 'review', query: boundary.id } }); });
  (d.assertions ?? []).filter(item => item.claimType === 'raw_source_annotation').forEach(item => { const value = String(item.value ?? ''); if (hit(value, item.subjectId)) out.push({ id: `assertion-${item.id}`, title: value, subtitle: `${item.operationalStatus} · source assertion`, category: 'წყაროს ჩანაწერი', route: { view: 'import' } }); });
  d.organizations.forEach(o => { if (hit(o.name, ...o.aliases)) out.push({ id: `org-${o.id}`, title: o.name, subtitle: o.annotationOnly ? 'წყაროს წარწერა · აქტივზე მფლობელობა დაუდასტურებელია' : 'ორგანიზაცია · იხილეთ ცალკე დადასტურებული როლები', category: 'ორგანიზაცია', route: { view: 'review', query: o.name } }); });
  d.services.forEach(s => { if (hit(s.id, s.name)) { const a = d.assignments.find(a => a.serviceId === s.id), f = d.fibers.find(f => f.id === a?.fiberId || (f.service.state === 'known' && f.service.id === s.id)); out.push({ id: `srv-${s.id}`, title: s.name, subtitle: s.id, category: 'სერვისი', route: f ? { view: 'fiber', cableId: f.cableId, fiber: f.number } : { view: 'review', query: s.id } }); } });
  if (hit(d.area.name, 'Tsageri Lentekhi')) out.push({ id: 'area', title: d.area.name, subtitle: 'საპილოტე ტერიტორია', category: 'ტერიტორია', route: { view: 'dashboard' } });
  const directAsset = (r: SearchResult) => {
    const route = r.route;
    if (!('id' in route)) return 0;
    const prefixes = route.view === 'closure' ? ['SC', 'Closure ', 'ქურო '] : route.view === 'ap' ? ['AP', 'AP ', 'ODF', 'ODF '] : route.view === 'aggregation' ? ['AGG', 'Aggregation ', 'აგრეგაცია '] : [];
    return prefixes.some(prefix => norm(`${prefix}${route.id}`) === q) ? 1 : 0;
  };
  return out.sort((a, b) => directAsset(b) - directAsset(a)).slice(0, 30);
}

export function validateInventory(d: Inventory): string[] {
  const errors: string[] = [], occupancy = new Map<string, string>();
  errors.push(...validateCableRoutes(d));
  errors.push(...validateFoundations(d));
  errors.push(...validateCableContinuations(d));
  errors.push(...validateFiberLineages(d));
  if (d.odfs?.some(item => item.id === TSAGERI_ODF_ID)) errors.push(...validateIteration10(d));
  const endKey = (e: OpticalEnd) => `${e.at.kind}:${e.at.id}:${e.kind === 'fiber' ? `${e.cableId}/${e.fiber}` : e.kind === 'port' ? `port/${e.assetId}/${e.port}` : `asset/${e.asset.kind}/${e.asset.id}`}`;
  const ids = d.cables.map(c => c.id);
  if (new Set(ids).size !== ids.length) errors.push('Duplicate cable identity');
  for (const c of d.cables) {
    const nodes = orderedRouteNodes(c);
    if (nodes.length < 2 || !sameAsset(nodes[0].asset, c.endpointA) || !sameAsset(nodes[nodes.length - 1].asset, c.endpointB) || new Set(nodes.map(n => n.sequence)).size !== nodes.length || nodes.some(n => !Number.isInteger(n.sequence) || n.sequence < 0)) errors.push(`Invalid route ordering: ${c.id}`);
    if (nodes.some(n => !assetExists(d, n.asset))) errors.push(`Unknown route asset: ${c.id}`);
    const fs = cableFibers(d, c.id);
    if (fs.length !== c.fiberCount || new Set(fs.map(f => f.number)).size !== fs.length || fs.some(f => !Number.isInteger(f.number) || f.number < 1 || f.number > c.fiberCount)) errors.push(`Invalid fiber inventory: ${c.id}`);
  }
  for (const f of d.fibers) {
    const tube = fiberTube(d, f);
    if (!findCable(d, f.cableId) || (f.tubeId && !tube)) errors.push(`Invalid fiber tube: ${f.id}`);
    if (f.positionInTube != null && (!Number.isInteger(f.positionInTube) || f.positionInTube < 1 || f.positionInTube > 12 || tube?.basis !== 'documented')) errors.push(`Invalid tube position: ${f.id}`);
    if (f.physicalColor.basis === 'unknown' && (f.physicalColor.hex !== null || f.physicalColor.nameKa !== null)) errors.push(`Unknown fiber color has asserted value: ${f.id}`);
  }
  for (const t of d.tubes) {
    if (!findCable(d, t.cableId) || (t.basis === 'provisional' && t.number !== null)) errors.push(`Invalid tube identity: ${t.id}`);
    if (t.physicalColor.basis === 'unknown' && t.physicalColor.hex !== null) errors.push(`Unknown tube color has asserted value: ${t.id}`);
    if (t.basis === 'documented') {
      const positions = d.fibers.filter(f => f.cableId === t.cableId && f.tubeId === t.id).map(f => f.positionInTube);
      if (positions.length !== 12 || new Set(positions).size !== 12 || positions.some(position => position == null || position < 1 || position > 12)) errors.push(`Invalid documented tube occupancy: ${t.id}`);
    }
  }
  for (const c of d.connections) {
    if (c.operation === 'passive_branch' && !d.passiveComponents.some(p => p.id === c.passiveComponentId && sameAsset(p.location, c.location))) errors.push(`Missing passive component: ${c.id}`);
    if (c.operation === 'parked' || c.operation === 'unconnected') errors.push(`Non-connection modeled as paired edge: ${c.id}`);
    if (endKey(c.a) === endKey(c.z)) errors.push(`Self connection: ${c.id}`);
    if (c.approved && !['documentation_reviewed', 'field_verified'].includes(c.verification)) errors.push(`Approval without verification: ${c.id}`);
    for (const e of [c.a, c.z]) {
      if (!sameAsset(e.at, c.location)) errors.push(`Location mismatch: ${c.id}`);
      if (e.kind === 'fiber') {
        const cable = findCable(d, e.cableId);
        if (!cable || !findFiber(d, e.cableId, e.fiber) || !(cable.routeNodes.some(n => sameAsset(n.asset, e.at)))) errors.push(`Invalid cable end: ${c.id}`);
      } else if (e.kind === 'port') {
        const ap = d.accessPoints.find(a => a.id === e.assetId);
        if (!ap || e.at.kind !== 'ap' || e.at.id !== e.assetId || !Number.isInteger(e.port) || e.port < 1 || e.port > ap.portCount) errors.push(`Invalid port: ${c.id}`);
      } else if (!assetExists(d, e.asset) || !sameAsset(e.asset, e.at)) {
        errors.push(`Invalid asset end: ${c.id}`);
      }
      const key = endKey(e);
      if (occupancy.has(key)) errors.push(`Conflicting endpoint: ${key}`);
      occupancy.set(key, c.id);
    }
  }
  return errors;
}
