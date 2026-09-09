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
    this.sessions = new Map(ctx.getWebSockets().map(ws => [ws,ws.deserializeAttachment()]));
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
    return new Response(null,{status:101,webSocket:client});
  }
  public(p) { const {last,...state}=p; return state; }
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
    if(!p||!data||data.type!=='state'||now-p.last<80)return;
    if(![data.x,data.y,data.heading,data.jump].every(Number.isFinite)||Math.hypot(data.x,data.y)>565||Math.abs(data.heading)>1e6||data.jump<0||data.jump>3)return;
    const room=rooms.has(data.room)?data.room:data.room==='home'?'home:'+p.id:null;
    if(!room||(room!=='world'&&(Math.abs(data.x)>12||Math.abs(data.y)>12)))return;
    Object.assign(p,{x:data.x,y:data.y,heading:data.heading,jump:data.jump,moving:data.moving===true,room,outfit:outfits.has(data.outfit)?data.outfit:null,car:['compact','roadster','pickup'].includes(data.car)?data.car:null,last:now});
    if(data.wave===true&&now-p.wave>2500)p.wave=now;
    ws.serializeAttachment(p);
    this.broadcast({type:'player',player:this.public(p)},ws);
    ws.send(JSON.stringify({type:'clock',minutes:clock()}));
  }
  webSocketClose(ws, code) { this.remove(ws); try{ws.close(code===1005?1000:code);}catch{} }
  webSocketError(ws) { this.remove(ws); }
  async alarm() {
    for(const [ws,p] of this.sessions)if(Date.now()-p.last>60000){this.remove(ws);try{ws.close(1001,'Inactive connection');}catch{}}
    if(this.sessions.size)await this.ctx.storage.setAlarm(Date.now()+30000);
  }
  remove(ws) {const p=this.sessions.get(ws);this.sessions.delete(ws);if(p)this.broadcast({type:'leave',id:p.id});}
}
