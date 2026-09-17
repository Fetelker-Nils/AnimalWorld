const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
(async()=>{
 let now=10000;class Clock extends Date{static now(){return now}}
 const c=vm.createContext({Date:Clock,crypto:crypto.webcrypto,DurableObject:class{constructor(ctx){this.ctx=ctx}},WebSocketRequestResponsePair:class{}});
 for(const f of ['world.js','housing.js','property-ledger.js','chat-filter.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c);
 c.createCityLife=()=>({});
 vm.runInContext(fs.readFileSync('multiplayer-worker.mjs','utf8').replace(/^import .*;\r?$/gm,'').replace('export default','const worker=').replace('export class World','class World')+';globalThis.World=World',c);
 const db=new Map();let tail=Promise.resolve();const storage={async get(k){return db.get(k)},async put(k,v){db.set(k,v)},async list(){return new Map()},transaction(fn){const p=tail.then(()=>fn(storage));tail=p.catch(()=>{});return p}};
 const ctx={storage,getWebSockets:()=>[],setWebSocketAutoResponse(){},blockConcurrencyWhile(fn){return this.ready=fn()}};const world=new c.World(ctx);await ctx.ready;
 function player(id,name){const ws={messages:[],send(s){this.messages.push(JSON.parse(s))},serializeAttachment(){}};world.sessions.set(ws,{id,name,ownerToken:id,last:now});return ws}
 const a=player('alice','Mauz'),b=player('bob','Hase');const send=(ws,text)=>world.webSocketMessage(ws,JSON.stringify({type:'chat-send',text,name:'Spoof'}));
 for(const bad of ['Scheisse','sch3isse','s.c.h.e.i.s.s.e','f u c k','fuuuck','Arschloch','\u{1f431} schei\u00dfe'])assert(!/[a-z]/i.test(c.cleanChat(bad).replace(/\*|\s|\p{Emoji}/gu,'')),bad);
 assert.equal(c.cleanChat('Hallo, die Strasse ist klasse!'),'Hallo, die Strasse ist klasse!');
 await send(a,'Hallo!');assert.equal(b.messages.at(-1).message.name,'Mauz');assert.equal(b.messages.at(-1).message.text,'Hallo!');
 await send(a,'Spam');assert.equal(a.messages.at(-1).type,'chat-error');assert.equal(db.get('chat-history-v1').length,1);
 now+=2100;await send(a,'scheisse');assert.equal(db.get('chat-history-v1')[1].text,'********');assert(!JSON.stringify(db.get('chat-history-v1')).includes('scheisse'));
 now+=2100;await send(a,'  ');assert.equal(a.messages.at(-1).type,'chat-error');
 now+=2100;await Promise.all([send(a,'eins'),send(b,'zwei')]);assert.equal(db.get('chat-history-v1').length,4);
 for(let i=0;i<105;i++){now+=2100;await send(a,'Nachricht '+i)}assert.equal(db.get('chat-history-v1').length,100);
 const restored=new c.World(ctx);await ctx.ready;assert.equal(restored.chat.length,100);assert.equal(restored.chat.at(-1).text,'Nachricht 104');
 world.roster();assert.equal(b.messages.at(-1).players.length,2);await world.remove(a);assert.equal(b.messages.filter(m=>m.type==='roster').at(-1).players.length,1);
 assert(!('ownerToken' in world.public(world.sessions.get(b))));assert(!('chatAt' in world.public(world.sessions.get(b))));
 console.log('PASS chat: server moderation, obfuscation, harmless text, authenticated sender, broadcast, spam limit, concurrent storage, bounded persistent history and roster departures');
})().catch(e=>{console.error(e);process.exitCode=1});
