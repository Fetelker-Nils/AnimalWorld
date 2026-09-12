const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const {createServer}=require('./browser.cjs');
(async()=>{
 const server=createServer(path.resolve(__dirname,'../dist'));await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:900}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
  await page.goto('http://127.0.0.1:'+server.address().port+'/#smoke-test');await page.click(process.argv.includes('--online')?'#play-online':'#play');if(process.argv.includes('--online'))await page.waitForFunction(()=>window.__animalTest.state().network==='online');
  await page.evaluate(()=>{const t=window.__animalTest,s=t.state().busStops.find(s=>s.name==='Dorfkreuzung');t.visit(s.x-1.4*Math.cos(s.heading)-2*Math.sin(s.heading),s.y-1.4*Math.sin(s.heading)+2*Math.cos(s.heading));});
  await page.waitForFunction(()=>document.querySelector('#interact').textContent.includes('Fahrplan'));
  await page.keyboard.press('e');assert((await page.evaluate(()=>window.__animalTest.state())).busMap);
  assert.equal(await page.locator('#bus-map-line option').count(),8);
  const initial=await page.evaluate(()=>window.__animalTest.state().buses);
  await page.waitForFunction(start=>window.__animalTest.state().buses.some(b=>{const old=start.find(p=>p.id===b.id);return Math.hypot(b.x-old.x,b.y-old.y)>3;}),initial,{timeout:40000}).catch(async e=>{console.log(await page.evaluate(()=>({mode:window.__animalTest.state().mode,buses:window.__animalTest.state().buses.map(b=>({id:b.id,wait:b.wait,speed:b.speed}))})));throw e;});
  assert.equal((await page.evaluate(()=>window.__animalTest.state())).mode,'map','Bus keeps moving while map remains open');
  assert.equal((await page.locator('#bus-map-status').textContent()).split('\n').length,9);
  await page.screenshot({path:'test-results/bus-plan-live.png'});
  await page.selectOption('#bus-map-line','7');assert.equal((await page.evaluate(()=>window.__animalTest.state())).busMapLine,'7');
  assert((await page.locator('#bus-map-status').textContent()).startsWith('Linie 7'));
  await page.screenshot({path:'test-results/bus-plan-line-7.png'});
  await page.keyboard.press('Escape');assert.equal((await page.evaluate(()=>window.__animalTest.state())).mode,'playing');
  await page.keyboard.press('m');assert(!(await page.evaluate(()=>window.__animalTest.state())).busMap);assert(await page.locator('#bus-map-panel').isHidden());
  await page.keyboard.press('m');await page.click('#interact');assert((await page.evaluate(()=>window.__animalTest.state())).busMap,'On-screen button opens the same plan');
  assert.deepEqual(errors,[]);console.log('PASS bus plan ('+(process.argv.includes('--online')?'online':'offline')+'): E/button opening, live fleet, line selection, closing and ordinary map');
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
