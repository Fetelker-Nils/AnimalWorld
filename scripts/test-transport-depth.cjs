const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const {createServer}=require('./browser.cjs');
(async()=>{
 const server=createServer(path.resolve(__dirname,'../dist'));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port+'/');
  const result=await page.evaluate(()=>{
   const r=createIndoorRenderer({transparent:true}),sprite=document.createElement('canvas');sprite.width=sprite.height=64;
   const point=(u,v,depth)=>({u,v,depth}),plane=(z,color)=>({color,points:[[-4,-4,z],[4,-4,z],[4,4,z],[-4,4,z]]});
   const options={width:64,height:64,scale:32,cx:32,cy:32,point,sprite,boxes:[],floors:[],composite:false};
   const gl=r.surface.getContext('webgl'),read=(x,y)=>{const p=new Uint8Array(4);gl.readPixels(x,y,1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);return [...p];};
   r.render({...options,mesh:[plane(2,'#ff0000'),plane(4,'#0000ff')]});const first=read(40,32);
   r.render({...options,mesh:[plane(4,'#0000ff'),plane(2,'#ff0000')]});const reversed=read(40,32);
   const wall=[[-4,-4,1],[0,-4,1],[0,4,1],[-4,4,1]].map(v=>point(...v));
   r.render({...options,mesh:[plane(2,'#ff0000')],occluders:[wall]});const behindWall=read(16,32),visible=read(48,32);
   r.render({...options,mesh:[{color:'#00ff00',points:[[-1,-1,-1],[1,-1,2],[1,1,2],[-1,1,-1]]}]});const nearPlane=read(40,32);
   r.render({...options,mesh:[plane(4,'#ff0000'),{...plane(2,'#0000ff'),opacity:.2}]});const throughGlass=read(40,32);
   r.render({...options,mesh:[{...plane(2,'#0000ff'),opacity:.2}]});const glassOnly=read(40,32);
   r.dispose();return {first,reversed,behindWall,visible,nearPlane,throughGlass,glassOnly};
  });
  assert.deepEqual(result.first,[255,0,0,255]);assert.deepEqual(result.reversed,result.first,'Depth must ignore submission order');
  assert.equal(result.behindWall[3],0,'World geometry hides the bus overlay');assert.deepEqual(result.visible,[255,0,0,255]);
  assert.deepEqual(result.nearPlane,[0,255,0,255],'Near-plane clipping must keep visible geometry');
  assert(Math.abs(result.throughGlass[0]-204)<=1&&Math.abs(result.throughGlass[2]-51)<=1&&result.throughGlass[3]===255,'Glass reveals geometry behind it');
  assert(Math.abs(result.glassOnly[3]-51)<=1,'Glass remains transparent over the outside world');
  console.log('PASS transport depth: order independence, world occlusion and near-plane clipping');
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
