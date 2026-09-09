const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const ctx=vm.createContext({});
for(const file of ['world.js','delivery.js','activities.js','city-services.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
vm.runInContext('globalThis.world=Island',ctx);
const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
const wallet=ctx.createDeliveryJob(storage,ctx.world),jobs=ctx.createActivities(ctx.world,wallet),city=ctx.createCityServices(ctx.world,wallet,jobs);
wallet.addReward(1000);
assert(wallet.bankTransfer(100));assert.equal(wallet.coins,900);assert.equal(wallet.bankBalance,100);
assert(!wallet.bankTransfer(-101));assert(!wallet.bankTransfer(901));assert(!wallet.bankTransfer(NaN));
assert(wallet.purchaseOutfit('street').ok);wallet.addReward(10);assert(wallet.equipOutfit(null));
assert.equal(ctx.createDeliveryJob(storage,ctx.world).bankBalance,100,'Other purchases must preserve savings');
assert(wallet.bankTransfer(-100));
const failing=ctx.createDeliveryJob({getItem:storage.getItem,setItem(){throw Error('Storage full');}},ctx.world);
const before=failing.coins;assert(!failing.bankTransfer(100));assert(!failing.spend(20));assert.equal(failing.coins,before);
const money=wallet.coins;city.use('restaurant','meal');assert.equal(wallet.coins,money-20);assert.equal(city.speed,1.3);
city.use('restaurant','meal');assert.equal(wallet.coins,money-20,'No duplicate meal charge');city.tick(181);assert.equal(city.speed,1);
city.use('hospital','therapy');assert.equal(city.jump,6.5);city.tick(181);assert.equal(city.jump,5);
for(const venue of ['police','fire','market']){
  city.use(venue,'mission');const spec=jobs.active;assert.equal(spec.venue,venue);
  assert.equal(jobs.startVenue(venue),null,'No duplicate active mission');
  assert.equal(jobs.finishVenue(venue),null,'No early reward');
  const cash=wallet.coins;
  for(const point of spec.points){
    assert(!ctx.world.blocked(point.x,point.y),'Mission target accessible');
    if(spec.kind==='hold'){
      jobs.tick(.5,point,false,true);jobs.tick(.1,point,false,false);assert.equal(jobs.progress,0,'Release cancels unfinished work');
      jobs.tick(spec.seconds+.1,point,false,true);
      while(jobs.challenge){jobs.tick(.9,point,false,false);jobs.interact(point,false);}
    }else jobs.interact(point,false);
  }
  assert.equal(wallet.coins,cash);jobs.interact(spec,false);assert.equal(wallet.coins,cash,'Collect pay inside the building');
  assert.equal(jobs.finishVenue('clothes'),null);
  city.use(venue,'finish');assert.equal(wallet.coins,cash+spec.reward);assert.equal(jobs.active,null);
  city.use(venue,'finish');assert.equal(wallet.coins,cash+spec.reward,'No duplicate payout');
}
for(const building of ctx.world.buildings)assert(building.homeId||building.venueId||building.jobId,'Every building has a use');
for(const h of ctx.world.homes)assert(!ctx.world.blocked(h.x,h.y),'Home entrance accessible: '+h.id);
console.log('PASS city: all buildings useful, three complete missions, timed actions, atomic bank transfers, persistence, food and therapy bonuses');
