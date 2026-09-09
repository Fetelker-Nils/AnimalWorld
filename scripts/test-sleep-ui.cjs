const {chromium}=require('playwright');
const assert=require('node:assert/strict'),path=require('node:path');
const {createServer}=require('./browser.cjs');
(async()=>{
 const server=createServer(path.resolve(__dirname,'../dist'));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage();let socket,requests=[];
  await page.routeWebSocket('**/play',ws=>{socket=ws;ws.onMessage(raw=>{const m=JSON.parse(raw);if(m.type==='sleep'){requests.push(m.sleeping);ws.send(JSON.stringify({type:'sleep',sleepers:m.sleeping?1:0,total:2}));}});ws.send(JSON.stringify({type:'welcome',id:'tester',minutes:1260,players:[]}));});
  await page.addInitScript(()=>localStorage.setItem('animal-world-deliveries-v1',JSON.stringify({coins:0,completed:0,ownedHomes:['village'],homeId:'village'})));
  await page.goto('http://127.0.0.1:'+server.address().port+'/#smoke-test');await page.click('#play-online');await page.waitForFunction(()=>window.__animalTest.state().network==='online');
  await page.evaluate(()=>{window.__animalTest.visit(-12,65.5);document.querySelector('#interact').click();});await page.click('#home-enter');
  await page.evaluate(()=>window.__animalTest.visit(-5.2,-8));await page.keyboard.press('e');
  await page.waitForFunction(()=>document.querySelector('#sleep-message').textContent.startsWith('1 / 2'));assert((await page.evaluate(()=>window.__animalTest.state())).sleeping);
  await page.click('#sleep-cancel');await page.waitForFunction(()=>window.__animalTest.state().mode==='playing');
  await page.keyboard.press('e');await page.waitForFunction(()=>window.__animalTest.state().sleeping);
  socket.send(JSON.stringify({type:'notice',code:'sleep-rejected',message:'Schlafen nicht moeglich.'}));await page.waitForFunction(()=>window.__animalTest.state().mode==='playing');
  await page.keyboard.press('e');await page.waitForFunction(()=>window.__animalTest.state().sleeping);
  socket.send(JSON.stringify({type:'wake',minutes:1860}));await page.waitForFunction(()=>window.__animalTest.state().clock==='07:00'&&!window.__animalTest.state().sleeping);
  assert(requests.includes(false));console.log('PASS online sleep UI with simulated protocol: waiting count, cancellation, rejection recovery and shared morning');
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
