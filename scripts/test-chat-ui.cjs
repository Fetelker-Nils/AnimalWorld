const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');const {createServer}=require('./browser.cjs');require('../chat-filter.js');
(async()=>{
 const root=path.resolve(__dirname,'..'),server=createServer(path.join(root,'dist'));await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});
 const sockets=new Map(),history=[];let serial=0;
 const broadcast=data=>{for(const s of sockets.values())s.send(JSON.stringify(data))};
 const roster=()=>broadcast({type:'roster',players:[...sockets].map(([id])=>({id,name:id==='1'?'Mauz':'Hase'}))});
 try{
  const errors=[];
  async function page(){
   const p=await browser.newPage({viewport:{width:1100,height:800}});p.on('pageerror',e=>errors.push(e.message));
   await p.route('http://127.0.0.1:'+server.address().port+'/',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'')}));
   await p.routeWebSocket('**/play',route=>{const id=String(++serial);sockets.set(id,route);route.onMessage(raw=>{const m=JSON.parse(raw);if(m.type==='chat-send'){const entry={id:String(history.length+1),playerId:id,name:id==='1'?'Mauz':'Hase',text:cleanChat(m.text)};history.push(entry);broadcast({type:'chat-message',message:entry})}if(m.type==='identity')roster();});route.onClose(()=>{sockets.delete(id);roster()});route.send(JSON.stringify({type:'welcome',id,minutes:540,players:[]}));route.send(JSON.stringify({type:'chat-history',messages:history}));});
   await p.goto('http://127.0.0.1:'+server.address().port+'/');await p.addScriptTag({url:'/multiplayer.js'});await p.addScriptTag({url:'/online-panel.js'});
   await p.evaluate(()=>{document.querySelector('.start-screen').hidden=true;document.querySelector('#game-ui').hidden=false;window.stops=0;const panel=createOnlinePanel(text=>net.chat(text),()=>window.stops++);const net=createMultiplayer(status=>panel.status(status,net.id),()=>{},()=>{},()=>{},data=>panel.receive(data));window.net=net;panel.show(true);net.connect(crypto.randomUUID());});
   return p;
  }
  const a=await page(),b=await page();await a.waitForFunction(()=>document.querySelectorAll('#online-players li').length===2);assert.match(await a.locator('#online-players').textContent(),/Mauz.*Hase/);
  await a.locator('#chat-input').fill('Hallo sch3isse <img src=x onerror=alert(1)>');await a.locator('#chat-input').press('Enter');await b.waitForFunction(()=>document.querySelector('#chat-log').textContent.includes('********'));assert.equal(await b.locator('#chat-log img').count(),0);assert.equal(await a.locator('#chat-input').inputValue(),'');assert(await a.evaluate(()=>window.stops>0));
  await a.screenshot({path:'test-results/chat-desktop.png'});await a.setViewportSize({width:390,height:844});await a.screenshot({path:'test-results/chat-mobile.png'});
  const box=await a.locator('#online-panel').boundingBox(),map=await a.locator('.mini-panel').boundingBox();assert(box.x+box.width<=map.x,'Panel does not cover minimap on phone');
  await a.click('#online-toggle');assert(await a.locator('#online-body').isHidden());await a.click('#online-toggle');
  await b.evaluate(()=>window.net.stop());await a.waitForFunction(()=>document.querySelectorAll('#online-players li').length===1);
  const c=await page();await c.waitForFunction(()=>document.querySelector('#chat-log').textContent.includes('********'));assert.deepEqual(errors,[]);console.log('PASS chat UI: live roster, send/receive, history on join, safe text rendering, typing focus, mobile layout, collapse and departure');
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
