import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateClosureGrammar, parseCoordinatePair } from './source-b-closure-grammar.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceFile = resolve(root, 'imports/inbox/Tsageri-Alpana-Tvishi.vsdx');
const rawFiles = ['migration/iteration27/run-a/tsageri-alpana-tvishi.raw.json.gz', 'migration/iteration27/run-b/tsageri-alpana-tvishi.raw.json.gz'].map(path => resolve(root, path));
const sourceProjection = JSON.parse(readFileSync(resolve(root, 'src/data/iteration27d-network-projection.json'), 'utf8'));
const ownerConfirmation = {
  id: 'OWNER-CONFIRMED-28B-CLOSURE-GRAMMAR',
  basis: 'owner_confirmation',
  statement: 'A large grey Visio Closure block carrying its own Closure number, coordinate text, and GIS/external reference, with network connectivity drawn against it, represents a physical Closure.',
  fieldVerified: false,
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const sourceHash = sha256(readFileSync(sourceFile));
const rawRuns = rawFiles.map(path => JSON.parse(gunzipSync(readFileSync(path))));
if (rawRuns.some(raw => raw.source?.sha256 !== sourceHash)) throw new Error('The cached extraction does not correspond to the current Source B VSDX.');
if (rawRuns[0].summary?.all_page_shapes_including_subshapes !== rawRuns[1].summary?.all_page_shapes_including_subshapes) throw new Error('Independent Source B extractions disagree on page shape inventory.');
const extractionFingerprints = rawRuns.map(run => {
  const pageShapes = run.pages[0].shapes;
  const roots = pageShapes.filter(shape => shape.parent_id == null && shape.attributes?.Type === 'Group').sort((a, b) => Number(a.id) - Number(b.id));
  const evidence = roots.map(group => ({
    id: group.id,
    attributes: group.attributes,
    master: group.master_id,
    masterShape: group.master_shape_id,
    bounds: group.geometry?.world_bounds,
    style: { fill: group.effective_style?.FillForegnd?.rgb, line: group.effective_style?.LineColor?.rgb },
    properties: group.sections?.find(section => section.attributes?.N === 'Property')?.rows,
    children: pageShapes.filter(shape => shape.parent_id === group.id).sort((a, b) => Number(a.id) - Number(b.id)).map(shape => ({ id: shape.id, attributes: shape.attributes, master: shape.master_id, masterShape: shape.master_shape_id, bounds: shape.geometry?.world_bounds, style: { fill: shape.effective_style?.FillForegnd?.rgb, line: shape.effective_style?.LineColor?.rgb }, properties: shape.sections?.find(section => section.attributes?.N === 'Property')?.rows })),
  }));
  return sha256(JSON.stringify(evidence));
});
if (new Set(extractionFingerprints).size !== 1) throw new Error('Independent Source B extractions disagree on Closure-like group Shape Data, geometry, or style.');

const raw = rawRuns[0];
const page = raw.pages[0];
const shapes = page.shapes;
const master = raw.masters.find(item => item.id === '23');
const masterRoot = master?.shapes.find(item => item.id === '5');
const childMasterIds = { externalReference: '6', coordinate: '7', number: '8' };
const sourceByShapeId = new Map(shapes.map(shape => [shape.id, shape]));

function propertyRows(shape) {
  return (shape.sections?.find(section => section.attributes?.N === 'Property')?.rows ?? []).map(row => ({
    key: row.attributes?.N ?? '',
    label: row.cells?.find(cell => cell.N === 'Label')?.V ?? null,
    value: row.cells?.find(cell => cell.N === 'Value')?.V ?? '',
  }));
}
const property = (shape, key) => propertyRows(shape).find(row => row.key === key);
const fieldValue = (shape, key) => shape.sections?.find(section => section.attributes?.N === 'Property')?.rows
  ?.find(row => row.attributes?.N === key)?.cells?.find(cell => cell.N === 'Value')?.V ?? '';

const cableRowsByEndpoint = new Map();
for (const cable of sourceProjection.cables) for (const token of cable.endpoints) {
  const bucket = cableRowsByEndpoint.get(token) ?? [];
  bucket.push(cable);
  cableRowsByEndpoint.set(token, bucket);
}

const sourceSymbols = shapes.filter(shape => shape.parent_id == null && (
  shape.attributes?.Type === 'Group'
  || shape.master_id === '23'
  || ['#bfbfbf', '#d0d0d0'].includes(shape.effective_style?.FillForegnd?.rgb?.toLowerCase())
  || propertyRows(shape).some(row => /°|(?:GIS|GJS)\\s*[-–]/i.test(row.value))
));

function inspectCandidate(group) {
  const children = shapes.filter(shape => shape.parent_id === group.id).sort((a, b) => Number(a.id) - Number(b.id));
  const rows = propertyRows(group);
  const numberRow = property(group, 'Row_1');
  const coordinateRow = property(group, 'Row_2');
  const externalRow = property(group, 'Row_3');
  const childrenByMasterShape = new Map(children.map(child => [child.master_shape_id, child]));
  const numberShape = childrenByMasterShape.get(childMasterIds.number);
  const coordinateShape = childrenByMasterShape.get(childMasterIds.coordinate);
  const externalShape = childrenByMasterShape.get(childMasterIds.externalReference);
  const grammar = evaluateClosureGrammar({
    isTopLevel: group.parent_id == null,
    groupType: group.attributes?.Type ?? '',
    masterId: group.master_id ?? null,
    masterShapeId: group.master_shape_id ?? null,
    masterRootName: masterRoot?.attributes?.Name ?? null,
    fill: group.effective_style?.FillForegnd?.rgb ?? null,
    numberText: numberRow?.value ?? '',
    coordinateText: coordinateRow?.value ?? '',
    externalReferenceText: externalRow?.value ?? '',
    numberCalloutField: numberShape ? fieldValue(numberShape, 'msvCalloutField') : '',
    coordinateCalloutField: coordinateShape ? fieldValue(coordinateShape, 'msvCalloutField') : '',
    externalReferenceCalloutField: externalShape ? fieldValue(externalShape, 'msvCalloutField') : '',
    childMasterShapeIds: children.map(child => child.master_shape_id ?? ''),
  });
  const { closureNumber, coordinates, externalReference: externalMatch, checks: grammarChecks, matched } = grammar;
  const connectedCables = closureNumber === null ? [] : (cableRowsByEndpoint.get(String(closureNumber)) ?? []).map(cable => ({
    legacyId: cable.legacyId,
    label: cable.label,
    sourceShapeIds: cable.sourceShapeIds,
    endpointTokens: cable.endpoints,
  })).sort((a, b) => Number(a.legacyId) - Number(b.legacyId));
  const childIds = children.map(shape => shape.id);
  const ids = [group.id, ...childIds];
  const source = {
    file: raw.source.file,
    page: page.name,
    pageId: page.id,
    part: page.part,
    shapeIds: ids,
    rawValue: numberRow?.value ?? '',
    interpretationRule: 'tsageri-alpana-tvishi-closure-block/1',
  };
  return {
    rootShapeId: group.id,
    groupPath: group.group_path ?? [],
    shapeType: group.attributes?.Type ?? '',
    closureNumber,
    disposition: matched ? 'certified_closure_grammar_match' : 'rejected_non_closure_or_incomplete_symbol',
    grammarChecks,
    root: {
      uniqueId: group.attributes?.UniqueID ?? null,
      masterId: group.master_id ?? null,
      masterShapeId: group.master_shape_id ?? null,
      masterName: masterRoot?.attributes?.Name ?? null,
      propertyRows: rows,
      bounds: group.geometry?.world_bounds ?? null,
      fill: group.effective_style?.FillForegnd?.rgb ?? null,
      line: group.effective_style?.LineColor?.rgb ?? null,
      rectangleGeometry: (group.geometry?.world_geometry_sections ?? []).map(section => ({
        sectionIndex: section.attributes?.IX ?? null,
        rows: (section.rows ?? []).map(row => ({ type: row.attributes?.T ?? null, point: row.world_point ?? null })),
      })),
    },
    children: children.map(child => ({
      id: child.id,
      type: child.attributes?.Type ?? '',
      name: child.attributes?.Name ?? null,
      masterId: child.master_id ?? null,
      masterShapeId: child.master_shape_id ?? null,
      calloutFieldRaw: fieldValue(child, 'msvCalloutField') || null,
      propertyRows: propertyRows(child),
      bounds: child.geometry?.world_bounds ?? null,
      fill: child.effective_style?.FillForegnd?.rgb ?? null,
      line: child.effective_style?.LineColor?.rgb ?? null,
    })),
    evidence: {
      source,
      sourceHash,
      masterReference: { masterId: master?.id, masterUniqueId: master?.attributes?.UniqueID, rootShapeId: masterRoot?.id, rootShapeName: masterRoot?.attributes?.Name, childShapeIds: master?.shapes.map(shape => shape.id) ?? [] },
      numberShapeId: numberShape?.id ?? null,
      coordinateShapeId: coordinateShape?.id ?? null,
      externalReferenceShapeId: externalShape?.id ?? null,
      connectedCableEvidence: connectedCables,
      directVisioConnectRowsToSymbol: page.connects.filter(connect => ids.includes(connect.FromSheet) || ids.includes(connect.ToSheet)),
      connectionEvidenceNote: 'No Visio Connect row directly targets the closure group/callout Shapes. Cable endpoint consistency comes from the active source-derived Cable labels and canonical physical endpoint projection; it does not create adjacency.',
      ownerConfirmationId: ownerConfirmation.id,
      evidenceBasis: ['source_document', 'source_geometry', 'owner_confirmation'],
      verification: 'documentation_reviewed',
      fieldVerified: false,
    },
    coordinates: coordinates ? { rawCoordinateText: coordinateRow.value, longitudeDms: coordinates.longitude, latitudeDms: coordinates.latitude, longitudeDecimalDegrees: coordinates.longitude.decimalDegrees, latitudeDecimalDegrees: coordinates.latitude.decimalDegrees, crs: 'unknown', parseState: 'parsed', sourceShapeId: coordinateShape.id } : { rawCoordinateText: coordinateRow?.value ?? '', longitudeDms: null, latitudeDms: null, longitudeDecimalDegrees: null, latitudeDecimalDegrees: null, crs: 'unknown', parseState: 'unparsed', sourceShapeId: coordinateShape?.id ?? null },
    externalReference: externalMatch ? { system: externalMatch[1].toUpperCase(), value: externalMatch[2], rawText: externalRow.value, sourceShapeId: externalShape.id } : null,
  };
}

const inspections = sourceSymbols.filter(shape => shape.attributes?.Type === 'Group' && shape.parent_id == null).map(inspectCandidate).sort((a, b) => Number(a.rootShapeId) - Number(b.rootShapeId));
const matches = inspections.filter(item => item.disposition === 'certified_closure_grammar_match').sort((a, b) => a.closureNumber - b.closureNumber);
const referenceDuplicates = new Map();
for (const item of matches) {
  const key = `${item.externalReference?.system}:${item.externalReference?.value}`;
  referenceDuplicates.set(key, [...(referenceDuplicates.get(key) ?? []), item.closureNumber]);
}
const duplicateExternalReferences = [...referenceDuplicates.entries()].filter(([, numbers]) => numbers.length > 1).map(([key, numbers]) => ({ key, closureNumbers: numbers }));
const inventory = matches.map(item => ({
  canonicalId: Number(item.closureNumber) <= 206 ? `closure:${item.closureNumber}` : `network_node:${item.closureNumber}`,
  sourceNumber: item.closureNumber,
  displayName: `SC${item.closureNumber}`,
  assetType: 'closure',
  sourceEndpointToken: String(item.closureNumber),
  closureGrammar: 'tsageri-alpana-tvishi-closure-block/1',
  coordinates: item.coordinates,
  externalReferences: item.externalReference ? [item.externalReference] : [],
  sourceRepresentation: item.evidence,
  verification: 'documentation_reviewed',
  fieldVerified: false,
}));

if (!matches.some(item => item.closureNumber === 207 && item.coordinates.rawCoordinateText.trim() === '42°47\'38.509"E  42°39\'12.421"N')) throw new Error('Golden Closure 207 failed source-text verification.');

const sourceBClosureRefs = Object.fromEntries(matches.map(item => [String(item.closureNumber), {
  canonicalId: Number(item.closureNumber) <= 206 ? `closure:${item.closureNumber}` : `network_node:${item.closureNumber}`,
  sourceEndpointToken: String(item.closureNumber),
  closureNumber: item.closureNumber,
  displayName: `SC${item.closureNumber}`,
  coordinates: item.coordinates,
  externalReferences: item.externalReference ? [item.externalReference] : [],
  sourceRepresentation: {
    source: item.evidence.source,
    sourceHash,
    rootShapeId: item.rootShapeId,
    childShapeIds: item.children.map(child => child.id),
    root: item.root,
    masterReference: item.evidence.masterReference,
    numberShapeId: item.evidence.numberShapeId,
    coordinateShapeId: item.evidence.coordinateShapeId,
    externalReferenceShapeId: item.evidence.externalReferenceShapeId,
    connectedCableEvidence: item.evidence.connectedCableEvidence,
    directVisioConnectRowsToSymbol: item.evidence.directVisioConnectRowsToSymbol,
  },
  verification: item.evidence.verification,
  fieldVerified: item.evidence.fieldVerified,
}]));

const endpointDegrees = new Map();
for (const cable of sourceProjection.cables) for (const token of cable.endpoints) endpointDegrees.set(token, (endpointDegrees.get(token) ?? 0) + 1);
const closureTokens = new Set(matches.map(item => String(item.closureNumber)));
const alreadyTypedContextTokens = new Set(['5', '216']);
const remainingNeutralTokens = [...endpointDegrees.keys()].filter(token => !closureTokens.has(token) && !alreadyTypedContextTokens.has(token));

const audit = {
  schemaVersion: 1,
  iteration: '28B',
  status: 'SOURCE_GRAMMAR_CERTIFIED',
  source: { file: raw.source.file, sourceHash, pageId: page.id, pageName: page.name, pagePart: page.part },
  grammar: {
    id: 'tsageri-alpana-tvishi-closure-block/1',
    ownerConfirmation,
    deterministicConditions: ['top-level Group', 'Master 23 / Master Shape 5, named ქურო', 'effective #bfbfbf fill', 'integer own Property.Row_1', 'valid E/N or W/S DMS own Property.Row_2', 'own Property.Row_3 external reference matching GJS/GIS prefix and code', 'three child callout Shapes from Master Shapes 6/7/8 whose callout fields exactly match the three values'],
    master: { id: master?.id, uniqueId: master?.attributes?.UniqueID, rootShape: { id: masterRoot?.id, name: masterRoot?.attributes?.Name }, childShapes: master?.shapes.map(shape => ({ id: shape.id, name: shape.attributes?.Name ?? null })) ?? [] },
    sourceConnectRows: page.connects.length,
    directConnectRowsToClosureGroups: inspections.reduce((sum, item) => sum + item.evidence.directVisioConnectRowsToSymbol.length, 0),
  },
  inventoryCounts: {
    sourceSymbolGroupCandidates: inspections.length,
    certifiedClosures: matches.length,
    rejectedCandidates: inspections.filter(item => item.disposition !== 'certified_closure_grammar_match').length,
    neutralInternalNodesAfterTyping: remainingNeutralTokens.filter(token => (endpointDegrees.get(token) ?? 0) > 1).length,
    neutralLeafEndpointsRemaining: remainingNeutralTokens.filter(token => (endpointDegrees.get(token) ?? 0) === 1).length,
    neutralSourceEndpointTokensOutsideGrammar: remainingNeutralTokens.length,
    coordinateRecords: matches.filter(item => item.coordinates.parseState === 'parsed').length,
    gisReferenceRecords: matches.filter(item => item.externalReference).length,
    uniqueExternalReferenceValues: new Set(matches.map(item => `${item.externalReference?.system}:${item.externalReference?.value}`)).size,
    duplicateExternalReferences,
    unparsedCoordinateStrings: matches.filter(item => item.coordinates.parseState !== 'parsed').map(item => ({ shapeId: item.coordinates.sourceShapeId, rawText: item.coordinates.rawCoordinateText })),
  },
  candidates: inspections,
  negativeGoldenCases: [
    { shapeId: '23800', expected: 'reject', reason: 'Non-Master purple group; no Closure master reference, no paired DMS/GJS properties, and no 6/7/8 callout-child grammar.' },
    { shapeId: '15772', expected: 'reject', reason: 'Standalone Cable label Shape; text is a Cable endpoint label and it has no Closure block Master/group structure or coordinate/external-reference properties.' },
    { shapeId: '15775', expected: 'reject', reason: 'Standalone Cable label Shape; text is a Cable endpoint label and it has no Closure block Master/group structure or coordinate/external-reference properties.' },
  ],
  inventory: sourceBClosureRefs,
  repeatability: {
    independentExtractions: rawRuns.length,
    extractedShapeCounts: rawRuns.map(run => run.summary?.all_page_shapes_including_subshapes ?? null),
    closureGroupEvidenceFingerprint: extractionFingerprints[0],
    matchingRootShapeIds: matches.map(item => item.rootShapeId),
  },
};

function writeJson(path, value) {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
writeJson('migration/iteration28b/source-b-closure-grammar.json', audit);
writeJson('src/data/source-b-closure-inventory.json', { schemaVersion: 1, grammar: audit.grammar.id, sourceHash, ownerConfirmation, records: sourceBClosureRefs });
console.log(JSON.stringify({ sourceHash, shapeCount: raw.summary.all_page_shapes_including_subshapes, candidateGroups: inspections.length, certifiedClosures: matches.map(item => item.closureNumber), rejectedGroups: inspections.filter(item => item.disposition !== 'certified_closure_grammar_match').map(item => item.rootShapeId), coordinateRecords: inventory.filter(item => item.coordinates.parseState === 'parsed').length, duplicateExternalReferences }, null, 2));
