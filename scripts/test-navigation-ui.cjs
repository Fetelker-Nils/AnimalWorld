const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const {createServer}=require('./browser.cjs');
(async()=>{
 const server=createServer(path.resolve(__dirname,'../dist'));await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:750}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('animal-world-deliveries-v1',JSON.stringify({coins:20000,completed:0})));
  await page.goto('http://127.0.0.1:'+server.address().port+'/#smoke-test');await page.click('#play');
  for(const id of ['helicopter','plane']){
   await page.evaluate(()=>{window.__animalTest.visit(225,220);document.querySelector('#interact').click();});assert(await page.locator('[data-car="boat"]').isHidden());await page.click('[data-car="'+id+'"]');
   await page.evaluate(()=>{const p=window.__animalTest.state().carPosition;window.__animalTest.visit(p.x,p.y);});await page.keyboard.press('f');
   await page.keyboard.down('q');if(id==='plane')await page.keyboard.down('w');await page.evaluate(()=>window.__animalTest.advance(3));await page.keyboard.up('q');await page.keyboard.up('w');
   assert((await page.evaluate(()=>window.__animalTest.state())).carPosition.z>20);await page.screenshot({path:'test-results/'+id+'-flight.png'});
   await page.keyboard.down(' ');await page.keyboard.down('r');await page.evaluate(()=>window.__animalTest.advance(8));await page.keyboard.up(' ');await page.keyboard.up('r');await page.keyboard.press('f');assert(!(await page.evaluate(()=>window.__animalTest.state())).driving);
  }
  await page.evaluate(()=>{window.__animalTest.visit(550,0);document.querySelector('#interact').click();});await page.click('[data-car="boat"]');
  await page.evaluate(()=>window.__animalTest.visit(563,2.6));await page.keyboard.press('f');await page.keyboard.down('w');await page.evaluate(()=>window.__animalTest.advance(13));await page.keyboard.up('w');
  const boat=await page.evaluate(()=>window.__animalTest.state());assert(boat.x>640&&boat.x<650);assert.equal(boat.air,10,'No drowning aboard');await page.keyboard.down(' ');await page.evaluate(()=>window.__animalTest.advance(1));await page.keyboard.up(' ');await page.keyboard.press('f');assert(!(await page.evaluate(()=>window.__animalTest.state())).driving);
  await page.evaluate(()=>{window.__animalTest.visit(760,-140);document.querySelector('#interact').click();});await page.click('#home-buy');assert((await page.evaluate(()=>window.__animalTest.state())).ownedHomes.includes('luxury-0-0'));await page.click('#home-close');
  await page.keyboard.press('m');await page.screenshot({path:'test-results/two-islands-map.png'});await page.click('#map-close');await page.evaluate(()=>window.__animalTest.visit(900,80));await page.screenshot({path:'test-results/luxury-island.png'});
  await page.click('#menu');await page.click('#back');await page.click('#play-online');await page.waitForFunction(()=>window.__animalTest.state().network==='online',null,{timeout:20000});
  const observer=await browser.newPage();observer.on('pageerror',e=>errors.push(e.message));await observer.goto('http://127.0.0.1:'+server.address().port+'/#smoke-test');await observer.click('#play-online');await observer.waitForFunction(()=>window.__animalTest.state().network==='online',null,{timeout:20000});
  for(const id of ['helicopter','plane','boat']){
    await page.evaluate(kind=>{window.__animalTest.visit(kind==='boat'?550:225,kind==='boat'?0:220);document.querySelector('#interact').click();},id);await page.click('[data-car="'+id+'"]');
    await page.evaluate(()=>{const c=window.__animalTest.state().carPosition;window.__animalTest.visit(c.x,c.y);});await page.keyboard.press('f');
    if(id!=='boat')await page.keyboard.down('q');if(id!=='helicopter')await page.keyboard.down('w');await page.evaluate(()=>window.__animalTest.advance(3));await page.keyboard.up('q');await page.keyboard.up('w');
    await observer.waitForFunction(id=>window.__animalTest.state().peers.some(p=>p.vehicle?.model===id&&(id==='boat'||p.vehicle.z>20)),id);
    if(id!=='boat'){await page.keyboard.down(' ');await page.keyboard.down('r');await page.evaluate(()=>window.__animalTest.advance(8));await page.keyboard.up(' ');await page.keyboard.up('r');await page.keyboard.press('f');}
  }
  assert.deepEqual(errors,[]);console.log('PASS navigation browser: flight controls, both aircraft, landing/exiting, boat crossing without drowning, docking, luxury purchase, world map and all three vehicles with altitude on real online server');
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
