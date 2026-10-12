import { pathToFileURL } from 'node:url';
import { writeFile } from 'node:fs/promises';

const playwrightPath = 'C:/Users/Beka/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(playwrightPath));
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const base = 'http://127.0.0.1:4173/#/route/ROUTE-TSAGERI-LENTEKHI-CORE?select=';
const result = { desktop: [], mobile: null, standalone: null, logs: [] };
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function inspect(page, name, selection, required, forbidden = []) {
  await page.goto(`${base}${encodeURIComponent(selection)}`);
  await page.waitForSelector('.context-inspector');
  const text = await page.locator('.context-inspector').innerText();
  for (const token of required) assert(text.includes(token), `${name}: missing ${token}`);
  for (const token of forbidden) assert(!text.includes(token), `${name}: unexpectedly shows ${token}`);
  const state = await page.evaluate(() => ({
    width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
    inspectorScrollWidth: document.querySelector('.context-inspector')?.scrollWidth,
    inspectorClientWidth: document.querySelector('.context-inspector')?.clientWidth,
    openDetails: document.querySelectorAll('.context-inspector details[open]').length,
    url: location.hash,
  }));
  assert(state.scrollWidth <= state.width, `${name}: horizontal overflow ${state.scrollWidth}/${state.width}`);
  assert((state.inspectorScrollWidth ?? 0) <= (state.inspectorClientWidth ?? 0), `${name}: Inspector overflow`);
  assert(state.openDetails === 0, `${name}: details opened by default`);
  result.desktop.push({ name, selection, state });
  return text;
}

const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await desktop.newPage();
page.on('pageerror', error => result.logs.push(`pageerror: ${error.message}`));
page.on('console', message => { if (['error','warning'].includes(message.type())) result.logs.push(`${message.type()}: ${message.text()}`); });

await inspect(page, 'AP41', 'ap:41', ['AP41 · ჩხუტელი', 'საიდან მოდის', 'SC205 → C149 → AP41', '1–16', 'შემოდის', '16–22', 'ბრუნდება მარშრუტზე', '23–24', 'აქ მთავრდება', '24 პორტი'], ['3–22 → Ambrolauri direction']);
assert(await page.locator('.workspace-port-grid.is-flow button').count() === 24, 'AP41 does not render 24 ports');
await page.screenshot({ path: 'docs/iteration19-ap41-desktop.png', fullPage: true });

const p18 = await inspect(page, 'AP41 Port18', 'port:ap:41:18', ['AP41 · პორტი 18', 'ბრუნდება', 'C149', 'F18', 'ტუბი 2', 'ჟილა 18', 'შიდა ოპერაცია დაუდგენელია'], ['splice', 'patch', 'jumper']);
assert(p18.includes('ნარინჯისფერი'), 'AP41 Port18 lacks physical Tube/Fiber labels');
assert(page.url().includes(encodeURIComponent('port:ap:41:18')), 'AP41 Port18 URL selection was not preserved');

for (const item of [
  ['50','რცხმელეთი','SC216','C170'], ['51','ყვედრეში','SC218','C173'], ['52','ხოფური','SC219','C175'],
  ['53','წანაში','SC225','C182'], ['54','ხელედი','SC225','C183'],
]) {
  const [id, name, closure, cable] = item;
  await inspect(page, `AP${id}`, `ap:${id}`, [`AP${id} · ${name}`, `${closure} → ${cable} → AP${id}`, '1–24', 'შემოდის', '24 პორტი']);
  assert(await page.locator('.workspace-port-grid.is-flow button').count() === 24, `AP${id} does not render 24 ports`);
}
await inspect(page, 'AP51 Port3', 'port:ap:51:3', ['AP51 · პორტი 3', 'გამოიყენება', 'C173', 'F03', 'შენიშვნა: OTDR', 'სრული გზის ნახვა']);

await inspect(page, 'C149 construction', 'segment:CAB-000149', ['C149 · 24F', '2 ტუბი', 'ლურჯი', 'ნარინჯისფერი'], ['G1', 'ტუბები დაუდგენელია']);
await inspect(page, 'C150 construction', 'segment:CAB-000150', ['C150 · 192F', '16 ტუბი'], ['G1', 'ტუბები დაუდგენელია']);

