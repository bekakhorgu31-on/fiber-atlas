import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL('C:/Users/Beka/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'));
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const appUrl = pathToFileURL('C:/Users/Beka/Desktop/Visio Alt/fiber-prototype.html').href;
const results = { browser: await browser.version(), journeys: [], errors: [] };
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => results.errors.push(error.message));
  const routeUrl = selection => `${appUrl}#/route/ROUTE-TSAGERI-LENTEKHI-CORE?context=network&select=${encodeURIComponent(selection)}&inspect=${encodeURIComponent(selection)}`;
  await page.goto(routeUrl('segment:CAB-000171'));
  await page.locator('.route-workspace-body > .context-inspector').waitFor();
  let inspector = page.locator('.route-workspace-body > .context-inspector');
  let text = await inspector.innerText();
  assert.match(text, /SC217/);
  assert.match(text, /F01–F48[\s\S]*C172 \/ F01–F48/);
  assert.doesNotMatch(text, /F01–F28.*გაგრძელება დაუდგენელია/);
  await page.screenshot({ path: 'docs/iteration29-01-c171-cable.png', fullPage: true });
  results.journeys.push({ name: 'C171 active Cable Inspector shows graph-backed SC217 continuation', summary: text.match(/F01–F48\n→ C172 \/ F01–F48/)?.[0] ?? null });

  await page.goto(routeUrl('tube:CAB-000171:1'));
  inspector = page.locator('.route-workspace-body > .context-inspector');
  await inspector.waitFor(); text = await inspector.innerText();
  assert.match(text, /SC217/);
  assert.match(text, /F01–F12[\s\S]*C172 \/ F01–F12/);
  assert.doesNotMatch(text, /F01–F12.*გაგრძელება დაუდგენელია/);
  results.journeys.push({ name: 'C171 Tube 1 Inspector uses the same current transition projection' });

  for (const query of ['C171', 'C171 Tube 1']) {
    await page.goto(`${appUrl}#/`);
    await page.locator('#network-search').fill(query);
    await page.locator('.search-result').first().waitFor();
    await page.locator('.search-result').first().click();
    inspector = page.locator('.route-workspace-body > .context-inspector');
    await inspector.waitFor(); text = await inspector.innerText();
    assert.match(text, /SC217/);
    assert.doesNotMatch(text, /F01–F28.*გაგრძელება დაუდგენელია/);
    results.journeys.push({ name: `${query} search result opens current Cable/Tube continuation context` });
  }
  assert.deepEqual(results.errors, []);
  console.log(JSON.stringify(results, null, 2));
  await context.close();
} finally { await browser.close(); }
