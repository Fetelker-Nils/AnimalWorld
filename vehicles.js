const VehicleModels=[
  {id:'compact',name:'Kleinwagen',color:'#6faeba',top:'#9dc8ce',speed:26,acceleration:14,steer:2.1,width:2.1,length:3.8,slope:.5,description:'Wendig und einfach zu fahren'},
  {id:'roadster',name:'Roadster',color:'#d48163',top:'#efb18e',speed:38,acceleration:19,steer:1.65,width:2.2,length:4.3,slope:.3,description:'Das schnellste Auto auf der Strasse'},
  {id:'pickup',name:'Pickup',color:'#88a05e',top:'#b1bc7b',speed:23,acceleration:12,steer:1.8,width:2.5,length:4.8,slope:.85,description:'Robust und auch auf sanften Hängen fahrbar'},
  {id:'plane',kind:'air',name:'Propellerflugzeug',color:'#e9c568',top:'#f8e5a0',speed:65,acceleration:14,steer:.7,width:10,length:8,slope:.5,description:'Q steigen, R sinken; zum Starten beschleunigen'},
  {id:'helicopter',kind:'air',name:'Helikopter',color:'#d68161',top:'#edb39b',speed:36,acceleration:12,steer:1.5,width:4,length:7,slope:.5,description:'Senkrecht starten und landen: Q / R'},
  {id:'boat',kind:'boat',name:'Motorboot',color:'#e4e4d6',top:'#86bfc7',speed:30,acceleration:10,steer:1.4,width:2.8,length:5,slope:.5,description:'Ueber das Meer zur Perleninsel'}
];
function createVehicles(world,walkable,onImpact=()=>{},airBlocked=()=>false,trafficBlocked=()=>false){
  let car=null,driving=false;
  function clearAt(x,y,heading,model){
    if(world.inBounds&&!world.inBounds(x,y))return false;
    const z=world.heightAt(x,y);
    for(const [side,forward] of [[0,0],[-1,-1],[-1,1],[1,-1],[1,1],[0,-1],[0,1]]){
      const px=x+Math.cos(heading)*forward*model.length/2-Math.sin(heading)*side*model.width/2;
      const py=y+Math.sin(heading)*forward*model.length/2+Math.cos(heading)*side*model.width/2;
      if(model.kind==='boat'){if(!world.inBounds(px,py)||!world.inSea(px,py))return false;continue;}
      if(!walkable(px,py)||Math.abs(world.heightAt(px,py)-z)>model.slope)return false;
      if(world.booths.some(b=>Math.hypot(px-b.x,py-b.y)<.85))return false;
    }
    return true;
  }
  function spawn(id,booth,player){
    const model=VehicleModels.find(m=>m.id===id);
    if(!model||(model.kind||'car')!==(booth.kind||'car')||!world.booths.includes(booth)||driving||Math.hypot(player.x-booth.x,player.y-booth.y)>2.6)return false;
    const heading=model.kind==='boat'?0:-Math.PI/2;
    const offsets=[[0,0],[0,6],[0,-6],[6,0],[-6,0]];
    const spot=offsets.map(([x,y])=>({x:booth.sx+x,y:booth.sy+y})).find(p=>clearAt(p.x,p.y,heading,model)&&Math.hypot(p.x-player.x,p.y-player.y)>3);
    if(!spot)return false;
    car={...spot,heading,speed:0,z:0,model};return true;
  }
  function toggle(player){
    if(!car)return false;
    if(!driving){if(Math.hypot(player.x-car.x,player.y-car.y)>4)return false;driving=true;car.speed=0;player.x=car.x;player.y=car.y;player.heading=car.heading;return true;}
    if(Math.abs(car.speed)>.6||(car.model.kind==='air'&&car.z>world.heightAt(car.x,car.y)+.3))return false;
    for(const angle of [Math.PI/2,-Math.PI/2,Math.PI,0]){
      const x=car.x+Math.cos(car.heading+angle)*3.4,y=car.y+Math.sin(car.heading+angle)*3.4;
      if(walkable(x,y)&&Math.abs(world.heightAt(x,y)-world.heightAt(car.x,car.y))<1.5&&!world.booths.some(b=>Math.hypot(x-b.x,y-b.y)<1.1)){
        driving=false;player.x=x;player.y=y;return true;
      }
    }
    return false;
  }
  function destroy(player,impact){
    onImpact(impact);
    const spots=[{x:car.x,y:car.y},...world.booths.flatMap(b=>[{x:b.x+2,y:b.y},{x:b.x-2,y:b.y}])].filter(p=>walkable(p.x,p.y));
    spots.sort((a,b)=>Math.hypot(a.x-car.x,a.y-car.y)-Math.hypot(b.x-car.x,b.y-car.y));const safe=spots[0]||{x:0,y:0};
    Object.assign(player,{x:safe.x,y:safe.y,jump:0,vz:0,moving:false});driving=false;car=null;
  }
  function step(dt,throttle,turn,brake,player,lift=0){
    if(!car||!driving)return;
    const m=car.model;
    if(m.kind==='air'){
      car.speed=brake?car.speed*Math.exp(-6*dt):Math.max(0,Math.min(m.speed,car.speed+throttle*m.acceleration*dt));
      car.heading+=turn*m.steer*dt;
      const x=car.x+Math.cos(car.heading)*car.speed*dt,y=car.y+Math.sin(car.heading)*car.speed*dt;
      const floor=world.heightAt(x,y),canLift=m.id==='helicopter'||car.speed>12;
      let z=Math.max(0,Math.min(100,(car.z||0)+(lift>0&&!canLift?0:lift)*15*dt));
      // Airplanes descend gently if they lose airspeed; helicopters can hover.
      if(m.id==='plane'&&car.speed<12&&car.z>floor)z=Math.max(floor,z-3*dt);
      const obstacle=airBlocked(x,y,z,m)||(world.buildings||[]).some(b=>Math.abs(x-b.x)<b.w/2+m.width/2&&Math.abs(y-b.y)<b.d/2+m.length/2&&z<b.h+4);
      const landing=z<=floor+.2;
      if(!world.inBounds(x,y)){car.speed=0;}
      else if(obstacle||z<floor||landing&&(world.inSea(x,y)||!clearAt(x,y,car.heading,m))){const speed=Math.max(Math.abs(car.speed),Math.abs(z-(car.z||0))/dt);if(speed>4){destroy(player,{x,y,z:car.z||0,heading:car.heading,speed,model:m,carX:car.x,carY:car.y});return;}car.speed=0;}
      else{car.x=x;car.y=y;car.z=landing?floor:z;}
      player.x=car.x;player.y=car.y;player.heading=car.heading;player.moving=false;return;
    }

    if(brake)car.speed*=Math.exp(-9*dt);
    else if(throttle)car.speed+=throttle*m.acceleration*dt;
    else car.speed*=Math.exp(-1.4*dt);
    car.speed=Math.max(-8,Math.min(m.speed,car.speed));
    if(Math.abs(car.speed)<.05)car.speed=0;
    const angle=car.heading+turn*m.steer*dt*Math.min(1,Math.abs(car.speed)/5)*Math.sign(car.speed);
    if(clearAt(car.x,car.y,angle,m))car.heading=angle;
    const count=Math.max(1,Math.ceil(Math.abs(car.speed)*dt/.18));
    for(let i=0;i<count;i++){
      const x=car.x+Math.cos(car.heading)*car.speed*dt/count,y=car.y+Math.sin(car.heading)*car.speed*dt/count;
      if(trafficBlocked(x,y,car.heading,m)){car.speed=0;break;}
      if(!clearAt(x,y,car.heading,m)){
        const impact={x,y,heading:car.heading,speed:Math.abs(car.speed),model:m,carX:car.x,carY:car.y};
        car.speed=0;
        if(m.kind==='boat'){if(impact.speed>4&&Math.hypot(x,y)<world.border-Math.max(m.width,m.length)){destroy(player,{...impact,z:0});return;}break;}
        if(impact.speed*3.6>70){
          if(onImpact(impact)?.keepCar){break;}
          // Return the driver to the last safe centre before removing the vehicle.
          player.x=car.x;player.y=car.y;player.jump=0;player.vz=0;driving=false;car=null;
          return;
        }
        onImpact(impact);break;
      }
      car.x=x;car.y=y;
    }
    player.x=car.x;player.y=car.y;player.heading=car.heading;player.moving=false;
  }
  function stop(){if(car)car.speed=0;}
  return {reset(){car=null;driving=false;},spawn,toggle,step,stop,clearAt,get car(){return car;},get driving(){return driving;}};
}
