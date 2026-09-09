const VehicleModels=[
  {id:'compact',name:'Kleinwagen',color:'#6faeba',top:'#9dc8ce',speed:26,acceleration:14,steer:2.1,width:2.1,length:3.8,slope:.5,description:'Wendig und einfach zu fahren'},
  {id:'roadster',name:'Roadster',color:'#d48163',top:'#efb18e',speed:38,acceleration:19,steer:1.65,width:2.2,length:4.3,slope:.3,description:'Das schnellste Auto auf der Strasse'},
  {id:'pickup',name:'Pickup',color:'#88a05e',top:'#b1bc7b',speed:23,acceleration:12,steer:1.8,width:2.5,length:4.8,slope:.85,description:'Robust und auch auf sanften Hängen fahrbar'}
];
function createVehicles(world,walkable){
  let car=null,driving=false;
  function clearAt(x,y,heading,model){
    const z=world.heightAt(x,y);
    for(const [side,forward] of [[0,0],[-1,-1],[-1,1],[1,-1],[1,1],[0,-1],[0,1]]){
      const px=x+Math.cos(heading)*forward*model.length/2-Math.sin(heading)*side*model.width/2;
      const py=y+Math.sin(heading)*forward*model.length/2+Math.cos(heading)*side*model.width/2;
      if(!walkable(px,py)||Math.abs(world.heightAt(px,py)-z)>model.slope)return false;
      if(world.booths.some(b=>Math.hypot(px-b.x,py-b.y)<.85))return false;
    }
    return true;
  }
  function spawn(id,booth,player){
    const model=VehicleModels.find(m=>m.id===id);
    if(!model||!world.booths.includes(booth)||driving||Math.hypot(player.x-booth.x,player.y-booth.y)>2.6)return false;
    const offsets=[[0,0],[0,6],[0,-6],[6,0],[-6,0]];
    const spot=offsets.map(([x,y])=>({x:booth.sx+x,y:booth.sy+y})).find(p=>clearAt(p.x,p.y,-Math.PI/2,model)&&Math.hypot(p.x-player.x,p.y-player.y)>3);
    if(!spot)return false;
    car={...spot,heading:-Math.PI/2,speed:0,model};return true;
  }
  function toggle(player){
    if(!car)return false;
    if(!driving){if(Math.hypot(player.x-car.x,player.y-car.y)>4)return false;driving=true;car.speed=0;player.x=car.x;player.y=car.y;player.heading=car.heading;return true;}
    if(Math.abs(car.speed)>.6)return false;
    for(const angle of [Math.PI/2,-Math.PI/2,Math.PI,0]){
      const x=car.x+Math.cos(car.heading+angle)*3.4,y=car.y+Math.sin(car.heading+angle)*3.4;
      if(walkable(x,y)&&Math.abs(world.heightAt(x,y)-world.heightAt(car.x,car.y))<1.5&&!world.booths.some(b=>Math.hypot(x-b.x,y-b.y)<1.1)){
        driving=false;player.x=x;player.y=y;return true;
      }
    }
    return false;
  }
  function step(dt,throttle,turn,brake,player){
    if(!car||!driving)return;
    const m=car.model;
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
      if(!clearAt(x,y,car.heading,m)){car.speed=0;break;}
      car.x=x;car.y=y;
    }
    player.x=car.x;player.y=car.y;player.heading=car.heading;player.moving=false;
  }
  function stop(){if(car)car.speed=0;}
  return {reset(){car=null;driving=false;},spawn,toggle,step,stop,clearAt,get car(){return car;},get driving(){return driving;}};
}
