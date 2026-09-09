const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
  let now=Date.UTC(2026,8,8)+600000;
  class Clock extends Date{static now(){return now;}}
  const c=vm.createContext({Date:Clock,DurableObject:class{constructor(ctx){this.ctx=ctx;}},WebSocketRequestResponsePair:class{}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../city-life.js'),'utf8'),c);
  const source=fs.readFileSync(path.join(__dirname,'../multiplayer-worker.mjs'),'utf8').replace(/^import .*;\r?$/gm,'').replace('export default','const worker =').replace('export class World','class World');
  vm.runInContext(source+'\nglobalThis.World=World;',c);
  const saved=new Map(),ctx={getWebSockets:()=>[],setWebSocketAutoResponse(){},blockConcurrencyWhile(fn){this.ready=fn();},storage:{async get(k){return saved.get(k);},async put(k,v){saved.set(k,v);}}};
  const world=new c.World(ctx,{});await ctx.ready;
  function add(id,room='home:'+id){const ws={messages:[],send(s){this.messages.push(JSON.parse(s));},serializeAttachment(){},close(){}};const p={id,x:-8,y:-8,room,car:null,vehicle:null,last:0};world.sessions.set(ws,p);return {ws,p};}
  const a=add('a'),b=add('b');
  await world.webSocketMessage(a.ws,JSON.stringify({type:'sleep',sleeping:true}));assert(!a.ws.messages.some(m=>m.type==='wake'));assert.equal(world.minutes()%1440,1260);
  await world.webSocketMessage(a.ws,JSON.stringify({type:'sleep',sleeping:false}));assert(!a.p.sleeping);
  await world.webSocketMessage(a.ws,JSON.stringify({type:'sleep',sleeping:true}));await world.webSocketMessage(b.ws,JSON.stringify({type:'sleep',sleeping:true}));
  assert.equal(world.minutes()%1440,420);assert(saved.has('clockOffset'));assert(!a.p.sleeping&&!b.p.sleeping);
  assert(a.ws.messages.some(m=>m.type==='wake'));assert(b.ws.messages.some(m=>m.type==='wake'));
  await world.webSocketMessage(a.ws,JSON.stringify({type:'sleep',sleeping:true}));assert(!a.p.sleeping,'No daytime sleep');
  world.clockOffset=0;await world.webSocketMessage(a.ws,JSON.stringify({type:'sleep',sleeping:true}));await world.remove(b.ws);assert.equal(world.minutes()%1440,420,'Disconnect updates the sleep quorum');
  Object.assign(a.p,{room:'world',x:0,y:0,vehicle:{x:0,y:0,heading:0,speed:0,model:'compact'}});
  const passenger=add('passenger','world'),third=add('third','world');Object.assign(passenger.p,{x:1,y:0});Object.assign(third.p,{x:1,y:0});
  await world.webSocketMessage(passenger.ws,JSON.stringify({type:'ride',owner:'a'}));assert.equal(passenger.p.riding,'a');
  await world.webSocketMessage(third.ws,JSON.stringify({type:'ride',owner:'a'}));assert(!third.p.riding,'Seat cannot be double-booked');
  a.p.vehicle.speed=8;await world.webSocketMessage(passenger.ws,JSON.stringify({type:'ride',owner:null}));assert.equal(passenger.p.riding,'a','No unsafe exit');
  a.p.vehicle.x=10;now+=200;
  await world.webSocketMessage(passenger.ws,JSON.stringify({type:'state',x:99,y:99,heading:0,jump:0,room:'world',name:' Lilo ',species:'fox'}));assert.equal(passenger.p.x,10,'Passenger follows owner');assert.equal(passenger.p.name,'Lilo');assert.equal(passenger.p.species,'fox');
  a.p.vehicle.speed=0;await world.webSocketMessage(passenger.ws,JSON.stringify({type:'ride',owner:null}));assert.equal(passenger.p.riding,null);
  Object.assign(passenger.p,{x:10,y:0});await world.webSocketMessage(passenger.ws,JSON.stringify({type:'ride',owner:'a'}));await world.remove(a.ws);assert.equal(passenger.p.riding,null,'Owner disconnect frees passenger');
  const pilot=add('pilot','world');now+=200;
  const state={type:'state',x:900,y:155,heading:0,jump:0,room:'world',car:'helicopter',vehicle:{model:'helicopter',x:900,y:155,z:60,heading:0,speed:20}};
  await world.webSocketMessage(pilot.ws,JSON.stringify(state));assert.equal(pilot.p.vehicle.z,60);assert.equal(pilot.p.x,900);
  now+=200;await world.webSocketMessage(pilot.ws,JSON.stringify({...state,x:1301}));assert.equal(pilot.p.x,900,'Server enforces world border');
  now+=200;await world.webSocketMessage(pilot.ws,JSON.stringify({...state,vehicle:{...state.vehicle,z:999}}));assert.equal(pilot.p.vehicle.z,60,'Server rejects invalid altitude');
  console.log('PASS shared server: all-player sleep vote, morning, cancellation/disconnect, saved clock offset, seat arbitration, safe exit, passenger movement and profiles');
})().catch(e=>{console.error(e);process.exitCode=1;});
