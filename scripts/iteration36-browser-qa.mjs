import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL('C:/Users/Beka/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'));
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const base='http://127.0.0.1:8010/?data=database',report={environment:'Windows / headless Edge / guarded local PostgreSQL 55432 / full audited Shida source; no CPU or network throttling',measurement:'Browser click event to explanation/drawing independently; two animation frames confirm painting. No concurrent full test suite.',ownerWrites:0,samples:[],checks:[],errors:[]};
const percentile=(values,p)=>values.slice().sort((a,b)=>a-b)[Math.max(0,Math.ceil(values.length*p)-1)];
try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:950}}),page=await context.newPage(),requests=[];
  page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/v1/'))requests.push({url:r.url(),method:r.method()});});
  const api=async path=>{const r=await context.request.get('http://127.0.0.1:8010/api/v1/'+path);assert.equal(r.status(),200);return r.json();};
  const session=await api('session'),revision=session.networkRevision;
  await page.goto(base+'#/review');await page.locator('[data-review-case]').first().waitFor();
  assert.equal(requests.filter(r=>new URL(r.url).pathname==='/api/v1/network').length,0,'Review startup fetched graph');
  assert.equal(requests.filter(r=>new URL(r.url).pathname==='/api/v1/review-inbox').length,1,'Revision adoption duplicated list');
  report.checks.push({width,reviewStartupGraphRequests:0,firstListRequests:1});
  for(const pass of ['first-visit','cached-revisit'])for(const category of ['fiber_port_binding_ambiguous','source_conflict','source_port_numbering','source_representation_ambiguous']){
   const data=await api('review-inbox?'+new URLSearchParams({revision,category,status:'all'})),rows=data.rows.slice(0,5);assert.ok(rows.length);
   await page.evaluate(hash=>location.hash=hash,'#/review?'+new URLSearchParams({revision,category,status:'all'}));await page.locator('[data-review-case="'+rows[0].id+'"]').waitFor();
   for(let i=0;i<5;i++){
    const row=rows[i%rows.length];if(await page.locator('[data-review-detail]').count())await page.getByRole('button',{name:'საკითხების სიაში დაბრუნება',exact:true}).click();
    await page.locator('[data-review-case="'+row.id+'"]').waitFor();const before=requests.length;await page.evaluate(id=>{window.__reviewClickStart=0;const mark=e=>{if(e.target.closest('[data-review-case]')?.getAttribute('data-review-case')===id){window.__reviewClickStart=performance.now();document.removeEventListener('click',mark,true);}};document.addEventListener('click',mark,true);},row.id);
    await page.locator('[data-review-case="'+row.id+'"]').click();const start=await page.evaluate(()=>window.__reviewClickStart);assert.ok(start>0);
    const views=category==='source_port_numbering'?1:Math.min(2,row.sourceShapeIds.length);
    const explanationReady=page.locator('[data-review-detail="'+row.id+'"] .review-direct-answer').waitFor().then(()=>page.evaluate(t=>performance.now()-t,start));
    const drawingReady=page.locator('[data-evidence-case="'+row.id+'"] svg[aria-label="Visio წყაროს გეომეტრია · Shape '+row.sourceShapeIds[0]+'"]').waitFor().then(async()=>{assert.equal(await page.locator('[data-evidence-case="'+row.id+'"] svg').count(),views);return page.evaluate(t=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(performance.now()-t)))),start);});
    const [explanationMs,drawingMs]=await Promise.all([explanationReady,drawingReady]);
    const delta=requests.slice(before),listRequests=delta.filter(r=>new URL(r.url).pathname==='/api/v1/review-inbox').length,evidenceRequests=delta.filter(r=>r.url.includes('/review-inbox/evidence?')).length;
    assert.equal(listRequests,0,'Case click reloaded list');if(pass==='cached-revisit')assert.equal(evidenceRequests,0,'Cached geometry was fetched again');
    report.samples.push({width,pass,category,caseId:row.id,explanationMs,drawingMs,listRequests,evidenceRequests,views});
   }
  }
  const svg=page.locator('.review-source-crop svg').first();await svg.scrollIntoViewIfNeeded();const oldBox=await svg.getAttribute('viewBox'),builds=await page.evaluate(()=>performance.getEntriesByName('fiber-atlas:source-static').length),box=await svg.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+35,box.y+box.height/2+15,{steps:30});await page.mouse.up();
  assert.notEqual(await svg.getAttribute('viewBox'),oldBox);assert.equal(await page.evaluate(()=>performance.getEntriesByName('fiber-atlas:source-static').length),builds,'Pan rebuilt static shapes');
  await page.locator('.review-source-tools').first().getByRole('button',{name:'მორგება',exact:true}).click();assert.equal(await svg.getAttribute('viewBox'),oldBox);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await page.screenshot({path:`docs/iteration36-review-${width}.png`,fullPage:false});
  report.checks.push({width,panSteps:30,staticRebuildsDuringPan:0,fitRestoresViewport:true,noHorizontalOverflow:true});
  // Late A/B responses and failures must never appear under a new case title.
  const ports=(await api('review-inbox?'+new URLSearchParams({revision,category:'fiber_port_binding_ambiguous',status:'all'}))).rows.slice(8,11);
  await page.route('**/review-inbox/evidence?*',async route=>{if(new URL(route.request().url()).searchParams.get('case')===ports[0].id){await new Promise(r=>setTimeout(r,250));await route.fulfill({status:503,contentType:'application/json',body:'{"message":"Isolated late A failure"}'});}else await route.continue();});
  const go=async id=>{await page.evaluate(hash=>location.hash=hash,'#/review?'+new URLSearchParams({revision,case:id,category:'fiber_port_binding_ambiguous',status:'all'}));};
  const pendingA=page.waitForRequest(r=>r.url().includes('/review-inbox/evidence?')&&new URL(r.url()).searchParams.get('case')===ports[0].id);await go(ports[0].id);await pendingA;await go(ports[1].id);await page.locator('[data-review-detail="'+ports[1].id+'"]').waitFor();await page.locator('[data-evidence-case="'+ports[1].id+'"]').waitFor();await new Promise(r=>setTimeout(r,350));assert.equal(await page.getByText('Isolated late A failure',{exact:false}).count(),0);await page.unroute('**/review-inbox/evidence?*');
  await go(ports[0].id);await page.locator('[data-evidence-case="'+ports[0].id+'"]').waitFor();let failC=true;await page.route('**/review-inbox/evidence?*',async route=>{if(failC&&new URL(route.request().url()).searchParams.get('case')===ports[2].id){failC=false;await route.fulfill({status:503,contentType:'application/json',body:'{"message":"Isolated retry check"}'});}else await route.continue();});await go(ports[2].id);await page.getByRole('button',{name:'წყაროს ხელახლა ცდა',exact:true}).waitFor();await page.getByRole('button',{name:'წყაროს ხელახლა ცდა',exact:true}).click();await page.locator('[data-evidence-case="'+ports[2].id+'"]').waitFor();await page.unroute('**/review-inbox/evidence?*');
  report.checks.push({width,lateCaseFailureIgnored:true,independentSourceRetry:true});
  // A note refreshes status/history, but does not invalidate the source drawing or load a graph.
  const owner=JSON.parse(readFileSync('.dev-runtime/iteration33-browser-owner.json'));await page.locator('.account-menu summary').click();const account=page.locator('.account-menu');await account.getByLabel('ელფოსტა').fill(owner.email);await account.getByLabel('პაროლი').fill(owner.password);await account.getByRole('button',{name:'შესვლა',exact:true}).click();await page.getByLabel('მიზეზი და მტკიცებულება').waitFor();await page.locator('[data-evidence-case="'+ports[2].id+'"]').waitFor();
  const sourceBefore=requests.filter(r=>r.url.includes('/review-inbox/evidence?')).length,noteText='Iteration36 guarded note: status freshness; no optical fact changed. '+width+' '+Date.now();await page.getByLabel('მიზეზი და მტკიცებულება').fill(noteText);const saved=page.waitForResponse(r=>r.url().endsWith('/review-events')&&r.request().method()==='POST');await page.getByRole('button',{name:'ჩანაწერის შენახვა',exact:true}).click();assert.equal((await saved).status(),201);await page.locator('.review-history-disclosure summary').first().click();await page.getByText(noteText,{exact:true}).waitFor();
  assert.equal(requests.filter(r=>r.url.includes('/review-inbox/evidence?')).length,sourceBefore,'Note reloaded geometry');assert.equal(requests.filter(r=>new URL(r.url).pathname==='/api/v1/network').length,0);
  // Changing only a list filter while retaining the case must keep its drawing.
  const filterBefore=requests.filter(r=>r.url.includes('/review-inbox/evidence?')).length;await page.evaluate(hash=>location.hash=hash,'#/review?'+new URLSearchParams({revision,case:ports[2].id,status:'all',q:'AP'}));await page.locator('[data-review-detail="'+ports[2].id+'"]').waitFor();assert.equal(requests.filter(r=>r.url.includes('/review-inbox/evidence?')).length,filterBefore);
  report.checks.push({width,noteRefreshNoGeometryRequest:true,filterOnlyNoGeometryRequest:true,noGraphDuringReadingOrNotes:true});
  await context.close();
 }
 report.percentiles=[1440,390].flatMap(width=>['first-visit','cached-revisit'].map(pass=>{const rows=report.samples.filter(r=>r.width===width&&r.pass===pass);return {width,pass,samples:rows.length,p95ExplanationMs:percentile(rows.map(r=>r.explanationMs),.95),p95DrawingMs:percentile(rows.map(r=>r.drawingMs),.95)};}));
 assert.deepEqual(report.errors,[]);writeFileSync('docs/iteration36-browser-performance.json',JSON.stringify(report,null,2));console.log(JSON.stringify({samples:report.samples.length,percentiles:report.percentiles,errors:report.errors}));
}catch(error){report.failure=error.stack;const failedPage=browser.contexts().at(-1)?.pages()[0];if(failedPage){report.failureUrl=failedPage.url();report.failureText=(await failedPage.locator('body').innerText()).slice(0,4000);}writeFileSync('docs/iteration36-browser-performance.json',JSON.stringify(report,null,2));throw error;}finally{await browser.close();}
