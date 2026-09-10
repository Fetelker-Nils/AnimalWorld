const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const c=vm.createContext({});for(const f of ['world.js','housing.js','property-ledger.js','delivery.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../'+f),'utf8'),c);
 const homes=c.AnimalIsland.homes,apartment=homes.find(h=>h.type==='apartment'),villa=homes.find(h=>h.type==='villa');
 assert(c.housingLayout(homes.find(h=>h.id==='east')).w>c.housingLayout(homes.find(h=>h.id==='village')).w,'Larger house has larger interior');
 assert(c.housingLayout(apartment).w*c.housingLayout(apartment).d<c.housingLayout(villa).w*c.housingLayout(villa).d);
 assert(homes.filter(h=>h.buildingId===apartment.buildingId).length===apartment.floors*2);assert.equal(new Set(homes.map(h=>h.id)).size,homes.length);
 // The landing rail cannot be crossed from the side, even at floor height.
 assert.equal(c.stairSurface(4.4,-3,4,4),null);
 assert.equal(c.stairSurface(0,1.6,4,4),4,'Landing opening stays walkable');
 assert.notEqual(c.stairSurface(1,-3,3,4),null,'Inner stair flight has no missing floor');
 const geometry=c.staircaseGeometry(4);
 assert(geometry.mesh.every(f=>f.points.every(p=>p.every(Number.isFinite))));
 assert(geometry.boxes.some(b=>b.z===12&&b.color==='#547d80'),'Doors on the third floor');
 const db=new Map();let tail=Promise.resolve();const storage={async get(k){return db.get(k);},async put(k,v){db.set(k,v);},transaction(fn){const run=tail.then(()=>fn(storage));tail=run.catch(()=>{});return run;}};
 const buy=(owner,request,id=apartment.id)=>c.purchaseProperty(storage,homes,owner,{id,request,amount:homes.find(h=>h.id===id).price});
 const [a,b]=await Promise.all([buy('alice','aaaaaaaa-11111111'),buy('bob','bbbbbbbb-22222222')]);assert(a.ok);assert(!b.ok);assert.equal(db.get('property:'+apartment.id).owner,'alice');
 assert((await buy('alice','aaaaaaaa-11111111')).ok,'Lost success acknowledgement is idempotent');assert(!(await buy('alice','aaaaaaaa-33333333')).ok,'Same owner cannot buy twice');
 const other=homes.find(h=>h.buildingId===apartment.buildingId&&h.floor===1&&h.unit===1);assert((await buy('bob','bbbbbbbb-44444444',other.id)).ok,'Different apartment has its own owner');
 const wallet=new Map([['animal-world-deliveries-v1',JSON.stringify({coins:10000,completed:0})]]),local={getItem:k=>wallet.get(k),setItem:(k,v)=>wallet.set(k,v)};
 let job=c.createDeliveryJob(local,c.AnimalIsland);assert(job.reserveOnlineHome(apartment.id,'aaaaaaaa-11111111'));const balance=job.coins;
 job=c.createDeliveryJob(local,c.AnimalIsland);assert(job.pendingOnlineHome);assert(job.finishOnlineHome(a));assert.equal(job.coins,balance);assert(!job.finishOnlineHome(a),'Duplicate acknowledgement cannot debit twice');
 assert(job.reserveOnlineHome(other.id,'bbbbbbbb-22222222'));assert(job.finishOnlineHome(b));assert.equal(job.coins,balance,'Rejected purchase refunds reserved coins');
 const before=job.coins;local.setItem=()=>{throw Error('full');};assert(!job.reserveOnlineHome(villa.id,'cccccccc-11111111'));assert.equal(job.coins,before,'Failed storage does not debit wallet');
 console.log('PASS housing: apartment floors, unique units, varied sizes, concurrent exclusive purchase, independent owners, idempotency, pending purchase recovery and atomic wallet/refunds');
})().catch(e=>{console.error(e);process.exitCode=1;});
