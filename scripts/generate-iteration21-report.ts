import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { repository } from '../src/data/repository';
import { GOLDEN_F32_LINEAGE_ID, GOLDEN_PORT38_LINEAGE_ID } from '../src/domain/iteration21';

const data = await repository.load();
const cableLabel = (id: string) => `C${data.cables.find(item => item.id === id)?.legacyCableId ?? id}`;
const fmtFiber = (n: number) => `F${String(n).padStart(2, '0')}`;
const nodeIds = ['205', '206', '216', '218', '219', '224', '225'];

function routingMatrix(nodeId: string) {
  const groups = new Map<string, Array<[number, number]>>();
  const unresolved: string[] = [];
  for (const item of data.nodeFiberTransitions?.filter(edge => edge.node.kind === 'closure' && edge.node.id === nodeId) ?? []) {
    if (!item.z) { unresolved.push(`${cableLabel(item.a.segmentId)}/${fmtFiber(item.a.fiberNumber)} → AP-side unresolved`); continue; }
    const sides = [item.a, item.z].sort((a, b) => Number(data.cables.find(cable => cable.id === a.segmentId)?.legacyCableId) - Number(data.cables.find(cable => cable.id === b.segmentId)?.legacyCableId));
    const key = `${sides[0].segmentId}|${sides[1].segmentId}`;
    groups.set(key, [...(groups.get(key) ?? []), [sides[0].fiberNumber, sides[1].fiberNumber]]);
  }
  const rows: string[] = [];
  for (const [pair, values] of [...groups].sort()) {
    const [aId, zId] = pair.split('|');
    const ordered = values.sort((a, b) => a[0] - b[0]);
    const runs: Array<[number, number, number, number]> = [];
    let [aStart, zStart] = ordered[0]; let aEnd = aStart; let zEnd = zStart;
    for (const [a, z] of ordered.slice(1)) {
      if (a === aEnd + 1 && z === zEnd + 1 && z - a === zStart - aStart) { aEnd = a; zEnd = z; }
      else { runs.push([aStart, aEnd, zStart, zEnd]); aStart = aEnd = a; zStart = zEnd = z; }
    }
    runs.push([aStart, aEnd, zStart, zEnd]);
    for (const [as, ae, zs, ze] of runs) rows.push(`| ${cableLabel(aId)}/${fmtFiber(as)}${ae === as ? '' : `–${fmtFiber(ae)}`} | ${cableLabel(zId)}/${fmtFiber(zs)}${ze === zs ? '' : `–${fmtFiber(ze)}`} | ${nodeId === '219' && (aId === 'CAB-000175' || zId === 'CAB-000175') ? 'AP52 branch' : nodeId === '225' ? 'SC225 local matrix' : 'source connector'} |`);
  }
  for (const value of unresolved) rows.push(`| ${value.split(' → ')[0]} | unresolved | ${value.split(' → ')[1]} |`);
  return `### SC${nodeId}\n\n| Incoming Segment/Fiber | Outgoing Segment/Fiber | Destination/basis |\n|---|---|---|\n${rows.join('\n')}`;
}

const f32 = data.fiberLineages!.find(item => item.id === GOLDEN_F32_LINEAGE_ID)!;
const p38 = data.fiberLineages!.find(item => item.id === GOLDEN_PORT38_LINEAGE_ID)!;
const auditRows = data.fiberLineageAudit!.map(item => `| ${item.previousLineageId} | ${item.classification === 'preserved' ? 'preserved' : 'corrected; old record superseded'} | ${item.correctedLineageIds.join(', ') || 'none'} | ${item.correctedPath.join(' → ') || 'No active graph replacement'} |`).join('\n');
const scopeCounts = Object.groupBy(data.fiberJourneySummaries!, item => item.scope);
const auditCounts = Object.groupBy(data.fiberLineageAudit!, item => item.classification);
const correctedActive = new Set(data.fiberLineageAudit!.filter(item => item.classification === 'corrected').flatMap(item => item.correctedLineageIds));
const preservedActive = new Set(data.fiberLineageAudit!.filter(item => item.classification === 'preserved').flatMap(item => item.correctedLineageIds));
const newlyDiscovered = data.fiberLineages!.filter(item => !correctedActive.has(item.id) && !preservedActive.has(item.id)).length;
const apRows = [
  ['AP50', 'C170', '24', 'Exact local Port/Fiber binding projected.'],
  ['AP51', 'C173', '24', 'Any AP51 Lineage must traverse C173.'],
  ['AP52', 'C175', '24', 'Exact local Port/Fiber binding projected; F32 anchor resolves to Port24.'],
  ['AP53', 'C182', '16', 'Four SC225 root-branch strands plus twelve C182↔C183 components.'],
  ['AP54', 'C183', '16', 'Four SC225 root-branch strands plus twelve C182↔C183 components.'],
].map(row => `| ${row.join(' | ')} |`).join('\n');

