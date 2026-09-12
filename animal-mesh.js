// Cached world geometry: every face has world-space vertices, never billboard sprites.
const sceneryTemplates=new Map();
function sceneryMesh(kind,item,ground=0,options={}){
  const detail=options.detail===false?4:7,key=kind+':'+detail+':'+(item.color||'')+':'+!!options.lit+':'+(item.colors||[]).join(',');
  let template=sceneryTemplates.get(key);
  if(!template){
    template=[];
    function face(points,color,shade=1){template.push({points,color:'#'+[1,3,5].map(i=>Math.min(255,Math.round(parseInt(color.slice(i,i+2),16)*shade)).toString(16).padStart(2,'0')).join('')});}
    function cuboid(x,y,z,w,d,h,color){
      const v=[[-1,-1,0],[1,-1,0],[1,1,0],[-1,1,0],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(p=>[x+p[0]*w/2,y+p[1]*d/2,z+p[2]*h]);
      [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]].forEach((f,i)=>face(f.map(j=>v[j]),color,[.7,.85,.7,.8,.95,1][i]));
    }
    function ball(x,y,z,rx,ry,rz,color,n=detail){
      const m=3,v=Array.from({length:m+1},(_,j)=>Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2,b=j/m*Math.PI;return [x+Math.cos(a)*Math.sin(b)*rx,y+Math.sin(a)*Math.sin(b)*ry,z+Math.cos(b)*rz];}));
      for(let j=0;j<m;j++)for(let i=0;i<n;i++)face([v[j][i],v[j][(i+1)%n],v[j+1][(i+1)%n],v[j+1][i]],color,.72+.19*(1-j/m)+.09*Math.cos(i/n*Math.PI*2));
    }
    if(kind==='tree'){
      cuboid(0,0,0,.34,.34,2.3,'#987551');cuboid(.3,0,1.5,.7,.18,.2,'#987551');
      ball(0,0,2.7,1.05,.95,1.25,'#759c50');
      if(detail>4){ball(-.65,.2,2.35,.65,.7,.8,'#648c46');ball(.55,-.2,2.65,.65,.75,.9,'#83a957');}
    }else if(kind==='lamp'){
      cuboid(0,0,0,.42,.42,.25,'#75817e');cuboid(0,0,.25,.16,.16,4.3,'#59686c');
      cuboid(.24,0,4.4,.65,.16,.16,'#59686c');cuboid(.48,0,4.35,.6,.46,.12,'#59686c');
      cuboid(.48,0,4.47,.42,.32,.4,options.lit?'#ffe9a3':'#b7ccc7');cuboid(.48,0,4.87,.65,.5,.13,'#59686c');
      for(const x of [.28,.68])for(const y of [-.16,.16])cuboid(x,y,4.47,.04,.04,.4,'#59686c');
    }else if(kind==='busstop'){
      cuboid(0,0,0,.12,.12,3,'#547269');cuboid(0,0,2.6,.7,.18,.7,'#f0d477');
      cuboid(-.17,-.11,2.75,.07,.04,.4,'#42755e');cuboid(.17,-.11,2.75,.07,.04,.4,'#42755e');cuboid(0,-.11,2.92,.35,.04,.07,'#42755e');
      for(const x of [-1.5,1.5])cuboid(x,2,0,.12,.12,2.7,'#547269');cuboid(0,2,2.7,3.5,2,.14,item.color||'#b6cec5');cuboid(0,2,.5,2.8,.65,.15,'#ba9163');cuboid(0,2.4,.65,2.8,.12,.5,'#ba9163');cuboid(-1.4,2,1.2,.1,1.1,1,'#f1efdc');for(let i=0;i<5;i++)cuboid(-1.46,2,1.32+i*.14,.02,.8,.035,'#698b81');
      for(const x of [-1,1])cuboid(x,2,0,.12,.55,.5,'#547269');
      (item.colors||[]).forEach((color,i)=>cuboid(-.3+i*.6/item.colors.length,-.12,2.62,.6/item.colors.length,.04,.08,color));
    }else if(kind==='bench'){
      for(const x of [-.8,.8])cuboid(x,0,0,.15,.6,.55,'#536f69');
      for(const y of [-.25,0,.25])cuboid(0,y,.55,2.2,.2,.12,'#bd9365');
      cuboid(0,.35,.7,2.2,.12,.65,'#bd9365');
    }else if(kind==='planter'){
      cuboid(0,0,0,1.5,1,.55,'#b88767');cuboid(0,0,.55,1.35,.85,.04,'#705a43');
      for(const x of [-.45,0,.45]){ball(x,0,.85,.35,.35,.38,'#71944d');ball(x,.05,1.1,.13,.13,.13,x?'#e8b174':'#ce8ca1',5);}
    }else if(kind==='stall'){
      cuboid(0,0,0,2.5,1.4,.9,'#bb9163');
      for(const x of [-1.15,1.15])cuboid(x,0,.9,.09,.09,1.5,'#81674e');
      for(let i=0;i<6;i++)cuboid(-1.05+i*.42,0,2.4,.42,1.9,.16,i%2?'#f0dfba':'#719993');
      for(const x of [-.8,0,.8])for(const y of [-.3,.3])ball(x,y,1.02,.2,.18,.17,x?'#d99a52':'#92b559',5);
    }else if(kind==='stone')ball(0,0,.23,.5,.4,.35,'#a6ac91',5);
    else if(kind==='ball'||kind==='fruit')ball(0,0,.4,.4,.4,.4,item.color||'#cf7760');
    else if(kind==='flower'){
      cuboid(0,0,0,.035,.035,.4,'#628b43');ball(0,0,.43,.13,.13,.075,item.color||'#f6e4a0',5);
    }else if(kind==='grass'){
      for(let i=0;i<3;i++){const a=i*Math.PI*2/3,dx=Math.cos(a),dy=Math.sin(a);face([[-dy*.06,dx*.06,0],[dy*.06,-dx*.06,0],[dx*.12,dy*.12,.23+i*.04]],'#83aa57',.85+i*.06);}
    }else if(kind==='rod'){
      cuboid(0,0,0,.055,.055,1.7,'#86684b');cuboid(.35,0,1.67,.75,.04,.04,'#86684b');
    }
    sceneryTemplates.set(key,template);
  }
  const size=item.size||1,heading=item.heading||0,c=Math.cos(heading),s=Math.sin(heading),tilt=options.tilt||0,ct=Math.cos(tilt),st=Math.sin(tilt),vertices=new Map();
  return template.map(f=>({color:f.color,points:f.points.map(p=>{if(!vertices.has(p)){const x=p[0]*ct+p[2]*st,y=p[1],z=-p[0]*st+p[2]*ct;vertices.set(p,[item.x+(c*x-s*y)*size,item.y+(s*x+c*y)*size,ground+z*size]);}return vertices.get(p);})}));
}

