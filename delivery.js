// Repeatable offline job. Only completed deliveries award coins.
function createDeliveryJob(storage, world) {
  const key = 'animal-world-deliveries-v1';
  let coins = 0, completed = 0, active = false, storageAvailable = true;
  let ownedHomes=[],homeId=null;
  try {
    const saved = JSON.parse(storage.getItem(key) || 'null');
    if (saved && Number.isSafeInteger(saved.coins) && saved.coins >= 0 && Number.isSafeInteger(saved.completed) && saved.completed >= 0) {
      coins = saved.coins; completed = saved.completed;
      if(Array.isArray(saved.ownedHomes))ownedHomes=[...new Set(saved.ownedHomes.filter(id=>world.homes.some(h=>h.id===id)))];
      if(ownedHomes.includes(saved.homeId))homeId=saved.homeId;
    }
  } catch { storageAvailable = false; }
  const route = () => world.deliveries[completed % world.deliveries.length];
  const target = () => active ? route() : world.depot;
  const distance = player => Math.hypot(player.x-target().x, player.y-target().y);
  function save(){
    try { storage.setItem(key, JSON.stringify({coins,completed,ownedHomes,homeId})); storageAvailable=true; }
    catch { storageAvailable=false; }
  }
  function addReward(amount){
    if(!Number.isSafeInteger(amount)||amount<=0)throw Error('Invalid reward');
    coins+=amount;save();
  }
  function purchaseHome(id){
    const house=world.homes.find(h=>h.id===id);
    if(!house)return {ok:false,reason:'Dieses Haus ist nicht verfügbar.'};
    if(ownedHomes.includes(id))return {ok:false,reason:'Dieses Haus gehört dir bereits.'};
    if(coins<house.price)return {ok:false,reason:'Dir fehlen '+(house.price-coins)+' Münzen.'};
    const next={coins:coins-house.price,completed,ownedHomes:[...ownedHomes,id],homeId:homeId||id};
    try{storage.setItem(key,JSON.stringify(next));}
    catch{storageAvailable=false;return {ok:false,reason:'Kauf nicht gespeichert. Es wurden keine Münzen abgezogen.'};}
    coins=next.coins;ownedHomes=next.ownedHomes;homeId=next.homeId;storageAvailable=true;
    return {ok:true};
  }
  function setHome(id){
    if(!ownedHomes.includes(id))return false;
    try{storage.setItem(key,JSON.stringify({coins,completed,ownedHomes,homeId:id}));}
    catch{storageAvailable=false;return false;}
    homeId=id;storageAvailable=true;return true;
  }
  function interact(player) {
    if (distance(player) > 2.6) return null;
    if (!active) { active = true; return {type:'accepted', name:route().name}; }
    const reward = route().reward;
    coins += reward; completed++; active = false;
    save();
    return {type:'completed',reward};
  }
  return {target, distance, interact, addReward,purchaseHome,setHome,get ownedHomes(){return [...ownedHomes];},get homeId(){return homeId;}, get active(){return active;}, get coins(){return coins;}, get completed(){return completed;}, get reward(){return route().reward;}, get storageAvailable(){return storageAvailable;}};
}
