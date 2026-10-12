import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL('C:/Users/Beka/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'));
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'}),report={workflows:[],errors:[]};
try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:950}}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto('http://127.0.0.1:8010/?data=database#/review?q=AP18+Port1');await page.locator('[data-review-case]').first().click();await page.locator('[data-review-detail]').waitFor();const original=page.url();await page.getByRole('button',{name:'ობიექტის რუკაზე ნახვა',exact:true}).first().click();await page.locator('[data-unknown-port]').waitFor();assert.ok(new URL(page.url()).hash.includes('select=port%3Aap%3ASHIDA-NODE-'));assert.ok(new URL(page.url()).hash.endsWith('%3A1'));assert.equal(await page.locator('.compact-fiber-journey').count(),0);await page.goBack();await page.locator('[data-review-detail]').waitFor();assert.equal(page.url(),original);
  await page.locator('body').click({position:{x:380,y:15}});await page.keyboard.press('/');assert.equal(await page.locator('#network-search').evaluate(el=>el===document.activeElement),true);await page.keyboard.press('Escape');
  report.workflows.push({width,name:'exact AP18 Port1 review-to-place and Back restore context; keyboard search shortcut'});await context.close();
 }
 assert.deepEqual(report.errors,[]);writeFileSync('docs/iteration35-navigation-browser-qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify({workflows:report.workflows.length,errors:report.errors}));
}catch(e){report.failure=e.stack;writeFileSync('docs/iteration35-navigation-browser-qa.json',JSON.stringify(report,null,2));throw e;}finally{await browser.close();}
