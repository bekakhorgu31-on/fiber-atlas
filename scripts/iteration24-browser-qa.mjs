import { pathToFileURL } from 'node:url';
import { writeFile } from 'node:fs/promises';

const playwrightPath = 'C:/Users/Beka/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(playwrightPath));
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const root = 'http://127.0.0.1:4175/#/splice';
const result = { importer: [], desktop: [], withheld: [], relationships: [], filters: null, mobile: [], print: null, photo: null, standalone: null, logs: [] };
const assert = (condition, message) => { if (!condition) throw new Error(message); };

function watch(page, prefix = '') {
  page.on('pageerror', error => result.logs.push(`${prefix}pageerror: ${error.message}`));
  page.on('console', message => { if (['error', 'warning'].includes(message.type())) result.logs.push(`${prefix}${message.type()}: ${message.text()}`); });
}

async function inspect(page, name, url, required, forbidden = []) {
  await page.goto(url);
  await page.waitForSelector('.splice-sheet');
  const text = await page.locator('.splice-workspace').innerText();
  for (const token of required) assert(text.includes(token), `${name}: missing ${token}`);
  for (const token of forbidden) assert(!text.includes(token), `${name}: unexpectedly shows ${token}`);
  const state = await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    selectedRows: document.querySelectorAll('.splice-sheet-row.is-selected').length,
    visibleRows: document.querySelectorAll('.splice-sheet-row').length,
    svgLines: document.querySelectorAll('.splice-connection svg line').length,
    sourceBadges: document.querySelectorAll('.source-fidelity-badge').length,
    hash: location.hash,
  }));
  assert(state.scrollWidth <= state.width, `${name}: page overflow ${state.scrollWidth}/${state.width}`);
  assert(state.selectedRows === 1, `${name}: selected row is not unique`);
  assert(state.svgLines > 0, `${name}: connection lines are missing`);
  assert(state.sourceBadges === 1, `${name}: source-fidelity indicator is missing`);
  result.desktop.push({ name, state });
  return { text, state };
}

const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await desktop.newPage();
watch(page);

// Engineering-only importer certification and source evidence anchors.
await page.goto('http://127.0.0.1:4175/#/import?shape=12484');
await page.waitForSelector('.source-evidence-inspector');
let importerText = await page.locator('main').innerText();
assert(importerText.includes('CERTIFIED FOR NEXT INTERPRETATION ITERATION'), 'certification statement is missing');
assert(importerText.includes('15 / 15 gates') && importerText.includes('Shape 12484') && importerText.includes('#92d050'), 'green Port source evidence is incomplete');
result.importer.push({ shapeId: '12484', certified: true, green: true });
await page.locator('.source-shape-search input').fill('37584');
await page.locator('.source-shape-search button').click();
await page.waitForURL(/shape=37584/);
await page.waitForFunction(() => document.querySelector('.source-evidence-inspector')?.textContent?.includes('Shape 37584'));
importerText = await page.locator('.source-evidence-inspector').innerText();
const importerNormalized = importerText.toLowerCase();
assert(importerNormalized.includes('shape 37584') && importerNormalized.includes('skytel data') && importerNormalized.includes('world geometry'), `rotated company source evidence is incomplete: ${importerText.slice(0, 500)}`);
result.importer.push({ shapeId: '37584', company: 'Skytel', worldGeometry: true });

// ODF ↔ Cable. The fresh source explicitly withholds unsupported individual AGG5↔C148 bindings.
await page.goto(`${root}/aggregation/5?focus=${encodeURIComponent('port:ODF-TSAGERI-01:175')}`);
await page.waitForSelector('.empty-state');
const agg5Text = await page.locator('.splice-workspace').innerText();
assert(agg5Text.includes('შეერთებების სქემა არ მოიძებნა') && agg5Text.includes('ზუსტი ლოკალური კავშირი მიმდინარე წყაროში არ არის'), 'AGG5 unsupported exact Port↔Fiber mapping is not visibly withheld');
assert(await page.locator('.splice-sheet').count() === 0, 'AGG5 incorrectly renders an exact connection sheet');
result.withheld.push({ name: 'AGG5 exact Port↔C148 mapping', reason: 'fresh source does not prove an individual termination' });

