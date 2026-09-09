function createSceneryDamage(trees,lamps){
  const fallen=new Map();let now=0;
  const key=(kind,index)=>kind+':'+index;
  function hit(impact,age=0){
    if(impact.speed*3.6<=70||age>=5)return [];
    const result=[];
    for(const [kind,items] of [['tree',trees],['lamp',lamps]])items.forEach((item,index)=>{
      const dx=item.x-impact.x,dy=item.y-impact.y;
      const forward=dx*Math.cos(impact.heading)+dy*Math.sin(impact.heading),side=-dx*Math.sin(impact.heading)+dy*Math.cos(impact.heading);
      if(Math.abs(forward)<=impact.model.length/2+.8&&Math.abs(side)<=impact.model.width/2+.8&&!fallen.has(key(kind,index))){
        const state={kind,index,x:item.x,y:item.y,heading:impact.heading,started:now-age,until:now+5-age};fallen.set(key(kind,index),state);result.push(state);
      }
    });return result;
  }
  return {hit,tick(dt){now+=dt;for(const [id,f] of fallen)if(now>=f.until)fallen.delete(id);},get(kind,index){return fallen.get(key(kind,index));},get fallen(){return [...fallen.values()];},get time(){return now;}};
}
