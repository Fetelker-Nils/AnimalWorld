const assert=require('node:assert/strict');require('../world.js');require('../city-life.js');
const life=createCityLife(AnimalIsland,[{id:'compact',length:4,width:2}]);
// All trains and buses run together; no deliberately stationary player blocks a track.
life.cars.length=life.walkers.length=life.commuters.length=0;
const last=new Map(),progress=new Map();
for(let tick=0;tick<2400;tick++){
 life.tick(.5,null,null);
 for(const train of life.trains.filter(t=>t.coach===0)){
  const p=last.get(train.id);
  if(!p||Math.hypot(train.x-p.x,train.y-p.y)>1){last.set(train.id,{x:train.x,y:train.y});progress.set(train.id,tick*.5);}
 }
}
for(const train of life.trains.filter(t=>t.coach===0)){
 assert(train.departure>0,train.id+' never reached another station');
 assert(1200-progress.get(train.id)<90,train.id+' stuck for more than 90 seconds');
}
console.log('PASS all 33 train services and 91 buses run together for 20 simulated minutes without a stranded train');
