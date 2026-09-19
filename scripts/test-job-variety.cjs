const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const c=vm.createContext({});for(const f of ['world.js','activities.js','city-services.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c);vm.runInContext('globalThis.world=Island',c);
let coins=0;const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},wallet={active:false,addReward:n=>coins+=n},jobs=c.createActivities(c.world,wallet,storage);c.createCityServices(c.world,wallet,jobs);
function solve(player){let guard=0;while(jobs.challenge){assert(++guard<12);const q=jobs.challenge;if(q.kind==='choice'){const before=jobs.done.size;if(guard===1)jobs.choose((q.answer+1)%3,player);assert.equal(jobs.done.size,before);jobs.choose(q.answer,player);}else{jobs.tick(q.period*.56,player,false,false);jobs.interact(player,false);}}}
for(const spec of c.world.jobs){
 const before=coins;assert(spec.venue?jobs.startVenue(spec.venue):jobs.start(spec.id,spec));
 if(spec.kind==='taxi'){for(const point of jobs.active.points){jobs.interact(point,true,4);assert.equal(coins,before);jobs.interact(point,true,0);}assert.equal(coins,before+spec.reward);continue;}
 for(const point of jobs.active.points){jobs.interact(point,false);if(jobs.carrying!==null){assert.equal(jobs.done.size,jobs.active.points.indexOf(point));assert.equal(jobs.target(point).id,spec.id);jobs.interact(spec,false);solve(spec);}else{solve(point);if(spec.kind==='hold'){jobs.tick(spec.seconds+.1,point,false,true);solve(point);}}}
 assert.equal(coins,before,'No premature reward');assert.equal(jobs.done.size,jobs.active.points.length);
 if(spec.venue)jobs.finishVenue(spec.venue);else jobs.finishWorkplace(spec.workplace);assert.equal(coins,before+spec.reward);assert.equal(jobs.interact(spec,false),null);
}
const taxi=c.world.jobs.find(j=>j.id==='taxi');jobs.start('taxi',taxi);assert.equal(jobs.active.points.length,3,'Next taxi shift has an intermediate stop');const stops=jobs.active.points.slice();jobs.interact(stops[0],true);jobs.interact(stops[1],true);assert(jobs.active,'Intermediate stop does not finish trip');jobs.interact(stops[2],true);assert.equal(jobs.active,null);
const a=c.createActivities(c.world,wallet,storage);a.start('garden',c.world.jobs.find(j=>j.id==='garden'));a.interact(a.active.points[0],false);assert(a.challenge.prompt.includes('Unkraut'),'Next shift changes assignment');
assert.equal(c.world.venues.filter(v=>v.jobId).length,c.world.jobs.filter(j=>!j.venue).length);for(const v of c.world.venues.filter(v=>v.jobId)){assert(!c.world.blocked(v.x,v.y));assert(v.building.w>=10&&v.building.h>=5);}
console.log('PASS all jobs: decisions, wrong answers, carrying/sorting, preparation, timing, multi-stop taxi, rotating saved shifts, payouts and all workplaces');
