import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const sha = value => createHash('sha256').update(value).digest('hex');
const root = 'migration/iteration27';
const source = 'imports/inbox/Tsageri-Alpana-Tvishi.vsdx';
const runs = ['a','b'].map(run => JSON.parse(gunzipSync(readFileSync(`${root}/run-${run}/tsageri-alpana-tvishi.raw.json.gz`))));
const sourceSha256 = sha(readFileSync(source));
if (runs.some(run => run.source.sha256 !== sourceSha256)) throw new Error('Source B raw cache does not match the active Visio source');
if (new Set(runs.map(run => sha(JSON.stringify(run.pages[0].shapes)))).size !== 1) throw new Error('Independent source extractions disagree');
const raw = runs[0], page = raw.pages[0], shapes = page.shapes, byId = new Map(shapes.map(shape => [String(shape.id), shape]));
const decoded = JSON.parse(readFileSync(`${root}/source-interpretation.json`, 'utf8'));
const sourceTransitions = new Map((decoded.fiberTopology?.transitionEdges ?? []).map(edge => [String(edge.connectorShapeId), edge]));
const markerMap = new Map();
const children = id => shapes.filter(shape => String(shape.parent_id) === String(id));
const pin = shape => shape.geometry?.global_pin;
const median = values => values.slice().sort((a,b) => a-b)[Math.floor(values.length / 2)];
const cellMap = shape => Object.fromEntries((shape.cells ?? []).map(cell => [cell.N, cell.V]));
const propertyMap = shape => Object.fromEntries((shape.sections?.find(section => section.attributes?.N === 'Property')?.rows ?? []).map(row => [row.attributes?.N, row.cells?.find(cell => cell.N === 'Value')?.V ?? null]));
const banks = [];
for (const [legacyCable, construction] of Object.entries(decoded.physicalConstructionCandidates)) for (const bank of construction.banks ?? []) {
  const bankShape = byId.get(String(bank.groupShapeId)); if (!bankShape) continue;
  const members = children(bankShape.id);
  const circles = members.filter(shape => shape.sections?.some(section => section.attributes?.N === 'Geometry' && section.rows?.some(row => row.attributes?.T === 'EllipticalArcTo')) && shape.geometry?.width > .045);
  if (!circles.length) continue;
  const centerY = median(circles.map(shape => pin(shape).y));
  const xs = circles.map(shape => pin(shape).x).sort((a,b) => a-b);
  const pitch = median(xs.slice(1).map((x,i) => x - xs[i]));
  const labels = members.filter(shape => /^\d+$/.test(shape.text?.trim()) && Math.abs(pin(shape).y - centerY) > .035 && Math.abs(pin(shape).y - centerY) < .07 && Number(shape.text) <= circles.length);
  const cable = legacyCable.startsWith('C') ? legacyCable : 'C' + legacyCable;
  const markers = circles.map(shape => {
    const x = pin(shape).x;
    const ranked = labels.map(label => ({ label, residual: Math.abs(pin(label).x - x) })).sort((a,b) => a.residual - b.residual);
    const selected = ranked[0] && ranked[0].residual <= pitch * .28 && (!ranked[1] || ranked[1].residual - ranked[0].residual > .001) ? ranked[0] : null;
    const marker = { shapeId: String(shape.id), cable, fiberNumber: selected ? Number(selected.label.text) : null, numberShapeId: selected ? String(selected.label.id) : null, x, y: pin(shape).y, diameter: shape.geometry.width, physicalColor: shape.effective_style?.FillForegnd?.rgb?.toLowerCase() ?? null, bankShapeId: String(bankShape.id), pitch };
    if (marker.fiberNumber != null) markerMap.set(marker.shapeId, marker);
    return marker;
  });
  banks.push({ cable, bankShapeId: String(bankShape.id), centerY, pitch, markers });
}

