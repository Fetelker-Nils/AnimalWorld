const fs=require('node:fs'),Module=require('node:module'),path=require('node:path');const filename=path.join(__dirname,'test-game.cjs');let source=fs.readFileSync(filename,'utf8');let setup=source.slice(0,source.indexOf('const originalCamera='));setup=setup.replace('globalThis.probe={life,','globalThis.probe={busWalkable,busPoint,life,');const checks=`
const t=sandbox.probe.life.trains[0],to=sandbox.probe.busPoint,can=sandbox.probe.busWalkable;
Object.assign(mauz,to(t,{f:0,s:3}));t.doors=0;t.speed=0;let p=to(t,{f:0,s:1.7});assert(!can(p.x,p.y),'Solid carriage side');
p=to(t,{f:4.6,s:0});assert(!can(p.x,p.y),'Solid train front');
Object.assign(mauz,to(t,{f:2.6,s:2.4}));p=to(t,{f:2.6,s:1.5});assert(!can(p.x,p.y),'Closed door');t.doors=1;assert(can(p.x,p.y),'Stationary open door allows boarding');t.speed=5;assert(!can(p.x,p.y),'Moving train cannot be entered');
console.log('PASS train walls/front, closed doors, walk-in boarding and moving-door safety');
`;const test=new Module(filename,module);test.filename=filename;test.paths=module.paths;test._compile(setup+checks,filename);
