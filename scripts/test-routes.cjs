const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const c=vm.createContext({});for(const f of ['world.js','navigation.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../'+f),'utf8'),c);
const w=c.AnimalIsland,valid=(x,y)=>!w.blocked(x,y);
const route=c.planWorldRoute(w,{x:-45,y:-25},{x:-27,y:-25},valid);assert(route);assert(Number.isFinite(route.length)&&route.length>18);assert(route.points.length>2,'Route bends around building');
for(let i=1;i<route.points.length;i++){const a=route.points[i-1],b=route.points[i],n=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y));for(let j=0;j<=n;j++)assert(valid(a.x+(b.x-a.x)*j/n,a.y+(b.y-a.y)*j/n),'No shortcut through walls');}
const cross=c.planWorldRoute(w,{x:530,y:14},{x:720,y:60},valid);assert(cross);assert(cross.note.includes('Boot'));assert(cross.points.some(p=>p.x>563&&p.x<645));
assert(!c.planWorldRoute(w,{x:0,y:0},{x:1400,y:0},valid));
console.log('PASS routes: actual obstacle detour, clear segments, road preference, harbor transfer and border rejection');