await inspect(page, 'Lentekhi Port38 ODF to cable', `${root}/aggregation/AGG-LENTEKHI?focus=${encodeURIComponent('port:ODF-LENTEKHI-01:38')}`, ['ლენტეხის აგრეგაცია', 'Port 38', 'C184/F38', 'სტატუსი დაუდგენელია']);

// Straight and renumbered Cable ↔ Cable relationships.
await inspect(page, 'SC220 straight F32', `${root}/closure/220?focus=${encodeURIComponent('fiber:CAB-000176:32')}`, ['SC220', 'C176 ↔ C177', 'C176/F32', 'C177/F32', 'ზუსტი']);
await inspect(page, 'SC218 renumbered F29', `${root}/closure/218?focus=${encodeURIComponent('fiber:CAB-000172:29')}`, ['SC218', 'C172 ↔ C173', 'C172/F29', 'C173/F01', '29 → 01']);
await inspect(page, 'SC219 renumbered F32', `${root}/closure/219?focus=${encodeURIComponent('fiber:CAB-000176:32')}`, ['SC219', 'C175 ↔ C176', 'C175/F24', 'C176/F32', '24 → 32', 'ჟილა შავი'], ['AP51', 'C173']);
await inspect(page, 'SC224 renumbered Port38 branch', `${root}/closure/224?focus=${encodeURIComponent('fiber:CAB-000184:38')}`, ['SC224', 'C181 ↔ C184', 'C181/F06', 'C184/F38', '06 → 38']);
await page.screenshot({ path: 'docs/iteration24-sc224-port38-desktop.png', fullPage: true });

// Every AP bank, including an occupied and an unused source-style example.
for (const item of [
  ['AP41 Port1', '41', 1, 'C149/F01', 'დაკავებულია / გამოიყენება'],
  ['AP50 Port1', '50', 1, 'C170/F01', 'დაკავებულია / გამოიყენება'],
  ['AP51 Port3', '51', 3, 'C173/F03', 'დაკავებულია / გამოიყენება'],
  ['AP52 Port1', '52', 1, 'C175/F01', 'არ გამოიყენება'],
  ['AP53 Port1', '53', 1, 'C182/F01', 'დაკავებულია / გამოიყენება'],
  ['AP54 Port1', '54', 1, 'C183/F01', 'დაკავებულია / გამოიყენება'],
]) {
  await inspect(page, item[0], `${root}/ap/${item[1]}?focus=${encodeURIComponent(`port:${item[1]}:${item[2]}`)}`, [`AP${item[1]}`, `Port ${item[2]}`, item[3], item[4]]);
}

// Every branch closure exposes every local relationship in the engineering overview.
for (const item of [
  ['SC205', 205, 'fiber:CAB-000148:1', ['C148 ↔ C149', 'C148 ↔ C150', 'C149 ↔ C150']],
  ['SC216', 216, 'fiber:CAB-000169:1', ['C169 ↔ C170', 'C169 ↔ C171', 'C170 ↔ C171']],
  ['SC218', 218, 'fiber:CAB-000172:29', ['C172 ↔ C173', 'C172 ↔ C174', 'C173 ↔ C174']],
  ['SC219', 219, 'fiber:CAB-000176:32', ['C174 ↔ C175', 'C174 ↔ C176', 'C175 ↔ C176']],
  ['SC224', 224, 'fiber:CAB-000184:38', ['C180 ↔ C184', 'C181 ↔ C184']],
  ['SC225', 225, 'fiber:CAB-000181:6', ['C181 ↔ C182', 'C181 ↔ C183', 'C182 ↔ C183']],
]) {
  await page.goto(`${root}/closure/${item[1]}?focus=${encodeURIComponent(item[2])}`);
  await page.waitForSelector('.splice-sheet');
  const workspace = page.locator('.splice-workspace');
  const text = await workspace.innerText();
  for (const token of item[3]) assert(text.includes(token), `${item[0]} tabs: missing ${token}`);
  await page.locator('.splice-relationship-tabs button').filter({ hasText: 'ყველა შეერთება' }).click();
  await page.waitForSelector('.splice-completeness');
  const overview = await workspace.innerText();
  assert(overview.includes('კავშირების სისრულე'), `${item[0]}: completeness overview is missing`);
  const tableRows = await page.locator('.splice-completeness tbody tr').count();
  assert(tableRows === item[3].length, `${item[0]}: expected ${item[3].length} reconciliation rows, got ${tableRows}`);
  result.relationships.push({ node: item[0], tabs: item[3].length, reconciliationRows: tableRows });
  await page.locator('.splice-relationship-tabs button').nth(1).click();
  await page.waitForSelector('.splice-sheet');
}

