import { writeFileSync } from 'node:fs';
import { repository } from '../src/data/repository';

const data = await repository.load();
const sheets = data.connectionSheets ?? [];
const pad = (value: number | null) => value == null ? '—' : String(value).padStart(2, '0');
const rowLabel = (row: (typeof sheets)[number]['rows'][number]) => `${row.left.label} → ${row.right.label}`;
const nodeOrder = ['AGG5 · ცაგერი','SC205','AP41','SC206','SC216','AP50','SC217','SC218','AP51','SC219','AP52','SC220','SC221','SC222','SC223','SC224','ლენტეხის აგრეგაცია','SC225','AP53','AP54'];
const lines: string[] = [];
lines.push('# Iteration 22 — Splice Workspace Review', '', '## Outcome', '',
  'Fiber Atlas now provides a first-class engineering connection sheet (`შეერთებების სქემა`) for reviewed ODF, closure, and AP relationships. The operational Route remains the simple context view; the sheet shows the exact local Port/Fiber or Fiber/Fiber relationship.', '',
  'A worksheet line represents one `NodeFiberTransition` or one `PortTopologyBinding`. Line style shows evidence state. Fiber and Tube colors remain local physical attributes and never determine connectivity.', '',
  '## Inventory', '',
  `- ${sheets.length} connection sheets.`,
  `- ${sheets.reduce((sum, sheet) => sum + sheet.rows.length, 0)} visible worksheet rows.`,
  `- ${data.nodeFiberTransitions?.filter(item => item.active && item.z).length ?? 0} exact two-sided NodeFiberTransitions, each reachable from exactly one sheet.`,
  `- ${data.portTopologyBindings?.length ?? 0} PortTopologyBindings across AGG5, Lentekhi and AP41/AP50/AP51/AP52/AP53/AP54.`,
  '- SC225 C181/F05–F12 remains explicitly unresolved on the AP side; F06 retains the owner-confirmed transition record.', '',
  '## Node routing matrices', '',
  '| Node | Relationship | Exact | Unresolved | Number changes | Tube changes | Fiber-color changes | Example / range |',
  '|---|---|---:|---:|---:|---:|---:|---|');
for (const nodeLabel of nodeOrder) {
  for (const sheet of sheets.filter(item => item.nodeLabel === nodeLabel)) {
    const exact = sheet.rows.filter(row => row.state === 'exact');
    const unresolved = sheet.rows.filter(row => row.state === 'unresolved');
    const examples = sheet.rows.length ? sheet.rows.length === 1 ? rowLabel(sheet.rows[0]) : `${rowLabel(sheet.rows[0])}; …; ${rowLabel(sheet.rows.at(-1)!)}` : '—';
    lines.push(`| ${nodeLabel} | ${sheet.relationshipLabel} | ${exact.length} | ${unresolved.length} | ${sheet.rows.filter(row => row.numberChanged).length} | ${sheet.rows.filter(row => row.tubeChanged).length} | ${sheet.rows.filter(row => row.fiberColorChanged).length} | ${examples} |`);
  }
}
const sc218 = sheets.find(sheet => sheet.nodeLabel === 'SC218' && sheet.rows.some(row => row.left.segmentId === 'CAB-000172' && row.left.fiberNumber === 29 || row.right.segmentId === 'CAB-000172' && row.right.fiberNumber === 29));
const sc219 = sheets.find(sheet => sheet.nodeLabel === 'SC219' && sheet.rows.some(row => [row.left, row.right].some(side => side.segmentId === 'CAB-000176' && side.fiberNumber === 32)));
const sc224 = sheets.find(sheet => sheet.nodeLabel === 'SC224' && sheet.rows.some(row => [row.left, row.right].some(side => side.segmentId === 'CAB-000184' && side.fiberNumber === 38)));
const rowFor = (sheet: typeof sc218, segmentId: string, number: number) => sheet?.rows.find(row => [row.left, row.right].some(side => side.segmentId === segmentId && side.fiberNumber === number));
lines.push('', '## Acceptance anchors', '',
  `- SC218 branch: ${rowLabel(rowFor(sc218, 'CAB-000172', 29)!)}. Headers preserve Visio labels \`${sc218?.leftBank.sourceLabel}\` and \`${sc218?.rightBank.sourceLabel}\`.`,
  `- SC219 AP52: ${rowLabel(rowFor(sc219, 'CAB-000176', 32)!)}. The sheet contains no AP51 or C173 reference.`,
  `- Lentekhi Port38: ODF Port38 → C184/F38, then ${rowLabel(rowFor(sc224, 'CAB-000184', 38)!)} at SC224; the journey stops defensibly at the unresolved SC225 AP side.`,
  '- AGG5 Port175: Port175 → C148/F175, Grey Tube / Red Fiber, journey endpoint AP51 Port3. Company use remains absent because the source does not attach OpenNet/Magti/Silknet/Skytel to this lineage.',
  '- AP51 Port3: Port3 → C173/F03 and the same corrected full lineage.', '',
  '## Operational status and organization use', '',
  'Port status has five independent visual states: in use, unused, reserved, unavailable, and unknown. `unused` is never converted to commercial `available`. Organization text uses “uses” and appears only when a `FiberUseAssignment` supports it. The current exact company projection is OpenNet only; Magti, Silknet, and Skytel remain annotation-only and are not assigned to worksheet rows.', '',
  '## Closure photos', '',
  'The prototype defines `ClosurePhoto` and supports multiple local uploads, preview, and one primary photo. Images use browser `sessionStorage`; the UI explicitly warns that they are not saved to a persistent database.', '',
  '## Filtering, navigation, and output', '',
  '- 12-position Tube/group filters; 192F sheets default to the focused group (or group 1).',
  '- Quick Fiber/Port search.',
  '- Bidirectional navigation between Route/Fiber/Port Inspectors, the exact connection sheet, and the corrected full journey.',
  '- Print/PDF stylesheet for the current relationship sheet.',
  '- Desktop and 390px mobile layouts retain aligned banks and SVG connection lines.', '',
  '## Remaining source gaps', '',
  '- SC225 C181/F05–F12 cannot be assigned to AP53 versus AP54 without stronger source evidence; the sheet shows unresolved rows.',
  '- Port status stays unknown when neither APPortFlow nor source ODF occupancy establishes a value.',
  '- Session photos are intentionally local prototype data and require a persistent media service in a later application phase.', '',
  '## Deterministic projection', '',
  `The sheet projection is derived from ${data.nodeFiberTransitions?.length ?? 0} NodeFiberTransition records and ${data.portTopologyBindings?.length ?? 0} PortTopologyBinding records. It does not parse display labels to create optical continuity.`);
writeFileSync(new URL('../docs/ITERATION-22-SPLICE-WORKSPACE-REVIEW.md', import.meta.url), `${lines.join('\n')}\n`);
console.log(`wrote Iteration 22 report: ${sheets.length} sheets / ${sheets.reduce((sum, sheet) => sum + sheet.rows.length, 0)} rows`);
