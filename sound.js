// Procedural music/effects and bundled MP3 bus announcements. No speech service at runtime.
function createSound(storage){
  let ctx,master,music,fx,engine,engineGain,busEngine,busGain,unlocked=false;
  let settings={muted:false,music:.3,effects:.55};
  try{const saved=JSON.parse(storage.getItem('animal-world-audio')||'null');if(saved){settings.muted=!!saved.muted;for(const key of ['music','effects'])if(Number.isFinite(saved[key]))settings[key]=Math.max(0,Math.min(1,saved[key]));}}catch{}
  const busStates=new Map(),beds={};let busFilter,nextAmbient=0;
  let ambience={wind:0,sea:0,traffic:0,busRoad:0};
  let theme='',nextNote=0,beat=0,nextStep=0,nextWork=0;
  const themes={
    menu:{bpm:92,root:60,notes:[0,4,7,12,9,7,4,2],wave:'triangle'},
    explore:{bpm:76,root:60,notes:[0,7,4,9,7,2,4,7],wave:'sine'},
    delivery:{bpm:112,root:62,notes:[0,4,7,4,9,7,12,7],wave:'triangle'},
    clean:{bpm:118,root:65,notes:[0,7,0,4,9,4,7,2],wave:'sine'},
    garden:{bpm:68,root:65,notes:[0,4,7,11,12,11,7,4],wave:'sine'},
    repair:{bpm:104,root:57,notes:[0,0,7,3,0,10,7,3],wave:'triangle'},
    taxi:{bpm:128,root:60,notes:[0,7,9,7,4,7,12,11],wave:'triangle'},
    fishing:{bpm:62,root:67,notes:[0,2,7,4,9,7,2,4],wave:'sine'},
    orchard:{bpm:98,root:64,notes:[0,4,9,7,4,2,7,12],wave:'triangle'},
    electric:{bpm:114,root:59,notes:[0,7,3,10,7,3,5,7],wave:'triangle'},
    trail:{bpm:84,root:62,notes:[0,7,12,9,7,4,2,0],wave:'sine'}
  };
  function save(){try{storage.setItem('animal-world-audio',JSON.stringify(settings));}catch{}}
  function tone(frequency,time,duration,volume,wave='sine',bus=fx,endFrequency){
    if(!ctx||!bus)return;
    const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type=wave;
    oscillator.frequency.setValueAtTime(frequency,time);if(endFrequency)oscillator.frequency.exponentialRampToValueAtTime(endFrequency,time+duration);
    gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+.012);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
    oscillator.connect(gain);gain.connect(bus);oscillator.start(time);oscillator.stop(time+duration+.02);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  }
  function noise(duration,volume,frequency=800){
    if(!ctx)return;
    const length=Math.ceil(ctx.sampleRate*duration),buffer=ctx.createBuffer(1,length,ctx.sampleRate),samples=buffer.getChannelData(0);
    for(let i=0;i<length;i++)samples[i]=(Math.random()*2-1)*(1-i/length);
    const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
    source.buffer=buffer;filter.type='lowpass';filter.frequency.value=frequency;gain.gain.value=volume;
    source.connect(filter);filter.connect(gain);gain.connect(fx);source.start();
    source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
  }
  async function unlock(){
    if(!ctx){
      const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;
      try{
        ctx=new Audio();master=ctx.createGain();music=ctx.createGain();fx=ctx.createGain();
        const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-10;limiter.ratio.value=8;
        master.gain.value=settings.muted?0:.6;music.gain.value=settings.music;fx.gain.value=settings.effects;
        music.connect(master);fx.connect(master);master.connect(limiter);limiter.connect(ctx.destination);
        engine=ctx.createOscillator();engine.type='triangle';engineGain=ctx.createGain();engineGain.gain.value=0;engine.connect(engineGain);engineGain.connect(fx);engine.start();
        busEngine=ctx.createOscillator();busEngine.type='sawtooth';busGain=ctx.createGain();busGain.gain.value=0;
        busFilter=ctx.createBiquadFilter();busFilter.type='lowpass';busFilter.frequency.value=180;
        busEngine.connect(busFilter);busFilter.connect(busGain);busGain.connect(fx);busEngine.start();
        // Four reusable loops: no new buffers or engines for each frame or vehicle.
        const buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),samples=buffer.getChannelData(0);
        for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
        for(const [name,frequency] of Object.entries({wind:420,sea:1100,traffic:250,busRoad:750})){
          const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
          source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=frequency;gain.gain.value=0;
          source.connect(filter);filter.connect(gain);gain.connect(fx);source.start();beds[name]={source,filter,gain};
        }
      }catch{return false;}
    }
    try{await ctx.resume();unlocked=ctx.state==='running';nextNote=ctx.currentTime;return unlocked;}catch{return false;}
  }
  function effect(type,volume=1){
    if(!ctx||ctx.state!=='running'||settings.muted||settings.effects===0)return;
    const t=ctx.currentTime;
    if(type==='bus-open'){noise(.55,.12*volume,1800);tone(190,t,.45,.035*volume,'triangle',fx,100);}
    else if(type==='bus-close'){tone(760,t,.1,.055*volume);tone(760,t+.18,.1,.055*volume);noise(.5,.1*volume,1300);tone(100,t+.45,.1,.05*volume);}
    else if(type==='bus-stop'){noise(.65,.14*volume,2200);tone(160,t,.25,.025*volume,'sine',fx,65);}
    else if(type==='reward'){for(const [i,f] of [523.25,659.25,783.99,1046.5].entries())tone(f,t+i*.08,.28,.12,'triangle');}
    else if(type==='phone'){for(let i=0;i<4;i++)tone(i%2?880:660,t+i*.12,.1,.09,'sine');}
    else if(type==='jump')tone(200,t,.18,.1,'sine',fx,520);
    else if(type==='explosion'){noise(.8,.5,450);tone(110,t,.65,.24,'sawtooth',fx,25);}
    else if(type==='crash'){noise(.15,.2,650);}
    else if(type==='car')tone(85,t,.3,.1,'triangle',fx,130);
    else if(type==='collect'){noise(.12,.09,1500);tone(640,t,.12,.08);}
    else tone(440,t,.08,.07,'sine',fx,580);
  }
  function updateBuses(state){
    let loudest=0,speed=0;
    for(const b of state.buses||[]){
      const old=busStates.get(b.id),phase=b.wait>1?'open':b.wait>0||b.doors>0?'closing':'closed';
      const distance=state.listener?Math.hypot(b.x-state.listener.x,b.y-state.listener.y):Infinity;
      const volume=state.paused||settings.muted?0:state.busId===b.id?1:Math.max(0,1-distance/32)**2;
      if(volume>loudest){loudest=volume;speed=Math.abs(b.speed);}
      if(old&&volume>0){
        if(old.speed>.3&&b.speed<=.3)effect('bus-stop',volume);
        if(phase!==old.phase&&phase==='open')effect('bus-open',volume);
        if(phase!==old.phase&&phase==='closing')effect('bus-close',volume);
      }
      busStates.set(b.id,{speed:b.speed,phase});
    }
    for(const id of busStates.keys())if(!(state.buses||[]).some(b=>b.id===id))busStates.delete(id);
    busEngine.frequency.setTargetAtTime(38+speed*3,ctx.currentTime,.15);
    busFilter.frequency.setTargetAtTime(220+speed*22,ctx.currentTime,.2);
    const duck=announcementSources.length?.55:1;
    busGain.gain.setTargetAtTime(loudest*(speed>.3?.17:.055)*duck,ctx.currentTime,.15);
    ambience.busRoad=loudest*Math.min(1,speed/13)*.1*duck;
    beds.busRoad.gain.gain.setTargetAtTime(ambience.busRoad,ctx.currentTime,.2);
  }
  function updateAmbience(state,now){
    const env=state.environment||{},active=!!state.listener&&!state.paused&&!settings.muted&&settings.effects>0;
    const shelter=state.busId?.length?.35:1,duck=announcementSources.length?.55:1;
    ambience.wind=active?.045*(env.wind??0)*shelter*duck:0;
    ambience.sea=active?.16*(env.sea??0)*(.7+.3*Math.sin(now*.65))*shelter*duck:0;
    ambience.traffic=active?.09*(env.traffic??0)*shelter*duck:0;
    for(const key of ['wind','sea','traffic'])beds[key].gain.gain.setTargetAtTime(ambience[key],now,.6);
    if(!active||state.busId||now<nextAmbient)return;
    nextAmbient=now+3+Math.random()*5;
    if(env.nature>.2){
      if(env.night){for(let i=0;i<3;i++)tone(3300,now+i*.14,.065,.018*env.nature,'sine',fx,3800);}
      else{const base=1700+Math.random()*600;for(let i=0;i<3;i++)tone(base,now+i*.18,.12,.035*env.nature,'sine',fx,base*(i%2?1.15:1.5));}
    }else if(env.sea>.4){tone(820,now,.45,.035,'sine',fx,1250);tone(1200,now+.5,.3,.025,'sine',fx,750);}
  }
  function update(scene,state){
    if(state.paused)cancelAnnouncement();
    if(!ctx||ctx.state!=='running')return;
    const now=ctx.currentTime;
    updateBuses(state);
    updateAmbience(state,now);
    master.gain.setTargetAtTime(settings.muted?0:.6,now,.04);
    music.gain.setTargetAtTime(settings.music*(state.paused?.45:1),now,.08);fx.gain.setTargetAtTime(settings.effects,now,.05);
    engine.frequency.setTargetAtTime(48+Math.abs(state.speed||0)*4,now,.07);
    engineGain.gain.setTargetAtTime(state.driving&&!state.paused&&!settings.muted?.11:0,now,.08);
    if(theme!==scene){theme=scene;beat=0;nextNote=now+.04;}
    const song=themes[scene]||themes.explore;
    if(nextNote<now)nextNote=now;
    while(nextNote<now+.15){
      const interval=60/song.bpm/2,chord=[0,5,0,7][Math.floor(beat/16)%4],note=song.root+song.notes[beat%8]+chord;
      if(!settings.muted&&settings.music>0){
        tone(440*2**((note-69)/12),nextNote,interval*.85,.1,song.wave,music);
        if(beat%4===0){const bass=song.root-24+chord;tone(440*2**((bass-69)/12),nextNote,interval*3,.08,'sine',music);}
        if((scene==='taxi'||scene==='clean'||scene==='repair')&&beat%2===0)tone(90,nextNote,.1,.04,'sine',music,45);
      }
      beat++;nextNote+=interval;
    }
    if(settings.muted||settings.effects===0||state.paused)return;
    if(state.moving&&!state.driving&&now>nextStep){noise(state.environment?.water?.15:.045,state.environment?.water?.1:.065,state.environment?.water?1600:state.busId?700:state.environment?.paved?950:320);nextStep=now+(state.running?.2:.32);}
    if(state.working&&now>nextWork){
      if(scene==='garden'||scene==='fishing')noise(.22,.055,scene==='fishing'?650:2000);
      else if(scene==='electric')tone(280,now,.16,.045,'triangle');
      else{tone(1250,now,.035,.07,'sine');noise(.06,.06,950);}
      nextWork=now+.3;
    }
    if(state.braking&&Math.abs(state.speed)>3&&now>nextStep){noise(.09,.07,1500);nextStep=now+.35;}
  }
  const announcementCache=new Map();let announcementSources=[],announcementToken=0;
  function cancelAnnouncement(){
    announcementToken++;
    for(const source of announcementSources){try{source.stop();}catch{}source.disconnect();}
    announcementSources=[];
  }
  function loadAnnouncement(url){
    if(!announcementCache.has(url))announcementCache.set(url,fetch(url).then(response=>{
      if(!response.ok)throw Error('Ansage nicht gefunden');return response.arrayBuffer();
    }).then(bytes=>ctx.decodeAudioData(bytes)).catch(error=>{announcementCache.delete(url);throw error;}));
    return announcementCache.get(url);
  }
  function announce({line,stop,next=false,terminal=false}){
    if(!unlocked||settings.muted||settings.effects===0||!stop||!/^\d+$/.test(String(line)))return false;
    cancelAnnouncement();effect('phone');const token=announcementToken;
    const name=stop.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    const urls=['assets/sound/line-'+line+'.mp3','assets/sound/'+(next?'next-':'station-')+name+'.mp3'];
    if(terminal)urls.push('assets/sound/terminal-'+(next?'next':'arrival')+'.mp3');
    Promise.all(urls.map(loadAnnouncement)).then(buffers=>{
      if(token!==announcementToken||settings.muted||settings.effects===0||ctx.state!=='running')return;
      let at=ctx.currentTime+.05;
      for(const buffer of buffers){
        const source=ctx.createBufferSource();source.buffer=buffer;source.connect(fx);
        source.onended=()=>{source.disconnect();announcementSources=announcementSources.filter(s=>s!==source);};
        announcementSources.push(source);source.start(at);at+=buffer.duration+.1;
      }
    }).catch(()=>{});
    return true;
  }
  function set(key,value){if(key==='muted')settings.muted=!!value;else if(key==='music'||key==='effects')settings[key]=Math.max(0,Math.min(1,Number(value)||0));if(settings.muted||settings.effects===0)cancelAnnouncement();save();}
  function quietEngine(){if(ctx)engineGain.gain.setTargetAtTime(0,ctx.currentTime,.03);}
  return {get ambience(){return {...ambience};},get announcementPlaying(){return announcementSources.length>0;},announce,cancelAnnouncement,unlock,effect,update,set,quietEngine,get scene(){return theme;},get settings(){return {...settings};},get running(){return !!ctx&&ctx.state==='running';},get available(){return !!(window.AudioContext||window.webkitAudioContext);}};
}