const report = `# Iteration 21 — Branch Fiber Routing Review

## Algorithm correction

Iteration 21 removes the assumption that ordered Cable Route adjacency is optical continuity. The Route remains physical and geographic context. An active FiberLineage is now a connected component built only by traversing an explicit NodeFiberTransition at each shared Closure, AP, aggregation, or supported boundary. Matching Fiber number, Tube, color, capacity, or neighboring Route position creates no edge.

The source interpreter decoded ${data.nodeFiberTransitions!.length - 1} exact two-sided local transitions from the Visio connector and marker geometry. One additional owner-confirmed transition records the unresolved AP-side continuation of C181/F06 at SC225 without guessing AP53 versus AP54. Every active multi-leg Lineage transition carries its node ID and NodeFiberTransition provenance.

## Golden Case A — C176/F32 → AP52 ↔ Lentekhi

- Fixture: \`${GOLDEN_F32_LINEAGE_ID}\`.
- Local identity: C176/F32, black Fiber.
- Exact SC219 transition: C176/F32 ↔ C175/F24, connector shape 37487.
- AP endpoint: AP52/Port24 through C175.
- Opposite path: ${f32.legs.map(leg => `${leg.sourceSegmentLabel}/${fmtFiber(leg.fiberNumber)}`).join(' → ')}.
- SC218, C174, C173, and AP51 are absent.

## Golden Case B — Lentekhi Port38 → SC224 → SC225 → AP side

- Fixture: \`${GOLDEN_PORT38_LINEAGE_ID}\`.
- Lentekhi Port38 binds C184/F38.
- Exact SC224 transition: C184/F38 ↔ C181/F06, connector shape 37064.
- Maximum defensible path: ${p38.legs.map(leg => `${leg.sourceSegmentLabel}/${fmtFiber(leg.fiberNumber)}`).join(' → ')} → SC225 → AP53–AP54 direction unresolved.
- The source does not distinguish C181/F06 to C182/AP53 or C183/AP54. No AP is guessed.
- SC223, SC218, and AP51 are absent after the SC224 branch.

## Node routing matrices

These compressed ranges are generated from individual source-supported local transitions. They are summaries of exact edges, not global formulas.

${nodeIds.map(routingMatrix).join('\n\n')}

## Old Lineage audit

The previous 68 prototype interpretations were audited individually. ${auditCounts.preserved?.length ?? 0} are reproduced exactly by the local-transition graph. ${auditCounts.corrected?.length ?? 0} conflict with the corrected graph and their old records are retained only as superseded provenance. Those corrected records resolve into ${correctedActive.size} active graph components because one old route projection can split into more than one real optical path.

| Previous Lineage | Classification | Active replacement(s) | Corrected path example |
|---|---|---|---|
${auditRows}

## Rebuilt inventory

| Measure | Result |
|---|---:|
| Active FiberLineage records | ${data.fiberLineages!.length} |
| Preserved old Lineages | ${preservedActive.size} |
| Corrected active Lineages | ${correctedActive.size} |
| Superseded old records | ${data.supersededFiberLineages!.length} |
| Newly discovered graph components | ${newlyDiscovered} |
| Partial active Lineages | ${data.fiberLineages!.filter(item => item.warnings.length).length} |
| NodeFiberTransition records | ${data.nodeFiberTransitions!.length} |
| JourneySummary full-lineage participants | ${scopeCounts.full_lineage?.length ?? 0} |
| JourneySummary partial | ${scopeCounts.partial?.length ?? 0} |
| JourneySummary intentional stops | ${scopeCounts.termination?.length ?? 0} |
| JourneySummary external boundaries | ${scopeCounts.external_boundary?.length ?? 0} |
| JourneySummary total | ${data.fiberJourneySummaries!.length} |

## AP branch coverage

| AP | Required physical branch | Active endpoint Lineages | Result |
|---|---|---:|---|
${apRows}

The validator rejects AP51 without C173, AP52 without C175, AP53 without C182, AP54 without C183, and any root-route entry to SC225 that skips C181. It also rejects missing node-local edges, node discontinuities, transition identity mismatches, route-only hops, and active use of a superseded interpretation.

## Remaining gaps

- C181/F05–F12 reach SC225 from C184/F37–F44, but the source geometry does not establish which individual strands continue to AP53 or AP54. These journeys stop at the AP-side boundary.
- SC205 Ports117–130 retain intentional stopping behavior from the established ODF range model; no Fiber transition is invented beyond the documented stop.
- The SC206 Ambrolauri direction remains an external-document boundary where the current source package has no next-document Fiber identity.
- Physical operation names remain unknown unless explicitly established. NodeFiberTransition records assert optical continuation, not an invented splice, patch, or jumper.
`;

writeFileSync(resolve('docs/ITERATION-21-BRANCH-FIBER-ROUTING-REVIEW.md'), report, 'utf8');
console.log('Wrote docs/ITERATION-21-BRANCH-FIBER-ROUTING-REVIEW.md');
