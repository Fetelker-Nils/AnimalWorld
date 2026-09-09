const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const c=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'../adventure.js'),'utf8'),c);
const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},a=c.createAdventure(storage);
assert.equal(a.select('  Lilo  ','fox').name,'Lilo');assert.equal(c.createAdventure(storage).profile.species,'fox');
assert.equal(a.select('\u0000','unknown').name,'Mauz');assert.equal(a.profile.species,'cat');
assert.equal(a.tick(9.9,true),false);assert(a.air<.11);assert(a.tick(.2,true));assert.equal(a.air,10);
a.tick(7,true);a.tick(.1,false);assert.equal(a.air,10);assert(!a.wet);
console.log('PASS character selection, name validation, persistence, water countdown, drowning and recovery on land');
