// Original procedural music and effects. No downloads or audio files required.
function createSound(storage){
  let ctx,master,music,fx,engine,engineGain,unlocked=false;
  let settings={muted:false,music:.3,effects:.55};
  try{const saved=JSON.parse(storage.getItem('animal-world-audio')||'null');if(saved){settings.muted=!!saved.muted;for(const key of ['music','effects'])if(Number.isFinite(saved[key]))settings[key]=Math.max(0,Math.min(1,saved[key]));}}catch{}
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
      }catch{return false;}
    }
    try{await ctx.resume();unlocked=ctx.state==='running';nextNote=ctx.currentTime;return unlocked;}catch{return false;}
  }
  function effect(type){
    if(!ctx||ctx.state!=='running'||settings.muted)return;
    const t=ctx.currentTime;
    if(type==='reward'){for(const [i,f] of [523.25,659.25,783.99,1046.5].entries())tone(f,t+i*.08,.28,.12,'triangle');}
    else if(type==='phone'){for(let i=0;i<4;i++)tone(i%2?880:660,t+i*.12,.1,.09,'sine');}
    else if(type==='jump')tone(200,t,.18,.1,'sine',fx,520);
    else if(type==='car')tone(85,t,.3,.1,'triangle',fx,130);
    else if(type==='collect'){noise(.12,.09,1500);tone(640,t,.12,.08);}
    else tone(440,t,.08,.07,'sine',fx,580);
  }
  function update(scene,state){
    if(!ctx||ctx.state!=='running')return;
    const now=ctx.currentTime;
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
    if(settings.muted||state.paused)return;
    if(state.moving&&!state.driving&&now>nextStep){noise(.045,.065,320);nextStep=now+(state.running?.2:.32);}
    if(state.working&&now>nextWork){
      if(scene==='garden'||scene==='fishing')noise(.22,.055,scene==='fishing'?650:2000);
      else if(scene==='electric')tone(280,now,.16,.045,'triangle');
      else{tone(1250,now,.035,.07,'sine');noise(.06,.06,950);}
      nextWork=now+.3;
    }
    if(state.braking&&Math.abs(state.speed)>3&&now>nextStep){noise(.09,.07,1500);nextStep=now+.35;}
  }
  function set(key,value){if(key==='muted')settings.muted=!!value;else if(key==='music'||key==='effects')settings[key]=Math.max(0,Math.min(1,Number(value)||0));save();}
  function quietEngine(){if(ctx)engineGain.gain.setTargetAtTime(0,ctx.currentTime,.03);}
  return {unlock,effect,update,set,quietEngine,get scene(){return theme;},get settings(){return {...settings};},get running(){return !!ctx&&ctx.state==='running';},get available(){return !!(window.AudioContext||window.webkitAudioContext);}};
}
