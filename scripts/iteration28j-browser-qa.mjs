import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {runWorkflows} from './iteration28j-workflows.mjs';
const {chromium}=await import(pathToFileURL('C:/Users/Beka/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'));
const stage=process.argv[2]??'before',final=stage==='after',file='C:/Users/Beka/Desktop/Visio Alt/fiber-prototype.html',url=pathToFileURL(file).href;
const result={stage,timestamp:new Date().toISOString(),sha256:createHash('sha256').update(await readFile(file)).digest('hex'),coldLoads:[],flows:[],errors:[],requests:[],authoritativeHashes:{}};
for(const dir of ['src/data','reference'])for(const name of(await readdir(dir)).filter(n=>n.endsWith('.json')).sort())result.authoritativeHashes[`${dir}/${name}`]=createHash('sha256').update(await readFile(`${dir}/${name}`)).digest('hex');
if(!final)await copyFile(file,'docs/iteration28j-before-standalone.html');
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});result.browser=await browser.version();
const setup=async(width=1440,height=900,motion='reduce')=>{const context=await browser.newContext({viewport:{width,height},offline:true,hasTouch:width<760,reducedMotion:motion}),page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))result.requests.push(r.url())});await page.addInitScript(()=>{window.__longTasks=[];new PerformanceObserver(list=>window.__longTasks.push(...list.getEntries().map(e=>e.duration))).observe({entryTypes:['longtask']})});return{context,page};};
const search=async(page,q)=>{await page.locator('#network-search').fill(q);await page.locator('.search-result').first().waitFor();await page.locator('#network-search').press('Enter');};
try{
 if(final)await runWorkflows(browser,setup,result,url);
 for(let i=0;i<3;i++){const {context,page}=await setup();const start=performance.now();await page.goto(url);await page.locator('#network-search').waitFor();await page.locator('[data-network-topology]').waitFor();result.coldLoads.push({ms:performance.now()-start,...await page.evaluate(()=>({longTasks:window.__longTasks}))});await context.close();}
 if(!final)for(const [width,height]of [[1440,900],[1366,768],[390,844],[320,844]]){
  const {context,page}=await setup(width,height);await page.goto(url);await search(page,'AP42');await page.locator('.focused-route h1').filter({hasText:'AP42'}).waitFor();await page.screenshot({path:`docs/iteration28j-before-ap42-${width}.png`});
  await page.locator('.selected-details > summary').click();await page.locator('.source-b-port').first().waitFor();
  const rail=page.locator('.context-inspector'),box=await rail.boundingBox();const scroll=async()=>page.evaluate(()=>{const rail=document.querySelector('.context-inspector'),canvas=document.querySelector('.route-canvas'),last=document.querySelector('[data-source-b-port="24"]');return{rail:{top:rail.scrollTop,client:rail.clientHeight,height:rail.scrollHeight},canvasTop:canvas.scrollTop,last:last.getBoundingClientRect().toJSON(),viewport:innerHeight}});
  const before=await scroll();await page.mouse.move(box.x+box.width/2,Math.min(height-40,box.y+100));await page.mouse.wheel(0,900);await page.waitForTimeout(150);const after=await scroll();result.flows.push({name:'baseline wheel reachability',width,height,before,after});
  await page.locator('[data-source-b-port="1"]').click();await page.locator('.focused-route h1').filter({hasText:'Port 1'}).waitFor();result.flows.push({name:'baseline Port1',width,text:await page.locator('.focused-route').innerText(),url:page.url(),detailsOpen:await page.locator('.selected-details').getAttribute('open')});await page.screenshot({path:`docs/iteration28j-before-port1-${width}.png`});await context.close();
 }
 if(final){assert.deepEqual(result.errors,[]);assert.deepEqual(result.requests,[]);assert.deepEqual(result.authoritativeHashes,JSON.parse(await readFile('docs/iteration28j-before-browser-qa.json','utf8')).authoritativeHashes);result.status='passed';}
}finally{await browser.close();await writeFile(`docs/iteration28j-${stage}-browser-qa.json`,JSON.stringify(result,null,2)+'\n');}
console.log(JSON.stringify({stage,hash:result.sha256,coldLoads:result.coldLoads,flows:result.flows.length,errors:result.errors},null,2));
