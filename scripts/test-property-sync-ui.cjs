const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),vm=require('node:vm');
const {createServer}=require('./browser.cjs');
(async()=>{
 const root=path.resolve(__dirname,'..'),server=createServer(path.join(root,'dist'));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const c=vm.createContext({Date,DurableObject:class{constructor(ctx){this.ctx=ctx}},WebSocketRequestResponsePair:class{}});
 for(const f of ['city-life.js','world.js','housing.js','property-ledger.js','chat-filter.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
 vm.runInContext(fs.readFileSync(path.join(root,'multiplayer-worker.mjs'),'utf8').replace(/^import .*;\r?$/gm,'').replace('export default','const worker =').replace('export class World','class World')+'\nglobalThis.World=World;',c);
 const db=new Map();let transactions=Promise.resolve(),blocks=Promise.resolve();
 const store={async get(k){return db.get(k)},async put(k,v){db.set(k,v)},async delete(k){db.delete(k)},async list(){return new Map([...db].filter(([k])=>k.startsWith('property:')))},transaction(fn){const p=transactions.then(()=>fn(store));transactions=p.catch(()=>{});return p;}};
 const ctx={getWebSockets:()=>[],setWebSocketAutoResponse(){},storage:store,blockConcurrencyWhile(fn){const p=blocks.then(fn);blocks=p.catch(()=>{});return p;}};
 const world=new c.World(ctx,{});await blocks;
 const browser=await chromium.launch({headless:true});
 try{
  const p=await browser.newPage({viewport:{width:1100,height:750}}),errors=[];p.setDefaultTimeout(45000);p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
  await p.addInitScript(()=>{if(!localStorage.getItem('animal-world-deliveries-v1'))localStorage.setItem('animal-world-deliveries-v1',JSON.stringify({coins:20000,completed:0}));});
  let serial=0;
  await p.routeWebSocket('**/play',route=>{const ws={send:s=>route.send(s),serializeAttachment(){},close(){}};const user={id:'test-'+(++serial),x:0,y:0,heading:0,jump:0,room:'world',car:null,last:0};world.sessions.set(ws,user);route.onMessage(raw=>{if(JSON.parse(raw).type!=='state')world.webSocketMessage(ws,raw).catch(e=>errors.push(e.message));});route.onClose(()=>world.sessions.delete(ws));route.send(JSON.stringify({type:'welcome',id:user.id,minutes:world.minutes(),players:[]}));});
  const a=c.AnimalIsland.homes.find(h=>h.id==='village'),b=c.AnimalIsland.homes.find(h=>h.id==='east');
  async function review(h){await p.evaluate(h=>{window.__animalTest.visit(h.x,h.y);document.querySelector('#interact').click()},h);await p.waitForSelector('#home-screen:not([hidden])');}
  await p.goto('http://127.0.0.1:'+server.address().port+'/#smoke-test',{waitUntil:'domcontentloaded'});await p.click('#play');
  for(const h of [a,b]){await review(h);await p.click('#home-buy');await p.click('#home-close');}
  console.log('Connecting with offline properties');await p.reload({waitUntil:'domcontentloaded'});await p.click('#play-online');await p.waitForFunction(ids=>ids.every(id=>window.__animalTest.state().soldHomes.includes(id)),[a.id,b.id]);
  console.log('Claims completed');assert.equal(await p.evaluate(()=>window.__animalTest.state().ownedHomes.length),2);assert.equal(db.size>=2,true);
  console.log('Selling online');await review(a);await p.click('#home-sell');await p.waitForFunction(id=>!window.__animalTest.state().ownedHomes.includes(id),a.id);assert(!db.has('property:'+a.id));
  const afterOnlineSale=20000-a.price-b.price+Math.floor(a.price*.8);assert.equal(await p.evaluate(()=>window.__animalTest.state().coins),afterOnlineSale);
  await p.screenshot({path:'test-results/property-sale.png'});
  console.log('Switching offline');await p.reload({waitUntil:'domcontentloaded'});await p.click('#play');assert.deepEqual(await p.evaluate(()=>window.__animalTest.state().ownedHomes),[b.id]);
  await review(b);await p.click('#home-sell');assert.equal(await p.evaluate(()=>window.__animalTest.state().coins),afterOnlineSale+Math.floor(b.price*.8));
  console.log('Releasing offline sale');await p.reload({waitUntil:'domcontentloaded'});await p.click('#play-online');await p.waitForFunction(()=>window.__animalTest.state().propertyReady&&window.__animalTest.state().soldHomes.length===0);assert(!db.has('property:'+b.id));
  assert.deepEqual(errors,[]);console.log('PASS property UI against actual isolated worker: two offline purchases, online claims, sale confirmation, payout, offline persistence and offline sale release');
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
