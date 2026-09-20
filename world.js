const Island = (() => {
  const radius=560,border=16000;
  const continent={x:-7300,y:0,radius:6700,name:'Pfotenland'};
  const luxury={x:900,y:0,radius:radius/Math.sqrt(5),name:'Perleninsel'};
  const docks=[{x:559,y:0,w:28,d:6},{x:645,y:0,w:28,d:6}];
  const airfields=[{x:210,y:230,w:32,d:110},{x:900,y:155,w:32,d:100}];
  const inDock=(x,y)=>docks.some(d=>Math.abs(x-d.x)<d.w/2&&Math.abs(y-d.y)<d.d/2);
  const bridge={x:610,y:14,w:140,d:12};
  const onBridge=(x,y)=>Math.abs(x-bridge.x)<=bridge.w/2&&Math.abs(y-bridge.y)<=bridge.d/2;
  const bridgeBarrier=(x,y)=>Math.abs(x-bridge.x)<bridge.w/2&&Math.abs(y-bridge.y)>bridge.d/2-.7&&Math.abs(y-bridge.y)<bridge.d/2+.7;
  const inSea=(x,y)=>railStructures.some(r=>r.kind==='bridge'&&Math.abs(x-r.x)<r.w/2-4&&Math.abs(y-r.y)>r.d/2&&Math.abs(y-r.y)<37.5)||Math.hypot(x,y)>radius-1&&Math.hypot(x-luxury.x,y-luxury.y)>luxury.radius-1&&Math.hypot(x-continent.x,y-continent.y)>continent.radius-1&&!(x>-635&&x<-495&&y>-25&&y<145)&&!inDock(x,y)&&!onBridge(x,y);
  const inBounds=(x,y)=>Math.hypot(x,y)<border;

  const towns=[
    {name:'Weststadt',x:-1000,y:-80,city:true},{name:'Lindenau',x:-2200,y:-80},
    {name:'Bergstadt',x:-3500,y:-80,city:true},{name:'Tannenheim',x:-5000,y:-80},
    {name:'Sonnenfeld',x:-2200,y:1140},{name:'Seestadt',x:-4000,y:1140,city:true},
    {name:'Blumental',x:-1800,y:1540},{name:'Waldruh',x:-4000,y:1540}
  ];
  const expansionNames=['Auenstadt','Birkenhain','Felsenburg','Moosdorf','Silberstadt','Eichental','Wiesenburg','Kieselbach','Wolkenstadt','Rotbuchen','Kristallstadt','Fuchsdorf','Morgenstadt','Blaubeertal','Edelstadt','Hasenau','Abendstadt','Tannengrund','Kronenstadt','Rehweiler'];
  // Hand-picked, permanent settlement coordinates; no random placement at startup.
  const expansionPositions=[[-6800,-2700],[-8300,-3500],[-10400,-2400],[-11900,-1100],[-7200,-1350],[-9150,-1850],[-10850,-450],[-12300,850],[-6650,350],[-8450,-200],[-9700,850],[-11350,2100],[-7200,1950],[-8850,2400],[-10050,3300],[-11500,3650],[-6450,3650],[-8000,4250],[-9450,4750],[-5400,2600]];
  const newTowns=expansionNames.map((name,i)=>({name,x:expansionPositions[i][0],y:expansionPositions[i][1],city:i%2===0,expanded:true}));
  towns.push(...newTowns);
  const railLines=[{id:'R1',name:'Westbahn',color:'#b65349',starts:[0,5],route:[
    {x:-170,y:-10,name:'Mauz Hauptbahnhof',terminal:true},{x:-1000,y:-10,name:'Weststadt'},
    {x:-2200,y:-10,name:'Lindenau'},{x:-3500,y:-10,name:'Bergstadt'},{x:-5000,y:-10,name:'Tannenheim',terminal:true},
    {x:-5350,y:-10},{x:-5400,y:40},{x:-5350,y:90},
    {x:-5000,y:90,name:'Tannenheim',terminal:true},{x:-3500,y:90,name:'Bergstadt'},
    {x:-2200,y:90,name:'Lindenau'},{x:-1000,y:90,name:'Weststadt'},{x:-170,y:90,name:'Mauz Hauptbahnhof',terminal:true},
    {x:-90,y:90},{x:-90,y:-10}
  ]},{id:'R2',name:'Seenlandbahn',color:'#497fa9',starts:[0],route:[
    {x:-2200,y:230,name:'Lindenau Sued',terminal:true},{x:-2200,y:1130,name:'Sonnenfeld'},
    {x:-2200,y:1200},{x:-3910,y:1200,name:'Seestadt'},{x:-4000,y:1200},
    {x:-4000,y:1510,name:'Waldruh'},{x:-4000,y:1600},{x:-1880,y:1600,name:'Blumental',terminal:true},
    {x:-1800,y:1600},{x:-1800,y:170},{x:-2200,y:170}
  ]}];
  // Separate rail corridors from streets; opposite platforms belong to the same hub.
  for(const p of railLines[0].route){
    if(p.name==='Mauz Hauptbahnhof')p.x=-260;
    else if(p.name)p.x+=p.y===-10?-80:80;
    else if(p.x===-90)p.x=-120;
  }
  railLines[1].route=[
    {x:-2180,y:170,name:'Lindenau',terminal:true},{x:-2310,y:170},
    {x:-2310,y:1130,name:'Sonnenfeld'},{x:-2310,y:1200},
    {x:-4080,y:1200,name:'Seestadt'},{x:-4110,y:1200},
    {x:-4110,y:1510,name:'Waldruh'},{x:-4110,y:1600},
    {x:-1880,y:1600,name:'Blumental',terminal:true},{x:-1690,y:1600},{x:-1690,y:170}
  ];
  railLines.push({id:'R3',name:'Pfotenland Express',color:'#aa844a',starts:[0],route:[
    {x:-3580,y:-36,name:'Bergstadt',terminal:true},{x:-3750,y:-36},{x:-3750,y:-450},{x:-5200,y:-450},
    {x:-5200,y:-80,name:'Tannenheim'},{x:-5200,y:1660},{x:-4080,y:1660,name:'Waldruh',terminal:true},
    {x:-3890,y:1660},{x:-3890,y:1130,name:'Seestadt'},{x:-3890,y:300},{x:-3290,y:300},{x:-3290,y:-36}
  ]});
  railLines.push({id:'R4',name:'Panoramabahn',color:'#8b65a6',starts:[0],route:[
    {x:-1080,y:-36,name:'Weststadt',terminal:true},{x:-1250,y:-36},{x:-1250,y:800},{x:-2070,y:800},
    {x:-2070,y:1130,name:'Sonnenfeld'},{x:-2070,y:1740},{x:-1780,y:1740,name:'Blumental',terminal:true},
    {x:-1500,y:1740},{x:-1500,y:210},{x:-2070,y:210,name:'Lindenau'},{x:-2450,y:210},{x:-2450,y:-380},
    {x:-750,y:-380},{x:-750,y:-36}
  ]});
  // Fixed regional connections between the individually placed settlements.
  const linkPairs=[[0,1],[1,2],[2,3],[0,4],[4,5],[5,6],[6,7],[4,8],[8,9],[9,10],[10,11],[8,12],[12,13],[13,14],[14,15],[12,16],[16,17],[17,18],[12,19]];
  const links=linkPairs.map(([a,b])=>[newTowns[a],newTowns[b]]);
  links.push([towns.find(t=>t.name==='Tannenheim'),newTowns[8]]);
  const regionalRoads=[];
  for(const [i,[a,b]] of links.entries()){
    const id='R'+(i+5),offset=160+(i%3)*24,ay=a.expanded?a.y+offset:320,by=b.y+offset,ax=a.x+300,bx=b.x+300;
    const segmentClear=(x1,y1,x2,y2)=>!towns.some(t=>Math.max(x1,x2)>t.x-190&&Math.min(x1,x2)<t.x+190&&Math.max(y1,y2)>t.y-180&&Math.min(y1,y2)<t.y+125);
    const candidates=[(ay+by)/2,Math.min(ay,by)-360,Math.max(ay,by)+360,...Array.from({length:30},(_,n)=>Math.min(ay,by)-500-n*160)];
    const cy=candidates.find(y=>segmentClear(ax,ay,ax,y)&&segmentClear(ax,y,bx,y)&&segmentClear(bx,y,bx,by));
    if(cy===undefined)throw Error('Kein Bahnkorridor fuer '+id);
    const route=[{x:a.x-100,y:ay},{x:a.x,y:ay,name:a.name,terminal:true},{x:ax,y:ay},{x:ax,y:cy},{x:bx,y:cy},{x:bx,y:by},{x:b.x,y:by,name:b.name,terminal:true},{x:b.x-100,y:by},{x:b.x-100,y:by+18},{x:b.x,y:by+18,name:b.name},{x:bx+18,y:by+18},{x:bx+18,y:cy+18},{x:ax+18,y:cy+18},{x:ax+18,y:ay+18},{x:a.x,y:ay+18,name:a.name},{x:a.x-100,y:ay+18}];
    railLines.push({id,name:a.name+' - '+b.name,color:['#4c8a9c','#a36e56','#7e8c4b','#8469a8','#b18e45'][i%5],starts:[1],route});
    const road=[{x:a.x,y:a.expanded?a.y+230:200},{x:ax+70,y:a.expanded?a.y+230:200},{x:ax+70,y:cy+90},{x:bx+70,y:cy+90},{x:bx+70,y:b.y+230},{x:b.x,y:b.y+230}];
    for(let n=1;n<road.length;n++){const p=road[n-1],q=road[n];regionalRoads.push({x:(p.x+q.x)/2,y:(p.y+q.y)/2,w:Math.abs(q.x-p.x)+8,d:Math.abs(q.y-p.y)+8});}
  }
  // Round bends into short quadratic segments; coaches follow the same track independently.
  for(const line of railLines){
    const raw=line.route,out=[];
    for(let i=0;i<raw.length;i++){
      const p=raw[i],a=raw[(i+raw.length-1)%raw.length],b=raw[(i+1)%raw.length];
      const da=Math.hypot(p.x-a.x,p.y-a.y),db=Math.hypot(b.x-p.x,b.y-p.y),r=Math.min(35,da*.3,db*.3);
      const enter={x:p.x+(a.x-p.x)*r/da,y:p.y+(a.y-p.y)*r/da},leave={x:p.x+(b.x-p.x)*r/db,y:p.y+(b.y-p.y)*r/db};
      if(p.name||Math.abs((p.x-a.x)*(b.y-p.y)-(p.y-a.y)*(b.x-p.x))<.01){out.push({...p});continue;}
      out.push(enter);for(let n=1;n<=12;n++){const t=n/12;out.push({x:(1-t)**2*enter.x+2*(1-t)*t*p.x+t*t*leave.x,y:(1-t)**2*enter.y+2*(1-t)*t*p.y+t*t*leave.y});}
    }
    line.route=out;line.starts=line.id==='R1'?[0,out.findIndex(p=>p.name==='Tannenheim'&&p.y===90)]:[Math.max(0,out.findIndex(p=>p.name))];
  }
  const railStations=railLines.flatMap(l=>l.route.flatMap((p,i)=>{
    if(!p.name)return [];const a=l.route[(i+l.route.length-1)%l.route.length],heading=Math.atan2(p.y-a.y,p.x-a.x);
    p.stopId='rail-'+l.id+'-'+i;
    return [{id:p.stopId,line:l.id,name:p.name,heading,x:p.x-Math.cos(heading)*21-Math.sin(heading)*7,y:p.y-Math.sin(heading)*21+Math.cos(heading)*7,trackX:p.x,trackY:p.y,color:l.color}];
  }));
  const railStructures=[{kind:'tunnel',x:-2800,y:-10,w:230,d:14},{kind:'tunnel',x:-2800,y:90,w:230,d:14},
    {kind:'bridge',x:-4200,y:-10,w:190,d:12},{kind:'bridge',x:-4200,y:90,w:190,d:12},
    {kind:'tunnel',x:-3000,y:1600,w:190,d:14},{kind:'bridge',x:-3000,y:1200,w:190,d:12},
    {kind:'tunnel',x:-4500,y:-450,w:220,d:14},{kind:'bridge',x:-4650,y:1660,w:160,d:12},
    {kind:'tunnel',x:-1800,y:-380,w:200,d:14},{kind:'bridge',x:-1600,y:1740,w:120,d:12}];
  const railCells=new Map(),railCellSize=256;
  for(const l of railLines)for(const [i,b] of l.route.entries()){
    const a=l.route[(i+l.route.length-1)%l.route.length],segment={a,b};
    for(let ix=Math.floor(Math.min(a.x,b.x)/railCellSize);ix<=Math.floor(Math.max(a.x,b.x)/railCellSize);ix++)for(let iy=Math.floor(Math.min(a.y,b.y)/railCellSize);iy<=Math.floor(Math.max(a.y,b.y)/railCellSize);iy++){
      const key=ix+','+iy;if(!railCells.has(key))railCells.set(key,[]);railCells.get(key).push(segment);
    }
  }
  const railReserved=(x,y,margin=9)=>{
    for(let ix=Math.floor((x-margin)/railCellSize);ix<=Math.floor((x+margin)/railCellSize);ix++)for(let iy=Math.floor((y-margin)/railCellSize);iy<=Math.floor((y+margin)/railCellSize);iy++)for(const {a,b} of railCells.get(ix+','+iy)||[]){
      const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));if((x-a.x-t*dx)**2+(y-a.y-t*dy)**2<margin*margin)return true;
    }return false;
  };
  const railWalls=railStructures.flatMap(r=>[-1,1].map(side=>({x:r.x,y:r.y+side*(r.kind==='tunnel'?r.d/2+12:r.d/2-.3),w:r.w,d:r.kind==='tunnel'?24:.6,h:r.kind==='tunnel'?12:1.2})));
  const railBlocked=(x,y)=>railWalls.some(b=>Math.abs(x-b.x)<b.w/2+.4&&Math.abs(y-b.y)<b.d/2+.4);
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
  buildings.push({x:-150,y:-34,w:16,d:10,h:6,color:'#e5cb9b',roof:'#b87657'},
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
  for(const town of towns){const n=town.city?6:4;
    for(let row=0;row<n;row++)for(let col=0;col<n;col++){
      const x=town.x+(col-(n-1)/2)*22,y=town.y-row*23;
      if(railReserved(x,y,Math.hypot(town.city?13:10,town.city?12:9)/2+10))continue;
      buildings.push({x,y,w:town.city?13:10,d:town.city?12:9,h:town.city?12+(row+col)%4*4:5+(col%2),color:palette[(row+col)%palette.length],roof:town.city?'#839594':'#b58261',city:!!town.city,town:town.name});
    }
  }
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
  roads.push({x:635,y:14,w:200,d:8});
  const busLines=[
    {id:'1',name:'Stadt - Flugplatz',color:'#e0b657',route:busRoute,starts:[0,6]},
    {id:'2',name:'Obstgarten - Hafen',color:'#77a7bf',starts:[0,5],route:[{x:-330,y:15.8,name:'Obstgarten'},{x:-150,y:15.8,name:'Farm'},{x:160,y:15.8,name:'Werkstatt'},{x:520,y:15.8,name:'Osthafen'},{x:535,y:15.8},{x:535,y:12.2,name:'Osthafen'},{x:160,y:12.2,name:'Werkstatt'},{x:-150,y:12.2,name:'Farm'},{x:-330,y:12.2,name:'Obstgarten'},{x:-370,y:12.2},{x:-370,y:15.8}]},
    {id:'3',name:'Perleninsel Rundfahrt',color:'#ba91bb',starts:[0],route:[{x:728.2,y:10,name:'Perlenhafen'},{x:728.2,y:66.8},{x:900,y:66.8,name:'Villenpromenade'},{x:1091.8,y:66.8},{x:1091.8,y:25,name:'Ostpromenade'},{x:1091.8,y:-1.8},{x:900,y:-1.8,name:'Villengarten'},{x:728.2,y:-1.8}]},
    {id:'4',name:'Perleninsel Flughafenbus',color:'#79aa82',starts:[0],route:[{x:728.2,y:80,name:'Perlenhafen Sued'},{x:728.2,y:101.8},{x:928.2,y:101.8},{x:928.2,y:145,name:'Perlenflugplatz'},{x:931.8,y:145},{x:931.8,y:98.2},{x:731.8,y:98.2},{x:731.8,y:80,name:'Perlenhafen Sued'},{x:731.8,y:70},{x:728.2,y:70}]},
    {id:'5',name:'Inselring',color:'#d28b65',starts:[0],route:[{x:-171.8,y:80,name:'Westwiesen'},{x:-171.8,y:166.8},{x:-90,y:166.8,name:'Hafen West'},{x:171.8,y:166.8},{x:171.8,y:80,name:'Ostwiesen'},{x:171.8,y:12.2},{x:80,y:12.2,name:'Stadteingang'},{x:-171.8,y:12.2}]},
    {id:'6',name:'Hafen - Suedstrand',color:'#649caf',starts:[0],route:[{x:-1.8,y:205,name:'Hafen Sued'},{x:-1.8,y:340,name:'Suedviertel'},{x:-1.8,y:480,name:'Suedstrand'},{x:1.8,y:480},{x:1.8,y:340,name:'Suedviertel'},{x:1.8,y:205,name:'Hafen Sued'},{x:1.8,y:195},{x:-1.8,y:195}]},
    {id:'7',name:'Perlenbruecke',color:'#cf789c',starts:[0],route:[{x:480,y:15.8,name:'Osthafen Bruecke'},{x:700,y:15.8,name:'Perlenhafen Bruecke'},{x:720,y:15.8},{x:720,y:12.2},{x:700,y:12.2,name:'Perlenhafen Bruecke'},{x:480,y:12.2,name:'Osthafen Bruecke'},{x:460,y:12.2},{x:460,y:15.8}]}
  ];
  // Shared platforms are real route waypoints, grouped by position and travel direction.
  function addStop(lineId,stop){
    const line=busLines.find(l=>l.id===lineId),route=line.route,starts=line.starts.map(i=>route[i]);
    const existing=route.find(p=>p.x===stop.x&&p.y===stop.y);
    if(existing)Object.assign(existing,stop);
    else{
      const i=route.findIndex((a,i)=>{const b=route[(i+1)%route.length],dx=b.x-a.x,dy=b.y-a.y;return Math.abs((stop.x-a.x)*dy-(stop.y-a.y)*dx)<.001&&(stop.x-a.x)*(stop.x-b.x)+(stop.y-a.y)*(stop.y-b.y)<0;});
      if(i<0)throw Error('Haltestelle liegt nicht auf Linie '+lineId);
      route.splice(i+1,0,stop);
    }
    line.starts=starts.map(p=>route.indexOf(p));
  }
  const southLine=busLines.find(l=>l.id==='6');southLine.route.splice(-2,2,{x:1.8,y:25},{x:-1.8,y:25});
  const pearlAirport=busLines.find(l=>l.id==='4');pearlAirport.route.splice(-2,2,{x:731.8,y:25},{x:728.2,y:25});
  const bridgeLine=busLines.find(l=>l.id==='7');bridgeLine.route.splice(2,2,{x:728.2,y:15.8},{x:728.2,y:55},{x:731.8,y:55},{x:731.8,y:12.2});
  delete busLines.find(l=>l.id==='2').route.find(p=>p.x===535&&p.y===12.2).name;
  for(const [ids,x,y,name] of [
    [['2','5'],-150,12.2,'Farm'],[['2','5'],80,12.2,'Stadteingang'],[['2','5'],160,12.2,'Werkstatt'],
    [['1','6'],-1.8,40,'Dorfkreuzung'],[['1','6'],1.8,40,'Dorfkreuzung'],
    [['1','6'],-1.8,150,'Hafenstrasse'],[['1','6'],1.8,150,'Hafenstrasse'],[['1','5'],80,166.8,'Hafen Ost'],
    [['2','7'],520,15.8,'Osthafen'],[['2','7'],520,12.2,'Osthafen'],
    [['3','4','7'],728.2,40,'Perlenhafen Mitte'],[['4','7'],731.8,40,'Perlenhafen Mitte']
  ])for(const id of ids)addStop(id,{x,y,name});
  const harbourLine=busLines.find(l=>l.id==='2');harbourLine.starts[1]=harbourLine.route.findIndex(p=>p.x===520&&p.y===12.2);
  // Lines crossing the east-west road visit the existing village interchange.
  for(const id of ['2','5']){
    const line=busLines.find(l=>l.id===id),starts=line.starts.map(i=>line.route[i]);
    for(let i=line.route.length-1;i>=0;i--){
      const a=line.route[i],b=line.route[(i+1)%line.route.length];
      if(a.y!==b.y||![12.2,15.8].includes(a.y)||!((a.x<-1.8&&b.x>1.8)||(a.x>1.8&&b.x<-1.8)))continue;
      line.route.splice(i+1,0,{x:-1.8,y:a.y},{x:-1.8,y:40,name:'Dorfkreuzung'},
        {x:-1.8,y:105},{x:1.8,y:105},{x:1.8,y:40,name:'Dorfkreuzung'},{x:1.8,y:a.y});
    }
    line.starts=starts.map(p=>line.route.indexOf(p));
  }
  for(const line of busLines){
    for(const p of line.route){if(p.name==='Dorf')p.y=85.5;if(['Perlenhafen Bruecke','Osthafen Bruecke','Perlenhafen'].includes(p.name))delete p.name;}
    let previous=null,distance=Infinity;
    for(let i=0;i<line.route.length;i++){const p=line.route[i],a=line.route[(i+line.route.length-1)%line.route.length];distance+=Math.hypot(p.x-a.x,p.y-a.y);if(p.name){if(previous===p.name&&distance<100&&p.name!=='Dorfkreuzung')delete p.name;else{previous=p.name;distance=0;}}}
    line.starts=line.starts.map(i=>line.route[i].name?i:line.route.findIndex(p=>p.name));
  }
  const platforms=new Map();
  for(const line of busLines)for(const [i,p] of line.route.entries()){
    if(!p.name)continue;
    const prev=line.route[(i+line.route.length-1)%line.route.length],heading=Math.atan2(p.y-prev.y,p.x-prev.x),key=p.x+':'+p.y+':'+heading.toFixed(3);
    if(!platforms.has(key))platforms.set(key,{id:'stop-'+key,line:line.id,lines:[],colors:[],color:line.color,name:p.name,heading,x:p.x-Math.sin(heading)*4,y:p.y+Math.cos(heading)*4,roadX:p.x,roadY:p.y});
    const stop=platforms.get(key);if(!stop.lines.includes(line.id)){stop.lines.push(line.id);stop.colors.push(line.color);}p.stopId=stop.id;
  }
  // Each route has explicit termini; circular routes finish a round at their origin.
  const termini={'1':['Nordstadt','Flugplatz'],'2':['Obstgarten','Osthafen'],'3':['Perlenhafen Mitte'],'4':['Perlenhafen Sued','Perlenflugplatz'],'5':['Westwiesen'],'6':['Dorfkreuzung','Suedstrand'],'7':['Osthafen','Perlenhafen Mitte']};
  for(const line of busLines)for(const name of termini[line.id]||[]){const p=line.route.find(p=>p.name===name);if(p)p.terminal=true;}
  const busStops=[...platforms.values()];


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
  const terrain=[];
  const originalMountainHeight=(x,y)=>mountain.height*Math.max(0,1-Math.max(0,Math.hypot(x-mountain.x,y-mountain.y)-4)/(mountain.radius-4));
  function heightAt(x,y){
    const original=originalMountainHeight(x,y);if(original>0)return original;
    for(const t of terrain){
      const u=(x-t.x+t.radius)/t.step,v=(y-t.y+t.radius)/t.step;
      if(u<0||v<0||u>=t.cells||v>=t.cells)continue;
      const ix=Math.floor(u),iy=Math.floor(v),a=u-ix,b=v-iy,k=iy*(t.cells+1)+ix;
      const h00=t.heights[k],h10=t.heights[k+1],h01=t.heights[k+t.cells+1],h11=t.heights[k+t.cells+2];
      return a+b<=1?h00+(h10-h00)*a+(h01-h00)*b:h11+(h01-h11)*(1-a)+(h10-h11)*(1-b);
    }
    return 0;
  }
  const inPond=(x,y,pad=0)=>((x-pond.x)/(pond.rx+pad))**2+((y-pond.y)/(pond.ry+pad))**2<1;
  const onRoad=(x,y,pad=1)=>roads.some(r=>Math.abs(x-r.x)<r.w/2+pad&&Math.abs(y-r.y)<r.d/2+pad);
  const blocked=(x,y)=>railBlocked(x,y)||bridgeBarrier(x,y)||(!inBounds(x,y)||inSea(x,y))||inPond(x,y,.45)||buildings.some(b=>Math.abs(x-b.x)<b.w/2+.45&&Math.abs(y-b.y)<b.d/2+.45);
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
  roads.push({x:-2800,y:40,w:5540,d:8},{x:-170,y:-4,w:6,d:38},{x:-85,y:14,w:180,d:6});
  for(const town of towns){
    if(!town.expanded)roads.push({x:town.x,y:(town.y+40)/2,w:8,d:Math.abs(town.y-40)+160});
    const n=town.city?6:4;for(let row=0;row<=n;row++)roads.push({x:town.x,y:town.y+12-row*23,w:n*22+20,d:6});
    for(let col=0;col<=n;col++)roads.push({x:town.x+(col-n/2)*22,y:town.y-(n-1)*23/2,w:6,d:n*23+20});
    for(let row=0;row<n;row++)for(const side of [-1,1])lamps.push({x:town.x+side*(n*11+4),y:town.y-row*23});
    booths.push({x:town.x+10,y:town.y+10,sx:town.x,sy:town.y+12,name:town.name});
  }
  // A street loop in each settlement, with an interchange on its station side.
  for(const [index,town] of [{name:'Mauz',x:-215,y:-80,main:true},...towns].entries()){
    const n=town.city?6:4,half=town.main?105:town.expanded?155:town.y<0?155:n*11+18;
    const left=town.x-half,right=town.x+half,top=town.main?-220:town.y-n*23-15,bottom=town.expanded?town.y+230:town.y<0?200:town.y+12;
    roads.push({x:(left+right)/2,y:top,w:right-left+8,d:8},{x:(left+right)/2,y:bottom,w:right-left+8,d:8},
      {x:left,y:(top+bottom)/2,w:8,d:bottom-top+8},{x:right,y:(top+bottom)/2,w:8,d:bottom-top+8});
    const id=String(index+8),name=town.main?'Mauz Hauptbahnhof':town.name;
    const route=[{x:town.x,y:bottom-1.8,name:(town.main?name:name+' Bahnhof'),terminal:true},{x:left+1.8,y:bottom-1.8},
      {x:left+1.8,y:top+1.8},{x:town.x,y:top+1.8,name:town.name+' Zentrum'},
      {x:right-1.8,y:top+1.8},{x:right-1.8,y:bottom-1.8}];
    if(town.y<0&&!town.expanded){
      delete route[0].name;delete route[0].terminal;
      route.splice(2,0,{x:left+1.8,y:-23,name:(town.main?name:name+' Bahnhof'),terminal:true});
      route.splice(-1,0,{x:right-1.8,y:102,name:(town.main?name:name+' Bahnhof')});
    }
    busLines.push({id,name:town.name+' Bahnhofslinie',color:['#638fba','#b97762','#809a52'][index%3],starts:[route.findIndex(p=>p.name),route.findIndex(p=>p.name?.endsWith("Zentrum"))],route});
  }
  roads.push(...regionalRoads);
  // Keep complete platform footprints off buildings and streets, moving the stop along its track.
  for(const station of railStations){
    const line=railLines.find(l=>l.id===station.line),i=line.route.findIndex(p=>p.stopId===station.id),p=line.route[i],a=line.route[(i+line.route.length-1)%line.route.length],b=line.route[(i+1)%line.route.length];
    const c=Math.cos(station.heading),sn=Math.sin(station.heading),w=Math.abs(c)*80+Math.abs(sn)*9,d=Math.abs(sn)*80+Math.abs(c)*9;
    for(const delta of [0,...Array.from({length:30},(_,i)=>[(i+1)*10,-(i+1)*10]).flat()]){
      const tx=p.x+c*delta,ty=p.y+sn*delta,x=tx-c*21-sn*7,y=ty-sn*21+c*7;
      if((tx-a.x)*c+(ty-a.y)*sn<65||(b.x-tx)*c+(b.y-ty)*sn<15)continue;
      if([...buildings,...roads].some(o=>Math.abs(x-o.x)<(w+o.w)/2+1&&Math.abs(y-o.y)<(d+o.d)/2+1))continue;
      Object.assign(p,{x:tx,y:ty});Object.assign(station,{x,y,trackX:tx,trackY:ty});break;
    }
    station.platform=railStations.filter(s=>s.name===station.name).indexOf(station)+1;
    station.lines=[...new Set(railStations.filter(s=>s.name===station.name).map(s=>s.line))];
  }
  // Rebuild shared bus platforms after adding the local lines.
  platforms.clear();busStops.length=0;
  for(const line of busLines)for(const [i,p] of line.route.entries()){
    if(!p.name)continue;const a=line.route[(i+line.route.length-1)%line.route.length],heading=Math.atan2(p.y-a.y,p.x-a.x),key=p.x+':'+p.y+':'+heading.toFixed(3);
    if(!platforms.has(key))platforms.set(key,{id:'stop-'+key,line:line.id,lines:[],colors:[],color:line.color,name:p.name,heading,x:p.x-Math.sin(heading)*5.2,y:p.y+Math.cos(heading)*5.2,roadX:p.x,roadY:p.y});
    const stop=platforms.get(key);if(!stop.lines.includes(line.id)){stop.lines.push(line.id);stop.colors.push(line.color);}p.stopId=stop.id;
  }
  busStops.push(...platforms.values());
  // Transverse road intersections get physical gates on both approaches.
  const crossings=[];
  for(const line of railLines)for(let i=0;i<line.route.length;i++){
    const a=line.route[i],b=line.route[(i+1)%line.route.length],dx=b.x-a.x,dy=b.y-a.y;
    for(const road of roads){const vertical=road.d>road.w;
      if(vertical?Math.abs(dx)<Math.abs(dy)*4:Math.abs(dy)<Math.abs(dx)*4)continue;
      const t=vertical?(road.x-a.x)/dx:(road.y-a.y)/dy;if(t<0||t>=1)continue;
      const x=a.x+dx*t,y=a.y+dy*t;if(Math.abs(x-road.x)>road.w/2||Math.abs(y-road.y)>road.d/2)continue;
      if(crossings.some(c=>Math.hypot(c.x-x,c.y-y)<5))continue;
      crossings.push({id:'crossing-'+crossings.length,x,y,vertical,width:vertical?road.w:road.d});
    }
  }
  // Local contracts use independent IDs and the existing interactive job rules.
  const jobSettlements=[...towns,{name:'Dorf',x:0,y:110},{name:'Perleninsel',x:900,y:0}];
  const localTypes=['garden','repair','clean','orchard','electric','trail'];
  for(const [index,town] of jobSettlements.entries())for(let slot=0;slot<2;slot++){
    const type=localTypes[(index*2+slot)%localTypes.length],base=jobs.find(j=>j.id===type),spots=[];
    for(let ring=20;ring<=180&&spots.length<5;ring+=12)for(let a=0;a<24&&spots.length<5;a++){
      const x=Math.round(town.x+Math.cos(a*Math.PI/12)*ring),y=Math.round(town.y+Math.sin(a*Math.PI/12)*ring);
      if(blocked(x,y)||onRoad(x,y,4)||railReserved(x,y,12)||heightAt(x,y)>0||inPond(x,y,4))continue;
      if(buildings.some(b=>Math.abs(x-b.x)<b.w/2+5&&Math.abs(y-b.y)<b.d/2+5)||lamps.some(l=>Math.hypot(x-l.x,y-l.y)<5)||booths.some(b=>Math.hypot(x-b.x,y-b.y)<8))continue;
      if([...spots,...jobs.flatMap(j=>[j,...j.points])].some(p=>Math.hypot(x-p.x,y-p.y)<12))continue;
      spots.push({x,y});
    }
    if(spots.length<5)throw Error('Zu wenig Arbeitsplaetze in '+town.name);
    jobs.push({...base,...spots[0],id:'local-'+index+'-'+type,type,settlement:town.name,name:base.name+' - '+town.name,points:spots.slice(1),reward:base.reward+30});
  }
  // Public workplaces are real buildings, without replacing any purchased home.
  const workplaceNames={clean:'Recyclinghof',garden:'Gaertnerei',repair:'Mauz Werkstatt',taxi:'Taxizentrale',fishing:'Anglerhaus',orchard:'Obsthof',electric:'Stadtwerke',trail:'Rangerstation'};
  for(const job of jobs){
    const id='work-'+job.id,w=12,d=10;let place=null;
    for(let radius=16;radius<=112&&!place;radius+=8)for(let i=0;i<16;i++){
      const x=Math.round(job.x+Math.cos(i*Math.PI/8)*radius),y=Math.round(job.y+Math.sin(i*Math.PI/8)*radius);
      if(railReserved(x,y,20)||heightAt(x,y)>0||roads.some(r=>Math.abs(x-r.x)<(w+r.w)/2+2&&Math.abs(y-r.y)<(d+r.d)/2+2)||buildings.some(b=>Math.abs(x-b.x)<(w+b.w)/2+4&&Math.abs(y-b.y)<(d+b.d)/2+4))continue;
      if([[-w/2,-d/2],[w/2,-d/2],[-w/2,d/2],[w/2,d/2],[0,d/2+2]].some(([dx,dy])=>inSea(x+dx,y+dy)||inPond(x+dx,y+dy,1)||railBlocked(x+dx,y+dy)))continue;
      if(jobs.some(j=>[j,...j.points].some(p=>Math.abs(x-p.x)<w/2+3&&Math.abs(y-p.y)<d/2+3)))continue;
      if(booths.some(b=>[b,{x:b.sx,y:b.sy}].some(p=>Math.abs(x-p.x)<w/2+10&&Math.abs(y-p.y)<d/2+10)))continue;
      place={x,y};break;
    }
    if(!place)throw Error('Kein freier Bauplatz fuer '+job.id);
    const building={...place,w,d,h:5.8,color:job.id==='repair'?'#b5cbd0':'#d9d7bc',roof:job.id==='garden'?'#78936b':'#aa775a',venueId:id,jobId:job.id};
    buildings.push(building);job.workplace=id;
    venues.push({id,jobId:job.id,name:workplaceNames[job.type||job.id]+(job.settlement?' '+job.settlement:''),public:true,x:place.x,y:place.y+d/2+2,building,color:building.color,floor:'#d2c9b3',message:'Auftraege und Lohn gibt es am Empfang.'});
  }
  // Deterministic terrain patches stay completely clear of established infrastructure.
  const terrainTargets=[depot,...deliveries,...jobs,...jobs.flatMap(j=>j.points),...venues,...homes,...booths,...busStops,...railStations];
  for(const region of [{x:0,y:0,r:480,gap:95,size:34},{x:900,y:0,r:205,gap:85,size:27},{x:continent.x,y:continent.y,r:6200,gap:650,size:145}]){
    for(let gx=-region.r;gx<=region.r;gx+=region.gap)for(let gy=-region.r;gy<=region.r;gy+=region.gap){
      const x=region.x+gx,y=region.y+gy,r=region.size;
      if(Math.hypot(gx,gy)>region.r-r||Math.hypot(x-mountain.x,y-mountain.y)<r+mountain.radius+12)continue;
      if(railReserved(x,y,r*1.42+20)||terrainTargets.some(p=>Math.abs(p.x-x)<r+15&&Math.abs(p.y-y)<r+15))continue;
      if([...buildings,...roads,...airfields,...docks].some(b=>Math.abs(b.x-x)<r+b.w/2+12&&Math.abs(b.y-y)<r+b.d/2+12))continue;
      if([[-r,-r],[r,-r],[-r,r],[r,r],[0,0]].some(([dx,dy])=>inSea(x+dx,y+dy)||inPond(x+dx,y+dy,10)))continue;
      const seed=Math.abs(Math.sin(x*.017+y*.031)),height=r*(.18+seed*.6),cells=12,step=2*r/cells,heights=[];
      for(let iy=0;iy<=cells;iy++)for(let ix=0;ix<=cells;ix++){
        const nx=(ix/cells*2-1),ny=(iy/cells*2-1),edge=Math.max(0,1-nx*nx-ny*ny);
        heights.push(height*edge*edge*(.65+.35*Math.sin(nx*5+seed*8)*Math.cos(ny*4)));
      }
      terrain.push({x,y,radius:r,height,cells,step,heights});
    }
  }
  // Immutable scenery-placement targets: build once, not for every grass/tree candidate.
  const reservedTargets=[depot,...deliveries,...venues,...jobs,...jobs.flatMap(j=>j.points),...homes,...booths,...booths.map(b=>({x:b.sx,y:b.sy}))];
  function nearbyPoints(items,radius){
    const cells=new Map(),size=32;
    for(const p of items){const key=Math.floor(p.x/size)+','+Math.floor(p.y/size);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(p);}
    return (x,y)=>{for(let ix=Math.floor((x-radius)/size);ix<=Math.floor((x+radius)/size);ix++)for(let iy=Math.floor((y-radius)/size);iy<=Math.floor((y+radius)/size);iy++)for(const p of cells.get(ix+','+iy)||[])if((p.x-x)**2+(p.y-y)**2<radius*radius)return true;return false;};
  }
  const nearReservedTarget=nearbyPoints(reservedTargets,6),nearReservedBuilding=nearbyPoints(buildings,14),nearReservedLamp=nearbyPoints(lamps,1.5);
  const reserved=(x,y)=>railReserved(x,y)||railStations.some(p=>Math.hypot(p.x-x,p.y-y)<45)||busStops.some(p=>Math.hypot(p.x-x,p.y-y)<7)||airfields.some(a=>Math.abs(x-a.x)<a.w/2+8&&Math.abs(y-a.y)<a.d/2+8)||inDock(x,y)||nearReservedLamp(x,y)||onRoad(x,y,2)||heightAt(x,y)>0||Math.hypot(x,y)<15||nearReservedTarget(x,y)||nearReservedBuilding(x,y);
  return {terrain,crossings,continent,towns,railLines,railStations,railStructures,railWalls,railBlocked,railReserved,bridge,onBridge,bridgeBarrier,busLines,busRoute,busStops,inSea,inBounds,inDock,border,luxury,docks,airfields,radius,buildings,roads,lamps,outfits,venues,depot,deliveries,booths,jobs,homes,pond,mountain,heightAt,inPond,onRoad,blocked,reserved};
})();

globalThis.AnimalIsland=Island;
