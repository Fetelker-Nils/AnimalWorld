function createCityLife(world, models){
  models=models.filter(m=>!m.kind);
  const cars=[],walkers=[];
  const routePoints=world.busRoute||[];
  const buses=routePoints.length?[0,6].map((i,n)=>({id:'bus-'+n,x:routePoints[i].x,y:routePoints[i].y,heading:Math.atan2(routePoints[i].y-routePoints[(i+routePoints.length-1)%routePoints.length].y,routePoints[i].x-routePoints[(i+routePoints.length-1)%routePoints.length].x),target:(i+1)%routePoints.length,speed:0,wait:14,doors:0,stop:routePoints[i].name,line:'1'})):[];
  function tickBuses(dt,hazards){
    for(const b of buses){
      if(b.wait>0){if(b.wait<2&&hazards.some(p=>{const dx=p.x-b.x,dy=p.y-b.y,f=dx*Math.cos(b.heading)+dy*Math.sin(b.heading),side=-dx*Math.sin(b.heading)+dy*Math.cos(b.heading);return f>1.7&&f<3.6&&side>.9&&side<2.8;}))b.wait=2;b.speed=0;b.wait=Math.max(0,b.wait-dt);b.doors=Math.max(0,Math.min(1,b.doors+(b.wait>1?dt:-dt)*2));continue;}
      b.doors=Math.max(0,b.doors-dt*2);if(b.doors>0)continue;
      const t=routePoints[b.target],dx=t.x-b.x,dy=t.y-b.y,d=Math.hypot(dx,dy),heading=Math.atan2(dy,dx);
      const turn=Math.atan2(Math.sin(heading-b.heading),Math.cos(heading-b.heading));
      if(Math.abs(turn)>.02){b.heading+=Math.sign(turn)*Math.min(Math.abs(turn),dt*1.3);b.speed=0;continue;}
      const blocked=hazards.some(p=>p.busId!==b.id&&Math.hypot(p.x-b.x,p.y-b.y)>4&&Math.hypot(p.x-(b.x+Math.cos(heading)*7),p.y-(b.y+Math.sin(heading)*7))<2.5);
      const desired=blocked?0:Math.min(13,Math.sqrt(4*d));b.speed=Math.max(0,Math.min(desired,b.speed+dt*2));
      const move=Math.min(d,b.speed*dt);if(d>.001){b.x+=dx/d*move;b.y+=dy/d*move;b.heading=heading;}
      if(d<.07||move===d){b.x=t.x;b.y=t.y;b.target=(b.target+1)%routePoints.length;b.speed=0;if(t.name){b.wait=14;b.stop=t.name;}}
    }
  }

  // Pavement circuits around city blocks. Lane offsets keep opposing cars apart.
  const blocks=[[-45,-27,-34,-70],[-27,0,-34,-88],[0,27,-34,-88],[27,45,-52,-106],[-45,-27,-121,-175],[0,27,-139,-193],[-27,0,-271,-325],[0,27,-289,-343]];
  function route(block,inset){const [l,r,t,b]=block;return [{x:l+inset,y:t-inset},{x:r-inset,y:t-inset},{x:r-inset,y:b+inset},{x:l+inset,y:b+inset}];}
  function at(path,d){const lengths=path.map((p,i)=>Math.hypot(p.x-path[(i+1)%4].x,p.y-path[(i+1)%4].y)),total=lengths.reduce((a,b)=>a+b,0);d=((d%total)+total)%total;for(let i=0;i<4;i++){if(d<=lengths[i]){const a=path[i],b=path[(i+1)%4],t=d/lengths[i];return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,heading:Math.atan2(b.y-a.y,b.x-a.x)};}d-=lengths[i];}}
  for(let i=0;i<blocks.length;i++){
    const path=route(blocks[i],1.3);cars.push({id:'traffic-'+i,path,distance:8+i*7,model:models[i%models.length],speed:0,wait:0,...at(path,8+i*7)});
    for(let n=0;n<3;n++){const path=route(blocks[i],3.15),distance=5+n*13;walkers.push({id:'citizen-'+i+'-'+n,path,distance,species:['cat','rabbit','bear','fox'][(i+n)%4],phase:i+n,wait:0,moving:false,...at(path,distance)});}
  }
  function tick(dt,player,playerCar,onlinePlayers=[]){
    const hazards=[...onlinePlayers.map(p=>({...p,r:p.car?3:1})),...(player?[{...player,r:1}]:[]),...(playerCar?[{...playerCar,r:3}]:[])];
    tickBuses(dt,[...hazards,...buses]);
    for(const car of cars){
      const ahead={x:car.x+Math.cos(car.heading)*5,y:car.y+Math.sin(car.heading)*5};
      const blocked=hazards.some(o=>Math.hypot(ahead.x-o.x,ahead.y-o.y)<o.r+1.5)||cars.some(o=>{
        if(o===car)return false;const dx=o.x-car.x,dy=o.y-car.y;
        const forward=dx*Math.cos(car.heading)+dy*Math.sin(car.heading),side=-dx*Math.sin(car.heading)+dy*Math.cos(car.heading);
        return forward>0&&forward<8&&Math.abs(side)<2.2&&(Math.cos(o.heading-car.heading)>.5||o.id<car.id);
      });
      const point=at(car.path,car.distance+2),corner=Math.abs(Math.sin(point.heading-car.heading))>.5;
      const desired=blocked?0:corner?3:7;
      car.speed=Math.max(0,Math.min(desired,car.speed+dt*3));car.distance+=car.speed*dt;Object.assign(car,at(car.path,car.distance));
    }
    for(const npc of walkers){
      npc.wait=Math.max(0,npc.wait-dt);
      const next=at(npc.path,npc.distance+1),blocked=hazards.some(o=>Math.hypot(next.x-o.x,next.y-o.y)<o.r+.65)||walkers.some(o=>o!==npc&&Math.hypot(next.x-o.x,next.y-o.y)<.65);
      npc.moving=!blocked&&npc.wait===0;
      if(npc.moving){const old=Math.floor(npc.distance/25);npc.distance+=dt*1.25;Object.assign(npc,at(npc.path,npc.distance));if(Math.floor(npc.distance/25)!==old)npc.wait=1.5+(npc.phase%3);}
    }
  }
  return {cars,walkers,buses,tick,snapshot(){return {buses:buses.map(b=>({...b})),cars:cars.map(({path,model,...p})=>({...p,model:model.id})),walkers:walkers.map(({path,...p})=>p)};},accept(state){for(const p of state.buses||[]){const b=buses.find(b=>b.id===p.id);if(b)Object.assign(b,p);}for(const p of state.cars||[]){const car=cars.find(c=>c.id===p.id);if(car)Object.assign(car,{...p,model:models.find(m=>m.id===p.model)||car.model});}for(const p of state.walkers||[]){const npc=walkers.find(n=>n.id===p.id);if(npc)Object.assign(npc,p);}}};
}

globalThis.createCityLife=createCityLife;
