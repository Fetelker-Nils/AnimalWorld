const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const {createServer}=require('./browser.cjs');
(async()=>{const server=createServer(path.resolve(__dirname,'../dist'));await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch();try{
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/#smoke-test');await page.click('#play');
const airports=await page.evaluate(()=>__animalTest.state().airports);
for(const [i,airport] of airports.entries()){
await page.evaluate(a=>__animalTest.visit(a.x-80,a.y+17),airport);await page.waitForFunction(()=>document.querySelector('#interact').textContent.includes('Flugplan'));
if(i===0){await page.evaluate(a=>__animalTest.visit(a.x-80,a.y+24,-Math.PI/2),airport);await page.screenshot({path:'test-results/airport-departures.png'});await page.evaluate(a=>__animalTest.visit(a.x-80,a.y+17),airport);}
if(i%2)await page.click('#interact');else await page.keyboard.press('e');
assert.equal((await page.evaluate(()=>__animalTest.state())).mode,'map');assert((await page.evaluate(()=>__animalTest.state())).busMap);assert.equal(await page.locator('#map-title').textContent(),'Live-Flugplan - '+airport.name);assert(await page.locator('#bus-map-panel').isVisible());assert(/Abfahrt in|Ankunft ca./.test(await page.locator('#bus-map-status').textContent()));
await page.selectOption('#bus-map-line','F1');assert((await page.locator('#bus-map-status').textContent()).includes('F1'));await page.keyboard.press('Escape');assert.equal((await page.evaluate(()=>__animalTest.state())).mode,'playing');
}
assert.deepEqual(errors,[]);console.log('PASS flight plan at all four airports: E, button, title, line selection and closing');
}finally{await browser.close();server.closeAllConnections();server.close();}})().catch(e=>{console.error(e);process.exitCode=1});