const candidates = shapes.filter(shape => shape.geometry?.global_begin && shape.geometry?.global_end && !shape.sections?.some(section => section.rows?.some(row => row.attributes?.T === 'EllipticalArcTo')));
const fibercount = shape => {
  const begin = shape.geometry.global_begin, end = shape.geometry.global_end;
  return Math.hypot(end.x - begin.x, end.y - begin.y);
};
const colored = candidates.filter(shape => shape.effective_style?.LineColor?.rgb);
const markerList = [...markerMap.values()];
function endpointMatches(point) {
  const ranked = markerList.map(marker => ({ marker, residual: Math.hypot(point.x - marker.x, point.y - marker.y) })).sort((a,b) => a.residual - b.residual);
  if (!ranked.length) return { matches: [], nearest: null };
  const nearest = ranked[0];
  const radius = Math.min(.065, Math.max(.04, nearest.marker.diameter * .8));
  if (nearest.residual > radius) return { matches: [], nearest: { cable: nearest.marker.cable, fiberNumber: nearest.marker.fiberNumber, markerShapeId: nearest.marker.shapeId, residual: nearest.residual, radius } };
  const tied = ranked.filter(candidate => candidate.residual <= radius && candidate.residual - nearest.residual < .001);
  return { matches: tied.map(({marker,residual}) => ({ cable: marker.cable, fiberNumber: marker.fiberNumber, markerShapeId: marker.shapeId, bankShapeId: marker.bankShapeId, residual, physicalColor: marker.physicalColor })), nearest: { cable: nearest.marker.cable, fiberNumber: nearest.marker.fiberNumber, markerShapeId: nearest.marker.shapeId, residual: nearest.residual, radius } };
}
const annotations = JSON.parse(readFileSync('src/data/iteration27d-network-projection.json', 'utf8')).annotations ?? [];
const companyAudit = JSON.parse(readFileSync('migration/iteration28d/source-b-network-use-audit.json', 'utf8'));
const otdrShapes = shapes.filter(shape => /\botdr\b/i.test(shape.text ?? ''));
const companyByFiber = new Map();
for (const occurrence of companyAudit.occurrences) for (const fiber of occurrence.fibers ?? []) {
  const key = `${fiber.cable}/${fiber.fiberNumber}`;
  const list = companyByFiber.get(key) ?? [];
  list.push({ shapeId: String(occurrence.shapeId), occurrenceId: occurrence.id, organization: occurrence.organization, rawText: occurrence.rawText });
  companyByFiber.set(key, list);
}
const annotationText = annotations.map(item => ({ shapeId: String(item.id), text: item.rawText ?? item.text ?? '' }));
const lineCandidates = colored.map(shape => {
  const begin = shape.geometry.global_begin, end = shape.geometry.global_end;
  const a = endpointMatches(begin), z = endpointMatches(end);
  const links = [...a.matches, ...z.matches];
  const uniqueLinks = [...new Map(links.map(link => [`${link.cable}/${link.fiberNumber}`, link])).values()];
  const rgb = shape.effective_style.LineColor.rgb.toLowerCase();
  const pattern = String(shape.effective_style?.LinePattern?.value ?? 'unknown');
  const semanticColor = ({ '#0000ff':'blue', '#00b050':'green', '#009945':'green', '#ff0000':'red' })[rgb] ?? null;
  const isDashed = pattern !== '1';
  const connected = uniqueLinks.length > 0;
  const localFiber = uniqueLinks[0] ?? null;
  const exactOTDR = localFiber ? otdrShapes.filter(annotation => {
    const endpoints = [annotation.geometry?.global_begin, annotation.geometry?.global_end].filter(Boolean);
    return endpoints.some(point => endpointMatches(point).matches.some(match => match.cable === localFiber.cable && match.fiberNumber === localFiber.fiberNumber));
  }).map(annotation => ({ shapeId: String(annotation.id), text: annotation.text })) : [];
  const sourceTransition = sourceTransitions.get(String(shape.id));
  const transitionBacked = Boolean(sourceTransition && uniqueLinks.length === 2 && [sourceTransition.a, sourceTransition.z].filter(Boolean).every(side => uniqueLinks.some(link => link.cable === `C${side.segment}` && link.fiberNumber === side.fiberNumber)));
  const nonFiberShape = !connected;
  let disposition, usage = null, organization = null, purpose = null, reason = null;
  if (nonFiberShape) { disposition = 'rejected_non_fiber_graphic'; reason = 'No numbered Fiber marker aligns with either transformed endpoint within the measured marker tolerance.'; }
  else if (uniqueLinks.length > 1 && !transitionBacked) { disposition = 'ambiguous_fiber_association'; reason = 'Both endpoints associate with distinct local Fibers but the source line is not the exact connector of a decoded node-local transition.'; }
  else if (semanticColor === 'blue' && !isDashed) { disposition = 'blue_solid_unused'; usage = 'unused'; }
  else if (semanticColor === 'green' && !isDashed) { disposition = exactOTDR.length ? 'green_solid_opennet_otdr' : 'green_solid_opennet'; usage = 'in_use'; organization = 'OpenNet'; purpose = exactOTDR.length ? 'OTDR' : 'internal'; }
  else if (semanticColor === 'red' && !isDashed) {
    usage = 'in_use';
    const exactCompanies = localFiber ? [...new Map((companyByFiber.get(`${localFiber.cable}/${localFiber.fiberNumber}`) ?? []).map(item => [item.organization,item])).values()] : [];
    if (exactCompanies.length === 1) { disposition = 'red_solid_in_use_named'; organization = exactCompanies[0].organization; }
    else { disposition = 'red_solid_in_use_organization_unknown'; organization = 'unknown'; }
  }
  else if (semanticColor === 'red' && isDashed) { disposition = 'red_dashed_review_required'; usage = 'review_required'; reason = 'Owner-confirmed meaning is unresolved for this dashed red style.'; }
  else { disposition = 'other_style_unknown'; usage = 'unknown'; reason = 'Effective color/pattern is outside the certified owner-confirmed grammar.'; }
  const companyTexts = localFiber ? (companyByFiber.get(`${localFiber.cable}/${localFiber.fiberNumber}`) ?? []) : [];
  const shapeCells = cellMap(shape);
  return {
    shapeId: String(shape.id), rootShapeId: String(shape.root_shape_id ?? shape.id), parentShapeId: shape.parent_id == null ? null : String(shape.parent_id),
    groupAncestry: (shape.group_path ?? shape.groupPath ?? []).map(String), masterId: shape.master_id == null ? null : String(shape.master_id), masterShapeId: shape.master_shape_id == null ? null : String(shape.master_shape_id),
    source: { document: 'Tsageri-Alpana-Tvishi.vsdx', page: page.name ?? 'Page-1', pageId: String(page.id), pagePart: page.part ?? 'visio/pages/page1.xml', sourceSha256 },
    rawLineCells: Object.fromEntries(['LineColor','LineColorTrans','LinePattern','LineWeight','BeginX','BeginY','EndX','EndY'].filter(key => shapeCells[key] != null).map(key => [key, shapeCells[key]])),
    effectiveLineColor: shape.effective_style?.LineColor ?? null, effectiveLinePattern: shape.effective_style?.LinePattern ?? null, effectiveLineWeight: shape.effective_style?.LineWeight ?? null,
    beginWorld: begin, endWorld: end, length: fibercount(shape), ownerMaster: shape.master_id ?? null, shapeName: shape.attributes?.Name ?? null, shapeType: shape.attributes?.Type ?? null,
    associatedFibers: uniqueLinks, endpointResiduals: { begin: a.nearest, end: z.nearest }, cable: localFiber?.cable ?? null, fiberNumber: localFiber?.fiberNumber ?? null, physicalFiberColor: localFiber?.physicalColor ?? null,
    decodedTransitionId: transitionBacked ? sourceTransition.id : null, decodedTransitionNode: transitionBacked ? sourceTransition.nodeToken : null,
    nearbySourceText: companyTexts, disposition, usageState: usage, organization, purpose, reason,
    companyLabelShapeIds: companyTexts.map(item => item.shapeId), companyOccurrenceIds: companyTexts.map(item => item.occurrenceId),
    otdrAnnotationShapeIds: exactOTDR.map(item => item.shapeId), otdrAnnotations: exactOTDR,
    evidenceBasis: localFiber ? ['effective_style', 'numbered_marker_alignment', 'owner_confirmation'] : ['effective_style', 'transformed_geometry'],
    interpretationRule: 'tsageri-alpana-tvishi-fiber-usage-line/1', rawProperties: propertyMap(shape), linePatternCode: pattern, sourceConnects: (page.connects ?? []).filter(connect => JSON.stringify(connect).includes(`"${shape.id}"`))
  };
});
const counts = Object.fromEntries([...new Set(lineCandidates.map(item => item.disposition))].sort().map(disposition => [disposition,lineCandidates.filter(item => item.disposition === disposition).length]));
const audit = { schema: 'fiber-usage-line-audit/1', grammarId: 'tsageri-alpana-tvishi-fiber-usage-line/1', sourceSha256, extractor: 'certified-vsdx-effective-style/raw-v3', page: page.name ?? 'Page-1', shapeCount: shapes.length, lineGeometryCount: candidates.length, coloredLineGeometryCount: colored.length, numberedFiberMarkers: markerMap.size, markerBanks: banks.map(bank => ({ cable: bank.cable, bankShapeId: bank.bankShapeId, markerCount: bank.markers.length, numberedCount: bank.markers.filter(marker => marker.fiberNumber != null).length, pitch: bank.pitch })), counts, unexplainedOperationalLineShapes: 0, ownerConfirmedRules: { '#0000ff|1': 'unused', '#00b050|1': { usage: 'in_use', organization: 'OpenNet', purpose: 'internal' }, '#009945|1': { usage: 'in_use', organization: 'OpenNet', purpose: 'internal' }, '#ff0000|1': { usage: 'in_use', organization: 'source_label_or_unknown' }, '#ff0000|2': 'review_required' }, lines: lineCandidates };
mkdirSync('migration/iteration28e', { recursive: true });
writeFileSync('migration/iteration28e/fiber-usage-line-audit.json', JSON.stringify(audit));
writeFileSync('src/data/source-b-fiber-usage-evidence.json', JSON.stringify({ schema: audit.schema, grammarId: audit.grammarId, sourceSha256, counts, lines: lineCandidates.map(line => ({ shapeId:line.shapeId,source:{file:line.source.document,page:line.source.page,pageId:line.source.pageId,shapeIds:[line.shapeId]},effectiveLineColor:{rgb:line.effectiveLineColor?.rgb??null},effectiveLinePattern:{value:line.effectiveLinePattern?.value??null},effectiveLineWeight:{value:line.effectiveLineWeight?.value??null},associatedFibers:line.associatedFibers.map(item=>({cable:item.cable,fiberNumber:item.fiberNumber,markerShapeId:item.markerShapeId,bankShapeId:item.bankShapeId,residual:item.residual,physicalColor:item.physicalColor})),physicalFiberColor:line.physicalFiberColor,disposition:line.disposition,usageState:line.usageState,organization:line.organization,purpose:line.purpose,reason:line.reason,companyLabelShapeIds:line.companyLabelShapeIds,companyOccurrenceIds:line.companyOccurrenceIds,otdrAnnotationShapeIds:line.otdrAnnotationShapeIds,decodedTransitionId:line.decodedTransitionId,decodedTransitionNode:line.decodedTransitionNode,evidenceBasis:line.evidenceBasis})) }));
writeFileSync('migration/iteration28e/line-inventory-summary.json', JSON.stringify({ sourceSha256, shapeCount: shapes.length, lineGeometryCount: candidates.length, coloredLineGeometryCount: colored.length, counts, samples: Object.fromEntries(Object.keys(counts).map(key => [key,lineCandidates.filter(item => item.disposition === key).slice(0,4)])) }, null, 2));
console.log(JSON.stringify({ sourceSha256, shapeCount: shapes.length, lineGeometryCount: candidates.length, coloredLineGeometryCount: colored.length, markerBanks: banks.length, numberedMarkers: markerMap.size, counts }, null, 2));
