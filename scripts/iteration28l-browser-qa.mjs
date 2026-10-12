import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL('C:/Users/Beka/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'));
const browser = await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const results = { browser:await browser.version(), journeys:[], errors:[], screenshots:[] };
const params = (page) => new URLSearchParams(page.url().split('#')[1]?.split('?')[1] ?? '');
const appUrl = pathToFileURL('C:/Users/Beka/Desktop/Visio Alt/fiber-prototype.html').href;
const route = (selection,inspect=selection,context='network') => `${appUrl}#/route/ROUTE-TSAGERI-LENTEKHI-CORE?context=${context}&select=${encodeURIComponent(selection)}&inspect=${encodeURIComponent(inspect)}`;
const open = async (width,height,selection,inspect=selection,context='network') => {
  const contextPage = await browser.newContext({viewport:{width,height},hasTouch:width<760,reducedMotion:'reduce'}), page=await contextPage.newPage();
  page.on('pageerror',error=>results.errors.push(error.message));
  await page.goto(route(selection,inspect,context));
  await page.locator('.network-topology-view, .ap-workspace').first().waitFor();
  return {context:contextPage,page};
};
try {
  {
    const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage();
    await page.goto(`${appUrl}#/route/ROUTE-TSAGERI-LENTEKHI-CORE?context=network`);await page.locator('.network-topology-view').waitFor();
    await page.locator('.network-node-main').filter({hasText:'SC206'}).first().click();
    assert.equal(params(page).get('inspect'),'closure:206');assert.equal(await page.locator('.network-topology-view').count(),1);
    await page.locator('[data-workspace-segment-key="segment:CAB-000169"] .network-cable-main').click();
    assert.equal(params(page).get('inspect'),'segment:CAB-000169');
    await page.getByRole('button',{name:'ჟილების ნახვა'}).click();
    await page.locator('.inspector-fiber-grid button').filter({hasText:'F10'}).click();
    assert.equal(params(page).get('select'),'fiber:CAB-000169:10');
    await page.locator('.network-node-main').filter({hasText:'SC217'}).first().click();
    assert.equal(params(page).get('select'),'fiber:CAB-000169:10');assert.equal(params(page).get('inspect'),'closure:217');
    await page.goBack();assert.equal(params(page).get('inspect'),'fiber:CAB-000169:10');assert.equal(params(page).get('select'),'fiber:CAB-000169:10');
    await page.goBack();assert.equal(params(page).get('inspect'),'segment:CAB-000169');
    await page.goForward();assert.equal(params(page).get('inspect'),'fiber:CAB-000169:10');await page.goForward();assert.equal(params(page).get('inspect'),'closure:217');
    results.journeys.push({name:'overall map SC206 → C169 → F10 → SC217; details and selected Fiber stay independent'});
    await context.close();
  }
  {
    const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage();
    await page.goto(`${appUrl}#/`);await page.locator('#network-search').fill('C169/F12');
    await page.locator('.search-result').first().waitFor();await page.locator('.search-result').first().click();
    await page.locator('.route-workspace-body > .context-inspector [data-owner-report="OWNER-2026-10-05-C169-F12-LENTEKHI"]').waitFor();
    assert.equal(params(page).get('select'),'fiber:CAB-000169:12');assert.equal(await page.locator('.network-topology-view').count(),1);
    results.journeys.push({name:'direct C169/F12 search enters the same network workspace and corrected journey'});
    await context.close();
  }
  {
    const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage();
    await page.goto(`${appUrl}#/`);await page.locator('#network-search').fill('Silknet');await page.locator('.search-result').first().waitFor();await page.locator('.search-result').first().click();
    await page.locator('.organization-workspace').waitFor();
    const strand=page.locator('[data-org-strand]').filter({hasText:'C169/F12'}).first();
    if(await strand.count()){await strand.click();await page.locator('[data-org-strand].is-selected').waitFor().catch(()=>{});}
    const text=await page.locator('.organization-workspace').innerText();
    assert.match(text,/Silknet/);assert.match(text,/F12|C169/);
    results.journeys.push({name:'Silknet search and organization strand view retain local Fiber scope',strandFound:!!(await strand.count())});
    await context.close();
  }
  {
    const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage();
    const ports=[];
    for(const n of [10,11,12]){
      await page.goto(`${appUrl}#/`);await page.locator('#network-search').fill(`Lentekhi Port ${n}`);await page.locator('.search-result').first().waitFor();await page.locator('.search-result').first().click();
      await page.locator('.route-workspace-body > .context-inspector').waitFor();
      assert.match(params(page).get('select')??'',new RegExp(`^port:odf:.*:${n}$`));
      const text=await page.locator('.route-workspace-body > .context-inspector').innerText();assert.match(text,new RegExp(`Port ${n}`));assert.match(text,new RegExp(`SC224.*F${n}|F${n}.*SC224`));
      ports.push(n);
    }
    results.journeys.push({name:'Lentekhi Ports 10/11/12 each open the matching C184 Fiber journey',ports});
    await context.close();
  }
  {
    const {context,page}=await open(1440,900,'fiber:CAB-000169:10');
    const rail=page.locator('.route-workspace-body > .context-inspector');
    await rail.waitFor();
    assert.equal(await page.locator('.focused-route, .selected-details').count(),0);
    assert.match(await rail.innerText(),/Port 10/);
    assert.ok(await page.locator('.network-cable-card.is-optical-active').count()>0);
    await page.locator('.current-journey-playback > summary').click();
    await page.locator('.current-journey-playback .ap-walkthrough').waitFor();
    await page.locator('[data-walk="next"]').click();assert.match(await page.locator('[data-walk-current]').innerText(),/^2 \/ /);
    await rail.focus();await page.keyboard.press('PageDown');
    await page.waitForFunction(()=>document.querySelector('.context-inspector')?.scrollTop>0);
    await page.keyboard.press('End');await page.waitForFunction(()=>{const el=document.querySelector('.context-inspector');return !!el&&el.scrollTop+el.clientHeight>=el.scrollHeight-1;});
    await page.screenshot({path:'docs/iteration28l-map-desktop.png',fullPage:true});results.screenshots.push('docs/iteration28l-map-desktop.png');
    const sc217=page.locator('.network-node-main').filter({hasText:'SC217'}).first();
    await sc217.click();
    assert.equal(params(page).get('select'),'fiber:CAB-000169:10');
    assert.equal(params(page).get('inspect'),'closure:217');
    assert.equal(await page.locator('.network-topology-view').count(),1);
    await page.locator('[data-workspace-segment-key="segment:CAB-000171"] .network-cable-main').click();
    assert.equal(params(page).get('select'),'fiber:CAB-000169:10');
    assert.equal(params(page).get('inspect'),'segment:CAB-000171');
    await page.getByRole('button',{name:'ცაგერი–ლენტეხის საკაბელო მარშრუტი'}).click();
    assert.equal(params(page).get('context'),'route');
    assert.equal(params(page).get('select'),'fiber:CAB-000169:10');
    assert.equal(params(page).get('inspect'),'segment:CAB-000171');
    await page.getByRole('button',{name:'მთლიანი ქსელი'}).click();
    await page.goBack();
    assert.equal(params(page).get('context'),'route');
    await page.goForward();
    assert.equal(params(page).get('context'),'network');
    results.journeys.push({name:'F10 path, Closure/Cable inspection, physical context and browser history',rail:(await rail.innerText()).slice(0,600)});
    await context.close();
  }
  {
    const {context,page}=await open(1440,900,'fiber:CAB-000169:12');
    const rail=page.locator('.route-workspace-body > .context-inspector');
    await page.locator('[data-owner-report="OWNER-2026-10-05-C169-F12-LENTEKHI"]').waitFor();
    assert.match(await rail.innerText(),/Skytel/);assert.match(await rail.innerText(),/Silknet/);
    assert.match(await rail.innerText(),/ადგილზე შემოწმებას/);
    results.journeys.push({name:'F12 Lentekhi correction and retained Silknet/Skytel use conflict'});
    await context.close();
  }
  {
    const {context,page}=await open(1440,900,'fiber:CAB-000176:32');
    const rail=page.locator('.route-workspace-body > .context-inspector');
    await rail.waitFor();const text=await rail.innerText();
    assert.match(text,/AP52/);assert.doesNotMatch(text,/AP51|SC218/);
    assert.equal(await page.locator('[data-workspace-key="segment:CAB-000173"].is-optical-active').count(),0);
    assert.equal(await page.locator('[data-workspace-key="segment:CAB-000174"].is-optical-active').count(),0);
    await page.locator('.lineage-endpoint-action').filter({hasText:'AP52'}).first().click();
    assert.ok(await page.locator('.route-workspace-body > .context-inspector').count());
    assert.equal(await page.locator('.network-topology-view').count(),1);
    assert.equal(params(page).get('select'),'port:ap:52:24');
    assert.equal(await page.locator('.route-destination-action').count(),1);
    await page.locator('.route-destination-action').click();
    await page.locator('[data-ap-workspace="52"]').waitFor();
    results.journeys.push({name:'F32 AP52 port cross-navigation and explicit destination workspace'});
    await context.close();
  }
  {
    const {context,page}=await open(1440,900,'fiber:CAB-000184:38');
    const text=await page.locator('.route-workspace-body > .context-inspector').innerText();
    assert.match(text,/SC225/);assert.match(text,/C181\/F06/);assert.doesNotMatch(text,/SC223|SC218|AP51/);
    assert.equal(await page.locator('[data-workspace-key="segment:CAB-000181"].is-optical-active').count(),1);
    assert.equal(await page.locator('[data-workspace-key="segment:CAB-000180"].is-optical-active').count(),0);
    results.journeys.push({name:'Lentekhi F38 follows SC224–C181 to the source-confirmed SC225 termination'});
    await context.close();
  }
  {
    const context=await browser.newContext({viewport:{width:1366,height:768},reducedMotion:'no-preference'}),page=await context.newPage();
    await page.goto(route('fiber:CAB-000169:10'));await page.locator('.current-journey-playback > summary').click();await page.locator('[data-walk="play"]').click();
    await page.locator('[data-animated-edge]').waitFor({timeout:5000});
    results.journeys.push({name:'shared Fiber playback animates a graph-derived journey leg with finite controls'});
    await context.close();
  }
  for (const [width,height] of [[1366,768],[390,844],[320,844]]) {
    const {context,page}=await open(width,height,'fiber:CAB-000169:12');
    const rail=page.locator('.route-workspace-body > .context-inspector');
    const boxes=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,map:document.querySelector('.route-canvas')?.getBoundingClientRect().toJSON(),rail:document.querySelector('.context-inspector')?.getBoundingClientRect().toJSON(),position:getComputedStyle(document.querySelector('.context-inspector')).position}));
    assert.ok(boxes.document<=boxes.viewport,`horizontal overflow ${JSON.stringify(boxes)}`);
    assert.ok(boxes.map.width>0&&boxes.rail.width>0);
    if(width<760){assert.equal(boxes.position,'static');assert.ok(boxes.map.height<5000,`mobile topology is not compact: ${boxes.map.height}px`);assert.ok(await page.locator('.network-mobile-fold-note').count());}
    await rail.evaluate(el=>el.scrollTop=el.scrollHeight);
    if(width===390){await page.screenshot({path:'docs/iteration28l-map-mobile-390.png',fullPage:true});results.screenshots.push('docs/iteration28l-map-mobile-390.png');}
    results.journeys.push({name:`persistent inspection layout ${width}px`,boxes});
    await context.close();
  }
  {
    const {context,page}=await open(720,450,'fiber:CAB-000169:10');
    await page.evaluate(()=>{document.documentElement.style.zoom='200%';});
    const size=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
    assert.ok(size.scroll<=size.width,`200% zoom horizontal overflow ${JSON.stringify(size)}`);
    results.journeys.push({name:'200% zoom layout at 720×450',size});await context.close();
  }
  assert.deepEqual(results.errors,[]);
  console.log(JSON.stringify(results,null,2));
} finally { await browser.close(); }
