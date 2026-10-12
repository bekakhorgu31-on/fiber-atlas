import { pathToFileURL } from 'node:url';
import { writeFile } from 'node:fs/promises';

const { chromium } = await import(pathToFileURL('C:/Users/Beka/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'));
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const base = 'http://127.0.0.1:4175';
const result = { sourceEvidence: [], sc225: [], companies: [], ports: [], mobile: [], print: null, standalone: null, logs: [] };
const assert = (value, message) => { if (!value) throw new Error(message); };
const watch = page => {
  page.on('pageerror', error => result.logs.push(`pageerror: ${error.message}`));
  page.on('console', message => { if (['error','warning'].includes(message.type())) result.logs.push(`${message.type()}: ${message.text()}`); });
};
const noOverflow = async (page, name) => {
  const size=await page.evaluate(() => ({ width:innerWidth, scrollWidth:document.documentElement.scrollWidth }));
  assert(size.scrollWidth<=size.width,`${name}: overflow ${size.scrollWidth}/${size.width}`); return size;
};

const desktop=await browser.newContext({ viewport:{ width:1440,height:900 } });
const page=await desktop.newPage(); watch(page);

await page.goto(`${base}/#/import?shape=37907`);
await page.waitForSelector('[aria-label="Iteration 25 interpreted evidence"]');
await page.locator('[aria-label="Iteration 25 interpreted evidence"] summary').click();
let text=await page.locator('main').innerText();
for (const token of ['31 / 31 labels','8','C181/F06','Owner confirms AP-side continuation','C182→AP53','C183→AP54','182-225-53-24','183-225-54-24']) assert(text.includes(token),`source evidence: missing ${token}`);
result.sourceEvidence.push({ iteration25:true, sc225Rows:24, identityConflictVisible:true, size:await noOverflow(page,'source evidence') });

for (const [name,focus,tab,required] of [
  ['C181 F03 to C183 F03','fiber:CAB-000181:3','C181 ↔ C183',['SC225','C181 ↔ C183','C181/F03','C183/F03','ზუსტი']],
  ['C181 F06 unresolved','fiber:CAB-000181:6','C181 ↔ AP მხარე დაუზუსტებელია',['SC225','F06','გაგრძელება დაუდგენელია','დაუზუსტებელი']],
  ['C181 F13 to C182 F01','fiber:CAB-000181:13','C181 ↔ C182',['SC225','C181 ↔ C182','C181/F13','C182/F01','13 → 01']],
]) {
  await page.goto(`${base}/#/splice/closure/225?focus=${encodeURIComponent(focus)}`); await page.waitForSelector('.splice-sheet');
  await page.locator('.splice-relationship-tabs button').filter({ hasText:tab }).click(); await page.waitForTimeout(100);
  text=await page.locator('.splice-workspace').innerText(); for(const token of required) assert(text.includes(token),`${name}: missing ${token}\n${text.slice(0,1800)}`);
  result.sc225.push({ name,size:await noOverflow(page,name) });
}

await page.goto(`${base}/#/splice/closure/206?focus=${encodeURIComponent('fiber:CAB-000150:145')}`); await page.waitForSelector('.splice-sheet');
const companySelect=page.locator('select[aria-label="კომპანიის ფილტრი"]');
assert(await companySelect.count()===1,'company filter missing');
for (const [id,label] of [['opennet','OpenNet'],['magti','Magti'],['silknet','Silknet'],['skytel','Skytel']]) {
  await companySelect.selectOption(id); text=await page.locator('.splice-workspace').innerText();
  assert(text.includes(`იყენებს: ${label}`),`${label}: use badge missing`);
  const rows=await page.locator('.splice-sheet-row').count(); assert(rows>0,`${label}: filter returned no rows`);
  result.companies.push({ id,label,rows });
}
await companySelect.selectOption('all');

