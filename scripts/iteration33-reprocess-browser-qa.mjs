import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const {chromium}=await import(pathToFileURL('C:/Users/Beka/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'));
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const base='http://127.0.0.1:8010/?data=database';
const verifyOnly=process.argv.includes('--verify-only');
const owner=JSON.parse(readFileSync('.dev-runtime/iteration33-browser-owner.json'));
const ticket=verifyOnly?null:JSON.parse(readFileSync('.dev-runtime/owner-setup-local.json'));
const report=verifyOnly?JSON.parse(readFileSync('docs/iteration33-reprocess-browser-qa.json')):{iteration:33,scope:'actual large-source upload, geometry reprocess and owner UI; topology interpretation pending',dataProfile:'loopback fiber_atlas_test / fiber_isolation',storage:'isolated app/isolation-private',ownerServerWrites:0,journeys:[],errors:[],externalRequests:[],screenshots:[]};
const open=async width=>{
 const context=await browser.newContext({viewport:{width,height:width===390?844:900},reducedMotion:'reduce'});
 const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
 await page.route('**/*',async route=>{const url=new URL(route.request().url());if(['http:','https:'].includes(url.protocol)&&url.host!=='127.0.0.1:8010'){report.externalRequests.push(url.origin);await route.abort();}else await route.continue();});
 return {context,page};
};
const overflow=async page=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
const session=page=>page.evaluate(async()=>await(await fetch('/api/v1/session')).json());
const runs=page=>page.evaluate(async()=>await(await fetch('/api/v1/imports')).json());
const snapshot=async(page,width)=>{await overflow(page);const path=`docs/iteration33-geometry-${width}.png`;await page.screenshot({path,fullPage:true});if(!report.screenshots.includes(path))report.screenshots.push(path);};

