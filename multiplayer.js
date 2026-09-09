function createMultiplayer(onStatus, onClock, onWorld=()=>{}, onCrash=()=>{}, onSession=()=>{}) {
  const endpoint='wss://animal-world-online.animal-world-mauz.workers.dev/play';
  let socket=null,id=null,status='offline',timer=null,timeout=null,lastState=null,wave=false,generation=0;
  const players=new Map();let rideOwner=null;
  function report(next){status=next;onStatus(status,players.size+(id?1:0));}
  function stop(){generation++;clearInterval(timer);clearTimeout(timeout);timer=timeout=null;if(socket){socket.onclose=socket.onerror=socket.onmessage=null;socket.close();}socket=null;id=null;rideOwner=null;players.clear();report('offline');}
  function connect(){
    stop();const current=generation;report('connecting');
    return new Promise((resolve,reject)=>{
      let joined=false;
      const fail=()=>{if(current!==generation)return;clearTimeout(timeout);clearInterval(timer);id=null;players.clear();report('disconnected');if(!joined)reject(Error('Online-Verbindung fehlgeschlagen. Bitte erneut versuchen.'));};
      try{socket=new WebSocket(endpoint);}catch{fail();return;}
      timeout=setTimeout(()=>{if(!joined){socket.close();fail();}},12000);
      socket.onmessage=event=>{
        if(current!==generation||event.data==='pong')return;
        let data;try{data=JSON.parse(event.data);}catch{return;}
        if(data.type==='welcome'){
          id=data.id;players.clear();for(const p of data.players)if(p.id!==id)players.set(p.id,p);
          joined=true;clearTimeout(timeout);onClock(data.minutes);report('online');resolve();
          timer=setInterval(()=>{if(socket?.readyState===1&&lastState){socket.send(JSON.stringify({type:'state',...lastState,wave}));wave=false;}},100);
        }else if(data.type==='player'){
          if(data.player.id!==id){const old=players.get(data.player.id),p=data.player;
            if(old&&old.room===p.room&&Math.hypot(old.x-p.x,old.y-p.y)<5){p.renderX=old.renderX??old.x;p.renderY=old.renderY??old.y;}
            players.set(p.id,p);
          }report('online');}
        else if(data.type==='leave'){players.delete(data.id);report('online');}
        else if(data.type==='clock')onClock(data.minutes);
        else if(data.type==='world')onWorld(data.state);
        else if(data.type==='crash')onCrash(data.impact);
        else if(data.type==='ride'){rideOwner=data.owner||null;onSession(data);}
        else if(['sleep','wake','notice'].includes(data.type)){if(data.type==='wake')onClock(data.minutes);onSession(data);}
      };
      socket.onerror=()=>{socket.close();fail();};socket.onclose=fail;
    });
  }
  function send(data){if(socket?.readyState===1)socket.send(JSON.stringify(data));}
  return {sleep(sleeping){send({type:'sleep',sleeping});},ride(owner){send({type:'ride',owner});},get rideOwner(){return rideOwner;},crash(impact){send({type:'crash',x:impact.x,y:impact.y,heading:impact.heading,speed:impact.speed,model:impact.model.id,scenery:impact.scenery===true});},connect,stop,smooth(dt){const t=1-Math.exp(-20*dt);for(const p of players.values()){p.renderX=(p.renderX??p.x)+(p.x-(p.renderX??p.x))*t;p.renderY=(p.renderY??p.y)+(p.y-(p.renderY??p.y))*t;}},update(state){lastState=state;},wave(){wave=true;},get players(){return [...players.values()];},get status(){return status;},get id(){return id;}};
}
