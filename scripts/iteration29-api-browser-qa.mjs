import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL('C:/Users/Beka/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'));
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const base='http://127.0.0.1:8000/?data=database';
const baseline=JSON.parse(gunzipSync(readFileSync('migration/iteration29/baseline/active-28l-inventory.json.gz')));
const local=JSON.parse(readFileSync('.dev-runtime/backend-settings.json'));
const report={browser:await browser.version(),journeys:[],performance:[],errors:[],consoleErrors:[],screenshots:[]};
const route=selection=>base+'#/route/ROUTE-TSAGERI-LENTEKHI-CORE?context=network&select='+encodeURIComponent(selection)+'&inspect='+encodeURIComponent(selection);
const script=(file,action)=>{execFileSync('pwsh',['-NoProfile','-File',file,action],{windowsHide:true,stdio:'ignore'});};
const open=async(width=1440,height=900)=>{
 const context=await browser.newContext({viewport:{width,height},hasTouch:width<760,reducedMotion:'reduce'});
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text());});return{context,page};
};
const usable=async(page)=>{await page.locator('.network-topology-view,.ap-workspace').first().waitFor();assert.match(await page.locator('.data-source-status').innerText(),/ლოკალური მონაცემთა ბაზა/);};
const inspect=page=>page.locator('.route-workspace-body > .context-inspector');
try{
 for(const width of [1440,390]){
  const{context,page}=await open(width,width===390?844:900);
  for(const [selected,must,absent]of[
   ['fiber:CAB-000169:10',/Port 10/,null],['fiber:CAB-000169:11',/Port 11/,null],
   ['fiber:CAB-000169:12',/Silknet[\s\S]*Skytel|Skytel[\s\S]*Silknet/,null],
   ['fiber:CAB-000176:32',/AP52/,/AP51|SC218/],['fiber:CAB-000184:38',/SC225/,/AP51|SC218|SC223/],
   ['port:ap:42:16',/207/,null],['segment:CAB-000171',/F01–F48[\s\S]*C172 \/ F01–F48/,/F01–F28.*გაგრძელება დაუდგენელია/],
  ]){
   await page.goto(route(selected));await usable(page);await inspect(page).waitFor();const text=await inspect(page).innerText();assert.match(text,must);if(absent)assert.doesNotMatch(text,absent);
   if(selected==='fiber:CAB-000176:32')for(const id of ['173','174'])assert.equal(await page.locator(`[data-workspace-key="segment:CAB-000${id}"].is-optical-active`).count(),0);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false);
   report.journeys.push({width,selected,overflow});
  }
  await page.goto(route('fiber:CAB-000176:32'));await usable(page);
  await page.locator('.lineage-endpoint-action').filter({hasText:'AP52'}).first().click();assert.match(await inspect(page).innerText(),/AP52/);
  report.journeys.push({width,name:'F32 AP52 Port cross-navigation'});
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:`docs/iteration29-api-${width}.png`,fullPage:true});report.screenshots.push(`docs/iteration29-api-${width}.png`);
  await context.close();
 }
 {
  const{context,page}=await open();
  const unknown=baseline.odfPorts.find(p=>p.odfId.includes('TSAGERI')&&p.number===175);
  assert.ok(unknown);
  await page.goto(route(`port:odf:${unknown.odfId}:175`));await usable(page);assert.match(await inspect(page).innerText(),/175/);
  await page.goto(base+'#/');await page.locator('#network-search').waitFor();await page.locator('#network-search').fill('C172');await page.locator('.search-result').first().waitFor();
  const text=(await page.locator('.search-result').allTextContents()).join(' ');assert.match(text,/217|218/);assert.match(text,/225|44/);
  report.journeys.push({name:'unknown Tsageri binding and distinct C172 choices remain visible'});
  await page.getByRole('button',{name:'ინჟინრული მტკიცებულება',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.data-source-status button'));
  report.journeys.push({name:'revision-pinned engineering details load on demand'});await context.close();
 }
 // Actual authenticated UI write, restart, and independent second browser session.
 let persistedReason='Iteration 29 browser acceptance '+Date.now()+': review remains unresolved; no topology correction.';
 {
  const{context,page}=await open();await page.goto(base+'#/review');const panel=page.getByRole('region',{name:'ბაზაში შენახული მიმოხილვა'});
  await panel.getByLabel('ელფოსტა').fill('reviewer@fiber-atlas.local');await panel.getByLabel('პაროლი').fill(local.reviewerPassword);await panel.getByRole('button',{name:'შესვლა',exact:true}).click();
  await panel.getByRole('button',{name:'შენახვა ბაზაში',exact:true}).waitFor();await panel.getByLabel('მიზეზი').fill(persistedReason);await panel.getByRole('button',{name:'შენახვა ბაზაში',exact:true}).click();await panel.locator('li').filter({hasText:persistedReason}).last().waitFor();
  const forged=await context.request.post('http://127.0.0.1:8000/api/v1/review-events',{data:{},headers:{Accept:'application/json',Origin:'http://127.0.0.1:8001','Sec-Fetch-Site':'cross-site'}});
  const csrfRejected=forged.status();assert.equal(csrfRejected,419);
  report.journeys.push({name:'authenticated UI review persists; cross-site request without CSRF is rejected',csrfRejected});
  script('scripts/local-api-server.ps1','stop');script('scripts/local-backend-runtime.ps1','stop');script('scripts/local-backend-runtime.ps1','start');script('scripts/local-api-server.ps1','start');
  await page.goto(base+'#/review');await page.getByText(persistedReason,{exact:false}).last().waitFor();
  report.journeys.push({name:'review survives actual API and PostgreSQL stop/start'});await context.close();
  const second=await open();await second.page.goto(base+'#/review');await second.page.getByRole('region',{name:'ბაზაში შენახული მიმოხილვა'}).getByLabel('ელფოსტა').waitFor();
  const visible=await second.page.evaluate(async()=>{const r=await fetch('/api/v1/network');const p=await r.json();const events=await(await fetch('/api/v1/network/'+p.networkRevision+'/review-events')).json();return events.events;});assert.ok(visible.some(e=>e.reason===persistedReason));
  report.journeys.push({name:'independent browser context reads the same durable review'});await second.context.close();
 }
 for(const mode of ['api','offline'])for(let sample=0;sample<3;sample++){
  const{context,page}=await open();const url=mode==='api'?route('fiber:CAB-000169:12'):pathToFileURL('C:/Users/Beka/Desktop/Visio Alt/fiber-prototype.html').href+'#/route/ROUTE-TSAGERI-LENTEKHI-CORE?context=network&select=fiber%3ACAB-000169%3A12&inspect=fiber%3ACAB-000169%3A12';
  await page.goto(url);await page.locator('.network-topology-view').waitFor();
  const measures=await page.evaluate(()=>({usableMs:performance.now(),firstRenderMs:performance.getEntriesByName('fiber-atlas:first-render').at(-1)?.duration,parseMs:performance.getEntriesByName('fiber-atlas:api-json-parse').at(-1)?.duration,hydrateMs:performance.getEntriesByName('fiber-atlas:api-hydrate').at(-1)?.duration,heap:performance.memory?.usedJSHeapSize??null,network:performance.getEntriesByType('resource').filter(r=>r.name.endsWith('/api/v1/network')).map(r=>({encoded:r.encodedBodySize,decoded:r.decodedBodySize,duration:r.duration}))}));
  report.performance.push({mode,sample,...measures});await context.close();
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.consoleErrors,[]);
 writeFileSync('docs/iteration29-api-browser-qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify({journeys:report.journeys.length,errors:report.errors,performance:report.performance}));
}catch(e){report.failure=e.stack;writeFileSync('docs/iteration29-api-browser-qa.json',JSON.stringify(report,null,2));throw e;}finally{await browser.close();}
