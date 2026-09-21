const assert=require('node:assert/strict');require('../city-life.js');require('../world.js');
const world={towns:[],crossings:[{id:'cross',x:0,y:0,vertical:true,width:10}],busLines:[{id:'1',starts:[0],route:[{x:0,y:-60,name:'A'},{x:0,y:100,name:'B'},{x:100,y:100},{x:100,y:-60}]}],railLines:[{id:'R1',starts:[0],route:[{x:-100,y:0,name:'West'},{x:100,y:0,name:'East'},{x:100,y:100},{x:-100,y:100}]}]};
function setup(y){const life=createCityLife(world,[{id:'car'}]);life.cars.length=life.walkers.length=life.commuters.length=0;Object.assign(life.buses[0],{x:0,y,heading:Math.PI/2,wait:0,doors:0});const state=life.snapshot();Object.assign(state.railServices[0],{distance:70,wait:0,doors:0});life.accept(state);return life;}
let life=setup(0);for(let i=0;i<400;i++)life.tick(.05,null,null);assert(life.buses[0].y>20,'Bus clears exit gate');assert(life.trains[0].x>20,'Train resumes after bus clears');
life=setup(-25);for(let i=0;i<40;i++)life.tick(.05,null,null);assert(life.buses[0].y<-14,'Approaching bus stops before closed crossing');
world.crossings.push({id:'adjacent',x:0,y:18,vertical:true,width:10});
life=setup(10);for(let i=0;i<400;i++)life.tick(.05,null,null);assert(life.buses[0].y>35,'Bus clears adjacent crossing gates as one area');
// Exact line/rectangle clipping checks the full network, not only station centres.
for(const s of AnimalIsland.railStations)for(const line of AnimalIsland.railLines)for(let i=0;i<line.route.length;i++){
 const a=line.route[i],b=line.route[(i+1)%line.route.length],c=Math.cos(s.heading),v=Math.sin(s.heading);
 const ax=(a.x-s.x)*c+(a.y-s.y)*v,ay=-(a.x-s.x)*v+(a.y-s.y)*c,bx=(b.x-s.x)*c+(b.y-s.y)*v,by=-(b.x-s.x)*v+(b.y-s.y)*c;
 let lo=0,hi=1;for(const [x,d,h] of [[ax,bx-ax,40],[ay,by-ay,4.5]]){if(Math.abs(d)<1e-8){if(Math.abs(x)>=h){lo=2;break;}}else{let t1=(-h-x)/d,t2=(h-x)/d;lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));}}
 assert(lo>=hi,`${s.name} (${s.id}) overlaps ${line.id}`);
}
console.log('PASS crossing clearance, entrance stop and all platform/track footprints');