// Filters operate over the fresh rows and retain the exact source identities.
await page.goto(`${root}/closure/218?focus=${encodeURIComponent('fiber:CAB-000172:29')}`);
await page.waitForSelector('.splice-sheet');
await page.getByText('ნომერი შეიცვალა', { exact: true }).click();
let filteredText = await page.locator('.splice-workspace').innerText();
assert(filteredText.includes('C172/F29') && filteredText.includes('C173/F01'), 'number-change filter lost the fresh SC218 anchor');
const numberRows = await page.locator('.splice-sheet-row').count();
await page.getByText('ტუბი შეიცვალა', { exact: true }).click();
const tubeRows = await page.locator('.splice-sheet-row').count();
await page.getByText('ჟილის ფერი შეიცვალა', { exact: true }).click();
const colorRows = await page.locator('.splice-sheet-row').count();
await page.getByText('ცვლილებები', { exact: true }).click();
const changedRows = await page.locator('.splice-sheet-row').count();
assert(numberRows > 0 && tubeRows > 0 && colorRows > 0 && changedRows > 0, 'one or more source-difference filters returned no rows');
result.filters = { numberRows, tubeRows, colorRows, changedRows };

// Closure photo workflow remains compatible with a freshly regenerated sheet.
await page.goto(`${root}/closure/225?focus=${encodeURIComponent('fiber:CAB-000181:6')}`);
await page.waitForSelector('.splice-sheet');
await page.getByText('ქუროს ფოტოები', { exact: true }).click();
await page.locator('input[type="file"]').setInputFiles({ name: 'sc225-overview.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZJ9sAAAAASUVORK5CYII=', 'base64') });
await page.waitForSelector('.closure-photo-grid img');
const photoText = await page.locator('.splice-photo-panel').innerText();
assert(photoText.includes('მხოლოდ ამ ბრაუზერის სესიაში') && photoText.includes('მთავარი ფოტო'), 'closure photo session warning or primary state is missing');
result.photo = { previews: await page.locator('.closure-photo-grid img').count(), warning: true, primary: true };

// Print stylesheet and required worksheet metadata.
await page.emulateMedia({ media: 'print' });
result.print = await page.evaluate(() => {
  const footer = document.querySelector('.splice-print-meta');
  return {
    sidebar: getComputedStyle(document.querySelector('.sidebar')).display,
    sheet: getComputedStyle(document.querySelector('.splice-sheet')).display,
    printButton: getComputedStyle(document.querySelector('.splice-titlebar>.button:last-child')).display,
    footerDisplay: footer ? getComputedStyle(footer).display : null,
    footerText: footer?.textContent ?? '',
  };
});
assert(result.print.sidebar === 'none' && result.print.printButton === 'none' && result.print.sheet === 'grid', 'print stylesheet does not isolate the current sheet');
assert(result.print.footerDisplay !== 'none' && result.print.footerText.includes('2026-09-29') && result.print.footerText.includes('caae4badc9c8'), 'print source metadata is incomplete');
await page.screenshot({ path: 'docs/iteration24-sc225-print.png', fullPage: true });
await desktop.close();

