const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const {createServer}=require('./browser.cjs');
(async()=>{const server=createServer(path.resolve(__dirname,'../dist'));await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});
 try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/#smoke-test');await page.click('#play');await page.evaluate(()=>window.__animalTest.visit(-45,-25));await page.keyboard.press('m');await page.click('#map-locate');
  const b=await page.locator('#map-canvas').boundingBox(),x=b.x+b.width/2+18*(273/1300)*4*b.width/600,y=b.y+b.height/2;
  await page.mouse.click(x,y,{button:'right'});const route=(await page.evaluate(()=>window.__animalTest.state())).route;assert(route&&route.points.length>2&&route.length>18,JSON.stringify({route,toast:await page.locator('#toast').textContent()}));await page.screenshot({path:'test-results/route-detour.png'});
  await page.mouse.click(x,y,{button:'right'});assert.equal((await page.evaluate(()=>window.__animalTest.state())).route,null);assert.deepEqual(errors,[]);console.log('PASS map: right-click sets obstacle-aware route at zoomed map coordinates; next right-click removes it');
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
