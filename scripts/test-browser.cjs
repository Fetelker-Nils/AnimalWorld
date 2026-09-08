const assert=require('node:assert/strict');
const {createServer}=require('./browser.cjs');
(async()=>{
  const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  try {
    const response=await fetch(origin);assert.equal(response.status,200);
    const html=await response.text();assert(html.includes('Offline spielen'));
    for(const match of html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css))"/g)){
      const asset=await fetch(origin+'/'+match[1]);assert.equal(asset.status,200,match[1]);assert((await asset.text()).length>0);
    }
    for(const name of ['package.json','main.cjs','scripts/browser.cjs','node_modules/electron/package.json'])assert.equal((await fetch(origin+'/'+name)).status,404);
    assert.equal((await fetch(origin,{method:'POST'})).status,405);
    console.log('PASS browser server: start page, all bundled assets, private files and unsupported methods');
  } finally {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
