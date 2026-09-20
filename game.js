(() => {
  'use strict';
  const canvas = document.querySelector('#world'), ctx = canvas.getContext('2d');
  const keys = new Set();
  const stick={x:0,y:0,id:null};
  let touchDevice=!!window.matchMedia?.('(any-pointer: coarse)').matches||(typeof navigator!=='undefined'&&navigator.maxTouchPoints>0);
  let renderDirty=true;
  let celebration=0,viewFront=false,renderedFrames=0;
  const motes=[];
  function resetStick(){stick.x=stick.y=0;stick.id=null;const knob=document.querySelector('#joystick-knob');if(knob.style)knob.style.transform='translate(0px,0px)';}

  const mauz = { x: 0, y: 0, jump: 0, vz: 0, face: 1, heading: -Math.PI / 2, moving: false };
  const camera = { x: 0, y: 0, z:0, heading: mauz.heading };
  let width, height, scale, cx, cy, time = 0, last = 0, destination = null;
  let mode = 'start';
  let storage;
  try { storage=window.localStorage; } catch { storage={getItem(){throw Error('Storage unavailable');},setItem(){throw Error('Storage unavailable');}}; }
  const graphicsStorage=storage;
  const graphicsDefaults={quality:touchDevice?'low':'high',distance:touchDevice?150:260,fps:60,realism:'normal',showFps:false,shadows:true,water:true,particles:true,vegetation:true,glow:true,brightness:100,zoom:100,clouds:1,wind:1,steering:1,labels:true,minimap:true,chatSound:true};
  const graphics={...graphicsDefaults};
  try{const saved=JSON.parse(graphicsStorage.getItem('animal-world-graphics-v1')||'null');if(saved){
    if(['low','medium','high'].includes(saved.quality))graphics.quality=saved.quality;
    if([100,150,260,350].includes(saved.distance))graphics.distance=saved.distance;
    if([30,60,120,0].includes(saved.fps))graphics.fps=saved.fps;
    if(['simple','normal','detailed','ultra'].includes(saved.realism))graphics.realism=saved.realism;
    graphics.showFps=saved.showFps===true;
    for(const key of ['clouds','wind'])if([0,1,2].includes(saved[key]))graphics[key]=saved[key];
    if([.7,1,1.4].includes(saved.steering))graphics.steering=saved.steering;
    for(const key of ['shadows','water','particles','vegetation','glow','labels','minimap','chatSound'])if(typeof saved[key]==='boolean')graphics[key]=saved[key];
    for(const key of ['brightness','zoom'])if([80,100,120].includes(saved[key]))graphics[key]=saved[key];
  }}catch{}
  const graphicsProfile=()=>({low:{pixels:589824,dpr:.85},medium:{pixels:1048576,dpr:1.25},high:{pixels:2073600,dpr:2}}[graphics.quality]);
  const saveWorlds=typeof createSaveWorlds==='function'?createSaveWorlds(storage):null;
  if(saveWorlds)storage=saveWorlds.storage;
  const adventure=createAdventure(storage);
  Object.assign(mauz,adventure.profile);
  const nameInput=document.querySelector('#character-name'),speciesInput=document.querySelector('#character-species');
  nameInput.value=mauz.name;speciesInput.value=mauz.species;
  function chooseCharacter(){Object.assign(mauz,adventure.select(nameInput.value,speciesInput.value));}
  speciesInput.addEventListener('change',()=>{mauz.species=speciesInput.value;});
  const dayCycle=createDayCycle(storage);
  let sleeping=null;
  const job=createDeliveryJob(storage,Island);
  const activities=createActivities(Island,job,storage);
  const city=createCityServices(Island,job,activities);
  let onlineMode=false,propertiesReady=false,onlineHomeId=null,sentPropertyRequest=null;
  try{onlineHomeId=storage.getItem('animal-world-online-home');}catch{}
  function ownedHomes(){return job.ownedHomes;}
  function ownsHome(id){return ownedHomes().includes(id)&&(!onlineMode||propertiesReady&&network.mine.includes(id));}
  function onlineIdentity(){try{let token=storage.getItem('animal-world-owner-key');if(!token||!/^[a-zA-Z0-9-]{32,80}$/.test(token)){token=crypto.randomUUID();storage.setItem('animal-world-owner-key',token);}return token;}catch{return null;}}

  const onlinePanel=typeof createOnlinePanel==='function'?createOnlinePanel(text=>network.chat(text),()=>{keys.clear();resetStick();},()=>{if(graphics.chatSound)sound.effect('chat');}):null;
  const network=createMultiplayer((status,count)=>{
    onlinePanel?.status(status,network.id);onlinePanel?.show(onlineMode&&mode==='playing');
    const badge=document.querySelector('#online-status');badge.hidden=!onlineMode;
    badge.textContent=status==='online'?'Online · '+count+' Spieler':status==='connecting'?'Verbinde ...':'Verbindung verloren – im Menü erneut verbinden';
    document.querySelector('#wave').hidden=!onlineMode||status!=='online';
    if(onlineMode&&status==='disconnected'){sleeping=null;document.querySelector('#sleep-screen').hidden=true;setMode('pause');notify('Verbindung verloren. Zurueck ins Hauptmenue und erneut Online spielen.');}
  },minutes=>{if(onlineMode)dayCycle.set(minutes);},state=>life.accept(state),impact=>{const model=VehicleModels.find(m=>m.id===impact.model);if(model){damage.hit({...impact,model},impact.age||0);if(!impact.scenery&&!interior&&Math.hypot(mauz.x-impact.x,mauz.y-impact.y)<100)crashParticles(impact.x,impact.y,impact.z||0);}},handleSession);
  const vehicles=createVehicles(Island,vehicleWalkable,vehicleImpact,aerialBlocked,busVehicleCollision);
  let currentBooth=null,currentHome=null,plannedRoute=null;
  let interior=null;
  const insideWalls=[
    {x:-12,y:0,w:.3,d:24},{x:12,y:0,w:.3,d:24},{x:0,y:-12,w:24,d:.3},
    {x:-6.7,y:12,w:10.6,d:.3},{x:6.7,y:12,w:10.6,d:.3},
    ...[-2,2].flatMap(x=>[-10,0,10].map((y,i)=>({x,y,w:.22,d:i===1?10:4}))),
    {x:-7,y:0,w:10,d:.22},{x:7,y:0,w:10,d:.22}
  ];
  const furnishings=[
    {x:-9,y:8,w:4,d:1.7,h:.8,color:'#8daea0'}, // sofa
    {x:-9,y:8.65,w:4,d:.35,h:1.5,color:'#648c7b'},
    {x:-8,y:4.7,w:2.4,d:1.4,h:.65,color:'#b78959'},
    {x:-11,y:3,w:.7,d:2.7,h:.8,color:'#c3a077'},
    {x:-11,y:3,w:.25,d:2.3,h:2,color:'#344c50'}, // television
    {x:9,y:10.8,w:5,d:1.4,h:1.2,color:'#d2b88b'}, // kitchen
    {x:10.8,y:8,w:1.4,d:4,h:1.2,color:'#d2b88b'},
    {x:4.3,y:10.6,w:1.7,d:1.9,h:2.7,color:'#dce8e4'}, // fridge
    {x:7,y:5,w:2.6,d:2,h:1,color:'#c0986e'},
    {x:5,y:5,w:.8,d:.8,h:.65,color:'#9b795a'},
    {x:9,y:5,w:.8,d:.8,h:.65,color:'#9b795a'},
    {x:-8,y:-8,w:3.7,d:5,h:.65,color:'#bc946c'}, // bed
    {x:-8,y:-8,w:3.5,d:4.8,h:.85,color:'#e4d5c4'},
    {x:-8,y:-7,w:3.5,d:2.7,h:.9,color:'#8ca4bd'},
    {x:-8.9,y:-9.7,w:1.3,d:1,h:1,color:'#f2eedc'},
    {x:-7.1,y:-9.7,w:1.3,d:1,h:1,color:'#f2eedc'},
    {x:-8,y:-10.4,w:3.8,d:.3,h:1.5,color:'#ad855e'},
    {x:-4,y:-10.5,w:1.8,d:2,h:2.8,color:'#bda27e'}, // wardrobe
    {x:9.5,y:-9,w:2.6,d:4.5,h:.9,color:'#e6eeea'}, // bath
    {x:9.5,y:-9,w:1.9,d:3.8,h:.92,color:'#9acbd3'},
    {x:4.5,y:-10,w:1.5,d:1.7,h:.65,color:'#edf2eb'}, // toilet
    {x:4.5,y:-10.7,w:1.5,d:.45,h:1.5,color:'#edf2eb'},
    {x:5,y:-3,w:2.4,d:1.1,h:1.2,color:'#a7bdb4'}, // basin
    {x:5,y:-3,w:1.7,d:.8,h:1.25,color:'#edf4ec'}
  ];
  const venueLayouts=new Map(),homeLayouts=new Map(),stairMeshes=new Map();
  function homePlan(home=interior){if(!home||home.public)return null;if(!homeLayouts.has(home.id))homeLayouts.set(home.id,housingLayout(home));return homeLayouts.get(home.id);}
  function exitPoint(){return homePlan()?.exit||{x:0,y:10};}
  function atHomeEntrance(home){return interior?.lobby?interior.building.homeId===home.buildingId&&interior.floor===home.floor&&Math.abs((mauz.elevation||0)-home.floor*4)<.05:!interior&&Math.hypot(mauz.x-home.x,mauz.y-home.y)<=2.6;}
  function openLobby(home,floor=0){
    interior={id:'lobby:'+home.buildingId,public:true,lobby:true,floor,floors:home.floors,building:home.building,x:home.x,y:home.y,name:'Treppenhaus - '+(floor?floor+'. Etage':'Erdgeschoss'),color:'#c5b69f',floorColor:'#c8b798'};
    moveToDoor(0,8.5,-Math.PI/2);mauz.elevation=floor*4;setMode('playing');return true;
  }
  function lobbyAction(){
    const floor=interior.floor,base=Island.homes.find(h=>h.buildingId===interior.building.homeId);
    if(Math.abs((mauz.elevation||0)-floor*4)>.05)return null;
    for(const unit of [0,1])if(Math.hypot(mauz.x-(unit?8:-8),mauz.y-4)<2.3){const home=Island.homes.find(h=>h.buildingId===base.buildingId&&h.floor===floor&&h.unit===unit);return {type:'unit',target:home,label:'E - Wohnung '+(unit?'B':'A')+(ownsHome(home.id)?' (deine)':'')};}
    return floor===0&&Math.hypot(mauz.x,mauz.y-10)<2?{type:'exit',label:'E - Nach draussen'}:null;
  }

  function indoorWalls(){if(interior?.public)return insideWalls.slice(0,5);const l=homePlan();return insideWalls.filter((b,i)=>!l.open||i<5||b.y<0||b.w>b.d).map(l.transform);}
  function indoorFurniture(){
    if(!interior?.public){const l=homePlan(),fx=Math.min(1,l.sx),fy=Math.min(1,l.sy);return furnishings.map((b,i)=>{
      const anchor=i<2?furnishings[0]:i>=8&&i<=10?furnishings[8]:i>=11&&i<=16?furnishings[11]:i===19?furnishings[18]:i===21?furnishings[20]:i===23?furnishings[22]:b;
      return {...b,x:(anchor.x*l.sx+(b.x-anchor.x)*fx)*l.mirror,y:anchor.y*l.sy+(b.y-anchor.y)*fy,w:b.w*fx,d:b.d*fy,color:[0,1,13].includes(i)?l.colors[2]:b.color};
    });}
    if(interior.lobby)return [];
    if(venueLayouts.has(interior.id))return venueLayouts.get(interior.id);
    const items=[],add=(x,y,w,d,h,color)=>items.push({x,y,w,d,h,color});
    add(0,-5,6,1.2,1.2,interior.color); // reception / checkout

    if(interior.jobId){
      const kind=interior.jobId;
      for(const x of [-7,7]){add(x,-8,5,1.4,1.1,'#ac8a61');for(const dx of [-1.6,0,1.6])add(x+dx,-8,.6,.7,1.4,['garden','orchard'].includes(kind)?'#7caa67':'#849faa');}
      if(kind==='repair'||kind==='taxi'){add(-6,3,3.5,6,1,'#b8cacc');add(-6,2,3,2.5,1.8,'#6b98ac');for(const x of [-8,-4])for(const y of [1,5])add(x,y,.5,1,.65,'#42515b');add(7,4,3,1.5,1.1,'#a28b6b');}
      else if(kind==='clean'){for(const [i,c] of ['#7197b7','#80a57b','#baa46f'].entries()){const x=i===2?7:-7,y=i===0?1:i===1?6:4;add(x,y,3,3,1.8,c);add(x,y,3.2,3.2,2,'#50676a');}}
      else if(kind==='electric'){for(const x of [-7,7]){add(x,3,3,1,2.5,'#647d8b');for(const y of [2.5,3,3.5])add(x,y,.5,.2,2.6,'#e6c269');}}
      else{for(const x of [-7,7])for(const y of [1,6]){add(x,y,3,2,.9,'#a08258');add(x,y,2.7,1.7,1.05,'#809a65');for(const dx of [-.8,0,.8])add(x+dx,y,.4,.4,1.5,kind==='fishing'?'#8baeb4':'#a8ba74');}}
    }else if(interior.id==='clothes'){
      for(const [i,o] of Island.outfits.entries()){const x=i%2===0?-7:7,y=5-Math.floor(i/2)*4;add(x,y,2.8,.8,.35,'#a9aaa0');add(x,y,1.6,.5,2,o.color);add(x,y,.5,.5,2.5,'#dab694');add(x-.2,y,.12,.2,2.68,'#dab694');add(x+.2,y,.12,.2,2.68,'#dab694');}
    }else if(interior.id==='restaurant'){
      for(const x of [-7,7])for(const y of [-1,6]){add(x,y,2.8,2.2,1,'#b98e67');for(const dx of [-2,2])add(x+dx,y,.8,.8,.65,'#879b72');add(x,y,.5,.5,1.15,'#f1e4b7');}
      add(-7,-10,7,1.3,1.3,'#d4d5c3');add(8,-10,2,2,2.8,'#d8e1d8');
    }else if(interior.id==='hospital'){
      for(const x of [-7,7])for(const y of [-7,3]){add(x,y,3,4,.7,'#e5eee6');add(x,y+.8,2.8,2.2,.85,'#88b9c0');add(x,y-1.2,2.2,.8,.9,'#fff1da');add(x+2.6,y,.8,.8,1.3,'#9cb0a5');}
    }else if(interior.id==='fire'){
      add(-7,0,3.4,7,1.4,'#c45d4c');add(-7,-2,3.2,2,2.6,'#c45d4c');add(-7,-2,2.9,2.1,2.3,'#a6c9c8');
      for(const x of [-9,-5])for(const y of [-2,2])add(x,y,.5,1.2,.9,'#465451');
      for(const y of [-8,-4,0,4,8])add(9,y,1.4,1.4,2,'#d3b559');
    }else if(interior.id==='bank'){
      add(-8,-8,5,1,3,'#7d9694');add(-8,-8,3,.9,2.6,'#afbeb2');
      for(const y of [2,6]){add(8,y,1.3,1.3,2,'#738e88');add(8,y-.1,1,.9,2.1,'#9bc4bc');}
      add(-7,5,4,1.5,.7,'#8f9679');
    }else if(interior.id==='police'){
      for(const x of [-7,7]){add(x,2,3,2,1,'#a4aeac');add(x,1.5,1,.4,1.7,'#527887');add(x,4,1,1,.7,'#627589');}
      for(const x of [-8,-5,5,8])add(x,-10,1.5,1,2.8,'#778c9f');
    }else{
      for(const x of [-8,-4,4,8])for(const y of [2,7]){add(x,y,2,2,.7,'#b79768');add(x,y,1.7,1.7,.95,x<0?'#9fb864':'#d6a35e');}
    }
    venueLayouts.set(interior.id,items);return items;
  }
  function enterVenue(venue){
    if(mode!=='playing'||interior||vehicles.driving||!Island.venues.includes(venue)||Math.hypot(mauz.x-venue.x,mauz.y-venue.y)>2.6)return false;
    interior=venue;moveToDoor(0,8.5,-Math.PI/2);setMode('playing');return true;
  }
  function indoorWalkable(x,y){
    if(interior?.lobby)return stairSurface(x,y,mauz.elevation||0,interior.floors)!==null;
    const l=homePlan();return Math.abs(x)<(l?l.w/2:12)-.5&&Math.abs(y)<(l?l.d/2:12)-.5&&![...indoorWalls(),...indoorFurniture().filter(b=>b.h>(mauz.jump||0)+.04)].some(b=>Math.abs(x-b.x)<b.w/2+.35&&Math.abs(y-b.y)<b.d/2+.35);
  }
  function roomName(){if(interior?.public)return interior.name;const l=homePlan(),x=mauz.x/(l.sx*l.mirror),y=mauz.y/l.sy;return Math.abs(x)<2?'Flur':x<0?(y>0?'Wohnzimmer':'Schlafzimmer'):(y>0?'Küche':'Badezimmer');}
  function enterHome(){
    if(mode!=='home'||!currentHome||!ownsHome(currentHome.id)||vehicles.driving||!atHomeEntrance(currentHome))return false;
    if(currentHome.type==='apartment'&&!interior?.lobby)return openLobby(currentHome);
    interior=currentHome;
    const spawn=homePlan().spawn;moveToDoor(spawn.x,spawn.y,-Math.PI/2);
    setMode('playing');return true;
  }
  function moveToDoor(x,y,heading){
    busRide=null;mauz.busId=null;
    Object.assign(mauz,{x,y,heading,elevation:0,jump:0,vz:0,moving:false});
    Object.assign(camera,{x,y,z:0,heading});keys.clear();destination=null;
  }
  function leaveHome(){
    if(!interior||Math.hypot(mauz.x-exitPoint().x,mauz.y-exitPoint().y)>2)return false;
    if(!interior.public&&interior.type==='apartment'){const home=interior;openLobby(home,home.floor);moveToDoor(home.unit?8:-8,4,0);mauz.elevation=home.floor*4;return true;}
    if(interior.lobby&&(mauz.elevation||0)>.05)return false;
    const home=interior;interior=null;indoorRenderer?.dispose?.();indoorRenderer=null;moveToDoor(home.x,home.y,Math.PI/2);updateJobUI();return true;
  }
  const mapView={x:0,y:0,zoom:1};
  let busMapStop=null,busMapLine='all',busMapUpdated=-Infinity;
  const savedHome=Island.homes.find(h=>h.id===job.homeId);
  if(savedHome){mauz.x=savedHome.x;mauz.y=savedHome.y;mauz.heading=0;camera.x=mauz.x;camera.y=mauz.y;camera.heading=0;}
  const sound=createSound(storage);
  const vehicleButton=document.querySelector('#vehicle-action');
  let toastTime=0;
  const jobTitle=document.querySelector('#job-title'),jobDetail=document.querySelector('#job-detail');
  const interactButton=document.querySelector('#interact'),toast=document.querySelector('#toast');

  let seed = 41;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const grass = Array.from({length:19000},()=>({x:random()*472-236,y:random()*472-236,size:random()*3+2,color:random()})).filter(g=>Math.hypot(g.x,g.y)<235&&!Island.onRoad(g.x,g.y)&&!Island.inPond(g.x,g.y,1)&&Island.heightAt(g.x,g.y)===0);
  const trees = [];
  for(let i=0;i<2500;i++){
    const x=random()*464-232,y=random()*464-232;
    if(Math.hypot(x,y)<233&&!Island.blocked(x,y)&&!Island.reserved(x,y))
      trees.push({x,y,size:1.4+random()*.8});
  }
  for(let i=0;i<7000;i++){
    const x=random()*(Island.radius*2-12)-Island.radius+6,y=random()*(Island.radius*2-12)-Island.radius+6;
    if(Math.hypot(x,y)>235&&Math.hypot(x,y)<Island.radius-8&&!Island.blocked(x,y)&&!Island.reserved(x,y))trees.push({x,y,size:1.4+random()*.8});
  }
  for(let i=0;i<17000;i++){
    const x=random()*(Island.radius*2-12)-Island.radius+6,y=random()*(Island.radius*2-12)-Island.radius+6;
    if(Math.hypot(x,y)>235&&Math.hypot(x,y)<Island.radius-5&&!Island.onRoad(x,y))grass.push({x,y,size:2+random()*3,color:random()});
  }
  // Query nearby scenery instead of scanning the expanded island each frame.
  function spatialIndex(items){
    const cells=new Map(),size=32;
    for(const item of items){const key=Math.floor(item.x/size)+','+Math.floor(item.y/size);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(item);}
    return {near(x,y,r){const result=[];for(let ix=Math.floor((x-r)/size);ix<=Math.floor((x+r)/size);ix++)for(let iy=Math.floor((y-r)/size);iy<=Math.floor((y+r)/size);iy++){const cell=cells.get(ix+','+iy);if(cell)result.push(...cell);}return result;}};
  }
  for(let i=0;i<220;i++){const x=Island.luxury.x+(random()-.5)*480,y=(random()-.5)*480;if(!Island.blocked(x,y)&&!Island.reserved(x,y))trees.push({x,y,size:1.4+random()*.8});}
  for(let i=0;i<22000;i++){const x=Island.continent.x+(random()-.5)*5700,y=(random()-.5)*5700;if(!Island.inSea(x,y)&&!Island.blocked(x,y)&&!Island.reserved(x,y)){trees.push({x,y,size:1.3+random()*1.1});grass.push({x:x+2,y:y+2,size:2,color:random()});}}
  const treeIndex=spatialIndex(trees),grassIndex=spatialIndex(grass),lampIndex=spatialIndex(Island.lamps);
  trees.forEach((t,i)=>t.damageId=i);Island.lamps.forEach((l,i)=>l.damageId=i);
  const damage=createSceneryDamage(trees,Island.lamps);
  const life=createCityLife(Island,VehicleModels.filter(m=>!m.kind));
  let busRide=null;
  const transit=()=>[...life.buses,...life.trains];
  function busVehicleCollision(x,y,heading,model){
    if(life.crossingBlocked(x,y,Math.max(model.length,model.width)/2))return true;
    if(model.kind)return false;
    return transit().some(b=>{
      // Separating-axis test for two oriented rectangles, including bumpers.
      const axes=[heading,heading+Math.PI/2,b.heading,b.heading+Math.PI/2];
      return axes.every(a=>{const project=(h,l,w)=>Math.abs(Math.cos(h-a))*l/2+Math.abs(Math.sin(h-a))*w/2;return Math.abs((x-b.x)*Math.cos(a)+(y-b.y)*Math.sin(a))<project(heading,model.length,model.width)+project(b.heading,9.2*(b.scaleF||1),3.4*(b.scaleS||1))+.12;});
    });
  }
  let busAnnouncement='';
  function announceBus(){const b=busRide&&transit().find(b=>b.id===busRide.id);if(!b){if(busAnnouncement)sound.cancelAnnouncement();busAnnouncement='';return;}const stopped=b.wait>0,key=b.id+':'+b.departure+':'+stopped;if(key!==busAnnouncement){busAnnouncement=key;sound.announce({line:b.line,stop:stopped?b.stop:b.nextStop,next:!stopped,terminal:stopped?b.terminal:b.nextTerminal});}}
  function busLocal(b,x,y){const dx=x-b.x,dy=y-b.y;return {f:(dx*Math.cos(b.heading)+dy*Math.sin(b.heading))/(b.scaleF||1),s:(-dx*Math.sin(b.heading)+dy*Math.cos(b.heading))/(b.scaleS||1)};}
  function busPoint(b,p){p={f:p.f*(b.scaleF||1),s:p.s*(b.scaleS||1)};return {x:b.x+Math.cos(b.heading)*p.f-Math.sin(b.heading)*p.s,y:b.y+Math.sin(b.heading)*p.f+Math.cos(b.heading)*p.s};}
  const busSeatPoint=seat=>({f:-1-Math.floor(seat/2)*2+(seat>=4?6:0),s:seat%2?.95:-.95});
  function busSeatAction(){
    if(!busRide)return null;
    if(Number.isInteger(busRide.seat))return {type:'bus-seat',seat:null,label:'E - Aufstehen'};
    const occupied=[...life.commuters.filter(p=>p.busId===busRide.id).map(p=>p.seat),...network.players.filter(p=>p.busId===busRide.id).map(p=>p.busSeat)];
    const seat=[0,1,2,3,4,5].filter(i=>!occupied.includes(i)).map(i=>({i,p:busSeatPoint(i)})).sort((a,b)=>Math.hypot(a.p.f-busRide.f,a.p.s-busRide.s)-Math.hypot(b.p.f-busRide.f,b.p.s-busRide.s))[0];
    return seat&&Math.hypot(seat.p.f-busRide.f,seat.p.s-busRide.s)<1.8?{type:'bus-seat',seat:seat.i,label:'E - Hinsetzen'}:null;
  }
  function setBusSeat(seat){
    if(!busRide)return;
    busRide.seat=seat;mauz.busSeat=seat;mauz.seated=Number.isInteger(seat);
    if(mauz.seated){Object.assign(busRide,busSeatPoint(seat));mauz.heading=transit().find(b=>b.id===busRide.id).heading;}else busRide.s=0;
    destination=null;mauz.moving=false;mauz.jump=.45*(transit().find(b=>b.id===busRide.id)?.scaleZ||1);mauz.vz=0;carryBus();
  }
  function carryBus(){if(!busRide){mauz.seated=false;mauz.busSeat=null;return;}const b=transit().find(b=>b.id===busRide.id);if(!b){busRide=null;mauz.busId=null;return;}mauz.heading+=Math.atan2(Math.sin(b.heading-busRide.heading),Math.cos(b.heading-busRide.heading));busRide.heading=b.heading;Object.assign(mauz,busPoint(b,busRide));}
  function busWalkable(x,y){
    for(const b of transit()){const p=busLocal(b,x,y),old=busLocal(b,mauz.x,mauz.y),inside=Math.abs(p.f)<4.7&&Math.abs(p.s)<1.85;
      if(busRide?.id===b.id){
        if(p.f>(b.kind==='train'?3.15:4.15)||p.f< -4.15)return false;
        if(Math.abs(p.s)>.5&&[-3,-1,1].some(f=>Math.abs(p.f-f)<.6))return false;
        if(Math.abs(p.s)>1.3&&!(b.doors>.9&&p.s>0&&p.f>1.7&&p.f<3.6))return false;
      }else if(inside&&!(b.doors>.9&&p.s>0&&p.f>1.7&&p.f<3.6&&old.s>0))return false;
    }return true;
  }
  function railPlatformHeight(x,y){return Island.railStations.some(s=>{const p=busLocal(s,x,y);return Math.abs(p.f)<40&&Math.abs(p.s)<4.5;})?.3:0;}
  function busRamp(x,y){for(const b of transit()){const p=busLocal(b,x,y);if(busRide?.id===b.id&&Math.abs(p.s)<1.4)return .45*(b.scaleZ||1);if(b.doors>.9&&p.f>1.7&&p.f<3.6&&p.s>0&&p.s<2.6)return Math.max(railPlatformHeight(x,y),.45*(b.scaleZ||1)*Math.max(0,Math.min(1,(2.6-p.s)/1.2)));}return railPlatformHeight(x,y);}
  function updateBusRide(){
    if(interior||vehicles.driving||network.rideOwner){busRide=null;mauz.busId=null;return;}
    for(const b of transit()){const p=busLocal(b,mauz.x,mauz.y);
      if(busRide?.id===b.id){if(b.doors>.9&&p.s>2){busRide=null;mauz.busId=null;}else Object.assign(busRide,p);return;}
      if(b.doors>.9&&p.f>1.7&&p.f<3.6&&p.s>0&&p.s<1.5){busRide={id:b.id,heading:b.heading,...p};mauz.busId=b.id;return;}
    }
  }

  const streetDetails=[];
  for(const [i,b] of Island.buildings.entries()){
    for(const side of [-1,1]){
      const x=b.x+side*(b.w/2+2),y=b.y;
      if(Island.blocked(x,y)||Island.onRoad(x,y,1)||Island.heightAt(x,y)>0||[...Island.homes,...Island.venues,...Island.booths,...Island.jobs,...Island.jobs.flatMap(j=>j.points),Island.depot,...Island.deliveries].some(t=>Math.hypot(t.x-x,t.y-y)<4))continue;
      streetDetails.push({x,y,kind:i%4===0?'stall':i%3===0?'bench':'planter',size:1,heading:side*Math.PI/2});
    }
  }
  const detailIndex=spatialIndex(streetDetails);
  const stones=Array.from({length:100},()=>({x:random()*460-230,y:random()*460-230,size:.6+random()*.7})).filter(t=>Math.hypot(t.x,t.y)<230&&!Island.blocked(t.x,t.y)&&!Island.reserved(t.x,t.y));
  const balls=[{x:3,y:-4,vx:0,vy:0,color:'#e5a45d'},{x:5,y:4,vx:0,vy:0,color:'#89bbc1'},{x:-4,y:3,vx:0,vy:0,color:'#df9291'}];
  function visible(x,y,margin=180){if((x-camera.x)**2+(y-camera.y)**2>graphics.distance**2)return false;const p=point(x,y);return p.depth>1&&p.x>-margin&&p.x<width+margin&&p.y>-margin&&p.y<height+margin;}
  function buildingVisible(b){
    const range=graphics.distance;if(Math.abs(b.x-camera.x)>b.w/2+range||Math.abs(b.y-camera.y)>b.d/2+range)return false;
    // Reject only when the entire building lies outside one camera plane.
    // A nearby wall can fill the screen while its centre is offscreen or behind us.
    const overhang=b.city?0:.4,top=b.h+(b.city?0:2.5),corners=[];
    for(const x of [b.x-b.w/2-overhang,b.x+b.w/2+overhang])
      for(const y of [b.y-b.d/2-overhang,b.y+b.d/2+overhang])
        for(const z of [0,top])corners.push(point(x,y,z));
    const planes=[p=>p.depth-.5,p=>cx*p.depth+p.u*scale,
      p=>(width-cx)*p.depth-p.u*scale,p=>cy*p.depth-p.v*scale,
      p=>(height-cy)*p.depth+p.v*scale];
    return !planes.some(plane=>corners.every(p=>plane(p)<0));
  }
  function terrainOccludes(x,y,height){
    const ox=camera.x-cameraDistance*Math.cos(camera.heading),oy=camera.y-cameraDistance*Math.sin(camera.heading);
    const dx=x-ox,dy=y-oy,m=Island.mountain,length=dx*dx+dy*dy;
    const t=Math.max(0,Math.min(1,((m.x-ox)*dx+(m.y-oy)*dy)/(length||1)));
    if(Math.hypot(ox+dx*t-m.x,oy+dy*t-m.y)>m.radius)return false;
    const eye=camera.z+cameraHeight,top=Island.heightAt(x,y)+height;
    for(let i=1;i<32;i++){const a=i/32;if(Island.heightAt(ox+dx*a,oy+dy*a)>eye+(top-eye)*a+.3)return true;}
    return false;
  }
  function aerialBlocked(x,y,z,model){
    const radius=Math.max(model.width,model.length)/2;
    return treeIndex.near(x,y,radius+5).some(t=>!damage.get('tree',t.damageId)&&Math.hypot(t.x-x,t.y-y)<radius+t.size&&z<Island.heightAt(t.x,t.y)+t.size*3.8)||lampIndex.near(x,y,radius+1).some(l=>!damage.get('lamp',l.damageId)&&Math.hypot(l.x-x,l.y-y)<radius+.2&&z<4.9);
  }
  function vehicleWalkable(x,y){if(Island.inSea(x,y))return false;return walkable(x,y)&&!life.cars.some(c=>{const dx=x-c.x,dy=y-c.y;return Math.abs(dx*Math.cos(c.heading)+dy*Math.sin(c.heading))<c.model.length/2+.2&&Math.abs(-dx*Math.sin(c.heading)+dy*Math.cos(c.heading))<c.model.width/2+.2;});}
  const railFurniture=Island.railStations.flatMap(s=>[-22,0,22,-16,16].map(f=>{
    const bench=Math.abs(f)===16,vertical=Math.abs(Math.sin(s.heading))>.5;
    return {x:s.x+Math.cos(s.heading)*f,y:s.y+Math.sin(s.heading)*f,w:bench?(vertical?1:3):.4,d:bench?(vertical?3:1):.4,h:bench?.9:4.3};
  }));
  function jumpObjects(x,y){
    if(interior)return interior.lobby?[]:indoorFurniture();
    return [...Island.jobs.find(j=>j.id==='repair').points.filter(p=>Math.hypot(p.x-x,p.y-2.5-y)<5).map(p=>({x:p.x,y:p.y-2.5,w:4.3,d:2.5,h:1.3})),...railFurniture.filter(p=>Math.hypot(p.x-x,p.y-y)<4),...detailIndex.near(x,y,3).flatMap(p=>{
      const parts=p.kind==='bench'?[{x:0,y:0,w:2.2,d:.7,h:.67},{x:0,y:.35,w:2.2,d:.12,h:1.35}]:p.kind==='stall'?[{x:0,y:0,w:2.5,d:1.4,h:1.2},{x:0,y:0,w:2.5,d:1.9,h:2.56}]:[{x:0,y:0,w:1.5,d:1,h:1.23}];
      const c=Math.cos(p.heading),sn=Math.sin(p.heading);
      return parts.map(b=>({...b,x:p.x+b.x*c-b.y*sn,y:p.y+b.x*sn+b.y*c,w:Math.abs(c)*b.w+Math.abs(sn)*b.d,d:Math.abs(sn)*b.w+Math.abs(c)*b.d}));
    })];
  }
  function onObject(b,x,y){return Math.abs(x-b.x)<b.w/2+.2&&Math.abs(y-b.y)<b.d/2+.2;}
  function jumpSupport(x,y,height){return jumpObjects(x,y).reduce((top,b)=>onObject(b,x,y)&&b.h<=height+.04?Math.max(top,b.h):top,interior?0:busRamp(x,y));}
  function verticalStep(dt){
    const support=jumpSupport(mauz.x,mauz.y,mauz.jump);
    if(!interior&&busRamp(mauz.x,mauz.y)>mauz.jump)mauz.jump=busRamp(mauz.x,mauz.y);
    if(keys.has(' ')&&Math.abs(mauz.jump-support)<.015&&mauz.vz<=0&&(interior||!Island.inSea(mauz.x,mauz.y))){mauz.vz=city.jump+1.5;sound.effect('jump');}
    const before=mauz.jump;
    mauz.jump+=mauz.vz*dt-7.5*dt*dt;mauz.vz-=15*dt;
    const ceiling=interior&&!interior.lobby?(homePlan()?.height||3.3)-1.9:busRide?1.05:6;
    if(mauz.jump>ceiling){mauz.jump=ceiling;mauz.vz=Math.min(0,mauz.vz);}
    if(mauz.vz<=0&&mauz.jump<=support){mauz.jump=support;mauz.vz=0;}
  }
  function walkable(x,y){if(interior)return indoorWalkable(x,y);if(life.crossingBlocked(x,y)||Island.bridgeBarrier(x,y)||!Island.inBounds(x,y)||!busWalkable(x,y))return false;if(Island.inSea(x,y))return true;return !Island.blocked(x,y)&&!jumpObjects(x,y).some(b=>onObject(b,x,y)&&b.h>(mauz.jump||0)+.04)&&!lampIndex.near(x,y,1).some(l=>!damage.get('lamp',l.damageId)&&Math.hypot(l.x-x,l.y-y)<.55)&&!treeIndex.near(x,y,2).some(t=>!damage.get('tree',t.damageId)&&Math.hypot(x-t.x,y-t.y)<.65)&&!Island.booths.some(b=>Math.hypot(x-b.x,y-b.y)<.7);}
  function resize(){renderDirty=true;width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,graphicsProfile().dpr,Math.sqrt(graphicsProfile().pixels/(width*height)));canvas.width=Math.max(1,Math.floor(width*dpr));canvas.height=Math.max(1,Math.floor(height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);scale=Math.min(width*.85,height*1.05)*graphics.zoom/100;cx=width*.5;cy=height*.43;}
  // A perspective camera seven world units behind Mauz, three units high,
  // tilted down by only seven degrees.
  let cameraDistance=7, cameraHeight=3;
  const pitch=.12,pitchCos=Math.cos(pitch),pitchSin=Math.sin(pitch);
  let projectionHeading=NaN,headingCos=1,headingSin=0;
  function point(x,y,z=Island.heightAt(x,y)){
    if(projectionHeading!==camera.heading){projectionHeading=camera.heading;headingCos=Math.cos(camera.heading);headingSin=Math.sin(camera.heading);}
    const dx=x-camera.x,dy=y-camera.y;
    const right=-dx*headingSin+dy*headingCos;
    const forward=dx*headingCos+dy*headingSin+cameraDistance;
    const up=z-cameraHeight-camera.z;
    const depth=forward*pitchCos-up*pitchSin;
    const vertical=up*pitchCos+forward*pitchSin;
    return {x:cx+right*scale/Math.max(.5,depth),y:cy-vertical*scale/Math.max(.5,depth),u:right,v:vertical,depth};
  }
  function groundAt(x,y){
    const right=(x-cx)/scale,vertical=(cy-y)/scale;
    const forward=Math.cos(pitch)+vertical*Math.sin(pitch);
    const up=vertical*Math.cos(pitch)-Math.sin(pitch);
    const ox=camera.x-cameraDistance*Math.cos(camera.heading),oy=camera.y-cameraDistance*Math.sin(camera.heading);
    const dx=forward*Math.cos(camera.heading)-right*Math.sin(camera.heading),dy=forward*Math.sin(camera.heading)+right*Math.cos(camera.heading);
    const sample=t=>({x:ox+dx*t,y:oy+dy*t,z:camera.z+cameraHeight+up*t});
    let previous=.5;
    for(let t=.5;t<Island.radius*2+100;t+=.7){
      const p=sample(t);
      if(p.z<=Island.heightAt(p.x,p.y)){
        let low=previous,high=t;
        for(let i=0;i<14;i++){const mid=(low+high)/2,q=sample(mid);if(q.z>Island.heightAt(q.x,q.y))low=mid;else high=mid;}
        return sample((low+high)/2);
      }
      previous=t;
    }
    return null;
  }
  function indoorCameraLimit(x,y,heading){
    // Sweep a padded camera towards its desired position; never cross a wall.
    const l=homePlan();
    const solids=[...indoorWalls(),...indoorFurniture().filter(b=>b.h>1.5)];
    for(let distance=.1;distance<=4.5;distance+=.05){
      const px=x-Math.cos(heading)*distance,py=y-Math.sin(heading)*distance;
      if((interior.lobby&&Math.hypot(px,py+3)<.65)||Math.abs(px)>(l?l.w/2:12)-.3||Math.abs(py)>(l?l.d/2:12)-.3||solids.some(b=>Math.abs(px-b.x)<b.w/2+.25&&Math.abs(py-b.y)<b.d/2+.25))return Math.max(.1,distance-.05);
    }
    return interior.lobby?3.5:4.5;
  }
  function resolveIndoorCamera(){
    if(!interior)return;
    camera.x=mauz.x;camera.y=mauz.y;camera.z=mauz.elevation||0;
    cameraDistance=indoorCameraLimit(mauz.x,mauz.y,camera.heading);
    cameraHeight=Math.min(2.4,1.4+cameraDistance*.22);
  }
  function segmentBox(a,b,box,padding=0){
    let low=0,high=1;
    for(const [axis,min,max] of [['x',box.x-box.w/2-padding,box.x+box.w/2+padding],['y',box.y-box.d/2-padding,box.y+box.d/2+padding],['z',(box.z||0)-padding,(box.z||0)+box.h+padding]]){
      const delta=b[axis]-a[axis];
      if(Math.abs(delta)<1e-9){if(a[axis]<min||a[axis]>max)return null;continue;}
      const t0=(min-a[axis])/delta,t1=(max-a[axis])/delta;
      low=Math.max(low,Math.min(t0,t1));high=Math.min(high,Math.max(t0,t1));if(low>high)return null;
    }
    return low;
  }
  function outdoorHit(a,b,padding=0){
    let hit=1;
    const test=box=>{const t=segmentBox(a,b,box,padding);if(t!==null)hit=Math.min(hit,t);};
    for(const wall of Island.railWalls)test(wall);
    for(const r of Island.railStructures)if(r.kind==='tunnel')test({...r,z:7.4,h:2});
    for(const building of Island.buildings)test({...building,h:building.h+(building.city?0:2.5)});
    for(const lamp of lampIndex.near((a.x+b.x)/2,(a.y+b.y)/2,Math.hypot(b.x-a.x,b.y-a.y)/2+1))if(!damage.get('lamp',lamp.damageId))test({...lamp,w:.2,d:.2,h:4.6});
    for(const booth of Island.booths)test({...booth,w:1.3,d:1.3,h:2.7});
    const range=Math.hypot(b.x-a.x,b.y-a.y);
    for(const tree of treeIndex.near((a.x+b.x)/2,(a.y+b.y)/2,range/2+10)){
      if(damage.get('tree',tree.damageId))continue;
      test({x:tree.x,y:tree.y,w:.36*tree.size,d:.36*tree.size,h:2.1*tree.size});
      // Ellipsoid enclosing the leafy crown, rather than a solid box around the whole tree.
      const rx=1.5*tree.size+padding,rz=1.95*tree.size+padding;
      const ox=(a.x-tree.x)/rx,oy=(a.y-tree.y)/rx,oz=(a.z-2.05*tree.size)/rz;
      const dx=(b.x-a.x)/rx,dy=(b.y-a.y)/rx,dz=(b.z-a.z)/rz;
      const A=dx*dx+dy*dy+dz*dz,B=2*(ox*dx+oy*dy+oz*dz),C=ox*ox+oy*oy+oz*oz-1,disc=B*B-4*A*C;
      if(C<0)hit=0;else if(A>0&&disc>=0){const t=(-B-Math.sqrt(disc))/(2*A);if(t>=0&&t<=1)hit=Math.min(hit,t);}
    }
    for(const stone of stones)test({x:stone.x,y:stone.y,w:stone.size,d:stone.size,h:stone.size*.43});
    if(vehicles.car&&!vehicles.driving){const c=vehicles.car,m=c.model;test({x:c.x,y:c.y,z:Island.heightAt(c.x,c.y),w:Math.abs(Math.cos(c.heading))*m.length+Math.abs(Math.sin(c.heading))*m.width,d:Math.abs(Math.sin(c.heading))*m.length+Math.abs(Math.cos(c.heading))*m.width,h:1.8});}
    const count=Math.max(1,Math.ceil(range/.3));
    for(let i=1;i<=count;i++){const t=i/count;if(t>=hit)break;if(Island.heightAt(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t)+padding>a.z+(b.z-a.z)*t){hit=t;break;}}
    return hit;
  }
  function travelHeight(){const ride=network.rideOwner?network.players.find(p=>p.id===network.rideOwner)?.vehicle:null;return ride?.z??(vehicles.driving?vehicles.car.z||Island.heightAt(mauz.x,mauz.y):Island.heightAt(mauz.x,mauz.y));}
  function outdoorCameraLimit(x,y,heading,distance,height){
    const a={x,y,z:travelHeight()+height};
    const b={x:x-Math.cos(heading)*distance,y:y-Math.sin(heading)*distance,z:a.z};
    const hit=outdoorHit(a,b,.3);return hit===1?distance:Math.max(.1,distance*hit-.05);
  }
  function resolveOutdoorCamera(){
    if(interior)return;
    // Anchor the collision sweep to Mauz, so smoothing cannot carry the camera through a corner.
    camera.x=mauz.x;camera.y=mauz.y;camera.z=travelHeight();
    if(busRide){cameraDistance=.1;cameraHeight=(mauz.seated?1.35:1.65)+mauz.jump;return;}
    cameraDistance=Math.min(cameraDistance,outdoorCameraLimit(camera.x,camera.y,camera.heading,cameraDistance,cameraHeight));
  }
  function markerOccluded(t){
    if(interior)return false;
    const eye={x:camera.x-Math.cos(camera.heading)*cameraDistance,y:camera.y-Math.sin(camera.heading)*cameraDistance,z:camera.z+cameraHeight};
    return outdoorHit(eye,{x:t.x,y:t.y,z:Island.heightAt(t.x,t.y)+2.6})<.999;
  }
  function follow(dt){
    const blend=1-Math.exp(-8*dt);
    cameraDistance+=((vehicles.driving?11:7)-cameraDistance)*blend;cameraHeight+=((vehicles.driving?4:3)-cameraHeight)*blend;
    camera.x+=(mauz.x-camera.x)*blend;camera.y+=(mauz.y-camera.y)*blend;
    camera.z+=(travelHeight()-camera.z)*blend;
    const angle=Math.atan2(Math.sin(mauz.heading+(viewFront?Math.PI:0)-camera.heading),Math.cos(mauz.heading+(viewFront?Math.PI:0)-camera.heading));
    camera.heading+=angle*(1-Math.exp(-7*dt));
    resolveIndoorCamera();resolveOutdoorCamera();
  }
  let transportFrame=null,transportRenderer;
  function polygon(points,color){
    // Reject only faces wholly outside one clipping plane, including faces
    // crossing the near plane. Keep intersecting walls for correct occlusion.
    if(points.length&&Number.isFinite(points[0].u)){
      let outside=31;
      for(const p of points){const x=scale*p.u+cx*p.depth,y=cy*p.depth-scale*p.v;outside&=(p.depth<.1?1:0)|(x<0?2:0)|(x>width*p.depth?4:0)|(y<0?8:0)|(y>height*p.depth?16:0);}
      if(outside)return;
    }
    if(transportFrame&&color.length===7&&ctx.globalAlpha===1&&points.every(p=>Number.isFinite(p.u)&&Number.isFinite(p.v)&&Number.isFinite(p.depth)))transportFrame.occluders.push(points);
    if(points[0]?.depth!==undefined){
      const clipped=[];
      for(let i=0;i<points.length;i++){
        const a=points[i],b=points[(i+1)%points.length],inside=a.depth>=.5;
        if(inside)clipped.push(a);
        if(inside!==(b.depth>=.5)){
          const t=(.5-a.depth)/(b.depth-a.depth);
          const u=a.u+(b.u-a.u)*t,v=a.v+(b.v-a.v)*t;
          clipped.push({x:cx+u*scale/.5,y:cy-v*scale/.5});
        }
      }
      points=clipped;
    }
    if(points.length<3)return;
    ctx.fillStyle=color;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();
  }
  const staticScenery=new Map();
  function scenery(kind,item){
    const f=damage.get(kind,item.damageId),tilt=f?Math.min(1,(damage.time-f.started)/.65)*Math.PI/2:0;
    if(kind==='busstop'&&transportFrame){transportFrame.mesh.push(...sceneryMesh(kind,item,Island.heightAt(item.x,item.y),{detail:true}));return;}
    const ground=Island.heightAt(item.x,item.y)+(item.z||0),detail=graphics.realism==='ultra'?12:graphics.realism!=='simple'&&Math.hypot(item.x-mauz.x,item.y-mauz.y)<(graphics.realism==='detailed'?65:35),lit=kind==='lamp'&&!f&&dayCycle.darkness>.15;
    const cacheable=['tree','lamp','bench','planter','stall','stone','grass','flower','parcel','toolbox','work-facade'].includes(kind)&&!f;
    let cached=cacheable?staticScenery.get(item):null;
    if(!cached||cached.kind!==kind||cached.detail!==detail||cached.lit!==lit||cached.ground!==ground){cached={kind,detail,lit,ground,faces:sceneryMesh(kind,f?{...item,heading:f.heading}:item,ground,{tilt,detail,lit})};}
    if(cacheable){staticScenery.delete(item);staticScenery.set(item,cached);if(staticScenery.size>512)staticScenery.delete(staticScenery.keys().next().value);}
    drawMesh(cached.faces);
  }
  function tree(t){scenery('tree',t);}
  function animalFaces(actor){return animalMesh(actor,Island.outfits.find(o=>o.id===(actor===mauz?job.outfitId:actor.outfit)),interior?(actor.elevation||0):Island.inSea(actor.x,actor.y)?-.6:Island.heightAt(actor.x,actor.y),time,actor===mauz?1:Math.hypot(actor.x-mauz.x,actor.y-mauz.y)>20?.5:.7);}
  function drawMesh(faces){
    const cache=new Map();
    const projected=faces.map(f=>{const points=f.points.map(v=>{let p=cache.get(v);if(!p){p=point(...v);cache.set(v,p);}return p;});return {color:f.color,points,depth:points.reduce((n,p)=>n+p.depth,0)/points.length};});
    projected.sort((a,b)=>b.depth-a.depth);for(const f of projected)polygon(f.points,f.color);
  }
  function cat(actor=mauz){
    if(actor===mauz&&busRide)return;
    if(actor.riding||actor===mauz&&network.rideOwner)return;
    if(actor===mauz&&(vehicles.driving||(!interior&&cameraDistance<1.5)))return;
    if(point(actor.x,actor.y).depth<.5)return;drawMesh(animalFaces(actor));
    if(actor!==mauz&&actor.id&&!actor.id.startsWith('citizen')){const p=point(actor.x,actor.y,(interior?0:Island.heightAt(actor.x,actor.y))+2.3);ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillStyle='#fffdf1';ctx.fillText(actor.name||'Mauz '+actor.id.slice(0,4),p.x,p.y);}
  }
  function vehicleImpact(impact){
    if(impact.model.kind){damage.hit(impact);if(onlineMode)network.crash(impact);crashParticles(impact.carX,impact.carY,impact.z||0);notify('Kaboom! Fahrzeug kaputt. Du bist sicher an Land.');return;}
    if(impact.speed*3.6<=70){if(impact.speed>3)sound.effect('crash');return;}
    const hits=damage.hit(impact);if(hits.length){impact.scenery=true;if(onlineMode)network.crash(impact);sound.effect('crash');notify('Umgekippt! In 5 Sekunden steht alles wieder.');return {keepCar:true};}
    if(onlineMode)network.crash(impact);crashParticles(impact.carX,impact.carY);
    notify('Krach! Auto kaputt. Mauz ist sicher. An einer Telefonzelle bekommst du ein neues Auto.');
  }
  function crashParticles(x,y,z=0){sound.effect('explosion');
    for(let i=0;i<65;i++)motes.push({x,y,z:z+.6,vx:(Math.random()-.5)*13,vy:(Math.random()-.5)*13,vz:2+Math.random()*7,life:1+Math.random()*1.5,color:['#ffbb49','#ee6b39','#45494c'][i%3],big:true});
  }
  function peers(){return onlineMode?network.players.filter(p=>p.room===(interior?(interior.public?interior.id:'home:'+interior.id):'world')).map(p=>({...p,x:p.renderX??p.x,y:p.renderY??p.y})):[];}
  function remoteDrawing(p){
    if(p.car&&!interior&&!p.vehicle){const model=VehicleModels.find(m=>m.id===p.car);if(model){carDrawing({...p,model,speed:0});return;}}
    if(!p.car&&!p.riding)cat(p);
  }
  function remoteVisible(p){return visible(p.x,p.y)&&outdoorHit({x:camera.x-Math.cos(camera.heading)*cameraDistance,y:camera.y-Math.sin(camera.heading)*cameraDistance,z:camera.z+cameraHeight},{x:p.x,y:p.y,z:Island.heightAt(p.x,p.y)+1.2})>=.999;}
  function groundRect(x,y,w,d,color,z=0){polygon([point(x-w/2,y-d/2,z),point(x+w/2,y-d/2,z),point(x+w/2,y+d/2,z),point(x-w/2,y+d/2,z)],color);}
  function groundOval(x,y,rx,ry,color){polygon(Array.from({length:80},(_,i)=>{const a=i*Math.PI/40;return point(x+Math.cos(a)*rx,y+Math.sin(a)*ry);}),color);}
  function box(x,y,w,d,h,color,top){
    const corners=[[x-w/2,y-d/2],[x+w/2,y-d/2],[x+w/2,y+d/2],[x-w/2,y+d/2]];
    const faces=corners.map((a,i)=>{const b=corners[(i+1)%4];return {a,b,depth:-point((a[0]+b[0])/2,(a[1]+b[1])/2).depth};});
    faces.sort((a,b)=>a.depth-b.depth);
    const ex=camera.x-Math.cos(camera.heading)*cameraDistance,ey=camera.y-Math.sin(camera.heading)*cameraDistance;
    for(const f of faces)if((ex-f.a[0])*(f.b[1]-f.a[1])-(ey-f.a[1])*(f.b[0]-f.a[0])>0)polygon([point(...f.a),point(...f.b),point(...f.b,h),point(...f.a,h)],color);
    polygon(corners.map(c=>point(...c,h)),top);
  }
  function house(b){
    box(b.x,b.y,b.w,b.d,b.h,b.color,'#faf0d6');
    if(!b.city){
    const corners=[[b.x-b.w/2-.4,b.y-b.d/2-.4],[b.x+b.w/2+.4,b.y-b.d/2-.4],[b.x+b.w/2+.4,b.y+b.d/2+.4],[b.x-b.w/2-.4,b.y+b.d/2+.4]];
    const apex=point(b.x,b.y,b.h+2.5);
    const faces=corners.map((a,i)=>({a,b:corners[(i+1)%4]}));
    faces.sort((a,b)=>point(...a.a).y+point(...a.b).y-point(...b.a).y-point(...b.b).y);
    for(const {a,b:edge} of faces)polygon([point(...a,b.h),point(...edge,b.h),apex],b.roof);
    }
    if((b.venueId||b.jobId||b.x===-10&&b.y===-8)&&Math.hypot(b.x-camera.x,b.y-camera.y)<70&&Math.sin(camera.heading)<0){drawMesh(sceneryMesh('work-facade',{x:b.x,y:b.y+b.d/2+.03,color:b.jobId?'#85a08a':'#d9b77b'},0));}
    // Front door and windows belong to the world, so they turn with the camera.
    if(Math.sin(camera.heading)<0){
      const y=b.y+b.d/2+.01;
      if(!(b.venueId||b.jobId||b.x===-10&&b.y===-8))polygon([point(b.x-.5,y),point(b.x+.5,y),point(b.x+.5,y,2.6),point(b.x-.5,y,2.6)],'#906f55');
      for(let z=2;z<b.h-1;z+=3)for(const x of [b.x-b.w*.3,b.x+b.w*.3])
        polygon([point(x-.7,y,z),point(x+.7,y,z),point(x+.7,y,z+1.4),point(x-.7,y,z+1.4)],'#e8f4ee');

    }
  }
  const terrainMeshes=(Island.terrain||[]).map(t=>{
    const faces=[];const vertex=(ix,iy)=>[t.x-t.radius+ix*t.step,t.y-t.radius+iy*t.step,t.heights[iy*(t.cells+1)+ix]];
    for(let iy=0;iy<t.cells;iy++)for(let ix=0;ix<t.cells;ix++){
      const a=vertex(ix,iy),b=vertex(ix+1,iy),c=vertex(ix,iy+1),d=vertex(ix+1,iy+1);
      for(const points of [[a,b,c],[b,d,c]]){
        const z=points.reduce((sum,p)=>sum+p[2],0)/3;if(z<.001)continue;
        // Shade by actual slope instead of alternating grid colours.
        const [p0,p1,p2]=points,u=p1.map((v,i)=>v-p0[i]),v=p2.map((n,i)=>n-p0[i]);
        const nx=u[1]*v[2]-u[2]*v[1],ny=u[2]*v[0]-u[0]*v[2],nz=u[0]*v[1]-u[1]*v[0],length=Math.hypot(nx,ny,nz)||1;
        const rock=t.height>65?Math.max(0,Math.min(1,(z/t.height-.25)*3)):0;
        const edge=Math.min(1,z/3),light=1+edge*Math.max(-.16,Math.min(.08,(-nx*.4-ny*.3)/length));
        const grass=[167,200,117],stone=[151,156,141];
        const color='#'+grass.map((n,i)=>Math.round(Math.max(0,Math.min(255,(n*(1-rock)+stone[i]*rock)*light))).toString(16).padStart(2,'0')).join('');
        faces.push({points,color});
      }
    }
    return {...t,faces};
  });
  const cloudGeometry=sceneryMesh('cloud',{x:0,y:0},0,{detail:true});
  let cloudDrift=0;
  function cloudObjects(){
    if(!graphics.clouds||!['detailed','ultra'].includes(graphics.realism))return [];
    const objects=[],spacing=graphics.clouds===2?220:360;
    const cellX=Math.floor((camera.x-cloudDrift)/spacing),cellY=Math.floor(camera.y/spacing);
    for(let ix=cellX-2;ix<=cellX+2;ix++)for(let iy=cellY-2;iy<=cellY+2;iy++){
      const seed=Math.sin(ix*73+iy*31),x=ix*spacing+cloudDrift+seed*45,y=iy*spacing+Math.cos(ix*19+iy*57)*55,z=125+(seed+1)*25;
      const center=point(x,y,z);if(center.depth<10||center.x<-250||center.x>width+250)continue;
      for(const f of cloudGeometry){const points=f.points.map(v=>point(x+v[0],y+v[1],z+v[2]));objects.push({depth:-points.reduce((sum,p)=>sum+p.depth,0)/points.length,draw:()=>polygon(points,f.color)});}
    }
    return objects;
  }
  function terrainObjects(){
    const objects=[];
    for(const t of terrainMeshes){if(Math.hypot(t.x-camera.x,t.y-camera.y)>graphics.distance+t.radius*1.42)continue;
      for(const f of t.faces){const points=f.points.map(v=>point(...v));objects.push({depth:-points.reduce((sum,p)=>sum+p.depth,0)/3,draw:()=>polygon(points,f.color)});}
    }
    return objects;
  }
  function mountain(){
    const m=Island.mountain,faces=[];
    for(let ring=0;ring<5;ring++)for(let i=0;i<40;i++){
      const radii=[0,4,11,19,27,m.radius];
      const r0=radii[ring],r1=radii[ring+1],a=i*Math.PI/20,b=(i+1)*Math.PI/20;
      const coords=[[m.x+Math.cos(a)*r0,m.y+Math.sin(a)*r0],[m.x+Math.cos(a)*r1,m.y+Math.sin(a)*r1],[m.x+Math.cos(b)*r1,m.y+Math.sin(b)*r1],[m.x+Math.cos(b)*r0,m.y+Math.sin(b)*r0]];
      const points=coords.map(c=>point(...c));
      faces.push({points,depth:points.reduce((v,p)=>v+p.depth,0)/4,color:ring===0?'#eef0e8':ring<3?(i%3?'#959e8b':'#a7ac97'):(i%3?'#819965':'#94a571')});
    }
    // A visible spiral trail leads all the way to the summit.
    for(let i=0;i<240;i++){
      const trail=n=>{const t=n/240,r=4+(m.radius-4)*(1-t),a=t*Math.PI*5;return [m.x+Math.cos(a)*r,m.y+Math.sin(a)*r];};
      const a=trail(i),b=trail(i+1),dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1;
      const corners=[[a[0]-dy/length*.6,a[1]+dx/length*.6],[b[0]-dy/length*.6,b[1]+dx/length*.6],[b[0]+dy/length*.6,b[1]-dx/length*.6],[a[0]+dy/length*.6,a[1]-dx/length*.6]];
      const points=corners.map(c=>point(...c,Island.heightAt(...c)+.04));
      faces.push({points,depth:points.reduce((v,p)=>v+p.depth,0)/4-.02,color:'#c7bca1'});
    }
    return faces.map(f=>({depth:-f.depth,draw:()=>polygon(f.points,f.color)}));
  }
  function marker(t,label,color){
    if(!graphics.labels)return;
    const p=point(t.x,t.y,Island.heightAt(t.x,t.y)+2.6);
    if(p.depth<1||p.x<0||p.x>width||p.y<0||p.y>height||markerOccluded(t))return;
    const size=Math.max(5,Math.min(13,100/p.depth));
    polygon([{x:p.x,y:p.y+size},{x:p.x-size,y:p.y-size},{x:p.x+size,y:p.y-size}],color);
    if(Math.hypot(mauz.x-t.x,mauz.y-t.y)<40){
      ctx.font='600 12px Segoe UI';ctx.textAlign='center';ctx.fillStyle='#29453c';
      const w=ctx.measureText(label).width+18;ctx.fillStyle='#fffffff0';ctx.fillRect(p.x-w/2,p.y-34,w,21);ctx.fillStyle='#29453c';ctx.fillText(label,p.x,p.y-19);
    }
  }
  const busSigns=new Map();
  function railBox(x,y,w,d,z,h,color){
    if(!transportFrame)return;const p=[[x-w/2,y-d/2],[x+w/2,y-d/2],[x+w/2,y+d/2],[x-w/2,y+d/2]];
    transportFrame.mesh.push({points:p.map(q=>[...q,z+h]),color},{points:p.map(q=>[...q,z]),color});
    for(let i=0;i<4;i++)transportFrame.mesh.push({points:[[...p[i],z],[...p[(i+1)%4],z],[...p[(i+1)%4],z+h],[...p[i],z+h]],color});
  }
  function drawRailway(){
    for(const line of Island.railLines)for(let i=0;i<line.route.length;i++){
      const a=line.route[i],b=line.route[(i+1)%line.route.length],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(!length)continue;
      const t=Math.max(0,Math.min(length,((camera.x-a.x)*dx+(camera.y-a.y)*dy)/length));
      if(Math.hypot(camera.x-a.x-dx*t/length,camera.y-a.y-dy*t/length)>190)continue;
      const from=Math.max(0,t-190),to=Math.min(length,t+190),normal={x:-dy/length,y:dx/length};
      const edge=(n,d,z)=>point(a.x+dx*d/length+normal.x*n,a.y+dy*d/length+normal.y*n,z);
      polygon([edge(-2.6,from,.03),edge(2.6,from,.03),edge(2.6,to,.03),edge(-2.6,to,.03)],'#99998e');
      for(let d=Math.ceil(from/2.5)*2.5;d<to;d+=2.5)polygon([edge(-2.1,d,.06),edge(2.1,d,.06),edge(2.1,d+.3,.06),edge(-2.1,d+.3,.06)],'#796b59');
      for(const n of [-1,1])polygon([edge(n-.08,from,.12),edge(n+.08,from,.12),edge(n+.08,to,.12),edge(n-.08,to,.12)],'#d5dce0');
    }
    for(const r of Island.railStructures){if(Math.abs(r.x-camera.x)>r.w/2+180||Math.abs(r.y-camera.y)>180)continue;
      if(r.kind==='bridge'){groundRect(r.x,r.y,r.w-8,75,'#68aebd');railBox(r.x,r.y,r.w,r.d,-.35,.4,'#a6aaa1');for(let x=r.x-r.w/2;x<r.x+r.w/2;x+=24)for(const side of [-1,1])railBox(x,r.y+side*5,.7,.7,.2,5,'#738d93');}
      for(const side of [-1,1])railBox(r.x,r.y+side*(r.d/2-.3),r.w,.6,0,r.kind==='tunnel'?8:1.2,r.kind==='tunnel'?'#697775':'#83989c');
      if(r.kind==='tunnel'){railBox(r.x,r.y,r.w,r.d,7.4,2,'#8b9785');for(const side of [-1,1])transportFrame.mesh.push({color:side>0?'#829774':'#92a57c',points:[[r.x-r.w/2,r.y+side*(r.d/2),9.4],[r.x+r.w/2,r.y+side*(r.d/2),9.4],[r.x+r.w/2,r.y+side*(r.d/2+24),0],[r.x-r.w/2,r.y+side*(r.d/2+24),0]]});}
    }
    for(const coach of life.trains.filter(t=>t.coach<2)){
      const next=life.trains.find(t=>t.service===coach.service&&t.coach===coach.coach+1);if(!next||Math.hypot(coach.x-camera.x,coach.y-camera.y)>180)continue;
      const a=busPoint(coach,{f:-4.5,s:0}),b=busPoint(next,{f:4.5,s:0}),d=Math.hypot(b.x-a.x,b.y-a.y)||1,nx=-(b.y-a.y)/d*.15,ny=(b.x-a.x)/d*.15;
      const p=[[a.x+nx,a.y+ny],[b.x+nx,b.y+ny],[b.x-nx,b.y-ny],[a.x-nx,a.y-ny]];
      transportFrame.mesh.push({points:p.map(q=>[...q,.8]),color:'#44545a'});for(let i=0;i<4;i++)transportFrame.mesh.push({points:[[...p[i],.5],[...p[(i+1)%4],.5],[...p[(i+1)%4],.8],[...p[i],.8]],color:'#34454a'});
    }
    for(const gate of life.crossings){
      if(Math.hypot(gate.x-camera.x,gate.y-camera.y)>180)continue;
      for(const side of [-1,1]){
        const x=gate.x+(gate.vertical?-gate.width/2-.4:side*9),y=gate.y+(gate.vertical?side*9:-gate.width/2-.4);
        railBox(x,y,.45,.45,0,1.4,'#596b70');
        const angle=(1-gate.gate)*Math.PI/2,length=gate.width+.8;
        for(let d=0;d<length;d+=.4){const horizontal=d*Math.cos(angle),z=1.2+d*Math.sin(angle);
          railBox(x+(gate.vertical?horizontal:0),y+(gate.vertical?0:horizontal),gate.vertical?.45:.18,gate.vertical?.18:.45,z,.18,Math.floor(d/.8)%2?'#f4eee0':'#c9433e');}
        railBox(x,y,.65,.25,1.7,.35,gate.closed&&Math.floor(time*3)%2?'#ff453a':'#502f2c');
      }
    }
    for(const station of Island.railStations){if(Math.hypot(station.x-camera.x,station.y-camera.y)>180)continue;
      const vertical=Math.abs(Math.sin(station.heading))>.5,w=vertical?9:80,d=vertical?80:9;
      railBox(station.x,station.y,w,d,0,.3,'#cec7b2');
      for(const f of [-22,0,22]){const x=station.x+Math.cos(station.heading)*f,y=station.y+Math.sin(station.heading)*f;railBox(x,y,.4,.4,.3,4,'#466b76');}
      railBox(station.x,station.y,vertical?5:75,vertical?75:5,4.3,.25,'#617d85');
      for(const f of [-16,16]){const x=station.x+Math.cos(station.heading)*f,y=station.y+Math.sin(station.heading)*f;railBox(x,y,vertical?1:3,vertical?3:1,.3,.6,'#9f7854');}
      marker(station,station.line+' - '+station.name+' | Gleis '+station.platform,'#3a738b');
    }
  }
  function trainDrawing(b){
    if(!transportFrame)return;
    const mesh=[],v=(f,s,z)=>{const p=busPoint(b,{f,s});return [p.x,p.y,z*(b.scaleZ||1)];};
    const face=(points,color,opacity)=>mesh.push({points:points.map(p=>v(...p)),color,...(opacity?{opacity}: {})});
    const cube=(f,s,d,w,z,h,color)=>{const p=[[f-d/2,s-w/2],[f+d/2,s-w/2],[f+d/2,s+w/2],[f-d/2,s+w/2]];face(p.map(q=>[...q,z+h]),color);face(p.map(q=>[...q,z]),color);for(let i=0;i<4;i++)face([[...p[i],z],[...p[(i+1)%4],z],[...p[(i+1)%4],z+h],[...p[i],z+h]],color);};
    const cab=b.coach===0,front=cab?3.35:4.45,paint=b.color||'#b65349';
    cube(-.05,0,8.9,2.95,.12,.33,'#34434d');
    cube(-.05,0,8.9,2.95,.45,.08,'#c8c6bc');
    for(const side of [-1,1]){
      // Continuous passenger windows and flush sliding doors, above a deep railway skirt.
      cube(-1.1,side*1.5,6.7,.12,.4,.9,'#e8e9e4');
      cube(-1.1,side*1.57,6.7,.035,.65,.32,paint);
      cube(-.1,side*1.5,8.7,.12,2.65,.4,'#e8e9e4');
      for(const f of [-4.42,-3.5,-2,-.5,1.1])cube(f,side*1.5,.12,.16,1.3,1.4,'#344b5b');
      face([[-4.4,side*1.51,1.3],[1.5,side*1.51,1.3],[1.5,side*1.51,2.65],[-4.4,side*1.51,2.65]],'#75a9b8',.22);
      if(side<0){cube(2.6,-1.5,2,.12,.45,.85,'#e8e9e4');face([[1.6,-1.51,1.3],[3.6,-1.51,1.3],[3.6,-1.51,2.65],[1.6,-1.51,2.65]],'#75a9b8',.22);}
      else for(const half of [-1,1]){const f=2.6+half*(.5+b.doors*.95);cube(f,1.55,.98,.1,.45,.8,paint);cube(f,1.55,.98,.1,2.62,.15,paint);for(const edge of [-.46,.46])cube(f+edge,1.55,.055,.12,1.25,1.4,paint);face([[f-.43,1.56,1.25],[f+.43,1.56,1.25],[f+.43,1.56,2.62],[f-.43,1.56,2.62]],'#8eb5be',.22);}
      for(const f of [-3,-1,1]){cube(f,side*.95,.85,.75,.45,.55,'#476e89');cube(f-.4,side*.95,.13,.78,1,.95,'#315269');cube(f,side*.55,.75,.07,1.05,.07,'#b6c1c3');}
    }
    // Faceted barrel roof, rather than the flat rectangular bus roof.
    const roof=[[-1.55,2.95],[-1.35,3.2],[-.85,3.36],[.85,3.36],[1.35,3.2],[1.55,2.95]];
    for(let i=0;i<roof.length-1;i++)face([[-4.5,...roof[i]],[front,...roof[i]],[front,...roof[i+1]],[-4.5,...roof[i+1]]],i%2?'#d1d8d9':'#eef0ec');
    // Seal the curved roof at both ends of passenger carriages.
    if(!cab){
      for(const end of [-4.5,4.45])face(roof.map(([side,z])=>[end,side,z]),'#d2d9d7');
      for(const side of [-1,1])cube(4.025,side*1.5,.95,.18,2.95,.25,'#e8e9e4');
    }
    cube(-1,0,2.2,1.1,3.36,.2,'#667780');
    // Enclosed end wall and rubber gangway between the coupled carriages.
    cube(-4.48,0,.12,3,.45,2.65,'#d2d9d7');cube(-4.57,0,.18,1.15,.5,2.1,'#303b43');
    for(let f=-4.58;f>-4.85;f-=.065)cube(f,0,.035,1.24,.5,2.15,'#52616a');
    if(cab){
      const a=[[3.35,-1.5,.45],[3.35,1.5,.45],[3.35,1.5,3.15],[3.35,-1.5,3.15]],tip=[[4.62,-1.05,.55],[4.62,1.05,.55],[4.62,1.05,1.55],[4.62,-1.05,1.55]];
      for(let i=0;i<4;i++)face([a[i],tip[i],tip[(i+1)%4],a[(i+1)%4]],i===2?'#263e4c':'#e9ece7');
      face(tip,paint);
      face([[4.47,-.94,1.67],[4.47,.94,1.67],[3.48,1.3,3.05],[3.48,-1.3,3.05]],'#6094a6',.45);
      for(const side of [-1,1])cube(4.635,side*.76,.035,.35,.95,.2,'#fff2bd');
      cube(4.67,0,.08,1.35,.58,.2,'#263944');
      const p=busPoint(b,{f:3.4,s:-.7});mesh.push(...animalMesh({...p,heading:b.heading,species:'bear',seated:true},null,.45*b.scaleZ,time,.5));
    }else{
      // Close the side panels between the door/window section and the carriage end.
      for(const side of [-1,1])cube(4.025,side*1.5,.95,.16,.45,2.65,'#e8e9e4');
      cube(4.45,0,.12,3,.45,2.65,'#d2d9d7');cube(4.52,0,.12,1.2,.5,2.15,'#303b43');
    }
    // Solid door jambs close the seams; only the sliding doorway remains open.
    for(const side of [-1,1])for(const f of [1.55,3.6])cube(f,side*1.5,.14,.2,.45,2.55,'#d2d9d7');
    face(roof.map(([side,z])=>[-4.5,side,z]),'#d2d9d7');
    if(cab)cube(3.32,0,.12,3,.45,2.65,'#d2d9d7');
    // Two underfloor bogies with small inset steel wheels and axles.
    for(const centre of [-2.9,2.9]){
      cube(centre,0,1.3,2.15,.08,.25,'#273740');
      for(const f of [centre-.4,centre+.4])for(const side of [-1,1]){
        const rings=[side*.93,side*1.12].map(s=>Array.from({length:12},(_,i)=>[f+Math.cos(i*Math.PI/6)*.19,s,.23+Math.sin(i*Math.PI/6)*.19]));
        for(const ring of rings)face(ring,'#71818b');for(let i=0;i<12;i++)face([rings[0][i],rings[0][(i+1)%12],rings[1][(i+1)%12],rings[1][i]],'#34444e');
      }
    }
    for(const p of network.players.filter(p=>p.busId===b.id&&Number.isInteger(p.busSeat))){const q=busPoint(b,busSeatPoint(p.busSeat));mesh.push(...animalMesh({...p,...q,heading:b.heading,seated:true,moving:false},null,.45*b.scaleZ,time,.5));}
    cube(3.25,0,.14,1.55,1.9,.48,'#182f32');
    transportFrame.mesh.push(...mesh);
    const text='ZUG '+b.line+' | '+(b.wait>0?(b.terminal?'ENDSTATION':'HALT'):'NAECHSTER HALT'),station=b.wait>0?b.stop:b.nextStop,key=text+station;
    let sign=busSigns.get(b.id+'-train');if(!sign||sign.text!==key){const surface=sign?.surface||document.createElement('canvas');surface.width=1024;surface.height=224;const c=surface.getContext('2d');c.fillStyle='#182f32';c.fillRect(0,0,1024,224);c.textAlign='center';c.fillStyle='#a9d2c9';c.font='bold 38px sans-serif';c.fillText(text,512,65,980);c.fillStyle='#ffe499';c.font='bold 60px sans-serif';c.fillText(station,512,162,980);sign={text:key,surface};busSigns.set(b.id+'-train',sign);}
    transportFrame.labels.push({surface:sign.surface,points:[[3.17,-.73,1.92],[3.17,.73,1.92],[3.17,.73,2.35],[3.17,-.73,2.35]].map(p=>v(...p))});
  }
  function busDrawing(b){
    if(b.kind==='train')return trainDrawing(b);
    const parts=[],add=(f,s,w,d,z,h,color)=>{parts.push({f,s,w,d,z,h,color});};
    add(0,0,3.2,9,.12,.33,'#456f73');
    for(const side of [-1,1]){
      // Door on the right near the front; no solid panel across the opening.
      add(-1,side*1.55,.13,6,.45,.7,b.color||'#e0b657');add(4,side*1.55,.13,1,.45,2.5,b.color||'#e0b657');
      if(side<0){if(b.kind!=='train')add(2.6,-1.55,.12,2,.45,2.5,'#85bfc7');else add(2.6,-1.55,.12,2,.45,.7,b.color);}
      else for(const half of [-1,1])add(2.6+half*(.5+b.doors*.9),1.62,.1,1,.45,2.5,'#85bfc7');
      for(const f of [-4,-2,0,1])add(f,side*1.55,.13,.13,1.15,1.75,'#456f73');
      for(const f of [-3,-1,1]){add(f,side*.95,.7,.9,.45,.55,'#bf7957');add(f-.4,side*.95,.7,.12,1,.75,'#d9a06b');}

    }
    if(b.kind==='train'){add(0,0,1.5,2.5,3.13,.25,'#566c73');add(0,0,.14,1.6,3.38,.4,'#344c50');}
    // Framed rear window with a solid lower body and a tinted glass pane.
    add(-4.45,0,3.2,.15,.45,.7,b.color||'#e0b657');
    add(-4.45,0,3.2,.15,2.8,.15,'#456f73');
    for(const side of [-1,1])add(-4.45,side*1.51,.18,.15,1.15,1.65,'#456f73');

    add(-4.49,-.65,.9,.012,2.5,.055,'#c1e3e5');
    add(4.45,0,3.2,.15,.45,.65,b.color||'#e0b657');
    add(0,0,3.4,9.2,2.95,.18,'#f1e7c9');
    add(4.47,0,2.7,.1,2.35,.5,'#263f42');
    add(4.1,0,1.7,.16,1.85,.48,'#182f32');
    for(const side of [-1,1]){add(4.5,side*1.1,.4,.1,.6,.25,'#fff0bd');add(-4.55,side*1.1,.3,.1,.6,.3,'#c96356');add(-1,side*1.57,.05,6,1.12,.1,'#f5ebcf');}
    const shade=(color,n)=>'#'+[1,3,5].map(i=>Math.min(255,Math.round(parseInt(color.slice(i,i+2),16)*n)).toString(16).padStart(2,'0')).join('');
    const mesh=[];for(const q of parts){const c=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([f,s])=>{const p=busPoint(b,{f:q.f+f*q.d/2,s:q.s+s*q.w/2});return [p.x,p.y];});for(let i=0;i<4;i++)mesh.push({points:[[...c[i],q.z],[...c[(i+1)%4],q.z],[...c[(i+1)%4],q.z+q.h],[...c[i],q.z+q.h]],color:shade(q.color,i%2?.88:.96)});mesh.push({points:c.map(p=>[...p,q.z+q.h]),color:shade(q.color,1.04)},{points:c.map(p=>[...p,q.z]),color:shade(q.color,.65)});}
    for(const f of (b.kind==='train'?[-3.4,-2.6,2.6,3.4]:[-3,3]))for(const side of [-1,1]){
      const rings=[side*1.5,side*1.8].map(s=>Array.from({length:12},(_,i)=>{const a=i*Math.PI/6,p=busPoint(b,{f:f+Math.cos(a)*(b.kind==='train'?.3:.48),s});return [p.x,p.y,(b.kind==='train'?.34:.5)+Math.sin(a)*(b.kind==='train'?.3:.48)];}));
      for(const ring of rings)mesh.push({points:ring,color:b.kind==='train'?'#78878e':'#354847'});
      for(let i=0;i<12;i++)mesh.push({points:[rings[0][i],rings[0][(i+1)%12],rings[1][(i+1)%12],rings[1][i]],color:i<6?'#455956':'#293b3a'});
      mesh.push({points:Array.from({length:12},(_,i)=>{const a=i*Math.PI/6,p=busPoint(b,{f:f+Math.cos(a)*(b.kind==='train'?.16:.22),s:side*1.81});return [p.x,p.y,(b.kind==='train'?.34:.5)+Math.sin(a)*(b.kind==='train'?.16:.22)];}),color:b.kind==='train'?'#b7c2c6':'#a2b5af'});
    }
    mesh.push({color:'#85bfc7',opacity:.18,points:[[-1.42,1.15],[1.42,1.15],[1.42,2.8],[-1.42,2.8]].map(([s,z])=>{const p=busPoint(b,{f:-4.45,s});return [p.x,p.y,z];})});
    if(b.kind==='train')mesh.push({color:'#85bfc7',opacity:.18,points:[[1.6,1.15],[3.6,1.15],[3.6,2.85],[1.6,2.85]].map(([f,z])=>{const p=busPoint(b,{f,s:-1.55});return [p.x,p.y,z];})});
    if(b.kind==='train')for(const face of mesh)for(const p of face.points)p[2]*=b.scaleZ;
    const driver=busPoint(b,{f:3.4,s:-.8});if(b.kind!=='train'||b.coach===0)mesh.push(...animalMesh({...driver,heading:b.heading,species:'bear'},null,.45*(b.scaleZ||1),time,.5));
    for(const peer of network.players.filter(p=>p.busId===b.id&&Number.isInteger(p.busSeat))){const position=busPoint(b,busSeatPoint(peer.busSeat));mesh.push(...animalMesh({...peer,...position,heading:b.heading,seated:true,moving:false},null,.45,time,.5));}
    for(const npc of life.commuters.filter(p=>p.busId===b.id))mesh.push(...animalMesh(npc,null,npc.z,time,.5));
    if(transportFrame){
      transportFrame.mesh.push(...mesh);
      const text=b.line+' '+(b.nextStop||b.stop);let sign=busSigns.get(b.id);
      if(!sign||sign.text!==text){
        const surface=sign?.surface||document.createElement('canvas');surface.width=512;surface.height=96;
        const c=surface.getContext('2d');c.fillStyle='#263f42';c.fillRect(0,0,512,96);c.fillStyle='#fff1bb';c.font='bold 40px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,256,48,490);
        sign={text,surface};busSigns.set(b.id,sign);
      }
      transportFrame.labels.push({surface:sign.surface,points:[[1.3,2.4],[-1.3,2.4],[-1.3,2.8],[1.3,2.8]].map(([s,z])=>{const p=busPoint(b,{f:4.54,s});return [p.x,p.y,z*(b.scaleZ||1)];})});
      const heading=(b.kind==='train'?'ZUG ':'LINIE ')+b.line+'  |  '+(b.wait>0?(b.terminal?'ENDSTATION':'HALTESTELLE'):(b.nextTerminal?'NÄCHSTE: ENDSTATION':'NÄCHSTE HALTESTELLE'));
      const station=b.wait>0?b.stop:b.nextStop,key=heading+'|'+station;
      let inside=busSigns.get(b.id+'-inside');
      if(!inside||inside.text!==key){
        const surface=inside?.surface||document.createElement('canvas');surface.width=1024;surface.height=224;
        const c=surface.getContext('2d');c.fillStyle='#182f32';c.fillRect(0,0,1024,224);c.textAlign='center';c.textBaseline='middle';c.fillStyle='#9bccc5';c.font='bold 40px sans-serif';c.fillText(heading,512,54,980);c.fillStyle='#ffe499';c.font='bold 64px sans-serif';c.fillText(station,512,144,980);
        inside={text:key,surface};busSigns.set(b.id+'-inside',inside);
      }
      transportFrame.labels.push({surface:inside.surface,points:[[-.8,1.87],[.8,1.87],[.8,2.31],[-.8,2.31]].map(([s,z])=>{const p=busPoint(b,{f:4.01,s});return [p.x,p.y,z*(b.scaleZ||1)];})});
      return;
    }
    drawMesh(mesh);
    if(!busRide){const front=busPoint(b,{f:4.6,s:0}),p=point(front.x,front.y,2.62);if(p.depth>1&&p.depth<28){const size=Math.max(8,Math.min(16,scale/p.depth*.25));ctx.font='600 '+size+'px Segoe UI';ctx.textAlign='center';ctx.fillStyle='#fff1bb';ctx.fillText(b.line+' '+(b.nextStop||b.stop),p.x,p.y);}}
  }
  function carDrawing(car){
    const m=car.model,pose=!m.kind?vehicleGroundPose(Island,car):null,z=pose?pose.z:car.z||Island.heightAt(car.x,car.y),faces=[];
    const p=(side,forward,h)=>pose?point(car.x+pose.forward[0]*forward+pose.side[0]*side+pose.up[0]*h,car.y+pose.forward[1]*forward+pose.side[1]*side+pose.up[1]*h,z+pose.forward[2]*forward+pose.side[2]*side+pose.up[2]*h):point(car.x+Math.cos(car.heading)*forward-Math.sin(car.heading)*side,car.y+Math.sin(car.heading)*forward+Math.cos(car.heading)*side,z+h);
    function part(s0,s1,f0,f1,h0,h1,color,top){
      const bottom=[[s0,f0,h0],[s1,f0,h0],[s1,f1,h0],[s0,f1,h0]],upper=bottom.map(v=>[v[0],v[1],h1]);
      const polygons=bottom.map((a,i)=>[a,bottom[(i+1)%4],upper[(i+1)%4],upper[i]]);polygons.push(upper);
      polygons.forEach((vertices,i)=>{const points=vertices.map(v=>p(...v));faces.push({points,depth:points.reduce((v,a)=>v+a.depth,0)/4,color:i===4?top:color});});
    }
    if(m.kind){
      if(m.kind==='boat'){
        part(-1.3,1.3,-2.4,2,.1,.65,m.color,m.top);part(-.9,.9,-1.7,1.3,.65,.8,'#927554','#c6a278');
        part(-1,1,.5,.7,.8,1.5,'#739ea9','#bad5d9');part(-.8,.8,-1.7,-1.3,.8,1.15,'#cfb896','#ead7b5');
      }else{
        part(-.85,.85,-2.2,2.5,.4,1.5,m.color,m.top);part(-.72,.72,.6,2,1.5,2.2,'#6998aa','#abd2d7');
        part(-.22,.22,-4,-1.8,.8,1.2,m.color,m.top);part(-1.7,1.7,-3.6,-3.1,1.1,1.25,m.color,m.top);
        if(m.id==='plane'){part(-5,5,-.3,.7,.85,1,m.color,m.top);part(-.12,.12,-3.9,-3.1,1.2,2.5,m.color,m.top);}
        else{part(-1.2,-1,-2,2,.1,.23,'#506264','#7b9090');part(1,1.2,-2,2,.1,.23,'#506264','#7b9090');part(-.12,.12,-.12,.12,1.5,2.65,'#536362','#788783');}
        const spin=time*(car.parked?0:24),r=m.id==='plane'?1.1:4.4;
        for(const offset of [0,Math.PI/2]){const a=spin+offset;
          const vertices=[[-r,-.1],[r,-.1],[r,.1],[-r,.1]].map(([x,y])=>{const u=x*Math.cos(a)-y*Math.sin(a),v=x*Math.sin(a)+y*Math.cos(a);return m.id==='plane'?p(u,2.6,1.1+v):p(u,v,2.7);});faces.push({points:vertices,depth:vertices.reduce((n,q)=>n+q.depth,0)/4,color:'#526567'});
        }
      }
      if(!car.parked&&(car!==vehicles.car||vehicles.driving))part(-.45,.05,-.2,.2,.9,1.55,'#e5af6b','#f0c181');
      faces.sort((a,b)=>b.depth-a.depth).forEach(f=>polygon(f.points,f.color));return;
    }
    const w=m.width/2,l=m.length/2,close=Math.hypot(car.x-camera.x,car.y-camera.y)<(graphics.quality==='low'?25:65);
    function wheel(side,forward){
      const n=close?10:6;
      for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2;const ring=(s,r,angle)=>p(s,forward+Math.cos(angle)*r,.44+Math.sin(angle)*r);
        const points=[ring(side-.17,.38,a),ring(side+.17,.38,a),ring(side+.17,.38,b),ring(side-.17,.38,b)];faces.push({points,depth:points.reduce((v,q)=>v+q.depth,0)/4,color:i%2?'#35413f':'#414c49'});
        for(const sign of [-1,1]){const face=[p(side+sign*.175,forward,.44),ring(side+sign*.175,.37,a),ring(side+sign*.175,.37,b)];faces.push({points:face,depth:face.reduce((v,q)=>v+q.depth,0)/3,color:'#38413f'});if(close){const hub=[p(side+sign*.18,forward,.44),ring(side+sign*.18,.2,a),ring(side+sign*.18,.2,b)];faces.push({points:hub,depth:hub.reduce((v,q)=>v+q.depth,0)/3,color:i%2?'#b2bcb6':'#82928e'});}}
      }
    }
    part(-w,w,-l,l,.4,1.1,m.color,m.top);
    for(const side of [-1,1])for(const f of [-l*.64,l*.64])wheel(side*w,f);
    const rear=m.id==='pickup'?-.2:-.85,roof=m.id==='roadster'?1.65:1.95;
    part(-w*.8,w*.8,rear,.9,1.1,roof,'#678995','#a8c4c6');
    if(m.id!=='roadster')part(-w*.85,w*.85,rear-.07,.97,roof,roof+.12,m.color,m.top);
    if(close){
      part(-w*.94,w*.94,-l-.06,-l,.34,.51,'#788985','#bcc7bf');part(-w*.94,w*.94,l,l+.06,.34,.51,'#788985','#bcc7bf');
      part(-.34,.34,-l-.075,-l-.065,.55,.79,'#f0ebd9','#f0ebd9');
      for(const side of [-1,1]){part(side*w-.07,side*w+.07,-.2,.13,1,1.06,'#dce3d8','#dce3d8');part(side*(w+.16)-.12,side*(w+.16)+.12,.55,.85,1.25,1.44,m.color,m.top);part(side*(w+.16)-.1,side*(w+.16)+.1,.54,.55,1.28,1.41,'#bfd9de','#bfd9de');}
      for(let i=0;i<4;i++)part(-.48,.48,l+.015,l+.025,.6+i*.08,.63+i*.08,'#465754','#465754');
    }
    if(m.id==='pickup')part(-w*.8,w*.8,-l+.12,-.35,1.11,1.16,'#586a57','#586a57');
    for(const side of [-1,1]){
      part(side*w*.7-.18,side*w*.7+.18,-l-.02,-l,.62,.9,'#cd6254','#cd6254');
      part(side*w*.7-.18,side*w*.7+.18,l,l+.02,.62,.9,'#f5e2ac','#f5e2ac');
    }
    if(car!==vehicles.car&&!car.parked||car===vehicles.car&&vehicles.driving){part(-.5,-.14,rear-.02,rear-.01,1.28,1.63,'#e4ab64','#e4ab64');part(-.51,-.43,rear-.04,rear+.07,1.62,1.79,'#e4ab64','#e4ab64');part(-.21,-.13,rear-.04,rear+.07,1.62,1.79,'#e4ab64','#e4ab64');if(car===vehicles.car&&activities.passenger)part(.14,.5,rear-.02,rear-.01,1.28,1.63,'#d69ba7','#d69ba7');}
    const owner=car.owner||(car===vehicles.car?network.id:null);if(owner&&(network.rideOwner===owner||network.players.some(p=>p.riding===owner))){part(.14,.5,rear-.03,rear+.05,1.28,1.63,'#d9b88e','#d9b88e');part(.14,.23,rear-.03,rear+.05,1.62,1.82,'#d9b88e','#d9b88e');part(.41,.5,rear-.03,rear+.05,1.62,1.82,'#d9b88e','#d9b88e');}
    faces.sort((a,b)=>b.depth-a.depth).forEach(f=>polygon(f.points,f.color));
  }
  function boothDrawing(b){
    box(b.x,b.y,1.3,1.3,2.7,'#509789','#bdded4');
    const y=b.y+.66;
    polygon([point(b.x-.48,y,.5),point(b.x+.48,y,.5),point(b.x+.48,y,2.3),point(b.x-.48,y,2.3)],'#bdded4');
    polygon([point(b.x-.15,y,.95),point(b.x+.15,y,.95),point(b.x+.15,y,1.85),point(b.x-.15,y,1.85)],'#426b63');
  }
  function activityObjects(){
    const objects=[];
    const post=Island.depot;if(visible(post.x,post.y))objects.push({depth:-point(post.x,post.y).depth,draw:()=>{scenery('parcel',{x:post.x-1,y:post.y});scenery('parcel',{x:post.x-1.8,y:post.y-.2,size:.7});}});
    if(job.active&&!vehicles.driving)objects.push({depth:-point(mauz.x,mauz.y).depth-.2,draw:()=>scenery('parcel',{x:mauz.x+Math.cos(mauz.heading)*.6,y:mauz.y+Math.sin(mauz.heading)*.6,z:1+(mauz.jump||0),heading:mauz.heading,size:.6})});
    for(const station of Island.jobs){
      if(station.venue&&activities.active?.id!==station.id)continue;
      if(!station.venue&&visible(station.x,station.y))objects.push({depth:-point(station.x,station.y).depth,draw:()=>{cat({...station,species:(station.type||station.id)==='fishing'?'bear':'rabbit',heading:Math.PI/2,waving:true});if((station.type||station.id)==='clean')for(let n=0;n<3;n++)box(station.x-3+n*1.5,station.y-2,1,1,1.3,['#7095b5','#76a17b','#b69760'][n],'#d0d8ba');}});
      if(station.kind==='hold')station.points.forEach((p,i)=>{
        if(!visible(p.x,p.y))return;
        const done=activities.active?.id===station.id&&activities.done.has(i);
        objects.push({depth:-point(p.x,p.y).depth,draw:()=>{
          if(station.id==='fire-rescue'){if(!done){scenery('ball',{x:p.x,y:p.y,z:.3,size:1.5+Math.sin(time*13)*.15,color:'#e97b46'});scenery('ball',{x:p.x,y:p.y,z:.15,size:.9,color:'#f5ce67'});}}else if((station.type||station.id)==='garden'){
            drawMesh(sceneryMesh('garden-bed',p,Island.heightAt(p.x,p.y),{lit:done,detail:graphics.quality!=='low'}));
          }else if((station.type||station.id)==='fishing'){groundRect(p.x,p.y,1.5,2,'#ba9974');const fishing=activities.active?.id===station.id&&(activities.progress>0||activities.challenge);scenery('rod',p);const q=point(p.x+.7,p.y,1.7);if(fishing){const bob=point(p.x-1,p.y,.1+Math.abs(Math.sin(time*7))*.2);ctx.strokeStyle='#dbe9dc';ctx.beginPath();ctx.moveTo(q.x+12,q.y);ctx.lineTo(bob.x,bob.y);ctx.stroke();scenery('ball',{x:p.x-1,y:p.y,z:Math.abs(Math.sin(time*7))*.2,size:.2,color:'#e6ad61'});}}else if((station.type||station.id)==='repair'){carDrawing({...p,y:p.y-2.5,heading:0,model:VehicleModels[i%3],parked:true,speed:0});scenery('toolbox',{x:p.x,y:p.y-1.4});}else box(p.x,p.y,1.7,1.4,1,done?'#7aa480':(station.type||station.id)==='electric'?'#668aa3':'#83929c',done?'#b7cfac':'#b4bfc3');
        }});
      });
    }
    const active=activities.active;
    if(activities.carrying!==null)objects.push({depth:-point(mauz.x,mauz.y).depth-.1,draw:()=>scenery('ball',{x:mauz.x+Math.cos(mauz.heading)*.7,y:mauz.y+Math.sin(mauz.heading)*.7,z:1,size:.55,color:'#a6b1a0'})});
    if(active?.kind==='collect')active.points.forEach((p,i)=>{if(!activities.done.has(i)&&activities.carrying!==i&&visible(p.x,p.y))objects.push({depth:-point(p.x,p.y).depth,draw:()=>{if((active.type||active.id)==='orchard'){scenery('fruit',p);}else if((active.type||active.id)==='trail')box(p.x,p.y,.3,.3,1.5,'#bc994f','#e8d6a0');else box(p.x,p.y,.5,.6,.4,'#9a826f','#cbbfab');}});});
    if(active?.kind==='taxi'&&!activities.passenger){const p=active.points[0];if(visible(p.x,p.y))objects.push({depth:-point(p.x,p.y).depth,draw:()=>cat({...p,species:'rabbit',heading:0,waving:true})});}
    return objects;
  }
  let indoorRenderer;
  function nearBed(){const l=homePlan();return !!l&&Math.abs(mauz.x-l.bed.x)<3.3*l.sx&&Math.abs(mauz.y-l.bed.y)<3.5*l.sy;}
  function sleepInBed(){
    if(mode!=='playing'||!nearBed()||!ownsHome(interior.id))return false;
    if(!dayCycle.night){notify('Schlafen geht nachts von 20:00 bis 06:00 Uhr.');return false;}
    if(onlineMode){sleeping={online:true,elapsed:0};setMode('sleeping');const screen=document.querySelector('#sleep-screen');screen.hidden=false;if(screen.style)screen.style.opacity='1';document.querySelector('#sleep-message').textContent='Warte auf die anderen Spieler ...';document.querySelector('#sleep-cancel').hidden=false;network.sleep(true);return true;}
    document.querySelector('#sleep-cancel').hidden=true;document.querySelector('#sleep-message').textContent='Schlafen bis 07:00 Uhr ...';
    sleeping={elapsed:0,woke:false};setMode('sleeping');document.querySelector('#sleep-screen').hidden=false;return true;
  }
  function advanceSleep(dt){
    if(!sleeping||sleeping.online)return;sleeping.elapsed+=dt;
    const screen=document.querySelector('#sleep-screen');if(screen.style)screen.style.opacity=String(Math.min(1,sleeping.elapsed/.6,(2.4-sleeping.elapsed)/.6));
    if(sleeping.elapsed>=1&&!sleeping.woke){dayCycle.sleep();sleeping.woke=true;}
    if(sleeping.elapsed>=2.4){sleeping=null;screen.hidden=true;setMode('playing');notify('Guten Morgen! Es ist 07:00 Uhr.');}
  }
  function drawInterior(){
    resolveIndoorCamera();
    indoorRenderer ||= createIndoorRenderer({lowDetail:touchDevice});
    const floors=[{x:0,y:0,w:24,d:24,color:'#c7ac86'},
      {x:0,y:0,w:24,d:24,z:3.3,color:'#eee9dc'},
      {x:-7,y:6,w:10,d:12,color:'#d8b88f'},{x:-7,y:-6,w:10,d:12,color:'#cfb08e'},
      {x:7,y:6,w:10,d:12,color:'#e2ddc7'},{x:7,y:-6,w:10,d:12,color:'#b9d3cd'}];
    for(let x=2;x<12;x++)for(let y=-12;y<12;y++)if((x+y)%2===0)floors.push({x:x+.5,y:y+.5,w:.96,d:.96,z:.01,color:y<0?'#cee1d9':'#f0ead9'});
    for(let y=-11;y<12;y+=.7)floors.push({x:-7,y,w:9.8,d:.025,z:.01,color:'#b69975'});
    floors.push({x:-8,y:5,w:5,d:4,z:.02,color:'#b7c6ad'},{x:0,y:9,w:2,d:2,z:.02,color:'#77958b'});
    if(!interior.public){const l=homePlan();for(let i=0;i<floors.length;i++){floors[i]=l.transform(floors[i]);if(i===1)floors[i].z=l.height;if(i===0)floors[i].color=l.colors[1];}}
    if(interior.public){floors.length=0;floors.push({x:0,y:0,w:24,d:24,color:interior.lobby?interior.floorColor:interior.floor},{x:0,y:0,w:24,d:24,z:3.3,color:'#eee9dc'});}
    const boxes=[...indoorFurniture(),...indoorWalls().map(b=>({...b,h:homePlan()?.height||3.3,color:homePlan()?.colors[0]||'#e5dfce',top:'#f3eddc'}))];
    if(interior.lobby&&!stairMeshes.has(interior.floors))stairMeshes.set(interior.floors,staircaseGeometry(interior.floors));
    const stairs=interior.lobby?stairMeshes.get(interior.floors):null;
    if(stairs){floors.length=0;floors.push({x:0,y:0,w:24,d:24,z:interior.floors*4-.3,color:'#eee9dc'});boxes.length=0;boxes.push(...stairs.boxes.filter(b=>(b.z||0)+b.h>=(mauz.elevation||0)-4&&(b.z||0)<=(mauz.elevation||0)+6),...indoorWalls().map(b=>({...b,h:interior.floors*4,color:'#e5dfce'})));}
    if(!interior.public){const l=homePlan();
      for(const x of [-10.8,10.8]){
        const frame=l.transform({x,y:-5,w:.12,d:2.3,h:1.35,z:1.45,color:'#a27854'});boxes.push(frame,{...frame,x:frame.x-Math.sign(frame.x)*.08,d:frame.d*.8,h:1.1,z:1.56,color:'#94b9b4'});
      }
      for(const b of indoorWalls())boxes.push({...b,w:b.w+.035,d:b.d+.035,h:.12,z:0,color:'#bca082'});
      for(const x of [-7,7]){const light=l.transform({x,y:2,w:1.1,d:1.1,h:.09,z:l.height-.12,color:'#f4ddb0'});boxes.push(light);}
      const kitchen=l.transform({x:9,y:10.8,w:4.8,d:1.35,h:.055,z:1.21,color:'#eff0e3'});boxes.push(kitchen);
    }
    const meshActors=[...peers(),...(cameraDistance>1.8?[mauz]:[]),...(interior.public&&!interior.lobby?[{x:0,y:-6.5,heading:Math.PI/2,species:interior.id==='hospital'?'rabbit':'bear',outfit:interior.id==='police'?'police':interior.id==='fire'?'fire':null}]:[])];
    ctx.clearRect(0,0,width,height);
    indoorRenderer.render({width,height,scale,cx,cy,point,boxes,floors,sprite:canvas,catDepth:1,composite:false,mesh:[...(stairs?.mesh.filter(f=>f.points.some(p=>p[2]>=(mauz.elevation||0)-4&&p[2]<=(mauz.elevation||0)+6))||[]),...meshActors.flatMap(animalFaces)]});
    ctx.clearRect(0,0,width,height);ctx.drawImage(indoorRenderer.surface,0,0,width,height);
    if(interior.public&&!interior.lobby&&Math.hypot(mauz.x,mauz.y+3)<6)marker({x:0,y:-5},interior.id==='clothes'?'Kleiderkasse':'Empfang','#8a689b');
    if((!interior.lobby||interior.floor===0)&&Math.hypot(mauz.x-exitPoint().x,mauz.y-exitPoint().y)<4)marker(exitPoint(),'Ausgang','#658e7e');

  }
  function drawLandscapeDetails(){
    const rich=['detailed','ultra'].includes(graphics.realism);if(!rich)return;
    ctx.save();
    if(graphics.water){
      ctx.globalAlpha=.25;const baseX=Math.floor(camera.x/8)*8,baseY=Math.floor(camera.y/8)*8;
      for(let ix=-10;ix<=10;ix++)for(let iy=-10;iy<=10;iy++){
        const x=baseX+ix*8,y=baseY+iy*8;
        if(!visible(x,y)||(!Island.inSea(x,y)&&!Island.inPond(x,y,-3))||Island.inDock(x,y)||Island.onBridge(x,y))continue;
        const shift=Math.sin(time*1.7+ix+iy)*.7;
        polygon([point(x-1.5,y+shift,-.05),point(x+1.5,y+shift,-.05),point(x+1.2,y+shift+.15,-.05),point(x-1.2,y+shift+.15,-.05)],'#e5f9ed');
      }
    }
    if(graphics.shadows){
      ctx.globalAlpha=.14*(1-dayCycle.darkness);const direction=dayCycle.minutes/1440*Math.PI*2,dx=Math.cos(direction)*1.8,dy=Math.sin(direction)*1.8;
      for(const t of treeIndex.near(camera.x,camera.y,65))if(visible(t.x,t.y)&&!damage.get('tree',t.damageId))groundOval(t.x+dx,t.y+dy,1.4*t.size,1.1*t.size,'#304d40');
      for(const b of Island.buildings)if(Math.hypot(b.x-camera.x,b.y-camera.y)<90){const x=b.x,y=b.y,w=b.w/2,d=b.d/2;polygon([[x-w,y-d],[x+w,y-d],[x+w+dx*3,y+d+dy*3],[x-w+dx*3,y+d+dy*3]].map(q=>point(...q)), '#304d40');}
    }
    ctx.restore();
  }
  function draw(){
    renderedFrames++;
    if(interior){drawInterior();ctx.fillStyle=`rgba(20,26,57,${dayCycle.darkness*.16})`;ctx.fillRect(0,0,width,height);return;}
    resolveOutdoorCamera();
    transportFrame=transit().some(b=>visible(b.x,b.y)||busRide?.id===b.id)||Island.busStops.some(b=>visible(b.x,b.y))||Island.railLines.length?{mesh:[],occluders:[],labels:[]}:null;
    ctx.clearRect(0,0,width,height);const sky=ctx.createLinearGradient(0,0,0,height);
    sky.addColorStop(0,'#a3d5e8');sky.addColorStop(1,'#e5f1e9');ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
    const horizon=cy-scale*Math.tan(pitch);
    if(graphics.realism==='ultra'){
      // Project a distant celestial body through the same camera as the world.
      const angle=(dayCycle.minutes-360)/720*Math.PI,altitude=Math.sin(angle);
      if(altitude>0){
        const distance=20000,sunPoint=point(camera.x+Math.cos(angle)*distance,camera.y+distance*.3,altitude*distance);
        if(sunPoint.depth>.5){
          const radius=Math.min(110,Math.max(12,scale*900/sunPoint.depth));
          const sun=ctx.createRadialGradient(sunPoint.x,sunPoint.y,0,sunPoint.x,sunPoint.y,radius);
          sun.addColorStop(0,'#fffbe2');sun.addColorStop(.2,'#fff1b8');sun.addColorStop(.28,'#ffe5a180');sun.addColorStop(1,'#ffe5a100');
          ctx.save();ctx.fillStyle=sun;ctx.fillRect(sunPoint.x-radius,sunPoint.y-radius,radius*2,radius*2);ctx.restore();
        }
      }
    }
    ctx.fillStyle='#9bd0d5';ctx.fillRect(0,horizon,width,height-horizon);
    groundOval(0,0,Island.radius+5,Island.radius+5,'#b3dcd9');
    groundOval(0,0,Island.radius+1,Island.radius+1,'#e8dab0');
    groundOval(0,0,Island.radius-5,Island.radius-5,'#a7c875');
    const land=Island.continent;groundOval(land.x,land.y,land.radius+1,land.radius+1,'#e8dab0');groundOval(land.x,land.y,land.radius-5,land.radius-5,'#a7c875');groundRect(-565,60,140,170,'#a7c875');
    const luxury=Island.luxury;groundOval(luxury.x,luxury.y,luxury.radius+1,luxury.radius+1,'#e8dab0');groundOval(luxury.x,luxury.y,luxury.radius-5,luxury.radius-5,'#a7c875');
    for(const dock of Island.docks){groundRect(dock.x,dock.y,dock.w,dock.d,'#b58d64');for(let x=dock.x-dock.w/2;x<dock.x+dock.w/2;x++)groundRect(x,dock.y,.05,dock.d,'#957453');}
    for(const a of Island.airfields){groundRect(a.x,a.y,a.w,a.d,'#728589');for(let y=a.y-a.d/2+4;y<a.y+a.d/2;y+=8)groundRect(a.x,y,.3,4,'#f0edda');}
    drawBorder();
    groundRect(Island.bridge.x,Island.bridge.y,Island.bridge.w,Island.bridge.d,'#b9bca9');
    const nearbyRoads=Island.roads.filter(r=>Math.abs(r.x-camera.x)<r.w/2+200&&Math.abs(r.y-camera.y)<r.d/2+200);
    for(const r of nearbyRoads)groundRect(r.x,r.y,r.w+1.3,r.d+1.3,'#d2cfba');
    for(const r of nearbyRoads)groundRect(r.x,r.y,r.w,r.d,r.w===3||r.d===3?'#e1d0a8':'#85928f');
    for(const r of nearbyRoads){
      if(r.w===3||r.d===3)continue;
      const vertical=r.d>r.w,length=vertical?r.d:r.w;
      for(let n=Math.max(-length/2+2,Math.floor(((vertical?camera.y-r.y:camera.x-r.x)-180)/6)*6);n<Math.min(length/2,(vertical?camera.y-r.y:camera.x-r.x)+180);n+=6)groundRect(r.x+(vertical?0:n),r.y+(vertical?n:0),vertical?.13:2,vertical?2:.13,'#e5e5ce');
    }
    drawRailway();
    groundOval(0,0,5.5,5.5,'#e9ddbd');
    const bridge=Island.bridge;
    for(const side of [-1,1]){
      const y=bridge.y+side*(bridge.d/2-.25);
      box(bridge.x,y,bridge.w,.35,.55,'#899b9c','#b7c5bf');
      for(let x=bridge.x-bridge.w/2+2;x<bridge.x+bridge.w/2;x+=7)box(x,y,.4,.4,1.35,'#64858a','#a7bdba');
      box(bridge.x,y,bridge.w,.16,1.35,'#6f9093','#b1c9c3');
    }
    groundRect(Island.depot.x,Island.depot.y,4,3,'#efcc7f');
    const pond=Island.pond;
    groundOval(pond.x,pond.y,pond.rx+1,pond.ry+1,'#d9d4a7');
    groundOval(pond.x,pond.y,pond.rx,pond.ry,'#79bdc5');
    drawLandscapeDetails();
    groundRect(0,Island.radius-7,3,12,'#b58d64');
    for(let y=Island.radius-13;y<Island.radius-1;y+=.75)groundRect(0,y,3,.05,'#957453');
    for(const stop of Island.busStops){if(visible(stop.x,stop.y)){groundRect(stop.x,stop.y,Math.abs(Math.cos(stop.heading))*8+Math.abs(Math.sin(stop.heading))*4,Math.abs(Math.sin(stop.heading))*8+Math.abs(Math.cos(stop.heading))*4,'#d3ccb5');scenery('busstop',stop);if(Math.hypot(mauz.x-stop.x,mauz.y-stop.y)<30)marker(stop,'H '+stop.lines.join(' / ')+' - '+stop.name,'#5a9580');}}
    if(graphics.vegetation)for(const g of grassIndex.near(camera.x,camera.y,graphics.realism==='simple'?25:['detailed','ultra'].includes(graphics.realism)?85:45)){if((['detailed','ultra'].includes(graphics.realism)||g.color>(graphics.realism==='simple'?.85:.66))&&visible(g.x,g.y,20))scenery(g.color>.96?'flower':'grass',g.renderItem||(g.renderItem={x:g.x,y:g.y,size:1}));}
    if(graphics.glow&&graphics.realism!=='simple'&&dayCycle.darkness>.05){ctx.save();ctx.globalAlpha=dayCycle.darkness*.28;for(const l of lampIndex.near(camera.x,camera.y,90))if(!damage.get('lamp',l.damageId)&&visible(l.x,l.y))groundOval(l.x,l.y,4,4,'#fff2ac');ctx.restore();}
    if(destination){const p=point(destination.x,destination.y);ctx.strokeStyle='#ffffffe0';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y,9,4.5,0,0,Math.PI*2);ctx.stroke();}
    const objects=[...lampIndex.near(camera.x,camera.y,130).filter(l=>visible(l.x,l.y)).map(l=>({depth:-point(l.x,l.y).depth,draw:()=>scenery('lamp',l)})),...motes.filter(p=>graphics.particles&&visible(p.x,p.y)).map(p=>({depth:-point(p.x,p.y,p.z).depth,draw:()=>scenery('ball',{...p,size:p.big?.8:.15})})),...mountain(),...terrainObjects(),...cloudObjects(),...activityObjects(),...Island.booths.filter(b=>visible(b.x,b.y)).map(b=>({depth:-point(b.x,b.y).depth,draw:()=>boothDrawing(b)})),...(vehicles.car?[{depth:-point(vehicles.car.x,vehicles.car.y).depth,draw:()=>carDrawing(vehicles.car)}]:[]),...Island.buildings.filter(b=>buildingVisible(b)).map(b=>({depth:-point(b.x,b.y).depth,draw:()=>house(b)})),...balls.filter(b=>visible(b.x,b.y)).map(b=>({depth:-point(b.x,b.y).depth,draw:()=>scenery('ball',b)})),...treeIndex.near(camera.x,camera.y,graphics.distance).filter(t=>visible(t.x,t.y)&&!terrainOccludes(t.x,t.y,t.size*4)).map(t=>({depth:-point(t.x,t.y).depth,draw:()=>tree(t)})),...stones.filter(t=>visible(t.x,t.y)&&!terrainOccludes(t.x,t.y,1)).map(t=>({depth:-point(t.x,t.y).depth,draw:()=>scenery('stone',t)})),{depth:-point(mauz.x,mauz.y).depth,draw:()=>{if(Island.heightAt(mauz.x,mauz.y)===0)cat();}}];objects.push(...detailIndex.near(camera.x,camera.y,90).filter(p=>visible(p.x,p.y)).map(p=>({depth:-point(p.x,p.y).depth,draw:()=>scenery(p.kind,p)})));objects.push(...transit().filter(b=>visible(b.x,b.y)||busRide?.id===b.id).map(b=>({depth:-point(b.x,b.y).depth,draw:()=>busDrawing(b)})));objects.push(...[...life.walkers,...life.commuters.filter(p=>!p.busId)].filter(p=>Math.hypot(p.x-mauz.x,p.y-mauz.y)<75&&remoteVisible(p)).map(p=>({depth:-point(p.x,p.y).depth,draw:()=>cat(p)})),...life.cars.filter(p=>visible(p.x,p.y)).map(p=>({depth:-point(p.x,p.y).depth,draw:()=>carDrawing(p)})));objects.push(...network.players.filter(p=>onlineMode&&p.vehicle&&visible(p.vehicle.x,p.vehicle.y)).map(p=>({depth:-point(p.vehicle.x,p.vehicle.y).depth,draw:()=>{const model=VehicleModels.find(m=>m.id===p.vehicle.model);if(model)carDrawing({...p.vehicle,model,owner:p.id,parked:!p.car});}})));objects.push(...peers().filter(p=>!(p.busId&&Number.isInteger(p.busSeat))&&remoteVisible(p)).map(p=>({depth:-point(p.x,p.y).depth,draw:()=>remoteDrawing(p)})));objects.sort((a,b)=>a.depth-b.depth).forEach(o=>o.draw());
    if(Island.heightAt(mauz.x,mauz.y)>0)cat();
    if(transportFrame?.mesh.length){
      transportRenderer ||= createIndoorRenderer({transparent:true,lowDetail:touchDevice});
      transportRenderer.render({width,height,scale,cx,cy,point,boxes:[],floors:[],sprite:canvas,mesh:transportFrame.mesh,labels:transportFrame.labels,occluders:transportFrame.occluders,composite:false,farDistance:3000});
      ctx.drawImage(transportRenderer.surface,0,0,width,height);
    }
    transportFrame=null;
    drawNight();
    if(busRide)return;
    const nav=navigationTarget();marker(nav,plannedRoute?'Routenziel':job.active?'Lieferziel':activities.active?'Jobziel':nav.name,'#dca257');
    for(const v of Island.venues)if(Math.hypot(mauz.x-v.x,mauz.y-v.y)<60)marker(v,v.name,'#8a689b');
    for(const h of Island.homes.filter(h=>h.id===h.buildingId))if(Math.hypot(mauz.x-h.x,mauz.y-h.y)<40)marker(h,ownsHome(h.id)?'Dein Haus':h.name+' - '+h.price+' Münzen',ownsHome(h.id)?'#528660':'#c6a354');
    for(const b of Island.booths)if(Math.hypot(mauz.x-b.x,mauz.y-b.y)<28)marker(b,'Telefonzelle','#509789');

  }
  function drawNight(){
    const dark=dayCycle.darkness;if(dark<=0)return;
    ctx.fillStyle=`rgba(13,22,59,${dark*.62})`;ctx.fillRect(0,0,width,height);
    if(!graphics.glow)return;
    const eye={x:camera.x-Math.cos(camera.heading)*cameraDistance,y:camera.y-Math.sin(camera.heading)*cameraDistance,z:camera.z+cameraHeight};
    for(const l of lampIndex.near(camera.x,camera.y,130)){
      if(damage.get('lamp',l.damageId))continue;
      const p=point(l.x,l.y,4.8);if(p.depth<.5||p.x<0||p.x>width||p.y<0||p.y>height||outdoorHit(eye,{x:l.x,y:l.y,z:4.8})<.999)continue;
      const r=Math.max(3,Math.min(28,scale/p.depth*.55)),glow=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);
      glow.addColorStop(0,`rgba(255,239,166,${dark*.9})`);glow.addColorStop(1,'rgba(255,224,124,0)');ctx.fillStyle=glow;ctx.fillRect(p.x-r,p.y-r,r*2,r*2);
    }
  }
  function step(dt){
    cloudDrift+=dt*graphics.wind*1.5;
    uiElapsed+=dt;
    if(!onlineMode)dayCycle.tick(dt);city.tick(dt);
    if(!onlineMode)damage.tick(dt);if(!interior&&!onlineMode)life.tick(dt,mauz,vehicles.car);
    carryBus();
    time+=dt;celebration=Math.max(0,celebration-dt);
    for(let i=motes.length-1;i>=0;i--){const p=motes[i];p.life-=dt;p.z+=p.vz*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vz-=3*dt;if(p.life<=0)motes.splice(i,1);}
    if(!interior&&activities.progress>0&&Math.random()<dt*22){const p=activities.target(mauz);motes.push({x:p.x,y:p.y,z:1,vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2,vz:2,life:.6,color:(activities.active.type||activities.active.id)==='garden'?'#80cddd':'#efcf70'});}

    const forward=Math.max(-1,Math.min(1,Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'))-stick.y));
    const turn=Math.max(-1,Math.min(1,Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'))+stick.x))*graphics.steering;
    if(forward||turn)destination=null;
    if(onlineMode&&network.rideOwner){const ride=network.players.find(p=>p.id===network.rideOwner)?.vehicle;if(ride){mauz.x=ride.x;mauz.y=ride.y;mauz.heading=ride.heading;mauz.jump=0;mauz.moving=false;}}else if(vehicles.driving){vehicles.step(dt,forward,turn,keys.has(' '),mauz,(keys.has('q')?1:0)-(keys.has('r')?1:0));destination=null;}else{
    mauz.heading+=turn*2.4*dt;
    let vx=Math.cos(mauz.heading)*forward,vy=Math.sin(mauz.heading)*forward;
    if(destination){
      vx=destination.x-mauz.x;vy=destination.y-mauz.y;
      if(Math.hypot(vx,vy)<.12){destination=null;vx=vy=0;}
      else mauz.heading=Math.atan2(vy,vx);
    }
    const length=Math.hypot(vx,vy);mauz.moving=false;
    if(length&&!mauz.seated){
      const distance=Math.min((Island.inSea(mauz.x,mauz.y)?2.5:keys.has('shift')?8:4.5)*city.speed*dt*(destination?1:Math.min(1,length)),destination?length:Infinity);
      const nx=mauz.x+vx/length*distance;
      const ny=mauz.y+vy/length*distance;
      if(walkable(nx,ny)){
        if(interior?.lobby){mauz.elevation=stairSurface(nx,ny,mauz.elevation||0,interior.floors);interior.floor=Math.round(mauz.elevation/4);interior.name='Treppenhaus - '+(interior.floor?interior.floor+'. Etage':'Erdgeschoss');}
        mauz.moving=Math.hypot(nx-mauz.x,ny-mauz.y)>.0001;mauz.x=nx;mauz.y=ny;
      }else destination=null;
    }
    updateBusRide();
    announceBus();
    if(!mauz.seated)verticalStep(dt);
    }
    if(!interior&&adventure.tick(dt,Island.inSea(mauz.x,mauz.y)&&!vehicles.driving&&!network.rideOwner)){const home=Island.homes.find(h=>h.id===(job.homeId)&&ownsHome(h.id));moveToDoor(home?.x||0,home?.y||0,-Math.PI/2);notify('Luft ausgegangen! Du bist sicher an Land wieder aufgewacht.');}
    if(interior){follow(dt);if(toastTime>0){toastTime-=dt;if(toastTime<=0)toast.hidden=true;}updateJobUI(true);return;}
    mauz.working=activities.progress>0;
    const activityResult=activities.tick(dt,mauz,vehicles.driving,keys.has('e'));if(activityResult)notify(activityResult.message);
    for(const ball of balls){
      const dx=ball.x-mauz.x,dy=ball.y-mauz.y,distance=Math.hypot(dx,dy);
      if(distance<.95&&mauz.moving){ball.vx=(distance>.01?dx/distance:Math.cos(mauz.heading))*7;ball.vy=(distance>.01?dy/distance:Math.sin(mauz.heading))*7;}
      const nx=ball.x+ball.vx*dt,ny=ball.y+ball.vy*dt;
      if(walkable(nx,ny)){ball.x=nx;ball.y=ny;}else{ball.vx*=-.6;ball.vy*=-.6;}
      ball.vx*=Math.exp(-2*dt);ball.vy*=Math.exp(-2*dt);
    }
    follow(dt);
    if(toastTime>0){toastTime-=dt;if(toastTime<=0)toast.hidden=true;}
    updateJobUI(true);
  }

  function nearest(list){return list.reduce((a,b)=>Math.hypot(a.x-mauz.x,a.y-mauz.y)<Math.hypot(b.x-mauz.x,b.y-mauz.y)?a:b);}
  function navigationTarget(){if(plannedRoute)return {...plannedRoute.target,name:'Dein Routenziel'};return job.active?job.target():activities.active?activities.target(mauz):nearest([{...Island.depot,name:'Paketpost'},...Island.jobs]);}
  function contextAction(){
    if(busRide)return busSeatAction();
    if(network.rideOwner)return null;
    if(interior?.lobby)return lobbyAction();
    if(interior?.public&&Math.hypot(mauz.x,mauz.y+3)<2.5)return {type:'service',label:interior.id==='clothes'?'E - Kleidung kaufen / anziehen':'E - Am Empfang sprechen'};
    if(nearBed())return {type:'sleep',label:dayCycle.night?(touchDevice?'Bis 07:00 schlafen':'E - Bis 07:00 schlafen'):'Bett - Schlafen ab 20:00'};
    if(interior)return Math.hypot(mauz.x-exitPoint().x,mauz.y-exitPoint().y)<2?{type:'exit',label:'E - Haus verlassen'}:null;
    const candidates=[];
    if(!vehicles.driving)for(const stop of Island.railStations)candidates.push({type:'bus-plan',target:{...stop,stop},label:'E - Bahnfahrplan ansehen',range:5});
    if(!vehicles.driving)for(const stop of Island.busStops){const c=Math.cos(stop.heading),s=Math.sin(stop.heading);candidates.push({type:'bus-plan',target:{x:stop.x-1.4*c-2*s,y:stop.y-1.4*s+2*c,stop},label:'E - Fahrplan ansehen',range:2.8});}
    if(!vehicles.driving)for(const v of Island.venues)candidates.push({target:v,type:'venue',label:'E - '+v.name+' betreten'});
    if(!vehicles.driving)for(const house of Island.homes.filter(h=>h.id===h.buildingId))candidates.push({target:house,type:'home',label:ownsHome(house.id)?'E - Mein Haus':'E - Haus ansehen ('+house.price+' Münzen)'});
    if(!vehicles.driving)for(const booth of Island.booths)candidates.push({target:booth,type:'phone',label:'E · Auto anrufen'});
    if(job.active)candidates.push({target:job.target(),type:'delivery',label:vehicles.driving?'F · Zum Abgeben aussteigen':'E · Paket abgeben'});
    else if(activities.active){
      const a=activities.active,finished=activities.done.size===a.points.length;
      let label=a.kind==='taxi'?(activities.passenger?'E · Fahrgast aussteigen lassen':'E · Fahrgast einsteigen lassen'):finished?(a.venue?'E - Zurueck zum Empfang':'E · Lohn abholen'):activities.challenge?.kind==='choice'?'Aktion waehlen ? 1 / 2 / 3':activities.carrying!==null?'E ? Abfall sortieren':activities.challenge?'E - Jetzt treffen!':a.kind==='hold'?'E halten · '+a.action+' '+Math.round(activities.progress/a.seconds*100)+'%':'E · '+a.action;
      if(vehicles.driving&&a.kind!=='taxi')label='F · Zum Arbeiten aussteigen';
      if(!(finished&&a.venue))candidates.push({target:activities.target(mauz),type:'activity',label,range:a.kind==='taxi'?4:2.6});
    }else{
      if(!vehicles.driving){candidates.push({target:Island.depot,type:'delivery',label:'E · Paketdienst ('+job.reward+' Münzen)'});for(const spec of Island.jobs.filter(j=>!j.venue))candidates.push({target:spec,type:'start',label:'E · '+spec.name+' ('+spec.reward+' Münzen)'});}
    }
    return candidates.filter(a=>Math.hypot(a.target.x-mauz.x,a.target.y-mauz.y)<=(a.range||2.6)).sort((a,b)=>(Number(b.type==='delivery'&&job.active)-Number(a.type==='delivery'&&job.active))||Math.hypot(a.target.x-mauz.x,a.target.y-mauz.y)-Math.hypot(b.target.x-mauz.x,b.target.y-mauz.y))[0];
  }
  let uiElapsed=0;
  function updateJobUI(throttled=false){
    if(throttled&&!activities.challenge&&uiElapsed<.1)return;uiElapsed=0;
    const ridingBus=busRide&&transit().find(b=>b.id===busRide.id);
    const water=document.querySelector('#water-status');water.hidden=!!interior||!adventure.wet||mode!=='playing';water.textContent='Luft: '+Math.ceil(adventure.air)+' s - Zurueck ans Ufer!';
    document.querySelector('#mini-open').disabled=!!interior;
    document.querySelector('#world-clock').textContent=dayCycle.label;
    document.querySelector('#world-period').textContent=(dayCycle.night?'Nacht':'Tag')+' '+dayCycle.day;
    drawMiniMap();
    const skill=document.querySelector('#skill-game'),challenge=activities.challenge;
    skill.hidden=mode!=='playing'||interior||!challenge;
    document.querySelector('#skill-choices').hidden=challenge?.kind!=='choice';
    document.querySelector('#skill-track').hidden=challenge?.kind==='choice';
    if(challenge){
      const choice=challenge.kind==='choice';document.querySelector('#skill-title').textContent=choice?challenge.prompt+(challenge.sequence?' ? '+challenge.hits+'/3':''):((activities.active.type||activities.active.id)==='fishing'?'Anbiss ? Einholen ? Kescher':'Praezise arbeiten')+' ? '+challenge.hits+'/'+challenge.required;
      document.querySelector('#skill-help').textContent=choice?'1 / 2 / 3 oder eine Aktion antippen':'Im gruenen Bereich: E oder Aktion antippen';
      if(choice)document.querySelectorAll('[data-work-choice]').forEach(b=>{b.textContent=(Number(b.dataset.workChoice)+1)+' ? '+challenge.options[Number(b.dataset.workChoice)];});
      else{const needle=document.querySelector('#skill-needle');if(needle.style)needle.style.left=(challenge.elapsed%challenge.period)/challenge.period*100+'%';}
    }
    document.querySelector('#flight-controls').hidden=!vehicles.driving||vehicles.car.model.kind!=='air';
    document.querySelector('#touch-jump').textContent=vehicles.driving?'Bremse':'Hüpfen';

    document.querySelector('#map-open').hidden=!!interior;
    if(interior){jobTitle.textContent=roomName();jobDetail.textContent=interior.lobby?'Wendeltreppe: einfach hoch oder runter laufen':interior.public?'Stadtgebaeude - '+job.coins+' Muenzen':interior.name;const action=contextAction();interactButton.hidden=!action;interactButton.textContent=(action?.label||'').replace(touchDevice?/^E - /:/^$/, '');vehicleButton.hidden=true;return;}
    if(ridingBus){jobTitle.textContent=(ridingBus.kind==='train'?'Zug ':'Bus ')+ridingBus.line+' - '+(ridingBus.wait>0?ridingBus.stop:ridingBus.nextStop);jobDetail.textContent=ridingBus.doors>.9?'Tuer offen: hinauslaufen'+((Island.busStops.find(s=>s.id===ridingBus.stopId)?.lines.length||0)>1?' | Umstieg: '+Island.busStops.find(s=>s.id===ridingBus.stopId).lines.filter(l=>l!==ridingBus.line).join(', '):''):'Unterwegs - Ausstieg an der naechsten Haltestelle';const action=busSeatAction();interactButton.hidden=!action;interactButton.textContent=action?(touchDevice?action.label.replace('E - ',''):action.label):'';vehicleButton.hidden=true;return;}
    const target=navigationTarget(),distance=Math.hypot(target.x-mauz.x,target.y-mauz.y);
    const direction=Math.atan2(target.y-mauz.y,target.x-mauz.x)-camera.heading;
    const angle=Math.atan2(Math.sin(direction),Math.cos(direction));
    const arrow=Math.abs(angle)<.55?'\u2191':Math.abs(angle)>2.6?'\u2193':angle>0?'\u2192':'\u2190';
    const a=activities.active;
    jobTitle.textContent=job.active?'Paket zu '+target.name:a?a.name+(a.kind==='taxi'?(activities.passenger?' · Zum Südstrand':' · Fahrgast abholen'):' · '+activities.done.size+'/'+a.points.length):'Jobs entdecken · '+target.name;
    jobDetail.textContent=job.coins+' Münzen · '+arrow+' '+Math.round(distance)+' m'+(vehicles.driving?' · '+Math.round(Math.abs(vehicles.car.speed)*3.6)+' km/h'+(vehicles.car.model.kind==='air'?' | '+Math.round(vehicles.car.z||0)+' m - Q / R':''):' · Karte: M');
    const action=contextAction();interactButton.hidden=!action;interactButton.textContent=action?.label||'';
    vehicleButton.hidden=!vehicles.car||(!vehicles.driving&&Math.hypot(mauz.x-vehicles.car.x,mauz.y-vehicles.car.y)>4);
    if(touchDevice)interactButton.textContent=interactButton.textContent.replace(/^E halten [·-] /,'Halten: ').replace(/^[EF] [·-] /,'');
    vehicleButton.textContent=vehicles.driving?'F · Aussteigen':'F · '+(vehicles.car?.model.name||'Auto')+' fahren';
    if(touchDevice)vehicleButton.textContent=vehicleButton.textContent.replace(/^F [\u00b7-] /,'');
    if(onlineMode&&(network.rideOwner||!vehicles.driving&&nearbyRide()&&(!vehicles.car||Math.hypot(mauz.x-vehicles.car.x,mauz.y-vehicles.car.y)>4))){vehicleButton.hidden=false;vehicleButton.textContent=network.rideOwner?'F - Aussteigen':('F - Bei '+(nearbyRide().name||'Mauz')+' mitfahren');if(touchDevice)vehicleButton.textContent=vehicleButton.textContent.replace('F - ','');}
  }
  function notify(message){
    if(/erledigt|repariert|gefangen|geprüft|gegossen|geschafft|Geliefert/.test(message)){
      celebration=.9;
      for(let i=0;i<16;i++)motes.push({x:mauz.x,y:mauz.y,z:1.1,vx:(Math.random()-.5)*5,vy:(Math.random()-.5)*5,vz:2+Math.random()*3,life:.8+Math.random()*.5,color:['#efc766','#a9ce81','#80cddd'][i%3]});
    }

    sound.effect(message.includes('+')?'reward':message.includes('erledigt')?'collect':'click');
    toast.textContent=message+(job.storageAvailable?'':' Speichern nicht verfügbar; Fortschritt nur in dieser Sitzung.');toast.hidden=false;toastTime=6;
  }
  function interact(){
    if(mode!=='playing')return;
    if(interior?.lobby){const a=lobbyAction();if(a?.type==='unit'){currentHome=a.target;setMode('home');}else if(a?.type==='exit')leaveHome();return;}
    if(interior){if(contextAction()?.type==='service'){if(interior.id==='clothes')setMode('clothes');else setMode('service');}else if(nearBed())sleepInBed();else leaveHome();return;}
    const action=contextAction();if(!action)return;
    if(action.type==='bus-seat'){if(onlineMode)network.busSeat(busRide.id,action.seat);else setBusSeat(action.seat);updateJobUI();return;}
    if(action.type==='bus-plan'){openBusMap(action.target.stop);return;}
    if(action.type==='venue'){enterVenue(action.target);return;}
    if(action.type==='home'){currentHome=action.target;setMode('home');return;}
    if(action.type==='phone'){currentBooth=action.target;sound.effect('phone');setMode('garage');return;}
    if(action.type==='start'){const r=activities.start(action.target.id,mauz);if(r)notify(r.message);}
    else if(action.type==='activity'){const r=activities.interact(mauz,vehicles.driving,vehicles.car?.speed||0);if(r)notify(r.message);}
    else if(action.type==='delivery'){
      if(vehicles.driving){notify('Steige mit F aus, um das Paket abzugeben.');return;}
      const result=job.interact(mauz);if(result)notify(result.type==='accepted'?'Paket abgeholt! Ziel: '+result.name:'Geliefert! +'+result.reward+' Münzen.');
    }
    updateJobUI();
  }
  let pointerWork=false;
  // Open menus on the completed tap, so its release cannot hit a newly opened menu.
  interactButton.onclick=e=>{if(e.detail===0||!pointerWork)interact();};
  interactButton.addEventListener('pointerdown',e=>{
    pointerWork=contextAction()?.type==='activity'&&activities.active?.kind==='hold';
    if(!pointerWork)return;
    e.preventDefault();interactButton.setPointerCapture(e.pointerId);interact();if(mode==='playing')keys.add('e');
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])interactButton.addEventListener(event,()=>keys.delete('e'));
  function nearbyRide(){return network.players.filter(p=>p.vehicle&&Math.hypot(p.vehicle.x-mauz.x,p.vehicle.y-mauz.y)<=4.5).sort((a,b)=>Math.hypot(a.vehicle.x-mauz.x,a.vehicle.y-mauz.y)-Math.hypot(b.vehicle.x-mauz.x,b.vehicle.y-mauz.y))[0];}
  function handleSession(data){
    if(['roster','chat-history','chat-message','chat-error'].includes(data.type)){onlinePanel?.receive(data);return;}
    if(data.type==='bus-seat'){if(data.busId===busRide?.id){setBusSeat(data.seat);if(data.reason)notify(data.reason);}return;}
    if(data.type==='properties'){
      const first=!propertiesReady;propertiesReady=true;
      const pending=job.syncProperties(network.mine,crypto.randomUUID());
      if(pending&&sentPropertyRequest!==pending.request){sentPropertyRequest=pending.request;network.buyProperty(pending);}
      if(first){if(!job.homeId&&onlineHomeId&&ownsHome(onlineHomeId))job.setHome(onlineHomeId);const home=Island.homes.find(h=>h.id===job.homeId&&ownsHome(h.id));if(home&&!interior)moveToDoor(home.x,home.y,-Math.PI/2);}
      if(mode==='home')updateHomeUI();updateJobUI();return;
    }
    if(data.type==='purchase-result'){if(job.finishOnlineHome(data))sentPropertyRequest=null;if(mode==='home'){updateHomeUI();document.querySelector('#home-message').textContent=data.reason;}notify(data.reason);return;}

    if(data.type==='notice'){if(data.code==='sleep-rejected')cancelSleep();notify(data.message);return;}
    if(data.type==='ride'){
      keys.clear();destination=null;
      if(!data.owner){const heading=mauz.heading;for(const a of [Math.PI/2,-Math.PI/2,Math.PI,0]){const x=mauz.x+Math.cos(heading+a)*3.4,y=mauz.y+Math.sin(heading+a)*3.4;if(walkable(x,y)){mauz.x=x;mauz.y=y;break;}}notify(data.reason||'Ausgestiegen.');}
      else notify('Du faehrst mit! Zum Aussteigen muss das Auto anhalten.');updateJobUI();
    }
    if(data.type==='sleep'&&sleeping?.online)document.querySelector('#sleep-message').textContent=data.sleepers+' / '+data.total+' schlafen. Alle muessen ins Bett.';
    if(data.type==='wake'){sleeping=null;document.querySelector('#sleep-screen').hidden=true;setMode('playing');notify('Alle ausgeschlafen! Guten Morgen, es ist 07:00 Uhr.');}
  }
  function toggleCar(){if(mode!=='playing'||interior||busRide)return;if(onlineMode&&network.rideOwner){network.ride(null);return;}if(onlineMode&&!vehicles.driving){const peer=nearbyRide();if(peer&&(!vehicles.car||Math.hypot(mauz.x-vehicles.car.x,mauz.y-vehicles.car.y)>4)){network.ride(peer.id);return;}}
if(!vehicles.toggle(mauz))notify('Zum Aussteigen anhalten und landen oder an einem Steg anlegen.');else{sound.effect('car');destination=null;keys.clear();mauz.jump=0;mauz.vz=0;}updateJobUI();}
  vehicleButton.onclick=toggleCar;
  let miniUpdated=-Infinity;
  function mapIslands(c,p,factor){
    for(const island of [{x:0,y:0,radius:Island.radius},Island.luxury,Island.continent]){c.fillStyle='#e4d5a8';c.beginPath();c.arc(...p(island.x,island.y),island.radius*factor,0,Math.PI*2);c.fill();c.fillStyle='#aec58a';c.beginPath();c.arc(...p(island.x,island.y),(island.radius-5)*factor,0,Math.PI*2);c.fill();}
    c.strokeStyle='#946fbe';c.lineWidth=2;c.setLineDash([5,4]);c.beginPath();c.arc(...p(0,0),Island.border*factor,0,Math.PI*2);c.stroke();c.setLineDash([]);
    c.fillStyle='#b49570';for(const d of Island.docks)c.fillRect(...p(d.x-d.w/2,d.y-d.d/2),d.w*factor,d.d*factor);
    c.fillStyle='#657e8b';for(const a of Island.airfields)c.fillRect(...p(a.x-a.w/2,a.y-a.d/2),a.w*factor,a.d*factor);
  }
  function drawBorder(){
    ctx.save();
    for(let i=0;i<96;i++){const a=i*Math.PI/48,b=(i+1)*Math.PI/48,x=Math.cos(a)*Island.border,y=Math.sin(a)*Island.border,nx=Math.cos(b)*Island.border,ny=Math.sin(b)*Island.border;
      polygon([point(x,y,0),point(nx,ny,0),point(nx,ny,115),point(x,y,115)],'#a38bd326');
      polygon([point(x,y,0),point(x+1,y,0),point(x+1,y,115),point(x,y,115)],'#a58bd1');
      for(const z of [0,30,60,90,115])polygon([point(x,y,z),point(nx,ny,z),point(nx,ny,z+.35),point(x,y,z+.35)],'#bdace0');
    }
    ctx.restore();
  }
  function drawRoute(c,p){if(!plannedRoute)return;c.save();c.strokeStyle='#f7f9e7';c.lineWidth=6;c.lineJoin='round';c.lineCap='round';c.beginPath();plannedRoute.points.forEach((q,i)=>{if(i)c.lineTo(...p(q.x,q.y));else c.moveTo(...p(q.x,q.y));});c.stroke();c.strokeStyle='#c76d3e';c.lineWidth=3;c.stroke();c.restore();}
  function drawBusStops(c,p,mini=false){
    const size=mini?12:16,bounds=mini?180:600,placed=[];
    c.save();c.textAlign='center';c.textBaseline='middle';
    for(const stop of Island.busStops){
      const [x,y]=p(stop.x,stop.y);
      if(x<-size||y<-size||x>bounds+size||y>bounds+size)continue;
      if(placed.some(q=>q.name===stop.name&&q.line===stop.line&&Math.hypot(q.x-x,q.y-y)<size))continue;
      placed.push({x,y,name:stop.name,line:stop.line});
      c.fillStyle='#fffdf0';c.fillRect(x-size/2,y-size/2,size,size);
      c.strokeStyle=stop.color;c.lineWidth=2;c.strokeRect(x-size/2,y-size/2,size,size);
      stop.colors.forEach((color,i)=>{c.fillStyle=color;c.fillRect(x-size/2+i*size/stop.colors.length,y+size/2-2,size/stop.colors.length,3);});
      c.fillStyle='#294d42';c.font='bold '+(mini?10:12)+'px Segoe UI';c.fillText('H',x,y+.5);
      if(!mini&&mapView.zoom>=3){
        const label=stop.name+' \u00b7 '+stop.lines.join(' / ');c.font='10px Segoe UI';
        const width=c.measureText(label).width+6;
        c.fillStyle='#fffdf0';c.fillRect(x+size/2+3,y-7,width,14);
        c.fillStyle='#294d42';c.textAlign='left';c.fillText(label,x+size/2+6,y);c.textAlign='center';
      }
    }
    drawRailMap(c,p,mini);
    c.restore();
  }
  function drawRailMap(c,p,mini){
    c.fillStyle='#68aebd';for(const r of Island.railStructures.filter(r=>r.kind==='bridge')){const a=p(r.x-r.w/2,r.y-37.5),b=p(r.x+r.w/2,r.y+37.5);c.fillRect(a[0],a[1],b[0]-a[0],b[1]-a[1]);}
    for(const line of Island.railLines){c.strokeStyle=line.color;c.lineWidth=mini?2:3;c.beginPath();line.route.forEach((q,i)=>i?c.lineTo(...p(q.x,q.y)):c.moveTo(...p(q.x,q.y)));c.closePath();c.stroke();}
    for(const station of Island.railStations){const [x,y]=p(station.x,station.y),limit=mini?180:600;if(x<0||y<0||x>limit||y>limit)continue;c.fillStyle='#fff8df';c.fillRect(x-6,y-6,12,12);c.fillStyle='#345d73';c.font='bold 9px sans-serif';c.fillText('Z',x,y+1);if(!mini&&mapView.zoom>2){c.font='10px sans-serif';c.fillText(station.name,x,y-12);}}
    for(const train of life.trains.filter(t=>t.coach===0)){const [x,y]=p(train.x,train.y);c.fillStyle=train.color;c.beginPath();c.arc(x,y,mini?4:5,0,Math.PI*2);c.fill();}
    if(!mini){c.font='bold 12px sans-serif';c.fillStyle='#38594d';for(const town of Island.towns)c.fillText(town.name,...p(town.x,town.y-170));}
  }
  function drawPlayerArrow(c,p,actor,self=false){
    if(!Number.isFinite(actor.x)||!Number.isFinite(actor.y))return;
    c.save();c.translate(...p(actor.x,actor.y));c.rotate(actor.heading||0);
    c.fillStyle=self?'#f7fcff':'#e8ddff';c.strokeStyle=self?'#225e8a':'#6e59bd';c.lineWidth=2;
    c.beginPath();c.moveTo(8,0);c.lineTo(-5,-5);c.lineTo(-3,0);c.lineTo(-5,5);c.closePath();c.fill();c.stroke();c.restore();
  }
  function worldMapActor(actor,room){
    if(!room||room==='world')return {...actor,x:actor.renderX??actor.x,y:actor.renderY??actor.y};
    const location=room.startsWith('home:')?Island.homes.find(h=>h.id===room.slice(5)):Island.venues.find(v=>v.id===room);
    return location?{...actor,x:location.x,y:location.y}:null;
  }
  function drawMiniMap(){
    if(!graphics.minimap||mode!=='playing'||time-miniUpdated<.18)return;miniUpdated=time;
    const c=document.querySelector('#minimap').getContext('2d'),size=180;
    c.clearRect(0,0,size,size);c.save();c.beginPath();c.rect(0,0,size,size);c.clip();
    const center=interior?{x:0,y:0}:mauz,factor=interior?140/Math.max(homePlan()?.w||24,homePlan()?.d||24):1.25;
    const p=(x,y)=>[90+(x-center.x)*factor,90+(y-center.y)*factor];
    c.fillStyle=interior?'#d4bea0':'#a2cdd2';c.fillRect(0,0,size,size);
    if(interior){
      c.fillStyle='#ebe6d6';for(const b of indoorWalls())c.fillRect(...p(b.x-b.w/2,b.y-b.d/2),Math.max(2,b.w*factor),Math.max(2,b.d*factor));
      c.fillStyle='#788f9c';if(interior.public){for(const b of indoorFurniture())c.fillRect(...p(b.x-b.w/2,b.y-b.d/2),b.w*factor,b.d*factor);}else{const l=homePlan(),bed=l.transform({x:-8,y:-8,w:3.7,d:5});c.fillRect(...p(bed.x-bed.w/2,bed.y-bed.d/2),bed.w*factor,bed.d*factor);}
      c.fillStyle='#4e996c';c.fillRect(...p(exitPoint().x-1,exitPoint().y),2*factor,1*factor);
      if(interior.lobby){c.strokeStyle='#b47f55';c.lineWidth=3;c.beginPath();c.arc(...p(0,-3),4.5*factor,0,Math.PI*2);c.stroke();c.fillStyle='#547b76';c.fillRect(...p(-.4,-3.4),.8*factor,.8*factor);}
      c.font='9px Segoe UI';c.fillStyle='#58664f';c.fillText(interior.lobby?'Wendeltreppe':interior.public?'Empfang':'Bett',...p(interior.public?-3:-10,-5));
    }else{
      mapIslands(c,p,factor);
      const lake=Island.pond;c.fillStyle='#77b8cf';c.beginPath();c.ellipse(...p(lake.x,lake.y),lake.rx*factor,lake.ry*factor,0,0,Math.PI*2);c.fill();
      c.fillStyle='#879b7f';c.beginPath();c.arc(...p(Island.mountain.x,Island.mountain.y),Island.mountain.radius*factor,0,Math.PI*2);c.fill();
      c.fillStyle='#81918c';for(const r of Island.roads)c.fillRect(...p(r.x-r.w/2,r.y-r.d/2),r.w*factor,r.d*factor);
      for(const b of Island.buildings){c.fillStyle=b.homeId&&ownsHome(b.homeId)?'#427754':'#dbc5a3';c.fillRect(...p(b.x-b.w/2,b.y-b.d/2),b.w*factor,b.d*factor);}
      c.fillStyle='#287f87';for(const b of Island.booths)c.fillRect(...p(b.x-1,b.y-1),3,3);
      c.fillStyle='#8861a4';for(const j of [Island.depot,...Island.jobs]){c.beginPath();c.arc(...p(j.x,j.y),3,0,Math.PI*2);c.fill();}
      c.fillStyle='#c75a9a';for(const v of Island.venues)c.fillRect(...p(v.x-1,v.y-1),4,4);
      drawRoute(c,p);
      drawBusStops(c,p,true);
      const target=navigationTarget(),q=p(target.x,target.y),dx=q[0]-90,dy=q[1]-90,d=Math.hypot(dx,dy),ratio=d>77?77/d:1;
      c.fillStyle='#ffca64';c.strokeStyle='#82552c';c.lineWidth=1.5;c.beginPath();c.arc(90+dx*ratio,90+dy*ratio,5,0,Math.PI*2);c.fill();c.stroke();
    }
    for(const peer of peers())drawPlayerArrow(c,p,peer);
    drawPlayerArrow(c,p,mauz,true);
    c.fillStyle='#f9fbef';c.fillRect(78,3,24,16);c.fillStyle='#42634c';c.font='bold 11px Segoe UI';c.textAlign='center';c.fillText('N',90,15);c.restore();
  }
  function openBusMap(stop){
    busMapStop=stop;busMapLine='all';busMapUpdated=-Infinity;
    mapView.x=380;mapView.y=60;mapView.zoom=1.65;
    if(stop.id?.startsWith('rail-')){mapView.x=-2700;mapView.y=700;mapView.zoom=2;}else mapView.zoom=8;
    const select=document.querySelector('#bus-map-line');select.replaceChildren();
    for(const line of [{id:'all',name:'Alle Linien'},...Island.busLines,...Island.railLines]){const option=document.createElement('option');option.value=line.id;option.textContent=(line.id==='all'?'':'Linie '+line.id+' - ')+line.name;select.append(option);}
    select.value='all';setMode('map');
  }
  function drawBusNetwork(c,p){
    c.save();c.lineJoin='round';c.lineCap='round';
    for(const line of [...Island.busLines,...Island.railLines]){
      const selected=busMapLine==='all'||busMapLine===line.id;
      c.globalAlpha=selected?.9:.12;c.strokeStyle=line.color;c.lineWidth=selected?3:1;
      c.beginPath();line.route.forEach((q,i)=>i?c.lineTo(...p(q.x,q.y)):c.moveTo(...p(q.x,q.y)));c.closePath();c.stroke();
    }
    c.globalAlpha=1;drawBusStops(c,p);
    for(const b of transit().filter(t=>t.coach===undefined||t.coach===0)){
      const selected=busMapLine==='all'||busMapLine===b.line,[x,y]=p(b.x,b.y);c.globalAlpha=selected?1:.3;
      c.save();c.translate(x,y);c.rotate(b.heading);c.fillStyle=b.color;c.strokeStyle='#fffdf0';c.lineWidth=2;c.beginPath();c.moveTo(12,0);c.lineTo(3,-7);c.lineTo(-9,-7);c.lineTo(-9,7);c.lineTo(3,7);c.closePath();c.fill();c.stroke();c.restore();
      c.fillStyle='#243e35';c.font='bold 10px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(b.line,x,y);
    }
    c.restore();
    document.querySelector('#bus-map-status').textContent=transit().filter(b=>(b.coach===undefined||b.coach===0)).filter(b=>busMapLine==='all'||b.line===busMapLine).map(b=>'Linie '+b.line+' - '+(b.wait>0?'Halt: '+b.stop:'Unterwegs nach '+b.nextStop)).join('\n');
  }
  function drawMap(){
    const map=document.querySelector('#map-canvas'),c=map.getContext('2d'),factor=273/Island.border*mapView.zoom;
    const p=(x,y)=>[300+(x-mapView.x)*factor,300+(y-mapView.y)*factor];
    c.fillStyle='#a2cdd2';c.fillRect(0,0,600,600);
    mapIslands(c,p,factor);
    c.fillStyle='#80928d';for(const r of Island.roads)c.fillRect(...p(r.x-r.w/2,r.y-r.d/2),r.w*factor,r.d*factor);
    for(const b of Island.buildings){c.fillStyle=b.city?'#5e7780':'#be8660';c.fillRect(...p(b.x-b.w/2,b.y-b.d/2),b.w*factor,b.d*factor);}
    const m=Island.mountain;c.fillStyle='#8a9982';c.beginPath();c.arc(...p(m.x,m.y),m.radius*factor,0,Math.PI*2);c.fill();
    c.fillStyle='#ecede2';c.beginPath();c.moveTo(...p(m.x,m.y-15));c.lineTo(...p(m.x-12,m.y+8));c.lineTo(...p(m.x+12,m.y+8));c.fill();
    const pond=Island.pond;c.fillStyle='#82b9c1';c.beginPath();c.ellipse(...p(pond.x,pond.y),pond.rx*factor,pond.ry*factor,0,0,Math.PI*2);c.fill();
    c.font='600 15px Segoe UI';c.textAlign='center';c.fillStyle='#344c40';
    for(const [label,x,y] of [['PERLENINSEL',900,-205],['FLUGPLATZ',210,300],['WELTGRENZE',0,-1230],['STADT',0,-117],['DORF',0,113],['GROSSER BERG',m.x,m.y+48],['See',pond.x,pond.y+22]])c.fillText(label,...p(x,y));
    if(!busMapStop){
    for(const [i,j] of [Island.depot,...Island.jobs].entries()){c.fillStyle='#927db2';c.beginPath();c.arc(...p(j.x,j.y),5,0,Math.PI*2);c.fill();c.font='bold 10px Segoe UI';c.fillStyle='#493757';const q=p(j.x,j.y);c.fillText(String(i+1),q[0]-7,q[1]-6);}
    c.fillStyle='#238e84';for(const b of Island.booths){const q=p(b.x,b.y);c.fillRect(q[0]-3,q[1]-3,6,6);if(b.kind&&mapView.zoom>=2){c.font='10px Segoe UI';c.fillText(b.name,q[0],q[1]-7);}}
    c.font='600 12px Segoe UI';c.fillStyle='#344c40';for(const [label,x,y] of [['FARM',-150,-28],['WERKSTATT',160,-35],['HAFEN',0,202],['NORDSTADT',0,-390],['OBSTGARTEN',-350,-50],['OSTVIERTEL',300,70],['SÜDVIERTEL',0,385]])c.fillText(label,...p(x,y));
    for(const h of Island.homes.filter(h=>h.id===h.buildingId)){const q=p(h.x,h.y);c.fillStyle=ownsHome(h.id)?'#4f895d':'#c79c41';c.fillRect(q[0]-4,q[1]-3,8,7);c.beginPath();c.moveTo(q[0]-6,q[1]-3);c.lineTo(q[0],q[1]-9);c.lineTo(q[0]+6,q[1]-3);c.fill();}
    for(const v of Island.venues){const q=p(v.x,v.y);c.fillStyle='#c75a9a';c.fillRect(q[0]-4,q[1]-4,8,8);if(mapView.zoom>=2){c.font='10px Segoe UI';c.fillText(v.name,q[0],q[1]-8);}}
    }
    drawRoute(c,p);
    if(busMapStop)drawBusNetwork(c,p);else drawBusStops(c,p);
    const t=navigationTarget();c.fillStyle='#e8a44f';c.beginPath();c.arc(...p(t.x,t.y),6,0,Math.PI*2);c.fill();
    if(onlineMode)for(const peer of network.players){const actor=worldMapActor(peer,peer.room);if(actor)drawPlayerArrow(c,p,actor);}
    const self=worldMapActor(mauz,interior?(interior.public?interior.id:'home:'+interior.id):'world');
    if(self)drawPlayerArrow(c,p,self,true);
  }
  function updateHomeUI(){
    if(!currentHome)return;
    const owned=ownsHome(currentHome.id),sold=onlineMode&&network.sold.includes(currentHome.id),selected=(job.homeId)===currentHome.id,l=homePlan(currentHome);
    const label=document.querySelector('#home-unit-label'),select=document.querySelector('#home-unit');label.hidden=currentHome.type!=='apartment';select.hidden=label.hidden;
    if(!label.hidden){select.replaceChildren();for(const h of Island.homes.filter(h=>h.buildingId===currentHome.buildingId)){const option=document.createElement('option');option.value=h.id;option.textContent=(h.floor?h.floor+'. Etage':'Erdgeschoss')+' - Wohnung '+(h.unit?'B':'A')+(ownsHome(h.id)?' (deine)':onlineMode&&network.sold.includes(h.id)?' (verkauft)':' (frei)');select.append(option);}select.value=currentHome.id;}
    document.querySelector('#home-lobby').hidden=currentHome.type!=='apartment';
    document.querySelector('#home-layout').textContent=(currentHome.type==='apartment'?'Wohnung':currentHome.type==='villa'?'Villa':'Haus')+' - '+Math.round(l.w)+' x '+Math.round(l.d)+' m - '+(l.open?'Offener Wohnbereich':'Getrennte Zimmer');
    document.querySelector('#home-title').textContent=currentHome.name;
    document.querySelector('#home-price').textContent=currentHome.price+' Muenzen';
    document.querySelector('#home-balance').textContent=job.coins+' Muenzen';
    document.querySelector('#home-status').textContent=owned?(selected?'Dein Zuhause.':'Diese Immobilie gehoert dir.'):(sold?'Online bereits verkauft.':onlineMode?'Online einmalig verfuegbar.':'Offline zum Verkauf.');
    const buy=document.querySelector('#home-buy');buy.hidden=owned;buy.disabled=job.coins<currentHome.price||sold||!!job.pendingOnlineHome||onlineMode&&(!propertiesReady||network.status!=='online');buy.textContent='Kaufen - '+currentHome.price+' Muenzen';
    const sell=document.querySelector('#home-sell');sell.hidden=!owned;sell.disabled=!!job.pendingOnlineHome||onlineMode&&(!propertiesReady||network.status!=='online');sell.textContent='Verkaufen - '+Math.floor(currentHome.price*.8)+' Muenzen zurueck';
    document.querySelector('#home-enter').hidden=!owned;document.querySelector('#home-set').hidden=!owned||selected;
    document.querySelector('#home-message').textContent=job.pendingOnlineHome?(onlineMode?'Eigentum wird abgeglichen ...':'Bitte online verbinden, um den offenen Vorgang abzuschliessen.'):!owned&&job.coins<currentHome.price?'Noch '+(currentHome.price-job.coins)+' Muenzen verdienen.':'';
  }
  document.querySelector('#home-unit').onchange=e=>{currentHome=Island.homes.find(h=>h.id===e.target.value);updateHomeUI();};
  document.querySelector('#home-lobby').onclick=()=>{if(mode==='home'&&currentHome?.type==='apartment'&&atHomeEntrance(currentHome)){if(interior?.lobby)setMode('playing');else openLobby(currentHome);}};
  document.querySelector('#home-buy').onclick=()=>{
    if(mode!=='home'||!currentHome||!atHomeEntrance(currentHome))return;
    if(onlineMode){
      if(!propertiesReady||network.status!=='online'||network.sold.includes(currentHome.id)||job.pendingOnlineHome)return;
      const request=crypto.randomUUID();if(!job.reserveOnlineHome(currentHome.id,request)){document.querySelector('#home-message').textContent='Kauf konnte nicht vorbereitet werden. Guthaben und Speicher pruefen.';return;}
      sentPropertyRequest=job.pendingOnlineHome.request;network.buyProperty(job.pendingOnlineHome);updateHomeUI();return;
    }
    const result=job.purchaseHome(currentHome.id);updateHomeUI();
    document.querySelector('#home-message').textContent=result.ok?'Gekauft! Dein Eigentum wurde gespeichert.':result.reason;
    if(result.ok)sound.effect('reward');updateJobUI();
  };
  document.querySelector('#home-sell').onclick=()=>{
    if(mode!=='home'||!currentHome||!ownsHome(currentHome.id)||job.pendingOnlineHome)return;
    if(!confirm(currentHome.name+' fuer '+Math.floor(currentHome.price*.8)+' Muenzen verkaufen?'))return;
    if(onlineMode){
      if(!propertiesReady||network.status!=='online'||!job.reserveOnlineHome(currentHome.id,crypto.randomUUID(),'sell'))return;
      sentPropertyRequest=job.pendingOnlineHome.request;network.buyProperty(job.pendingOnlineHome);updateHomeUI();return;
    }
    const result=job.sellHome(currentHome.id);updateHomeUI();updateJobUI();document.querySelector('#home-message').textContent=result.reason;
  };
  document.querySelector('#home-set').onclick=()=>{
    if(mode!=='home'||!currentHome)return;
    const success=job.setHome(currentHome.id);updateHomeUI();
    document.querySelector('#home-message').textContent=success?'Startpunkt gespeichert.':'Startpunkt konnte nicht gespeichert werden.';
  };
  function updateServiceUI(){
    if(!interior?.public)return;
    document.querySelector('#service-title').textContent=interior.name;
    document.querySelector('#service-balance').textContent=job.coins+' Muenzen'+(interior.id==='bank'?' | Sparkonto: '+job.bankBalance:'');
    const list=document.querySelector('#service-options');list.replaceChildren();
    for(const option of city.options(interior.id)){
      const button=document.createElement('button');button.textContent=option.label;button.dataset.service=option.id;button.disabled=option.disabled;
      button.onclick=()=>{if(mode!=='service'||!interior?.public||Math.hypot(mauz.x,mauz.y+3)>=2.5)return;
        const message=city.use(interior.id,option.id);setMode('playing');notify(message);};list.append(button);
    }
  }
  document.querySelector('#service-close').onclick=()=>{if(mode==='service')setMode('playing');};
  function atClothesCounter(){return interior?.id==='clothes'&&Math.hypot(mauz.x,mauz.y+3)<2.5;}
  function updateClothesUI(){
    const list=document.querySelector('#clothes-list');list.replaceChildren();
    document.querySelector('#clothes-balance').textContent='Dein Guthaben: '+job.coins+' Muenzen';
    for(const outfit of Island.outfits){
      const owned=job.ownedOutfits.includes(outfit.id),wearing=job.outfitId===outfit.id;
      const button=document.createElement('button');button.dataset.outfit=outfit.id;button.className='outfit-card';
      const preview=document.createElement('span');preview.className='outfit-preview';preview.style.backgroundColor=outfit.color;preview.setAttribute('aria-hidden','true');
      const name=document.createElement('strong');name.textContent=outfit.name;
      const action=document.createElement('small');action.textContent=wearing?'Angezogen':owned?'Kostenlos anziehen':'Kaufen + anziehen: '+outfit.price+' Muenzen';
      button.append(preview,name,action);button.disabled=wearing||(!owned&&job.coins<outfit.price);
      button.onclick=()=>{
        if(mode!=='clothes'||!atClothesCounter())return;
        const result=owned?{ok:job.equipOutfit(outfit.id),reason:'Outfit konnte nicht gespeichert werden.'}:job.purchaseOutfit(outfit.id);
        if(result.ok){setMode('playing');notify(outfit.name+' angezogen!');}else{updateClothesUI();document.querySelector('#clothes-message').textContent=result.reason;}
      };
      list.append(button);
    }
  }
  document.querySelector('#clothes-close').onclick=()=>{if(mode==='clothes')setMode('playing');};
  document.querySelector('#outfit-none').onclick=()=>{if(mode==='clothes'&&atClothesCounter()){if(job.equipOutfit(null))setMode('playing');else document.querySelector('#clothes-message').textContent='Outfit konnte nicht gespeichert werden.';}};
  document.querySelector('#home-enter').onclick=enterHome;
  document.querySelector('#home-close').onclick=()=>setMode('playing');
  const mapCanvas=document.querySelector('#map-canvas');let mapDrag=null;
  function zoomMap(multiplier){mapView.zoom=Math.max(1,Math.min(48,mapView.zoom*multiplier));drawMap();}
  document.querySelector('#map-plus').onclick=()=>zoomMap(1.5);
  document.querySelector('#map-minus').onclick=()=>zoomMap(1/1.5);
  document.querySelector('#map-locate').onclick=()=>{mapView.x=mauz.x;mapView.y=mauz.y;mapView.zoom=20;drawMap();};
  document.querySelector('#map-reset').onclick=()=>{mapView.x=0;mapView.y=0;mapView.zoom=1;drawMap();};
  mapCanvas.addEventListener('contextmenu',e=>{
    e.preventDefault();mapDrag=null;if(plannedRoute){plannedRoute=null;document.querySelector('#map-route-status').textContent='Route entfernt. Rechtsklick setzt ein neues Ziel.';drawMap();return;}
    const r=mapCanvas.getBoundingClientRect(),factor=273/Island.border*mapView.zoom,target={x:mapView.x+((e.clientX-r.left)/r.width*600-300)/factor,y:mapView.y+((e.clientY-r.top)/r.height*600-300)/factor};
    const start=interior?{x:interior.x,y:interior.y}:{x:mauz.x,y:mauz.y};
    plannedRoute=planWorldRoute(Island,start,target,(x,y)=>!Island.blocked(x,y)&&!Island.booths.some(b=>Math.hypot(b.x-x,b.y-y)<.9)&&!treeIndex.near(x,y,2).some(t=>!damage.get('tree',t.damageId)&&Math.hypot(t.x-x,t.y-y)<.9)&&!lampIndex.near(x,y,1).some(l=>!damage.get('lamp',l.damageId)&&Math.hypot(l.x-x,l.y-y)<.8));
    document.querySelector('#map-route-status').textContent=plannedRoute?plannedRoute.note+' - '+Math.round(plannedRoute.length)+' m':'Kein erreichbarer Weg zu diesem Punkt gefunden.';drawMap();
  });
  mapCanvas.addEventListener('wheel',e=>{e.preventDefault();zoomMap(e.deltaY<0?1.2:1/1.2);},{passive:false});
  mapCanvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;mapDrag={x:e.clientX,y:e.clientY};mapCanvas.setPointerCapture(e.pointerId);});
  mapCanvas.addEventListener('pointermove',e=>{if(!mapDrag)return;const bounds=mapCanvas.getBoundingClientRect(),factor=273/Island.border*mapView.zoom*bounds.width/600;mapView.x=Math.max(-Island.border,Math.min(Island.border,mapView.x-(e.clientX-mapDrag.x)/factor));mapView.y=Math.max(-Island.border,Math.min(Island.border,mapView.y-(e.clientY-mapDrag.y)/factor));mapDrag={x:e.clientX,y:e.clientY};drawMap();});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])mapCanvas.addEventListener(event,()=>mapDrag=null);
  const startScreen=document.querySelector('#start-screen');
  const pauseScreen=document.querySelector('#pause-screen');
  const gameUI=document.querySelector('#game-ui');
  function setMode(next){
    renderDirty=true;
    onlinePanel?.show(onlineMode&&next==='playing');
    if(next==='map'&&interior)return;
    if(next==='playing'&&onlineMode&&network.status!=='online')next='pause';
    if(next!=='playing')dayCycle.save();
    if(next!=='map')busMapStop=null;
    mode=next;miniUpdated=-Infinity;keys.clear();resetStick();destination=null;mauz.moving=false;
    startScreen.hidden=mode!=='start';pauseScreen.hidden=mode!=='pause';gameUI.hidden=mode!=='playing';
    document.querySelector('#map-screen').hidden=mode!=='map';
    document.querySelector('#bus-map-panel').hidden=!busMapStop;
    document.querySelector('#map-title').textContent=busMapStop?(busMapStop.id?.startsWith('rail-')?'Live-Bahnplan - ':'Live-Busplan - ')+busMapStop.name:'Deine Welt';
    document.querySelector('#map-legend').hidden=!!busMapStop;
    document.querySelector('#garage-screen').hidden=mode!=='garage';
    document.querySelector('#home-screen').hidden=mode!=='home';
    document.querySelector('#clothes-screen').hidden=mode!=='clothes';
    document.querySelector('#service-screen').hidden=mode!=='service';
    if(mode==='service'){updateServiceUI();document.querySelector('#service-close').focus();}
    if(mode==='clothes'){updateClothesUI();document.querySelector('#clothes-message').textContent='';document.querySelector('#clothes-close').focus();}
    if(mode==='home'){updateHomeUI();document.querySelector('#home-close').focus();}
    if(mode!=='playing'){vehicles.stop();sound.quietEngine();}
    if(mode==='garage'){document.querySelector('#garage-message').textContent='';for(const b of document.querySelectorAll('[data-car]'))b.hidden=(VehicleModels.find(m=>m.id===b.dataset.car).kind||'car')!==(currentBooth.kind||'car');document.querySelector('[data-car]:not([hidden])')?.focus();}
    if(mode==='map'){drawMap();document.querySelector('#map-close').focus();}
    updateJobUI();
    if(mode==='start'){renderWorldSlots();(saveWorlds?document.querySelector('.world-slot[aria-pressed="true"]'):document.querySelector('#play'))?.focus();}
    if(mode==='pause')document.querySelector('#resume').focus();
    if(mode==='playing')document.activeElement?.blur();
  }
  document.querySelector('#garage-close').onclick=()=>setMode('playing');
  document.querySelectorAll('[data-car]').forEach(button=>button.onclick=()=>{
    if(mode!=='garage')return;
    if(vehicles.spawn(button.dataset.car,currentBooth,mauz)){setMode('playing');notify(vehicles.car.model.name+' steht bereit. Geh zum Fahrzeug und drücke F.');}
    else document.querySelector('#garage-message').textContent='Kein freier Platz. Probiere eine anderen Spawnpunkt.';
  });
  document.querySelector('#mini-open').onclick=()=>{if(!interior)setMode('map');};
  document.querySelector('#map-open').onclick=()=>setMode('map');
  document.querySelector('#bus-map-line').onchange=e=>{busMapLine=e.target.value;const route=[...Island.busLines,...Island.railLines].find(l=>l.id===busMapLine)?.route;if(route){const xs=route.map(p=>p.x),ys=route.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);mapView.x=(minX+maxX)/2;mapView.y=(minY+maxY)/2;mapView.zoom=Math.min(48,500/Math.max(maxX-minX,maxY-minY,30)/(273/Island.border));}else{mapView.x=380;mapView.y=60;mapView.zoom=1.65;}drawMap();};
  document.querySelector('#map-close').onclick=()=>setMode('playing');
  function cancelSleep(){if(sleeping?.online){network.sleep(false);sleeping=null;document.querySelector('#sleep-screen').hidden=true;setMode('playing');}}
  document.querySelector('#sleep-cancel').onclick=cancelSleep;
  function renderWorldSlots(){
    if(!saveWorlds)return;
    const list=document.querySelector('#world-slots');list.replaceChildren();
    saveWorlds.list().forEach((slot,i)=>{
      const button=document.createElement('button');button.type='button';button.className='world-slot';button.dataset.slot=String(i);button.setAttribute('aria-pressed',String(saveWorlds.active===i));
      const title=document.createElement('strong'),stats=document.createElement('small');title.textContent=slot?slot.name:'Neue Welt '+(i+1);stats.textContent=slot?slot.coins+' Münzen · '+slot.completed+' Lieferungen':'Welt erstellen';button.append(title,stats);
      button.onclick=()=>{if(slot&&saveWorlds.active===i)return;try{if(slot)saveWorlds.select(i);else saveWorlds.create(i);network.stop();window.location.reload();}catch{document.querySelector('#world-message').textContent='Die Welt konnte nicht gespeichert werden. Bitte erlaube das Speichern im Browser.';}};list.append(button);
    });
    document.querySelector('#world-name').value=saveWorlds.list()[saveWorlds.active].name;
    document.querySelector('#pause-title').textContent='Pause ? '+saveWorlds.list()[saveWorlds.active].name;
  }
  if(saveWorlds){
    renderWorldSlots();
    document.querySelector('#world-name').onchange=e=>{try{saveWorlds.rename(e.target.value);renderWorldSlots();}catch{document.querySelector('#world-message').textContent='Name konnte nicht gespeichert werden.';}};
  }
  document.querySelector('#play').onclick=()=>{chooseCharacter();onlineMode=false;network.stop();dayCycle.stopShared();setMode('playing');};
  document.querySelector('#play-online').onclick=async()=>{
    chooseCharacter();
    const button=document.querySelector('#play-online'),message=document.querySelector('#online-message');
    if(button.disabled)return;button.disabled=true;document.querySelector('#play').disabled=true;message.textContent='Verbindung zur gemeinsamen Insel ...';onlineMode=true;dayCycle.startShared();
    try{propertiesReady=false;sentPropertyRequest=null;await network.connect(onlineIdentity());vehicles.reset();interior=null;moveToDoor(0,0,-Math.PI/2);setMode('playing');message.textContent='Alle Online-Spieler treffen sich auf derselben Insel.';}
    catch(error){onlineMode=false;network.stop();dayCycle.stopShared();message.textContent=error.message;setMode('start');}
    finally{button.disabled=false;document.querySelector('#play').disabled=false;}
  };
  function chooseWork(option){if(mode!=='playing'||interior)return;const r=activities.choose(option,mauz,vehicles.driving);if(r){notify(r.message);sound.effect(r.type==='miss'?'phone':'collect');updateJobUI();}}
  document.querySelectorAll('[data-work-choice]').forEach(button=>button.onclick=()=>chooseWork(Number(button.dataset.workChoice)));
  document.querySelector('#wave').onclick=()=>{if(mode==='playing'&&network.status==='online'){network.wave();celebration=.9;}};
  document.querySelector('#menu').onclick=()=>setMode('pause');
  document.querySelector('#view-toggle').onclick=()=>{viewFront=!viewFront;setMode('playing');};
  document.querySelector('#resume').onclick=()=>setMode('playing');
  document.querySelector('#back').onclick=()=>{onlineMode=false;network.stop();dayCycle.stopShared();setMode('start');};
  window.addEventListener('keydown',e=>{
    if(e.target?.closest?.('#online-panel')||e.target?.matches?.('input,textarea,select,[contenteditable=true]'))return;
    const key=e.key.toLowerCase();
    if(mode==='sleeping'){if(key==='escape'&&sleeping?.online)cancelSleep();e.preventDefault();return;}
    if(key==='v'&&!e.repeat&&mode==='playing'){viewFront=!viewFront;return;}
    if(key==='m'&&!e.repeat&&(mode==='playing'||mode==='map')){e.preventDefault();setMode(mode==='map'?'playing':'map');return;}
    if((mode==='clothes'||mode==='service')&&key==='tab'){const buttons=[...document.querySelectorAll(mode==='service'?'#service-screen button':'#clothes-screen button')].filter(b=>!b.disabled);const i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();return;}
    if(mode==='garage'&&key==='tab'){
      const buttons=[...document.querySelectorAll('[data-car]:not([hidden])'),document.querySelector('#garage-close')];
      const i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();return;
    }
    if((mode==='map'||mode==='home')&&key==='tab'){const ids=mode==='map'?['map-close','bus-map-line','map-minus','map-plus','map-locate','map-reset']:['home-unit','home-lobby','home-buy','home-enter','home-set','home-sell','home-close'];const buttons=ids.map(id=>document.getElementById(id)).filter(b=>!b.hidden&&!b.disabled&&(b.id!=='bus-map-line'||busMapStop));const i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();return;}
    if(key==='escape'&&!e.repeat&&mode!=='start'){e.preventDefault();setMode(mode==='playing'?'pause':'playing');return;}
    if(mode!=='playing'){
      if(key==='tab'&&mode==='pause'){
        const first=document.querySelector('#resume'),last=document.querySelector('#effects-volume');
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
      }
      return;
    }
    if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key))e.preventDefault();
    if(key==='f'&&!e.repeat){toggleCar();return;}
    if(mode==='playing'&&activities.challenge?.kind==='choice'&&['1','2','3'].includes(key)&&!e.repeat){e.preventDefault();chooseWork(Number(key)-1);return;}
    if(key==='e'&&!e.repeat){interact();if(mode==='playing')keys.add('e');return;}
    keys.add(key);
  });
  const joystick=document.querySelector('#joystick');
  function moveStick(e){
    if(e.pointerId!==stick.id)return;
    const r=joystick.getBoundingClientRect(),radius=r.width*.34;
    let x=(e.clientX-r.left-r.width/2)/radius,y=(e.clientY-r.top-r.height/2)/radius;
    const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
    stick.x=Math.abs(x)<.12?0:x;stick.y=Math.abs(y)<.12?0:y;
    document.querySelector('#joystick-knob').style.transform=`translate(${x*radius}px,${y*radius}px)`;
    e.preventDefault();
  }
  joystick.addEventListener('pointerdown',e=>{if(mode!=='playing'||stick.id!==null)return;stick.id=e.pointerId;joystick.setPointerCapture(e.pointerId);moveStick(e);});
  joystick.addEventListener('pointermove',moveStick);
  for(const event of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(event,e=>{if(e.pointerId===stick.id)resetStick();});
  window.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){touchDevice=true;document.documentElement.classList.add('touch-device');}});
  if(touchDevice)document.documentElement?.classList.add('touch-device');
  document.addEventListener?.('visibilitychange',()=>{if(document.hidden&&mode==='playing')setMode('pause');});
  window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur',()=>{if(mode==='playing')setMode('pause');else keys.clear();});
  canvas.addEventListener('pointerdown',e=>{
    if(mode!=='playing'||vehicles.driving||e.pointerType==='touch')return;
    const target=groundAt(e.clientX,e.clientY);
    if(target&&walkable(target.x,target.y))destination=target;
  });
  document.querySelectorAll('[data-key]').forEach(button=>{
    button.addEventListener('pointerdown',e=>{
      if(mode!=='playing')return;
      e.preventDefault();button.setPointerCapture(e.pointerId);keys.add(button.dataset.key);
    });
    for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>keys.delete(button.dataset.key));
  });
  function syncGraphicsUI(){
    for(const key of ['quality','distance','fps','realism'])document.querySelector('#graphics-'+key).value=String(graphics[key]);
    for(const key of ['shadows','water','particles','vegetation','glow','labels','minimap','chatSound'])document.querySelector('#graphics-'+key).checked=graphics[key];
    for(const key of ['brightness','zoom'])document.querySelector('#graphics-'+key).value=String(graphics[key]);
    document.querySelector('#mini-open').hidden=!graphics.minimap;
    for(const key of ['clouds','wind','steering'])document.querySelector('#graphics-'+key).value=String(graphics[key]);
    canvas.style.filter='brightness('+graphics.brightness+'%)';
    document.querySelector('#graphics-show-fps').checked=graphics.showFps;
    document.querySelector('#fps-counter').hidden=!graphics.showFps;
  }
  function applyGraphics(){
    try{graphicsStorage.setItem('animal-world-graphics-v1',JSON.stringify(graphics));}catch{}
    staticScenery.clear();resize();syncGraphicsUI();
  }
  for(const key of ['quality','distance','fps','realism'])document.querySelector('#graphics-'+key).onchange=e=>{graphics[key]=['fps','distance'].includes(key)?Number(e.target.value):e.target.value;applyGraphics();};
  for(const key of ['shadows','water','particles','vegetation','glow','labels','minimap','chatSound'])document.querySelector('#graphics-'+key).onchange=e=>{graphics[key]=e.target.checked;applyGraphics();};
  for(const key of ['brightness','zoom'])document.querySelector('#graphics-'+key).onchange=e=>{graphics[key]=Number(e.target.value);applyGraphics();};
  for(const key of ['clouds','wind','steering'])document.querySelector('#graphics-'+key).onchange=e=>{graphics[key]=Number(e.target.value);applyGraphics();};
  document.querySelector('#graphics-show-fps').onchange=e=>{graphics.showFps=e.target.checked;applyGraphics();};
  document.querySelector('#graphics-reset').onclick=()=>{Object.assign(graphics,graphicsDefaults);applyGraphics();};
  syncGraphicsUI();
  let fpsSampleAt=0,fpsSampleFrames=0;
  function syncAudioUI(){
    const settings=sound.settings;
    document.querySelector('#menu-audio').textContent=!sound.available?'Ton nicht verfuegbar':!sound.running?'Musik einschalten':settings.muted?'Ton einschalten':'Ton ausschalten';
    document.querySelector('#mute-audio').textContent=settings.muted?'Ton einschalten':'Ton ausschalten';
    document.querySelector('#music-volume').value=Math.round(settings.music*100);
    document.querySelector('#effects-volume').value=Math.round(settings.effects*100);
  }
  async function toggleAudio(){
    const wasRunning=sound.running;
    await sound.unlock();
    sound.set('muted',wasRunning?!sound.settings.muted:false);syncAudioUI();
  }
  document.querySelector('#menu-audio').onclick=toggleAudio;
  document.querySelector('#mute-audio').onclick=toggleAudio;
  document.querySelector('#music-volume').oninput=e=>{sound.set('music',Number(e.target.value)/100);};
  document.querySelector('#effects-volume').oninput=e=>{sound.set('effects',Number(e.target.value)/100);};
  const unlockAudio=e=>{if(e.target?.id==='menu-audio'||e.target?.id==='mute-audio')return;if(!sound.running)sound.unlock().then(syncAudioUI);};
  window.addEventListener('pointerdown',unlockAudio);window.addEventListener('keydown',unlockAudio);
  syncAudioUI();
  window.addEventListener('pagehide',()=>{dayCycle.save();network.stop();});
  window.addEventListener('resize',resize);resize();setMode('start');
  // Available only in the isolated browser test context.
  if(location.hash==='#smoke-test')window.__animalTest={
    boardBus(id){const b=transit().find(b=>b.id===id);busRide=b?{id:b.id,heading:b.heading,f:1,s:0}:null;mauz.busId=b?.id||null;mauz.seated=false;mauz.busSeat=null;carryBus();updateJobUI();},
    visit(x,y,heading=-Math.PI/2){mauz.x=x;mauz.y=y;mauz.heading=heading;if(vehicles.driving){vehicles.car.x=x;vehicles.car.y=y;vehicles.car.heading=heading;vehicles.stop();}camera.x=x;camera.y=y;camera.z=Island.heightAt(x,y);camera.heading=heading;keys.clear();destination=null;updateJobUI();draw();},
    airCrashSetup(){if(!vehicles.car||vehicles.car.model.kind!=='air')return false;Object.assign(vehicles.car,{x:160,y:-38,z:5,heading:Math.PI/2,speed:25});Object.assign(mauz,{x:160,y:-38,heading:Math.PI/2});return true;},
    crashSetup(kind,kmh){
      if(!vehicles.car)return false;const items=kind==='tree'?trees:Island.lamps;
      for(const t of items)for(const heading of [0,Math.PI/2,Math.PI,-Math.PI/2]){const x=t.x-Math.cos(heading)*5,y=t.y-Math.sin(heading)*5;
        if(!vehicles.clearAt(x,y,heading,vehicles.car.model))continue;
        Object.assign(vehicles.car,{x,y,heading,speed:0});Object.assign(mauz,{x,y,heading});if(!vehicles.driving)vehicles.toggle(mauz);vehicles.car.speed=kmh/3.6;camera.x=x;camera.y=y;camera.heading=heading;return {x:t.x,y:t.y};
      }return false;
    },
    park(){vehicles.stop();if(vehicles.driving)vehicles.toggle(mauz);},
    setTime(minutes){dayCycle.set(minutes);updateJobUI();draw();},
    advanceSleep,
    advance(seconds){if(mode==='playing')for(let i=0;i<Math.ceil(seconds*60);i++)step(1/60);},
    audio:()=>sound.unlock(),
    state:()=>({graphics:{...graphics},saveWorld:saveWorlds?.active??0,carrying:activities.carrying,crossings:life.crossings,busMap:!!busMapStop,busMapLine,busRide,commuters:life.commuters,buses:life.buses,trains:life.trains,railStations:Island.railStations,worldBorder:Island.border,busStops:Island.busStops,elevation:mauz.elevation||0,floor:interior?.floor,networkId:network.id,route:plannedRoute,explosionParticles:motes.filter(p=>p.big).length,name:mauz.name,species:mauz.species,air:adventure.air,inWater:adventure.wet,riding:network.rideOwner,renderedFrames,carPosition:vehicles.car?{x:vehicles.car.x,y:vehicles.car.y,z:vehicles.car.z||0}:null,renderPixels:canvas.width*canvas.height,animal3D:true,viewFront,traffic:life.cars.map(c=>({x:c.x,y:c.y,speed:c.speed})),citizens:life.walkers.map(n=>({x:n.x,y:n.y,species:n.species,moving:n.moving})),fallen:damage.fallen,online:onlineMode,network:network.status,peers:network.players,bankBalance:job.bankBalance,meal:city.meal,therapy:city.therapy,outfitId:job.outfitId,ownedOutfits:job.ownedOutfits,minutes:dayCycle.minutes,clock:dayCycle.label,night:dayCycle.night,day:dayCycle.day,lamps:Island.lamps.length,sleeping:!!sleeping,jump:mauz.jump,stick:{x:stick.x,y:stick.y},challenge:activities.challenge,cameraDistance,cameraHeight,depthRenderer:!!indoorRenderer,transportDepthRenderer:!!transportRenderer,propertyReady:propertiesReady,soldHomes:network.sold,layout:homePlan()?{w:homePlan().w,d:homePlan().d,bed:homePlan().bed,exit:homePlan().exit,spawn:homePlan().spawn}:null,interior:interior?.id||null,room:interior?roomName():null,audioRunning:sound.running,ambience:sound.ambience,announcementPlaying:sound.announcementPlaying,theme:sound.scene,muted:sound.settings.muted,audioSettings:sound.settings,ownedHomes:ownedHomes(),homeId:job.homeId,mapZoom:mapView.zoom,active:job.active,coins:job.coins,completed:job.completed,activity:activities.active?.id||null,passenger:activities.passenger,done:activities.done.size,driving:vehicles.driving,car:vehicles.car?.model.id||null,speed:vehicles.car?.speed||0,x:mauz.x,y:mauz.y,mode,height:Island.heightAt(mauz.x,mauz.y)})
  };
  let lastPaint=0,lastSoundUpdate=-Infinity;
  function soundEnvironment(){
    if(interior)return {paved:true};
    const sea=Island.inSea(mauz.x,mauz.y),shore=Math.min(Math.abs(Math.hypot(mauz.x,mauz.y)-Island.radius),Math.abs(Math.hypot(mauz.x-Island.luxury.x,mauz.y-Island.luxury.y)-Island.luxury.radius),Math.abs(Math.hypot(mauz.x-Island.continent.x,mauz.y)-Island.continent.radius));
    const traffic=life.cars.reduce((level,c)=>Math.max(level,Math.max(0,1-Math.hypot(c.x-mauz.x,c.y-mauz.y)/35)*Math.min(1,c.speed/6)),0);
    const coast=sea?1:Math.max(0,1-shore/55),nature=coast>.4?0:Math.min(1,treeIndex.near(mauz.x,mauz.y,18).length/8);
    return {sea:coast,wind:.5+Math.min(.5,Island.heightAt(mauz.x,mauz.y)/40),nature,traffic,night:dayCycle.night,paved:Island.onRoad(mauz.x,mauz.y),water:sea&&!busRide&&!vehicles.driving};
  }
  function frame(now){if(now-fpsSampleAt>=1000){document.querySelector('#fps-counter').textContent=mode==='playing'?Math.round((renderedFrames-fpsSampleFrames)*1000/(now-fpsSampleAt))+' FPS':'FPS: Pause';fpsSampleAt=now;fpsSampleFrames=renderedFrames;}if(onlineMode)carryBus();if(onlineMode)network.update({busF:busRide?.f,busS:busRide?.s,busId:busRide?.id||null,elevation:mauz.elevation||0,x:mauz.x,y:mauz.y,heading:mauz.heading,jump:mauz.jump,moving:mauz.moving,room:interior?(interior.public?interior.id:'home:'+interior.id):'world',outfit:job.outfitId,car:vehicles.driving?vehicles.car.model.id:null,name:mauz.name,species:mauz.species,vehicle:vehicles.car?{model:vehicles.car.model.id,x:vehicles.car.x,y:vehicles.car.y,heading:vehicles.car.heading,speed:vehicles.car.speed,z:vehicles.car.z||0}:null});const elapsed=Math.max(0,(now-last)/1000),dt=Math.min(elapsed,.04);last=now;network.smooth(dt);if(onlineMode)damage.tick(elapsed);if(mode==='playing')step(dt);else if(mode==='sleeping')advanceSleep(dt);if(mode==='map'&&(busMapStop||onlineMode)){if(busMapStop&&!onlineMode){let remaining=Math.min(elapsed,1);while(remaining>0){const part=Math.min(remaining,.05);life.tick(part,mauz,vehicles.car);remaining-=part;}}if(now-busMapUpdated>200){drawMap();busMapUpdated=now;}}if(now-lastSoundUpdate>=100){lastSoundUpdate=now;sound.update(mode==='start'?'menu':job.active?'delivery':activities.active?.id||'explore',{environment:mode==='playing'?soundEnvironment():{},buses:transit(),listener:mode==='playing'&&!interior?mauz:null,busId:busRide?.id,paused:mode!=='playing'&&mode!=='start',moving:mauz.moving,driving:vehicles.driving,speed:vehicles.car?.speed||0,running:keys.has('shift'),working:activities.progress>0,braking:keys.has(' ')});}if(renderDirty||mode==='playing'&&now-lastPaint>=(graphics.fps?1000/graphics.fps-1:0)||mode==='sleeping'&&now-lastPaint>100){draw();renderDirty=false;lastPaint=now;}requestAnimationFrame(frame);}requestAnimationFrame(frame);
})();
