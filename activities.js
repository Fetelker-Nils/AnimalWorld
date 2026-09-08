function createActivities(world,wallet){
  let active=null,done=new Set(),progress=0,passenger=false;
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function target(player){
    if(!active)return null;
    if(active.kind==='taxi')return active.points[passenger?1:0];
    const remaining=active.points.filter((_,i)=>!done.has(i));
    return remaining.length?remaining.reduce((a,b)=>distance(a,player)<distance(b,player)?a:b):active;
  }
  function start(id,player){
    const spec=world.jobs.find(j=>j.id===id);
    if(active||wallet.active||!spec||distance(spec,player)>2.6)return null;
    active=spec;done=new Set();progress=0;passenger=false;
    return {type:'started',message:spec.name+' gestartet. '+(spec.kind==='taxi'?'Hole ein Auto an einer Telefonzelle und fahre zum Fahrgast.':'Folge den Markierungen. Am Ende zur Jobstation zurückkehren.')};
  }
  function complete(){
    const reward=active.reward;wallet.addReward(reward);active=null;progress=0;passenger=false;
    return {type:'completed',reward,message:'Job geschafft! +'+reward+' Münzen.'};
  }
  function interact(player,driving,speed=0){
    if(!active)return null;
    const t=target(player),range=active.kind==='taxi'?4:2.6;
    if(distance(player,t)>range)return null;
    if(active.kind==='taxi'){
      if(!driving)return {message:'Steige zuerst in ein Auto (F).'};
      if(Math.abs(speed)>.6)return {message:'Bitte anhalten, damit der Fahrgast sicher ein- oder aussteigen kann.'};
      if(!passenger){passenger=true;return {message:'Fahrgast an Bord. Fahre zum Hafen!'};}
      return complete();
    }
    if(driving)return {message:'Steige mit F aus, um hier zu arbeiten.'};
    if(done.size===active.points.length)return complete();
    if(active.kind==='collect'){done.add(active.points.indexOf(t));return {message:(active.item||'Abfall')+' erledigt: '+done.size+'/'+active.points.length};}
    return null;
  }
  function tick(dt,player,driving,held){
    if(!active||active.kind!=='hold'||done.size===active.points.length){progress=0;return null;}
    const t=target(player);
    if(driving||!held||distance(player,t)>2.6){progress=0;return null;}
    progress+=dt;
    if(progress>=active.seconds){done.add(active.points.indexOf(t));progress=0;return {message:(active.doneText||(active.id==='garden'?'Beet gegossen':'Motor repariert'))+' ('+done.size+'/'+active.points.length+')'};}
    return null;
  }
  return {start,target,interact,tick,get active(){return active;},get done(){return done;},get passenger(){return passenger;},get progress(){return progress;}};
}
