import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const {chromium}=await import(pathToFileURL('C:/Users/Beka/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'));
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const stage=process.argv[2]??'final',final=stage==='final';
const file='C:/Users/Beka/Desktop/Visio Alt/fiber-prototype.html',url=pathToFileURL(file).href;
const result={stage,timestamp:new Date().toISOString(),browser:'Microsoft Edge (Chromium headless, Playwright)',profile:'Desktop 1440×900 and emulated mobile 390×844; offline file://; not a real phone',sha256:createHash('sha256').update(await readFile(file)).digest('hex'),loadMs:null,searchMs:{},gridMs:null,longTasks:[],externalRequests:[],browserErrors:[],overflow:[],flows:[]};
const setup=async viewport=>{
  const context=await browser.newContext({viewport,offline:true});
  const page=await context.newPage();
  page.on('pageerror',e=>result.browserErrors.push(e.message));
  page.on('console',m=>{if(['error','warning'].includes(m.type()))result.browserErrors.push(m.text())});
  page.on('request',r=>{if(/^https?:/i.test(r.url()))result.externalRequests.push(r.url())});
  await page.addInitScript(()=>{window.__longTasks=[];try{new PerformanceObserver(list=>window.__longTasks.push(...list.getEntries().map(e=>Math.round(e.duration)))).observe({entryTypes:['longtask']})}catch{}});
  return {context,page};
};
const visibleWidth=async(page,flow)=>{const sizes=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));result.overflow.push({flow,...sizes});if(final)assert.ok(sizes.document<=sizes.viewport,`${flow}: ${JSON.stringify(sizes)}`);};
const flow=(name,expected,actual)=>result.flows.push({name,expected,actual});
try{
  const {context,page}=await setup({width:1440,height:900});
  let start=performance.now();await page.goto(url,{waitUntil:'load'});await page.locator('#network-search').waitFor();result.loadMs=Math.round(performance.now()-start);
  const search=page.locator('#network-search');
  for(const q of ['C158','C148','154-208-209-144','AP42','Lentekhi Port38','C184/F38','C184 Tube 1']){
    start=performance.now();await search.fill(q);await page.locator('.search-result').first().waitFor();result.searchMs[q]=Math.round(performance.now()-start);
    const cards=await page.locator('.search-result').allInnerTexts();
    if(final){
      if(q==='AP42'){const card=cards.find(s=>s.includes('ორბელი'))??'';assert.match(card,/ორბელი · C153 · 24 Ports/);assert.match(card,/2 used · 22 unused · 0 unknown/);flow(q,'AP42 place, Cable, capacity, occupancy',card);await page.screenshot({path:'docs/iteration28h-ap42-desktop.png'});}
      if(['C158','C148','154-208-209-144'].includes(q)){const card=cards.find(s=>/C\d+ · \d+F/.test(s))??'';assert.equal((card.match(/in use/g)??[]).length,1);flow(q,'one Cable identity and one usage summary',card.slice(0,400));if(q==='C158')await page.screenshot({path:'docs/iteration28h-c158-desktop.png'});}
      if(q==='Lentekhi Port38'){const card=cards[0];assert.match(card,/C184\/F38/);assert.match(card,/SC224.*C184\/F38 → C181\/F6.*SC225/);flow(q,'exact Fiber path remaps at SC224 and ends at SC225',card);}
      if(q==='C184 Tube 1'){const card=cards[0];assert.match(card,/Sample Fiber C184\/F1/);assert.match(card,/ნიმუში Fiber C184\/F1 გახსენი/);flow(q,'Tube path and action explicitly name sample C184/F1',card);await page.screenshot({path:'docs/iteration28h-tube-desktop.png'});}
    }
    await visibleWidth(page,`desktop search ${q}`);
  }
  if(final){
    for(const q of ['Lentekhi Port999','Lentekhi Port0','Tsageri Port0','Tsageri Port193','AP42 Port25']){await search.fill(q);assert.equal(await page.locator('.search-result').count(),0,q);flow(q,'no invented Port target','no results');}
    await search.fill('Tsageri Port175');const unknown=await page.locator('.search-result').first().innerText();assert.match(unknown,/Fiber მიბმა/);assert.doesNotMatch(unknown,/C148\/F175/);flow('Tsageri Port175','existing Port, unknown binding',unknown);
    await search.fill('AP42 Port1');assert.match(await page.locator('.search-result').first().innerText(),/C153\/F1/);
    await search.fill('AP42');await page.locator('.search-result').filter({hasText:'ორბელი'}).first().click();assert.match(page.url(),/#\/route\//);assert.match(page.url(),/42/);flow('AP42 navigation','opens certified canonical network node in Route Workspace',page.url());await page.goBack();assert.match(page.url(),/engineer\?q=AP42/);
    await search.fill('C184 Tube 1');await page.locator('.search-result').first().click();assert.match(page.url(),/fiber/);flow('Tube action','opens sample C184/F1',page.url());
    await page.goBack();assert.match(page.url(),/engineer\?q=/);flow('Back-to-query from global search','restores query',page.url());
    await page.goto(`${url}#/engineer?q=${encodeURIComponent('Lentekhi Port38')}`);await page.locator('.engineer-evidence summary').first().click();const engineer=await page.locator('.engineer-evidence').first().innerText();assert.match(engineer,/C184\/F38/);flow('Engineer Workspace Port38','same ordered path as global search',engineer.slice(0,500));
    await page.locator('.engineer-evidence .engineer-network-result button').first().click();assert.match(page.url(),/fiber/);await page.goBack();assert.match(page.url(),/engineer\?q=Lentekhi%20Port38/);flow('Back-to-query from Engineer Workspace','restores scoped Port query',page.url());
    await page.locator('#network-search').fill('AP42');await page.locator('#network-search').press('Enter');assert.match(page.url(),/#\/route\//);flow('keyboard selection','Enter navigates to selected network result',page.url());
  }
  start=performance.now();await page.goto(`${url}#/aggregation/AGG-LENTEKHI`,{waitUntil:'load'});await page.locator('.operational-port-card').first().waitFor();assert.equal(await page.locator('.operational-port-card').count(),48);result.gridMs=Math.round(performance.now()-start);await visibleWidth(page,'desktop 48-Port grid');
  result.longTasks=await page.evaluate(()=>window.__longTasks??[]);await context.close();
  if(final){const {context:mobileContext,page:mobile}=await setup({width:390,height:844});await mobile.goto(url);const input=mobile.locator('#network-search');for(const q of ['AP42','C158','154-208-209-144','Lentekhi Port38','C184 Tube 1']){await input.fill(q);await mobile.locator('.search-result').first().waitFor();await visibleWidth(mobile,`mobile search ${q}`);if(q==='AP42')await mobile.screenshot({path:'docs/iteration28h-ap42-mobile.png'});if(q==='C184 Tube 1')await mobile.screenshot({path:'docs/iteration28h-tube-mobile.png'});}await mobile.goto(`${url}#/aggregation/AGG-LENTEKHI`);await mobile.locator('.operational-port-card').first().waitFor();assert.equal(await mobile.locator('.operational-port-card').count(),48);await visibleWidth(mobile,'mobile 48-Port grid');await mobileContext.close();}
  if(final){assert.deepEqual(result.browserErrors,[]);assert.deepEqual(result.externalRequests,[]);}
}finally{await browser.close();await writeFile(`docs/iteration28h-${stage}-browser-qa.json`,JSON.stringify(result,null,2)+'\n');}
console.log(JSON.stringify({stage,sha256:result.sha256,loadMs:result.loadMs,searchMs:result.searchMs,gridMs:result.gridMs,longTasks:result.longTasks,browserErrors:result.browserErrors,externalRequests:result.externalRequests,flows:result.flows.length},null,2));
