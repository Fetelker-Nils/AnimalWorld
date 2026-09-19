const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c=vm.createContext({});for(const f of ['world.js','city-life.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c);const world=vm.runInContext('Island',c);
for(const name of [...world.towns.map(t=>t.name),'Dorf','Perleninsel']){
 const jobs=world.jobs.filter(j=>j.settlement===name);assert.equal(jobs.length,2,name);
 for(const j of jobs){assert(world.venues.some(v=>v.jobId===j.id));for(const p of [j,...j.points]){assert(!world.blocked(p.x,p.y),j.id);assert(!world.onRoad(p.x,p.y,1),j.id);}}
}
const sim=c.createCityLife(world,[{id:'compact'}]);const local=world.busLines.filter(l=>Number(l.id)>=8);
for(const line of local){const fleet=sim.buses.filter(b=>b.line===line.id);assert.equal(fleet.length,2,line.id);assert(Math.hypot(fleet[0].x-fleet[1].x,fleet[0].y-fleet[1].y)>20);}
const before=new Map(sim.buses.map(b=>[b.id,{x:b.x,y:b.y}]));
for(let i=0;i<1200;i++)sim.tick(1/30,null,null);
for(const line of local)for(const b of sim.buses.filter(b=>b.line===line.id)){const p=before.get(b.id);assert(Math.hypot(b.x-p.x,b.y-p.y)>10,'Bus moves: '+b.id);assert(world.onRoad(b.x,b.y,1));assert(!world.blocked(b.x,b.y));}
const replica=c.createCityLife(world,[{id:'compact'}]);replica.accept(sim.snapshot());assert.equal(replica.buses.length,sim.buses.length);assert.equal(new Set(replica.buses.map(b=>b.id)).size,sim.buses.length);
console.log('PASS 20 local jobs, accessible work sites, two moving buses per station line and unique network bus IDs');
