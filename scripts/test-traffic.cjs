const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const c=vm.createContext({Date});for(const f of ['world.js','vehicles.js','city-life.js','collisions.js','animal-mesh.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),c);
vm.runInContext('globalThis.world=Island;globalThis.models=VehicleModels',c);
const life=c.createCityLife(c.world,c.models),start=life.cars.map(v=>v.distance);
for(let i=0;i<3600;i++){
  life.tick(1/60,null,null);
  for(const p of [...life.cars,...life.walkers])assert(!c.world.blocked(p.x,p.y),'NPC entered building/water: '+p.id+' '+p.x+','+p.y);
}
life.cars.forEach((v,i)=>assert(v.distance>start[i]+10,'Traffic must make progress'));
const car=life.cars[0];car.speed=7;life.tick(.1,{x:car.x+Math.cos(car.heading)*5,y:car.y+Math.sin(car.heading)*5},null);assert.equal(car.speed,0,'Traffic stops for player');
const damage=c.createSceneryDamage([{x:2,y:0}],[{x:2,y:1}]),impact={x:0,y:0,heading:0,speed:70/3.6,model:{length:4,width:2}};
assert.equal(damage.hit(impact).length,0,'Exactly 70 does not fell objects');impact.speed=71/3.6;assert.equal(damage.hit(impact).length,2);
damage.tick(4.99);assert.equal(damage.fallen.length,2);damage.tick(.02);assert.equal(damage.fallen.length,0,'Respawn after five seconds');
const world={heightAt:()=>0,booths:[{x:0,y:0,sx:0,sy:6}]};let impacts=[];
const vehicles=c.createVehicles(world,(x,y)=>y<12,e=>impacts.push(e));const player={x:0,y:0};
assert(vehicles.spawn('roadster',world.booths[0],player));Object.assign(player,{x:0,y:6});assert(vehicles.toggle(player));vehicles.car.heading=Math.PI/2;vehicles.car.speed=25;
for(let i=0;i<60&&vehicles.driving;i++)vehicles.step(1/60,1,0,false,player);
assert.equal(vehicles.car,null);assert(!vehicles.driving);assert(impacts[0].speed*3.6>70);assert(player.y<12,'Safe driver position');
const mesh=c.animalMesh({x:0,y:0,heading:0},null,0,0);assert(mesh.length>100);assert(mesh.every(f=>f.points.every(p=>p.every(Number.isFinite))));
assert(mesh.some(f=>f.points.some(p=>p[0]>.35)),'Face geometry projects forward');
console.log('PASS traffic: building-free paths, progress, yielding; strict crash threshold, five-second respawn, safe ejection and real 3D geometry');

const coarse=c.animalMesh({x:0,y:0,heading:0},null,0,0,.5);
assert(coarse.length<mesh.length*.6,'Distant animals use substantially fewer polygons');
const references=mesh.flatMap(f=>f.points),unique=new Set(references);
assert(unique.size<references.length*.6,'Faces share vertices instead of allocating duplicates');
console.log('PASS bounded mesh detail and shared geometry vertices');
