// Real, oriented 3D geometry shared by players, pedestrians and shopkeepers.
function animalMesh(actor, outfit, ground=0, time=0){
  const faces=[],kind=actor.species||'cat',fur=kind==='bear'?'#a77e59':kind==='rabbit'?'#c7b8a4':kind==='fox'?'#d68d4b':'#e7ab60';
  const h=actor.heading||0,c=Math.cos(h),s=Math.sin(h),base=ground+(actor.jump||0);
  const transform=([side,forward,z])=>[actor.x+c*forward-s*side,actor.y+s*forward+c*side,base+z];
  function face(points,color,shade=1){const rgb=[1,3,5].map(i=>Math.round(parseInt(color.slice(i,i+2),16)*shade).toString(16).padStart(2,'0'));faces.push({points:points.map(transform),color:'#'+rgb.join('')});}
  function ball(x,y,z,rx,ry,rz,color,n=8,m=5){
    const p=(i,j)=>{const a=i/n*Math.PI*2,b=j/m*Math.PI;return [x+rx*Math.cos(a)*Math.sin(b),y+ry*Math.sin(a)*Math.sin(b),z+rz*Math.cos(b)];};
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
