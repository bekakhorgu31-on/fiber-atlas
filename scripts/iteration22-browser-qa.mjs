import { pathToFileURL } from 'node:url';
import { writeFile } from 'node:fs/promises';

const playwrightPath = 'C:/Users/Beka/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(playwrightPath));
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const root = 'http://127.0.0.1:4173/#/splice';
const result = { desktop: [], mobile: [], print: null, photo: null, standalone: null, logs: [] };
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
    width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
    sheetWidth: document.querySelector('.splice-sheet')?.scrollWidth,
    sheetClientWidth: document.querySelector('.splice-sheet')?.clientWidth,
    selectedRows: document.querySelectorAll('.splice-sheet-row.is-selected').length,
    svgLines: document.querySelectorAll('.splice-connection svg line').length,
    hash: location.hash,
  }));
  assert(state.scrollWidth <= state.width, `${name}: page overflow ${state.scrollWidth}/${state.width}`);
  assert(state.selectedRows === 1, `${name}: selected row is not unique`);
  assert(state.svgLines > 0, `${name}: connection lines are missing`);
  result.desktop.push({ name, state });
  return { text, state };
}

const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await desktop.newPage(); watch(page);
await inspect(page, 'SC218 F29 branch', `${root}/closure/218?focus=${encodeURIComponent('fiber:CAB-000172:29')}`, ['SC218','C172 ↔ C173','172-217-218-48','173-218-51-24','C172/F29','C173/F01','29 → 01']);
await page.screenshot({ path: 'docs/iteration22-sc218-f29-desktop.png', fullPage: true });

await inspect(page, 'SC219 F32 AP52', `${root}/closure/219?focus=${encodeURIComponent('fiber:CAB-000176:32')}`, ['SC219','C175 ↔ C176','175-219-52-24','176-219-220-48','C175/F24','C176/F32','ჟილა შავი'], ['AP51','C173']);
await page.screenshot({ path: 'docs/iteration22-sc219-f32-desktop.png', fullPage: true });

await inspect(page, 'AGG5 Port175', `${root}/aggregation/5?focus=${encodeURIComponent('port:ODF-TSAGERI-01:175')}`, ['AGG5','Port175','C148/F175','ტუბი 15 · ნაცრისფერი','ჟილა წითელი','ტუბი / ჯგუფი 15']);
assert((await page.locator('select').inputValue()) === '15', 'AGG5 Port175: 192F focused group is not 15');

await inspect(page, 'AP51 Port3', `${root}/ap/51?focus=${encodeURIComponent('port:51:3')}`, ['AP51','Port3','გამოიყენება','C173/F03']);

await inspect(page, 'SC224 Port38 branch', `${root}/closure/224?focus=${encodeURIComponent('fiber:CAB-000184:38')}`, ['SC224','C181 ↔ C184','C181/F06','C184/F38','06 → 38']);

await inspect(page, 'SC225 unresolved block', `${root}/closure/225?focus=${encodeURIComponent('fiber:CAB-000181:6')}`, ['SC225','C181 ↔ AP მხარე დაუზუსტებელია','0 ზუსტი · 8 დაუზუსტებელი','C181/F05','C181/F12','გაგრძელება დაუდგენელია']);

await page.getByText('ქუროს ფოტოები', { exact: true }).click();
await page.locator('input[type="file"]').setInputFiles({ name: 'sc225-overview.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZJ9sAAAAASUVORK5CYII=', 'base64') });
await page.waitForSelector('.closure-photo-grid img');
const photoText = await page.locator('.splice-photo-panel').innerText();
assert(photoText.includes('მხოლოდ ამ ბრაუზერის სესიაში') && photoText.includes('მთავარი ფოტო'), 'Closure photo session warning or primary state is missing');
result.photo = { previews: await page.locator('.closure-photo-grid img').count(), warning: true, primary: true };
await page.screenshot({ path: 'docs/iteration22-closure-photo-desktop.png', fullPage: true });

await page.emulateMedia({ media: 'print' });
result.print = await page.evaluate(() => ({ sidebar: getComputedStyle(document.querySelector('.sidebar')).display, sheet: getComputedStyle(document.querySelector('.splice-sheet')).display, printButton: getComputedStyle(document.querySelector('.splice-titlebar>.button')).display }));
assert(result.print.sidebar === 'none' && result.print.printButton === 'none' && result.print.sheet === 'grid', 'Print stylesheet does not isolate the current sheet');
await page.screenshot({ path: 'docs/iteration22-sc225-print.png', fullPage: true });
await desktop.close();

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const mobilePage = await mobile.newPage(); watch(mobilePage, 'mobile ');
for (const [name, url, required] of [
  ['SC219 F32 mobile', `${root}/closure/219?focus=${encodeURIComponent('fiber:CAB-000176:32')}`, ['C175/F24','C176/F32','ჟილა შავი']],
  ['AGG5 Port175 mobile', `${root}/aggregation/5?focus=${encodeURIComponent('port:ODF-TSAGERI-01:175')}`, ['Port175','C148/F175','ჟილა წითელი']],
  ['SC225 mobile', `${root}/closure/225?focus=${encodeURIComponent('fiber:CAB-000181:6')}`, ['8 დაუზუსტებელი','C181/F06']],
]) {
  await mobilePage.goto(url); await mobilePage.waitForSelector('.splice-sheet');
  const text = await mobilePage.locator('.splice-workspace').innerText();
  for (const token of required) assert(text.includes(token), `${name}: missing ${token}`);
  const state = await mobilePage.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, sheetClientWidth: document.querySelector('.splice-sheet')?.clientWidth }));
  assert(state.width === 390 && state.scrollWidth <= 390, `${name}: page overflow ${state.scrollWidth}`);
  result.mobile.push({ name, state });
}
await mobilePage.screenshot({ path: 'docs/iteration22-sc225-mobile.png', fullPage: true });
await mobile.close();

const standaloneContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const standalonePage = await standaloneContext.newPage(); watch(standalonePage, 'standalone ');
await standalonePage.goto(`file:///C:/Users/Beka/Desktop/Visio%20Alt/fiber-prototype.html#/splice/closure/219?focus=${encodeURIComponent('fiber:CAB-000176:32')}`);
await standalonePage.waitForSelector('.splice-sheet');
const standaloneText = await standalonePage.locator('.splice-workspace').innerText();
result.standalone = await standalonePage.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, scripts: document.scripts.length, linkedStyles: document.querySelectorAll('link[rel="stylesheet"]').length }));
assert(standaloneText.includes('C175/F24') && standaloneText.includes('C176/F32') && standaloneText.includes('ჟილა შავი') && !standaloneText.includes('AP51'), 'Standalone F32 sheet failed');
assert(result.standalone.scrollWidth <= result.standalone.width && result.standalone.linkedStyles === 0, 'Standalone embedding or layout failed');
await standaloneContext.close();

await browser.close();
assert(result.logs.length === 0, `Browser logs: ${result.logs.join(' | ')}`);
await writeFile('docs/iteration22-browser-qa.json', `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ desktop: result.desktop.length, mobile: result.mobile.length, print: result.print, photo: result.photo, standalone: result.standalone, logs: result.logs.length }));
