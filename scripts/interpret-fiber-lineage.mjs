import fs from 'node:fs';
import zlib from 'node:zlib';

const input = 'migration/tsageri-lentekhi-iteration09.raw.json.gz';
const output = 'src/data/fiber-lineage-evidence.json';
const raw = JSON.parse(zlib.gunzipSync(fs.readFileSync(input)));
const shapes = [];
function flatten(items) {
  for (const shape of items ?? []) {
    shapes.push(shape);
    flatten(shape.children ?? shape.shapes);
  }
}
for (const page of raw.pages ?? []) flatten(page.shapes);
const byId = new Map(shapes.map(shape => [String(shape.id ?? shape.ID ?? shape.shape_id), shape]));
const cell = (shape, name) => shape?.cells?.find(item => item.N === name)?.V ?? null;
const summary = id => {
  const shape = byId.get(String(id));
  if (!shape) throw new Error(`Missing source shape ${id}`);
  return { id: String(id), text: shape.text ?? '', pinX: cell(shape, 'PinX'), pinY: cell(shape, 'PinY'), beginX: cell(shape, 'BeginX'), beginY: cell(shape, 'BeginY'), endX: cell(shape, 'EndX'), endY: cell(shape, 'EndY'), lineColor: cell(shape, 'LineColor'), fillColor: cell(shape, 'FillForegnd') };
};

const ap51FiberLines = Array.from({ length: 24 }, (_, index) => summary(34279 + index));
const ap51PortLines = Array.from({ length: 24 }, (_, index) => summary(34267 + index));
const ap51PortLabels = Array.from({ length: 24 }, (_, index) => summary(34315 + index));
const ap51Mappings = ap51PortLabels.map((label, index) => ({
  fiberNumber: index + 1,
  portNumber: index + 1,
  fiberLineShapeId: ap51FiberLines[index].id,
  portLineShapeId: ap51PortLines[index].id,
  portLabelShapeId: label.id,
  xDelta: Math.abs(Number(ap51FiberLines[index].pinX) - Number(ap51PortLines[index].pinX)),
  sourceVisualState: index === 2 ? 'green_in_use' : 'white_unused',
}));

const cableLabels = shapes.filter(shape => /^\s*\d+\s*-\s*\d+\s*-\s*\d+\s*-\s*\d+\s*$/.test(shape.text ?? ''));
const evidence = {
  ruleVersion: 'tsageri-lentekhi-fiber-lineage/1',
  source: { file: 'Tsageri-Lentekhi 2025.vsdx', page: 'ცაგერი-ლენტეხი', pageId: '4', part: 'visio/pages/page1.xml', rawArtifact: input },
  method: [
    'Identify Cable Segment sides from the endpoint order encoded by the legacy four-field cable label and canonical route nodes.',
    'Read local Fiber number from the numbered marker aligned with each physical marker dot.',
    'Read Fiber color from inner fill and Tube color from the outer marker ring under the source-specific marker convention.',
    'Follow dedicated continuation lines between marker banks; same aligned position means same-number continuity unless the destination bank numbers establish an offset.',
    'At SC218, ordered banks establish C172/F29–40 to C173/F01–12 and C174/F29–40 to C173/F13–24.',
    'At AP51, aligned C173 Fiber lines and Port lines establish the same-index F01–24 to Port01–24 prototype mapping.',
    'At Tsageri AGG5, the owner-confirmed F01→145 and F31→175 anchors establish the repeated +144 route-side to aggregation-side numbering rule.',
    'Branch continuation is represented only where dedicated geometry and a destination bank exist; unresolved ranges stay partial.',
  ],
  prototypePolicy: { allowedStatuses: ['owner_confirmed', 'source_interpreted', 'source_ambiguous'], normallyProjected: ['owner_confirmed', 'source_interpreted'], fieldVerified: false, productionApproved: false },
  goldenCases: {
    c172f01: { upstreamFiber: 145, downstreamFiber: 1, upstreamPort: 145, downstreamPort: 1 },
    c172f31: { upstreamFiber: 175, branchSegment: 'C173', branchFiber: 3, destination: 'AP51', destinationPort: 3 },
    preservedC172f29: { branchSegment: 'C173', branchFiber: 1, destination: 'AP51', destinationPort: 1 },
  },
  ap51: {
    assetShapes: ['34263', '34264', '34371', '34372', '34424'],
    mapping: ap51Mappings,
    port3: { label: summary('34317'), fiberLine: summary('34281'), portLine: summary('34269'), annotation: 'OTDR' },
  },
  opennetUsage: {
    labels: ['17661', '17662', '17663', '17664'].map(summary),
    continuationLines: ['38538', '38539', '38540', '38541'].map(summary),
    aggregationMarkers: ['19063', '19064', '19065', '19066'].map(summary),
    routeMarkers: ['33257', '33258', '33259', '33260'].map(summary),
    interpretedScope: 'Fiber Lineages 1–4',
    semantics: 'usage_only_not_ownership',
  },
  coverage: {
    flattenedShapes: shapes.length,
    cableLabelsFound: cableLabels.length,
    targetCableSegments: ['C148', 'C150', 'C169', 'C170', 'C171', 'C172', 'C173', 'C174', 'C175', 'C176', 'C177', 'C178', 'C179', 'C180', 'C181', 'C182', 'C183', 'C184'],
    exactLineageSegments: ['C148', 'C150', 'C169', 'C171', 'C172', 'C173', 'C174', 'C176', 'C177', 'C178', 'C179', 'C180', 'C184'],
    attemptedButAmbiguous: ['C170', 'C175', 'C181', 'C182', 'C183'],
    closuresCovered: ['SC205', 'SC206', 'SC216', 'SC217', 'SC218', 'SC219', 'SC220', 'SC221', 'SC222', 'SC223', 'SC224'],
    aggregationContexts: ['AGG5', 'Lentekhi conflicting boundary'],
    accessPointsWithExactPortMapping: ['AP51'],
  },
};
fs.writeFileSync(output, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`Wrote ${output}: ${ap51Mappings.length} AP51 mappings, ${evidence.coverage.exactLineageSegments.length} exact-lineage segments.`);
