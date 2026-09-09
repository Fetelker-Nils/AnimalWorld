function createActivities(world,wallet){
  let active=null,done=new Set(),progress=0,passenger=false,challenge=null;
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function target(player){
    if(!active)return null;
    if(active.kind==='taxi')return active.points[passenger?1:0];
    const remaining=active.points.filter((_,i)=>!done.has(i));
    return remaining.length?remaining.reduce((a,b)=>distance(a,player)<distance(b,player)?a:b):active;
  }
  function start(id,player,venue=null){
    const spec=world.jobs.find(j=>j.id===id);
    if(active||wallet.active||!spec||(spec.venue?spec.venue!==venue:distance(spec,player)>2.6))return null;
    active=spec;done=new Set();progress=0;passenger=false;challenge=null;
    return {type:'started',message:(spec.venue?'Auftrag am Empfang: ':'')+spec.name+' gestartet. '+(spec.kind==='taxi'?'Hole ein Auto an einer Telefonzelle und fahre zum Fahrgast.':'Folge den Markierungen. Am Ende zur Jobstation zurückkehren.')};
  }
  function complete(){
    const reward=active.reward;wallet.addReward(reward);active=null;progress=0;passenger=false;challenge=null;
    return {type:'completed',reward,message:'Job geschafft! +'+reward+' Münzen.'};
  }
  function interact(player,driving,speed=0){
    if(!active)return null;
    const t=target(player),range=active.kind==='taxi'?4:2.6;
    if(distance(player,t)>range)return null;
    if(active.kind==='taxi'){
      if(!driving)return {message:'Steige zuerst in ein Auto (F).'};
      if(Math.abs(speed)>.6)return {message:'Bitte anhalten, damit der Fahrgast sicher ein- oder aussteigen kann.'};
      if(!passenger){passenger=true;return {message:'Fahrgast an Bord! Bring mich zum Strand ganz im Süden. Das wird eine Inselrundfahrt!'};}
      return complete();
    }
    if(driving)return {message:'Steige mit F aus, um hier zu arbeiten.'};
    if(done.size===active.points.length)return active.venue?{message:'Zurueck ins Gebaeude: Lohn am Empfang abholen.'}:complete();
    if(challenge){
      if(distance(player,active.points[challenge.index])>2.6){challenge=null;progress=0;return null;}
      const marker=(challenge.elapsed%1.6)/1.6;
      if(marker<.45||marker>.7){challenge.elapsed=0;return {type:'miss',message:active.id==='fishing'?'Der Fisch zappelt! Warte auf den grünen Bereich.':'Knapp daneben! Tippe im grünen Bereich.'};}
      challenge.hits++;
      if(challenge.hits<(active.id==='fishing'?1:2)){challenge.elapsed=0;return {type:'hit',message:'Gut getroffen! Noch ein Treffer.'};}
      done.add(challenge.index);challenge=null;progress=0;
      return {type:'success',message:(active.doneText||'Motor repariert')+' ('+done.size+'/'+active.points.length+')'};
    }
    if(active.kind==='collect'){done.add(active.points.indexOf(t));return {message:(active.item||'Abfall')+' erledigt: '+done.size+'/'+active.points.length};}
    return null;
  }
  function tick(dt,player,driving,held){
    if(!active||active.kind!=='hold'||done.size===active.points.length){progress=0;return null;}
    const t=challenge?active.points[challenge.index]:target(player);
    if(driving||distance(player,t)>2.6){progress=0;challenge=null;return null;}
    if(challenge){challenge.elapsed+=dt;return null;}
    if(!held){progress=0;return null;}
    progress+=dt;
    if(progress>=active.seconds){if(active.timing){challenge={index:active.points.indexOf(t),elapsed:0,hits:0};progress=0;return {type:'ready',message:active.id==='fishing'?'Es beisst! Tippe im grünen Bereich, um den Fisch zu landen.':'Jetzt präzise arbeiten: zweimal im grünen Bereich tippen.'};}done.add(active.points.indexOf(t));progress=0;return {message:(active.doneText||(active.id==='garden'?'Beet gegossen':'Motor repariert'))+' ('+done.size+'/'+active.points.length+')'};}
    return null;
  }
  return {startVenue(venue){const spec=world.jobs.find(j=>j.venue===venue);return spec?start(spec.id,null,venue):null;},finishVenue(venue){return active?.venue===venue&&done.size===active.points.length?complete():null;},start,target,interact,tick,get challenge(){return challenge;},get active(){return active;},get done(){return done;},get passenger(){return passenger;},get progress(){return progress;}};
}
