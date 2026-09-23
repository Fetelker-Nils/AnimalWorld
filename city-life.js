function createCityLife(world, models){
  models=models.filter(m=>!m.kind);
  const cars=[],walkers=[];
  const lines=world.busLines||((world.busRoute||[]).length?[{id:'1',color:'#e0b657',route:world.busRoute,starts:[0,6]}]:[]);
  const buses=lines.flatMap(line=>line.starts.map((i,n)=>({id:line.id==='1'?'bus-'+n:'bus-'+line.id+'-'+n,x:line.route[i].x,y:line.route[i].y,heading:Math.atan2(line.route[i].y-line.route[(i+line.route.length-1)%line.route.length].y,line.route[i].x-line.route[(i+line.route.length-1)%line.route.length].x),target:(i+1)%line.route.length,speed:0,wait:14,doors:0,terminal:!!line.route[i].terminal,stop:line.route[i].name,stopId:line.route[i].stopId,line:line.id,color:line.color,departure:0,nextStop:line.route.slice(i+1).find(p=>p.name)?.name||line.route.find(p=>p.name).name})));
  function nextTerminal(b){const route=lines.find(l=>l.id===b.line).route;return !!Array.from({length:route.length},(_,i)=>route[(b.target+i)%route.length]).find(p=>p.name)?.terminal;}
  for(const b of buses)b.nextTerminal=nextTerminal(b);
  function aheadBlocked(vehicle,others,distance){return others.some(p=>{if(p===vehicle||p.id===vehicle.id||p.busId===vehicle.id)return false;const dx=p.x-vehicle.x,dy=p.y-vehicle.y,forward=dx*Math.cos(vehicle.heading)+dy*Math.sin(vehicle.heading),side=-dx*Math.sin(vehicle.heading)+dy*Math.cos(vehicle.heading);return forward>0&&forward<distance&&Math.abs(side)<(p.vehicle||p.model||p.line?2.65:1.6);});}
  function tickBuses(dt,hazards){
    for(const b of buses){
      const routePoints=lines.find(l=>l.id===b.line).route;
      if(b.wait>0){if(b.wait<2&&hazards.some(p=>{const dx=p.x-b.x,dy=p.y-b.y,f=dx*Math.cos(b.heading)+dy*Math.sin(b.heading),side=-dx*Math.sin(b.heading)+dy*Math.cos(b.heading);return f>1.7&&f<3.6&&side>.9&&side<2.8;}))b.wait=2;b.speed=0;b.wait=Math.max(0,b.wait-dt);b.doors=Math.max(0,Math.min(1,b.doors+(b.wait>1?dt:-dt)*2));continue;}
      b.doors=Math.max(0,b.doors-dt*2);if(b.doors>0)continue;
      const t=routePoints[b.target],dx=t.x-b.x,dy=t.y-b.y,d=Math.hypot(dx,dy),heading=Math.atan2(dy,dx);
      const turn=Math.atan2(Math.sin(heading-b.heading),Math.cos(heading-b.heading));
      if(Math.abs(turn)>.02){b.heading+=Math.sign(turn)*Math.min(Math.abs(turn),dt*1.3);b.speed=0;continue;}
      const blocked=aheadBlocked(b,roadHazards(b,hazards),10.5+b.speed*.5);
      const desired=blocked?0:Math.min(13,Math.sqrt(4*d));b.speed=Math.max(0,Math.min(desired,b.speed+dt*2));
      const move=Math.min(d,b.speed*dt);if(d>.001){b.x+=dx/d*move;b.y+=dy/d*move;b.heading=heading;}
      if(d<.07||move===d){b.x=t.x;b.y=t.y;b.target=(b.target+1)%routePoints.length;b.speed=0;if(t.name){b.wait=14;b.stop=t.name;b.stopId=t.stopId;b.terminal=!!t.terminal;b.departure++;}b.nextStop=Array.from({length:routePoints.length},(_,i)=>routePoints[(b.target+i)%routePoints.length]).find(p=>p.name).name;b.nextTerminal=nextTerminal(b);}
    }
  }

  const railPaths=(world.railLines||[]).map(line=>{
    let length=0;const points=line.route.map((p,i)=>{const a=line.route[(i+line.route.length-1)%line.route.length];if(i)length+=Math.hypot(p.x-a.x,p.y-a.y);return {...p,distance:length};});
    const last=points.at(-1),first=points[0];length+=Math.hypot(last.x-first.x,last.y-first.y);
    return {...line,points,length};
  });
  function railAt(path,distance){
    const d=((distance%path.length)+path.length)%path.length;
    for(let i=0;i<path.points.length;i++){
      const a=path.points[i],b=path.points[(i+1)%path.points.length],end=i===path.points.length-1?path.length:b.distance;
      if(d<=end&&end>a.distance){const t=(d-a.distance)/(end-a.distance);return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,heading:Math.atan2(b.y-a.y,b.x-a.x)};}
    }
    return {...path.points[0],heading:0};
  }
  const railServices=railPaths.flatMap(path=>path.starts.map((start,i)=>{
    const point=path.points[start],stops=path.points.filter(p=>p.name),index=stops.indexOf(point);
    return {id:path.id+'-'+i,path,distance:point.distance,speed:0,wait:60,doors:0,departure:0,stop:point.name,stopId:point.stopId,terminal:!!point.terminal,next:stops[(index+1)%stops.length]};
  }));
  const trains=railServices.flatMap(t=>Array.from({length:3},(_,coach)=>({id:'train-'+t.id+'-'+coach,service:t.id,coach,kind:'train',trainType:t.path.type||'R',line:t.path.id,color:t.path.color,scaleF:2.1,scaleS:1.35,scaleZ:1.35})));
  function syncTrains(){for(const b of trains){const t=railServices.find(t=>t.id===b.service);Object.assign(b,railAt(t.path,t.distance-b.coach*21),{speed:t.speed,wait:t.wait,doors:t.doors,departure:t.departure,stop:t.stop,stopId:t.stopId,terminal:t.terminal,nextStop:t.next.name,nextTerminal:!!t.next.terminal});}}
  syncTrains();
  function tickTrains(dt,people,obstacles=[]){
    const brake=8,nose=10,safety=2;
    function clearance(t){
      const look=nose+safety+t.speed*t.speed/(2*brake)+t.speed*.3+5,origin=railAt(t.path,t.distance);
      const ownCoaches=new Set(trains.filter(b=>b.service===t.id).map(b=>b.id));
      const candidates=obstacles.filter(p=>p.service!==t.id&&!ownCoaches.has(p.busId)&&(!p.room||p.room==='world')&&(p.z||p.jump||0)<5&&Math.hypot(p.x-origin.x,p.y-origin.y)<look+25);
      for(let d=0;d<=look;d+=2){const q=railAt(t.path,t.distance+d);
        for(const p of candidates){const heading=p.heading||0,dx=q.x-p.x,dy=q.y-p.y,f=dx*Math.cos(heading)+dy*Math.sin(heading),side=-dx*Math.sin(heading)+dy*Math.cos(heading);
          const length=p.kind==='train'?20:p.line?10:(p.model?.length||(p.vehicle?5:1));
          const width=p.kind==='train'?4.4:p.line?3.5:(p.model?.width||(p.vehicle?2.5:1));
          if(Math.abs(f)<length/2+2.6&&Math.abs(side)<width/2+2.6)return Math.max(0,d-nose-safety);
        }
      }return Infinity;
    }

    for(const t of railServices){
      if(t.wait>0){
        const blocked=people.some(p=>{const b=trains.find(b=>b.service===t.id&&b.id===p.busId);if(!b)return false;const dx=p.x-b.x,dy=p.y-b.y,f=(dx*Math.cos(b.heading)+dy*Math.sin(b.heading))/b.scaleF,s=(-dx*Math.sin(b.heading)+dy*Math.cos(b.heading))/b.scaleS;return f>1.7&&f<3.6&&s>.9&&s<2.8;});
        if(blocked&&t.wait<2)t.wait=2;t.speed=0;t.wait=Math.max(0,t.wait-dt);t.doors=Math.max(0,Math.min(1,t.doors+(t.wait>1?dt:-dt)*2));continue;
      }
      t.doors=Math.max(0,t.doors-dt*2);if(t.doors>0)continue;
      const remaining=(t.next.distance-t.distance+t.path.length)%t.path.length;
      const free=clearance(t),safeSpeed=Math.sqrt(2*brake*free);
      t.speed=Math.min(t.path.speed||48,t.speed+dt*(t.path.acceleration||3),Math.sqrt(3*remaining),safeSpeed);
      if(free<.1)t.speed=0;
      const move=Math.min(remaining,free,t.speed*dt);t.distance=(t.distance+move)%t.path.length;
      if(remaining<.05||move===remaining){t.distance=t.next.distance;t.stop=t.next.name;t.stopId=t.next.stopId;t.terminal=!!t.next.terminal;t.wait=t.path.dwell||24;t.speed=0;t.departure++;
        const stops=t.path.points.filter(p=>p.name);t.next=stops[(stops.indexOf(t.next)+1)%stops.length];}
    }
    syncTrains();
  }
  const crossings=(world.crossings||[]).map(c=>({...c,closed:false,gate:0}));
  const crossingPassages=new Map(crossings.map(c=>[c.id,railPaths.flatMap(path=>path.points.flatMap((a,i)=>{
    const b=path.points[(i+1)%path.points.length],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),t=((c.x-a.x)*dx+(c.y-a.y)*dy)/(length*length||1);
    return t>=0&&t<=1&&Math.hypot(c.x-a.x-dx*t,c.y-a.y-dy*t)<4?[{path:path.id,distance:a.distance+t*length}]:[];
  }))]));
  // Nearby gates on the same road form one crossing area. Once inside,
  // road traffic must be able to clear its exit instead of stopping on rails.
  const crossingGroups=[];
  for(const c of [...crossings].sort((a,b)=>(a.vertical?a.y:a.x)-(b.vertical?b.y:b.x))){
    const axis=c.vertical?c.y:c.x,lane=c.vertical?c.x:c.y;
    let group=crossingGroups.find(g=>g.vertical===c.vertical&&Math.abs(g.lane-lane)<3&&axis-g.max<40&&axis>=g.min-40);
    if(!group){group={vertical:c.vertical,lane,min:axis,max:axis};crossingGroups.push(group);}else{group.min=Math.min(group.min,axis);group.max=Math.max(group.max,axis);}c.group=group;
  }
  function roadHazards(vehicle,hazards){
    return hazards.filter(h=>{
      if(!h.crossing)return true;
      const g=h.crossing.group,axis=g.vertical?vehicle.y:vehicle.x,lane=g.vertical?vehicle.x:vehicle.y;
      return !(Math.abs(lane-g.lane)<h.crossing.width/2+2&&axis>g.min-9&&axis<g.max+9);
    });
  }
  function tickCrossings(dt){
    for(const c of crossings){
      c.closed=crossingPassages.get(c.id).some(p=>railServices.some(t=>{
        if(t.path.id!==p.path)return false;
        const ahead=(p.distance-t.distance+t.path.length)%t.path.length,behind=(t.distance-p.distance+t.path.length)%t.path.length;
        return behind<65||ahead<20||t.wait<6&&ahead<Math.max(45,t.speed*7);
      }));
      c.gate=Math.max(0,Math.min(1,c.gate+(c.closed?dt:-dt)/2));
    }
  }
  function crossingBlocked(x,y,radius=.5){return crossings.some(c=>c.gate>.15&&[-1,1].some(side=>{
    const along=c.vertical?y-c.y:x-c.x,across=c.vertical?x-c.x:y-c.y;
    return Math.abs(along-side*9)<.3+radius&&Math.abs(across)<c.width/2+radius;
  }));}
  function crossingHazards(){return crossings.flatMap(c=>c.closed?[-1,1].flatMap(side=>Array.from({length:Math.ceil(c.width/2)+1},(_,i)=>({id:c.id+'-'+side+'-'+i,crossing:c,x:c.x+(c.vertical?-c.width/2+i*2:side*9),y:c.y+(c.vertical?side*9:-c.width/2+i*2),r:1.5}))):[]);}
  // Pavement circuits around city blocks. Lane offsets keep opposing cars apart.
  const blocks=[[-45,-27,-34,-70],[-27,0,-34,-88],[0,27,-34,-88],[27,45,-52,-106],[-45,-27,-121,-175],[0,27,-139,-193],[-27,0,-271,-325],[0,27,-289,-343]];
  for(const town of world.towns||[])blocks.push([town.x-22,town.x,town.y+12,town.y-11]);
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
        Object.assign(npc,{busId:b.id,stage:'boarding',seat,f:dx*Math.cos(b.heading)+dy*Math.sin(b.heading),s:-dx*Math.sin(b.heading)+dy*Math.cos(b.heading),alightAt:b.departure+1+npc.phase%3,boardedAt:b.departure,leg:0});
        npc.path=[{f:2.6,s:3.1},{f:2.6,s:0},{f:-1-Math.floor(seat/2)*2,s:0},{f:-1-Math.floor(seat/2)*2,s:seat%2?.95:-.95}];
      }
      const b=buses.find(b=>b.id===npc.busId);if(!b)continue;
      if(npc.stage==='seated'&&(b.departure>=npc.alightAt||b.terminal&&b.departure>npc.boardedAt)&&b.wait>0&&b.doors>.95&&!commuters.some(p=>p!==npc&&p.busId===b.id&&p.stage!=='seated')){
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
    tickCrossings(dt);
    const hazards=[...crossingHazards(),...onlinePlayers.flatMap(p=>[{...p,r:p.car?3:1},...(['compact','roadster','pickup'].includes(p.vehicle?.model)?[{...p.vehicle,id:'vehicle-'+p.id,vehicle:true,r:3}]:[])]),...(player?[{...player,r:1}]:[]),...(playerCar?[{...playerCar,r:3}]:[])];
    for(const b of buses)if(commuters.some(p=>p.busId===b.id&&(p.stage==='boarding'||p.stage==='exiting')))b.wait=Math.max(b.wait,2.5);
    tickBuses(dt,[...hazards,...buses,...cars]);
    tickTrains(dt,[...onlinePlayers,...(player?[player]:[])],[...onlinePlayers,...onlinePlayers.filter(p=>p.vehicle).map(p=>({...p.vehicle,vehicle:true})),...(player?[player]:[]),...(playerCar?[playerCar]:[]),...cars,...walkers,...commuters,...buses,...trains]);
    tickCommuters(dt,[...onlinePlayers,...(player?[player]:[])]);
    for(const car of cars){
      const ahead={x:car.x+Math.cos(car.heading)*5,y:car.y+Math.sin(car.heading)*5};
      const blocked=aheadBlocked(car,buses,8)||roadHazards(car,hazards).some(o=>Math.hypot(ahead.x-o.x,ahead.y-o.y)<o.r+1.5)||cars.some(o=>{
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
  return {crossings,crossingBlocked,cars,walkers,buses,trains,commuters,tick,snapshot(){return {crossings:crossings.map(({id,closed,gate})=>({id,closed,gate})),railServices:railServices.map(({path,next,...t})=>({...t,nextIndex:path.points.indexOf(next)})),trains:trains.map(p=>({...p})),commuters:commuters.map(p=>({...p,path:p.path?.map(q=>({...q}))})),buses:buses.map(b=>({...b})),cars:cars.map(({path,model,...p})=>({...p,model:model.id})),walkers:walkers.map(({path,...p})=>p)};},accept(state){for(const p of state.crossings||[]){const c=crossings.find(c=>c.id===p.id);if(c)Object.assign(c,p);}for(const p of state.railServices||[]){const t=railServices.find(t=>t.id===p.id);if(t){const {nextIndex,...values}=p;Object.assign(t,values);t.next=t.path.points[nextIndex]||t.next;}}for(const p of state.trains||[]){const t=trains.find(t=>t.id===p.id);if(t)Object.assign(t,p);}for(const p of state.commuters||[]){const npc=commuters.find(n=>n.id===p.id);if(npc)Object.assign(npc,p);}if(Array.isArray(state.buses)){const incoming=new Map(state.buses.map(p=>[p.id,p]));for(let i=buses.length-1;i>=0;i--)if(!incoming.has(buses[i].id))buses.splice(i,1);for(const [id,p] of incoming){let b=buses.find(b=>b.id===id);if(!b&&lines.some(l=>l.id===p.line)){b={};buses.push(b);}if(b)Object.assign(b,p);}}for(const p of state.cars||[]){const car=cars.find(c=>c.id===p.id);if(car)Object.assign(car,{...p,model:models.find(m=>m.id===p.model)||car.model});}for(const p of state.walkers||[]){const npc=walkers.find(n=>n.id===p.id);if(npc)Object.assign(npc,p);}}};
}

globalThis.createCityLife=createCityLife;
