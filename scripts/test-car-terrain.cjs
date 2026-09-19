const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const c=vm.createContext({});vm.runInContext(fs.readFileSync('vehicles.js','utf8')+';globalThis.models=VehicleModels',c);
const booth={x:0,y:0,sx:10,sy:0},world={heightAt:(x,y)=>x*.6+y*.2,inBounds:()=>true,booths:[booth],inSea:()=>false};
for(const model of c.models.filter(m=>!m.kind)){
 for(const heading of [0,Math.PI/2,Math.PI]){const pose=c.vehicleGroundPose(world,{x:10,y:0,heading,model});assert(Math.abs(Math.hypot(...pose.forward)-1)<1e-9);assert(Math.abs(Math.hypot(...pose.side)-1)<1e-9);assert(Math.abs(pose.forward.reduce((n,v,i)=>n+v*pose.up[i],0))<1e-9);assert(pose.up[2]>0);if(heading===0){assert(pose.grade>0);assert(pose.bank>0);}if(heading===Math.PI)assert(pose.grade<0);}
 let impacts=0;const cars=c.createVehicles(world,()=>true,()=>impacts++),player={x:0,y:0};assert(cars.spawn(model.id,booth,player));player.x=10;assert(cars.toggle(player));cars.car.heading=0;for(let i=0;i<120;i++)cars.step(1/60,1,0,false,player);assert(cars.car.x>15);assert(world.heightAt(player.x,player.y)>6);assert.equal(impacts,0);
 const blocked=c.createVehicles(world,(x)=>x<14);assert(!blocked.clearAt(14,0,0,model),'Obstacles still block cars');
}
console.log('PASS all cars climb ramps, pitch/bank follow terrain, rotations remain rigid, obstacles still block');
