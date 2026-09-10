function housingLayout(home){
  const b=home.building,seed=[...home.id].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,7);
  const apartment=home.type==='apartment',villa=home.type==='villa';
  const w=home.id==='village'?24:apartment?12+(seed%4):Math.min(48,b.w*3+seed%3);
  const d=home.id==='village'?24:apartment?12+(seed%3):Math.min(44,b.d*24/7+(seed%3));
  const sx=w/24,sy=d/24,mirror=home.id==='village'?1:seed%2?-1:1;
  const colors=[['#e8dfce','#d6b391','#9bb7b1'],['#d9e4e2','#bfc7b2','#92acc4'],['#e8d8cc','#c2a27f','#b29bb8'],['#e5e2d0','#d2c5a0','#86a795']][seed%4];
  return {w,d,sx,sy,mirror,colors,style:seed%4,open:apartment&&(seed%3===0),height:villa?3.8:3.3,
    bed:{x:-8*sx*mirror,y:-8*sy},exit:{x:0,y:10*sy},spawn:{x:0,y:8.5*sy},
    transform:b=>({...b,x:b.x*sx*mirror,y:b.y*sy,w:b.w*sx,d:b.d*sy})};
}
globalThis.housingLayout=housingLayout;
