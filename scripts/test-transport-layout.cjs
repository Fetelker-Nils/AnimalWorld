const assert=require('node:assert/strict');require('../world.js');require('../city-life.js');
const w=AnimalIsland,life=createCityLife(w,[{id:'compact'}]);
for(const station of w.railStations){
 const vertical=Math.abs(Math.sin(station.heading))>.5,W=vertical?9:80,D=vertical?80:9;
 assert(![...w.roads,...w.buildings].some(o=>Math.abs(station.x-o.x)<(W+o.w)/2&&Math.abs(station.y-o.y)<(D+o.d)/2),'Clear platform '+station.name+' '+station.line);
 if(station.lines.length>1)assert(w.railStations.filter(s=>s.name===station.name).every((s,i,all)=>all.every(t=>s===t||Math.hypot(s.trackX-t.trackX,s.trackY-t.trackY)>5)),'Separate tracks at shared stations');
 const nearest=Math.min(...w.busStops.filter(s=>s.name.includes(station.name==='Mauz Hauptbahnhof'?'Mauz':station.name)).map(s=>Math.hypot(s.x-station.x,s.y-station.y)));
 assert(nearest<220,'Station bus connection '+station.name+' '+nearest);
}
for(const line of w.railLines)for(let i=0;i<line.route.length;i++){
 const a=line.route[i],b=line.route[(i+1)%line.route.length],dx=b.x-a.x,dy=b.y-a.y;
 for(const road of w.roads){const vertical=road.d>road.w,parallel=vertical?Math.abs(dx)<.01:Math.abs(dy)<.01;
  if(!parallel)continue;const lateral=vertical?Math.abs(a.x-road.x):Math.abs(a.y-road.y),width=vertical?road.w:road.d;
  const overlap=Math.min(vertical?Math.max(a.y,b.y):Math.max(a.x,b.x),(vertical?road.y:road.x)+(vertical?road.d:road.w)/2)-Math.max(vertical?Math.min(a.y,b.y):Math.min(a.x,b.x),(vertical?road.y:road.x)-(vertical?road.d:road.w)/2);
  assert(!(lateral<width/2+2&&overlap>8),'Rails run along road '+line.id+' '+JSON.stringify({a,b,road}));
 }
}
assert(w.crossings.length>0);let closed=false,opened=false;const gates=new Set();
for(let i=0;i<2400;i++){life.tick(.5);for(const c of life.crossings){if(c.closed){
 if(!closed){const car=life.cars[0];Object.assign(car,{x:c.x+(c.vertical?0:-15),y:c.y+(c.vertical?-15:0),heading:c.vertical?Math.PI/2:0,speed:7});life.tick(0);assert.equal(car.speed,0,'NPC car stops before closed gate');}
 closed=true;gates.add(c.id);if(c.gate>.15)assert(life.crossingBlocked(c.x+(c.vertical?0:9),c.y+(c.vertical?9:0)));}else if(gates.has(c.id)&&c.gate===0)opened=true;}}
assert(closed&&opened,'Gates close and reopen after trains');
const copy=createCityLife(w,[{id:'compact'}]);copy.accept(life.snapshot());assert.deepEqual(copy.crossings,life.crossings,'Shared crossing state');
console.log('PASS clear platforms, shared tracks, station buses, separated rail corridors and synchronized collision gates');

assert(w.railStations.some(s=>s.lines.length>1),'Interchanges remain available');
function samples(line,step=3){return line.route.flatMap((a,i)=>{const b=line.route[(i+1)%line.route.length],d=Math.hypot(b.x-a.x,b.y-a.y);return Array.from({length:Math.ceil(d/step)},(_,i)=>({x:a.x+(b.x-a.x)*i*step/d,y:a.y+(b.y-a.y)*i*step/d}));});}
const railPoints=w.railLines.flatMap(l=>samples(l));
for(const b of w.buildings)assert(railPoints.every(p=>Math.hypot(Math.max(0,Math.abs(p.x-b.x)-b.w/2),Math.max(0,Math.abs(p.y-b.y)-b.d/2))>=10),'Safety strip beside '+b.homeId);
for(const [id,other] of [['R3','R1'],['R4','R2']]){
 const points=samples(w.railLines.find(l=>l.id===id),20),old=samples(w.railLines.find(l=>l.id===other),20);
 assert(points.filter(p=>old.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<60)).length/points.length<.25,'Independent itinerary '+id);
}
assert.equal(w.homes.find(h=>h.id==='residence-43').building.y,-34,'Moved house keeps its saved ownership ID');
console.log('PASS building clearance, stable house identity and distinct R3/R4 routes');
