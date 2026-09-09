function createAdventure(storage){
  const species=['cat','rabbit','bear','fox'];let profile={name:'Mauz',species:'cat'},waterTime=0,wet=false;
  function clean(name,kind){return {name:typeof name==='string'?name.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,18)||'Mauz':'Mauz',species:species.includes(kind)?kind:'cat'};}
  try{const p=JSON.parse(storage.getItem('animal-world-character-v1'));if(p)profile=clean(p.name,p.species);}catch{}
  return {get profile(){return {...profile};},select(name,kind){profile=clean(name,kind);try{storage.setItem('animal-world-character-v1',JSON.stringify(profile));}catch{}return {...profile};},tick(dt,inWater){wet=inWater;waterTime=inWater?waterTime+Math.max(0,dt):0;if(waterTime>=10){waterTime=0;wet=false;return true;}return false;},reset(){wet=false;waterTime=0;},get air(){return Math.max(0,10-waterTime);},get wet(){return wet;}};
}
