const fs=require('node:fs'),Module=require('node:module'),path=require('node:path');
const filename=path.join(__dirname,'test-game.cjs'),source=fs.readFileSync(filename,'utf8');
const setup='const events={};\n'+source.slice(0,source.indexOf('const originalCamera=')).replace('window:{localStorage:storage,addEventListener(){}}','window:{localStorage:storage,addEventListener(type,handler){events[type]||=handler}}');
const checks=`
setMode('playing');
for(const key of ['w','e','f','m','v',' '])events.keydown({key,target:{closest:()=>({})},preventDefault(){throw Error('Chat input was intercepted')}});
assert.equal(keys.size,0,'Chat typing cannot trigger movement or interactions');
events.keydown({key:'w',target:{closest:()=>null,matches:()=>false},preventDefault(){}});assert(keys.has('w'),'Normal movement remains available');
console.log('PASS actual game keyboard handler: chat focus suppresses shortcuts and movement, normal controls preserved');
`;
const test=new Module(filename,module);test.filename=filename;test.paths=module.paths;test._compile(setup+checks,filename);