// Real, oriented 3D geometry shared by players, pedestrians and shopkeepers.
function animalMesh(actor, outfit, ground=0, time=0, detail=1){
  const faces=[],kind=actor.species||'cat',fur=kind==='bear'?'#a77e59':kind==='rabbit'?'#c7b8a4':kind==='fox'?'#d68d4b':'#e7ab60';
  const h=actor.heading||0,c=Math.cos(h),s=Math.sin(h),base=ground+(actor.jump||0);
  const vertices=new Map();
  const transform=p=>{let v=vertices.get(p);if(!v){let [side,forward,z]=p;if(actor.seated){if(z<.4)forward+=.28;z=z*.85+.3;}v=[actor.x+c*forward-s*side,actor.y+s*forward+c*side,base+z];vertices.set(p,v);}return v;};
  function face(points,color,shade=1){const rgb=[1,3,5].map(i=>Math.round(parseInt(color.slice(i,i+2),16)*shade).toString(16).padStart(2,'0'));faces.push({points:points.map(transform),color:'#'+rgb.join('')});}
  function ball(x,y,z,rx,ry,rz,color,n=8,m=5){
    if(detail<1){n=Math.max(4,Math.round(n*detail));m=Math.max(3,Math.round(m*detail));}
    const grid=Array.from({length:m+1},(_,j)=>Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2,b=j/m*Math.PI;return [x+rx*Math.cos(a)*Math.sin(b),y+ry*Math.sin(a)*Math.sin(b),z+rz*Math.cos(b)];}));
    const p=(i,j)=>grid[j][i%n];
    for(let j=0;j<m;j++)for(let i=0;i<n;i++)face([p(i,j),p(i+1,j),p(i+1,j+1),p(i,j+1)],color,.77+.2*(1-j/m)+.03*Math.sin(i/n*Math.PI*2));
  }
  const stride=actor.moving?Math.sin(time*9+(actor.phase||0))*.13:0;
  ball(-.18,stride,.18,.15,.23,.18,fur);ball(.18,-stride,.18,.15,.23,.18,fur);
  ball(0,0,.7,.32,.24,.48,outfit?.color||fur);
  ball(-.36,-stride,.76,.105,.13,.3,fur,6,4);
  const waving=actor.waving||Date.now()-(actor.wave||0)<2200;
  ball(.36,waving?.04:stride,waving?1.13:.76,.105,.13,.3,fur,6,4);
  ball(0,0,1.34,.45,.35,.39,fur,10,6);
  for(const side of [-1,1]){
    if(kind==='bear')ball(side*.34,-.02,1.64,.17,.13,.18,fur,6,4);
    else if(kind==='rabbit'){ball(side*.21,-.02,1.86,.115,.09,.4,fur,6,4);ball(side*.21,.06,1.89,.055,.035,.26,'#d9989d',6,3);}
    else{
      const a=side*.2,b=side*.44,t=side*.39;
      face([[a,.1,1.54],[b,.08,1.51],[t,-.01,1.94]],fur);
      face([[a,-.15,1.54],[t,-.01,1.94],[b,-.15,1.51]],'#bd8147');
      face([[b,-.15,1.51],[t,-.01,1.94],[b,.08,1.51]],fur);
      face([[a,.1,1.54],[t,-.01,1.94],[a,-.15,1.54]],fur);
      face([[side*.27,.107,1.59],[side*.4,.09,1.57],[side*.38,.02,1.83]],'#e2a3a0');
    }
    ball(side*.165,.299,1.41,.107,.055,.12,'#fff2d5',6,4);
    ball(side*.165,.347,1.41,.05,.024,.076,'#283f3c',6,4);
    ball(side*.148,.369,1.44,.019,.012,.025,'#ffffff',6,3);
    ball(side*.092,.321,1.235,.12,.08,.075,'#f4d7a0',6,4);
  }
  ball(0,.403,1.285,.052,.029,.036,'#9f655e',6,3);
  ball(0,.391,1.207,.038,.018,.016,'#664c40',6,3);
  if(kind!=='bear')for(let i=0;i<4;i++)ball(-.12-i*.085,-.24-i*.11,.6+i*.09+Math.sin(time*3+i)*.025,.11,.13,.11,fur,6,3);
  ball(0,.015,.99,.29,.245,.045,outfit?.trim||'#648e79',8,3);
  if(outfit?.hat){ball(0,0,1.68,.46,.37,.06,outfit.hat,8,3);ball(0,-.03,1.74,.32,.26,.13,outfit.hat,8,4);}
  return faces;
}
