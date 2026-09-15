// Repeatable offline job. Only completed deliveries award coins.
function createDeliveryJob(storage, world) {
  const key = 'animal-world-deliveries-v1';
  let bankBalance=0,pendingOnlineHome=null;
  let coins = 0, completed = 0, active = false, storageAvailable = true;
  let registeredHomes=[],ownedHomes=[],homeId=null,ownedOutfits=[],outfitId=null;
  try {
    const saved = JSON.parse(storage.getItem(key) || 'null');
    if (saved && Number.isSafeInteger(saved.coins) && saved.coins >= 0 && Number.isSafeInteger(saved.completed) && saved.completed >= 0) {
      if(saved.pendingOnlineHome&&world.homes.some(h=>h.id===saved.pendingOnlineHome.id&&h.price===saved.pendingOnlineHome.amount)&&typeof saved.pendingOnlineHome.request==='string')pendingOnlineHome=saved.pendingOnlineHome;
      coins = saved.coins; completed = saved.completed;
      if(Number.isSafeInteger(saved.bankBalance)&&saved.bankBalance>=0)bankBalance=saved.bankBalance;
      if(Array.isArray(saved.ownedHomes))ownedHomes=[...new Set(saved.ownedHomes.filter(id=>world.homes.some(h=>h.id===id)))];
      if(Array.isArray(saved.registeredHomes))registeredHomes=[...new Set(saved.registeredHomes.filter(id=>world.homes.some(h=>h.id===id)))];
      if(ownedHomes.includes(saved.homeId))homeId=saved.homeId;
      if(Array.isArray(saved.ownedOutfits))ownedOutfits=[...new Set(saved.ownedOutfits.filter(id=>world.outfits.some(o=>o.id===id)))];
      if(ownedOutfits.includes(saved.outfitId))outfitId=saved.outfitId;
    }
  } catch { storageAvailable = false; }
  const route = () => world.deliveries[completed % world.deliveries.length];
  const target = () => active ? route() : world.depot;
  const distance = player => Math.hypot(player.x-target().x, player.y-target().y);
  function save(){
    try { storage.setItem(key, JSON.stringify({registeredHomes,pendingOnlineHome,bankBalance,coins,completed,ownedHomes,homeId,ownedOutfits,outfitId})); storageAvailable=true; }
    catch { storageAvailable=false; }
  }
  function addReward(amount){
    if(!Number.isSafeInteger(amount)||amount<=0)throw Error('Invalid reward');
    coins+=amount;save();
  }
  function spend(amount){
    if(!Number.isSafeInteger(amount)||amount<=0||coins<amount)return false;
    try{storage.setItem(key,JSON.stringify({registeredHomes,pendingOnlineHome,bankBalance,coins:coins-amount,completed,ownedHomes,homeId,ownedOutfits,outfitId}));}catch{storageAvailable=false;return false;}
    coins-=amount;storageAvailable=true;return true;
  }
  function bankTransfer(amount){
    if(!Number.isSafeInteger(amount)||amount===0||coins-amount<0||bankBalance+amount<0||!Number.isSafeInteger(coins-amount)||!Number.isSafeInteger(bankBalance+amount))return false;
    try{storage.setItem(key,JSON.stringify({registeredHomes,pendingOnlineHome,bankBalance:bankBalance+amount,coins:coins-amount,completed,ownedHomes,homeId,ownedOutfits,outfitId}));}catch{storageAvailable=false;return false;}
    coins-=amount;bankBalance+=amount;storageAvailable=true;return true;
  }
  function propertySave(next){
    try{storage.setItem(key,JSON.stringify({bankBalance,coins,completed,ownedHomes,homeId,ownedOutfits,outfitId,registeredHomes,pendingOnlineHome,...next}));}
    catch{storageAvailable=false;return false;}
    if('coins' in next)coins=next.coins;
    if('ownedHomes' in next)ownedHomes=next.ownedHomes;
    if('registeredHomes' in next)registeredHomes=next.registeredHomes;
    if('homeId' in next)homeId=next.homeId;
    if('pendingOnlineHome' in next)pendingOnlineHome=next.pendingOnlineHome;
    storageAvailable=true;return true;
  }
  function reserveOnlineHome(id,request,action='buy'){
    const home=world.homes.find(h=>h.id===id);
    if(!home||pendingOnlineHome||!['buy','sell'].includes(action)||action==='buy'&&(coins<home.price||ownedHomes.includes(id))||action==='sell'&&!ownedHomes.includes(id))return false;
    return propertySave({coins:coins-(action==='buy'?home.price:0),pendingOnlineHome:{id,request,amount:home.price,action}});
  }
  function finishOnlineHome(result){
    if(!pendingOnlineHome||result.request!==pendingOnlineHome.request)return false;
    const op=pendingOnlineHome,action=op.action||'buy',home=world.homes.find(h=>h.id===op.id);
    let balance=coins,owned=[...ownedHomes],registered=[...registeredHomes];
    if(action==='buy'){
      if(result.ok){owned=[...new Set([...owned,op.id])];registered=[...new Set([...registered,op.id])];}
      else balance+=op.amount;
    }else if(action==='claim'){
      if(result.ok)registered=[...new Set([...registered,op.id])];
      else {owned=owned.filter(id=>id!==op.id);balance+=home.price;}
    }else if(result.ok||action==='release'){
      owned=owned.filter(id=>id!==op.id);registered=registered.filter(id=>id!==op.id);
      if(action==='sell'&&result.ok)balance+=Math.floor(home.price*.8);
    }
    return propertySave({coins:balance,ownedHomes:owned,registeredHomes:registered,homeId:owned.includes(homeId)?homeId:owned[0]||null,pendingOnlineHome:null});
  }
  // Reconcile one property at a time: offline sales release reservations, while
  // offline purchases claim free units. A conflict refunds the local purchase.
  function syncProperties(mine,request){
    if(pendingOnlineHome)return pendingOnlineHome;
    mine=mine.filter(id=>world.homes.some(h=>h.id===id));
    const owned=ownedHomes.filter(id=>!registeredHomes.includes(id)||mine.includes(id));
    for(const id of mine)if(!registeredHomes.includes(id)&&!owned.includes(id))owned.push(id);
    const registered=[...new Set([...registeredHomes.filter(id=>mine.includes(id)),...mine])];
    const release=registered.find(id=>!owned.includes(id)),claim=owned.find(id=>!registered.includes(id));
    const id=release||claim,home=world.homes.find(h=>h.id===id);
    const pending=id?{id,request,amount:home.price,action:release?'release':'claim'}:null;
    if(!propertySave({ownedHomes:owned,registeredHomes:registered,homeId:owned.includes(homeId)?homeId:owned[0]||null,pendingOnlineHome:pending}))return null;
    return pending;
  }
  function sellHome(id){
    const house=world.homes.find(h=>h.id===id);
    if(!house||!ownedHomes.includes(id)||pendingOnlineHome)return {ok:false,reason:'Verkauf gerade nicht moeglich.'};
    const owned=ownedHomes.filter(h=>h!==id),refund=Math.floor(house.price*.8);
    const ok=propertySave({coins:coins+refund,ownedHomes:owned,homeId:homeId===id?owned[0]||null:homeId});
    return {ok,reason:ok?'Verkauft! '+refund+' Muenzen zurueck.':'Verkauf konnte nicht gespeichert werden.'};
  }
  function purchaseHome(id){
    const house=world.homes.find(h=>h.id===id);
    if(!house)return {ok:false,reason:'Dieses Haus ist nicht verfügbar.'};
    if(pendingOnlineHome)return {ok:false,reason:'Eigentum wird noch abgeglichen.'};
    if(ownedHomes.includes(id))return {ok:false,reason:'Dieses Haus gehört dir bereits.'};
    if(coins<house.price)return {ok:false,reason:'Dir fehlen '+(house.price-coins)+' Münzen.'};
    const next={registeredHomes,pendingOnlineHome,bankBalance,coins:coins-house.price,completed,ownedHomes:[...ownedHomes,id],homeId:homeId||id,ownedOutfits,outfitId};
    try{storage.setItem(key,JSON.stringify(next));}
    catch{storageAvailable=false;return {ok:false,reason:'Kauf nicht gespeichert. Es wurden keine Münzen abgezogen.'};}
    coins=next.coins;ownedHomes=next.ownedHomes;homeId=next.homeId;storageAvailable=true;
    return {ok:true};
  }
  function setHome(id){
    if(!ownedHomes.includes(id))return false;
    try{storage.setItem(key,JSON.stringify({registeredHomes,pendingOnlineHome,bankBalance,coins,completed,ownedHomes,homeId:id,ownedOutfits,outfitId}));}
    catch{storageAvailable=false;return false;}
    homeId=id;storageAvailable=true;return true;
  }
  function purchaseOutfit(id){
    const outfit=world.outfits.find(o=>o.id===id);
    if(!outfit)return {ok:false,reason:'Dieses Outfit gibt es nicht.'};
    if(ownedOutfits.includes(id))return {ok:false,reason:'Dieses Outfit besitzt du bereits.'};
    if(coins<outfit.price)return {ok:false,reason:'Dir fehlen '+(outfit.price-coins)+' Muenzen.'};
    const next={registeredHomes,pendingOnlineHome,bankBalance,coins:coins-outfit.price,completed,ownedHomes,homeId,ownedOutfits:[...ownedOutfits,id],outfitId:id};
    try{storage.setItem(key,JSON.stringify(next));}catch{storageAvailable=false;return {ok:false,reason:'Nicht gespeichert. Es wurden keine Muenzen abgezogen.'};}
    coins=next.coins;ownedOutfits=next.ownedOutfits;outfitId=id;storageAvailable=true;return {ok:true};
  }
  function equipOutfit(id){
    if(id!==null&&!ownedOutfits.includes(id))return false;
    try{storage.setItem(key,JSON.stringify({registeredHomes,pendingOnlineHome,bankBalance,coins,completed,ownedHomes,homeId,ownedOutfits,outfitId:id}));}catch{storageAvailable=false;return false;}
    outfitId=id;storageAvailable=true;return true;
  }
  function interact(player) {
    if (distance(player) > 2.6) return null;
    if (!active) { active = true; return {type:'accepted', name:route().name}; }
    const reward = route().reward;
    coins += reward; completed++; active = false;
    save();
    return {type:'completed',reward};
  }
  return {sellHome,syncProperties,reserveOnlineHome,finishOnlineHome,get pendingOnlineHome(){return pendingOnlineHome;},spend,bankTransfer,get bankBalance(){return bankBalance;},purchaseOutfit,equipOutfit,get ownedOutfits(){return [...ownedOutfits];},get outfitId(){return outfitId;},target, distance, interact, addReward,purchaseHome,setHome,get ownedHomes(){return [...ownedHomes];},get homeId(){return homeId;}, get active(){return active;}, get coins(){return coins;}, get completed(){return completed;}, get reward(){return route().reward;}, get storageAvailable(){return storageAvailable;}};
}
