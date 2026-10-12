import { pathToFileURL } from 'node:url';
import { writeFile } from 'node:fs/promises';

const playwrightPath = 'C:/Users/Beka/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(playwrightPath));
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const base = 'http://127.0.0.1:4173/#/route/ROUTE-TSAGERI-LENTEKHI-CORE?select=';
const result = { desktop: [], mobile: [], standalone: null, logs: [] };
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function state(page) {
  return page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    inspectorScrollWidth: document.querySelector('.context-inspector')?.scrollWidth,
    inspectorClientWidth: document.querySelector('.context-inspector')?.clientWidth,
    managerMode: document.querySelector('.route-workspace')?.classList.contains('is-manager-mode'),
    activeSegments: [...document.querySelectorAll('.workspace-segment-shell.is-lineage-active')].map(item => item.getAttribute('data-workspace-key')),
    activeBranches: [...document.querySelectorAll('.workspace-branch.is-lineage-active')].map(item => item.getAttribute('data-workspace-segment-key')),
    lineage: document.querySelector('[data-active-lineage]')?.getAttribute('data-active-lineage'),
    openDetails: document.querySelectorAll('.context-inspector details[open]').length,
    hash: location.hash,
  }));
}

async function open(page, name, selection, required, forbidden = []) {
  await page.goto(`${base}${encodeURIComponent(selection)}`);
  await page.waitForSelector('.context-inspector');
  const text = await page.locator('.context-inspector').innerText();
  for (const token of required) assert(text.includes(token), `${name}: missing ${token}`);
  for (const token of forbidden) assert(!text.includes(token), `${name}: unexpectedly shows ${token}`);
  const current = await state(page);
  assert(current.scrollWidth <= current.width, `${name}: page overflow ${current.scrollWidth}/${current.width}`);
  assert((current.inspectorScrollWidth ?? 0) <= (current.inspectorClientWidth ?? 0), `${name}: Inspector overflow`);
  assert(current.managerMode, `${name}: Manager/simple view is not active`);
  result.desktop.push({ name, selection, state: current });
  return { text, state: current };
}

const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await desktop.newPage();
page.on('pageerror', error => result.logs.push(`pageerror: ${error.message}`));
page.on('console', message => { if (['error', 'warning'].includes(message.type())) result.logs.push(`${message.type()}: ${message.text()}`); });

await page.goto(`${base}${encodeURIComponent('segment:CAB-000176')}`);
await page.waitForSelector('.context-inspector');
await page.getByRole('button', { name: 'ჟილების ნახვა' }).click();
await page.locator('.inspector-search input').fill('F32');
await page.locator('.inspector-fiber-grid button').filter({ hasText: 'F32' }).click();
await page.waitForSelector('[data-lineage-id="GOLDEN-SC219-F32-AP52-LENTEKHI"]');
assert(page.url().includes('fiber%3ACAB-000176%3A32'), 'F32 segment workflow did not complete');

const f32 = await open(page, 'F32 AP52 to Lentekhi', 'fiber:CAB-000176:32', [
  'SC219 ↔ SC220 · 48F / F32', 'F32 · შავი', 'ლენტეხის აგრეგაცია / Port 32', 'AP52 / Port 24',
  'არჩეული ჟილის გადასვლა', 'SC219', 'C176/F32 → C175/F24', 'სრული გზა',
], ['SC218', 'AP51', 'C174/', 'C173/']);
assert(f32.state.lineage === 'GOLDEN-SC219-F32-AP52-LENTEKHI', 'F32: wrong active Lineage');
for (const id of ['CAB-000184', 'CAB-000180', 'CAB-000179', 'CAB-000178', 'CAB-000177', 'CAB-000176']) assert(f32.state.activeSegments.includes(`segment:${id}`), `F32: ${id} is not highlighted`);
for (const id of ['CAB-000174', 'CAB-000173']) assert(!f32.state.activeSegments.includes(`segment:${id}`), `F32: forbidden ${id} is highlighted`);
assert(f32.state.activeBranches.includes('segment:CAB-000175'), 'F32: AP52 branch is not highlighted');
await page.locator('[data-workspace-segment-key="segment:CAB-000175"]').scrollIntoViewIfNeeded();
await page.screenshot({ path: 'docs/iteration21-f32-desktop.png', fullPage: true });

await page.locator('[data-lineage-endpoint="AP52 / Port 24"]').scrollIntoViewIfNeeded();
await page.locator('[data-lineage-endpoint="AP52 / Port 24"]').click();
await page.waitForSelector('.context-inspector');
let text = await page.locator('.context-inspector').innerText();
assert(text.includes('AP52 · პორტი 24') && text.includes('ჟილის გზის ნახვა'), `F32: AP52 endpoint cross-navigation failed: ${text}`);
await page.getByRole('button', { name: 'ჟილის გზის ნახვა' }).click();
await page.waitForSelector('[data-lineage-id="GOLDEN-SC219-F32-AP52-LENTEKHI"]');
assert((await page.locator('.context-inspector').innerText()).includes('C176/F32 → C175/F24'), 'F32: return from AP52 did not preserve the journey');

await page.goto(`${base}${encodeURIComponent('aggregation:AGG-LENTEKHI')}`);
await page.waitForSelector('.context-inspector');
const directPort38 = page.getByRole('button', { name: 'ლენტეხის აგრეგაცია Port 38' });
if (await directPort38.count()) await directPort38.click();
else {
  await page.getByRole('button', { name: /პორტები 1–48/ }).click();
  await page.locator('.workspace-port-grid button').filter({ hasText: /^38$/ }).click();
}
await page.waitForSelector('.context-inspector');
assert((await page.locator('.context-inspector').innerText()).includes('ლენტეხის აგრეგაცია · პორტი 38'), 'Lentekhi Aggregation → Port38 click workflow failed');

