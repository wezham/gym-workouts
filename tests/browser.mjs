import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const base=process.env.TEST_URL||'http://127.0.0.1:4173/workout-plan.html';
const errors=[];
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto(base);
 await page.locator('[data-week="1"]').click();
 assert.equal(await page.locator('.exercise').count(),8);
 assert.match(await page.locator('#session-meta').innerText(),/16 upper \/ 4 lower/);
 await page.locator('#exercise-0').check();
 await page.locator('.exercise details').first().locator('summary').click();
 await page.locator('#log-0').fill('22 kg · 10 / 9 / 8');
 await page.reload();
 await page.locator('[data-week="1"]').click();
 assert.equal(await page.locator('#exercise-0').isChecked(),true);
 assert.equal(await page.locator('#log-0').inputValue(),'22 kg · 10 / 9 / 8');
 await page.locator('#day-2').click();
 assert.equal(await page.locator('#exercise-0').isChecked(),false);
 await page.locator('[data-week="4"]').click();
 assert.match(await page.locator('#session-meta').innerText(),/10 upper \/ 2 lower/);
 assert.match(await page.locator('#session-note').innerText(),/Recovery/);
 await page.locator('[data-week="5"]').click();
 await page.locator('#day-1').click();
 assert.match(await page.locator('.exercise h3').first().innerText(),/Converging/);
 await page.locator('#timer-toggle').click();
 await page.waitForTimeout(1100);
 assert.notEqual(await page.locator('#timer-display').innerText(),'01:30');
 await page.locator('#timer-toggle').click();
 await page.locator('#timer-reset').click();
 assert.equal(await page.locator('#timer-display').innerText(),'01:30');
 await fs.mkdir('test-results',{recursive:true});
 await page.screenshot({path:'test-results/desktop.png',fullPage:true});
 for(const width of [375,768]){
  await page.setViewportSize({width,height:900});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`No horizontal overflow at ${width}px`);
  await page.locator('[data-week="12"]').click();
  assert.equal(await page.locator('.exercise').count(),8);
  if(width===375)await page.screenshot({path:'test-results/mobile.png',fullPage:true});
 }
 // Check civil-date boundaries from a browser in a different timezone.
 for(const [date,expected]of [['2026-10-20T00:00:00Z',1],['2026-11-02T14:30:00Z',2],['2027-04-01T00:00:00Z',12]]){
  const ctx=await browser.newContext({timezoneId:'America/Los_Angeles'});
  await ctx.addInitScript(({date})=>{const RealDate=Date;globalThis.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[date]));}static now(){return new RealDate(date).getTime();}};},{date});
  const tab=await ctx.newPage();await tab.goto(base);
  assert.equal(await tab.locator('.week-button.active').getAttribute('data-week'),String(expected));
  if(expected===12)assert.match(await tab.locator('#cycle-date').innerText(),/Cycle complete/);
  await ctx.close();
 }
 assert.deepEqual(errors,[]);
 await context.close();
 console.log('Browser checks passed: navigation, recovery, persistence, timer, responsive layouts, Sydney date boundaries, cycle completion.');
}finally{await browser.close();}
