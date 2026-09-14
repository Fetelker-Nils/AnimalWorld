const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');const {createServer}=require('./browser.cjs');
(async()=>{const server=createServer(path.resolve(__dirname,'../dist'));await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});try{
 const p=await browser.newPage({viewport:{width:1100,height:800}}),errors=[];p.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});await p.goto('http://127.0.0.1:'+server.address().port+'/#smoke-test');await p.click('#play');
 await p.evaluate(()=>{const v=Island.venues.find(v=>v.id==='work-garden');window.__animalTest.visit(v.x,v.y);});await p.keyboard.press('e');assert.equal(await p.evaluate(()=>window.__animalTest.state().interior),'work-garden');
 await p.evaluate(()=>window.__animalTest.visit(0,-3));await p.keyboard.press('e');await p.click('[data-service="work-start"]');assert.equal(await p.evaluate(()=>window.__animalTest.state().activity),'garden');
 await p.screenshot({path:'test-results/garden-workplace.png'});await p.evaluate(()=>window.__animalTest.visit(0,11));await p.keyboard.press('e');
 await p.evaluate(()=>window.__animalTest.visit(-162,4));await p.keyboard.press('e');await p.waitForSelector('#skill-choices:not([hidden])');
 await p.locator('[data-work-choice="1"]').click();assert.equal(await p.evaluate(()=>window.__animalTest.state().done),0);await p.screenshot({path:'test-results/job-tool-choice.png'});
 await p.locator('[data-work-choice="0"]').click();await p.keyboard.down('e');await p.evaluate(()=>window.__animalTest.advance(1.8));await p.keyboard.up('e');assert.equal(await p.evaluate(()=>window.__animalTest.state().done),1);
 await p.evaluate(()=>{const v=Island.venues.find(v=>v.id==='work-repair');window.__animalTest.visit(v.x,v.y+9);});await p.screenshot({path:'test-results/repair-workplace.png'});
 assert.deepEqual(errors,[]);console.log('PASS workplace entry, reception contract, tool choices, wrong-answer retry, real work input and rendered workplaces');
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
