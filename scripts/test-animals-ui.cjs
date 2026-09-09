const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const {createServer}=require('./browser.cjs');
(async()=>{
  const server=createServer(path.resolve(__dirname,'../dist'));await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try{
    browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1100,height:750}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/#smoke-test');await page.click('#play');
    await page.evaluate(()=>{window.__animalTest.setTime(540);window.__animalTest.visit(0,-16);});
    await page.keyboard.press('v');await page.waitForTimeout(500);await page.screenshot({path:'test-results/mauz-3d-face.png'});
    assert((await page.evaluate(()=>window.__animalTest.state())).viewFront);await page.keyboard.press('v');
    await page.evaluate(()=>window.__animalTest.visit(-27,-34));await page.waitForTimeout(400);await page.screenshot({path:'test-results/animal-city.png'});
    for(const kind of ['lamp','tree']){
      await page.evaluate(()=>window.__animalTest.visit(10,-5));await page.click('#interact');await page.click('[data-car="roadster"]');
      assert(await page.evaluate(k=>window.__animalTest.crashSetup(k,100),kind));
      await page.keyboard.down('w');await page.waitForFunction(()=>!window.__animalTest.state().driving);await page.keyboard.up('w');
      const s=await page.evaluate(()=>window.__animalTest.state());assert.equal(s.car,null);assert(s.fallen.some(f=>f.kind===kind),'Hit must fell '+kind);
      await page.screenshot({path:'test-results/crash-'+kind+'.png'});
      await page.evaluate(()=>window.__animalTest.advance(5.1));assert.equal((await page.evaluate(()=>window.__animalTest.state())).fallen.length,0);
    }
    await page.evaluate(()=>window.__animalTest.visit(36,-72));await page.click('#interact');await page.evaluate(()=>window.__animalTest.visit(0,-3));await page.screenshot({path:'test-results/animal-hospital.png'});
    assert.deepEqual(errors,[]);console.log('PASS browser: front-facing 3D Mauz, city animals, vehicle explosions, fallen lamps/trees, respawn and animal receptionist');
  }finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
