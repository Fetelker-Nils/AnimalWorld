const Island = (() => {
  const radius=560;
  const buildings=[];
  const palette=['#e9d3af','#bfd7de','#d0d9bd','#e2c5bb','#d0ccdf'];
  for(const [row,y] of [-25,-43,-61,-79,-97].entries()) {
    for(const [column,x] of [-36,-18,18,36].entries()) {
      buildings.push({x,y,w:10,d:10,h:10+(row*3+column*5)%16,color:palette[(row+column)%5],roof:'#839594',city:true});
    }
  }
  for(const [row,y] of [60,77,94].entries())for(const x of [-12,12])
    buildings.push({x,y,w:8,d:7,h:5+row*.3,color:palette[row],roof:row%2?'#819bab':'#cf8b63'});
  buildings.push({x:-10,y:-8,w:8,d:7,h:5.5,color:'#f2d99e',roof:'#d38c5e'});
  for(const y of [-130,-148,-166,-184])for(const x of [-36,-18,18,36])
    buildings.push({x,y,w:10,d:10,h:12+(Math.abs(x+y)%17),color:palette[Math.abs(x+y)%5],roof:'#839594',city:true});
  buildings.push({x:-150,y:-17,w:16,d:10,h:6,color:'#e5cb9b',roof:'#b87657'},
    {x:160,y:-18,w:22,d:12,h:7,color:'#bfcad0',roof:'#708890'},
    {x:-16,y:182,w:12,d:10,h:8,color:'#e1d2b5',roof:'#879ba1'},
    {x:16,y:182,w:12,d:10,h:8,color:'#c8d8cf',roof:'#879ba1'});
  for(const y of [-280,-298,-316,-334,-352])for(const x of [-36,-18,18,36])
    buildings.push({x,y,w:10,d:10,h:8+Math.abs(x+y)%12,color:palette[Math.abs(x+y)%5],roof:'#839594',city:true});
  buildings.push({x:-350,y:-28,w:14,d:10,h:6,color:'#e5d7af',roof:'#b87e60'});
  const starter=buildings.find(b=>b.x===-12&&b.y===60);starter.homeId='village';
  const homes=[{id:'village',name:'Dorfhäuschen',price:180,x:-12,y:65.5,building:starter}];
  for(const h of [
    {id:'east',name:'Gartenhaus im Osten',price:350,x:280,y:90,w:9,d:8,h:5.5,color:'#e3cfb5',roof:'#8c9d7c'},
    {id:'villa',name:'Sonnenvilla',price:650,x:310,y:90,w:12,d:10,h:7,color:'#e6dcbd',roof:'#cc967b'},
    {id:'orchard',name:'Haus am Obstgarten',price:420,x:-340,y:130,w:10,d:8,h:6,color:'#cfdfc3',roof:'#a08364'},
    {id:'south',name:'Südhaus',price:800,x:18,y:345,w:12,d:10,h:8,color:'#c9dce3',roof:'#8ba0b0'}
  ]){
    const building={...h,homeId:h.id};buildings.push(building);
    homes.push({id:h.id,name:h.name,price:h.price,x:h.x,y:h.y+h.d/2+2,building});
  }
  const depot={x:-10,y:-2,name:'Paketpost'};
  const deliveries=[
    {x:18,y:-18,name:'Stadt · Haus 18',reward:35},
    {x:12,y:65.5,name:'Dorf · Sonnenhaus',reward:60},
    {x:-36,y:-72,name:'Stadt · Nordviertel',reward:50}
  ];
  const roads=[{x:0,y:0,w:8,d:1040}];
  for(const x of [-45,-27,27,45])roads.push({x,y:-61,w:6,d:96});
  for(const y of [-16,-34,-52,-70,-88,-106])roads.push({x:0,y,w:98,d:6});
  roads.push({x:0,y:14,w:208,d:7});
  roads.push({x:113,y:14,w:24,d:3},{x:124,y:-13,w:3,d:54});
  for(const y of [49,66,83,100])roads.push({x:0,y,w:39,d:3});
  for(const x of [-45,-27,27,45])roads.push({x,y:-151,w:6,d:96});
  for(const y of [-121,-139,-157,-175,-193])roads.push({x:0,y,w:98,d:6});
  roads.push({x:0,y:14,w:350,d:7},{x:0,y:165,w:340,d:7});
  for(const x of [-170,170])roads.push({x,y:89,w:7,d:157});
  roads.push({x:-150,y:0,w:4,d:30},{x:160,y:0,w:4,d:30});
  roads.push({x:0,y:14,w:1000,d:8},{x:300,y:57,w:6,d:86},{x:300,y:100,w:80,d:5},
    {x:-350,y:77,w:6,d:126},{x:-350,y:140,w:70,d:5},{x:-350,y:-4,w:44,d:3},
    {x:-350,y:-5,w:3,d:38},{x:16,y:352,w:42,d:5},{x:-85,y:36,w:3,d:44});
  for(const x of [-45,-27,27,45])roads.push({x,y:-310,w:6,d:108});
  for(const y of [-271,-289,-307,-325,-343,-361])roads.push({x:0,y,w:98,d:6});
  const booths=[
    {x:10,y:-5,sx:10,sy:1,name:'Startplatz'},
    {x:7,y:-106,sx:0,sy:-106,name:'Nordstadt'},
    {x:7,y:49,sx:0,sy:49,name:'Dorf'},
    {x:-142,y:20,sx:-142,sy:14,name:'Farm'},
    {x:170,y:20,sx:170,sy:14,name:'Werkstatt'},
    {x:8,y:169,sx:0,sy:169,name:'Hafen'},
    {x:-342,y:20,sx:-342,sy:14,name:'Obstgarten'},
    {x:307,y:108,sx:300,sy:100,name:'Ostviertel'},
    {x:7,y:-271,sx:0,sy:-271,name:'Neue Nordstadt'},
    {x:7,y:325,sx:0,sy:325,name:'Südviertel'}
  ];
  const jobs=[
    {id:'clean',name:'Strassenreinigung',x:-6,y:20,reward:70,action:'Abfall sammeln',kind:'collect',points:[{x:-6,y:31},{x:6,y:44},{x:-7,y:68},{x:7,y:86},{x:-6,y:102}]},
    {id:'garden',name:'Gartenpflege',x:-150,y:8,reward:85,action:'Giessen',kind:'hold',seconds:1.5,points:[{x:-162,y:4},{x:-150,y:-4},{x:-138,y:4}]},
    {id:'repair',timing:true,name:'Mechaniker',x:160,y:8,reward:100,action:'Reparieren',kind:'hold',seconds:2,points:[{x:148,y:4},{x:160,y:-4},{x:172,y:4}]},
    {id:'taxi',name:'Taxi',x:8,y:8,reward:260,action:'Fahrgast abholen',kind:'taxi',points:[{x:0,y:-307,name:'Fahrgast in der Nordstadt'},{x:0,y:460,name:'Strand im tiefen Süden'}]},
    {id:'fishing',timing:true,name:'Angeln',x:-86,y:40,reward:190,action:'Angeln',kind:'hold',seconds:3,doneText:'Fisch gefangen',points:[{x:-85,y:50},{x:-85,y:58},{x:-85,y:66}]},
    {id:'orchard',name:'Obsternte',x:-350,y:8,reward:140,action:'Apfel ernten',kind:'collect',item:'Apfel',points:[{x:-362,y:-4},{x:-350,y:-4},{x:-338,y:-4},{x:-350,y:-16}]},
    {id:'electric',timing:true,name:'Elektriker',x:300,y:108,reward:180,action:'Schaltkasten prüfen',kind:'hold',seconds:2,doneText:'Schaltkasten geprüft',points:[{x:280,y:108},{x:300,y:96},{x:320,y:108}]},
    {id:'trail',name:'Bergkontrolle',x:130,y:-40,reward:220,action:'Wegmarkierung prüfen',kind:'collect',item:'Wegmarkierung',points:[{x:122,y:-40},{x:112,y:-36},{x:103,y:-42},{x:88,y:-40}]}
  ];
  const pond={x:-65,y:58,rx:17,ry:12};
  const mountain={x:88,y:-40,radius:34,height:38};
  const heightAt=(x,y)=>mountain.height*Math.max(0,1-Math.max(0,Math.hypot(x-mountain.x,y-mountain.y)-4)/(mountain.radius-4));
  const inPond=(x,y,pad=0)=>((x-pond.x)/(pond.rx+pad))**2+((y-pond.y)/(pond.ry+pad))**2<1;
  const onRoad=(x,y,pad=1)=>roads.some(r=>Math.abs(x-r.x)<r.w/2+pad&&Math.abs(y-r.y)<r.d/2+pad);
  const blocked=(x,y)=>Math.hypot(x,y)>radius-1||inPond(x,y,.45)||buildings.some(b=>Math.abs(x-b.x)<b.w/2+.45&&Math.abs(y-b.y)<b.d/2+.45);
  const reserved=(x,y)=>onRoad(x,y,2)||heightAt(x,y)>0||Math.hypot(x,y)<15||[depot,...deliveries,...jobs,...jobs.flatMap(j=>j.points),...homes,...booths,...booths.map(b=>({x:b.sx,y:b.sy}))].some(t=>Math.hypot(x-t.x,y-t.y)<6)||buildings.some(b=>Math.hypot(x-b.x,y-b.y)<14);
  return {radius,buildings,roads,depot,deliveries,booths,jobs,homes,pond,mountain,heightAt,inPond,onRoad,blocked,reserved};
})();
