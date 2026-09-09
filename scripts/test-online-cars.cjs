const {chromium,firefox}=require('playwright');
const assert=require('node:assert/strict'),path=require('node:path');
const {createServer}=require('./browser.cjs');
(async()=>{
  const server=createServer(path.resolve(__dirname,'../dist'));await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const engine=process.argv.includes('--chromium')?chromium:firefox;
  const browser=await engine.launch({headless:true});
  try{
    const a=await browser.newPage({viewport:{width:2560,height:1440},deviceScaleFactor:2}),b=await browser.newPage();
    const errors=[];for(const page of [a,b]){page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('Renderer process crashed'));
      await page.goto('http://127.0.0.1:'+server.address().port+'/#smoke-test');await page.click('#play-online');await page.waitForFunction(()=>window.__animalTest.state().network==='online',null,{timeout:20000});}
    const booths=await a.evaluate(()=>Island.booths.filter(b=>!b.kind));
    for(const [i,booth] of booths.entries()){
      const model=['compact','roadster','pickup'][i%3];
      await a.evaluate(b=>{window.__animalTest.visit(b.x,b.y);document.querySelector('#interact').click();},booth);
      await a.click('[data-car="'+model+'"]');
      const car=await a.evaluate(()=>window.__animalTest.state().carPosition);assert(car);
      await a.evaluate(p=>window.__animalTest.visit(p.x,p.y),car);await b.evaluate(p=>window.__animalTest.visit(p.x,p.y+7),car);
      await a.keyboard.press('f');let state=await a.evaluate(()=>window.__animalTest.state());assert(state.driving,'Enter '+model+' at '+booth.name);
      assert(state.renderPixels<=2073600,'Bounded high-DPI render surface');
      await b.waitForFunction(id=>window.__animalTest.state().peers.some(p=>p.car===id),model);
      await a.keyboard.down('w');await a.waitForTimeout(250);await a.keyboard.up('w');await a.keyboard.down(' ');await a.waitForTimeout(500);await a.keyboard.up(' ');
      const after=await a.evaluate(()=>window.__animalTest.state());assert(after.renderedFrames>state.renderedFrames+2,'Render loop survives driving');assert.equal(after.network,'online');
      await a.keyboard.press('f');assert(!(await a.evaluate(()=>window.__animalTest.state())).driving,'Exit');
    }
    await a.bringToFront();
    await a.evaluate(()=>{if(window.__animalTest.state().mode==='pause')document.querySelector('#resume').click();window.__animalTest.visit(36,-72);});
    await a.click('#interact');
    assert.equal((await a.evaluate(()=>window.__animalTest.state())).interior,'hospital',JSON.stringify(errors));
    await a.waitForFunction(()=>window.__animalTest.state().depthRenderer).catch(async e=>{console.error('Interior diagnostics',errors,await a.evaluate(()=>({mode:window.__animalTest.state().mode,frames:window.__animalTest.state().renderedFrames})));throw e;});
    await a.evaluate(()=>{window.__animalTest.visit(0,10);document.querySelector('#interact').click();});
    assert(!(await a.evaluate(()=>window.__animalTest.state())).depthRenderer,'Release interior GPU resources');
    assert.deepEqual(errors,[]);console.log('PASS '+engine.name()+': two online clients, all 10 booths, all 3 car models, entering/driving/exiting, live remote cars, bounded graphics memory and interior cleanup');
  }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
