import { pathToFileURL } from 'node:url';
import { writeFile } from 'node:fs/promises';

const playwrightPath = 'C:/Users/Beka/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(playwrightPath));
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const base = 'http://127.0.0.1:4173/#/route/ROUTE-TSAGERI-LENTEKHI-CORE?select=';
const result = { desktop: [], mobile: null, standalone: null, logs: [] };
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function inspect(page, name, selection, required) {
  await page.goto(`${base}${encodeURIComponent(selection)}`);
  await page.waitForSelector('.context-inspector');
  const text = await page.locator('body').innerText();
  for (const token of required) assert(text.includes(token), `${name}: missing ${token}`);
  const size = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  assert(size.scrollWidth <= size.width, `${name}: horizontal overflow ${size.scrollWidth}/${size.width}`);
  result.desktop.push({ name, selection, required, size });
}

const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await desktop.newPage();
page.on('pageerror', error => result.logs.push(`pageerror: ${error.message}`));
page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') result.logs.push(`${message.type()}: ${message.text()}`); });
await inspect(page, 'C172/F01', 'fiber:CAB-000172:1', ['AGG5 / Port 145', 'Lentekhi aggregation / Port-Fiber 1', 'C148 → C150', 'C169 → C171 → C172 → C174']);
await inspect(page, 'C172/F31', 'fiber:CAB-000172:31', ['AGG5 / Port 175', 'AP51 / Port 3', 'F175 → F31', 'F31 → F03', 'OTDR', 'Selected Fiber journey · F03']);
await inspect(page, 'C172/F29', 'fiber:CAB-000172:29', ['C171', 'C172', 'C173', 'AP51 / Port 1']);
await inspect(page, 'AP51/Port3', 'port:ap:51:3', ['C173 / F03 → AP51 / Port 3', 'in use', 'Unused does not mean free or commercially available']);
await inspect(page, 'AGG5/Port145', 'port:odf:ODF-TSAGERI-01:145', ['AGG5 / Port 145', 'Lentekhi aggregation / Port-Fiber 1']);
await inspect(page, 'AGG5/Port175', 'port:odf:ODF-TSAGERI-01:175', ['AGG5 / Port 175', 'AP51 / Port 3']);
await inspect(page, 'OpenNet', 'fiber:CAB-000172:1', ['Used by: OpenNet', 'separate from ownership']);
await page.getByRole('button', { name: 'Manager view' }).click();
await page.waitForSelector('.route-workspace.is-manager-mode');
const manager = await page.evaluate(() => ({
  engineering: getComputedStyle(document.querySelector('.fiber-engineering-details')).display,
  clarification: getComputedStyle(document.querySelector('.workspace-clarification')).display,
  banner: document.querySelector('.manager-mode-banner')?.textContent,
}));
assert(manager.engineering === 'none', 'Manager View did not hide engineering detail');
assert(manager.clarification !== 'none', 'Manager View hid genuine unresolved clarification');
result.desktop.push({ name: 'Manager View', manager });
await desktop.close();

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const mobilePage = await mobile.newPage();
mobilePage.on('pageerror', error => result.logs.push(`mobile pageerror: ${error.message}`));
mobilePage.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') result.logs.push(`mobile ${message.type()}: ${message.text()}`); });
await mobilePage.goto(`${base}${encodeURIComponent('fiber:CAB-000172:31')}`);
await mobilePage.waitForSelector('.lineage-answer-grid');
const mobileText = await mobilePage.locator('body').innerText();
const mobileState = await mobilePage.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, inspector: getComputedStyle(document.querySelector('.context-inspector')).position, journeyColumns: getComputedStyle(document.querySelector('.lineage-journey-row')).gridTemplateColumns }));
assert(mobileState.width === 390 && mobileState.scrollWidth <= 390, `Mobile overflow ${mobileState.scrollWidth}/${mobileState.width}`);
assert(mobileText.includes('AGG5 / Port 175') && mobileText.includes('AP51 / Port 3'), 'Mobile lineage answer missing');
result.mobile = mobileState;
await mobile.close();

const standaloneContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const standalonePage = await standaloneContext.newPage();
standalonePage.on('pageerror', error => result.logs.push(`standalone pageerror: ${error.message}`));
standalonePage.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') result.logs.push(`standalone ${message.type()}: ${message.text()}`); });
await standalonePage.goto(`file:///C:/Users/Beka/Desktop/Visio%20Alt/fiber-prototype.html#/route/ROUTE-TSAGERI-LENTEKHI-CORE?select=${encodeURIComponent('fiber:CAB-000172:31')}`);
await standalonePage.waitForSelector('.lineage-answer-grid');
const standaloneText = await standalonePage.locator('body').innerText();
const standaloneSize = await standalonePage.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, scripts: document.scripts.length, linkedStyles: document.querySelectorAll('link[rel="stylesheet"]').length }));
assert(standaloneText.includes('AP51 / Port 3'), 'Standalone lineage missing');
assert(standaloneSize.scrollWidth <= standaloneSize.width && standaloneSize.linkedStyles === 0, 'Standalone layout or embedding failed');
result.standalone = standaloneSize;
await standaloneContext.close();

await browser.close();
assert(result.logs.length === 0, `Browser logs: ${result.logs.join(' | ')}`);
await writeFile('docs/iteration17-browser-qa.json', `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ desktopChecks: result.desktop.length, mobile: result.mobile, standalone: result.standalone, logs: result.logs.length }));
