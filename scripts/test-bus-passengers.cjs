const assert=require('node:assert/strict');
require('../world.js');require('../city-life.js');
const world=AnimalIsland,life=createCityLife(world,[{id:'compact'}]),seen=new Set();
assert.equal(life.commuters.length,9);
const last=new Map(life.commuters.map(p=>[p.id,{x:p.x,y:p.y}]));
for(let i=0;i<12000;i++){
 life.tick(.05,null,null);
 for(const p of life.commuters){
  seen.add(p.stage);assert(Number.isFinite(p.x+p.y+p.z));assert(!world.blocked(p.x,p.y),'Passenger outside buildings/water');
  const old=last.get(p.id);assert(Math.hypot(old.x-p.x,old.y-p.y)<1.2,'Walk/ride continuously without teleporting');last.set(p.id,{x:p.x,y:p.y});
  if(p.busId){const b=life.buses.find(b=>b.id===p.busId);assert(b);if(p.stage!=='seated'){assert.equal(b.speed,0);assert(b.doors>.9,'Only pass through open doors');}}
 }
 for(const b of life.buses){const riders=life.commuters.filter(p=>p.busId===b.id);assert(riders.length<=4);assert.equal(new Set(riders.map(p=>p.seat)).size,riders.length,'Seats are reserved once');}
}
for(const stage of ['waiting','boarding','seated','exiting'])assert(seen.has(stage),stage);
assert(life.commuters.every(p=>p.trips>0),'Every commuter completes a bus trip');
const replica=createCityLife(world,[{id:'compact'}]);replica.accept(life.snapshot());replica.accept(life.snapshot());
assert.equal(replica.commuters.length,9);assert.deepEqual(replica.commuters.map(p=>[p.id,p.x,p.y,p.stage,p.busId]),life.commuters.map(p=>[p.id,p.x,p.y,p.stage,p.busId]));
console.log('PASS NPC passengers: continuous boarding/riding/exiting, open doors, free seats, completed journeys and shared snapshots');
