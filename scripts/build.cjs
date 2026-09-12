const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const assets = ['assets/animal-world-logo.png','index.html','spielinfo.html','info.css','robots.txt','sitemap.xml','style.css','analytics.js','game.js','world.js','housing.js','navigation.js','delivery.js','activities.js','vehicles.js','sound.js','indoor-renderer.js','day-cycle.js','multiplayer.js','city-services.js','animal-mesh.js','city-life.js','collisions.js','adventure.js'];
assets.push('assets/sound/manifest.json',...require('../assets/sound/manifest.json').clips.map(c=>'assets/sound/'+c.file));
fs.mkdirSync(output, { recursive: true });
for (const file of assets) { fs.mkdirSync(path.dirname(path.join(output,file)), {recursive:true}); fs.copyFileSync(path.join(root,file),path.join(output,file)); }
console.log('Browser-Build: '+assets.length+' Dateien in dist/');
