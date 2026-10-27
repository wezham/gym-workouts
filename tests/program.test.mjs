import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const plan=JSON.parse(await fs.readFile(new URL('../program.json',import.meta.url),'utf8'));
test('24 full sessions with the requested upper-body emphasis and recovery weeks',()=>{
 assert.equal(plan.weeks.length,12);
 plan.weeks.forEach((w,i)=>{
  assert.equal(w.weekNumber,i+1);
  assert.deepEqual(Object.keys(w.days),['Day 1','Day 2']);
  for(const entries of Object.values(w.days)){
   assert.equal(entries.length,8);
   const total=entries.reduce((n,e)=>n+e.sets,0);
   const upper=entries.filter(e=>e.region==='upper').reduce((n,e)=>n+e.sets,0);
   assert.equal(total,(i+1)%4===0?12:20);
   assert.equal(upper,(i+1)%4===0?10:16);
   assert.equal(entries.filter(e=>e.region==='lower').length,2);
   for(const e of entries){
    assert.ok(e.description && e.alternative && e.notes);
    assert.ok(e.rest>=60 && e.rest<=180);
    assert.ok(Number.isInteger(e.sets)&&e.sets>0);
    assert.ok(!/AMRAP|failure/i.test(e.reps));
   }
  }
 });
});
test('compound anchors are stable within blocks, with real variety between blocks',()=>{
 for(let start=0;start<12;start+=4)for(const day of ['Day 1','Day 2']){
  const anchors=plan.weeks[start].days[day].slice(0,4).map(e=>e.exercise);
  for(let offset=1;offset<4;offset++)assert.deepEqual(plan.weeks[start+offset].days[day].slice(0,4).map(e=>e.exercise),anchors);
  assert.notDeepEqual(plan.weeks[start].days[day].slice(6).map(e=>e.exercise),plan.weeks[start+1].days[day].slice(6).map(e=>e.exercise));
 }
 assert.equal(new Set(plan.weeks.map(w=>w.phase)).size,3);
 assert.equal(new Set([0,4,8].map(i=>plan.weeks[i].days['Day 1'][0].exercise)).size,3);
});
test('generated HTML embeds the current source and local design assets',async()=>{
 const html=await fs.readFile(new URL('../workout-plan.html',import.meta.url),'utf8');
 assert.ok(html.includes(plan.weeks[8].days['Day 1'][0].exercise));
 assert.ok(!html.includes('Barbell Bench Press'));
 assert.ok(html.includes('app.js')&&html.includes('styles.css'));
});
