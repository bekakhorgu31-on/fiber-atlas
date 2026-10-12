import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {readFile,writeFile} from 'node:fs/promises';
const {chromium}=await import(pathToFileURL('C:/Users/Beka/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'));
const active=JSON.parse(await readFile('migration/iteration28d/active-projection-audit.json','utf8'));
const review=JSON.parse(await readFile('migration/iteration28d/review-queue.json','utf8'));
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const base='file:///C:/Users/Beka/Desktop/Visio%20Alt/fiber-prototype.html',root='ROUTE-TSAGERI-LENTEKHI-CORE',prefix='SRC-TSAGERI-ALPANA-TVISHI-419DEF34-C';
const result={desktop:[],mobile:[],standalone:{offline:true,externalRequests:[]},logs:[]};
const setup=async viewport=>{const context=await browser.newContext({viewport,offline:true});const p=await context.newPage();p.on('pageerror',e=>result.logs.push(e.message));p.on('console',m=>{if(['error','warning'].includes(m.type()))result.logs.push(m.text())});p.on('request',r=>{if(/^https?:/.test(r.url()))result.standalone.externalRequests.push(r.url())});return p;};
const viewport=async p=>{const v=await p.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));assert.ok(v.scrollWidth<=v.width,JSON.stringify(v));return v;};
const select=async(p,s)=>{await p.goto(`${base}#/route/${root}?select=${encodeURIComponent(s)}`);await p.waitForSelector('.context-inspector');};
const ask=async(p,q)=>{await p.goto(`${base}#/engineer?q=${encodeURIComponent(q)}`);await p.waitForSelector('.engineer-answer');return p.locator('.engineer-answer');};
try{
 const p=await setup({width:1440,height:900});
 await select(p,'network_node:42');await p.waitForSelector('[data-source-b-ap="42"]');assert.ok((await p.locator('[data-source-b-ap="42"]').innerText()).includes('ორბელი'));assert.equal(await p.locator('[data-source-b-port]').count(),24);
 result.desktop.push({flow:'AP42 grammar/place/capacity and complete logical bank',...await viewport(p)});
 const portRows=[];
 for(let n=1;n<=24;n++){
  await p.locator(`[data-source-b-port="${n}"]`).click();await p.waitForFunction(n=>document.querySelector('[data-source-b-ap="42"] h2')?.textContent.includes('Port '+n),n);
  const journey=p.locator('.current-fiber-journey');assert.ok((await journey.innerText()).includes(`/ F${String(n).padStart(2,'0')}`));
  const t=await p.locator('[data-source-b-ap="42"]').innerText();assert.ok(t.includes([1,3].includes(n)?'გამოიყენება':'გამოუყენებელია'));assert.ok(t.includes('კომერციული ხელმისაწვდომობა'));
  portRows.push({port:n,signature:await journey.getAttribute('data-current-path-signature')});
  await p.locator('[data-source-b-ap="42"] > .inspector-heading .inspector-back').click();await p.waitForSelector('[data-source-b-port="1"]');
 }
 result.desktop.push({flow:'All AP42 Ports open their exact Fiber and independent occupancy',ports:portRows});
 await p.locator('[data-source-b-port="1"]').click();const sig=await p.locator('.current-fiber-journey').getAttribute('data-current-path-signature');assert.equal(sig,active.ap42Port1.signature);
 await p.locator('[data-source-b-ap="42"]').getByRole('button',{name:'ჟილის გზის ნახვა',exact:true}).click();await p.waitForSelector('.current-fiber-journey');assert.equal(await p.locator('.current-fiber-journey').getAttribute('data-current-path-signature'),sig);
 await p.locator('.lineage-endpoint-action').filter({hasText:'AP42 / Port 1'}).click();await p.waitForSelector('[data-source-b-ap="42"]');result.desktop.push({flow:'Port↔Fiber bidirectional same journey',signature:sig,...await viewport(p)});
 await p.screenshot({path:'docs/iteration28d-ap42-port1-desktop.png',fullPage:true});
 for(const q of ['AP42','AP42 Port1','AP42 occupied Ports','C153/F1']){const a=await ask(p,q);const t=await a.innerText();assert.ok(t.includes('AP42'));if(q==='AP42 occupied Ports')assert.ok(t.includes('1, 3'));if(q==='AP42 Port1'||q==='C153/F1')assert.equal(await a.getAttribute('data-current-path-signature'),sig);result.desktop.push({flow:'Query '+q,...await viewport(p)});}
 await select(p,`fiber:${prefix}161:20`);await p.waitForSelector('.lineage-usage');assert.ok((await p.locator('.lineage-usage').innerText()).includes('Magti'));await p.locator('.lineage-usage summary').click();await p.locator('.lineage-usage').getByRole('button',{name:'Shape 29210',exact:true}).click();await p.waitForSelector('[data-source-b-shape="29210"]');assert.ok((await p.locator('[data-source-b-shape="29210"]').innerText()).includes('Source B'));result.desktop.push({flow:'Exact company local scope and source evidence link',...await viewport(p)});
 await select(p,'port:ap:47:3');await p.waitForSelector('[data-source-b-ap="47"]');const red=await p.locator('[data-source-b-ap="47"]').innerText();assert.ok(red.includes('დაუდგენელია'));assert.ok(red.includes('Port 3 ↔ F3'));result.desktop.push({flow:'AP47 red Port status unknown; binding remains exact',...await viewport(p)});
 await p.goto(`${base}#/import/SOURCE-B-28D?shape=23852`);await p.waitForSelector('[data-source-b-shape="23852"]');assert.ok((await p.locator('[data-source-b-shape="23852"]').innerText()).includes('#92d050'));
 for(const c of [review.cases.find(c=>c.category==='port_status_uncertain'),review.cases.find(c=>c.source.shapeIds.includes('23852')),review.cases.find(c=>c.category==='fiber_port_binding_ambiguous')]){
  await p.locator('.source-b-review select').first().selectOption(c.id);const t=await p.locator('.source-b-review').innerText();assert.ok(t.includes(c.question)&&t.includes(c.observation));result.desktop.push({flow:'Actual review case '+c.id,...await viewport(p)});
 }
 await p.screenshot({path:'docs/iteration28d-review-desktop.png',fullPage:true});
 await select(p,`fiber:${prefix}152:11`);assert.equal(await p.locator('.current-fiber-journey').getAttribute('data-current-path-signature'),active.f11.signature);assert.ok((await p.locator('.current-fiber-journey').innerText()).includes('AP49 / Port 11'));result.desktop.push({flow:'F11 newly certified AP49 Port11; unchanged remaps',...await viewport(p)});
 for(const [id,n] of [['CAB-000151',118],['CAB-000176',32],['CAB-000184',38]]){await select(p,`fiber:${id}:${n}`);const t=await p.locator('.current-fiber-journey').innerText();if(n===32){assert.ok(t.includes('AP52'));assert.ok(!t.includes('AP51'));}if(n===38)assert.ok(t.includes('SC225'));if(n===118)assert.ok(t.includes('SC207'));result.desktop.push({flow:`Preserved regression ${id}/F${n}`,...await viewport(p)});}
 await p.goto(`${base}#/document/SRC-TSAGERI-ALPANA-TVISHI-419DEF34`);await p.waitForSelector('.document-overview');const documentText=await p.locator('.document-overview').innerText();assert.ok(documentText.includes('Source AP logical Ports: 216'));assert.ok(documentText.includes('All24 source occurrences'));assert.ok(!documentText.includes('Port inventory and bindings are not established'));result.desktop.push({flow:'Source B document summary uses current certification',...await viewport(p)});
 const mobile=await setup({width:390,height:844});
 for(const s of ['network_node:42','port:ap:42:1','port:ap:42:2','port:ap:47:3',`fiber:${prefix}161:20`]){await select(mobile,s);assert.ok(await mobile.locator('.context-inspector').isVisible());if(s==='port:ap:42:1')await mobile.screenshot({path:'docs/iteration28d-ap42-port1-mobile.png',fullPage:true});result.mobile.push({flow:s,...await viewport(mobile)});}
 await mobile.screenshot({path:'docs/iteration28d-mobile.png',fullPage:true});
 await mobile.goto(`${base}#/import/SOURCE-B-28D?shape=28576`);await mobile.waitForSelector('[data-source-b-shape="28576"]');result.mobile.push({flow:'Red Port evidence and review at 390px',...await viewport(mobile)});
 assert.deepEqual(result.logs,[]);assert.deepEqual(result.standalone.externalRequests,[]);
}finally{await browser.close();await writeFile('docs/iteration28d-browser-qa.json',JSON.stringify(result,null,2)+'\n');}
console.log(JSON.stringify({desktop:result.desktop.length,mobile:result.mobile.length,logs:result.logs,offline:result.standalone},null,2));
