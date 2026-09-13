const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const {createServer}=require('./browser.cjs');
(async()=>{const server=createServer(path.resolve(__dirname,'../dist'));await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});try{
 const p=await browser.newPage({viewport:{width:1100,height:750}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:'+server.address().port+'/#smoke-test');await p.click('#play');
 await p.evaluate(()=>{const t=window.__animalTest;t.advance(1);const b=t.state().trains[0];t.visit(b.x-20,b.y+22,Math.atan2(-22,20));});await p.screenshot({path:'test-results/train-station.png'});
 await p.evaluate(()=>{const t=window.__animalTest,b=t.state().trains[0],c=Math.cos(b.heading),s=Math.sin(b.heading);t.visit(b.x+c*2.6*b.scaleF-s*2.5*b.scaleS,b.y+s*2.6*b.scaleF+c*2.5*b.scaleS,b.heading-Math.PI/2);window.dispatchEvent(new KeyboardEvent('keydown',{key:'w'}));t.advance(.5);window.dispatchEvent(new KeyboardEvent('keyup',{key:'w'}));});
 await p.waitForFunction(()=>window.__animalTest.state().busRide?.id.startsWith('train-'));
 await p.waitForFunction(()=>window.__animalTest.state().announcementPlaying);
 await p.screenshot({path:'test-results/train-interior.png'});
 await p.evaluate(()=>{const t=window.__animalTest;t.boardBus(t.state().trains[0].id);});await p.click('#interact');assert(Number.isInteger((await p.evaluate(()=>window.__animalTest.state())).busRide.seat));
 await p.evaluate(()=>window.__animalTest.advance(45));const riding=await p.evaluate(()=>window.__animalTest.state());assert(riding.trains[0].speed>0);assert(Math.hypot(riding.x-riding.trains[0].x,riding.y-riding.trains[0].y)<12,'Ride follows train');
 await p.evaluate(()=>{window.__animalTest.boardBus(null);window.__animalTest.visit(-2640,-10,Math.PI);});await p.screenshot({path:'test-results/rail-tunnel.png'});
 await p.evaluate(()=>window.__animalTest.visit(-4200,-28,Math.PI/2));await p.screenshot({path:'test-results/rail-bridge.png'});
 await p.evaluate(()=>window.__animalTest.visit(-1000,-45,-Math.PI/2));await p.screenshot({path:'test-results/weststadt.png'});
 await p.click('#map-open');await p.screenshot({path:'test-results/rail-world-map.png'});assert.deepEqual(errors,[]);console.log('PASS train walk-in, MP3, sitting, travel, new city, tunnel, bridge and map');
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
