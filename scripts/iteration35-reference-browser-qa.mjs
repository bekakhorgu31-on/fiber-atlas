import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {repository} from '../src/data/repository.ts';
import {createCurrentFiberPathResolver} from '../src/domain/currentFiberPath.ts';
const {chromium}=await import(pathToFileURL('C:/Users/Beka/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'));
const data=await repository.load(),resolver=createCurrentFiberPathResolver(data),browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'}),base=new URL('../../fiber-prototype.html',import.meta.url).href+'?data=offline-demo';
const report={dataProfile:'actual preserved Tsageri reference; read-only offline mode',workflows:[],errors:[],screenshots:[]};
try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:950}}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  for(const [legacy,fiber]of [['176',32],['184',38],['169',12],['172',1],['172',29],['172',31]]){
   const c=data.cables.find(c=>c.legacyCableId===legacy&&c.endpointA.kind!=='network_node'),signature=resolver.resolve(c.id,fiber).signature;
   await page.goto(base+'#/fiber/'+c.id+'/'+fiber);await page.locator('.compact-fiber-journey').waitFor({timeout:90000});assert.equal(await page.locator('.compact-fiber-journey').getAttribute('data-current-path-signature'),signature);assert.equal(await page.locator('[data-animated-edge]').count(),0);
   if(legacy==='176'){await page.locator('[data-journey-node="52"]').waitFor();assert.equal(await page.locator('[data-journey-node="218"]').count(),0);assert.equal(await page.locator('[data-journey-node="51"]').count(),0);await page.locator('.compact-endpoints button').first().click();assert.equal(await page.locator('.compact-fiber-journey').getAttribute('data-current-path-signature'),signature);assert.equal(await page.locator('[data-unknown-port]').count(),0);}
   if(legacy==='184'){await page.locator('[data-journey-node="225"]').waitFor();assert.equal(await page.locator('[data-journey-node="223"]').count(),0);}
   if(legacy==='172'&&fiber===1){const before=await page.locator('[data-journey-node]').count();await page.locator('[data-grouped-stops]').first().click();assert.ok(await page.locator('[data-journey-node]').count()>before);await page.getByRole('button',{name:'შუალედური ადგილების შეკუმშვა',exact:true}).click();await page.locator('.compact-playback summary').click();await page.locator('[data-walk="play"]').click();await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForFunction(()=>document.querySelector('[data-walk="play"]')?.textContent==='დაწყება');}
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);report.workflows.push({width,selection:'C'+legacy+'/F'+fiber,pathSignature:signature});
   if(legacy==='176'){const file=`docs/iteration35-tsageri-f32-${width}.png`;await page.screenshot({path:file,fullPage:true});report.screenshots.push(file);}
  }
  await context.close();
 }
 assert.deepEqual(report.errors,[]);writeFileSync('docs/iteration35-reference-browser-qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify({workflows:report.workflows.length,errors:report.errors}));
}catch(e){report.failure=e.stack;writeFileSync('docs/iteration35-reference-browser-qa.json',JSON.stringify(report,null,2));throw e;}finally{await browser.close();}
