// Grid A*: road costs guide land routes; each edge is checked, including diagonals.
function planWorldRoute(world,start,target,walkable){
  if(!world.inBounds(target.x,target.y))return null;
  const building=world.buildings.find(b=>Math.abs(target.x-b.x)<b.w/2&&Math.abs(target.y-b.y)<b.d/2);
  if(building)target={x:building.x,y:building.y+building.d/2+2};
  const island=p=>Math.hypot(p.x,p.y)<world.radius?0:Math.hypot(p.x-world.luxury.x,p.y-world.luxury.y)<world.luxury.radius?1:-1;
  const harbors=[{land:{x:550,y:2.5},sea:{x:563,y:6}},{land:{x:655,y:2.5},sea:{x:645,y:6}}];
  function search(from,to,water=false){
    const distance=Math.hypot(from.x-to.x,from.y-to.y),step=water?4:distance<350?2:4;
    const valid=(x,y)=>world.inBounds(x,y)&&(water?world.inSea(x,y):!world.inSea(x,y)&&walkable(x,y));
    const clear=(a,b)=>{const n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)));for(let i=0;i<=n;i++){const t=i/n;if(!valid(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t))return false;}return true;};
    const nearest=p=>{let best=null;for(let dx=-4;dx<=4;dx++)for(let dy=-4;dy<=4;dy++){const q={x:Math.round(p.x/step)*step+dx*step,y:Math.round(p.y/step)*step+dy*step};if(valid(q.x,q.y)&&clear(p,q)&&(!best||Math.hypot(q.x-p.x,q.y-p.y)<Math.hypot(best.x-p.x,best.y-p.y)))best=q;}return best;};
    // Clicked walls/trees are adjusted to the nearest reachable point.
    if(!valid(to.x,to.y)){let found=null;for(let r=1;r<=14&&!found;r++)for(let i=0;i<16;i++){const q={x:to.x+Math.cos(i*Math.PI/8)*r,y:to.y+Math.sin(i*Math.PI/8)*r};if(valid(q.x,q.y)){found=q;break;}}if(!found)return null;to=found;}
    const a=nearest(from),b=nearest(to);if(!a||!b)return null;
    const key=p=>p.x+','+p.y,heap=[],scores=new Map([[key(a),0]]),parents=new Map(),nodes=new Map([[key(a),a]]);
    function push(n){heap.push(n);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p].f<=n.f)break;heap[i]=heap[p];i=p;}heap[i]=n;}
    function pop(){const top=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let j=i*2+1;if(j+1<heap.length&&heap[j+1].f<heap[j].f)j++;if(heap[j].f>=last.f)break;heap[i]=heap[j];i=j;}heap[i]=last;}return top;}
    const heuristic=p=>Math.hypot(p.x-b.x,p.y-b.y)*(water?1:.7);push({...a,g:0,f:heuristic(a)});let visited=0;
    while(heap.length&&visited++<60000){
      const p=pop(),pk=key(p);if(p.g!==scores.get(pk))continue;
      if(pk===key(b)){const path=[to];let k=pk;while(k){path.push(nodes.get(k));k=parents.get(k);}path.push(from);path.reverse();return path.filter((q,i)=>!i||Math.hypot(q.x-path[i-1].x,q.y-path[i-1].y)>.01);}
      for(const dx of [-step,0,step])for(const dy of [-step,0,step]){if(!dx&&!dy)continue;const q={x:p.x+dx,y:p.y+dy};if(!clear(p,q))continue;
        const g=p.g+Math.hypot(dx,dy)*(water?1:world.onRoad(q.x,q.y,0)?.7:1.8)+Math.abs(world.heightAt(q.x,q.y)-world.heightAt(p.x,p.y))*4,qk=key(q);
        if(g>=(scores.get(qk)??Infinity))continue;scores.set(qk,g);parents.set(qk,pk);nodes.set(qk,q);push({...q,g,f:g+heuristic(q)});
      }
    }
    return null;
  }
  const fromIsland=island(start),toIsland=island(target);let points,note='Route ueber Strassen und Wege';
  if(fromIsland===toIsland)points=search(start,target,fromIsland<0);
  else{
    const departure=fromIsland<0?null:harbors[fromIsland],arrival=toIsland<0?null:harbors[toIsland];
    const first=departure?search(start,departure.land):[start],sea=search(departure?.sea||start,arrival?.sea||target,true),last=arrival?search(arrival.land,target):[target];
    if(first&&sea&&last){points=[...first,...sea,...last];note='Inselwechsel: am Bootssteg ein Boot nehmen';}
  }
  if(!points)return null;
  // Remove collinear grid points, preserving turns and obstacle detours.
  points=points.filter((p,i)=>!i||i===points.length-1||Math.abs((p.x-points[i-1].x)*(points[i+1].y-p.y)-(p.y-points[i-1].y)*(points[i+1].x-p.x))>.001);
  return {points,target:points[points.length-1],note,length:points.reduce((n,p,i)=>i?n+Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y):0,0)};
}
