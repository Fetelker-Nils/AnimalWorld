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
    for(const [file,type] of [['robots.txt','text/plain'],['sitemap.xml','application/xml'],['hilfe','text/html']]){
      const r=await fetch(origin+'/'+file,{headers:{'User-Agent':'Googlebot'}});assert.equal(r.status,200);assert(r.headers.get('content-type').startsWith(type));
      const body=await r.text();assert(!body.includes('noindex'));if(file==='robots.txt'){assert(body.includes('Allow: /'));assert(body.includes('https://animal-world-mauz.vercel.app/sitemap.xml'));}
    }
    const redirect=await fetch(origin+'/spielinfo.html',{redirect:'manual'});assert.equal(redirect.status,308);assert.equal(redirect.headers.get('location'),'/hilfe');
    assert(html.includes('rel="canonical"'));assert(html.includes('name="description"'));assert(html.includes('href="/hilfe"'));
    for(const name of ['package.json','main.cjs','scripts/browser.cjs','node_modules/electron/package.json'])assert.equal((await fetch(origin+'/'+name)).status,404);
    assert.equal((await fetch(origin,{method:'POST'})).status,405);
    console.log('PASS browser server: start page, all bundled assets, private files and unsupported methods');
  } finally {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
