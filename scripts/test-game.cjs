const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'..');
const data=new Map();
const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
const context=new Proxy({}, {get:(_,key)=>key==='measureText'?()=>({width:50}):key.startsWith('create')?()=>({addColorStop(){}}):()=>{},set:()=>true});
const nodes={};
const sandbox={createIndoorRenderer:()=>({surface:{},render(){}}),Math,innerWidth:1280,innerHeight:850,devicePixelRatio:1,requestAnimationFrame(){},location:{hash:''},window:{localStorage:storage,addEventListener(){}},document:{querySelector(id){return nodes[id]||={hidden:true,focus(){},getContext:()=>context,addEventListener(){}};},querySelectorAll:()=>[]}};
vm.createContext(sandbox);
for(const file of ['world.js','delivery.js','activities.js','vehicles.js','sound.js','day-cycle.js','multiplayer.js','city-services.js','animal-mesh.js','city-life.js','collisions.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'game.js'),'utf8').replace('  function frame(now)','  globalThis.probe={mauz,camera,keys,step,walkable,point,groundAt,draw,buildingVisible,segmentBox,outdoorHit,outdoorCameraLimit,markerOccluded,indoorCameraLimit,indoorWalkable,nearBed,enterVenue,enterHome,leaveHome,interact,setMode,roomName,Island,job,activities,vehicles};\n  function frame(now)'),sandbox);
const {mauz,camera,keys,step,walkable,point,groundAt,draw,buildingVisible,segmentBox,outdoorHit,outdoorCameraLimit,markerOccluded,indoorCameraLimit,indoorWalkable,nearBed,enterVenue,enterHome,leaveHome,interact,setMode,roomName,Island,job,activities,vehicles}=sandbox.probe;
// Regression: nearby walls remain visible even with an offscreen/behind-camera centre.
const originalCamera={...camera};
Object.assign(camera,{x:0,y:0,z:0,heading:0});
assert(buildingVisible({x:-8,y:5,w:10,d:8,h:15,city:true}),'Wall crossing near plane must stay visible');
assert(buildingVisible({x:0,y:20,w:10,d:40,h:15,city:true}),'Offscreen centre must not hide visible wall');
assert(buildingVisible({x:20,y:0,w:10,d:100,h:100,city:true}),'Wall enclosing viewport must stay visible');
assert(!buildingVisible({x:-30,y:0,w:4,d:4,h:5,city:true}),'Entirely behind camera');
assert(!buildingVisible({x:0,y:100,w:4,d:4,h:5,city:true}),'Entirely outside side plane');
Object.assign(camera,originalCamera);
assert.equal(Island.radius,560);
assert((Island.radius/240)**2>=5,'At least five times the playable area');
assert.equal(Island.buildings.filter(b=>b.city).length,56);
assert.equal(Island.heightAt(Island.mountain.x,Island.mountain.y),38);
assert(!walkable(Island.pond.x,Island.pond.y));
assert(!walkable(561,0));
for(const building of Island.buildings)assert(!walkable(building.x,building.y));
function finishTiming(){
  const before=activities.done.size;
  assert(activities.challenge);
  assert.equal(activities.interact(mauz,false).type,'miss');assert.equal(activities.done.size,before);
  while(activities.challenge){activities.tick(.92,mauz,false,false);activities.interact(mauz,false);}
  assert.equal(activities.done.size,before+1);
}
function walkRoute(waypoints){
  keys.add('w');keys.add('shift');
  for(const [x,y] of waypoints){
    let frames=0;const limit=Math.ceil(Math.hypot(mauz.x-x,mauz.y-y)/8*60)+600;
    while(Math.hypot(mauz.x-x,mauz.y-y)>.15){
      mauz.heading=Math.atan2(y-mauz.y,x-mauz.x);step(1/60);
      assert(++frames<limit,`Unreachable waypoint ${x},${y}; stopped at ${mauz.x},${mauz.y}`);
    }
  }
  keys.clear();
}
assert.equal(job.interact(mauz),null,'Cannot accept remotely');
walkRoute([[-10,-2]]);
assert.equal(job.interact(mauz).type,'accepted');
assert.equal(job.interact(mauz),null,'Cannot collect reward at depot');
walkRoute([[0,0],[0,-16],[18,-16],[18,-18]]);
assert.equal(job.interact(mauz).reward,35);
assert.equal(job.interact(mauz),null,'Cannot collect twice');
walkRoute([[18,-16],[0,-16],[0,0],[-10,-2]]);
assert.equal(job.interact(mauz).type,'accepted');
walkRoute([[0,0],[0,66],[12,66],[12,65.5]]);
assert.equal(job.interact(mauz).reward,60);
walkRoute([[12,66],[0,66],[0,0],[-10,-2]]);
job.interact(mauz);
walkRoute([[0,0],[0,-70],[-36,-70],[-36,-72]]);
assert.equal(job.interact(mauz).reward,50);
assert.equal(job.coins,145);
const restored=sandbox.createDeliveryJob(storage,Island);
assert.equal(restored.coins,145);assert.equal(restored.completed,3);assert(!restored.active);
const broken=sandbox.createDeliveryJob({getItem(){throw Error();},setItem(){throw Error();}},Island);
broken.interact(Island.depot);broken.interact(Island.deliveries[0]);assert.equal(broken.coins,35);assert(!broken.storageAvailable);
// Walk up the actual spiral, including the transition onto raised terrain.
mauz.x=124;mauz.y=-40;
const m=Island.mountain;
const trail=Array.from({length:121},(_,i)=>{const t=i/120,r=m.radius*(1-t),a=t*Math.PI*5;return [m.x+Math.cos(a)*r,m.y+Math.sin(a)*r];});
walkRoute(trail);
for(let i=0;i<120;i++)step(1/60);
assert(Island.heightAt(mauz.x,mauz.y)>37.7);assert(camera.z>37.5);
for(const heading of [-3,-1,0,1,3]){camera.heading=heading;draw();}
// Screen-to-ground picking follows elevation, not the old flat plane.
camera.x=0;camera.y=0;camera.z=0;camera.heading=-Math.PI/2;
for(const [x,y] of [[0,0],[10,-10],[-5,-40]]){const p=point(x,y),q=groundAt(p.x,p.y);assert(q);assert(Math.hypot(q.x-x,q.y-y)<.01);}
console.log('PASS: all three deliveries reached on foot, exact rewards, repeat prevention, persistence, unavailable storage, city/water/coast collisions, spiral ascent and elevated camera');

// Four additional contracts, each with its own interaction rules.
mauz.x=0;mauz.y=14;
for(const id of ['clean','garden','repair']){
  const spec=Island.jobs.find(j=>j.id===id);
  walkRoute([[spec.x,14],[spec.x,spec.y]]);
  assert(activities.start(id,mauz));
  assert.equal(activities.start('taxi',mauz),null,'Only one contract at a time');
  for(const p of spec.points){
    walkRoute(id==='clean'?[[0,mauz.y],[0,p.y],[p.x,p.y]]:[[mauz.x,14],[p.x,14],[p.x,p.y]]);
    if(spec.kind==='collect')activities.interact(mauz,false);
    else{
      activities.tick(.5,mauz,false,true);
      activities.tick(.1,mauz,false,false);assert.equal(activities.progress,0,'Releasing E resets work');
      activities.tick(spec.seconds+.1,mauz,true,true);assert.equal(activities.progress,0,'Cannot work from a car');
      assert(activities.tick(spec.seconds+.1,mauz,false,true));if(spec.timing)finishTiming();
    }
  }
  const before=job.coins;
  assert.equal(activities.done.size,spec.points.length);
  assert.equal(activities.interact({x:0,y:0},false),null,'No remote payment');
  walkRoute(id==='clean'?[[0,mauz.y],[0,spec.y],[spec.x,spec.y]]:[[mauz.x,14],[spec.x,14],[spec.x,spec.y]]);
  assert.equal(activities.interact(mauz,false).reward,spec.reward);
  assert.equal(job.coins,before+spec.reward);
  assert.equal(activities.interact(mauz,false),null,'No duplicate payment');
  walkRoute([[spec.x,14],[0,14]]);
}
const taxi=Island.jobs.find(j=>j.id==='taxi');
walkRoute([[8,14],[8,8]]);assert(activities.start('taxi',mauz));
assert(activities.interact(taxi.points[0],false).message);assert(!activities.passenger);
assert(activities.interact(taxi.points[0],true,5).message);assert(!activities.passenger,'Passenger requires a stopped car');
assert(activities.interact(taxi.points[0],true,0));assert(activities.passenger);
const beforeTaxi=job.coins;
assert.equal(activities.interact(taxi.points[1],true,0).reward,260);
assert.equal(job.coins,beforeTaxi+260);assert(!activities.active);
assert.equal(sandbox.createDeliveryJob(storage,Island).coins,660,'All five job earnings share a saved wallet');

// Every model can be called at every booth without materialising inside obstacles.
for(const booth of Island.booths)for(const id of ['compact','roadster','pickup']){
  mauz.x=booth.x;mauz.y=booth.y+2;
  assert(vehicles.spawn(id,booth,mauz),`${id} cannot spawn at ${booth.name}`);
  assert(vehicles.clearAt(vehicles.car.x,vehicles.car.y,vehicles.car.heading,vehicles.car.model));
}
assert(!vehicles.spawn('compact',Island.booths[0],{x:200,y:200}),'Cannot spawn remotely');
const booth=Island.booths[0];mauz.x=booth.x;mauz.y=booth.y+2;
assert(vehicles.spawn('compact',booth,mauz));mauz.x=vehicles.car.x;mauz.y=vehicles.car.y+3;
assert(vehicles.toggle(mauz));
vehicles.car.x=0;vehicles.car.y=14;vehicles.car.heading=-Math.PI/2;
for(let i=0;i<360;i++)vehicles.step(1/60,1,0,false,mauz);
assert(mauz.y<-100,'Car must cover the main road faster than walking');
assert(!vehicles.toggle(mauz),'Cannot exit while moving');
for(let i=0;i<60;i++)vehicles.step(1/60,0,0,true,mauz);
assert(Math.abs(vehicles.car.speed)<.6);
vehicles.car.x=18;vehicles.car.y=-5;vehicles.car.heading=-Math.PI/2;
for(let i=0;i<180;i++)vehicles.step(1/60,1,0,false,mauz);
assert(vehicles.car.y>-18,'Car body must stop before a building');
assert.equal(vehicles.car.speed,0);
assert(vehicles.toggle(mauz));assert(!vehicles.driving);
console.log('PASS: four jobs, hold/release work, taxi restrictions, saved wallet, all model/booth spawns, driving, braking, exits and body collisions');

// Reach and finish the four newest jobs using movement, not teleporting to objectives.
mauz.x=0;mauz.y=14;
for(const id of ['fishing','orchard','electric','trail']){
  const spec=Island.jobs.find(j=>j.id===id);
  if(id==='fishing')walkRoute([[-85,14],[-85,40],[-86,40]]);
  if(id==='orchard')walkRoute([[-85,40],[-85,14],[-350,14],[-350,8]]);
  if(id==='electric')walkRoute([[-350,14],[300,14],[300,100],[300,108]]);
  if(id==='trail')walkRoute([[300,100],[300,14],[124,14],[124,-40],[130,-40]]);
  assert(activities.start(id,mauz),`Cannot start ${id}`);
  for(const p of spec.points){
    if(id==='orchard')walkRoute([[mauz.x,-4],[p.x,-4],[p.x,p.y]]);
    else if(id==='electric')walkRoute([[mauz.x,100],[p.x,100],[p.x,p.y]]);
    else walkRoute([[p.x,p.y]]);
    if(spec.kind==='hold'){assert(activities.tick(spec.seconds+.1,mauz,false,true));if(spec.timing)finishTiming();}
    else assert(activities.interact(mauz,false));
  }
  assert.equal(activities.done.size,spec.points.length);
  if(id==='orchard')walkRoute([[mauz.x,-4],[-350,-4],[-350,8]]);
  else if(id==='electric')walkRoute([[mauz.x,100],[300,100],[300,108]]);
  else walkRoute([[spec.x,spec.y]]);
  const balance=job.coins;
  assert.equal(activities.interact(mauz,false).reward,spec.reward);assert.equal(job.coins,balance+spec.reward);
}
assert.equal(job.coins,1390);
const empty=sandbox.createDeliveryJob({getItem:()=>null,setItem(){}},Island);
assert(!empty.purchaseHome('village').ok);assert.equal(empty.coins,0);assert.equal(empty.ownedHomes.length,0);
assert(!job.purchaseHome('unknown').ok);
const beforePurchase=job.coins;
assert(job.purchaseHome('village').ok);assert.equal(job.coins,beforePurchase-180);
assert(!job.purchaseHome('village').ok);assert.equal(job.coins,beforePurchase-180,'No double charge');
assert(job.purchaseHome('east').ok);assert(job.setHome('east'));assert(!job.setHome('south'));
const homeowner=sandbox.createDeliveryJob(storage,Island);
assert.equal(homeowner.homeId,'east');assert.equal(homeowner.ownedHomes.length,2);assert.equal(homeowner.coins,860);
homeowner.addReward(10);assert.equal(sandbox.createDeliveryJob(storage,Island).ownedHomes.length,2,'Later wages preserve home ownership');
const failing=sandbox.createDeliveryJob({getItem:()=>JSON.stringify({coins:1000,completed:2}),setItem(){throw Error('Disk full');}},Island);
assert(!failing.purchaseHome('village').ok);assert.equal(failing.coins,1000);assert.equal(failing.ownedHomes.length,0,'Failed storage must not charge money');
for(const house of Island.homes)assert(walkable(house.x,house.y),`Door blocked: ${house.name}`);
console.log('PASS: 5.4x world area, four new job routes/rewards, affordable purchase, insufficient funds, duplicate rejection, atomic persistence, saved home selection and reachable doors');

// Enter through the actual house interaction and walk through all four doorways.
for(const id of ['village','east']){
  const h=Island.homes.find(h=>h.id===id);
  Object.assign(mauz,{x:h.x,y:h.y});setMode('playing');interact();
  assert(enterHome(),'Owned house entry');assert.equal(roomName(),'Flur');
  const balance=job.coins;
  assert(!indoorWalkable(-12,0),'Outer wall collision');
  assert(!indoorWalkable(-2,0),'Partition collision');
  assert(!indoorWalkable(-9,8),'Sofa collision');
  assert(leaveHome(),'Exit works at entrance');
  interact();assert(enterHome());
  walkRoute([[0,6.5],[-4,6.5]]);assert.equal(roomName(),'Wohnzimmer');draw();
  assert(!leaveHome(),'Cannot leave remotely');
  walkRoute([[0,6.5],[4,6.5]]);assert.equal(roomName(),'Küche');draw();
  walkRoute([[0,6.5],[0,-6.5],[4,-6.5]]);assert.equal(roomName(),'Badezimmer');draw();
  walkRoute([[0,-6.5],[-4,-6.5]]);assert.equal(roomName(),'Schlafzimmer');draw();
  walkRoute([[0,-6.5],[0,10]]);assert(leaveHome());
  assert.equal(mauz.x,h.x);assert.equal(mauz.y,h.y);assert.equal(job.coins,balance);
}
const locked=Island.homes.find(h=>h.id==='villa');Object.assign(mauz,{x:locked.x,y:locked.y});interact();assert(!enterHome(),'Unowned house cannot be entered');
console.log('PASS interiors: owned entry, locked entry, all four room routes, furniture/wall collisions, exit and unchanged wallet');

assert(indoorCameraLimit(0,0,0)<1.8,'Camera stops before partition');
assert(indoorCameraLimit(0,0,Math.PI/2)>4,'Clear hallway retains follow distance');
assert(indoorCameraLimit(0,11, -Math.PI/2)<1,'Camera stays inside outer wall');

assert.equal(segmentBox({x:0,y:0,z:2},{x:10,y:0,z:2},{x:5,y:0,w:2,d:2,h:4}),.4);
assert.equal(segmentBox({x:0,y:0,z:5},{x:10,y:0,z:5},{x:5,y:0,w:2,d:2,h:4}),null);
assert(outdoorCameraLimit(-18,-18,Math.PI/2,7,3)<2,'Outdoor camera stops before house wall');
assert(outdoorCameraLimit(-18,-18,Math.PI/2,11,4)<2,'Vehicle camera stops before house wall');
assert(outdoorHit({x:-18,y:-35,z:3},{x:-18,y:-18,z:2.6})<1,'House hides marker behind it');
assert.equal(outdoorHit({x:0,y:0,z:100},{x:0,y:10,z:100}),1,'Unobstructed ray stays visible');
console.log('PASS outdoor camera collision and opaque obstacle sightlines');

assert(Math.hypot(taxi.points[1].x-taxi.points[0].x,taxi.points[1].y-taxi.points[0].y)>750,'Long cross-island taxi journey');
const staticVehicles=sandbox.createVehicles(Island,walkable);
for(let y=-307;y<=460;y+=2)assert(staticVehicles.clearAt(0,y,Math.PI/2,vehicles.car.model),'Taxi main road blocked at '+y);

// Every public building has an accessible door, counter and exit without buying a home.
for(const venue of Island.venues){
  assert(walkable(venue.x,venue.y),'Public entrance blocked: '+venue.name);
  setMode('playing');Object.assign(mauz,{x:venue.x,y:venue.y});assert(enterVenue(venue));
  assert.equal(roomName(),venue.name);assert(!nearBed(),'Public furniture is not a private sleeping bed');
  walkRoute([[0,-3]]);draw();walkRoute([[0,10]]);assert(leaveHome());
  assert.equal(mauz.x,venue.x);assert.equal(mauz.y,venue.y);
}
const clothingBalance=job.coins;assert(job.purchaseOutfit('street').ok);assert.equal(job.coins,clothingBalance-70);assert.equal(job.outfitId,'street');
assert(!job.purchaseOutfit('street').ok);assert.equal(job.coins,clothingBalance-70);assert(!job.equipOutfit('fire'));
assert(job.equipOutfit(null));assert.equal(job.outfitId,null);assert(job.equipOutfit('street'));
const dressed=sandbox.createDeliveryJob(storage,Island);assert.equal(dressed.outfitId,'street');assert(dressed.ownedOutfits.includes('street'));assert.equal(dressed.ownedHomes.length,2);
dressed.addReward(10);assert.equal(sandbox.createDeliveryJob(storage,Island).outfitId,'street');
assert(!empty.purchaseOutfit('street').ok);assert(!failing.purchaseOutfit('street').ok);assert.equal(failing.coins,1000);assert.equal(failing.ownedOutfits.length,0);
assert.equal(job.purchaseOutfit('invalid').ok,false);
console.log('PASS public building routes, clothing purchase/equip, insufficient funds, duplicate protection, persistence and atomic failure');
