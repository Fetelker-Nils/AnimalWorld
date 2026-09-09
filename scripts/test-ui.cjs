const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');
const { createServer } = require('./browser.cjs');
const root=path.resolve(__dirname,'..');
(async()=>{
  const server=createServer(path.join(root,'dist'));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
    const page=await browser.newPage({viewport:{width:1280,height:850}});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    const capture=async()=>{const buffer=await page.screenshot();return {toPNG:()=>buffer};};
    await page.goto('http://127.0.0.1:'+server.address().port+'/#smoke-test');
  await new Promise(resolve => setTimeout(resolve, 500));
  const result = await page.evaluate(`(() => {
    const canvas = document.querySelector('#world');
    if (!canvas || canvas.width === 0) throw new Error('Canvas fehlt');
    const pixel = canvas.getContext('2d').getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data;
    if (!pixel[3]) throw new Error('Spiel wurde nicht gezeichnet');
    const start = document.querySelector('#start-screen');
    const hud = document.querySelector('#game-ui');
    const pause = document.querySelector('#pause-screen');
    if (start.hidden || !hud.hidden) throw new Error('Startbildschirm fehlt');
    document.querySelector('#play').click();
    if (!start.hidden || hud.hidden) throw new Error('Offline spielen startet nicht');
    document.querySelector('#menu').click();
    if (pause.hidden || !hud.hidden) throw new Error('Pause fehlt');
    document.querySelector('#resume').click();
    if (!pause.hidden || hud.hidden) throw new Error('Fortsetzen fehlgeschlagen');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    if (pause.hidden) throw new Error('Escape pausiert nicht');
    document.querySelector('#back').click();
    if (start.hidden || !pause.hidden) throw new Error('Rueckkehr fehlgeschlagen');
    return { title: document.title, canvas: [canvas.width, canvas.height], browser: location.protocol === 'http:' };
  })()`);
  if (errors.length) throw new Error(errors.join('\n'));
  fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
  const screenshot = await capture();
  fs.writeFileSync(path.join(root, 'test-results', 'desktop.png'), screenshot.toPNG());
  await page.evaluate("document.querySelector('#play').click()");
  await new Promise(resolve => setTimeout(resolve, 100));
  fs.writeFileSync(path.join(root, 'test-results', 'game.png'), (await capture()).toPNG());
  await page.evaluate(`(() => {
    const t=window.__animalTest;t.visit(-12,65.5);window.dispatchEvent(new KeyboardEvent('keydown',{key:'e'}));
    if(t.state().mode!=='home'||!document.querySelector('#home-buy').disabled)throw Error('Unaffordable house not protected');
    document.querySelector('#home-buy').click();if(t.state().coins!==0||t.state().ownedHomes.length)throw Error('Unaffordable purchase succeeded');
    document.querySelector('#home-close').click();
  })()`);
  const jobResult=await page.evaluate(`(async () => {
    const test=window.__animalTest;
    const press=key=>window.dispatchEvent(new KeyboardEvent('keydown',{key}));
    test.visit(-10,-2);
    if(document.querySelector('#interact').hidden)throw Error('Job prompt missing');
    press('e');
    if(!test.state().active)throw Error('Job did not start');
    await new Promise(resolve=>setTimeout(resolve,150));
    if(test.state().theme!=='delivery')throw Error('Delivery music did not switch');
    press('e');
    if(test.state().coins!==0)throw Error('Reward before delivery');
    test.visit(18,-18);press('e');press('e');
    if(test.state().coins!==35||test.state().completed!==1||test.state().active)throw Error('Invalid delivery reward');
    if(test.state().mode==='home')document.querySelector('#home-close').click();
    press('m');
    if(document.querySelector('#map-screen').hidden||test.state().mode!=='map')throw Error('Map did not open');
    return test.state();
  })()`);
  await new Promise(resolve=>setTimeout(resolve,150));
  fs.writeFileSync(path.join(root,'test-results','map.png'),(await capture()).toPNG());
  for(const [name,x,y,heading] of [['camera-wall',-18,-18,Math.PI/2],['village',0,108,-Math.PI/2],['mountain',88,9,-Math.PI/2],['summit',88,-40,Math.PI]]){
    await page.evaluate(`document.querySelector('#map-close').click();window.__animalTest.visit(${x},${y},${heading})`);
    if(name==='camera-wall'){const distance=await page.evaluate('window.__animalTest.state().cameraDistance');if(distance>=2)throw Error('Camera entered exterior house wall');}
    await new Promise(resolve=>setTimeout(resolve,150));
    fs.writeFileSync(path.join(root,'test-results',name+'.png'),(await capture()).toPNG());
  }
  await page.reload();
  const persisted=await page.evaluate('window.__animalTest.state().coins');
  if(persisted!==35)throw Error('Coins did not persist after reload');
  await page.evaluate("document.querySelector('#play').click();window.__animalTest.visit(10,-3);window.dispatchEvent(new KeyboardEvent('keydown',{key:'e'}));");
  await new Promise(resolve=>setTimeout(resolve,200));
  fs.writeFileSync(path.join(root,'test-results','garage.png'),(await capture()).toPNG());
  for(const id of ['compact','roadster','pickup']){
    await page.evaluate(`(() => {
      const t=window.__animalTest,press=key=>window.dispatchEvent(new KeyboardEvent('keydown',{key}));
      t.park();t.visit(10,-3);
      if(t.state().mode!=='garage')press('e');
      if(t.state().mode!=='garage')throw Error('Phone does not open car selection');
      document.querySelector('[data-car="${id}"]').click();
      if(t.state().car!=='${id}'||t.state().mode!=='playing')throw Error('Wrong car spawned');
      t.visit(10,4);press('f');
      if(!t.state().driving)throw Error('Cannot enter car');
      t.visit(0,14);press('w');t.advance(.6);
      window.dispatchEvent(new KeyboardEvent('keyup',{key:'w'}));
      if(t.state().y>=13||t.state().speed<=0)throw Error('Car does not drive');
      press(' ');t.advance(.8);window.dispatchEvent(new KeyboardEvent('keyup',{key:' '}));
      if(t.state().speed>.6)throw Error('Brake does not work');
    })()`);
    await new Promise(resolve=>setTimeout(resolve,200));
    fs.writeFileSync(path.join(root,'test-results','car-'+id+'.png'),(await capture()).toPNG());
  }
  const addedJobs=await page.evaluate(`(async () => {
    const t=window.__animalTest,press=key=>window.dispatchEvent(new KeyboardEvent('keydown',{key}));t.park();
    const jobs=[['clean',-6,20,[[-6,31],[6,44],[-7,68],[7,86],[-6,102]],0],['garden',-150,8,[[-162,4],[-150,-4],[-138,4]],1.6],['repair',160,8,[[148,4],[160,-4],[172,4]],2.1]];
    for(const [id,x,y,points,hold] of jobs){
      t.visit(x,y);press('e');
      if(t.state().activity!==id)throw Error('Cannot start '+id);
      await new Promise(resolve=>setTimeout(resolve,150));
      if(t.state().theme!==id)throw Error('Wrong music for '+id);
      for(const [px,py] of points){t.visit(px,py);press('e');if(hold)t.advance(hold);while(t.state().challenge){t.advance(.92);press('e');}window.dispatchEvent(new KeyboardEvent('keyup',{key:'e'}));}
      if(t.state().done!==points.length)throw Error('Work did not finish for '+id);
      t.visit(x,y);press('e');if(t.state().activity)throw Error('Cannot collect job payment');
    }
    t.visit(8,8);press('e');if(t.state().activity!=='taxi')throw Error('Cannot start taxi');
    await new Promise(resolve=>setTimeout(resolve,150));
    if(t.state().theme!=='taxi')throw Error('Taxi music did not switch');
    t.visit(10,-3);press('e');document.querySelector('[data-car="compact"]').click();
    t.visit(10,4);press('f');t.visit(0,-307);press('e');if(!t.state().passenger)throw Error('Passenger did not enter');
    t.visit(0,460);press('e');if(t.state().passenger||t.state().activity)throw Error('Passenger did not arrive');
    if(t.state().coins!==550)throw Error('Incorrect total job rewards: '+t.state().coins);
    t.park();return t.state();
  })()`);
  const audioStarted=await page.evaluate('window.__animalTest.audio()',true);
  if(!audioStarted)throw Error('Audio context did not start');
  await page.evaluate("document.querySelector('#menu').click();document.querySelector('#mute-audio').click()");
  await new Promise(resolve=>setTimeout(resolve,120));
  if(!await page.evaluate('window.__animalTest.state().muted'))throw Error('Mute did not work');
  await page.evaluate("for(const [id,value] of [['music-volume',15],['effects-volume',25]]){const input=document.getElementById(id);input.value=value;input.dispatchEvent(new Event('input'));}");
  await page.reload();
  const savedState=await page.evaluate('window.__animalTest.state()');
  if(savedState.coins!==550||!savedState.muted)throw Error('Job earnings or sound settings did not persist');
  if(savedState.audioSettings.music!==.15||savedState.audioSettings.effects!==.25)throw Error('Volume did not persist');
  await page.evaluate('window.__animalTest.audio()',true);
  await new Promise(resolve=>setTimeout(resolve,150));
  if(await page.evaluate('window.__animalTest.state().theme')!=='menu')throw Error('Main-menu music did not switch');
  await page.evaluate(`(async () => {
    document.querySelector('#play').click();
    const t=window.__animalTest,press=key=>window.dispatchEvent(new KeyboardEvent('keydown',{key}));
    const specs=[['fishing',-86,40,[[-85,50],[-85,58],[-85,66]],3.1],['orchard',-350,8,[[-362,-4],[-350,-4],[-338,-4],[-350,-16]],0],['electric',300,108,[[280,108],[300,96],[320,108]],2.1],['trail',130,-40,[[122,-40],[112,-36],[103,-42],[88,-40]],0]];
    for(const [id,x,y,points,hold] of specs){
      t.visit(x,y);press('e');if(t.state().activity!==id)throw Error('Cannot start '+id);
      await new Promise(resolve=>setTimeout(resolve,150));if(t.state().theme!==id)throw Error('Missing music for '+id);
      for(const [px,py] of points){t.visit(px,py);press('e');if(hold)t.advance(hold);while(t.state().challenge){t.advance(.92);press('e');}window.dispatchEvent(new KeyboardEvent('keyup',{key:'e'}));}
      t.visit(x,y);press('e');if(t.state().activity)throw Error('Cannot finish '+id);
    }
    if(t.state().coins!==1280)throw Error('Incorrect newest job earnings');
    t.visit(-12,65.5);press('e');if(t.state().mode!=='home'||document.querySelector('#home-buy').disabled)throw Error('Cannot review affordable house');
  })()`);
  await new Promise(resolve=>setTimeout(resolve,150));
  fs.writeFileSync(path.join(root,'test-results','house-offer.png'),(await capture()).toPNG());
  await page.evaluate(`(() => {
    const t=window.__animalTest;document.querySelector('#home-buy').click();
    if(t.state().coins!==1100||!t.state().ownedHomes.includes('village')||t.state().homeId!=='village')throw Error('House purchase failed');
    document.querySelector('#home-buy').click();if(t.state().coins!==1100)throw Error('Double charge for house');
  })()`);
  await new Promise(resolve=>setTimeout(resolve,150));
  fs.writeFileSync(path.join(root,'test-results','house-owned.png'),(await capture()).toPNG());
  await page.evaluate(`(() => {
    const t=window.__animalTest;document.querySelector('#home-enter').click();
    if(t.state().interior!=='village'||t.state().room!=='Flur')throw Error('Interior entry failed');
    window.dispatchEvent(new KeyboardEvent('keydown',{key:'f'}));if(t.state().driving)throw Error('Outdoor car accessible indoors');
    window.dispatchEvent(new KeyboardEvent('keydown',{key:'m'}));if(t.state().mode!=='playing')throw Error('Outdoor map opened indoors');
  })()`);
  await page.waitForFunction(()=>window.__animalTest.state().depthRenderer);
  await page.evaluate(`(() => {
    // Actual GPU regression: a near wall must hide a red object regardless of submission order.
    const r=createIndoorRenderer(),sprite=document.createElement('canvas');sprite.width=sprite.height=64;
    const wall={x:0,y:3,w:4,d:.2,h:3.3,color:'#00ff00'},object={x:0,y:6,w:2,d:1,h:3,color:'#ff0000'};
    const sample=boxes=>{r.render({width:64,height:64,scale:32,cx:32,cy:32,point:(x,y,z)=>({u:x,v:z-1.5,depth:y}),boxes,floors:[],sprite,catDepth:2});const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d');ctx.drawImage(r.surface,0,0);return ctx.getImageData(32,32,1,1).data;};
    for(const boxes of [[wall,object],[object,wall]]){const pixel=sample(boxes);if(pixel[1]<200||pixel[0]>10)throw Error('Furniture visible through opaque wall');}
    const red=sample([object]);if(red[0]<200||red[1]>10)throw Error('Object not visible without wall');
    if(!window.__animalTest.state().depthRenderer)throw Error('Indoor depth renderer inactive');
  })()`);
  for(const [name,x,y,heading] of [['interior-hall',0,8.5,-Math.PI/2],['interior-living',-4,6.5,Math.PI],['interior-kitchen',4,6.5,.7],['interior-bedroom',-4,-6.5,-2.5],['interior-bathroom',4,-6.5,-.5]]){
    await page.evaluate(`window.__animalTest.visit(${x},${y},${heading})`);
    await new Promise(resolve=>setTimeout(resolve,150));
    fs.writeFileSync(path.join(root,'test-results',name+'.png'),(await capture()).toPNG());
  }
  await page.evaluate(`(() => {
    const t=window.__animalTest,press=key=>window.dispatchEvent(new KeyboardEvent('keydown',{key}));
    t.setTime(12*60);t.visit(-5.2,-8,Math.PI);press('e');if(t.state().sleeping)throw Error('Can sleep during daytime');
    t.setTime(21*60);press('e');if(!t.state().sleeping)throw Error('Nighttime bed interaction failed');
    t.advanceSleep(2.4);if(t.state().sleeping||t.state().clock!=='07:00'||t.state().day!==2)throw Error('Did not wake next morning');
    if(t.state().interior!=='village'||t.state().coins!==1100)throw Error('Sleep changed house or wallet');
    document.querySelector('#menu').click();const minutes=t.state().minutes;t.advance(30);if(t.state().minutes!==minutes)throw Error('Clock runs during pause');document.querySelector('#resume').click();
  })()`);
  await page.evaluate(`(() => {
    const t=window.__animalTest;t.visit(0,10);window.dispatchEvent(new KeyboardEvent('keydown',{key:'e'}));
    if(t.state().interior||Math.hypot(t.state().x+12,t.state().y-65.5)>.01||t.state().coins!==1100)throw Error('Interior exit failed');
  })()`);
  await page.evaluate(`(() => {
    document.querySelector('#home-close').click();document.querySelector('#map-open').click();document.querySelector('#map-plus').click();
    if(window.__animalTest.state().mapZoom<=1)throw Error('Map zoom failed');
    document.querySelector('#map-locate').click();if(window.__animalTest.state().mapZoom!==4)throw Error('Locate on map failed');
    document.querySelector('#map-reset').click();if(window.__animalTest.state().mapZoom!==1)throw Error('Map reset failed');
  })()`);
  await new Promise(resolve=>setTimeout(resolve,150));
  fs.writeFileSync(path.join(root,'test-results','map-owned.png'),(await capture()).toPNG());
  await page.evaluate(`document.querySelector('#map-close').click();window.__animalTest.setTime(22*60);window.__animalTest.visit(0,14,-Math.PI/2)`);
  await page.waitForTimeout(200);
  if(!await page.locator('#minimap').isVisible())throw Error('Minimap missing during play');
  fs.writeFileSync(path.join(root,'test-results','night-lamps.png'),(await capture()).toPNG());
  await page.evaluate(`window.__animalTest.setTime(9*60)`);await page.waitForTimeout(150);
  fs.writeFileSync(path.join(root,'test-results','day-minimap.png'),(await capture()).toPNG());
  await page.evaluate(`document.querySelector('#menu').click()`);
  await page.reload();
  const homeState=await page.evaluate('window.__animalTest.state()');
  if(homeState.clock!=='09:00')throw Error('Clock not persisted');
  if(homeState.coins!==1100||homeState.homeId!=='village'||homeState.ownedHomes.length!==1||Math.hypot(homeState.x+12,homeState.y-65.5)>.01)throw Error('Home ownership or spawn did not persist');
  await page.evaluate(`document.querySelector('#play').click()`);
  for(const [id,x,y] of [['clothes',-18,-18],['restaurant',18,-36],['police',-36,-54],['hospital',36,-72],['fire',-18,-90],['bank',18,-123],['market',-36,-123]]){
    await page.evaluate(`(() => {const t=window.__animalTest;t.visit(${x},${y});window.dispatchEvent(new KeyboardEvent('keydown',{key:'e'}));if(t.state().interior!=='${id}')throw Error('Cannot enter public building ${id}');t.visit(0,6,-Math.PI/2);})()`);
    await page.waitForTimeout(150);fs.writeFileSync(path.join(root,'test-results','venue-'+id+'.png'),(await capture()).toPNG());
    await page.evaluate(`window.__animalTest.visit(0,10);window.dispatchEvent(new KeyboardEvent('keydown',{key:'e'}));`);
  }
  await page.evaluate(`(() => {const t=window.__animalTest;t.visit(-18,-18);window.dispatchEvent(new KeyboardEvent('keydown',{key:'e'}));t.visit(0,-3);window.dispatchEvent(new KeyboardEvent('keydown',{key:'e'}));if(t.state().mode!=='clothes')throw Error('Clothing counter unavailable');})()`);
  await page.waitForTimeout(150);fs.writeFileSync(path.join(root,'test-results','clothing-shop.png'),(await capture()).toPNG());
  await page.locator('[data-outfit="street"]').click();
  let dressed=await page.evaluate(()=>window.__animalTest.state());
  if(dressed.coins!==1030||dressed.outfitId!=='street'||dressed.mode!=='playing')throw Error('Clothing purchase did not equip/deduct correctly');
  await page.evaluate(`window.__animalTest.visit(0,6,-Math.PI/2)`);await page.waitForTimeout(150);
  fs.writeFileSync(path.join(root,'test-results','mauz-outfit.png'),(await capture()).toPNG());
  await page.reload();dressed=await page.evaluate(()=>window.__animalTest.state());
  if(dressed.coins!==1030||dressed.outfitId!=='street'||!dressed.ownedOutfits.includes('street')||dressed.homeId!=='village')throw Error('Clothing/house save not preserved');
  console.log('PASS seven public venues and clothing purchase, visible equip and browser reload persistence');
  console.log('PASS four newest jobs, purchase review, insufficient funds, no duplicate charge, saved ownership/home spawn and map zoom');
  console.log('PASS phone menu, three cars, driving/braking, four new jobs, audio activation/muting and persistence',JSON.stringify(addedJobs));
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS delivery, no duplicate rewards, map, three region renders, saved coins',JSON.stringify(jobResult));
  console.log('PASS', JSON.stringify(result));
  } finally {
    if(browser)await browser.close();
    server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
