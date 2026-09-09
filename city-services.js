function createCityServices(world,wallet,activities){
  let meal=0,therapy=0;
  const specs=[
    {id:'patrol',venue:'police',name:'Stadtpatrouille',kind:'hold',seconds:1.5,timing:true,action:'Hinweis untersuchen',doneText:'Hinweis gesichert',reward:230,points:[{x:0,y:-40},{x:0,y:-170},{x:0,y:-285}]},
    {id:'fire-rescue',venue:'fire',name:'Feuerwehreinsatz',kind:'hold',seconds:4,action:'Feuer loeschen',doneText:'Feuer geloescht',reward:280,points:[{x:0,y:60},{x:0,y:150},{x:0,y:245}]},
    {id:'market-route',venue:'market',name:'Lebensmittel ausliefern',kind:'collect',action:'Einkauf abgeben',item:'Einkauf',reward:210,points:[{x:0,y:85},{x:0,y:200},{x:0,y:350}]}
  ];
  for(const spec of specs){const venue=world.venues.find(v=>v.id===spec.venue);Object.assign(spec,{x:venue.x,y:venue.y});world.jobs.push(spec);}
  function options(id){
    if(id==='restaurant')return [{id:'meal',label:meal>0?'Satt! Laufbonus noch '+Math.ceil(meal)+' s':'Warme Mahlzeit · 20 Muenzen · 3 Min. schneller laufen',disabled:meal>0||wallet.coins<20}];
    if(id==='hospital')return [{id:'therapy',label:therapy>0?'Erholt! Sprungbonus noch '+Math.ceil(therapy)+' s':'Kostenlose Physiotherapie · 3 Min. hoeher huepfen',disabled:therapy>0}];
    if(id==='bank')return [{id:'deposit',label:'100 Muenzen einzahlen',disabled:wallet.coins<100},{id:'withdraw',label:'100 Muenzen abheben',disabled:wallet.bankBalance<100}];
    const spec=specs.find(s=>s.venue===id);if(!spec)return [];
    if(activities.active?.id===spec.id)return [{id:'finish',label:activities.done.size===spec.points.length?'Lohn abholen · '+spec.reward+' Muenzen':'Auftrag laeuft · '+activities.done.size+'/'+spec.points.length,disabled:activities.done.size!==spec.points.length}];
    return [{id:'mission',label:spec.name+' · '+spec.reward+' Muenzen',disabled:!!activities.active||wallet.active}];
  }
  function use(venue,action){
    const option=options(venue).find(o=>o.id===action);if(!option||option.disabled)return 'Dieses Angebot ist gerade nicht verfuegbar.';
    if(action==='meal'){if(!wallet.spend(20))return 'Kauf konnte nicht gespeichert werden.';meal=180;return 'Guten Appetit! Drei Minuten lang 30% schneller laufen.';}
    if(action==='therapy'){therapy=180;return 'Gut erholt! Drei Minuten lang hoeher huepfen.';}
    if(action==='deposit'||action==='withdraw')return wallet.bankTransfer(action==='deposit'?100:-100)?'Gespeichert. Sparkonto: '+wallet.bankBalance+' Muenzen.':'Die Buchung konnte nicht gespeichert werden.';
    if(action==='mission')return activities.startVenue(venue)?.message||'Beende zuerst deinen anderen Auftrag.';
    if(action==='finish')return activities.finishVenue(venue)?.message||'Es fehlen noch Aufgaben.';
  }
  return {options,use,tick(dt){meal=Math.max(0,meal-dt);therapy=Math.max(0,therapy-dt);},get speed(){return meal>0?1.3:1;},get jump(){return therapy>0?6.5:5;},get meal(){return meal;},get therapy(){return therapy;}};
}
