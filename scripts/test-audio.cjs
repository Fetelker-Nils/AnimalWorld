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
  console.log('PASS: eleven musical themes, six effects, lazy audio activation, engine shutdown, mute and volume persistence');
})().catch(error=>{console.error(error);process.exitCode=1;});
