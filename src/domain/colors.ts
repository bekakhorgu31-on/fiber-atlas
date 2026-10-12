import c172EvidenceJson from '../data/c172-physical-evidence.json';
import type { Inventory, PhysicalAttributeEvidence, PhysicalColor, PhysicalColorKey, SourceRef } from './types';

export type StandardPhysicalColor = {
  position: number;
  key: PhysicalColorKey;
  nameKa: string;
  nameEn: string;
  hex: string;
};

/** User-confirmed 12-position physical strand sequence. Color remains an attribute, never an identity. */
export const STANDARD_12_COLOR_SEQUENCE: readonly StandardPhysicalColor[] = [
  { position: 1, key: 'blue', nameKa: 'ლურჯი', nameEn: 'Blue', hex: '#2563eb' },
  { position: 2, key: 'orange', nameKa: 'ნარინჯისფერი', nameEn: 'Orange', hex: '#f97316' },
  { position: 3, key: 'green', nameKa: 'მწვანე', nameEn: 'Green', hex: '#16a34a' },
  { position: 4, key: 'brown', nameKa: 'ყავისფერი', nameEn: 'Brown', hex: '#92400e' },
  { position: 5, key: 'slate', nameKa: 'ნაცრისფერი', nameEn: 'Slate/Grey', hex: '#64748b' },
  { position: 6, key: 'white', nameKa: 'თეთრი', nameEn: 'White', hex: '#f8fafc' },
  { position: 7, key: 'red', nameKa: 'წითელი', nameEn: 'Red', hex: '#dc2626' },
  { position: 8, key: 'black', nameKa: 'შავი', nameEn: 'Black', hex: '#111827' },
  { position: 9, key: 'yellow', nameKa: 'ყვითელი', nameEn: 'Yellow', hex: '#eab308' },
  { position: 10, key: 'violet', nameKa: 'იისფერი', nameEn: 'Violet', hex: '#8b5cf6' },
  { position: 11, key: 'rose', nameKa: 'ვარდისფერი', nameEn: 'Rose/Pink', hex: '#ec4899' },
  { position: 12, key: 'aqua', nameKa: 'ცისფერი', nameEn: 'Aqua/Turquoise', hex: '#06b6d4' },
];

const RAW_VISIO_COLORS: Readonly<Record<string, PhysicalColorKey>> = {
  '4': 'blue',
  '#0000ff': 'blue',
  '#f48c37': 'orange',
  '#ea700d': 'orange',
  '#f9bb00': 'orange',
  '9': 'green',
  '#008000': 'green',
  '#9c4a09': 'brown',
  '19': 'slate',
  '#7f7f7f': 'slate',
  '1': 'white',
  '#ffffff': 'white',
  '#ff0000': 'red',
  '#000000': 'black',
  '#ffff00': 'yellow',
  '#cc99ff': 'violet',
  '#7030a0': 'violet',
  '#ff00ff': 'rose',
  '#00ffff': 'aqua',
};

const unknownPhysicalColor = (): PhysicalColor => ({
  key: null,
  nameKa: null,
  nameEn: null,
  hex: null,
  basis: 'unknown',
  verification: 'needs_verification',
});

export function standardColor(key: PhysicalColorKey, basis: PhysicalColor['basis'] = 'documented'): PhysicalColor {
  const color = STANDARD_12_COLOR_SEQUENCE.find(item => item.key === key);
  if (!color) return unknownPhysicalColor();
  return { key, nameKa: color.nameKa, nameEn: color.nameEn, hex: color.hex, basis, verification: basis === 'documented' ? 'documentation_reviewed' : 'needs_verification' };
}

/** Exact source-specific map only. Unsupported values stay unresolved. */
export function decodeTsageriVisioColor(raw: string | null | undefined): PhysicalColor {
  const key = raw == null ? undefined : RAW_VISIO_COLORS[raw.trim().toLowerCase()];
  return key ? standardColor(key) : unknownPhysicalColor();
}

export function interpretTsageriMarker(input: { innerFill: string | null; outerRing: string | null; connectorLine?: string | null }) {
  return {
    fiberColor: decodeTsageriVisioColor(input.innerFill),
    tubeColor: decodeTsageriVisioColor(input.outerRing),
    ignoredConnectorLine: input.connectorLine ?? null,
    ruleVersion: 'tsageri-lentekhi-marker-colors/1',
  };
}

type C172Record = {
  fiberNumber: number;
  tubeNumber: number;
  positionInTube: number;
  markerShapeId: string;
  labelShapeId: string;
  rawInnerColor: string;
  fiberColorKey: PhysicalColorKey | null;
  rawOuterColor: string;
  observedOuterColorKey: PhysicalColorKey | null;
  tubeColorKey: PhysicalColorKey;
  warnings: string[];
};

type C172Evidence = {
  segmentId: string;
  sourceSha256: string;
  source: { file: string; page: string; pageId: string; part: string; groupShapeId: string };
  interpretationRule: string;
  convention: string;
  records: C172Record[];
};

