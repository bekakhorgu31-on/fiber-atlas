import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const { chromium } = await import(pathToFileURL('C:/Users/Beka/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'));
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const base = 'http://127.0.0.1:8010/?data=database';
const expectedNavigation = ['ქსელი', 'ინჟინრის ძიება', 'Visio იმპორტი', 'შესამოწმებელი'];
const report = { task: '32-07', dataProfile: 'isolated local QA', ownerServerWrites: 0, journeys: [], errors: [] };

const newPage = async width => {
  const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  return { context, page };
};
const assertNavigation = async page => {
  const links = await page.locator('nav[aria-label="მთავარი ნავიგაცია"] .nav-link').allTextContents();
  assert.deepEqual(links.map(text => text.trim().replace(/\s+\d+$/, '')), expectedNavigation);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
};

try {
  for (const width of [1440, 390]) {
    const { context, page } = await newPage(width);
    await page.route('**/api/v1/network', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ apiVersion: 1, networkState: 'empty', networkRevision: null }) }));
    await page.goto(base);
    await page.getByRole('heading', { name: 'ქსელი ჯერ არ არის იმპორტირებული' }).waitFor();
    if (!await page.locator('.app-navigation').evaluate(element => element.open)) await page.locator('.app-navigation summary').click();
    await assertNavigation(page);
    await page.locator('nav .nav-link').nth(1).focus();
    await page.keyboard.press('Enter');
    await page.getByRole('heading', { name: 'ინჟინრის ძიება' }).waitFor();
    assert.equal(await page.locator('nav .nav-link').nth(1).getAttribute('aria-current'), 'page');
    await page.locator('#main-content').getByRole('button', { name: 'Visio იმპორტი', exact: true }).click();
    await page.getByText('იმპორტის ისტორია ცარიელია.').waitFor();
    report.journeys.push({ width, case: 'empty-network Engineer Search, keyboard entry, active state and Import Visio' });
    await context.close();
  }

  for (const width of [1440, 390]) {
    const { context, page } = await newPage(width);
    await page.goto(`${base}#/engineer`);
    await page.getByRole('heading', { name: 'მოძებნე ან ჰკითხე Fiber Atlas-ს' }).waitFor();
    if (!await page.locator('.app-navigation').evaluate(element => element.open)) await page.locator('.app-navigation summary').click();
    await assertNavigation(page);
    assert.equal(await page.locator('nav .nav-link').nth(1).getAttribute('aria-current'), 'page');
    await page.getByLabel('მოძებნე ან დასვი ქსელის კითხვა').fill('C151/F1 სად მიდის?');
    await page.getByRole('button', { name: 'ძიება', exact: true }).click();
    await page.locator('.engineer-answer').waitFor();
    await page.getByRole('button', { name: 'ქსელში ჩვენება', exact: true }).click();
    await page.locator('.network-topology-view').waitFor();
    await page.goBack();
    await page.locator('.engineer-answer').waitFor();
    assert.equal(await page.locator('#engineer-query').inputValue(), 'C151/F1 სად მიდის?');
    report.journeys.push({ width, case: 'populated direct Engineer Search → map → Back restores query' });
    await context.close();
  }

  assert.deepEqual(report.errors, []);
  writeFileSync('docs/iteration32-07-engineer-search-qa.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ journeys: report.journeys.length, errors: report.errors, ownerServerWrites: report.ownerServerWrites }));
} catch (error) {
  report.failure = error.stack;
  writeFileSync('docs/iteration32-07-engineer-search-qa.json', JSON.stringify(report, null, 2));
  throw error;
} finally {
  await browser.close();
}
