function createActivities(world,wallet,storage=null){
  let active=null,done=new Set(),progress=0,passenger=false,challenge=null;
  let prepared=new Set(),preparedLabels=new Map(),carrying=null,tripIndex=0,round=0,rounds={};
  try{rounds=JSON.parse(storage?.getItem('animal-world-job-rounds-v1')||'{}')||{};}catch{}
  const cards={
    clean:[['Zerknuellte Zeitung','Papier','Glas','Bio'],['Leere Glasflasche','Glas','Bio','Papier'],['Bananenschale','Bio','Papier','Glas']],
    garden:[['Die Erde ist trocken. Was braucht das Beet?','Giesskanne','Harke','Kompost'],['Unkraut nimmt den Blumen Platz weg.','Harke','Kompost','Giesskanne'],['Die Erde ist ausgelaugt.','Kompost','Giesskanne','Harke']],
    repair:[['Der Reifen verliert Luft.','Reifen flicken','Batterie laden','Oel abdichten'],['Der Anlasser klickt nur noch.','Batterie laden','Oel abdichten','Reifen flicken'],['Unter dem Motor ist eine Oellache.','Oel abdichten','Reifen flicken','Batterie laden']],
    orchard:[['Nur reife Fruechte in den Korb!','Reifer Apfel','Gruener Apfel','Fauler Apfel'],['Welche Birne darf in die Lieferung?','Goldgelbe Birne','Harte gruene Birne','Schimmelige Birne']],
    trail:[['Ein Ast versperrt den Wanderweg.','Ast wegraeumen','Wegweiser drehen','Bruecke sperren'],['Der Wegweiser zeigt in den Wald.','Wegweiser richten','Bruecke sperren','Ast wegraeumen']],
    patrol:[['Frische Reifenspuren fuehren zur Kreuzung.','Reifenspuren sichern','Blumen zaehlen','Bank streichen']],
    'fire-rescue':[['Es brennt neben einer Stromleitung.','Strom abschalten','Sofort Wasser spritzen','Fenster oeffnen'],['Ein Tier steht im Rauch.','Tier in Sicherheit bringen','Material stapeln','Motor starten']],
    'market-route':[['Die Bestellung braucht etwas Frisches.','Obstkorb abgeben','Werkzeug abgeben','Altpapier abgeben']]
  };
  function openChoice(index,mode){
    const list=cards[active.id]||[['Den richtigen Schalter einstellen.','Rot','Gelb','Blau']],card=list[(round+index)%list.length],offset=(round+index)%3;
    const options=card.slice(1),rotated=options.slice(offset).concat(options.slice(0,offset));
    challenge={kind:'choice',index,mode,prompt:card[0],options:rotated,answer:(3-offset)%3,elapsed:0,hits:0};
    if(active.id==='electric'){challenge.sequence=[(round+index)%3,(round+index+2)%3,(round+index+1)%3];challenge.prompt='Schaltplan: '+challenge.sequence.map(i=>rotated[i]).join(' > ');challenge.answer=challenge.sequence[0];}
    return {message:challenge.prompt+' Waehle mit 1, 2, 3 oder tippe auf ein Werkzeug.'};
  }
  function choose(option,player,driving=false){
    if(!active||challenge?.kind!=='choice'||driving||!player||distance(player,target(player))>2.6||!Number.isInteger(option)||option<0||option>2)return null;
    if(option!==challenge.answer){challenge.hits=0;if(challenge.sequence)challenge.answer=challenge.sequence[0];return {type:'miss',message:'Das passt noch nicht. Schau dir den Auftrag genau an.'};}
    if(challenge.sequence&&++challenge.hits<challenge.sequence.length){challenge.answer=challenge.sequence[challenge.hits];return {type:'hit',message:'Schalter '+challenge.hits+' sitzt. Weiter nach Schaltplan.'};}
    const index=challenge.index,mode=challenge.mode,label=challenge.sequence?active.action:challenge.options[option];challenge=null;progress=0;
    if(mode==='prepare'){prepared.add(index);preparedLabels.set(index,label);return {type:'ready',message:'Werkzeug bereit! Jetzt E halten und die Arbeit ausfuehren.'};}
    done.add(index);carrying=null;return {type:'success',message:'Richtig erledigt! '+done.size+'/'+active.points.length};
  }
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function target(player){
    if(!active)return null;
    if(carrying!==null)return active;
    if(active.kind==='taxi')return active.points[passenger?tripIndex:0];
    const remaining=active.points.filter((_,i)=>!done.has(i));
    return remaining.length?remaining.reduce((a,b)=>distance(a,player)<distance(b,player)?a:b):active;
  }
  function start(id,player,venue=null){
    const spec=world.jobs.find(j=>j.id===id);
    if(active||wallet.active||!spec||(spec.venue?spec.venue!==venue:spec.workplace&&venue===spec.workplace?false:!player||distance(spec,player)>2.6))return null;
    round=Number.isSafeInteger(rounds[id])?rounds[id]:0;rounds[id]=round+1;
    try{storage?.setItem('animal-world-job-rounds-v1',JSON.stringify(rounds));}catch{}
    active={...spec,points:spec.points.map(p=>({...p}))};done=new Set();prepared=new Set();preparedLabels=new Map();carrying=null;tripIndex=1;progress=0;passenger=false;challenge=null;
    if(id==='taxi'&&round%3===1)active.points=[{x:0,y:-307,name:'Nordstadt'},{x:160,y:14,name:'Werkstatt'},{x:0,y:460,name:'Suedstrand'}];
    if(id==='taxi'&&round%3===2)active.points=[{x:520,y:14,name:'Osthafen'},{x:0,y:205,name:'Hafen'},{x:0,y:-307,name:'Nordstadt'}];
    return {type:'started',message:(spec.venue?'Auftrag am Empfang: ':'')+spec.name+' gestartet. '+(spec.kind==='taxi'?'Hole ein Auto an einer Telefonzelle und fahre zum Fahrgast.':'Folge den Markierungen. Am Ende zur Jobstation zurückkehren.')};
  }
  function complete(){
    const reward=active.reward;wallet.addReward(reward);active=null;progress=0;passenger=false;challenge=null;
    return {type:'completed',reward,message:'Job geschafft! +'+reward+' Münzen.'};
  }
  function interact(player,driving,speed=0){
    if(!active)return null;
    if(challenge?.kind==='choice')return {message:'Waehle eine der drei Aktionen (1 / 2 / 3).'};
    const t=target(player),range=active.kind==='taxi'?4:2.6;
    if(distance(player,t)>range)return null;
    if(active.kind==='taxi'){
      if(!driving)return {message:'Steige zuerst in ein Auto (F).'};
      if(Math.abs(speed)>.6)return {message:'Bitte anhalten, damit der Fahrgast sicher ein- oder aussteigen kann.'};
      if(!passenger){passenger=true;return {message:'Fahrgast an Bord! Naechster Halt: '+(active.points[tripIndex].name||'Fahrtziel')};}
      if(tripIndex<active.points.length-1){tripIndex++;return {message:'Danke fuer den Zwischenstopp! Weiter nach '+active.points[tripIndex].name};}
      return complete();
    }
    if(driving)return {message:'Steige mit F aus, um hier zu arbeiten.'};
    if(done.size===active.points.length)return active.venue?{message:'Zurueck ins Gebaeude: Lohn am Empfang abholen.'}:complete();
    if(carrying!==null)return openChoice(carrying,'sort');
    if(challenge){
      if(distance(player,active.points[challenge.index])>2.6){challenge=null;progress=0;return null;}
      const marker=(challenge.elapsed%challenge.period)/challenge.period;
      if(marker<.45||marker>.7){challenge.elapsed=0;return {type:'miss',message:active.id==='fishing'?'Der Fisch zappelt! Warte auf den grünen Bereich.':'Knapp daneben! Tippe im grünen Bereich.'};}
      challenge.hits++;
      if(challenge.hits<challenge.required){challenge.elapsed=0;return {type:'hit',message:'Gut getroffen! Noch ein Treffer.'};}
      done.add(challenge.index);challenge=null;progress=0;
      return {type:'success',message:(active.doneText||'Motor repariert')+' ('+done.size+'/'+active.points.length+')'};
    }
    if(active.kind==='collect'){const index=active.points.indexOf(t);if(active.id==='clean'){carrying=index;return {message:cards.clean[(round+index)%3][0]+' aufgehoben. Bring den Abfall zum Sortierplatz.'};}return openChoice(index,'finish');}
    if(active.id!=='fishing'&&!prepared.has(active.points.indexOf(t)))return openChoice(active.points.indexOf(t),'prepare');
    return null;
  }
  function tick(dt,player,driving,held){
    if(challenge?.kind==='choice'){if(driving||distance(player,target(player))>2.6){challenge=null;progress=0;}return null;}
    if(!active||active.kind!=='hold'||done.size===active.points.length){progress=0;return null;}
    const t=challenge?active.points[challenge.index]:target(player);
    if(driving||distance(player,t)>2.6){progress=0;challenge=null;return null;}
    if(challenge){challenge.elapsed+=dt;return null;}
    if(!held){progress=0;return null;}
    if(active.id!=='fishing'&&!prepared.has(active.points.indexOf(t)))return openChoice(active.points.indexOf(t),'prepare');
    progress+=dt;
    if(progress>=active.seconds){if(active.timing){challenge={kind:'timing',index:active.points.indexOf(t),elapsed:0,hits:0,period:1.4+((round+active.points.indexOf(t))%3)*.2,required:active.id==='fishing'?3:2};progress=0;return {type:'ready',message:active.id==='fishing'?'Es beisst! Tippe im grünen Bereich, um den Fisch zu landen.':'Jetzt präzise arbeiten: zweimal im grünen Bereich tippen.'};}done.add(active.points.indexOf(t));progress=0;return {message:(active.doneText||(active.id==='garden'?'Beet gepflegt':'Motor repariert'))+' ('+done.size+'/'+active.points.length+')'};}
    return null;
  }
  return {workAction(player){return active?(preparedLabels.get(active.points.indexOf(target(player)))||active.action):'';},choose,get carrying(){return carrying;},startWorkplace(id){const spec=world.jobs.find(j=>j.workplace===id);return spec?start(spec.id,null,id):null;},finishWorkplace(id){return active?.workplace===id&&done.size===active.points.length?complete():null;},startVenue(venue){const spec=world.jobs.find(j=>j.venue===venue);return spec?start(spec.id,null,venue):null;},finishVenue(venue){return active?.venue===venue&&done.size===active.points.length?complete():null;},start,target,interact,tick,get challenge(){return challenge;},get active(){return active;},get done(){return done;},get passenger(){return passenger;},get progress(){return progress;}};
}