for (const [name,url,required] of [
  ['AP53 Port1',`${base}/#/splice/ap/53?focus=${encodeURIComponent('port:53:1')}`,['AP53','Port 1','C182/F01']],
  ['AP54 Port3 Skytel',`${base}/#/splice/ap/54?focus=${encodeURIComponent('port:54:3')}`,['AP54','Port 3','C183/F03','იყენებს: Skytel']],
  ['Lentekhi Port5 Magti',`${base}/#/splice/aggregation/AGG-LENTEKHI?focus=${encodeURIComponent('port:ODF-LENTEKHI-01:5')}`,['Port 5','C184/F05','იყენებს: Magti','სტატუსი დაუდგენელია']],
]) {
  await page.goto(url); await page.waitForSelector('.splice-sheet'); text=await page.locator('.splice-workspace').innerText();
  for(const token of required) assert(text.includes(token),`${name}: missing ${token}`);
  result.ports.push({ name,size:await noOverflow(page,name) });
}

await page.emulateMedia({ media:'print' });
result.print=await page.evaluate(() => ({ sidebar:getComputedStyle(document.querySelector('.sidebar')).display, sheet:getComputedStyle(document.querySelector('.splice-sheet')).display, company:document.querySelector('.splice-workspace')?.textContent?.includes('იყენებს: Magti') }));
assert(result.print.sidebar==='none' && result.print.sheet==='grid' && result.print.company,'print view failed');
await page.screenshot({ path:'docs/iteration25-port-print.png',fullPage:true });
await desktop.close();

const mobile=await browser.newContext({ viewport:{ width:390,height:844 } }); const mp=await mobile.newPage(); watch(mp);
for (const [name,url,required] of [
  ['SC225 F06 mobile',`${base}/#/splice/closure/225?focus=${encodeURIComponent('fiber:CAB-000181:6')}`,['F06','დაუზუსტებელი']],
  ['AP54 Skytel mobile',`${base}/#/splice/ap/54?focus=${encodeURIComponent('port:54:3')}`,['C183/F03','იყენებს: Skytel']],
  ['source matrix mobile',`${base}/#/import?shape=37907`,['Company usage and SC225 routing','C181/F24']],
]) {
  await mp.goto(url); await mp.waitForSelector(name.includes('source')?'[aria-label="Iteration 25 interpreted evidence"]':'.splice-workspace');
  if(name.includes('source')) await mp.locator('[aria-label="Iteration 25 interpreted evidence"] summary').click();
  text=await mp.locator('main').innerText(); for(const token of required) assert(text.includes(token),`${name}: missing ${token}`);
  result.mobile.push({ name,size:await noOverflow(mp,name) });
}
await mp.screenshot({ path:'docs/iteration25-mobile.png',fullPage:true }); await mobile.close();

const standalone=await browser.newContext({ viewport:{ width:1280,height:800 } }); const sp=await standalone.newPage(); watch(sp);
await sp.goto(`file:///C:/Users/Beka/Desktop/Visio%20Alt/fiber-prototype.html#/splice/ap/54?focus=${encodeURIComponent('port:54:3')}`); await sp.waitForSelector('.splice-sheet');
text=await sp.locator('.splice-workspace').innerText(); assert(text.includes('C183/F03')&&text.includes('იყენებს: Skytel'),'standalone company Port view failed');
result.standalone=await sp.evaluate(() => ({ scripts:document.scripts.length,linkedStyles:document.querySelectorAll('link[rel="stylesheet"]').length,width:innerWidth,scrollWidth:document.documentElement.scrollWidth }));
assert(result.standalone.linkedStyles===0 && result.standalone.scrollWidth<=result.standalone.width,'standalone embedding failed'); await standalone.close();

await browser.close(); assert(result.logs.length===0,`browser logs: ${result.logs.join(' | ')}`);
await writeFile('docs/iteration25-browser-qa.json',`${JSON.stringify(result,null,2)}\n`);
console.log(JSON.stringify({ sourceEvidence:result.sourceEvidence.length,sc225:result.sc225.length,companies:result.companies.length,ports:result.ports.length,mobile:result.mobile.length,print:result.print,standalone:result.standalone,logs:result.logs.length }));
