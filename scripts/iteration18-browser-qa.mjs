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
  const inspector = page.locator('.context-inspector');
  const text = await inspector.innerText();
  for (const token of required) assert(text.includes(token), `${name}: missing ${token}`);
  for (const token of forbidden) assert(!text.includes(token), `${name}: unexpectedly shows ${token}`);
  const state = await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    openDetails: document.querySelectorAll('.context-inspector details[open]').length,
    inspectorTextLength: document.querySelector('.context-inspector')?.textContent?.length ?? 0,
  }));
  assert(state.scrollWidth <= state.width, `${name}: horizontal overflow ${state.scrollWidth}/${state.width}`);
  assert(state.openDetails === 0, `${name}: advanced detail opened by default`);
  result.desktop.push({ name, selection, state });
  return { text, inspector };
}

const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await desktop.newPage();
page.on('pageerror', error => result.logs.push(`pageerror: ${error.message}`));
page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') result.logs.push(`${message.type()}: ${message.text()}`); });

await inspect(page, 'C172', 'segment:CAB-000172', ['C172 · 48F', 'SC217 ↔ SC218', 'საიდან მოდის', 'F01–F28', 'ლენტეხის მიმართულება', 'F29–F40', 'AP51', 'F41–F48', 'გაგრძელება დაუდგენელია', 'ტუბი 3', 'მწვანე', 'ჟილების ნახვა'], ['Legacy source label', 'PhysicalCable', 'Cable Continuity', 'G1']);
await page.screenshot({ path: 'docs/iteration18-c172-desktop.png', fullPage: true });
await inspect(page, 'SC218', 'closure:218', ['SC218', 'შემოდის', 'C172 · SC217-დან', 'მთავარი გზა', 'C174 → SC219', 'განშტოება', 'C173 → AP51', 'F01–F28', 'F29–F40', 'F41–F48'], ['Model', 'Mounting', 'Coordinates', 'accepted', 'candidate']);
await inspect(page, 'SC221', 'closure:221', ['SC221', 'C177', 'C178', 'ჟილები ამ მონაკვეთში უცვლელად აგრძელებენ'], ['განშტოება', 'No documented branch']);
await inspect(page, 'C172 Tube3', 'tube:CAB-000172:3', ['ტუბი 3 · მწვანე', 'C172 · F25–F36', 'F25–F28', 'C174 / ლენტეხი', 'F29–F36', 'C173 / AP51'], ['Continuation state', 'Unresolved members', 'G3']);
await inspect(page, 'C172/F31', 'fiber:CAB-000172:31', ['AGG5 / Port 175', 'AP51 / Port 3', 'საიდან მოდის', 'აქ', 'სად მიდის', 'სრული გზა', 'ცვლილება SC206-ზე', 'F175 → F31', 'ცვლილება SC218-ზე', 'F31 → F03', 'შენიშვნა: OTDR'], ['Prototype interpretation', 'Current local identity']);
await inspect(page, 'AP51', 'ap:51', ['AP51 · ყვედრეში', 'საიდან მოდის', 'SC218 → C173', '24', 'Port3 · გამოიყენება', 'შენიშვნა: OTDR', 'პორტების ნახვა'], ['AP / ODF containment', 'Network role']);
await page.getByRole('button', { name: 'პორტების ნახვა' }).click();
await page.getByRole('button', { name: /3 გამოიყენება/ }).click();
await page.waitForFunction(() => document.querySelector('.context-inspector h2')?.textContent?.includes('პორტი 3'));
assert((await page.locator('.context-inspector').innerText()).includes('C173 / F03 → AP51 / Port 3'), 'AP51 Port3 fiber relationship missing');
await inspect(page, 'AGG5', 'aggregation:5', ['AGG5', 'ODF · 192 პორტი', 'მიმართულებები და პორტები', 'პორტები 145–192'], ['long metadata', 'Ranges']);
await page.getByRole('button', { name: /პორტები 145–192/ }).click();
await page.getByRole('button', { name: '175', exact: true }).click();
await page.waitForFunction(() => document.querySelector('.context-inspector h2')?.textContent?.includes('პორტი 175'));
assert((await page.locator('.context-inspector').innerText()).includes('AP51 / Port 3'), 'AGG5 Port175 did not reach the F31 journey context');
await desktop.close();

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const mobilePage = await mobile.newPage();
mobilePage.on('pageerror', error => result.logs.push(`mobile pageerror: ${error.message}`));
mobilePage.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') result.logs.push(`mobile ${message.type()}: ${message.text()}`); });
await mobilePage.goto(`${base}${encodeURIComponent('fiber:CAB-000172:31')}`);
await mobilePage.waitForSelector('.lineage-answer-grid');
const mobileState = await mobilePage.evaluate(() => ({
  width: innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  inspectorScrollWidth: document.querySelector('.context-inspector')?.scrollWidth,
  inspectorClientWidth: document.querySelector('.context-inspector')?.clientWidth,
  openDetails: document.querySelectorAll('.context-inspector details[open]').length,
}));
assert(mobileState.width === 390 && mobileState.scrollWidth <= 390, `Mobile overflow ${mobileState.scrollWidth}/${mobileState.width}`);
assert((mobileState.inspectorScrollWidth ?? 0) <= (mobileState.inspectorClientWidth ?? 0), 'Mobile inspector has horizontal overflow');
assert(mobileState.openDetails === 0, 'Mobile advanced detail opened by default');
await mobilePage.screenshot({ path: 'docs/iteration18-f31-mobile.png', fullPage: true });
result.mobile = mobileState;
await mobile.close();

const standaloneContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const standalonePage = await standaloneContext.newPage();
standalonePage.on('pageerror', error => result.logs.push(`standalone pageerror: ${error.message}`));
standalonePage.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') result.logs.push(`standalone ${message.type()}: ${message.text()}`); });
await standalonePage.goto(`file:///C:/Users/Beka/Desktop/Visio%20Alt/fiber-prototype.html#/route/ROUTE-TSAGERI-LENTEKHI-CORE?select=${encodeURIComponent('fiber:CAB-000172:31')}`);
await standalonePage.waitForSelector('.lineage-answer-grid');
const standaloneText = await standalonePage.locator('.context-inspector').innerText();
const standaloneSize = await standalonePage.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, scripts: document.scripts.length, linkedStyles: document.querySelectorAll('link[rel="stylesheet"]').length }));
assert(standaloneText.includes('AP51 / Port 3') && standaloneText.includes('სრული გზა'), 'Standalone simplified lineage missing');
assert(standaloneSize.scrollWidth <= standaloneSize.width && standaloneSize.linkedStyles === 0, 'Standalone layout or embedding failed');
result.standalone = standaloneSize;
await standaloneContext.close();

await browser.close();
assert(result.logs.length === 0, `Browser logs: ${result.logs.join(' | ')}`);
await writeFile('docs/iteration18-browser-qa.json', `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ desktopChecks: result.desktop.length, mobile: result.mobile, standalone: result.standalone, logs: result.logs.length }));
