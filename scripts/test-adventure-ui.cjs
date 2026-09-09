const {chromium}=require('playwright');
const assert=require('node:assert/strict'),path=require('node:path');
const {createServer}=require('./browser.cjs');
(async()=>{
  const server=createServer(path.resolve(__dirname,'../dist'));await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({headless:true});
  try{
    const a=await browser.newPage(),b=await browser.newPage(),errors=[];
    for(const p of [a,b]){p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:'+server.address().port+'/#smoke-test');}
    await a.fill('#character-name','Lilo');await a.selectOption('#character-species','fox');await a.click('#play');
    assert.equal((await a.evaluate(()=>window.__animalTest.state())).species,'fox');
    await a.evaluate(()=>{window.__animalTest.visit(563,0);window.__animalTest.advance(4);});
    assert(await a.locator('#water-status').isVisible());
    await a.evaluate(()=>window.__animalTest.advance(7));
    const rescued=await a.evaluate(()=>window.__animalTest.state());assert(Math.hypot(rescued.x,rescued.y)<559);assert.equal(rescued.air,10);
    await a.reload();assert.equal(await a.inputValue('#character-name'),'Lilo');assert.equal(await a.inputValue('#character-species'),'fox');
    for(const p of [a,b]){await p.click('#play-online');await p.waitForFunction(()=>window.__animalTest.state().network==='online',null,{timeout:20000});}
    await b.waitForFunction(()=>window.__animalTest.state().peers.some(p=>p.name==='Lilo'&&p.species==='fox'));
    await a.evaluate(()=>{window.__animalTest.visit(10,-5);document.querySelector('#interact').click();});await a.click('[data-car="compact"]');
    const car=await a.evaluate(()=>window.__animalTest.state().carPosition);
    await a.evaluate(p=>window.__animalTest.visit(p.x,p.y),car);await b.evaluate(p=>window.__animalTest.visit(p.x,p.y+2),car);
    await b.waitForFunction(()=>window.__animalTest.state().peers.some(p=>p.vehicle));await b.waitForTimeout(250);await b.keyboard.press('f');
    await b.waitForFunction(()=>window.__animalTest.state().riding);
    await a.keyboard.press('f');await a.keyboard.down('w');await a.waitForTimeout(700);await a.keyboard.up('w');
    await a.keyboard.down(' ');await a.waitForTimeout(600);await a.keyboard.up(' ');
    await b.waitForTimeout(300);const [driver,guest]=await Promise.all([a.evaluate(()=>window.__animalTest.state()),b.evaluate(()=>window.__animalTest.state())]);
    assert(Math.hypot(driver.x-guest.x,driver.y-guest.y)<2,'Passenger follows moving car');
    await b.keyboard.press('f');await b.waitForFunction(()=>!window.__animalTest.state().riding);
    assert.deepEqual(errors,[]);console.log('PASS adventure UI: animal/name selection and persistence, sea air countdown and rescue, real online profiles and passenger entering/following/exiting');
  }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
