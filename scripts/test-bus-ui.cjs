const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const {createServer}=require('./browser.cjs');
(async()=>{const server=createServer(path.resolve(__dirname,'../dist'));await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});try{
 const p=await browser.newPage({viewport:{width:1000,height:700}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:'+server.address().port+'/#smoke-test');await p.click('#play');
 await p.evaluate(()=>{window.__animalTest.advance(1);const b=window.__animalTest.state().buses[0];window.__animalTest.visit(b.x-9,b.y+7,Math.atan2(-7,9));});await p.screenshot({path:'test-results/bus-stop.png'});
 await p.evaluate(()=>{const t=window.__animalTest,b=t.state().buses[0],c=Math.cos(b.heading),s=Math.sin(b.heading);t.visit(b.x+c*2.6-s*2.5,b.y+s*2.6+c*2.5,b.heading-Math.PI/2);window.dispatchEvent(new KeyboardEvent('keydown',{key:'w'}));t.advance(.4);window.dispatchEvent(new KeyboardEvent('keyup',{key:'w'}));});
 assert((await p.evaluate(()=>window.__animalTest.state())).busRide,'Board through open door');await p.screenshot({path:'test-results/bus-interior.png'});assert.deepEqual(errors,[]);console.log('PASS bus exterior, walk-in boarding and interior camera in browser');
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
