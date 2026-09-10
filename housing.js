function housingLayout(home){
  const b=home.building,seed=[...home.id].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,7);
  const apartment=home.type==='apartment',villa=home.type==='villa';
  const w=home.id==='village'?24:apartment?12+(seed%4):Math.min(48,b.w*3+seed%3);
  const d=home.id==='village'?24:apartment?12+(seed%3):Math.min(44,b.d*24/7+(seed%3));
  const sx=w/24,sy=d/24,mirror=home.id==='village'?1:seed%2?-1:1;
  const colors=[['#e8dfce','#d6b391','#9bb7b1'],['#d9e4e2','#bfc7b2','#92acc4'],['#e8d8cc','#c2a27f','#b29bb8'],['#e5e2d0','#d2c5a0','#86a795']][seed%4];
  return {w,d,sx,sy,mirror,colors,style:seed%4,open:apartment&&(seed%3===0),height:villa?3.8:3.3,
    bed:{x:-8*sx*mirror,y:-8*sy},exit:{x:0,y:10*sy},spawn:{x:0,y:8.5*sy},
    transform:b=>({...b,x:b.x*sx*mirror,y:b.y*sy,w:b.w*sx,d:b.d*sy})};
}
globalThis.housingLayout=housingLayout;
// One full turn climbs one storey. The previous height selects the winding,
// so crossing the angle seam works identically upwards and downwards.
function stairSurface(x,y,previous,floors){
  const r=Math.hypot(x,y+3),top=(floors-1)*4;
  if(Math.abs(x)>11.4||Math.abs(y)>11.4||r<2.15)return null;
  if(r>4.5){const z=Math.round(previous/4)*4;return Math.abs(z-previous)<.24?z:null;}
  const phase=((Math.atan2(y+3,x)-Math.PI/2)/(Math.PI*2)+1)%1;
  const raw=phase*4,z=raw+Math.round((previous-raw)/4)*4;
  return z>=-.12&&z<=top+.12&&Math.abs(z-previous)<.24?Math.max(0,Math.min(top,z)):null;
}
function staircaseGeometry(floors){
  const mesh=[],boxes=[],surfaces=[],n=64,at=(r,a,z)=>[Math.cos(a)*r,-3+Math.sin(a)*r,z];
  for(let f=0;f<floors;f++){
    const z=f*4;
    // Radial floor panels leave a real open shaft through every storey.
    for(let i=0;i<n;i++){
      const a=i*2*Math.PI/n,b=(i+1)*2*Math.PI/n;
      const edge=t=>{const c=Math.cos(t),s=Math.sin(t),r=Math.min(12/Math.max(.00001,Math.abs(c)),(s>0?15:9)/Math.max(.00001,Math.abs(s)));return at(r,t,z);};
      mesh.push({points:[at(4.5,a,z),edge(a),edge(b),at(4.5,b,z)],color:f%2?'#cbb797':'#d6c5a9'});
    }
    for(const x of [-11,11])boxes.push({x,y:4,z,w:.3,d:3,h:2.7,color:'#a78360'});
  }
  for(let i=0;i<(floors-1)*32;i++){
    const a=Math.PI/2+i*Math.PI/16,b=a+Math.PI/16,z=(i+1)/8;
    mesh.push({points:[at(2,a,z),at(4.5,a,z),at(4.5,b,z),at(2,b,z)],color:i%2?'#aaa99d':'#bdbbae'});
    mesh.push({points:[at(2,a,z-.125),at(4.5,a,z-.125),at(4.5,a,z),at(2,a,z)],color:'#858a83'});
    for(const r of [2,4.5]){
      // Open the outer railing at the landing, preserving the way in/out.
      if(r===4.5&&(i%32===0||i%32===31))continue;
      const p=at(r,a,z);boxes.push({x:p[0],y:p[1],z,w:.08,d:.08,h:1.05,color:'#657f79'});
      mesh.push({points:[at(r,a,z+.95),at(r,b,z+1.075),at(r,b,z+1.16),at(r,a,z+1.035)],color:'#526e69'});
    }
  }
  boxes.push({x:0,y:-3,z:0,w:2.7,d:2.7,h:(floors-1)*4+3.3,color:'#b6b7a9'});
  return {mesh,boxes,surfaces};
}
globalThis.stairSurface=stairSurface;
globalThis.staircaseGeometry=staircaseGeometry;
