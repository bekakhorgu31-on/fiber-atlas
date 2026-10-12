import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL('C:/Users/Beka/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'));
const stage=process.argv[2]??'before',file='C:/Users/Beka/Desktop/Visio Alt/fiber-prototype.html',url=pathToFileURL(file).href;
const result={stage,timestamp:new Date().toISOString(),sha256:createHash('sha256').update(await readFile(file)).digest('hex'),coldLoads:[],flows:[],errors:[],requests:[],authoritativeHashes:{}};
for(const dir of ['src/data','reference'])for(const name of(await readdir(dir)).filter(n=>n.endsWith('.json')).sort())result.authoritativeHashes[`${dir}/${name}`]=createHash('sha256').update(await readFile(`${dir}/${name}`)).digest('hex');
if(stage==='before')await copyFile(file,'docs/iteration28k-before-standalone.html');
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});result.browser=await browser.version();
const setup=async(width=1440,height=900,motion='reduce')=>{const context=await browser.newContext({viewport:{width,height},offline:true,hasTouch:width<760,reducedMotion:motion}),page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))result.requests.push(r.url())});return{context,page};};
try{
 if(stage==='before'){const {context,page}=await setup();await page.goto(url);await page.locator('#network-search').fill('silknet');await page.locator('.search-result').first().waitFor();await page.locator('#network-search').press('Enter');await page.locator('.engineer-answer').waitFor();result.flows.push({name:'baseline Silknet Enter opens Engineer report',url:page.url(),text:await page.locator('.engineer-answer').innerText()});await page.screenshot({path:'docs/iteration28k-before-silknet-1440.png'});await context.close();}
 else {const {runOrganizationWorkflows}=await import('./iteration28k-workflows.mjs');await runOrganizationWorkflows(setup,result,url);assert.deepEqual(result.errors,[]);assert.deepEqual(result.requests,[]);assert.deepEqual(result.authoritativeHashes,JSON.parse(await readFile('docs/iteration28k-before-browser-qa.json','utf8')).authoritativeHashes);result.status='passed';}
 for(let i=0;i<3;i++){const {context,page}=await setup();await page.addInitScript(()=>{window.__longTasks=[];new PerformanceObserver(l=>window.__longTasks.push(...l.getEntries().map(e=>e.duration))).observe({entryTypes:['longtask']});});const start=performance.now();await page.goto(url);await page.locator('[data-network-topology]').waitFor();result.coldLoads.push({ms:performance.now()-start,longTasks:await page.evaluate(()=>window.__longTasks)});await context.close();}
}finally{await browser.close();await writeFile(`docs/iteration28k-${stage}-browser-qa.json`,JSON.stringify(result,null,2)+'\n');}console.log(JSON.stringify({stage,sha256:result.sha256,flows:result.flows.length,coldLoads:result.coldLoads,errors:result.errors},null,2));
