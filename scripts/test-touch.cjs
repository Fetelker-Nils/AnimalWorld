const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {createServer}=require('./browser.cjs');
(async()=>{
  const server=createServer(path.resolve(__dirname,'../dist'));await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try {
    browser=await chromium.launch({headless:true});
    const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:1});
    const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/#smoke-test');await page.locator('#play').tap();
    const cdp=await context.newCDPSession(page);
    const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
    const joy=await page.locator('#joystick').boundingBox();assert(joy&&joy.width>=100);
    const start=await page.evaluate(()=>window.__animalTest.state());
    const finger={id:1,x:joy.x+joy.width/2,y:joy.y+joy.height/2-35};
    await touch('touchStart',[finger]);await page.evaluate(()=>window.__animalTest.advance(.5));
    let state=await page.evaluate(()=>window.__animalTest.state());assert(state.stick.y<-.4);assert(Math.hypot(state.x-start.x,state.y-start.y)>1);
    const jump=await page.locator('#touch-jump').boundingBox();
    await touch('touchStart',[finger,{id:2,x:jump.x+jump.width/2,y:jump.y+jump.height/2}]);
    await page.evaluate(()=>window.__animalTest.advance(.1));assert((await page.evaluate(()=>window.__animalTest.state())).jump>0,'Jump works while steering');
    await touch('touchEnd',[]);state=await page.evaluate(()=>window.__animalTest.state());assert.equal(state.stick.y,0);
    await touch('touchStart',[finger]);await page.evaluate(()=>document.querySelector('#menu').click());assert.equal((await page.evaluate(()=>window.__animalTest.state())).stick.y,0);await touch('touchEnd',[]);await page.locator('#resume').tap();
    await page.evaluate(()=>{window.__animalTest.visit(160,8);});await page.locator('#interact').tap();
    await page.evaluate(()=>window.__animalTest.visit(148,4));
    const action=await page.locator('#interact').boundingBox();
    await touch('touchStart',[{id:3,x:action.x+action.width/2,y:action.y+action.height/2}]);
    await page.evaluate(()=>window.__animalTest.advance(2.1));await touch('touchEnd',[]);
    assert(await page.locator('#skill-game').isVisible());
    await page.screenshot({path:path.resolve(__dirname,'../test-results/touch-landscape.png')});
    const hitButton=await page.locator('#interact').boundingBox();
    for(let i=0;i<2;i++){
      await page.evaluate(()=>{const t=window.__animalTest,s=t.state();t.advance(((.48-(s.challenge.elapsed%1.6)/1.6+1)%1)*1.6);});
      await touch('touchStart',[{id:4,x:hitButton.x+hitButton.width/2,y:hitButton.y+hitButton.height/2}]);await touch('touchEnd',[]);
    }
    assert.equal((await page.evaluate(()=>window.__animalTest.state())).done,1);
    await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.resolve(__dirname,'../test-results/touch-portrait.png')});
    const bounds=await page.locator('#joystick').boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=390);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.deepEqual(errors,[]);console.log('PASS touch: analog joystick, multitouch, release, pause reset, timing job by touch and both orientations');
  } finally {if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