export const c172PhysicalEvidence = c172EvidenceJson as C172Evidence;

function sourceFor(record: C172Record): SourceRef {
  const source = c172PhysicalEvidence.source;
  return {
    file: source.file,
    page: source.page,
    pageId: source.pageId,
    part: source.part,
    shapeIds: [source.groupShapeId, record.markerShapeId, record.labelShapeId],
    rawValue: `inner=${record.rawInnerColor}; outer=${record.rawOuterColor}`,
    interpretationRule: c172PhysicalEvidence.interpretationRule,
    note: record.warnings.join(' ') || 'Inner marker and outer ring agree with the confirmed 12-position convention.',
  };
}

function evidenceFor(record: C172Record): PhysicalAttributeEvidence {
  return {
    source: sourceFor(record),
    ruleVersion: c172PhysicalEvidence.interpretationRule,
    convention: c172PhysicalEvidence.convention,
    rawInnerColor: record.rawInnerColor,
    rawOuterColor: record.rawOuterColor,
    warnings: [...record.warnings],
  };
}

/** Apply the bounded, human-reviewed C172 construction to a cloned pilot inventory. */
export function applyConfirmedC172Construction(inventory: Inventory): Inventory {
  const cable = inventory.cables.find(item => item.id === c172PhysicalEvidence.segmentId);
  if (!cable) throw new Error(`Missing confirmed segment ${c172PhysicalEvidence.segmentId}`);

  cable.tubeCount = 4;
  cable.constructionType = '12 fibers per tube/module';
  cable.colorScheme = 'Standard 12-position sequence beginning with Blue';
  if (!cable.notes.some(note => note.includes('12-ჟილიანი ტუბის'))) {
    cable.notes.push('C172-ის ფიზიკური აგებულება მიღებულია: 4 × 12-ჟილიანი ტუბი; ფერები დეკოდირებულია Visio-ს შიდა მარკერისა და გარე რგოლის მიხედვით.');
  }

  for (let tubeNumber = 1; tubeNumber <= 4; tubeNumber += 1) {
    const tube = inventory.tubes.find(item => item.cableId === cable.id && (item.proposedNumber === tubeNumber || item.number === tubeNumber));
    if (!tube) throw new Error(`Missing C172 tube/group ${tubeNumber}`);
    const records = c172PhysicalEvidence.records.filter(record => record.tubeNumber === tubeNumber);
    const first = records[0];
    tube.number = tubeNumber;
    tube.proposedNumber = null;
    tube.basis = 'documented';
    tube.verification = 'documentation_reviewed';
    tube.physicalColor = standardColor(first.tubeColorKey);
    const rawValues = [...new Set(records.map(record => record.rawOuterColor))];
    const warnings = [...new Set(records.flatMap(record => record.warnings.filter(warning => warning.startsWith('Outer ring'))))];
    tube.physicalEvidence = {
      source: {
        file: c172PhysicalEvidence.source.file,
        page: c172PhysicalEvidence.source.page,
        pageId: c172PhysicalEvidence.source.pageId,
        part: c172PhysicalEvidence.source.part,
        shapeIds: [c172PhysicalEvidence.source.groupShapeId, ...records.map(record => record.markerShapeId)],
        rawValue: rawValues.join(', '),
        interpretationRule: c172PhysicalEvidence.interpretationRule,
        note: warnings.join(' ') || `All decoded ring values support Tube ${tubeNumber}.`,
      },
      ruleVersion: c172PhysicalEvidence.interpretationRule,
      convention: c172PhysicalEvidence.convention,
      rawOuterColor: rawValues.join(', '),
      warnings,
    };
  }

  for (const record of c172PhysicalEvidence.records) {
    const fiber = inventory.fibers.find(item => item.cableId === cable.id && item.number === record.fiberNumber);
    const tube = inventory.tubes.find(item => item.cableId === cable.id && item.number === record.tubeNumber);
    if (!fiber || !tube) throw new Error(`Missing C172/F${record.fiberNumber} or Tube ${record.tubeNumber}`);
    fiber.tubeId = tube.id;
    fiber.positionInTube = record.positionInTube;
    fiber.physicalColor = record.fiberColorKey ? standardColor(record.fiberColorKey) : unknownPhysicalColor();
    fiber.proposedColor = null;
    fiber.proposedPositionInTube = null;
    fiber.verification = 'documentation_reviewed';
    fiber.physicalEvidence = evidenceFor(record);
    fiber.notes = fiber.notes.filter(note => !note.includes('12-ჟილიანი ჯგუფი'));
    if (!fiber.notes.some(note => note.includes('Visio-ს შიდა მარკერი'))) {
      fiber.notes.push('ფიზიკური ფერი და ტუბში პოზიცია მიღებულია Visio-ს შიდა მარკერის, გარე რგოლის და დადასტურებული 12-ჟილიანი კონვენციის მიხედვით.');
    }
  }
  return inventory;
}
