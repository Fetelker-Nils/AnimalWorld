import './city-life.js';
import { DurableObject } from 'cloudflare:workers';

// One public island, including its public interiors. No accounts or chat data.
const rooms = new Set(['world','clothes','restaurant','hospital','police','fire','bank','market']);
const outfits = new Set(['street','ocean','ranger','sunny','police','fire','medic']);
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
    ws.send(JSON.stringify({type:'welcome',id:player.id,minutes:clock(),players:[...this.sessions.values()].map(p=>this.public(p))}));
    this.broadcast({type:'player',player:this.public(player)},ws);
    for(const impact of this.impacts)if(Date.now()-impact.at<5000)ws.send(JSON.stringify({type:'crash',impact:{...impact,age:(Date.now()-impact.at)/1000}}));
    return new Response(null,{status:101,webSocket:client});
  }
  public(p) { const {last,impact,...state}=p; return state; }
  broadcast(data, except) {
    const message=JSON.stringify(data);
    for (const ws of this.sessions.keys()) if(ws!==except) {
      try { ws.send(message); } catch { this.sessions.delete(ws); try{ws.close(1011,'Connection lost');}catch{} }
    }
  }
  webSocketMessage(ws, message) {
    if(typeof message!=='string'||message.length>1024){ws.close(1009,'Message too large');return;}
    let data;try{data=JSON.parse(message);}catch{return;}
    const p=this.sessions.get(ws),now=Date.now();
    if(!p||!data)return;
    if(data.type==='crash'){
      if(![data.x,data.y,data.heading,data.speed].every(Number.isFinite)||!p.car||data.model!==p.car||data.speed*3.6<=70||data.speed>40||Math.hypot(data.x-p.x,data.y-p.y)>10||now-(p.crashed||0)<3000)return;
      p.crashed=now;p.impact={x:data.x,y:data.y,heading:data.heading,speed:data.speed,model:p.car,at:now};this.impacts=this.impacts.filter(i=>now-i.at<5000);this.impacts.push(p.impact);ws.serializeAttachment(p);this.broadcast({type:'crash',impact:p.impact},ws);return;
    }
    if(data.type!=='state'||now-p.last<80)return;
    if(![data.x,data.y,data.heading,data.jump].every(Number.isFinite)||Math.hypot(data.x,data.y)>565||Math.abs(data.heading)>1e6||data.jump<0||data.jump>3)return;
    const room=rooms.has(data.room)?data.room:data.room==='home'?'home:'+p.id:null;
    if(!room||(room!=='world'&&(Math.abs(data.x)>12||Math.abs(data.y)>12)))return;
    Object.assign(p,{x:data.x,y:data.y,heading:data.heading,jump:data.jump,moving:data.moving===true,room,outfit:outfits.has(data.outfit)?data.outfit:null,car:['compact','roadster','pickup'].includes(data.car)?data.car:null,last:now});
    if(data.wave===true&&now-p.wave>2500)p.wave=now;
    ws.serializeAttachment(p);
    this.broadcast({type:'player',player:this.public(p)},ws);
    ws.send(JSON.stringify({type:'clock',minutes:clock()}));
    if(now-this.lastWorld>=100){const dt=Math.min(.2,(now-this.lastWorld)/1000);this.lastWorld=now;
      const players=[...this.sessions.values()].filter(p=>p.room==='world');
      this.life.tick(dt,null,null,players);this.broadcast({type:'world',state:this.life.snapshot()});
    }
  }
  webSocketClose(ws, code) { this.remove(ws); try{ws.close(code===1005?1000:code);}catch{} }
  webSocketError(ws) { this.remove(ws); }
  async alarm() {
    for(const [ws,p] of this.sessions)if(Date.now()-p.last>60000){this.remove(ws);try{ws.close(1001,'Inactive connection');}catch{}}
    if(this.sessions.size)await this.ctx.storage.setAlarm(Date.now()+30000);
  }
  remove(ws) {const p=this.sessions.get(ws);this.sessions.delete(ws);if(p)this.broadcast({type:'leave',id:p.id});}
}