if(verifyOnly){
 try{
  for(const width of [1440,390]){
   const {context,page}=await open(width);await page.goto(base+'#/import');await page.locator('.import-account-prompt').getByRole('button',{name:'შესვლა',exact:true}).click();const account=page.locator('.account-menu');await account.getByLabel('ელფოსტა').fill(owner.email);await account.getByLabel('პაროლი').fill(owner.password);await account.getByRole('button',{name:'შესვლა',exact:true}).click();await page.getByRole('button',{name:'შენახული ფაილის გეომეტრიის დამუშავება',exact:true}).waitFor();
   assert.equal((await session(page)).reviewCount,1);assert.equal((await runs(page)).runs.length,2);await page.locator('nav .nav-link').nth(3).locator('span').filter({hasText:'1'}).waitFor({state:'attached'});await snapshot(page,width);
   await page.goto(base+'#/review');await page.getByRole('heading',{name:'შესამოწმებელი',exact:true}).waitFor();await page.getByText('წყაროს გეომეტრია ამოღებულია · ქსელის ტოპოლოგია ჯერ არ განმარტებულა',{exact:true}).waitFor();await overflow(page);assert.equal(await page.getByRole('button',{name:'ქსელში დამატება',exact:true}).count(),0);report.journeys.push({width,case:'pending decoded source is visible in Needs Review; badge counts one source revision and both immutable runs remain visible'});await context.close();
  }
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.externalRequests,[]);delete report.failure;writeFileSync('docs/iteration33-reprocess-browser-qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify({journeys:report.journeys.length,errors:report.errors}));
 }catch(error){report.failure=error.stack;writeFileSync('docs/iteration33-reprocess-browser-qa.json',JSON.stringify(report,null,2));throw error;}finally{await browser.close();}
}else try{
 const {context,page}=await open(1440);
 await page.goto(base+'&setup='+encodeURIComponent(ticket.token));
 const account=page.locator('.account-menu');
 await account.getByLabel('თქვენი სახელი').fill(owner.name);await account.getByLabel('ელფოსტა').fill(owner.email);await account.getByLabel('პაროლი').fill(owner.password);
 await account.getByRole('button',{name:'ჩემი ანგარიშის შექმნა'}).click();
 await page.locator('.account-menu > summary').filter({hasText:owner.name}).waitFor();
 report.journeys.push({case:'owner setup in actual isolated application'});
 await page.goto(base+'#/import');await page.locator('input[type=file]').setInputFiles('../შიდა ქართლი 2026.vsdx');
 const upload=page.waitForResponse(response=>response.url().endsWith('/api/v1/imports')&&response.request().method()==='POST',{timeout:240000});
 await page.getByRole('button',{name:'ფაილის დამუშავება',exact:true}).click();const uploadResponse=await upload;assert.equal(uploadResponse.status(),201);const inventory=await uploadResponse.json();
 await page.getByText('ფაილი შენახულია · გეომეტრია ჯერ არ ამოღებულა',{exact:true}).waitFor();
 report.journeys.push({case:'actual 6.7 MB owner source staged with inventory-only status'});console.log('Actual-source upload completed; starting geometry reprocess.');
 const reprocess=page.waitForResponse(response=>response.url().endsWith('/reprocess')&&response.request().method()==='POST',{timeout:300000});
 await page.getByRole('button',{name:'შენახული ფაილის გეომეტრიის დამუშავება',exact:true}).click();
 const geometryResponse=await reprocess;assert.equal(geometryResponse.status(),200);const geometry=await geometryResponse.json();assert.notEqual(geometry.id,inventory.id);
 await page.getByText('წყაროს გეომეტრია ამოღებულია · ქსელის ტოპოლოგია ჯერ არ განმარტებულა',{exact:true}).waitFor();
 const history=(await runs(page)).runs;assert.equal(history.length,2);const decoded=history.find(r=>r.id===geometry.id),old=history.find(r=>r.id===inventory.id);
 const summary=typeof decoded.summary==='string'?JSON.parse(decoded.summary):decoded.summary;
 assert.equal(decoded.source_revision,old.source_revision);assert.equal(decoded.semantic_status,'not_evaluated');assert.equal(summary.summary.shapes_including_subshapes,62670);assert.equal(summary.summary.connect_rows_valid,330);assert.equal(summary.topologyProjected,false);assert.equal(summary.priorInventoryRun,inventory.id);
 assert.ok(summary.pages[0].dimensions.width>300);assert.ok(summary.resources.peak_working_set_bytes<=256*1024*1024);assert.ok(summary.resources.total_processing_seconds<300);assert.equal(summary.progress.phase,'completed');
 assert.equal(await page.getByRole('button',{name:'ქსელში დამატება',exact:true}).count(),0);
 const network=await page.evaluate(async()=>await(await fetch('/api/v1/network')).json());assert.equal(network.networkState,'empty');assert.equal(network.networkRevision,null);
 report.resources=summary.resources;report.sourceSha256=summary.source.sha256;report.shapes=62670;report.connectReferences=330;report.journeys.push({case:'real reprocess, 62,670 persisted geometry Shapes, unchanged source revision and inventory history, no proposal or activation'});
 await snapshot(page,1440);
 const article=page.locator('.import-history article').first();await article.locator('details > summary').click();await article.getByRole('button',{name:'წყაროს ჩანაწერები'}).click();
 await page.getByRole('button',{name:'25-123-25017-16-24',exact:true}).click();await page.locator('.source-json').waitFor();assert.match(await page.locator('.source-json').innerText(),/12639/);
 // Read a known individual marker through the exact new-run API rather than trusting only a count.
 const marker=await page.evaluate(async ({revision,run})=>await(await fetch('/api/v1/source-shape?'+new URLSearchParams({sourceRevision:revision,importRun:run,pageId:'0',shapeId:'12643'}))).json(),{revision:decoded.source_revision,run:geometry.id});
 assert.equal(marker.shape.parent_id,'12640');assert.equal(marker.shape.effective_style.FillForegnd.rgb,'#0000ff');assert.ok(marker.shape.geometry.local_to_page.length===6);
 report.journeys.push({case:'five-field source label and blue marker evidence opened from the versioned source index'});
 await page.reload();await page.getByRole('button',{name:'შენახული ფაილის გეომეტრიის დამუშავება',exact:true}).waitFor();assert.equal((await session(page)).user.role,'reviewer');
 const repeat=page.waitForResponse(response=>response.url().endsWith('/reprocess')&&response.request().method()==='POST',{timeout:30000});await page.getByRole('button',{name:'შენახული ფაილის გეომეტრიის დამუშავება',exact:true}).click();const reused=await(await repeat).json();assert.equal(reused.id,geometry.id);assert.equal(reused.reused,true);assert.equal((await runs(page)).runs.length,2);
 report.journeys.push({case:'reload and idempotent reprocess preserve exactly two history runs'});await context.close();

 const mobile=await open(390);await mobile.page.goto(base+'#/import');await mobile.page.getByText('ფაილის ასატვირთად შედით თქვენს ანგარიშში.').waitFor();assert.equal(await mobile.page.getByRole('button',{name:'შენახული ფაილის გეომეტრიის დამუშავება',exact:true}).count(),0);
 await mobile.page.locator('.import-account-prompt').getByRole('button',{name:'შესვლა',exact:true}).click();const mobileAccount=mobile.page.locator('.account-menu');await mobileAccount.getByLabel('ელფოსტა').fill(owner.email);await mobileAccount.getByLabel('პაროლი').fill(owner.password);await mobileAccount.getByRole('button',{name:'შესვლა',exact:true}).click();await mobile.page.getByRole('button',{name:'შენახული ფაილის გეომეტრიის დამუშავება',exact:true}).waitFor();await snapshot(mobile.page,390);
 if(!await mobile.page.locator('.app-navigation').evaluate(element=>element.open))await mobile.page.locator('.app-navigation summary').click();assert.deepEqual((await mobile.page.locator('nav .nav-link').allTextContents()).map(t=>t.trim().replace(/\s+\d+$/,'')),['ქსელი','ინჟინრის ძიება','Visio იმპორტი','შესამოწმებელი']);await mobile.page.locator('nav .nav-link').nth(1).focus();await mobile.page.keyboard.press('Enter');await mobile.page.getByRole('heading',{name:'ინჟინრის ძიება',exact:true}).waitFor();await overflow(mobile.page);
 report.journeys.push({width:390,case:'fresh-session sign-in, accurate geometry status, four navigation entries, keyboard Engineer Search and no horizontal overflow'});await mobile.context.close();
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.externalRequests,[]);writeFileSync('docs/iteration33-reprocess-browser-qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify({journeys:report.journeys.length,errors:report.errors,resources:report.resources}));
}catch(error){report.failure=error.stack;writeFileSync('docs/iteration33-reprocess-browser-qa.json',JSON.stringify(report,null,2));throw error;}finally{await browser.close();}
