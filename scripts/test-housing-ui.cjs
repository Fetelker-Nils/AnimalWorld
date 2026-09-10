const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),vm=require('node:vm');
const {createServer}=require('./browser.cjs');
(async()=>{
 const root=path.resolve(__dirname,'..'),server=createServer(path.join(root,'dist'));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const c=vm.createContext({Date,DurableObject:class{constructor(ctx){this.ctx=ctx;}},WebSocketRequestResponsePair:class{}});
 for(const f of ['city-life.js','world.js','housing.js','property-ledger.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
 vm.runInContext(fs.readFileSync(path.join(root,'multiplayer-worker.mjs'),'utf8').replace(/^import .*;\r?$/gm,'').replace('export default','const worker =').replace('export class World','class World')+'\nglobalThis.World=World;',c);
 const db=new Map();let tail=Promise.resolve();const store={async get(k){return db.get(k);},async put(k,v){db.set(k,v);},async list(){return new Map([...db].filter(([k])=>k.startsWith('property:')));},transaction(fn){const result=tail.then(()=>fn(store));tail=result.catch(()=>{});return result;}};
 const ctx={getWebSockets:()=>[],setWebSocketAutoResponse(){},storage:store,blockConcurrencyWhile(fn){this.ready=fn();}};
 const world=new c.World(ctx,{});await ctx.ready;world.clockOffset=1260-world.minutes();
 const browser=await chromium.launch({headless:true});
 try{
  const errors=[],url='http://127.0.0.1:'+server.address().port+'/#smoke-test';let serial=0;
  async function player(){
   const p=await browser.newPage({viewport:{width:1100,height:750}});p.on('pageerror',e=>errors.push(e.message));
   await p.addInitScript(()=>{if(!localStorage.getItem('animal-world-deliveries-v1'))localStorage.setItem('animal-world-deliveries-v1',JSON.stringify({coins:20000,completed:0}));});
   await p.routeWebSocket('**/play',route=>{const ws={send:s=>route.send(s),serializeAttachment(){},close(){}};const user={id:'test-'+(++serial),x:0,y:0,heading:0,jump:0,room:'world',car:null,last:0};world.sessions.set(ws,user);
    route.onMessage(raw=>{world.webSocketMessage(ws,raw).catch(e=>errors.push(e.message));});route.onClose(()=>world.remove(ws));route.send(JSON.stringify({type:'welcome',id:user.id,minutes:world.minutes(),players:[]}));});
   await p.goto(url);await p.click('#play-online');await p.waitForFunction(()=>window.__animalTest.state().propertyReady);return p;
  }
  const a=await player(),b=await player(),home=c.AnimalIsland.homes.find(h=>h.type==='apartment');
  async function review(p,h){await p.evaluate(h=>{window.__animalTest.visit(h.x,h.y);document.querySelector('#interact').click();},h);if(h.id!==h.buildingId)await p.selectOption('#home-unit',h.id);}
  await review(a,home);await review(b,home);
  await Promise.all([a.evaluate(()=>document.querySelector('#home-buy').click()),b.evaluate(()=>document.querySelector('#home-buy').click())]);
  await a.waitForFunction(()=>!document.querySelector('#home-message').textContent.includes('bestaetigt'));await b.waitForFunction(()=>!document.querySelector('#home-message').textContent.includes('bestaetigt'));
  const states=await Promise.all([a.evaluate(()=>window.__animalTest.state()),b.evaluate(()=>window.__animalTest.state())]);assert.equal(states.filter(s=>s.ownedHomes.includes(home.id)).length,1,'Exactly one buyer');
  const owner=states[0].ownedHomes.includes(home.id)?a:b,other=owner===a?b:a;
  assert(await other.locator('#home-buy').isDisabled());assert.equal((await other.evaluate(()=>window.__animalTest.state())).coins,20000,'Losing buyer keeps coins');
  await owner.click('#home-enter');await owner.evaluate(()=>{window.__animalTest.visit(-8,4);document.querySelector('#interact').click();});await owner.click('#home-enter');await owner.waitForFunction(()=>window.__animalTest.state().depthRenderer);const layout=(await owner.evaluate(()=>window.__animalTest.state())).layout;assert(layout.w<18);await owner.screenshot({path:'test-results/apartment-interior.png'});
  await owner.evaluate(()=>{const e=window.__animalTest.state().layout.exit;window.__animalTest.visit(e.x,e.y);document.querySelector('#interact').click();});assert((await owner.evaluate(()=>window.__animalTest.state())).interior.startsWith('lobby:'));
  async function stairs(p,direction){await p.evaluate(direction=>{
   const t=window.__animalTest; t.visit(0,.3);
   for(let i=1;i<=96;i++){
    const a=Math.PI/2+direction*i*Math.PI/48,x=3.3*Math.cos(a),y=-3+3.3*Math.sin(a),s=t.state();
    t.visit(s.x,s.y,Math.atan2(y-s.y,x-s.x));window.dispatchEvent(new KeyboardEvent('keydown',{key:'w'}));
    t.advance(Math.hypot(x-s.x,y-s.y)/4.5);window.dispatchEvent(new KeyboardEvent('keyup',{key:'w'}));
   }
  },direction);}
  await stairs(owner,1);assert.equal((await owner.evaluate(()=>window.__animalTest.state())).floor,1);
  await owner.waitForTimeout(250);const ownerId=(await owner.evaluate(()=>window.__animalTest.state())).networkId;await other.waitForFunction(id=>window.__animalTest.state().peers.some(p=>p.id===id&&Math.abs(p.elevation-4)<.1),ownerId);
  await owner.screenshot({path:'test-results/apartment-stairs.png'});
  await owner.evaluate(()=>{window.__animalTest.visit(8,4);document.querySelector('#interact').click();});assert((await owner.locator('#home-title').textContent()).includes('Wohnung B'));
  await owner.click('#home-close');await stairs(owner,-1);await owner.evaluate(()=>{window.__animalTest.visit(0,10);document.querySelector('#interact').click();});
  await other.click('#home-close');const unit=c.AnimalIsland.homes.find(h=>h.buildingId===home.buildingId&&h.floor===1&&h.unit===1);await review(other,unit);await other.click('#home-buy');await other.waitForFunction(id=>window.__animalTest.state().ownedHomes.includes(id),unit.id);
  await owner.reload();await owner.click('#play-online');await owner.waitForFunction(id=>window.__animalTest.state().ownedHomes.includes(id),home.id);assert.equal((await owner.evaluate(()=>window.__animalTest.state())).coins,20000-home.price,'Reconnect preserves ownership without double debit');
  const villa=c.AnimalIsland.homes.find(h=>h.type==='villa');await review(owner,villa);await owner.click('#home-buy');await owner.waitForFunction(id=>window.__animalTest.state().ownedHomes.includes(id),villa.id);await owner.click('#home-enter');assert((await owner.evaluate(()=>window.__animalTest.state())).layout.w>30);await owner.waitForTimeout(200);assert((await owner.evaluate(()=>window.__animalTest.state())).cameraDistance>1.8,'Camera uses actual large-room bounds');await owner.screenshot({path:'test-results/villa-interior.png'});
  await other.click('#home-enter');await stairs(other,1);await other.evaluate(()=>{window.__animalTest.visit(8,4);document.querySelector('#interact').click();});await other.click('#home-enter');
  for(const p of [owner,other]){await p.evaluate(()=>{const l=window.__animalTest.state().layout;window.__animalTest.visit(l.bed.x-Math.sign(l.bed.x)*2.8*l.w/24,l.bed.y);});await p.waitForTimeout(250);await p.keyboard.press('e');}
  await owner.waitForFunction(()=>!window.__animalTest.state().sleeping&&window.__animalTest.state().clock==='07:00');await other.waitForFunction(()=>!window.__animalTest.state().sleeping&&window.__animalTest.state().clock==='07:00');
  const restored=new c.World(ctx,{});await ctx.ready;assert(restored.properties.size>=3,'Ownership survives a fresh server instance');
  assert.deepEqual(errors,[]);console.log('PASS housing UI with isolated server: competing buyers, refund, persistent identity, separate floor owners, apartment/villa sizes, stairs and room rendering');
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
