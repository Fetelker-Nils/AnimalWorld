const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const {createServer}=require('./browser.cjs');
(async()=>{
 const server=createServer(path.resolve(__dirname,'../dist'));await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});
 try{
  const p=await browser.newPage(),errors=[],clips=[];p.on('pageerror',e=>errors.push(e.message));
  p.on('response',r=>{if(r.url().endsWith('.mp3'))clips.push({url:r.url(),status:r.status()});});
  await p.goto('http://127.0.0.1:'+server.address().port+'/#smoke-test');await p.click('#play');
  await p.evaluate(()=>window.__animalTest.visit(550,0));await p.waitForFunction(()=>window.__animalTest.state().ambience.sea>0&&window.__animalTest.state().ambience.wind>0);
  await p.evaluate(()=>{
   window.speechSynthesis.speak=()=>{throw Error('Browser speech must never be used');};
   const t=window.__animalTest;t.advance(1);const b=t.state().buses[0],c=Math.cos(b.heading),s=Math.sin(b.heading);
   t.visit(b.x+c*2.6-s*2.5,b.y+s*2.6+c*2.5,b.heading-Math.PI/2);
   window.dispatchEvent(new KeyboardEvent('keydown',{key:'w'}));t.advance(.4);window.dispatchEvent(new KeyboardEvent('keyup',{key:'w'}));
  });
  await p.waitForFunction(()=>window.__animalTest.state().announcementPlaying);
  assert(clips.some(c=>c.url.endsWith('/line-1.mp3')&&c.status===200));
  assert(clips.some(c=>c.url.endsWith('/station-nordstadt.mp3')&&c.status===200));
  await p.evaluate(()=>window.__animalTest.advance(20));
  await p.waitForFunction(()=>window.__animalTest.state().announcementPlaying);
  assert(clips.some(c=>c.url.endsWith('/next-stadtzentrum.mp3')&&c.status===200),'Departure uses recorded next-stop clip');
  await p.click('#menu');await p.waitForFunction(()=>!window.__animalTest.state().announcementPlaying);
  assert.equal((await p.evaluate(()=>window.__animalTest.state())).ambience.sea,0,'Paused ambience silent');
  await p.click('#mute-audio');assert((await p.evaluate(()=>window.__animalTest.state())).muted);
  assert.deepEqual(errors,[]);console.log('PASS real browser MP3 boarding/departure playback, pause cancellation, mute and no speech synthesis');
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
