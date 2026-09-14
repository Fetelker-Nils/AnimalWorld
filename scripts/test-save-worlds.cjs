const assert=require('node:assert/strict'),{createSaveWorlds}=require('../save-worlds.js');
const values=new Map([['animal-world-deliveries-v1',JSON.stringify({coins:123,completed:4})],['animal-world-owner-key','legacy-owner']]);
const raw={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
let a=createSaveWorlds(raw);assert.equal(a.list()[0].coins,123);assert.equal(a.storage.getItem('animal-world-owner-key'),'legacy-owner');
for(let i=1;i<4;i++){a.create(i,'Insel '+i);const fresh=createSaveWorlds(raw);assert.equal(fresh.active,i);assert.equal(fresh.storage.getItem('animal-world-deliveries-v1'),null);assert.equal(fresh.storage.getItem('animal-world-owner-key'),null);fresh.storage.setItem('animal-world-deliveries-v1',JSON.stringify({coins:i*10,completed:i}));fresh.storage.setItem('animal-world-owner-key','owner-'+i);}
assert.throws(()=>a.create(4));assert.throws(()=>a.create(1));
a.storage.setItem('animal-world-clock-v1','old-session-save');assert.equal(raw.getItem('animal-world-clock-v1'),'old-session-save');assert.equal(raw.getItem('animal-world-slot-4:animal-world-clock-v1'),null,'Unload cannot contaminate next slot');
for(let i=0;i<4;i++){a.select(i);const fresh=createSaveWorlds(raw);assert.equal(fresh.list()[i].coins,i?i*10:123);fresh.rename('Name '+i);assert.equal(createSaveWorlds(raw).list()[i].name,'Name '+i);}
const denied=createSaveWorlds({getItem:()=>null,setItem(){throw Error('quota');}});assert.throws(()=>denied.create(1));assert.equal(denied.active,0);assert.equal(denied.list()[1],null);
console.log('PASS four slots, legacy migration, independent wallets/identities, safe unload, names and atomic storage failure');
