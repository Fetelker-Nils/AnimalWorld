const assert=require('node:assert/strict');require('../world.js');require('../city-life.js');
const w=AnimalIsland,life=createCityLife(w,[{id:'compact'}]);
assert((w.continent.radius**2)/(560**2*1.2)>20,'Added land alone exceeds twenty previous land areas');assert(w.border**2/1300**2>20);
for(const t of life.trains.filter(t=>t.coach===0)){const station=w.railStations.find(s=>s.id===t.stopId);assert(Math.abs(Math.atan2(Math.sin(t.heading-station.heading),Math.cos(t.heading-station.heading)))<.01,'Station platforms align with trains');}
assert.equal(life.trains.length,75);assert.equal(new Set(life.trains.map(t=>t.service)).size,25);assert.equal(w.towns.length,28);for(const town of w.towns)assert(w.buildings.filter(b=>b.town===town.name).length>=8,'Populated town '+town.name);
const visited=new Set(),initial=new Map(life.trains.map(t=>[t.id,{...t}]));let bridge=false,tunnel=false;
for(let i=0;i<24000;i++){
 life.tick(.05,null,null);
 for(const t of life.trains){
  assert(Number.isFinite(t.x+t.y+t.heading));assert(w.inBounds(t.x,t.y));assert(!w.inSea(t.x,t.y),'Tracks on land or bridge');assert(!w.blocked(t.x,t.y),'Track is clear');
  const old=initial.get(t.id);assert(Math.hypot(t.x-old.x,t.y-old.y)<2.5,'Continuous train movement');initial.set(t.id,{...t});
  if(t.speed>0)assert.equal(t.doors,0,'Closed doors when moving');if(t.wait>0)visited.add(t.line+':'+t.stop);
  for(const r of w.railStructures)if(Math.abs(t.x-r.x)<r.w/2&&Math.abs(t.y-r.y)<r.d/2){if(r.kind==='bridge')bridge=true;else tunnel=true;}
 }
}
assert(bridge&&tunnel,'Trains use bridges and tunnels');assert.equal(visited.size,new Set(w.railStations.map(s=>s.line+':'+s.name)).size,'Both lines serve all their stops');
const replica=createCityLife(w,[{id:'compact'}]);replica.accept(life.snapshot());assert.deepEqual(replica.trains,life.trains);replica.accept(life.snapshot());assert.equal(replica.trains.length,75);
console.log('PASS 20x land, 28 towns, 25 trains/75 coaches, continuous rails, doors, stops, tunnels, bridges and snapshots');