// 390px regression covers the two Golden branches, an AP Port bank and all-relationships view.
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const mobilePage = await mobile.newPage();
watch(mobilePage, 'mobile ');
for (const [name, url, required] of [
  ['SC219 F32 mobile', `${root}/closure/219?focus=${encodeURIComponent('fiber:CAB-000176:32')}`, ['C175/F24', 'C176/F32', 'ჟილა შავი']],
  ['SC224 Port38 mobile', `${root}/closure/224?focus=${encodeURIComponent('fiber:CAB-000184:38')}`, ['C181/F06', 'C184/F38']],
  ['AP41 occupied Port mobile', `${root}/ap/41?focus=${encodeURIComponent('port:41:1')}`, ['Port 1', 'დაკავებულია / გამოიყენება', 'C149/F01']],
]) {
  await mobilePage.goto(url);
  await mobilePage.waitForSelector('.splice-sheet');
  const text = await mobilePage.locator('.splice-workspace').innerText();
  for (const token of required) assert(text.includes(token), `${name}: missing ${token}`);
  const state = await mobilePage.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, sheetClientWidth: document.querySelector('.splice-sheet')?.clientWidth }));
  assert(state.width === 390 && state.scrollWidth <= 390, `${name}: page overflow ${state.scrollWidth}`);
  result.mobile.push({ name, state });
}
await mobilePage.goto(`${root}/closure/225?focus=${encodeURIComponent('fiber:CAB-000181:6')}`);
await mobilePage.waitForSelector('.splice-sheet');
await mobilePage.locator('.splice-relationship-tabs button').filter({ hasText: 'ყველა შეერთება' }).click();
await mobilePage.waitForSelector('.splice-completeness');
const mobileOverview = await mobilePage.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, rows: document.querySelectorAll('.splice-completeness tbody tr').length }));
assert(mobileOverview.scrollWidth <= 390 && mobileOverview.rows === 3, `SC225 mobile overview failed: ${JSON.stringify(mobileOverview)}`);
result.mobile.push({ name: 'SC225 all connections mobile', state: mobileOverview });
await mobilePage.goto('http://127.0.0.1:4175/#/import?shape=37584');
await mobilePage.waitForSelector('.source-evidence-inspector');
const mobileImporter = await mobilePage.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, shape: document.querySelector('.source-evidence-inspector')?.textContent?.includes('37584') }));
assert(mobileImporter.scrollWidth <= 390 && mobileImporter.shape, `importer mobile evidence failed: ${JSON.stringify(mobileImporter)}`);
result.mobile.push({ name: 'Importer Shape37584 mobile', state: mobileImporter });
await mobilePage.screenshot({ path: 'docs/iteration24-sc225-mobile.png', fullPage: true });
await mobile.close();

// Standalone export contains the same active source-derived Golden mapping with no external CSS.
const standaloneContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const standalonePage = await standaloneContext.newPage();
watch(standalonePage, 'standalone ');
await standalonePage.goto(`file:///C:/Users/Beka/Desktop/Visio%20Alt/fiber-prototype.html#/splice/closure/219?focus=${encodeURIComponent('fiber:CAB-000176:32')}`);
await standalonePage.waitForSelector('.splice-sheet');
const standaloneText = await standalonePage.locator('.splice-workspace').innerText();
result.standalone = await standalonePage.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, scripts: document.scripts.length, linkedStyles: document.querySelectorAll('link[rel="stylesheet"]').length }));
assert(standaloneText.includes('C175/F24') && standaloneText.includes('C176/F32') && standaloneText.includes('ჟილა შავი') && !standaloneText.includes('AP51'), 'standalone F32 sheet failed');
assert(result.standalone.scrollWidth <= result.standalone.width && result.standalone.linkedStyles === 0, 'standalone embedding or layout failed');
await standaloneContext.close();

await browser.close();
assert(result.logs.length === 0, `browser logs: ${result.logs.join(' | ')}`);
await writeFile('docs/iteration24-browser-qa.json', `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ importer: result.importer.length, desktop: result.desktop.length, withheld: result.withheld.length, branchNodes: result.relationships.length, filters: result.filters, mobile: result.mobile.length, print: result.print, photo: result.photo, standalone: result.standalone, logs: result.logs.length }));

