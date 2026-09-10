const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const c=vm.createContext({});for(const f of ['world.js','vehicles.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../'+f),'utf8'),c);
vm.runInContext('globalThis.w=Island;globalThis.models=VehicleModels',c);const w=c.w;
assert(Math.abs(w.luxury.radius**2/w.radius**2-.2)<1e-9);assert.equal(w.homes.filter(h=>h.id.startsWith('luxury-')).length,20);
for(const h of w.homes.filter(h=>h.id.startsWith('luxury-')))assert(!w.blocked(h.x,h.y),'Villa door accessible');
for(const booth of w.booths.filter(b=>b.kind))for(const m of c.models.filter(m=>m.kind===booth.kind)){
 const v=c.createVehicles(w,(x,y)=>!w.blocked(x,y)),p={x:booth.x,y:booth.y};assert(v.spawn(m.id,booth,p),'Spawn '+m.id+' at '+booth.name);
}
const v=c.createVehicles(w,(x,y)=>!w.blocked(x,y)),p={x:550,y:0};
assert(!v.spawn('plane',w.booths.find(b=>b.kind==='boat'),p),'Wrong station rejected');
assert(v.spawn('boat',w.booths.find(b=>b.kind==='boat'),p));p.x=563;p.y=2.6;assert(v.toggle(p));
for(let i=0;i<1900;i++){v.car.speed=3;v.step(1/60,0,0,false,p);}
assert(v.car.x>640&&v.car.x<650,'Crossed sea and stopped at island');v.stop();assert(v.toggle(p),'Exit onto destination pier');assert(!w.inSea(p.x,p.y));
const air=w.booths.find(b=>b.kind==='air');Object.assign(p,{x:air.x,y:air.y});assert(v.spawn('helicopter',air,p));Object.assign(p,{x:v.car.x,y:v.car.y});assert(v.toggle(p));
for(let i=0;i<180;i++)v.step(1/60,0,0,false,p,1);assert(v.car.z>40,'Vertical takeoff');assert(!v.toggle(p),'No airborne exit');
v.car.heading=0;for(let i=0;i<2500;i++)v.step(1/60,1,0,false,p,0);assert(w.inBounds(v.car.x,v.car.y),'World border stops flight');assert(v.car.x>1150,'Can fly over both islands');
Object.assign(v.car,{x:900,y:155,speed:0});for(let i=0;i<400;i++)v.step(1/60,0,0,false,p,-1);assert.equal(v.car.z,0);assert(v.toggle(p),'Land and exit on luxury island');
Object.assign(p,{x:air.x,y:air.y});assert(v.spawn('plane',air,p));Object.assign(p,{x:v.car.x,y:v.car.y});assert(v.toggle(p));v.step(1/60,0,0,false,p,1);assert.equal(v.car.z,0,'Plane requires airspeed');
for(let i=0;i<180;i++)v.step(1/60,1,0,false,p,1);assert(v.car.z>20,'Plane takeoff');
const airHits=[];const crash=c.createVehicles(w,(x,y)=>!w.blocked(x,y),hit=>airHits.push(hit));Object.assign(p,{x:air.x,y:air.y});assert(crash.spawn('helicopter',air,p));Object.assign(p,{x:crash.car.x,y:crash.car.y});assert(crash.toggle(p));Object.assign(crash.car,{x:760,y:-170,z:5,speed:20,heading:Math.PI/2});for(let i=0;i<100&&crash.car;i++)crash.step(1/60,1,0,false,p);assert(!crash.car);assert(airHits.length);assert(!w.inSea(p.x,p.y),'Crash safely returns to land');
console.log('PASS navigation: one-fifth luxury island, 20 accessible villas, all air/boat spawns, sea crossing/docking, vertical flight, airplane takeoff, landing and world border');
