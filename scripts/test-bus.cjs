const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),context=new Proxy({}, {get:(_,k)=>k==='measureText'?()=>({width:50}):k.startsWith('create')?()=>({addColorStop(){}}):()=>{},set:()=>true}),nodes={};
const sandbox={createIndoorRenderer:()=>({surface:{},render(){}}),Math,innerWidth:1280,innerHeight:850,devicePixelRatio:1,requestAnimationFrame(){},location:{hash:''},window:{localStorage:{getItem:()=>null,setItem(){}},addEventListener(){}},document:{querySelector(id){return nodes[id]||={hidden:true,focus(){},getContext:()=>context,addEventListener(){}};},querySelectorAll:()=>[]}};
vm.createContext(sandbox);
for(const file of ['world.js','housing.js','navigation.js','delivery.js','activities.js','vehicles.js','sound.js','day-cycle.js','multiplayer.js','city-services.js','animal-mesh.js','city-life.js','collisions.js','adventure.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'game.js'),'utf8').replace('  function frame(now)','  globalThis.busTest={busVehicleCollision,life,Island,mauz,keys,step,carryBus,busLocal,busPoint,busWalkable,setMode};\n  function frame(now)'),sandbox);
const {busVehicleCollision,life,Island,mauz,keys,step,carryBus,busLocal,busPoint,busWalkable,setMode}=sandbox.busTest;
setMode('playing');const bus=life.buses[0];life.tick(1,null,null);
Object.assign(mauz,busPoint(bus,{f:2.6,s:2.5}),{heading:bus.heading-Math.PI/2,jump:0,vz:0});
keys.add('w');for(let i=0;i<24;i++)step(1/60);keys.clear();assert.equal(mauz.busId,bus.id,'Walking through open doorway boards without a button');assert(mauz.jump>.4,'Boarding ramp lifts feet onto floor');
const start={x:mauz.x,y:mauz.y};for(let i=0;i<700;i++){life.tick(1/30,null,null);carryBus();}
assert(Math.hypot(mauz.x-start.x,mauz.y-start.y)>10,'Passenger is carried by automatic bus');assert.equal(bus.doors,0);assert(!busWalkable(...Object.values(busPoint(bus,{f:2.6,s:2}))), 'Closed door prevents exit');
let frames=0;while(bus.doors<.95&&frames++<10000){life.tick(1/30,null,null);carryBus();}assert(bus.doors>.9,'Bus opens at next stop');
mauz.heading=bus.heading+Math.PI/2;keys.add('w');for(let i=0;i<35;i++)step(1/60);keys.clear();assert.equal(mauz.busId,null,'Walk out at stop without interaction button');
const simulation=sandbox.createCityLife(Island,[{id:'compact'}]);simulation.cars.length=0;simulation.walkers.length=0;const visited=new Set();
for(let i=0;i<18000;i++){simulation.tick(1/30,null,null);for(const b of simulation.buses){assert(Island.onRoad(b.x,b.y,.1),'Bus stays on connected road');assert(!Island.blocked(b.x,b.y),'Route avoids buildings and water');if(b.doors>0){assert.equal(b.speed,0,'Only drive with closed doors');visited.add(b.stop);}}}
for(const name of Island.busStops.map(p=>p.name))assert(visited.has(name),'Visit '+name);
const doorBus=simulation.buses[0];doorBus.wait=1.5;doorBus.doors=1;const obstruction=busPoint(doorBus,{f:2.6,s:1.5});for(let i=0;i<100;i++)simulation.tick(1/30,obstruction,null);assert.equal(doorBus.speed,0);assert.equal(doorBus.doors,1,'Door sensor holds for a player in the doorway');
const replica=sandbox.createCityLife(Island,[{id:'compact'}]);replica.accept(simulation.snapshot());assert.equal(replica.buses[0].x,simulation.buses[0].x);assert.equal(replica.buses[0].doors,simulation.buses[0].doors);
console.log('PASS automatic bus loop, airport road, timed doors, walk-in boarding, carry, safe exit and network snapshot');

const packet=simulation.snapshot();replica.accept({...packet,buses:[...packet.buses,packet.buses[0]]});assert.equal(replica.buses.length,9,'Snapshots cannot duplicate a bus');
let impacts=0;const driver={x:Island.booths[0].x,y:Island.booths[0].y,jump:0};const vehicle=sandbox.createVehicles(Island,()=>true,()=>{impacts++;},()=>false,busVehicleCollision);assert(vehicle.spawn('compact',Island.booths[0],driver));Object.assign(driver,{x:vehicle.car.x,y:vehicle.car.y});assert(vehicle.toggle(driver));Object.assign(bus,{x:0,y:20,heading:Math.PI/2});Object.assign(vehicle.car,{x:0,y:10,heading:Math.PI/2,speed:30});for(let i=0;i<120;i++)vehicle.step(1/120,1,0,false,driver);assert(vehicle.car);assert.equal(vehicle.car.speed,0);assert.equal(impacts,0,'Bus collision never calls explosion/impact handler');
console.log('PASS all seven lines, unique bus replicas and non-explosive car/bus collision');

// The complete fleet must keep serving stops with NPC cars present.
const trafficRun=sandbox.createCityLife(Island,[{id:"compact"}]);
for(let i=0;i<36000;i++)trafficRun.tick(1/30,null,null);
for(const b of trafficRun.buses)assert(b.departure>15,"No traffic deadlock for "+b.id);

for(let x=535;x<=735;x+=.5){assert(!Island.inSea(x,14),"Continuous dry bridge");assert(!Island.blocked(x,14),"Bridge roadway clear");}
assert(Island.inSea(610,0),'Sea beside bridge remains water');assert(Island.bridgeBarrier(610,20),'Bridge side barrier');
const bridgeCar=sandbox.createVehicles(Island,(x,y)=>!Island.blocked(x,y)),traveller={x:Island.booths[0].x,y:Island.booths[0].y};
assert(bridgeCar.spawn('compact',Island.booths[0],traveller));Object.assign(traveller,{x:bridgeCar.car.x,y:bridgeCar.car.y});assert(bridgeCar.toggle(traveller));
Object.assign(bridgeCar.car,{x:535,y:15.8,heading:0,speed:0});
for(let i=0;i<600&&bridgeCar.car.x<700;i++)bridgeCar.step(1/30,1,0,false,traveller);
assert(bridgeCar.car.x>=700,'Drive across bridge to Perleninsel');
console.log('PASS bridge crossing, dry deck, water beside bridge and side barriers');
