function createCityLife(world, models){
  models=models.filter(m=>!m.kind);
  const cars=[],walkers=[];
  const lines=world.busLines||((world.busRoute||[]).length?[{id:'1',color:'#e0b657',route:world.busRoute,starts:[0,6]}]:[]);
  const buses=lines.flatMap(line=>line.starts.map((i,n)=>({id:line.id==='1'?'bus-'+n:'bus-'+line.id+'-'+n,x:line.route[i].x,y:line.route[i].y,heading:Math.atan2(line.route[i].y-line.route[(i+line.route.length-1)%line.route.length].y,line.route[i].x-line.route[(i+line.route.length-1)%line.route.length].x),target:(i+1)%line.route.length,speed:0,wait:14,doors:0,stop:line.route[i].name,stopId:line.route[i].stopId,line:line.id,color:line.color,departure:0,nextStop:line.route.slice(i+1).find(p=>p.name)?.name||line.route.find(p=>p.name).name})));
  function aheadBlocked(vehicle,others,distance){return others.some(p=>{if(p===vehicle||p.id===vehicle.id||p.busId===vehicle.id)return false;const dx=p.x-vehicle.x,dy=p.y-vehicle.y,forward=dx*Math.cos(vehicle.heading)+dy*Math.sin(vehicle.heading),side=-dx*Math.sin(vehicle.heading)+dy*Math.cos(vehicle.heading);return forward>0&&forward<distance&&Math.abs(side)<(p.vehicle||p.model||p.line?2.65:1.6);});}
  function tickBuses(dt,hazards){
    for(const b of buses){
      const routePoints=lines.find(l=>l.id===b.line).route;
      if(b.wait>0){if(b.wait<2&&hazards.some(p=>{const dx=p.x-b.x,dy=p.y-b.y,f=dx*Math.cos(b.heading)+dy*Math.sin(b.heading),side=-dx*Math.sin(b.heading)+dy*Math.cos(b.heading);return f>1.7&&f<3.6&&side>.9&&side<2.8;}))b.wait=2;b.speed=0;b.wait=Math.max(0,b.wait-dt);b.doors=Math.max(0,Math.min(1,b.doors+(b.wait>1?dt:-dt)*2));continue;}
      b.doors=Math.max(0,b.doors-dt*2);if(b.doors>0)continue;
      const t=routePoints[b.target],dx=t.x-b.x,dy=t.y-b.y,d=Math.hypot(dx,dy),heading=Math.atan2(dy,dx);
      const turn=Math.atan2(Math.sin(heading-b.heading),Math.cos(heading-b.heading));
      if(Math.abs(turn)>.02){b.heading+=Math.sign(turn)*Math.min(Math.abs(turn),dt*1.3);b.speed=0;continue;}
      const blocked=aheadBlocked(b,hazards,10.5+b.speed*.5);
      const desired=blocked?0:Math.min(13,Math.sqrt(4*d));b.speed=Math.max(0,Math.min(desired,b.speed+dt*2));
      const move=Math.min(d,b.speed*dt);if(d>.001){b.x+=dx/d*move;b.y+=dy/d*move;b.heading=heading;}
      if(d<.07||move===d){b.x=t.x;b.y=t.y;b.target=(b.target+1)%routePoints.length;b.speed=0;if(t.name){b.wait=14;b.stop=t.name;b.stopId=t.stopId;b.departure++;}b.nextStop=Array.from({length:routePoints.length},(_,i)=>routePoints[(b.target+i)%routePoints.length]).find(p=>p.name).name;}
    }
  }

  // Pavement circuits around city blocks. Lane offsets keep opposing cars apart.
  const blocks=[[-45,-27,-34,-70],[-27,0,-34,-88],[0,27,-34,-88],[27,45,-52,-106],[-45,-27,-121,-175],[0,27,-139,-193],[-27,0,-271,-325],[0,27,-289,-343]];
  function route(block,inset){const [l,r,t,b]=block;return [{x:l+inset,y:t-inset},{x:r-inset,y:t-inset},{x:r-inset,y:b+inset},{x:l+inset,y:b+inset}];}
  function at(path,d){const lengths=path.map((p,i)=>Math.hypot(p.x-path[(i+1)%4].x,p.y-path[(i+1)%4].y)),total=lengths.reduce((a,b)=>a+b,0);d=((d%total)+total)%total;for(let i=0;i<4;i++){if(d<=lengths[i]){const a=path[i],b=path[(i+1)%4],t=d/lengths[i];return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,heading:Math.atan2(b.y-a.y,b.x-a.x)};}d-=lengths[i];}}
  for(let i=0;i<blocks.length;i++){
    const path=route(blocks[i],-1.3);cars.push({id:'traffic-'+i,path,distance:8+i*7,model:models[i%models.length],speed:0,wait:0,...at(path,8+i*7)});
    for(let n=0;n<3;n++){const path=route(blocks[i],3.15),distance=5+n*13;walkers.push({id:'citizen-'+i+'-'+n,path,distance,species:['cat','rabbit','bear','fox'][(i+n)%4],phase:i+n,wait:0,moving:false,...at(path,distance)});}
  }
  const busPoint=(b,f,s)=>({x:b.x+Math.cos(b.heading)*f-Math.sin(b.heading)*s,y:b.y+Math.sin(b.heading)*f+Math.cos(b.heading)*s});
  const commuters=buses.map((b,i)=>({id:'citizen-passenger-'+i,species:['cat','rabbit','fox','bear'][i%4],phase:i,heading:b.heading,
    ...busPoint(b,-1,4),z:0,stopId:b.stopId,busId:null,stage:'waiting',cooldown:i%3*2,moving:false,seated:false,trips:0}));
  function tickCommuters(dt,players=[]){
    for(const npc of commuters){
      npc.moving=false;
      if(npc.stage==='waiting'){
        npc.cooldown=Math.max(0,npc.cooldown-dt);if(npc.cooldown>0)continue;
        const b=buses.find(b=>b.stopId===npc.stopId&&Math.hypot(b.x-npc.x,b.y-npc.y)<8&&b.wait>7&&b.doors>.95&&commuters.filter(p=>p.busId===b.id).length<4&&!commuters.some(p=>p.busId===b.id&&(p.stage!=='seated'||p.alightAt<=b.departure)));
        if(!b)continue;
        const occupied=[...commuters.filter(p=>p.busId===b.id).map(p=>p.seat),...players.filter(p=>p.busId===b.id).map(p=>p.busSeat)],seat=[0,1,2,3].find(i=>!occupied.includes(i));
        if(seat===undefined)continue;
        const dx=npc.x-b.x,dy=npc.y-b.y;
        Object.assign(npc,{busId:b.id,stage:'boarding',seat,f:dx*Math.cos(b.heading)+dy*Math.sin(b.heading),s:-dx*Math.sin(b.heading)+dy*Math.cos(b.heading),alightAt:b.departure+1+npc.phase%3,leg:0});
        npc.path=[{f:2.6,s:3.1},{f:2.6,s:0},{f:-1-Math.floor(seat/2)*2,s:0},{f:-1-Math.floor(seat/2)*2,s:seat%2?.95:-.95}];
      }
      const b=buses.find(b=>b.id===npc.busId);if(!b)continue;
      if(npc.stage==='seated'&&b.departure>=npc.alightAt&&b.wait>0&&b.doors>.95&&!commuters.some(p=>p!==npc&&p.busId===b.id&&p.stage!=='seated')){
        npc.stage='exiting';npc.seated=false;npc.leg=0;npc.path=[{f:npc.f,s:0},{f:2.6,s:0},{f:2.6,s:3.1},{f:1,s:4}];
      }
      if(npc.stage==='boarding'||npc.stage==='exiting'){
        const target=npc.path[npc.leg],df=target.f-npc.f,ds=target.s-npc.s,d=Math.hypot(df,ds),move=Math.min(d,dt*1.6);
        if(d>.001){npc.f+=df/d*move;npc.s+=ds/d*move;npc.heading=b.heading+Math.atan2(ds,df);npc.moving=true;}
        npc.z=.45*Math.max(0,Math.min(1,(2.6-npc.s)/1.1));
        if(d<=move+.001){npc.leg++;if(npc.leg===npc.path.length){
          if(npc.stage==='boarding'){npc.stage='seated';npc.seated=true;npc.z=.45;}
          else{npc.stage='waiting';npc.busId=null;npc.stopId=b.stopId;npc.cooldown=18+npc.phase%5*7;npc.trips++;npc.z=0;}
          delete npc.path;npc.moving=false;
        }}
      }
      if(npc.seated)npc.heading=b.heading;
      Object.assign(npc,busPoint(b,npc.f,npc.s));
    }
  }
  function tick(dt,player,playerCar,onlinePlayers=[]){
    const hazards=[...onlinePlayers.flatMap(p=>[{...p,r:p.car?3:1},...(['compact','roadster','pickup'].includes(p.vehicle?.model)?[{...p.vehicle,id:'vehicle-'+p.id,vehicle:true,r:3}]:[])]),...(player?[{...player,r:1}]:[]),...(playerCar?[{...playerCar,r:3}]:[])];
    for(const b of buses)if(commuters.some(p=>p.busId===b.id&&(p.stage==='boarding'||p.stage==='exiting')))b.wait=Math.max(b.wait,2.5);
    tickBuses(dt,[...hazards,...buses,...cars]);
    tickCommuters(dt,[...onlinePlayers,...(player?[player]:[])]);
    for(const car of cars){
      const ahead={x:car.x+Math.cos(car.heading)*5,y:car.y+Math.sin(car.heading)*5};
      const blocked=aheadBlocked(car,buses,8)||hazards.some(o=>Math.hypot(ahead.x-o.x,ahead.y-o.y)<o.r+1.5)||cars.some(o=>{
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
  return {cars,walkers,buses,commuters,tick,snapshot(){return {commuters:commuters.map(p=>({...p,path:p.path?.map(q=>({...q}))})),buses:buses.map(b=>({...b})),cars:cars.map(({path,model,...p})=>({...p,model:model.id})),walkers:walkers.map(({path,...p})=>p)};},accept(state){for(const p of state.commuters||[]){const npc=commuters.find(n=>n.id===p.id);if(npc)Object.assign(npc,p);}if(Array.isArray(state.buses)){const incoming=new Map(state.buses.map(p=>[p.id,p]));for(let i=buses.length-1;i>=0;i--)if(!incoming.has(buses[i].id))buses.splice(i,1);for(const [id,p] of incoming){let b=buses.find(b=>b.id===id);if(!b&&lines.some(l=>l.id===p.line)){b={};buses.push(b);}if(b)Object.assign(b,p);}}for(const p of state.cars||[]){const car=cars.find(c=>c.id===p.id);if(car)Object.assign(car,{...p,model:models.find(m=>m.id===p.model)||car.model});}for(const p of state.walkers||[]){const npc=walkers.find(n=>n.id===p.id);if(npc)Object.assign(npc,p);}}};
}

globalThis.createCityLife=createCityLife;
