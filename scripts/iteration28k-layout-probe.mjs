import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL('C:/Users/Beka/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'));
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'}),page=await browser.newPage({viewport:{width:390,height:844}});
await page.goto(pathToFileURL('C:/Users/Beka/Desktop/Visio Alt/fiber-prototype.html').href+'#/organization/silknet');await page.locator('[data-organization]').waitFor();
for(const width of [390,320]){
 await page.setViewportSize({width,height:844});await page.goto(pathToFileURL('C:/Users/Beka/Desktop/Visio Alt/fiber-prototype.html').href+'#/organization/silknet');await page.locator('[data-organization]').waitFor();await page.screenshot({path:`docs/iteration28k-mobile-header-${width}.png`});await page.locator('[data-org-strand]').first().click();await page.locator('.is-optical li').first().scrollIntoViewIfNeeded();await page.screenshot({path:`docs/iteration28k-mobile-diagram-${width}.png`});
 console.log({width,document:await page.evaluate(()=>document.documentElement.scrollWidth)});
}
await browser.close();
