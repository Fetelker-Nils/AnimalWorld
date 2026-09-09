function createCityLife(world, models){
  const cars=[],walkers=[];
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
  return {cars,walkers,tick,snapshot(){return {cars:cars.map(({path,model,...p})=>({...p,model:model.id})),walkers:walkers.map(({path,...p})=>p)};},accept(state){for(const p of state.cars||[]){const car=cars.find(c=>c.id===p.id);if(car)Object.assign(car,{...p,model:models.find(m=>m.id===p.model)||car.model});}for(const p of state.walkers||[]){const npc=walkers.find(n=>n.id===p.id);if(npc)Object.assign(npc,p);}}};
}

globalThis.createCityLife=createCityLife;
