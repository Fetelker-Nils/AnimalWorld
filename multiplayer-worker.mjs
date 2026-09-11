import './city-life.js';
import './world.js';
import './housing.js';
import './property-ledger.js';
import { DurableObject } from 'cloudflare:workers';

// One public island, including its public interiors. No accounts or chat data.
const rooms = new Set(['world','clothes','restaurant','hospital','police','fire','bank','market']);
const outfits = new Set(['street','ocean','ranger','sunny','police','fire','medic']);
const terrain=(x,y)=>38*Math.max(0,1-Math.max(0,Math.hypot(x-88,y+40)-4)/30);
const clock = () => 540 + (Date.now() - Date.UTC(2026,8,8)) / 1000 * 1.2;
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health') return Response.json({game:'animal-world',protocol:1});
    if (url.pathname !== '/play') return new Response('Not found',{status:404});
    if (request.method !== 'GET' || request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('WebSocket required',{status:426});
    return env.WORLD.getByName('public-island-v1').fetch(request);
  }
};
export class World extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.life=globalThis.createCityLife({},[{id:'compact',width:2.1,length:3.8},{id:'roadster',width:2.2,length:4.3},{id:'pickup',width:2.5,length:4.8}]);this.lastWorld=Date.now();
    this.sessions = new Map(ctx.getWebSockets().map(ws => [ws,ws.deserializeAttachment()]));
    this.clockOffset=0;this.properties=new Map();ctx.blockConcurrencyWhile(async()=>{this.clockOffset=await ctx.storage.get('clockOffset')||0;this.properties=await ctx.storage.list({prefix:'property:'});});
    this.impacts=[...this.sessions.values()].map(p=>p.impact).filter(Boolean);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping','pong'));
  }
  async fetch() {
    if (this.sessions.size >= 128) return new Response('Island temporarily full',{status:503});
    const [client, ws] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(ws);
    const player = {id:crypto.randomUUID(),x:0,y:0,heading:-Math.PI/2,jump:0,moving:false,room:'world',outfit:null,car:null,wave:0,last:Date.now()-100};
    this.sessions.set(ws,player); ws.serializeAttachment(player);
    if(await this.ctx.storage.getAlarm()===null)await this.ctx.storage.setAlarm(Date.now()+30000);
    ws.send(JSON.stringify({type:'welcome',id:player.id,minutes:this.minutes(),players:[...this.sessions.values()].map(p=>this.public(p))}));
    this.broadcast({type:'player',player:this.public(player)},ws);
    await this.checkSleep();
    for(const impact of this.impacts)if(Date.now()-impact.at<5000)ws.send(JSON.stringify({type:'crash',impact:{...impact,age:(Date.now()-impact.at)/1000}}));
    return new Response(null,{status:101,webSocket:client});
  }
  minutes(){return clock()+this.clockOffset;}
  send(ws,data){try{ws.send(JSON.stringify(data));}catch{}}
  playerSocket(id){return [...this.sessions.keys()].find(ws=>this.sessions.get(ws)?.id===id);}
  vehicle(owner){return [...this.sessions.values()].find(p=>p.id===owner)?.vehicle;}
  propertyState(ws){const p=this.sessions.get(ws);this.send(ws,{type:'properties',sold:[...this.properties.values()].map(h=>h.id),mine:[...this.properties.values()].filter(h=>h.owner===p?.ownerToken).map(h=>h.id)});}
  homeInRoom(p){return globalThis.AnimalIsland.homes.find(h=>p.room==='home:'+h.id);}
  atBed(p){const home=this.homeInRoom(p);if(!home||this.properties.get('property:'+home.id)?.owner!==p.ownerToken)return false;const l=globalThis.housingLayout(home);return Math.abs(p.x-l.bed.x)<3.3*l.sx+.2&&Math.abs(p.y-l.bed.y)<3.5*l.sy+.2;}
  async checkSleep(){
    const players=[...this.sessions.values()],count=players.filter(p=>p.sleeping).length;
    const now=this.minutes(),hour=(now%1440)/60;
    if(players.length&&count===players.length&&(hour>=20||hour<6)){
      const morning=(Math.floor(now/1440)+(hour>=20?1:0))*1440+420;
      this.clockOffset+=morning-now;
      for(const [ws,p] of this.sessions){p.sleeping=false;ws.serializeAttachment(p);}
      await this.ctx.storage.put('clockOffset',this.clockOffset);
      this.broadcast({type:'wake',minutes:this.minutes()});
    }else this.broadcast({type:'sleep',sleepers:count,total:players.length});
  }
  releaseRiders(owner){for(const [ws,p] of this.sessions)if(p.riding===owner){p.riding=null;ws.serializeAttachment(p);this.send(ws,{type:'ride',owner:null,reason:'Das Auto ist nicht mehr verfuegbar.'});}}
  public(p) { const {last,impact,ownerToken,propertyAt,...state}=p; return state; }
  broadcast(data, except) {
    const message=JSON.stringify(data);
    for (const ws of this.sessions.keys()) if(ws!==except) {
      try { ws.send(message); } catch { this.sessions.delete(ws); try{ws.close(1011,'Connection lost');}catch{} }
    }
  }
  async webSocketMessage(ws, message) {
    if(typeof message!=='string'||message.length>1024){ws.close(1009,'Message too large');return;}
    let data;try{data=JSON.parse(message);}catch{return;}
    const p=this.sessions.get(ws),now=Date.now();
    if(!p||!data)return;
    if(data.type==='identity'){
      if(p.ownerToken||typeof data.token!=='string'||!/^[a-zA-Z0-9-]{32,80}$/.test(data.token))return;
      p.ownerToken=data.token;ws.serializeAttachment(p);this.propertyState(ws);return;
    }
    if(data.type==='buy-property'){
      if(!p.ownerToken)return;
      const result=await globalThis.purchaseProperty(this.ctx.storage,globalThis.AnimalIsland.homes,p.ownerToken,data);
      if(result.ok){this.properties.set('property:'+result.id,{id:result.id,owner:p.ownerToken});for(const client of this.sessions.keys())this.propertyState(client);}
      this.send(ws,{type:'purchase-result',...result});return;
    }
    if(data.type==='sleep'){
      const hour=(this.minutes()%1440)/60;
      if(data.sleeping===true&&(!(hour>=20||hour<6)||!this.atBed(p)||p.car||p.riding)){
        this.send(ws,{type:'notice',code:'sleep-rejected',message:'Schlafen geht nachts im eigenen Bett.'});return;
      }
      p.sleeping=data.sleeping===true;ws.serializeAttachment(p);await this.checkSleep();return;
    }
    if(data.type==='ride'){
      if(data.owner===null){const car=this.vehicle(p.riding);if(car&&(Math.abs(car.speed)>.6||(car.z||0)>terrain(car.x,car.y)+.3)){this.send(ws,{type:'notice',message:'Zum Aussteigen muss das Auto anhalten.'});return;}
        p.riding=null;ws.serializeAttachment(p);this.send(ws,{type:'ride',owner:null});return;
      }
      const owner=[...this.sessions.values()].find(o=>o.id===data.owner),car=owner?.vehicle;
      if(!car||owner===p||p.room!=='world'||p.car||p.sleeping||Math.hypot(car.x-p.x,car.y-p.y)>4.5||Math.abs(car.speed)>.6||(car.z||0)>terrain(car.x,car.y)+.3||[...this.sessions.values()].some(o=>o.riding===owner.id)){
        this.send(ws,{type:'notice',message:'Das Auto muss frei, in deiner Naehe und angehalten sein.'});return;
      }
      p.riding=owner.id;ws.serializeAttachment(p);this.send(ws,{type:'ride',owner:owner.id});return;
    }
    if(data.type==='crash'){
      if(![data.x,data.y,data.heading,data.speed].every(Number.isFinite)||!p.car||data.model!==p.car||(['boat','plane','helicopter'].includes(p.car)?data.speed<=4:data.speed*3.6<=70)||data.speed>80||!Number.isFinite(data.z??0)||(data.z??0)<0||(data.z??0)>100||Math.hypot(data.x-p.x,data.y-p.y)>10||now-(p.crashed||0)<3000)return;
      p.crashed=now;p.impact={x:data.x,y:data.y,heading:data.heading,speed:data.speed,z:data.z??0,model:p.car,scenery:data.scenery===true,at:now};this.impacts=this.impacts.filter(i=>now-i.at<5000);this.impacts.push(p.impact);ws.serializeAttachment(p);this.broadcast({type:'crash',impact:p.impact},ws);return;
    }
    if(data.type!=='state'||now-p.last<80)return;
    if(![data.x,data.y,data.heading,data.jump].every(Number.isFinite)||Math.hypot(data.x,data.y)>=1300||Math.abs(data.heading)>1e6||data.jump<0||data.jump>6)return;
    const home=typeof data.room==='string'&&data.room.startsWith('home:')?globalThis.AnimalIsland.homes.find(h=>'home:'+h.id===data.room):null;
    const lobby=typeof data.room==='string'&&data.room.startsWith('lobby:')?globalThis.AnimalIsland.homes.find(h=>h.type==='apartment'&&(data.room==='lobby:'+h.buildingId||data.room==='lobby:'+h.buildingId+':'+h.floor)):null;
    const room=rooms.has(data.room)?data.room:home&&this.properties.get('property:'+home.id)?.owner===p.ownerToken?data.room:lobby?data.room:null;
    const layout=home?globalThis.housingLayout(home):{w:24,d:24};
    if(!room||(room!=='world'&&(Math.abs(data.x)>layout.w/2||Math.abs(data.y)>layout.d/2)))return;
    const v=data.vehicle;
    if(v&&['compact','roadster','pickup','plane','helicopter','boat'].includes(v.model)&&[v.x,v.y,v.heading,v.speed].every(Number.isFinite)&&Math.hypot(v.x,v.y)<1300&&Math.abs(v.speed)<=65&&Number.isFinite(v.z??0)&&(v.z??0)>=0&&(v.z??0)<=100&&Math.abs(v.heading)<1e6){p.vehicle={model:v.model,x:v.x,y:v.y,heading:v.heading,speed:v.speed,z:v.z??0};}
    else if(v===null){p.vehicle=null;this.releaseRiders(p.id);}
    if(p.riding&&!this.vehicle(p.riding)){p.riding=null;this.send(ws,{type:'ride',owner:null});}
    const elevation=lobby?data.elevation??0:0;
    if(!Number.isFinite(elevation)||elevation<0||elevation>(lobby?.floors-1)*4)return;
    Object.assign(p,{elevation,x:data.x,y:data.y,heading:data.heading,jump:data.jump,moving:data.moving===true,room,outfit:outfits.has(data.outfit)?data.outfit:null,car:['compact','roadster','pickup','plane','helicopter','boat'].includes(data.car)?data.car:null,last:now});
    p.species=['cat','rabbit','bear','fox'].includes(data.species)?data.species:'cat';
    p.name=typeof data.name==='string'?data.name.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,18)||'Mauz':'Mauz';
    if(p.riding){const car=this.vehicle(p.riding);p.x=car.x;p.y=car.y;p.heading=car.heading;p.room='world';p.car=null;}
    if(p.sleeping&&(!this.atBed(p))){p.sleeping=false;await this.checkSleep();}
    if(data.wave===true&&now-p.wave>2500)p.wave=now;
    ws.serializeAttachment(p);
    this.broadcast({type:'player',player:this.public(p)},ws);
    ws.send(JSON.stringify({type:'clock',minutes:this.minutes()}));
    if(now-this.lastWorld>=100){const dt=Math.min(.2,(now-this.lastWorld)/1000);this.lastWorld=now;
      const players=[...this.sessions.values()].filter(p=>p.room==='world');
      this.life.tick(dt,null,null,players);this.broadcast({type:'world',state:this.life.snapshot()});
    }
  }
  async webSocketClose(ws, code) { await this.remove(ws); try{ws.close(code===1005?1000:code);}catch{} }
  async webSocketError(ws) { await this.remove(ws); }
  async alarm() {
    for(const [ws,p] of this.sessions)if(Date.now()-p.last>60000){await this.remove(ws);try{ws.close(1001,'Inactive connection');}catch{}}
    if(this.sessions.size)await this.ctx.storage.setAlarm(Date.now()+30000);
  }
  async remove(ws) {const p=this.sessions.get(ws);this.sessions.delete(ws);if(p){this.releaseRiders(p.id);this.broadcast({type:'leave',id:p.id});await this.checkSleep();}}
}
