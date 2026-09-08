(() => {
  'use strict';
  const canvas = document.querySelector('#world'), ctx = canvas.getContext('2d');
  const keys = new Set();
  const stick={x:0,y:0,id:null};
  let touchDevice=!!window.matchMedia?.('(any-pointer: coarse)').matches||(typeof navigator!=='undefined'&&navigator.maxTouchPoints>0);
  let celebration=0;
  const motes=[];
  function resetStick(){stick.x=stick.y=0;stick.id=null;const knob=document.querySelector('#joystick-knob');if(knob.style)knob.style.transform='translate(0px,0px)';}

  const mauz = { x: 0, y: 0, jump: 0, vz: 0, face: 1, heading: -Math.PI / 2, moving: false };
  const camera = { x: 0, y: 0, z:0, heading: mauz.heading };
  let width, height, scale, cx, cy, time = 0, last = 0, destination = null;
  let mode = 'start';
  let storage;
  try { storage=window.localStorage; } catch { storage={getItem(){throw Error('Storage unavailable');},setItem(){throw Error('Storage unavailable');}}; }
  const job=createDeliveryJob(storage,Island);
  const activities=createActivities(Island,job);
  const vehicles=createVehicles(Island,walkable);
  let currentBooth=null,currentHome=null;
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
    {x:-8,y:-10.4,w:3.8,d:.3,h:1.5,color:'#ad855e'},
    {x:-4,y:-10.5,w:1.8,d:2,h:2.8,color:'#bda27e'}, // wardrobe
    {x:9.5,y:-9,w:2.6,d:4.5,h:.9,color:'#e6eeea'}, // bath
    {x:9.5,y:-9,w:1.9,d:3.8,h:.92,color:'#9acbd3'},
    {x:4.5,y:-10,w:1.5,d:1.7,h:.65,color:'#edf2eb'}, // toilet
    {x:4.5,y:-10.7,w:1.5,d:.45,h:1.5,color:'#edf2eb'},
    {x:5,y:-3,w:2.4,d:1.1,h:1.2,color:'#a7bdb4'}, // basin
    {x:5,y:-3,w:1.7,d:.8,h:1.25,color:'#edf4ec'}
  ];
  function indoorWalkable(x,y){
    return Math.abs(x)<11.5&&Math.abs(y)<11.5&&![...insideWalls,...furnishings].some(b=>Math.abs(x-b.x)<b.w/2+.35&&Math.abs(y-b.y)<b.d/2+.35);
  }
  function roomName(){return Math.abs(mauz.x)<2?'Flur':mauz.x<0?(mauz.y>0?'Wohnzimmer':'Schlafzimmer'):(mauz.y>0?'Küche':'Badezimmer');}
  function enterHome(){
    if(mode!=='home'||!currentHome||!job.ownedHomes.includes(currentHome.id)||vehicles.driving||Math.hypot(mauz.x-currentHome.x,mauz.y-currentHome.y)>2.6)return false;
    interior=currentHome;
    moveToDoor(0,8.5,-Math.PI/2);
    setMode('playing');return true;
  }
  function moveToDoor(x,y,heading){
    Object.assign(mauz,{x,y,heading,jump:0,vz:0,moving:false});
    Object.assign(camera,{x,y,z:0,heading});keys.clear();destination=null;
  }
  function leaveHome(){
    if(!interior||Math.hypot(mauz.x,mauz.y-10)>2)return false;
    const home=interior;interior=null;moveToDoor(home.x,home.y,Math.PI/2);updateJobUI();return true;
  }
  const mapView={x:0,y:0,zoom:1};
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
  const treeIndex=spatialIndex(trees),grassIndex=spatialIndex(grass);
  const stones=Array.from({length:100},()=>({x:random()*460-230,y:random()*460-230,size:.6+random()*.7})).filter(t=>Math.hypot(t.x,t.y)<230&&!Island.blocked(t.x,t.y)&&!Island.reserved(t.x,t.y));
  const balls=[{x:3,y:-4,vx:0,vy:0,color:'#e5a45d'},{x:5,y:4,vx:0,vy:0,color:'#89bbc1'},{x:-4,y:3,vx:0,vy:0,color:'#df9291'}];
  function visible(x,y,margin=180){const p=point(x,y);return p.depth>1&&p.x>-margin&&p.x<width+margin&&p.y>-margin&&p.y<height+margin;}
  function buildingVisible(b){
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
  function walkable(x,y){if(interior)return indoorWalkable(x,y);return !Island.blocked(x,y)&&!treeIndex.near(x,y,2).some(t=>Math.hypot(x-t.x,y-t.y)<.65)&&!Island.booths.some(b=>Math.hypot(x-b.x,y-b.y)<.7);}
  function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);scale=Math.min(width*.85,height*1.05);cx=width*.5;cy=height*.43;}
  // A perspective camera seven world units behind Mauz, three units high,
  // tilted down by only seven degrees.
  let cameraDistance=7, cameraHeight=3;
  const pitch=.12;
  function point(x,y,z=Island.heightAt(x,y)){
    const dx=x-camera.x,dy=y-camera.y;
    const right=-dx*Math.sin(camera.heading)+dy*Math.cos(camera.heading);
    const forward=dx*Math.cos(camera.heading)+dy*Math.sin(camera.heading)+cameraDistance;
    const up=z-cameraHeight-camera.z;
    const depth=forward*Math.cos(pitch)-up*Math.sin(pitch);
    const vertical=up*Math.cos(pitch)+forward*Math.sin(pitch);
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
    const solids=[...insideWalls,...furnishings.filter(b=>b.h>1.5)];
    for(let distance=.1;distance<=4.5;distance+=.05){
      const px=x-Math.cos(heading)*distance,py=y-Math.sin(heading)*distance;
      if(Math.abs(px)>11.7||Math.abs(py)>11.7||solids.some(b=>Math.abs(px-b.x)<b.w/2+.25&&Math.abs(py-b.y)<b.d/2+.25))return Math.max(.1,distance-.05);
    }
    return 4.5;
  }
  function resolveIndoorCamera(){
    if(!interior)return;
    camera.x=mauz.x;camera.y=mauz.y;camera.z=0;
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
    for(const building of Island.buildings)test({...building,h:building.h+(building.city?0:2.5)});
    for(const booth of Island.booths)test({...booth,w:1.3,d:1.3,h:2.7});
    const range=Math.hypot(b.x-a.x,b.y-a.y);
    for(const tree of treeIndex.near((a.x+b.x)/2,(a.y+b.y)/2,range/2+10)){
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
  function outdoorCameraLimit(x,y,heading,distance,height){
    const a={x,y,z:Island.heightAt(x,y)+height};
    const b={x:x-Math.cos(heading)*distance,y:y-Math.sin(heading)*distance,z:a.z};
    const hit=outdoorHit(a,b,.3);return hit===1?distance:Math.max(.1,distance*hit-.05);
  }
  function resolveOutdoorCamera(){
    if(interior)return;
    // Anchor the collision sweep to Mauz, so smoothing cannot carry the camera through a corner.
    camera.x=mauz.x;camera.y=mauz.y;camera.z=Island.heightAt(mauz.x,mauz.y);
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
    camera.z+=(Island.heightAt(mauz.x,mauz.y)-camera.z)*blend;
    const angle=Math.atan2(Math.sin(mauz.heading-camera.heading),Math.cos(mauz.heading-camera.heading));
    camera.heading+=angle*(1-Math.exp(-7*dt));
    resolveIndoorCamera();resolveOutdoorCamera();
  }
  function polygon(points,color){
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
  function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
  function tree(t){const p=point(t.x,t.y);ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale/p.depth/28*t.size,scale/p.depth/28*t.size);ellipse(8,7,30,11,'#3e652329');ctx.fillStyle='#987551';ctx.fillRect(-5,-58,10,59);polygon([{x:-3,y:-25},{x:-18,y:-45},{x:-13,y:-47},{x:3,y:-33}],'#987551');ellipse(0,-65,33,39,'#659047');ellipse(-18,-60,23,27,'#739c50');ellipse(17,-66,23,29,'#71974b');ellipse(-7,-82,25,27,'#87aa5a');ellipse(-13,-88,16,15,'#94b765');ctx.restore();}
  function cat(){if(vehicles.driving||(!interior&&cameraDistance<1.5))return;const p=point(mauz.x,mauz.y);const bounce=celebration>0?-Math.abs(Math.sin(celebration*15))*7:mauz.moving?Math.sin(time*14)*1.7:Math.sin(time*2)*.7;const s=scale/p.depth/43;ellipse(p.x,p.y+4*s,17*s,7*s,'#35571c35');ctx.save();ctx.translate(p.x,point(mauz.x,mauz.y,Island.heightAt(mauz.x,mauz.y)+mauz.jump).y);ctx.scale(s,s);ctx.save();ctx.scale(mauz.face,1);ctx.strokeStyle='#b8763d';ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-9,-14);ctx.bezierCurveTo(-33,-12,-32,-29,-25,-30);ctx.stroke();const stride=mauz.moving?Math.sin(time*14)*4:0;ellipse(-7,-3+stride,5,7,'#bb7e42');ellipse(7,-3-stride,5,7,'#d69b51');ellipse(0,-18+bounce,13,17,'#e5aa60');ctx.translate(0,bounce);polygon([{x:-16,y:-36},{x:-15,y:-58},{x:-2,y:-46}],'#d99a52');polygon([{x:4,y:-46},{x:17,y:-57},{x:18,y:-34}],'#e5aa60');polygon([{x:-12,y:-43},{x:-12,y:-52},{x:-6,y:-45}],'#e9b0a0');polygon([{x:8,y:-45},{x:14,y:-52},{x:14,y:-42}],'#edbaaa');ellipse(1,-36,19,16,'#edb66d');ctx.strokeStyle='#c88b46';ctx.lineWidth=3;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*6,-49);ctx.lineTo(i*5,-43);ctx.stroke();}ctx.fillStyle='#6c947b';ctx.fillRect(-9,-22,19,4);
    if(job.active){ctx.fillStyle='#b5824e';ctx.fillRect(-11,-23,22,19);ctx.fillStyle='#edcb88';ctx.fillRect(-2,-23,4,19);}