await inspect(page, 'Lentekhi', 'aggregation:AGG-LENTEKHI', ['ლენტეხის აგრეგაცია', 'მარშრუტის ცნობილი ბოლო წერტილი', 'SC224 → C184', 'დანიშნულება ცნობილია', 'რიცხვითი legacy იდენტიფიკატორი წინააღმდეგობრივია'], ['no canonical aggregation selected', 'endpoint remains unresolved']);

await page.goto(`${base}${encodeURIComponent('ap:41')}`);
await page.locator('.route-search input').fill('Port18');
await page.waitForSelector('.route-search-results');
assert((await page.locator('.route-search-results').innerText()).includes('AP41 / Port 18'), 'Route search does not find AP41 Port18');
await page.getByRole('option').filter({ hasText: 'AP41 / Port 18' }).click();
await page.waitForFunction(() => location.hash.includes('port%3Aap%3A41%3A18'));

await desktop.close();

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const mobilePage = await mobile.newPage();
mobilePage.on('pageerror', error => result.logs.push(`mobile pageerror: ${error.message}`));
mobilePage.on('console', message => { if (['error','warning'].includes(message.type())) result.logs.push(`mobile ${message.type()}: ${message.text()}`); });
await mobilePage.goto(`${base}${encodeURIComponent('ap:41')}`);
await mobilePage.waitForSelector('.workspace-port-grid.is-flow');
const mobileState = await mobilePage.evaluate(() => ({
  width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
  inspectorScrollWidth: document.querySelector('.context-inspector')?.scrollWidth,
  inspectorClientWidth: document.querySelector('.context-inspector')?.clientWidth,
  ports: document.querySelectorAll('.workspace-port-grid.is-flow button').length,
  columns: getComputedStyle(document.querySelector('.workspace-port-grid.is-flow')).gridTemplateColumns.split(' ').length,
}));
assert(mobileState.width === 390 && mobileState.scrollWidth <= 390, `Mobile overflow ${mobileState.scrollWidth}/${mobileState.width}`);
assert((mobileState.inspectorScrollWidth ?? 0) <= (mobileState.inspectorClientWidth ?? 0), 'Mobile Inspector overflow');
assert(mobileState.ports === 24 && mobileState.columns === 4, 'Mobile AP port grid is not compact 4×6');
await mobilePage.screenshot({ path: 'docs/iteration19-ap41-mobile.png', fullPage: true });
result.mobile = mobileState;
await mobile.close();

const standaloneContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const standalonePage = await standaloneContext.newPage();
standalonePage.on('pageerror', error => result.logs.push(`standalone pageerror: ${error.message}`));
standalonePage.on('console', message => { if (['error','warning'].includes(message.type())) result.logs.push(`standalone ${message.type()}: ${message.text()}`); });
await standalonePage.goto(`file:///C:/Users/Beka/Desktop/Visio%20Alt/fiber-prototype.html#/route/ROUTE-TSAGERI-LENTEKHI-CORE?select=${encodeURIComponent('aggregation:AGG-LENTEKHI')}`);
await standalonePage.waitForSelector('.context-inspector');
const standaloneText = await standalonePage.locator('.context-inspector').innerText();
const standaloneSize = await standalonePage.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, scripts: document.scripts.length, linkedStyles: document.querySelectorAll('link[rel="stylesheet"]').length }));
assert(standaloneText.includes('დანიშნულება ცნობილია') && standaloneText.includes('C184'), 'Standalone Lentekhi semantics missing');
assert(standaloneSize.scrollWidth <= standaloneSize.width && standaloneSize.linkedStyles === 0, 'Standalone layout or embedding failed');
result.standalone = standaloneSize;
await standaloneContext.close();

await browser.close();
assert(result.logs.length === 0, `Browser logs: ${result.logs.join(' | ')}`);
await writeFile('docs/iteration19-browser-qa.json', `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ desktopChecks: result.desktop.length, mobile: result.mobile, standalone: result.standalone, logs: result.logs.length }));
