const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');const {createServer}=require('./browser.cjs');
(async()=>{const server=createServer(path.resolve(__dirname,'../dist'));await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});try{
 const p=await browser.newPage({viewport:{width:1000,height:850}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{if(!localStorage.getItem('test-world-seed')){localStorage.setItem('test-world-seed','yes');localStorage.setItem('animal-world-deliveries-v1',JSON.stringify({coins:123,completed:4}));}});
 await p.goto('http://127.0.0.1:'+server.address().port+'/#smoke-test');assert.equal(await p.locator('.world-slot').count(),4);
 await p.click('[data-slot="1"]');await p.waitForFunction(()=>window.__animalTest?.state().saveWorld===1);assert.equal(await p.evaluate(()=>window.__animalTest.state().coins),0);
 await p.fill('#world-name','Meine zweite Insel');await p.locator('#world-name').blur();await p.fill('#character-name','Lilo');await p.selectOption('#character-species','fox');await p.click('#play');
 assert.equal(await p.evaluate(()=>window.__animalTest.state().name),'Lilo');
 await p.evaluate(()=>localStorage.setItem('animal-world-slot-2:animal-world-deliveries-v1',JSON.stringify({coins:456,completed:2})));
 await p.reload();await p.click('#play-online');await p.waitForFunction(()=>window.__animalTest.state().online&&window.__animalTest.state().mode==='playing');assert.equal(await p.evaluate(()=>window.__animalTest.state().coins),456);
 await p.click('#menu');await p.click('#back');await p.click('[data-slot="0"]');await p.waitForFunction(()=>window.__animalTest?.state().saveWorld===0);assert.equal(await p.evaluate(()=>window.__animalTest.state().coins),123);assert.equal(await p.inputValue('#character-name'),'Mauz');
 await p.click('[data-slot="1"]');await p.waitForFunction(()=>window.__animalTest?.state().saveWorld===1);assert.equal(await p.inputValue('#character-name'),'Lilo');assert.equal(await p.inputValue('#world-name'),'Meine zweite Insel');
 await p.setViewportSize({width:390,height:740});await p.screenshot({path:'test-results/save-worlds-mobile.png',fullPage:true});await p.click('#play');assert.equal(await p.evaluate(()=>window.__animalTest.state().coins),456);assert.equal(await p.evaluate(()=>window.__animalTest.state().mode),'playing');assert.deepEqual(errors,[]);console.log('PASS browser world creation/switching, shared online/offline wallet, independent profile and mobile menu');
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