ctx.restore();ctx.restore();}

  function groundRect(x,y,w,d,color,z=0){polygon([point(x-w/2,y-d/2,z),point(x+w/2,y-d/2,z),point(x+w/2,y+d/2,z),point(x-w/2,y+d/2,z)],color);}
  function groundOval(x,y,rx,ry,color){polygon(Array.from({length:80},(_,i)=>{const a=i*Math.PI/40;return point(x+Math.cos(a)*rx,y+Math.sin(a)*ry);}),color);}
  function box(x,y,w,d,h,color,top){
    const corners=[[x-w/2,y-d/2],[x+w/2,y-d/2],[x+w/2,y+d/2],[x-w/2,y+d/2]];
    const faces=corners.map((a,i)=>{const b=corners[(i+1)%4];return {a,b,depth:-point((a[0]+b[0])/2,(a[1]+b[1])/2).depth};});
    faces.sort((a,b)=>a.depth-b.depth);
    for(const f of faces)polygon([point(...f.a),point(...f.b),point(...f.b,h),point(...f.a,h)],color);
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
    // Front door and windows belong to the world, so they turn with the camera.
    if(Math.sin(camera.heading)<0){
      const y=b.y+b.d/2+.01;
      polygon([point(b.x-.5,y),point(b.x+.5,y),point(b.x+.5,y,2.6),point(b.x-.5,y,2.6)],'#906f55');
      for(let z=2;z<b.h-1;z+=3)for(const x of [b.x-b.w*.3,b.x+b.w*.3])
        polygon([point(x-.7,y,z),point(x+.7,y,z),point(x+.7,y,z+1.4),point(x-.7,y,z+1.4)],'#e8f4ee');

    }
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
    const p=point(t.x,t.y,Island.heightAt(t.x,t.y)+2.6);
    if(p.depth<1||p.x<0||p.x>width||p.y<0||p.y>height||markerOccluded(t))return;
    const size=Math.max(5,Math.min(13,100/p.depth));
    polygon([{x:p.x,y:p.y+size},{x:p.x-size,y:p.y-size},{x:p.x+size,y:p.y-size}],color);
    if(Math.hypot(mauz.x-t.x,mauz.y-t.y)<40){
      ctx.font='600 12px Segoe UI';ctx.textAlign='center';ctx.fillStyle='#29453c';
      const w=ctx.measureText(label).width+18;ctx.fillStyle='#fffffff0';ctx.fillRect(p.x-w/2,p.y-34,w,21);ctx.fillStyle='#29453c';ctx.fillText(label,p.x,p.y-19);
    }
  }
  function carDrawing(car){
    const m=car.model,z=Island.heightAt(car.x,car.y),faces=[];
    const p=(side,forward,h)=>point(car.x+Math.cos(car.heading)*forward-Math.sin(car.heading)*side,car.y+Math.sin(car.heading)*forward+Math.cos(car.heading)*side,z+h);
    function part(s0,s1,f0,f1,h0,h1,color,top){
      const bottom=[[s0,f0,h0],[s1,f0,h0],[s1,f1,h0],[s0,f1,h0]],upper=bottom.map(v=>[v[0],v[1],h1]);
      const polygons=bottom.map((a,i)=>[a,bottom[(i+1)%4],upper[(i+1)%4],upper[i]]);polygons.push(upper);
      polygons.forEach((vertices,i)=>{const points=vertices.map(v=>p(...v));faces.push({points,depth:points.reduce((v,a)=>v+a.depth,0)/4,color:i===4?top:color});});
    }
    const w=m.width/2,l=m.length/2;
    part(-w,w,-l,l,.4,1.1,m.color,m.top);
    for(const side of [-1,1])for(const f of [-l*.64,l*.64])part(side*w-.17,side*w+.17,f-.36,f+.36,.12,.76,'#384543','#56615b');
    const rear=m.id==='pickup'?-.2:-.85,roof=m.id==='roadster'?1.65:1.95;
    part(-w*.8,w*.8,rear,.9,1.1,roof,'#678995','#a8c4c6');
    part(-w*.85,w*.85,rear-.07,.97,roof,roof+.12,m.color,m.top);
    if(m.id==='pickup')part(-w*.8,w*.8,-l+.12,-.35,1.11,1.16,'#586a57','#586a57');
    for(const side of [-1,1]){
      part(side*w*.7-.18,side*w*.7+.18,-l-.02,-l,.62,.9,'#cd6254','#cd6254');
      part(side*w*.7-.18,side*w*.7+.18,l,l+.02,.62,.9,'#f5e2ac','#f5e2ac');
    }
    if(vehicles.driving){part(-.5,-.14,rear-.02,rear-.01,1.28,1.63,'#e4ab64','#e4ab64');if(activities.passenger)part(.14,.5,rear-.02,rear-.01,1.28,1.63,'#d69ba7','#d69ba7');}
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
    for(const station of Island.jobs){
      if(visible(station.x,station.y))objects.push({depth:-point(station.x,station.y).depth,draw:()=>box(station.x,station.y,1,1,1.3,'#917db1','#c9bbda')});
      if(station.kind==='hold')station.points.forEach((p,i)=>{
        if(!visible(p.x,p.y))return;
        const done=activities.active===station&&activities.done.has(i);
        objects.push({depth:-point(p.x,p.y).depth,draw:()=>{
          if(station.id==='garden'){
            groundRect(p.x,p.y,3,2,done?'#638d57':'#b4a16d');
            for(const dx of [-.8,0,.8]){const q=point(p.x+dx,p.y,done?.8+Math.sin(time*3+dx)*.06:.4);ellipse(q.x,q.y,Math.max(2,scale/q.depth*.12),Math.max(2,scale/q.depth*.12),done?'#d9b9d8':'#e8cc82');}
          }else if(station.id==='fishing'){groundRect(p.x,p.y,1.5,2,'#ba9974');const fishing=activities.active===station&&(activities.progress>0||activities.challenge);const q=point(p.x,p.y,1.4+(fishing?Math.sin(time*9)*.2:0));ctx.strokeStyle='#86684b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(point(p.x,p.y).x,point(p.x,p.y).y);ctx.lineTo(q.x+12,q.y);ctx.stroke();if(fishing){const bob=point(p.x-1,p.y,.1+Math.abs(Math.sin(time*7))*.2);ctx.strokeStyle='#dbe9dc';ctx.beginPath();ctx.moveTo(q.x+12,q.y);ctx.lineTo(bob.x,bob.y);ctx.stroke();ellipse(bob.x,bob.y,4,3,'#e6ad61');}}else box(p.x,p.y,1.7,1.4,1,done?'#7aa480':station.id==='electric'?'#668aa3':'#83929c',done?'#b7cfac':'#b4bfc3');
        }});
      });
    }
    const active=activities.active;
    if(active?.kind==='collect')active.points.forEach((p,i)=>{if(!activities.done.has(i)&&visible(p.x,p.y))objects.push({depth:-point(p.x,p.y).depth,draw:()=>{if(active.id==='orchard'){const q=point(p.x,p.y,.6);ellipse(q.x,q.y,scale/q.depth*.35,scale/q.depth*.4,'#cf7760');}else if(active.id==='trail')box(p.x,p.y,.3,.3,1.5,'#bc994f','#e8d6a0');else box(p.x,p.y,.5,.6,.4,'#9a826f','#cbbfab');}});});
    if(active?.kind==='taxi'&&!activities.passenger){const p=active.points[0];if(visible(p.x,p.y))objects.push({depth:-point(p.x,p.y).depth,draw:()=>{box(p.x,p.y,.55,.5,1.1,'#a58fae','#cbb5cf');const q=point(p.x,p.y,1.35+Math.sin(time*3)*.05);ellipse(q.x,q.y,scale/q.depth*.25,scale/q.depth*.3,'#e4b795');const hand=point(p.x+.4,p.y,1.2+Math.sin(time*5)*.2);ctx.strokeStyle='#a58fae';ctx.lineWidth=Math.max(2,scale/q.depth*.1);ctx.beginPath();ctx.moveTo(q.x,q.y+scale/q.depth*.3);ctx.lineTo(hand.x,hand.y);ctx.stroke();ellipse(hand.x,hand.y,Math.max(2,scale/q.depth*.09),Math.max(2,scale/q.depth*.09),'#e4b795');}});}
    return objects;
  }
  let indoorRenderer;
  function drawInterior(){
    resolveIndoorCamera();
    indoorRenderer ||= createIndoorRenderer();
    const floors=[{x:0,y:0,w:24,d:24,color:'#c7ac86'},
      {x:0,y:0,w:24,d:24,z:3.3,color:'#eee9dc'},
      {x:-7,y:6,w:10,d:12,color:'#d8b88f'},{x:-7,y:-6,w:10,d:12,color:'#cfb08e'},
      {x:7,y:6,w:10,d:12,color:'#e2ddc7'},{x:7,y:-6,w:10,d:12,color:'#b9d3cd'}];
    for(let x=2;x<12;x++)for(let y=-12;y<12;y++)if((x+y)%2===0)floors.push({x:x+.5,y:y+.5,w:.96,d:.96,z:.01,color:y<0?'#cee1d9':'#f0ead9'});
    for(let y=-11;y<12;y+=.7)floors.push({x:-7,y,w:9.8,d:.025,z:.01,color:'#b69975'});
    floors.push({x:-8,y:5,w:5,d:4,z:.02,color:'#b7c6ad'},{x:0,y:9,w:2,d:2,z:.02,color:'#77958b'});
    const boxes=[...furnishings,...insideWalls.map(b=>({...b,h:3.3,color:'#e5dfce',top:'#f3eddc'}))];
    ctx.clearRect(0,0,width,height);ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,(cameraDistance-1.8)/1.2));cat();ctx.restore();
    indoorRenderer.render({width,height,scale,cx,cy,point,boxes,floors,sprite:canvas,catDepth:point(mauz.x,mauz.y).depth-.3});
    ctx.clearRect(0,0,width,height);ctx.drawImage(indoorRenderer.surface,0,0,width,height);
    if(Math.hypot(mauz.x,mauz.y-10)<4)marker({x:0,y:11},'Ausgang','#658e7e');
  }
  function draw(){
    if(interior){drawInterior();return;}
    resolveOutdoorCamera();
    ctx.clearRect(0,0,width,height);const sky=ctx.createLinearGradient(0,0,0,height);
    sky.addColorStop(0,'#a3d5e8');sky.addColorStop(1,'#e5f1e9');ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
    const horizon=cy-scale*Math.tan(pitch);
    ctx.fillStyle='#9bd0d5';ctx.fillRect(0,horizon,width,height-horizon);
    groundOval(0,0,Island.radius+5,Island.radius+5,'#b3dcd9');
    groundOval(0,0,Island.radius+1,Island.radius+1,'#e8dab0');
    groundOval(0,0,Island.radius-5,Island.radius-5,'#a7c875');
    for(const r of Island.roads)groundRect(r.x,r.y,r.w+1.3,r.d+1.3,'#d2cfba');
    for(const r of Island.roads)groundRect(r.x,r.y,r.w,r.d,r.w===3||r.d===3?'#e1d0a8':'#85928f');
    for(const r of Island.roads){
      if(r.w===3||r.d===3)continue;
      const vertical=r.d>r.w,length=vertical?r.d:r.w;
      for(let n=-length/2+2;n<length/2;n+=6)groundRect(r.x+(vertical?0:n),r.y+(vertical?n:0),vertical?.13:2,vertical?2:.13,'#e5e5ce');
    }
    groundOval(0,0,5.5,5.5,'#e9ddbd');
    groundRect(Island.depot.x,Island.depot.y,4,3,'#efcc7f');
    const pond=Island.pond;
    groundOval(pond.x,pond.y,pond.rx+1,pond.ry+1,'#d9d4a7');
    groundOval(pond.x,pond.y,pond.rx,pond.ry,'#79bdc5');
    groundRect(0,Island.radius-7,3,12,'#b58d64');
    for(let y=Island.radius-13;y<Island.radius-1;y+=.75)groundRect(0,y,3,.05,'#957453');
    for(const g of grassIndex.near(camera.x,camera.y,110)){if(!visible(g.x,g.y,20))continue;const p=point(g.x,g.y);if(g.color>.96){ellipse(p.x,p.y,2.4,1.4,'#f6f1c8');ellipse(p.x,p.y,0.9,.9,'#dfbd62');}else{ctx.strokeStyle=g.color>.5?'#81a65069':'#c6de965c';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x-2,p.y-3);ctx.lineTo(p.x,p.y);ctx.lineTo(p.x+1+Math.sin(time+g.x)*.6,p.y-g.size);ctx.stroke();}}
    if(destination){const p=point(destination.x,destination.y);ctx.strokeStyle='#ffffffe0';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y,9,4.5,0,0,Math.PI*2);ctx.stroke();}
    const objects=[...motes.filter(p=>visible(p.x,p.y)).map(p=>({depth:-point(p.x,p.y,p.z).depth,draw:()=>{const q=point(p.x,p.y,p.z);if(q.depth>.5)ellipse(q.x,q.y,Math.min(7,scale/q.depth*.07),Math.min(7,scale/q.depth*.07),p.color);}})),...mountain(),...activityObjects(),...Island.booths.filter(b=>visible(b.x,b.y)).map(b=>({depth:-point(b.x,b.y).depth,draw:()=>boothDrawing(b)})),...(vehicles.car?[{depth:-point(vehicles.car.x,vehicles.car.y).depth,draw:()=>carDrawing(vehicles.car)}]:[]),...Island.buildings.filter(b=>buildingVisible(b)).map(b=>({depth:-point(b.x,b.y).depth,draw:()=>house(b)})),...balls.filter(b=>visible(b.x,b.y)).map(b=>({depth:-point(b.x,b.y).depth,draw:()=>{const p=point(b.x,b.y),ballScale=scale/p.depth;ellipse(p.x,p.y,ballScale*.4,ballScale*.18,'#35571c25');ellipse(p.x,p.y-ballScale*.4,ballScale*.4,ballScale*.4,b.color);ellipse(p.x-ballScale*.12,p.y-ballScale*.53,ballScale*.1,ballScale*.1,'#ffffff9c');}})),...treeIndex.near(camera.x,camera.y,200).filter(t=>visible(t.x,t.y)&&!terrainOccludes(t.x,t.y,t.size*4)).map(t=>({depth:-point(t.x,t.y).depth,draw:()=>tree(t)})),...stones.filter(t=>visible(t.x,t.y)&&!terrainOccludes(t.x,t.y,1)).map(t=>({depth:-point(t.x,t.y).depth,draw:()=>{const p=point(t.x,t.y);const s=scale/p.depth*t.size;ellipse(p.x+3,p.y+2,s*.5,s*.19,'#526f3233');polygon([{x:p.x-s*.5,y:p.y},{x:p.x-s*.3,y:p.y-s*.35},{x:p.x+s*.1,y:p.y-s*.43},{x:p.x+s*.45,y:p.y-s*.18},{x:p.x+s*.4,y:p.y+s*.05}],'#a6ac91');polygon([{x:p.x-s*.5,y:p.y},{x:p.x-s*.3,y:p.y-s*.35},{x:p.x+s*.1,y:p.y-s*.43},{x:p.x,y:p.y-s*.1}],'#c1c5ac');}})),{depth:-point(mauz.x,mauz.y).depth,draw:()=>{if(Island.heightAt(mauz.x,mauz.y)===0)cat();}}];objects.sort((a,b)=>a.depth-b.depth).forEach(o=>o.draw());
    if(Island.heightAt(mauz.x,mauz.y)>0)cat();
    const nav=navigationTarget();marker(nav,job.active?'Lieferziel':activities.active?'Jobziel':nav.name,'#dca257');
    for(const h of Island.homes)if(Math.hypot(mauz.x-h.x,mauz.y-h.y)<40)marker(h,job.ownedHomes.includes(h.id)?'Dein Haus':h.name+' - '+h.price+' Münzen',job.ownedHomes.includes(h.id)?'#528660':'#c6a354');
    for(const b of Island.booths)if(Math.hypot(mauz.x-b.x,mauz.y-b.y)<28)marker(b,'Telefonzelle','#509789');

  }
  function step(dt){
    time+=dt;celebration=Math.max(0,celebration-dt);
    for(let i=motes.length-1;i>=0;i--){const p=motes[i];p.life-=dt;p.z+=p.vz*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vz-=3*dt;if(p.life<=0)motes.splice(i,1);}
    if(!interior&&activities.progress>0&&Math.random()<dt*22){const p=activities.target(mauz);motes.push({x:p.x,y:p.y,z:1,vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2,vz:2,life:.6,color:activities.active.id==='garden'?'#80cddd':'#efcf70'});}

    const forward=Math.max(-1,Math.min(1,Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'))-stick.y));
    const turn=Math.max(-1,Math.min(1,Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'))+stick.x));
    if(forward||turn)destination=null;
    if(vehicles.driving){vehicles.step(dt,forward,turn,keys.has(' '),mauz);destination=null;}else{
    mauz.heading+=turn*2.4*dt;
    let vx=Math.cos(mauz.heading)*forward,vy=Math.sin(mauz.heading)*forward;
    if(destination){
      vx=destination.x-mauz.x;vy=destination.y-mauz.y;
      if(Math.hypot(vx,vy)<.12){destination=null;vx=vy=0;}
      else mauz.heading=Math.atan2(vy,vx);
    }
    const length=Math.hypot(vx,vy);mauz.moving=false;
    if(length){
      const distance=Math.min((keys.has('shift')?8:4.5)*dt*(destination?1:Math.min(1,length)),destination?length:Infinity);
      const nx=mauz.x+vx/length*distance;
      const ny=mauz.y+vy/length*distance;
      if(walkable(nx,ny)){
        mauz.moving=Math.hypot(nx-mauz.x,ny-mauz.y)>.0001;mauz.x=nx;mauz.y=ny;
      }else destination=null;
    }
    if(keys.has(' ')&&mauz.jump===0){mauz.vz=5;sound.effect('jump');}
    mauz.jump+=mauz.vz*dt;mauz.vz-=15*dt;
    if(mauz.jump<=0){mauz.jump=0;mauz.vz=0;}
    }
    if(interior){follow(dt);if(toastTime>0){toastTime-=dt;if(toastTime<=0)toast.hidden=true;}updateJobUI();return;}
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
    updateJobUI();
  }

  function nearest(list){return list.reduce((a,b)=>Math.hypot(a.x-mauz.x,a.y-mauz.y)<Math.hypot(b.x-mauz.x,b.y-mauz.y)?a:b);}
  function navigationTarget(){return job.active?job.target():activities.active?activities.target(mauz):nearest([{...Island.depot,name:'Paketpost'},...Island.jobs]);}
  function contextAction(){
    if(interior)return Math.hypot(mauz.x,mauz.y-10)<2?{type:'exit',label:'E - Haus verlassen'}:null;
    const candidates=[];
    if(!vehicles.driving)for(const house of Island.homes)candidates.push({target:house,type:'home',label:job.ownedHomes.includes(house.id)?'E - Mein Haus':'E - Haus ansehen ('+house.price+' Münzen)'});
    if(!vehicles.driving)for(const booth of Island.booths)candidates.push({target:booth,type:'phone',label:'E · Auto anrufen'});
    if(job.active)candidates.push({target:job.target(),type:'delivery',label:vehicles.driving?'F · Zum Abgeben aussteigen':'E · Paket abgeben'});
    else if(activities.active){
      const a=activities.active,finished=activities.done.size===a.points.length;
      let label=a.kind==='taxi'?(activities.passenger?'E · Fahrgast aussteigen lassen':'E · Fahrgast einsteigen lassen'):finished?'E · Lohn abholen':activities.challenge?'E - Jetzt treffen!':a.kind==='hold'?'E halten · '+a.action+' '+Math.round(activities.progress/a.seconds*100)+'%':'E · '+a.action;
      if(vehicles.driving&&a.kind!=='taxi')label='F · Zum Arbeiten aussteigen';
      candidates.push({target:activities.target(mauz),type:'activity',label,range:a.kind==='taxi'?4:2.6});
    }else{
      if(!vehicles.driving){candidates.push({target:Island.depot,type:'delivery',label:'E · Paketdienst ('+job.reward+' Münzen)'});for(const spec of Island.jobs)candidates.push({target:spec,type:'start',label:'E · '+spec.name+' ('+spec.reward+' Münzen)'});}
    }
    return candidates.filter(a=>Math.hypot(a.target.x-mauz.x,a.target.y-mauz.y)<=(a.range||2.6)).sort((a,b)=>Math.hypot(a.target.x-mauz.x,a.target.y-mauz.y)-Math.hypot(b.target.x-mauz.x,b.target.y-mauz.y))[0];
  }
  function updateJobUI(){
    const skill=document.querySelector('#skill-game'),challenge=activities.challenge;
    skill.hidden=mode!=='playing'||interior||!challenge;
    if(challenge){document.querySelector('#skill-title').textContent=(activities.active.id==='fishing'?'Fisch an der Angel!':'Präzision: '+challenge.hits+'/2');const needle=document.querySelector('#skill-needle');if(needle.style)needle.style.left=(challenge.elapsed%1.6)/1.6*100+'%';}
    document.querySelector('#touch-jump').textContent=vehicles.driving?'Bremse':'Hüpfen';

    document.querySelector('#map-open').hidden=!!interior;
    if(interior){jobTitle.textContent=roomName();jobDetail.textContent=interior.name;const action=contextAction();interactButton.hidden=!action;interactButton.textContent=action?.label||'';vehicleButton.hidden=true;return;}
    const target=navigationTarget(),distance=Math.hypot(target.x-mauz.x,target.y-mauz.y);
    const direction=Math.atan2(target.y-mauz.y,target.x-mauz.x)-camera.heading;
    const angle=Math.atan2(Math.sin(direction),Math.cos(direction));
    const arrow=Math.abs(angle)<.55?'\u2191':Math.abs(angle)>2.6?'\u2193':angle>0?'\u2192':'\u2190';
    const a=activities.active;
    jobTitle.textContent=job.active?'Paket zu '+target.name:a?a.name+(a.kind==='taxi'?(activities.passenger?' · Zum Südstrand':' · Fahrgast abholen'):' · '+activities.done.size+'/'+a.points.length):'Jobs entdecken · '+target.name;
    jobDetail.textContent=job.coins+' Münzen · '+arrow+' '+Math.round(distance)+' m'+(vehicles.driving?' · '+Math.round(Math.abs(vehicles.car.speed)*3.6)+' km/h':' · Karte: M');
    const action=contextAction();interactButton.hidden=!action;interactButton.textContent=action?.label||'';
    vehicleButton.hidden=!vehicles.car||(!vehicles.driving&&Math.hypot(mauz.x-vehicles.car.x,mauz.y-vehicles.car.y)>4);
    if(touchDevice)interactButton.textContent=interactButton.textContent.replace(/^E halten [·-] /,'Halten: ').replace(/^[EF] [·-] /,'');
    vehicleButton.textContent=vehicles.driving?'F · Aussteigen':'F · '+(vehicles.car?.model.name||'Auto')+' fahren';
    if(touchDevice)vehicleButton.textContent=vehicleButton.textContent.replace(/^F [\u00b7-] /,'');
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
    if(interior){leaveHome();return;}
    const action=contextAction();if(!action)return;
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
  interactButton.onclick=e=>{if(e.detail===0)interact();};
  interactButton.addEventListener('pointerdown',e=>{e.preventDefault();interactButton.setPointerCapture(e.pointerId);interact();if(mode==='playing')keys.add('e');});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])interactButton.addEventListener(event,()=>keys.delete('e'));
  function toggleCar(){if(mode!=='playing'||interior)return;if(!vehicles.toggle(mauz))notify('Halte an und lass neben dem Auto Platz zum Aussteigen.');else{sound.effect('car');destination=null;keys.clear();mauz.jump=0;mauz.vz=0;}updateJobUI();}
  vehicleButton.onclick=toggleCar;
  function drawMap(){
    const map=document.querySelector('#map-canvas'),c=map.getContext('2d'),factor=273/Island.radius*mapView.zoom;
    const p=(x,y)=>[300+(x-mapView.x)*factor,300+(y-mapView.y)*factor];
    c.fillStyle='#a2cdd2';c.fillRect(0,0,600,600);
    c.fillStyle='#dcd3aa';c.beginPath();c.arc(...p(0,0),Island.radius*factor,0,Math.PI*2);c.fill();
    c.fillStyle='#aec58a';c.beginPath();c.arc(...p(0,0),(Island.radius-5)*factor,0,Math.PI*2);c.fill();
    c.fillStyle='#80928d';for(const r of Island.roads)c.fillRect(...p(r.x-r.w/2,r.y-r.d/2),r.w*factor,r.d*factor);
    for(const b of Island.buildings){c.fillStyle=b.city?'#5e7780':'#be8660';c.fillRect(...p(b.x-b.w/2,b.y-b.d/2),b.w*factor,b.d*factor);}
    const m=Island.mountain;c.fillStyle='#8a9982';c.beginPath();c.arc(...p(m.x,m.y),m.radius*factor,0,Math.PI*2);c.fill();
    c.fillStyle='#ecede2';c.beginPath();c.moveTo(...p(m.x,m.y-15));c.lineTo(...p(m.x-12,m.y+8));c.lineTo(...p(m.x+12,m.y+8));c.fill();
    const pond=Island.pond;c.fillStyle='#82b9c1';c.beginPath();c.ellipse(...p(pond.x,pond.y),pond.rx*factor,pond.ry*factor,0,0,Math.PI*2);c.fill();
    c.font='600 15px Segoe UI';c.textAlign='center';c.fillStyle='#344c40';
    for(const [label,x,y] of [['STADT',0,-117],['DORF',0,113],['GROSSER BERG',m.x,m.y+48],['See',pond.x,pond.y+22]])c.fillText(label,...p(x,y));
    for(const [i,j] of [Island.depot,...Island.jobs].entries()){c.fillStyle='#927db2';c.beginPath();c.arc(...p(j.x,j.y),5,0,Math.PI*2);c.fill();c.font='bold 10px Segoe UI';c.fillStyle='#493757';const q=p(j.x,j.y);c.fillText(String(i+1),q[0]-7,q[1]-6);}
    c.fillStyle='#238e84';for(const b of Island.booths){const q=p(b.x,b.y);c.fillRect(q[0]-3,q[1]-3,6,6);}
    c.font='600 12px Segoe UI';c.fillStyle='#344c40';for(const [label,x,y] of [['FARM',-150,-28],['WERKSTATT',160,-35],['HAFEN',0,202],['NORDSTADT',0,-390],['OBSTGARTEN',-350,-50],['OSTVIERTEL',300,70],['SÜDVIERTEL',0,385]])c.fillText(label,...p(x,y));
    for(const h of Island.homes){const q=p(h.x,h.y);c.fillStyle=job.ownedHomes.includes(h.id)?'#4f895d':'#c79c41';c.fillRect(q[0]-4,q[1]-3,8,7);c.beginPath();c.moveTo(q[0]-6,q[1]-3);c.lineTo(q[0],q[1]-9);c.lineTo(q[0]+6,q[1]-3);c.fill();}
    const t=navigationTarget();c.fillStyle='#e8a44f';c.beginPath();c.arc(...p(t.x,t.y),6,0,Math.PI*2);c.fill();
    c.fillStyle='#2476a5';c.beginPath();c.arc(...p(mauz.x,mauz.y),5,0,Math.PI*2);c.fill();
    c.strokeStyle='#2476a5';c.lineWidth=3;c.beginPath();c.moveTo(...p(mauz.x,mauz.y));c.lineTo(...p(mauz.x+Math.cos(mauz.heading)*7,mauz.y+Math.sin(mauz.heading)*7));c.stroke();
  }
  function updateHomeUI(){
    if(!currentHome)return;
    const owned=job.ownedHomes.includes(currentHome.id),selected=job.homeId===currentHome.id;
    document.querySelector('#home-title').textContent=currentHome.name;
    document.querySelector('#home-price').textContent=currentHome.price+' Münzen';
    document.querySelector('#home-balance').textContent=job.coins+' Münzen';
    document.querySelector('#home-status').textContent=owned?(selected?'Dein Zuhause - Startpunkt beim nächsten App-Start.':'Dieses Haus gehört dir.'):'Dieses Haus steht zum Verkauf.';
    const buy=document.querySelector('#home-buy');buy.hidden=owned;buy.disabled=job.coins<currentHome.price;buy.textContent='Kaufen - '+currentHome.price+' Münzen';
    document.querySelector('#home-enter').hidden=!owned;
    const set=document.querySelector('#home-set');set.hidden=!owned||selected;
    document.querySelector('#home-message').textContent=!owned&&job.coins<currentHome.price?'Noch '+(currentHome.price-job.coins)+' Münzen verdienen.':'';
  }
  document.querySelector('#home-buy').onclick=()=>{
    if(mode!=='home'||!currentHome||Math.hypot(mauz.x-currentHome.x,mauz.y-currentHome.y)>2.6)return;
    const result=job.purchaseHome(currentHome.id);updateHomeUI();
    document.querySelector('#home-message').textContent=result.ok?'Gekauft! Dein Eigentum wurde gespeichert.':result.reason;
    if(result.ok)sound.effect('reward');updateJobUI();
  };
  document.querySelector('#home-set').onclick=()=>{
    if(mode!=='home'||!currentHome)return;
    const success=job.setHome(currentHome.id);updateHomeUI();
    document.querySelector('#home-message').textContent=success?'Startpunkt gespeichert.':'Startpunkt konnte nicht gespeichert werden.';
  };
  document.querySelector('#home-enter').onclick=enterHome;
  document.querySelector('#home-close').onclick=()=>setMode('playing');
  const mapCanvas=document.querySelector('#map-canvas');let mapDrag=null;
  function zoomMap(multiplier){mapView.zoom=Math.max(1,Math.min(8,mapView.zoom*multiplier));drawMap();}
  document.querySelector('#map-plus').onclick=()=>zoomMap(1.5);
  document.querySelector('#map-minus').onclick=()=>zoomMap(1/1.5);
  document.querySelector('#map-locate').onclick=()=>{mapView.x=mauz.x;mapView.y=mauz.y;mapView.zoom=4;drawMap();};
  document.querySelector('#map-reset').onclick=()=>{mapView.x=0;mapView.y=0;mapView.zoom=1;drawMap();};
  mapCanvas.addEventListener('wheel',e=>{e.preventDefault();zoomMap(e.deltaY<0?1.2:1/1.2);},{passive:false});
  mapCanvas.addEventListener('pointerdown',e=>{mapDrag={x:e.clientX,y:e.clientY};mapCanvas.setPointerCapture(e.pointerId);});
  mapCanvas.addEventListener('pointermove',e=>{if(!mapDrag)return;const bounds=mapCanvas.getBoundingClientRect(),factor=273/Island.radius*mapView.zoom*bounds.width/600;mapView.x=Math.max(-Island.radius,Math.min(Island.radius,mapView.x-(e.clientX-mapDrag.x)/factor));mapView.y=Math.max(-Island.radius,Math.min(Island.radius,mapView.y-(e.clientY-mapDrag.y)/factor));mapDrag={x:e.clientX,y:e.clientY};drawMap();});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])mapCanvas.addEventListener(event,()=>mapDrag=null);
  const startScreen=document.querySelector('#start-screen');
  const pauseScreen=document.querySelector('#pause-screen');
  const gameUI=document.querySelector('#game-ui');
  function setMode(next){
    if(next==='map'&&interior)return;
    mode=next;keys.clear();resetStick();destination=null;mauz.moving=false;
    startScreen.hidden=mode!=='start';pauseScreen.hidden=mode!=='pause';gameUI.hidden=mode!=='playing';
    document.querySelector('#map-screen').hidden=mode!=='map';
    document.querySelector('#garage-screen').hidden=mode!=='garage';
    document.querySelector('#home-screen').hidden=mode!=='home';
    if(mode==='home'){updateHomeUI();document.querySelector('#home-close').focus();}
    if(mode!=='playing'){vehicles.stop();sound.quietEngine();}
    if(mode==='garage'){document.querySelector('#garage-message').textContent='';document.querySelector('[data-car]').focus();}
    if(mode==='map'){drawMap();document.querySelector('#map-close').focus();}
    updateJobUI();
    if(mode==='start')document.querySelector('#play').focus();
    if(mode==='pause')document.querySelector('#resume').focus();
    if(mode==='playing')document.activeElement?.blur();
  }
  document.querySelector('#garage-close').onclick=()=>setMode('playing');
  document.querySelectorAll('[data-car]').forEach(button=>button.onclick=()=>{
    if(mode!=='garage')return;
    if(vehicles.spawn(button.dataset.car,currentBooth,mauz)){setMode('playing');notify(vehicles.car.model.name+' steht bereit. Geh zum Auto und drücke F.');}
    else document.querySelector('#garage-message').textContent='Kein freier Platz. Probiere eine andere Telefonzelle.';
  });
  document.querySelector('#map-open').onclick=()=>setMode('map');
  document.querySelector('#map-close').onclick=()=>setMode('playing');
  document.querySelector('#play').onclick=()=>setMode('playing');
  document.querySelector('#menu').onclick=()=>setMode('pause');
  document.querySelector('#resume').onclick=()=>setMode('playing');
  document.querySelector('#back').onclick=()=>setMode('start');
  window.addEventListener('keydown',e=>{
    const key=e.key.toLowerCase();
    if(key==='m'&&!e.repeat&&(mode==='playing'||mode==='map')){e.preventDefault();setMode(mode==='map'?'playing':'map');return;}
    if(mode==='garage'&&key==='tab'){
      const buttons=[...document.querySelectorAll('[data-car]'),document.querySelector('#garage-close')];
      const i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();return;
    }
    if((mode==='map'||mode==='home')&&key==='tab'){const ids=mode==='map'?['map-close','map-minus','map-plus','map-locate','map-reset']:['home-buy','home-enter','home-set','home-close'];const buttons=ids.map(id=>document.getElementById(id)).filter(b=>!b.hidden&&!b.disabled);const i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();return;}
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
  window.addEventListener('resize',resize);resize();setMode('start');
  // Available only in the isolated browser test context.
  if(location.hash==='#smoke-test')window.__animalTest={
    visit(x,y,heading=-Math.PI/2){mauz.x=x;mauz.y=y;mauz.heading=heading;if(vehicles.driving){vehicles.car.x=x;vehicles.car.y=y;vehicles.car.heading=heading;vehicles.stop();}camera.x=x;camera.y=y;camera.z=Island.heightAt(x,y);camera.heading=heading;keys.clear();destination=null;updateJobUI();draw();},
    park(){vehicles.stop();if(vehicles.driving)vehicles.toggle(mauz);},
    advance(seconds){if(mode==='playing')for(let i=0;i<Math.ceil(seconds*60);i++)step(1/60);},
    audio:()=>sound.unlock(),
    state:()=>({jump:mauz.jump,stick:{x:stick.x,y:stick.y},challenge:activities.challenge,cameraDistance,cameraHeight,depthRenderer:!!indoorRenderer,interior:interior?.id||null,room:interior?roomName():null,audioRunning:sound.running,theme:sound.scene,muted:sound.settings.muted,audioSettings:sound.settings,ownedHomes:job.ownedHomes,homeId:job.homeId,mapZoom:mapView.zoom,active:job.active,coins:job.coins,completed:job.completed,activity:activities.active?.id||null,passenger:activities.passenger,done:activities.done.size,driving:vehicles.driving,car:vehicles.car?.model.id||null,speed:vehicles.car?.speed||0,x:mauz.x,y:mauz.y,mode,height:Island.heightAt(mauz.x,mauz.y)})
  };
  function frame(now){const dt=Math.min((now-last)/1000,.04);last=now;if(mode==='playing')step(dt);sound.update(mode==='start'?'menu':job.active?'delivery':activities.active?.id||'explore',{paused:mode!=='playing'&&mode!=='start',moving:mauz.moving,driving:vehicles.driving,speed:vehicles.car?.speed||0,running:keys.has('shift'),working:activities.progress>0,braking:keys.has(' ')});draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
})();