await open(page, 'Lentekhi Port38', 'port:odf:ODF-LENTEKHI-01:38', [
  'ლენტეხის აგრეგაცია · პორტი 38', 'ლენტეხის აგრეგაცია ↔ SC224 · 48F / F38', 'SC225', 'ჟილის გზის ნახვა',
], ['AP51']);
await page.getByRole('button', { name: 'ჟილის გზის ნახვა' }).click();
await page.waitForSelector('[data-lineage-id="GOLDEN-LENTEKHI-P38-SC225-AP"]');
text = await page.locator('.context-inspector').innerText();
for (const token of ['ლენტეხის აგრეგაცია / Port 38', 'C184/F38 → C181/F06', 'SC224', 'SC225', 'AP53–AP54', 'დაუდგენელია']) assert(text.includes(token), `Port38 Fiber: missing ${token}`);
for (const token of ['SC223', 'SC218', 'AP51']) assert(!text.includes(token), `Port38 Fiber: unexpectedly shows ${token}`);
const p38State = await state(page);
assert(p38State.activeSegments.includes('segment:CAB-000184') && p38State.activeSegments.includes('segment:CAB-000181'), 'Port38: root-to-nested branch is not highlighted');
assert(!p38State.activeSegments.includes('segment:CAB-000180'), 'Port38: root route continues backward after SC224');
await page.locator('[data-workspace-key="segment:CAB-000181"]').scrollIntoViewIfNeeded();
await page.screenshot({ path: 'docs/iteration21-port38-desktop.png', fullPage: true });

const f37 = await open(page, 'Adjacent F37', 'fiber:CAB-000184:37', ['C184/F37 → C181/F05', 'SC224', 'SC225', 'გაგრძელება დაუდგენელია'], ['SC223', 'AP51']);
assert(f37.state.activeSegments.includes('segment:CAB-000181') && !f37.state.activeSegments.includes('segment:CAB-000180'), 'F37: adjacent branch pattern failed');
await page.screenshot({ path: 'docs/iteration21-f37-desktop.png', fullPage: true });
await desktop.close();

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const mobilePage = await mobile.newPage();
mobilePage.on('pageerror', error => result.logs.push(`mobile pageerror: ${error.message}`));
mobilePage.on('console', message => { if (['error', 'warning'].includes(message.type())) result.logs.push(`mobile ${message.type()}: ${message.text()}`); });
for (const [name, selection, required, forbidden] of [
  ['F32 mobile', 'fiber:CAB-000176:32', ['AP52 / Port 24', 'C176/F32 → C175/F24'], ['SC218', 'AP51']],
  ['Port38 mobile', 'fiber:CAB-000184:38', ['C184/F38 → C181/F06', 'AP53–AP54'], ['SC223', 'AP51']],
]) {
  await mobilePage.goto(`${base}${encodeURIComponent(selection)}`);
  await mobilePage.waitForSelector('.context-inspector');
  const mobileText = await mobilePage.locator('.context-inspector').innerText();
  for (const token of required) assert(mobileText.includes(token), `${name}: missing ${token}`);
  for (const token of forbidden) assert(!mobileText.includes(token), `${name}: unexpectedly shows ${token}`);
  const mobileState = await mobilePage.evaluate(() => ({
    width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
    inspectorScrollWidth: document.querySelector('.context-inspector')?.scrollWidth,
    inspectorClientWidth: document.querySelector('.context-inspector')?.clientWidth,
    position: getComputedStyle(document.querySelector('.context-inspector')).position,
  }));
  assert(mobileState.width === 390 && mobileState.scrollWidth <= 390, `${name}: page overflow`);
  assert((mobileState.inspectorScrollWidth ?? 0) <= (mobileState.inspectorClientWidth ?? 0), `${name}: Inspector overflow`);
  result.mobile.push({ name, state: mobileState });
}
await mobilePage.screenshot({ path: 'docs/iteration21-port38-mobile.png', fullPage: true });
await mobile.close();

const standaloneContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const standalonePage = await standaloneContext.newPage();
standalonePage.on('pageerror', error => result.logs.push(`standalone pageerror: ${error.message}`));
standalonePage.on('console', message => { if (['error', 'warning'].includes(message.type())) result.logs.push(`standalone ${message.type()}: ${message.text()}`); });
await standalonePage.goto(`file:///C:/Users/Beka/Desktop/Visio%20Alt/fiber-prototype.html#/route/ROUTE-TSAGERI-LENTEKHI-CORE?select=${encodeURIComponent('fiber:CAB-000176:32')}`);
await standalonePage.waitForSelector('[data-lineage-id="GOLDEN-SC219-F32-AP52-LENTEKHI"]');
const standaloneText = await standalonePage.locator('.context-inspector').innerText();
const standaloneState = await standalonePage.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, scripts: document.scripts.length, linkedStyles: document.querySelectorAll('link[rel="stylesheet"]').length }));
assert(standaloneText.includes('AP52 / Port 24') && standaloneText.includes('C176/F32 → C175/F24') && !standaloneText.includes('AP51'), 'Standalone F32 topology failed');
assert(standaloneState.scrollWidth <= standaloneState.width && standaloneState.linkedStyles === 0, 'Standalone layout or embedding failed');
result.standalone = standaloneState;
await standaloneContext.close();

await browser.close();
assert(result.logs.length === 0, `Browser logs: ${result.logs.join(' | ')}`);
await writeFile('docs/iteration21-browser-qa.json', `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ desktopChecks: result.desktop.length, mobileChecks: result.mobile.length, standalone: result.standalone, logs: result.logs.length }));
