// Reuse the game's existing headless harness, without replaying long island walks.
const fs=require('node:fs'),Module=require('node:module'),path=require('node:path');
const filename=path.join(__dirname,'test-game.cjs'),source=fs.readFileSync(filename,'utf8');
const setup=source.slice(0,source.indexOf('const originalCamera='));
const checks=`
for(const venue of Island.venues){
 setMode('playing');Object.assign(mauz,{x:venue.x,y:venue.y});assert(enterVenue(venue),venue.name);
 for(let y=10;y>=-3;y-=.1)assert(indoorWalkable(0,y),'Reception aisle blocked: '+venue.name+' at '+y);
 Object.assign(mauz,{x:0,y:10});assert(leaveHome());
}
console.log('PASS every public building: entrance, uninterrupted reception aisle and exit');
`;
const test=new Module(filename,module);test.filename=filename;test.paths=module.paths;test._compile(setup+checks,filename);

