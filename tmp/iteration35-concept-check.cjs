const {chromium}=require('C:/Users/Beka/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try {
  const page=await browser.newPage({viewport:{width:1040,height:1200}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file:///C:/Users/Beka/Desktop/Visio%20Alt/fiber-prototype/tmp/iteration35-concept-preview.html');
  const frame=page.frameLocator('iframe');
  await frame.locator('#fa-place-app').screenshot({path:'C:/Users/Beka/Desktop/Visio Alt/fiber-prototype/tmp/iteration35-concept-local.png'});
  await frame.locator('#fa-place-app [data-trace]').click();
  await frame.locator('#fa-place-app [data-play]').click();
  await page.waitForTimeout(1700);
  await frame.locator('#fa-place-app').screenshot({path:'C:/Users/Beka/Desktop/Visio Alt/fiber-prototype/tmp/iteration35-concept-desktop.png'});
  await frame.locator('#fa-place-app [data-port="1"]').click();
  if(!(await frame.locator('#fa-place-app [data-answer]').innerText()).includes('SC25017'))throw Error('Partial route missing');
  await frame.locator('#fa-place-app [data-place-select]').selectOption('AP18');
  await frame.locator('#fa-place-app [data-trace]').click();
  await frame.locator('#fa-place-app [data-gap]').click();
  if(!(await frame.locator('#fa-place-app [data-inspect]').innerText()).includes('12110'))throw Error('AP18 evidence missing');
  if(await frame.locator('#fa-place-app [data-play]').isVisible())throw Error('Unknown binding playback visible');
  const inner=page.frames().find(f=>f.parentFrame());
  await inner.evaluate(()=>{document.querySelector('[data-variant="Place workspace"]').hidden=true;document.querySelector('[data-variant="Question workspace"]').hidden=false;});
  await frame.locator('#fa-question-app [data-example="AP16 Port1"]').click();
  await frame.locator('#fa-question-app [data-query]').fill('AP16 Port13');
  await frame.locator('#fa-question-app .fa-query button').click();
  if(!(await frame.locator('#fa-question-app [data-answer]').innerText()).includes('AP17'))throw Error('Question route missing '+JSON.stringify({answer:await frame.locator('#fa-question-app [data-answer]').innerText(),input:await frame.locator('#fa-question-app [data-query]').inputValue(),note:await frame.locator('#fa-question-app [data-nav-note]').textContent(),errors}));
  const widths=[];
  for(const width of [1040,390,320]){await page.setViewportSize({width,height:1500});await page.waitForTimeout(150);widths.push(await inner.evaluate(()=>({width:innerWidth,body:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth})));}
  await page.setViewportSize({width:390,height:1600});
  await frame.locator('#fa-question-app').screenshot({path:'C:/Users/Beka/Desktop/Visio Alt/fiber-prototype/tmp/iteration35-concept-mobile.png'});
  await page.emulateMedia({reducedMotion:'reduce',colorScheme:'dark'});
  await frame.locator('#fa-question-app [data-play]').click();await page.waitForTimeout(100);
  if(await frame.locator('#fa-question-app [data-play]').isDisabled())throw Error('Reduced motion playback stuck');
  const result={scope:'Interactive concept only; not the product',errors,widths,interactions:['local to selected route','finite playback','partial route','AP18 unknown evidence/no playback','question examples','question submission','reduced motion'],networkWrites:0};
  fs.writeFileSync('fiber-prototype/tmp/iteration35-concept-qa.json',JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
  if(errors.length||widths.some(w=>w.overflow))process.exitCode=1;
 } finally {await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
