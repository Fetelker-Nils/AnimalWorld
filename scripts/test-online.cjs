const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {createServer}=require('./browser.cjs');
(async()=>{
  const server=createServer(path.resolve(__dirname,'../dist'));
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser;
  try{
    browser=await chromium.launch({headless:true});
    const a=await browser.newPage({viewport:{width:1100,height:750}}),b=await browser.newPage({viewport:{width:1100,height:750}});
    const errors=[];for(const p of [a,b])p.on('pageerror',e=>errors.push(e.message));
    const url='http://127.0.0.1:'+server.address().port+'/#smoke-test';
    await Promise.all([a.goto(url),b.goto(url)]);
    await a.click('#play-online');await a.waitForFunction(()=>window.__animalTest.state().network==='online',null,{timeout:20000});
    await b.click('#play-online');await b.waitForFunction(()=>window.__animalTest.state().network==='online',null,{timeout:20000});
    await a.waitForFunction(()=>window.__animalTest.state().peers.length>=1);
    await a.evaluate(()=>window.__animalTest.visit(0,-8));
    await b.waitForFunction(()=>window.__animalTest.state().peers.some(p=>p.y===-8));
    const [as,bs]=await Promise.all([a.evaluate(()=>window.__animalTest.state()),b.evaluate(()=>window.__animalTest.state())]);
    assert(Math.abs(as.minutes-bs.minutes)<2,'Shared clock');
    await a.waitForFunction(()=>window.__animalTest.state().traffic[0].speed>0);
    const trafficA=await a.evaluate(()=>window.__animalTest.state().traffic),trafficB=await b.evaluate(()=>window.__animalTest.state().traffic);
    assert.equal(trafficA.length,8);assert.equal(trafficB.length,8);
    assert(Math.hypot(trafficA[0].x-trafficB[0].x,trafficA[0].y-trafficB[0].y)<3,'Shared server traffic');
    await a.click('#wave');await b.waitForFunction(()=>window.__animalTest.state().peers.some(p=>Date.now()-p.wave<2500));
    await b.screenshot({path:'test-results/online-two-players.png'});
    await a.evaluate(()=>window.__animalTest.visit(10,-5));await a.click('#interact');await a.click('[data-car="roadster"]');
    assert(await a.evaluate(()=>window.__animalTest.crashSetup('lamp',0)));await a.waitForTimeout(500);
    await a.evaluate(()=>window.__animalTest.crashSetup('lamp',100));await a.keyboard.down('w');
    await a.waitForFunction(()=>!window.__animalTest.state().driving);await a.keyboard.up('w');
    await b.waitForFunction(()=>window.__animalTest.state().fallen.some(f=>f.kind==='lamp'));
    await b.waitForFunction(()=>window.__animalTest.state().fallen.length===0,null,{timeout:10000});
    for(const p of [a,b]){
      await p.evaluate(()=>{window.__animalTest.visit(-18,-18);document.querySelector('#interact').click();window.__animalTest.visit(0,1);});
    }
    await b.waitForFunction(()=>window.__animalTest.state().peers.some(p=>p.room==='clothes'));
    await a.evaluate(()=>window.__animalTest.visit(-2,-1));
    await b.evaluate(()=>window.__animalTest.visit(0,4));
    await b.waitForFunction(()=>window.__animalTest.state().peers.some(p=>p.x===-2&&p.y===-1));
    await b.screenshot({path:'test-results/online-shop.png'});
    await a.click('#menu');await a.click('#back');
    await b.waitForFunction(()=>window.__animalTest.state().peers.length===0);
    await b.context().setOffline(true);
    // A failed connection must return to the menu and keep Offline usable.
    await b.click('#menu');await b.click('#back');await b.click('#play-online');
    await b.waitForFunction(()=>!document.querySelector('#play-online').disabled,null,{timeout:20000});
    await b.click('#play');assert.equal((await b.evaluate(()=>window.__animalTest.state())).online,false);
    assert.deepEqual(errors,[]);
    console.log('PASS real server: two independent browsers, positions, shared clock, wave, public interior, shared NPC traffic, shared crash/respawn, disconnect and offline fallback');
  }finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
