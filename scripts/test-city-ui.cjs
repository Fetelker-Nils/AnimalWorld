const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const {createServer}=require('./browser.cjs');
(async()=>{
  const server=createServer(path.resolve(__dirname,'../dist'));await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try{
    browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/#smoke-test');
    await page.evaluate(()=>localStorage.setItem('animal-world-deliveries-v1',JSON.stringify({coins:1000,completed:0})));
    await page.reload();await page.locator('#play').tap();
    const visit=(x,y)=>page.evaluate(([x,y])=>window.__animalTest.visit(x,y),[x,y]);
    async function counter(x,y){await visit(x,y);await page.locator('#interact').tap();await visit(0,-3);await page.locator('#interact').tap();assert(await page.locator('#service-screen').isVisible());}
    async function leave(){await visit(0,10);await page.locator('#interact').tap();}
    await counter(18,-123);await page.locator('[data-service="deposit"]').tap();
    let s=await page.evaluate(()=>window.__animalTest.state());assert.equal(s.bankBalance,100);assert.equal(s.coins,900);
    await page.locator('#interact').tap();await page.screenshot({path:'test-results/bank-touch.png'});await page.locator('[data-service="withdraw"]').tap();await leave();
    await counter(18,-36);await page.locator('[data-service="meal"]').tap();s=await page.evaluate(()=>window.__animalTest.state());assert.equal(s.coins,980);assert(s.meal>170);await leave();
    await counter(36,-72);await page.locator('[data-service="therapy"]').tap();s=await page.evaluate(()=>window.__animalTest.state());assert(s.therapy>170);await leave();
    await counter(-36,-123);await page.locator('[data-service="mission"]').tap();await leave();
    for(const y of [85,200,350]){await visit(0,y);await page.locator('#interact').tap();}
    s=await page.evaluate(()=>window.__animalTest.state());assert.equal(s.done,3);assert.equal(s.coins,980);
    await counter(-36,-123);await page.locator('[data-service="finish"]').tap();s=await page.evaluate(()=>window.__animalTest.state());assert.equal(s.coins,1190);assert.equal(s.activity,null);
    assert.deepEqual(errors,[]);console.log('PASS touch city services: bank deposit/withdraw, meal purchase, therapy and complete market mission with reception payout');
  }finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
