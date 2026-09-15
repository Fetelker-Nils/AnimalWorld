const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{
 const c=vm.createContext({});for(const f of ['world.js','delivery.js','property-ledger.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c);
 const homes=c.AnimalIsland.homes,units=homes.filter(h=>h.type==='apartment'),a=units[0],b=units[1],db=new Map();let tail=Promise.resolve(),serial=0;
 const storage={async get(k){return db.get(k)},async put(k,v){db.set(k,v)},async delete(k){db.delete(k)},transaction(fn){const p=tail.then(()=>fn(storage));tail=p.catch(()=>{});return p;}};
 const request=()=>`property-test-${String(++serial).padStart(8,'0')}`;
 const transact=(owner,op)=>c.purchaseProperty(storage,homes,owner,op);
 const mine=owner=>[...db.entries()].filter(([k,v])=>k.startsWith('property:')&&v.owner===owner).map(([,v])=>v.id);
 const local=()=>{const map=new Map([['animal-world-deliveries-v1',JSON.stringify({coins:1000000,completed:0})]]);return {getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)}};
 const aliceStore=local();let alice=c.createDeliveryJob(aliceStore,c.AnimalIsland);const bob=c.createDeliveryJob(local(),c.AnimalIsland);
 async function sync(job,owner){for(let i=0;i<100;i++){const op=job.syncProperties(mine(owner),request());if(!op)return;const result=await transact(owner,op);assert(job.finishOnlineHome(result));}throw Error('sync loop')}
 assert(alice.purchaseHome(a.id).ok);assert(alice.purchaseHome(b.id).ok);const paid=alice.coins;await sync(alice,'alice');assert.equal(alice.coins,paid);assert.equal(mine('alice').length,2);
 alice=c.createDeliveryJob(aliceStore,c.AnimalIsland);assert.equal(alice.ownedHomes.length,2,'Same ownership offline after reload');
 assert(bob.purchaseHome(a.id).ok);await sync(bob,'bob');assert.equal(bob.coins,1000000,'Offline conflict fully refunded');assert.equal(bob.ownedHomes.length,0);
 assert(alice.reserveOnlineHome(a.id,request(),'sell'));const sale={...alice.pendingOnlineHome},result=await transact('alice',sale);assert(result.ok);assert(alice.finishOnlineHome(result));assert(!alice.finishOnlineHome(result));assert.equal(alice.coins,paid+Math.floor(a.price*.8));
 assert(!(await transact('bob',{id:b.id,amount:b.price,request:request(),action:'sell'})).ok,'Cannot sell another owner property');
 const buy={id:a.id,amount:a.price,request:request()};assert(bob.reserveOnlineHome(a.id,buy.request));const bought=await transact('bob',buy);assert(bought.ok);assert(bob.finishOnlineHome(bought));
 assert((await transact('alice',sale)).ok,'Sale replay returns receipt');assert.equal(db.get('property:'+a.id).owner,'bob','Sale replay cannot delete new owner');
 assert(alice.sellHome(b.id).ok);const soldBalance=alice.coins;alice=c.createDeliveryJob(aliceStore,c.AnimalIsland);await sync(alice,'alice');assert(!db.has('property:'+b.id));assert.equal(alice.coins,soldBalance,'Offline sale paid once');
 for(const h of homes.slice(0,12))if(h.id!==a.id)assert(alice.purchaseHome(h.id).ok);await sync(alice,'alice');assert(alice.ownedHomes.length>=10,'No per-player ownership cap');
 const balance=alice.coins,owned=[...alice.ownedHomes];aliceStore.setItem=()=>{throw Error('full')};assert(!alice.sellHome(owned[0]).ok);assert.equal(alice.coins,balance);assert.deepEqual([...alice.ownedHomes],owned);
 // Two buyers compete for the exact same unit, using distinct requests.
 const free=homes.find(h=>!db.has('property:'+h.id));const results=await Promise.all(['x','y'].map(owner=>transact(owner,{id:free.id,amount:free.price,request:request()})));assert.equal(results.filter(r=>r.ok).length,1);
 console.log('PASS unified ownership: offline/online/reload, conflict refund, sale replay, owner protection, release, unlimited holdings, concurrent purchase and atomic storage failure');
})().catch(e=>{console.error(e);process.exitCode=1});
