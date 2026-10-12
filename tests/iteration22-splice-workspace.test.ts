import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { loadFrozenV1Reference } from '../src/data/repository';
import { parseRoute, routeHash } from '../src/domain/navigation';
import {
  connectionSheetForFiberAtNode, connectionSheetForPort, connectionSheetForTransition,
  connectionSheetsForNode, portOperationalStatus,
} from '../src/domain/iteration22';

const data = await loadFrozenV1Reference();
const sheets = data.connectionSheets!;
const rows = sheets.flatMap(sheet => sheet.rows.map(row => ({ sheet, row })));
const findExact = (nodeId: string, left: string, leftFiber: number, right: string, rightFiber: number) => rows.find(({ sheet, row }) => sheet.node.kind === 'closure' && sheet.node.id === nodeId &&
  [[row.left.segmentId, row.left.fiberNumber, row.right.segmentId, row.right.fiberNumber], [row.right.segmentId, row.right.fiberNumber, row.left.segmentId, row.left.fiberNumber]]
    .some(value => value[0] === left && value[1] === leftFiber && value[2] === right && value[3] === rightFiber));

test('1 every active exact NodeFiberTransition is reachable from one connection sheet', () => {
  const exact = data.nodeFiberTransitions!.filter(item => item.active && item.z);
  assert.equal(exact.length, 838);
  assert.ok(exact.every(item => rows.filter(entry => entry.row.nodeFiberTransitionId === item.id).length === 1));
});
test('2 owner-confirmed F06 termination remains reachable', () => assert.ok(connectionSheetForTransition(data, 'NFT-SC225-C181-F06-TERMINATION')));
test('3 connection sheets cover operational aggregations, closures and APs', () => assert.deepEqual(
  [...new Set(sheets.map(sheet => sheet.nodeLabel))].sort(),
  ['AP41','AP50','AP51','AP52','AP53','AP54','SC205','SC206','SC216','SC217','SC218','SC219','SC220','SC221','SC222','SC223','SC224','SC225','ლენტეხის აგრეგაცია'].sort(),
));
test('4 sheet relationships are limited to supported segment pairs', () => assert.ok(sheets.filter(sheet => sheet.node.kind === 'closure').every(sheet => sheet.rows.every(row => row.nodeFiberTransitionId || row.state === 'unresolved' || row.state === 'termination'))));
test('5 SC218 branch sheet contains C172/F29 to C173/F01', () => assert.ok(findExact('218', 'CAB-000172', 29, 'CAB-000173', 1)));
test('6 SC218 branch sheet exposes legacy and exact Visio labels', () => {
  const hit = findExact('218', 'CAB-000172', 29, 'CAB-000173', 1)!;
  assert.deepEqual([hit.sheet.leftBank.legacyCableId, hit.sheet.leftBank.sourceLabel, hit.sheet.rightBank.legacyCableId, hit.sheet.rightBank.sourceLabel], ['172', '172-217-218-48', '173', '173-218-51-24']);
});
test('7 SC219 AP52 sheet contains C176/F32 to C175/F24', () => assert.ok(findExact('219', 'CAB-000176', 32, 'CAB-000175', 24)));
test('8 SC219 F32 sheet does not reference AP51 or C173', () => {
  const sheet = findExact('219', 'CAB-000176', 32, 'CAB-000175', 24)!.sheet;
  assert.equal(JSON.stringify(sheet).includes('AP51') || JSON.stringify(sheet).includes('CAB-000173'), false);
});
test('9 Lentekhi Port38 sheet binds C184/F38', () => {
  const sheet = connectionSheetForPort(data, 'odf', 'ODF-LENTEKHI-01', 38)!;
  const row = sheet.rows.find(item => item.left.portNumber === 38)!;
  assert.deepEqual([row.right.segmentId, row.right.fiberNumber], ['CAB-000184', 38]);
});
test('10 SC224 sheet carries Port38 branch from C184/F38 into C181/F06', () => assert.ok(findExact('224', 'CAB-000184', 38, 'CAB-000181', 6)));
test('11 SC225 exposes all sixteen intentional C181 terminations', () => {
  const sheet = connectionSheetsForNode(data, { kind: 'closure', id: '225' }).find(item => item.rightBank.endpointType === 'termination')!;
  assert.deepEqual(sheet.rows.map(row => row.left.fiberNumber), [5,6,7,8,9,10,11,12,17,18,19,20,21,22,23,24]);
  assert.ok(sheet.rows.every(row => row.state === 'termination' && row.right.label === 'მთავრდება SC225-ზე'));
});
test('12 AP51 Port3 opens the C173/F03 sheet row', () => {
  const row = connectionSheetForPort(data, 'ap', '51', 3)!.rows.find(item => item.left.portNumber === 3)!;
  assert.deepEqual([row.right.segmentId, row.right.fiberNumber], ['CAB-000173', 3]);
});
test('13 clean import withholds unsupported AGG5 Port175 to C148/F175 binding', () => assert.equal(connectionSheetForPort(data, 'odf', 'ODF-TSAGERI-01', 175), undefined));
test('14 mirrored Tsageri ODF still contains 192 deduplicated logical ports', () => assert.equal(data.odfPorts?.filter(item => item.odfId === 'ODF-TSAGERI-01').length, 192));
test('15 Port operational status keeps unused distinct from availability', () => {
  assert.equal(portOperationalStatus(data, 'ap', '51', 3), 'in_use');
  assert.equal(portOperationalStatus(data, 'ap', '51', 4), 'unused');
});
test('16 organization use is attached only through exact FiberUseAssignment lineages', () => {
  const organizationIds = new Set(rows.flatMap(({ row }) => [...row.left.organizationUseIds, ...row.right.organizationUseIds]));
  assert.deepEqual([...organizationIds].sort(), ['magti','opennet','silknet','skytel']);
});
test('17 connection state is encoded separately from physical fiber color', () => assert.ok(rows.every(({ row }) => ['exact','termination','unresolved','unmapped'].includes(row.state) && row.left.fiberColor !== undefined)));
test('18 one exact worksheet line maps to one transition or binding', () => assert.ok(rows.filter(({ row }) => row.state === 'exact').every(({ row }) => Number(!!row.nodeFiberTransitionId) + Number(!!row.portTopologyBindingId) === 1)));
test('19 Fiber-at-node helper finds the SC219 F32 relationship', () => assert.equal(connectionSheetForFiberAtNode(data, { kind: 'closure', id: '219' }, 'CAB-000176', 32)?.relationshipLabel, 'C175 ↔ C176'));
test('20 Splice route round-trips relationship and focus', () => {
  const route = { view: 'splice', nodeKind: 'closure', nodeId: '219', relationshipId: 'CS-closure-219-CAB-000175-CAB-000176', focus: 'fiber:CAB-000176:32' } as const;
  assert.deepEqual(parseRoute(routeHash(route)), route);
});
test('21 closure photo model is session-only in the workspace', () => {
  const source = readFileSync(new URL('../src/views/SpliceWorkspace.tsx', import.meta.url), 'utf8');
  assert.match(source, /storageMode: 'session'/);
  assert.match(source, /sessionStorage/);
  assert.match(source, /მხოლოდ ამ ბრაუზერის სესიაში/);
});
test('22 print-friendly engineering view is implemented', () => {
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(css, /@media print/);
  assert.match(css, /\.splice-sheet/);
});
test('23 connection canvas uses structured SVG and state classes', () => {
  const source = readFileSync(new URL('../src/views/SpliceWorkspace.tsx', import.meta.url), 'utf8');
  assert.match(source, /<svg viewBox=/);
  assert.match(source, /is-\$\{row\.state\}/);
});
test('24 normal Inspectors expose the Georgian Splice Workspace action', () => {
  const source = readFileSync(new URL('../src/views/RouteWorkspace.tsx', import.meta.url), 'utf8');
  assert.ok((source.match(/შეერთებების სქემა/g) ?? []).length >= 5);
  assert.match(source, /შეერთების ნახვა/);
});
test('25 clean source projection contains deterministic sheet and row totals', () => assert.deepEqual([sheets.length, rows.length], [32, 1046]));
