const Island = (() => {
  const radius=560,border=1300;
  const luxury={x:900,y:0,radius:radius/Math.sqrt(5),name:'Perleninsel'};
  const docks=[{x:559,y:0,w:28,d:6},{x:645,y:0,w:28,d:6}];
  const airfields=[{x:210,y:230,w:32,d:110},{x:900,y:155,w:32,d:100}];
  const inDock=(x,y)=>docks.some(d=>Math.abs(x-d.x)<d.w/2&&Math.abs(y-d.y)<d.d/2);
  const inSea=(x,y)=>Math.hypot(x,y)>radius-1&&Math.hypot(x-luxury.x,y-luxury.y)>luxury.radius-1&&!inDock(x,y);
  const inBounds=(x,y)=>Math.hypot(x,y)<border;

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
  for(let row=0;row<4;row++)for(let col=0;col<5;col++){
    const x=760+col*65,y=-150+row*65,id='luxury-'+row+'-'+col;
    const building={x,y,w:22,d:16,h:8+(col%2)*2,color:palette[(row+col)%5],roof:'#e7dfcd',homeId:id,luxury:true};
    buildings.push(building);homes.push({id,name:'Perlenvilla '+(row*5+col+1),price:2400+row*400+col*250,x,y:y+10,building});
  }
  const outfits=[
    {id:'street',name:'Rotes T-Shirt',price:70,color:'#c7685a',trim:'#efd7a1'},
    {id:'ocean',name:'Meeres-Pullover',price:100,color:'#5f9fba',trim:'#d9ebe9'},
    {id:'ranger',name:'Wald-Outfit',price:130,color:'#678452',trim:'#e3d3a2',hat:'#61774d'},
    {id:'sunny',name:'Sonnen-Shirt',price:90,color:'#e2bf54',trim:'#fff0c9'},
    {id:'police',name:'Polizei-Outfit',price:180,color:'#506b94',trim:'#eac879',hat:'#405777'},
    {id:'fire',name:'Feuerwehr-Outfit',price:220,color:'#bb6049',trim:'#f2dc72',hat:'#dabb4d'},
    {id:'medic',name:'Arztkittel',price:190,color:'#e5ece6',trim:'#6ba6a4'}
  ];
  const venues=[
    {id:'clothes',name:'Mauz Mode',kind:'clothes',bx:-18,by:-25,color:'#d4b1cd',floor:'#d9cfbc',message:'Willkommen bei Mauz Mode! Schau dir unsere Outfits an.'},
    {id:'restaurant',name:'Restaurant Pfotenstube',bx:18,by:-43,color:'#e8ba91',floor:'#dfc798',message:'Willkommen in der Pfotenstube! Such dir einen Platz zwischen den Tischen.'},
    {id:'police',name:'Polizeistation',bx:-36,by:-61,color:'#a8c1d9',floor:'#c3d1d5',message:'Wir behalten die Stadt im Blick. Bitte fahre vorsichtig und halte an, bevor du aussteigst.'},
    {id:'hospital',name:'Krankenhaus',bx:36,by:-79,color:'#d4e6dc',floor:'#dce9e0',message:'Willkommen am Empfang. Die Patientenzimmer liegen links und rechts.'},
    {id:'fire',name:'Feuerwehr',bx:-18,by:-97,color:'#d99b85',floor:'#b9bcb1',message:'Hier stehen unsere Ausruestung und das Einsatzfahrzeug bereit.'},
    {id:'bank',name:'Pfotenbank',bx:18,by:-130,color:'#d5cead',floor:'#d5d1bd',message:'Dein Guthaben wird zusammen mit deinen Haeusern und Kleidern lokal gespeichert.'},
    {id:'market',name:'Stadtmarkt',bx:-36,by:-130,color:'#b5d2a1',floor:'#d5d6b8',message:'Hier lagern Obst, Gemuese und Vorratskisten fuer die Stadt.'}
  ].map(v=>{
    const building=buildings.find(b=>b.x===v.bx&&b.y===v.by);building.venueId=v.id;building.color=v.color;
    return {...v,public:true,x:building.x,y:building.y+building.d/2+2,building};
  });
  buildings.find(b=>b.x===-10&&b.y===-8).jobId='delivery';
  // Every remaining building can become a furnished home.
  for(const [i,b] of buildings.entries())if(!b.venueId&&!b.homeId&&!b.jobId){
    b.homeId='residence-'+i;
    homes.push({id:b.homeId,name:(b.city?'Stadtwohnung ':'Inselhaus ')+(i+1),price:b.city?300+Math.round(b.h*15):240+Math.round(b.w*10),x:b.x,y:b.y+b.d/2+2,building:b});
  }
  for(const home of [...homes]){
    const b=home.building;home.buildingId=b.homeId;home.floor=0;home.unit=0;home.floors=b.city?Math.max(2,Math.min(6,Math.floor(b.h/4))):1;
    home.type=b.city?'apartment':b.luxury?'villa':'house';
    if(b.city){
      const baseName='Wohnhaus '+b.homeId.replace('residence-','');home.name=baseName+' - EG, Wohnung A';
      for(let floor=0;floor<home.floors;floor++)for(let unit=0;unit<2;unit++)if(floor||unit)homes.push({...home,id:home.id+'-f'+floor+'-u'+unit,floor,unit,name:baseName+' - '+(floor?floor+'. Etage':'EG')+', Wohnung '+(unit?'B':'A'),price:home.price+floor*90+unit*45});
    }
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
  for(const y of [-130,-65,0,65])roads.push({x:900,y,w:340,d:6});
  roads.push({x:710,y:35,w:6,d:70},{x:800,y:100,w:200,d:6},{x:550,y:8,w:30,d:6},{x:535,y:14,w:70,d:8},{x:655,y:8,w:20,d:6},{x:680,y:0,w:65,d:6},{x:900,y:130,w:6,d:60},{x:210,y:190,w:6,d:50});
  // Continuous road from the existing harbour road to the airport forecourt.
  roads.push({x:202.5,y:165,w:75,d:8},{x:235,y:193,w:8,d:64},{x:228,y:220,w:22,d:6},{x:0,y:-320,w:12,d:12});
  const busRoute=[
    {x:-1.8,y:-310,name:'Nordstadt'},{x:-1.8,y:-100,name:'Stadtzentrum'},
    {x:-1.8,y:65,name:'Dorf'},{x:-1.8,y:150,name:'Hafenstrasse'},
    {x:-1.8,y:166.8},{x:233.2,y:166.8},{x:233.2,y:218,name:'Flugplatz'},
    {x:236.8,y:218},{x:236.8,y:163.2},{x:1.8,y:163.2},
    {x:1.8,y:65,name:'Dorf'},{x:1.8,y:-100,name:'Stadtzentrum'},
    {x:1.8,y:-320},{x:-1.8,y:-320}
  ];
  roads.push({x:730,y:50,w:8,d:110},{x:1090,y:32,w:8,d:78},{x:910,y:0,w:370,d:8},{x:910,y:65,w:370,d:8},{x:915,y:100,w:40,d:8},{x:930,y:125,w:8,d:58});
  const busLines=[
    {id:'1',name:'Stadt - Flugplatz',color:'#e0b657',route:busRoute,starts:[0,6]},
    {id:'2',name:'Obstgarten - Hafen',color:'#77a7bf',starts:[0,5],route:[{x:-330,y:15.8,name:'Obstgarten'},{x:-150,y:15.8,name:'Farm'},{x:160,y:15.8,name:'Werkstatt'},{x:520,y:15.8,name:'Osthafen'},{x:535,y:15.8},{x:535,y:12.2,name:'Osthafen'},{x:160,y:12.2,name:'Werkstatt'},{x:-150,y:12.2,name:'Farm'},{x:-330,y:12.2,name:'Obstgarten'},{x:-370,y:12.2},{x:-370,y:15.8}]},
    {id:'3',name:'Perleninsel Rundfahrt',color:'#ba91bb',starts:[0],route:[{x:728.2,y:10,name:'Perlenhafen'},{x:728.2,y:66.8},{x:900,y:66.8,name:'Villenpromenade'},{x:1091.8,y:66.8},{x:1091.8,y:25,name:'Ostpromenade'},{x:1091.8,y:-1.8},{x:900,y:-1.8,name:'Villengarten'},{x:728.2,y:-1.8}]},
    {id:'4',name:'Perleninsel Flughafenbus',color:'#79aa82',starts:[0],route:[{x:728.2,y:80,name:'Perlenhafen Sued'},{x:728.2,y:101.8},{x:928.2,y:101.8},{x:928.2,y:145,name:'Perlenflugplatz'},{x:931.8,y:145},{x:931.8,y:98.2},{x:731.8,y:98.2},{x:731.8,y:80,name:'Perlenhafen Sued'},{x:731.8,y:70},{x:728.2,y:70}]}
  ];
  const busStops=busLines.flatMap(line=>line.route.flatMap((p,i)=>{if(!p.name)return [];const prev=line.route[(i+line.route.length-1)%line.route.length],heading=Math.atan2(p.y-prev.y,p.x-prev.x);return [{id:'stop-'+line.id+'-'+i,line:line.id,color:line.color,name:p.name,heading,x:p.x-Math.sin(heading)*4,y:p.y+Math.cos(heading)*4,roadX:p.x,roadY:p.y}];}));

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
  booths.push({x:550,y:0,sx:563,sy:6,name:'Bootssteg Ost',kind:'boat'}, {x:655,y:0,sx:645,sy:6,name:'Perleninsel Hafen',kind:'boat'}, {x:225,y:220,sx:210,sy:230,name:'Flugplatz Hauptinsel',kind:'air'}, {x:918,y:145,sx:900,sy:155,name:'Perleninsel Flugplatz',kind:'air'}, {x:720,y:68,sx:720,sy:60,name:'Perleninsel Fahrzeuge'});
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
  const blocked=(x,y)=>(!inBounds(x,y)||inSea(x,y))||inPond(x,y,.45)||buildings.some(b=>Math.abs(x-b.x)<b.w/2+.45&&Math.abs(y-b.y)<b.d/2+.45);
  const lamps=[];
  for(const road of roads){
    const vertical=road.d>road.w,length=vertical?road.d:road.w,edge=(vertical?road.w:road.d)/2+1.2;
    if(length<60)continue;
    for(let n=-length/2+12;n<length/2-8;n+=32){
      const side=Math.round(n/32)%2===0?1:-1;
      const x=road.x+(vertical?edge*side:n),y=road.y+(vertical?n:edge*side);
      if(blocked(x,y)||onRoad(x,y,.3)||heightAt(x,y)>0||lamps.some(l=>Math.hypot(l.x-x,l.y-y)<18)||[depot,...venues,...jobs,...jobs.flatMap(j=>j.points),...homes,...booths,...booths.map(b=>({x:b.sx,y:b.sy}))].some(t=>Math.hypot(t.x-x,t.y-y)<6))continue;
      lamps.push({x,y});
    }
  }
  const reserved=(x,y)=>busStops.some(p=>Math.hypot(p.x-x,p.y-y)<7)||airfields.some(a=>Math.abs(x-a.x)<a.w/2+8&&Math.abs(y-a.y)<a.d/2+8)||inDock(x,y)||lamps.some(l=>Math.hypot(l.x-x,l.y-y)<1.5)||onRoad(x,y,2)||heightAt(x,y)>0||Math.hypot(x,y)<15||[depot,...deliveries,...venues,...jobs,...jobs.flatMap(j=>j.points),...homes,...booths,...booths.map(b=>({x:b.sx,y:b.sy}))].some(t=>Math.hypot(x-t.x,y-t.y)<6)||buildings.some(b=>Math.hypot(x-b.x,y-b.y)<14);
  return {busLines,busRoute,busStops,inSea,inBounds,inDock,border,luxury,docks,airfields,radius,buildings,roads,lamps,outfits,venues,depot,deliveries,booths,jobs,homes,pond,mountain,heightAt,inPond,onRoad,blocked,reserved};
})();

globalThis.AnimalIsland=Island;
