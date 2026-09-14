function createSaveWorlds(raw){
  const key='animal-world-slots-v1';
  let data={active:0,slots:[{name:'Welt 1'},null,null,null]};
  try{const saved=JSON.parse(raw.getItem(key)||'null');if(saved&&Array.isArray(saved.slots)&&saved.slots.length===4){const slots=saved.slots.map(s=>s&&typeof s.name==='string'?{name:s.name.slice(0,24)}:null);if(Number.isInteger(saved.active)&&slots[saved.active])data={active:saved.active,slots};}}catch{}
  const address=(slot,k)=>slot===0||k==='animal-world-audio'?k:'animal-world-slot-'+(slot+1)+':'+k;
  function commit(next){raw.setItem(key,JSON.stringify(next));data=next;}
  // Bind this game session to its original slot, including saves during page unload.
  const sessionSlot=data.active;
  const storage={getItem:k=>raw.getItem(address(sessionSlot,k)),setItem:(k,v)=>raw.setItem(address(sessionSlot,k),v)};
  return {storage,get active(){return data.active;},list(){return data.slots.map((slot,i)=>{
    if(!slot)return null;let stats={};try{stats=JSON.parse(raw.getItem(address(i,'animal-world-deliveries-v1'))||'{}');}catch{}
    return {...slot,coins:Number.isSafeInteger(stats?.coins)?stats.coins:0,completed:Number.isSafeInteger(stats?.completed)?stats.completed:0};
  });},select(i){if(!Number.isInteger(i)||i<0||i>=4||!data.slots[i])throw Error('Diese Welt existiert nicht.');commit({...data,active:i});},create(i,name){if(!Number.isInteger(i)||i<0||i>=4||data.slots[i])throw Error('Es gibt vier Speicherplaetze.');const slots=data.slots.slice();slots[i]={name:String(name||'Welt '+(i+1)).trim().slice(0,24)||'Welt '+(i+1)};commit({active:i,slots});},rename(name){const slots=data.slots.slice();slots[data.active]={name:String(name).trim().slice(0,24)||'Welt '+(data.active+1)};commit({...data,slots});}};
}
if(typeof module!=='undefined')module.exports={createSaveWorlds};
