const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const store=new Map(),storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
const param=()=>({value:0,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;}});
const node=extra=>({connect(){},disconnect(){},...extra});
let context;
class Audio {
  constructor(){context=this;this.currentTime=0;this.sampleRate=8000;this.state='suspended';this.destination={};this.oscillators=[];this.gains=[];}
  async resume(){this.state='running';}
  createGain(){const g=node({gain:param()});this.gains.push(g);return g;}
  createDynamicsCompressor(){return node({threshold:param(),ratio:param()});}
  createOscillator(){const n=node({frequency:param(),type:'sine',start(){},stop(){}});this.oscillators.push(n);return n;}
  createBuffer(_channels,length){return {getChannelData:()=>new Float32Array(length)};}
  createBufferSource(){return node({start(){}});}
  createBiquadFilter(){return node({frequency:param()});}
}
const sandbox={window:{AudioContext:Audio},Math,Number,JSON};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','sound.js'),'utf8'),sandbox);
(async()=>{
  const sound=sandbox.createSound(storage);assert(!sound.running);
  assert(await sound.unlock());assert(sound.running);
  const signatures=[];
  for(const scene of ['menu','explore','delivery','clean','garden','repair','taxi','fishing','orchard','electric','trail']){
    const before=context.oscillators.length;
    sound.update(scene,{moving:true,driving:scene==='taxi',speed:12,working:scene==='garden'||scene==='repair'});
    assert.equal(sound.scene,scene);assert(context.oscillators.length>before);
    const first=context.oscillators[before];signatures.push(first.type+':'+first.frequency.value);
    context.currentTime+=.3;
  }
  assert(new Set(signatures).size>=5,'Themes must differ in timbre or tonality');
  for(const effect of ['reward','phone','jump','car','collect','click'])sound.effect(effect);
  const beforeMute=context.oscillators.length;
  sound.set('muted',true);sound.effect('reward');sound.update('taxi',{driving:true,speed:20});
  assert.equal(context.oscillators.length,beforeMute);assert.equal(context.gains[0].gain.value,0);assert.equal(context.gains[3].gain.value,0);
  sound.set('music',.15);sound.set('effects',.25);
  const restored=sandbox.createSound(storage);assert(restored.settings.muted);assert.equal(restored.settings.music,.15);assert.equal(restored.settings.effects,.25);
  sound.set('muted',false);sound.update('taxi',{driving:true,speed:20});sound.quietEngine();assert.equal(context.gains[3].gain.value,0);
  const spoken=[];let cancelled=0;sandbox.window.speechSynthesis={speak:u=>spoken.push(u),cancel(){cancelled++;},getVoices:()=>[{lang:'de-DE',localService:true}]};sandbox.window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  assert(sound.announce('Naechste Station: Stadt.'));assert.equal(spoken[0].lang,'de-DE');assert.equal(spoken[0].volume,.25);
  sound.set('muted',true);assert(!sound.announce('Unhoerbar'));assert.equal(spoken.length,1);assert(cancelled>0);
  sound.set('muted',false);sound.set('music',0);
  const bus={id:'test-bus',x:0,y:0,speed:8,wait:0,doors:0};
  const riding={buses:[bus],listener:{x:0,y:0},busId:bus.id};
  sound.update('explore',riding);assert(context.gains[4].gain.value>0,'Bus engine audible nearby');
  const movingPitch=context.oscillators[1].frequency.value;
  Object.assign(bus,{speed:0,wait:14,doors:1});const beforeStop=context.oscillators.length;
  sound.update('explore',riding);assert(context.oscillators.length>beforeStop,'Brake and opening effects');
  assert(context.oscillators[1].frequency.value<movingPitch,'Engine follows speed');
  const stopped=context.oscillators.length;for(let i=0;i<60;i++)sound.update('explore',riding);
  assert.equal(context.oscillators.length,stopped,'Do not repeat sounds every frame');
  bus.wait=.9;sound.update('explore',riding);assert(context.oscillators.length>stopped,'Door closing warning');
  sound.update('explore',{...riding,listener:{x:100,y:0},busId:null});assert.equal(context.gains[4].gain.value,0,'Distant bus silent');
  sound.update('explore',{...riding,paused:true});assert.equal(context.gains[4].gain.value,0,'Paused bus silent');
  console.log('PASS: eleven musical themes, six effects, lazy audio activation, engine shutdown, mute and volume persistence');
})().catch(error=>{console.error(error);process.exitCode=1;});
