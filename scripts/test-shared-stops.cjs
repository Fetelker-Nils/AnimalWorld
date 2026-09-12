const assert=require('node:assert/strict');
require('../world.js');require('../city-life.js');const Island=globalThis.AnimalIsland;

const shared=Island.busStops.filter(s=>s.lines.length>1);assert(shared.length>=10,'Many shared platforms');
assert(shared.some(s=>s.lines.length>=3),'Three-line interchange');
assert.equal(new Set(Island.busStops.map(s=>s.id)).size,Island.busStops.length,'One shelter per platform');
for(const stop of shared)for(const id of stop.lines){const line=Island.busLines.find(l=>l.id===id);assert(line.route.some(p=>p.stopId===stop.id&&p.name===stop.name),'Every advertised line actually stops');}
const queue=createCityLife(Island,[{id:'compact'}]);queue.cars.length=0;queue.walkers.length=0;
const front=queue.buses.find(b=>b.line==='2'),back=queue.buses.find(b=>b.line==='7');
Object.assign(front,{x:520,y:15.8,heading:0,speed:0,wait:14,doors:1});
Object.assign(back,{x:505,y:15.8,heading:0,speed:4,wait:0,doors:0,target:Island.busLines.find(l=>l.id==='7').route.findIndex(p=>p.x===520&&p.y===15.8)});
let waited=false;for(let i=0;i<90;i++){queue.tick(1/30,null,null);if(back.speed===0)waited=true;assert(front.x-back.x>9.2,'Queue without overlapping buses');}
assert(waited,'Following bus waits for its platform');console.log('PASS shared platforms, three-line interchange, real stops and bus queue spacing');

const village=Island.busStops.filter(s=>s.name==='Dorfkreuzung');assert.equal(village.length,2);
for(const stop of village)assert.deepEqual(stop.lines,['1','2','5','6'],'All four lines use the same village platform');
const service=createCityLife(Island,[{id:'compact'}]),visited=new Set();
for(let i=0;i<9000;i++){service.tick(.1,null,null);for(const b of service.buses)if(b.stop==='Dorfkreuzung'&&b.doors>.9)visited.add(b.line+':'+b.stopId);}
assert.equal(visited.size,8,'All four lines open their doors at both village platforms');
console.log('PASS village interchange: lines 1, 2, 5 and 6 serve both existing platforms');
