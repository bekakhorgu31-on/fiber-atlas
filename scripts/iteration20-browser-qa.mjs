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
    managerMode: document.querySelector('.route-workspace')?.classList.contains('is-manager-mode'), url: location.hash,
  }));
  assert(state.scrollWidth <= state.width, `${name}: horizontal overflow ${state.scrollWidth}/${state.width}`);
  assert((state.inspectorScrollWidth ?? 0) <= (state.inspectorClientWidth ?? 0), `${name}: Inspector overflow`);
  assert(state.openDetails === 0, `${name}: details opened by default`);
  assert(state.managerMode, `${name}: Manager/simple view is not active`);
  result.desktop.push({ name, selection, state });
  return text;
}

const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await desktop.newPage();
page.on('pageerror', error => result.logs.push(`pageerror: ${error.message}`));
page.on('console', message => { if (['error','warning'].includes(message.type())) result.logs.push(`${message.type()}: ${message.text()}`); });

await inspect(page, 'Segment naming', 'segment:CAB-000172', ['SC217 ↔ SC218 · 48F', 'Legacy C172', 'კაბელის მონაკვეთი'], ['<h2>C172']);
await inspect(page, 'C148/F23 partial journey', 'fiber:CAB-000148:23', ['AGG5 ↔ SC205 · 192F / F23', 'AGG5 / Port 23', 'SC205', 'ტუბი 2', 'ნარინჯისფერი', 'ვარდისფერი', 'ზუსტი ჟილური კავშირი', 'დაკავშირებული პორტი'], ['Full Fiber journey unresolved']);
await page.screenshot({ path: 'docs/iteration20-c148-f23-desktop.png', fullPage: true });

await inspect(page, 'AGG5 Port175', 'port:odf:ODF-TSAGERI-01:175', ['AGG5 · პორტი 175', 'პორტი → ჟილა → ტუბი → მონაკვეთი', 'AGG5 ↔ SC205 · 192F / F175', 'AP51 / Port 3', 'ჟილის გზის ნახვა']);
await inspect(page, 'AP51 Port3', 'port:ap:51:3', ['AP51 · პორტი 3', 'გამოიყენება', 'SC218 ↔ AP51 · 24F / F03', 'ლურჯი', 'მწვანე', 'შენიშვნა: OTDR', 'ჟილის გზის ნახვა']);
await inspect(page, 'AP41 Port18 partial', 'port:ap:41:18', ['AP41 · პორტი 18', 'SC205 ↔ AP41 · 24F / F18', 'ბრუნდება', 'ზუსტი ჟილური კავშირი', 'ჟილის გზის ნახვა'], ['splice', 'jumper']);
await inspect(page, 'Lentekhi Port31', 'port:odf:ODF-LENTEKHI-01:31', ['ლენტეხის აგრეგაცია · პორტი 31', 'ლენტეხის აგრეგაცია ↔ SC224 · 48F / F31', 'AP51 / Port 15', 'ჟილის გზის ნახვა'], ['endpoint remains unresolved']);

await page.goto(`${base}${encodeURIComponent('route:ROUTE-TSAGERI-LENTEKHI-CORE')}`);
await page.locator('.route-search input').fill('C172');
await page.waitForSelector('.route-search-results');
const legacySearch = await page.locator('.route-search-results').innerText();
assert(legacySearch.includes('SC217 ↔ SC218 · 48F') && legacySearch.includes('Legacy C172'), 'Legacy segment search does not show human label first');
await page.locator('.route-search input').fill('SC217');
await page.waitForSelector('.route-search-results');
assert((await page.locator('.route-search-results').innerText()).includes('SC217 ↔ SC218 · 48F'), 'Endpoint-token search did not find C172');
await desktop.close();

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const mobilePage = await mobile.newPage();
mobilePage.on('pageerror', error => result.logs.push(`mobile pageerror: ${error.message}`));
mobilePage.on('console', message => { if (['error','warning'].includes(message.type())) result.logs.push(`mobile ${message.type()}: ${message.text()}`); });
await mobilePage.goto(`${base}${encodeURIComponent('port:odf:ODF-TSAGERI-01:175')}`);
await mobilePage.waitForSelector('.context-inspector');
const mobileText = await mobilePage.locator('.context-inspector').innerText();
const mobileState = await mobilePage.evaluate(() => ({
  width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
  inspectorScrollWidth: document.querySelector('.context-inspector')?.scrollWidth,
  inspectorClientWidth: document.querySelector('.context-inspector')?.clientWidth,
  bottomSheet: getComputedStyle(document.querySelector('.context-inspector')).position,
}));
assert(mobileText.includes('AGG5 · პორტი 175') && mobileText.includes('AP51 / Port 3'), 'Mobile Port journey is incomplete');
assert(mobileState.width === 390 && mobileState.scrollWidth <= 390, `Mobile overflow ${mobileState.scrollWidth}/${mobileState.width}`);
assert((mobileState.inspectorScrollWidth ?? 0) <= (mobileState.inspectorClientWidth ?? 0), 'Mobile Inspector overflow');
await mobilePage.screenshot({ path: 'docs/iteration20-port175-mobile.png', fullPage: true });
result.mobile = mobileState;
await mobile.close();

const standaloneContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const standalonePage = await standaloneContext.newPage();
standalonePage.on('pageerror', error => result.logs.push(`standalone pageerror: ${error.message}`));
standalonePage.on('console', message => { if (['error','warning'].includes(message.type())) result.logs.push(`standalone ${message.type()}: ${message.text()}`); });
await standalonePage.goto(`file:///C:/Users/Beka/Desktop/Visio%20Alt/fiber-prototype.html#/route/ROUTE-TSAGERI-LENTEKHI-CORE?select=${encodeURIComponent('fiber:CAB-000148:23')}`);
await standalonePage.waitForSelector('.context-inspector');
const standaloneText = await standalonePage.locator('.context-inspector').innerText();
const standaloneSize = await standalonePage.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, scripts: document.scripts.length, linkedStyles: document.querySelectorAll('link[rel="stylesheet"]').length }));
assert(standaloneText.includes('AGG5 / Port 23') && standaloneText.includes('SC205') && standaloneText.includes('ზუსტი ჟილური კავშირი'), 'Standalone partial journey semantics missing');
assert(standaloneSize.scrollWidth <= standaloneSize.width && standaloneSize.linkedStyles === 0, 'Standalone layout or embedding failed');
result.standalone = standaloneSize;
await standaloneContext.close();

await browser.close();
assert(result.logs.length === 0, `Browser logs: ${result.logs.join(' | ')}`);
await writeFile('docs/iteration20-browser-qa.json', `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ desktopChecks: result.desktop.length, mobile: result.mobile, standalone: result.standalone, logs: result.logs.length }));
