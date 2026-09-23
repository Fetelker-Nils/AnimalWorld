const assert=require('node:assert/strict');require('../world.js');
for(const side of [1,2]){
 const lines=['RE','IC','ICE','UE'].map(type=>AnimalIsland.railLines.find(l=>l.id===type+side));
 assert.equal(new Set(lines.map(l=>l.terminus)).size,4,'Each class has its own terminus');
 assert.deepEqual(lines.map(l=>l.callingAt.length),[6,3,2,1],'Regional services stop more often');
 for(const l of lines){assert(l.route.some(p=>p.name===l.terminus&&p.terminal));assert(l.route.some(p=>p.name==='Mauz Hauptbahnhof'&&p.terminal));}
 const ic=lines[1],ice=lines[2];assert.notEqual(ic.terminus,ice.terminus);
 // Different destinations must create real track branches, not just different labels.
 const end=ic.route.find(p=>p.name===ic.terminus);assert(!ice.route.some(p=>Math.hypot(p.x-end.x,p.y-end.y)<300),'IC destination has its own branch');
}
console.log('PASS distinct northern/southern termini, stopping patterns and physical branches');

for(const l of AnimalIsland.railLines.filter(l=>l.type))for(let i=0;i<l.route.length;i++){
 const a=l.route[i],b=l.route[(i+1)%l.route.length],n=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/15);
 for(let k=0;k<=n;k++){const x=a.x+(b.x-a.x)*k/n,y=a.y+(b.y-a.y)*k/n;assert(!AnimalIsland.blocked(x,y),l.id+' obstacle at '+x+','+y);}
}
for(const side of [1,2]){
 const xs=['RE','IC','ICE','UE'].map(type=>{const l=AnimalIsland.railLines.find(l=>l.id===type+side);return l.route.find(p=>Math.abs(p.y)>8000).x;});
 for(let i=1;i<xs.length;i++)assert(Math.abs(xs[i]-xs[i-1])>500,'Sea corridors must be visibly separated on the world map');
}
console.log('PASS all tracks clear and sea corridors separated by over 500 metres');

for(const l of AnimalIsland.railLines.filter(l=>l.type)){
 assert.equal(l.mainlandStops.length,{RE:3,IC:2,ICE:1,UE:0}[l.type]);
 for(const name of l.mainlandStops)assert(l.route.some(p=>p.name===name));
 for(let i=0;i<l.route.length;i++){const a=l.route[i],b=l.route[(i+1)%l.route.length];if(Math.hypot(a.x-b.x,a.y-b.y)>40)assert(Math.abs(a.x-b.x)<.01||Math.abs(a.y-b.y)<.01,l.id+' diagonal straight');}
}
console.log('PASS cardinal straight tracks and 3/2/1/0 mainland stops');
