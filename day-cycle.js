function createDayCycle(storage){
  const key='animal-world-clock-v1';
  let minutes=9*60,dirtySeconds=0;
  try { const saved=JSON.parse(storage.getItem(key));if(Number.isFinite(saved?.minutes)&&saved.minutes>=0)minutes=saved.minutes; } catch {}
  const hour=()=>minutes%1440/60;
  const save=()=>{try{storage.setItem(key,JSON.stringify({minutes}));}catch{}};
  return {
    tick(dt){if(!Number.isFinite(dt)||dt<=0)return;minutes+=dt*1.2;dirtySeconds+=dt;if(dirtySeconds>=15){save();dirtySeconds=0;}},
    save,
    sleep(){if(!(hour()>=20||hour()<6))return false;minutes=(Math.floor(minutes/1440)+(hour()>=20?1:0))*1440+7*60;save();return true;},
    set(value){if(Number.isFinite(value)&&value>=0)minutes=value;},
    get minutes(){return minutes;},
    get day(){return Math.floor(minutes/1440)+1;},
    get night(){return hour()>=20||hour()<6;},
    get darkness(){const h=hour();if(h>=8&&h<=18)return 0;if(h>18&&h<21)return (h-18)/3;if(h>=5&&h<8)return (8-h)/3;return 1;},
    get label(){const m=Math.floor(minutes%1440);return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}
  };
}
