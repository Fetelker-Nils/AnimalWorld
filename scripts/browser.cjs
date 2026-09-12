const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const assets = new Set(['assets/animal-world-logo.png','index.html','spielinfo.html','info.css','robots.txt','sitemap.xml','style.css','analytics.js','game.js','world.js','housing.js','navigation.js','delivery.js','activities.js','vehicles.js','sound.js','indoor-renderer.js','day-cycle.js','multiplayer.js','city-services.js','animal-mesh.js','city-life.js','collisions.js','adventure.js']);
for(const clip of require('../assets/sound/manifest.json').clips)assets.add('assets/sound/'+clip.file);
assets.add('assets/sound/manifest.json');
function createServer(directory = root) {
  return http.createServer(async (request, response) => {
    if (!['GET','HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname === '/animal-world-health') { response.writeHead(200, {'Content-Type':'text/plain'}); response.end('animal-world-browser-v1'); return; }
    if(['/spielinfo.html','/spielhilfe.html','/spielinfo','/spielhilfe','/hilfe/'].includes(pathname)){response.writeHead(308,{Location:'/hilfe'+new URL(request.url,'http://localhost').search});response.end();return;}
    const file = pathname === '/' ? 'index.html' : pathname === '/hilfe' ? 'spielinfo.html' : pathname.slice(1);
    if (!assets.has(file)) { response.writeHead(404); response.end('Nicht gefunden'); return; }
    try {
      const body = await fs.readFile(path.join(directory, file));
      const type = file.endsWith('.mp3') ? 'audio/mpeg' : file.endsWith('.json') ? 'application/json' : file.endsWith('.png') ? 'image/png' : file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.xml') ? 'application/xml' : file.endsWith('.txt') ? 'text/plain' : 'text/html';
      response.writeHead(200, {'Content-Type':type+((type.startsWith('image/')||type.startsWith('audio/'))?'':'; charset=utf-8'),'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch { response.writeHead(500); response.end('Spieldatei konnte nicht geladen werden.'); }
  });
}
function openBrowser(url) {
  const command = process.platform === 'win32' ? 'cmd.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/d','/c','start','',url] : [url];
  const child = spawn(command,args,{windowsHide:true,stdio:'ignore'});
  child.on('error',()=>console.log('Bitte im Browser oeffnen: '+url));
}
if (require.main === module) {
  const url = 'http://127.0.0.1:4173';
  const server = createServer(process.argv.includes('--preview') ? path.join(root,'dist') : root);
  const ready = () => { console.log('Animal World: '+url+'\nDieses Fenster waehrend des Spielens offen lassen. Beenden mit Strg+C.'); if(!process.argv.includes('--no-open'))openBrowser(url); };
  server.on('error',async error=>{
    if(error.code==='EADDRINUSE') {
      try { const response=await fetch(url+'/animal-world-health'); if(await response.text()==='animal-world-browser-v1'){ready();return;} } catch {}
      console.error('Port 4173 wird von einem anderen Programm verwendet.');
    } else console.error(error.message);
    process.exitCode=1;
  });
  server.listen(4173,'127.0.0.1',ready);
}
module.exports = { createServer };
