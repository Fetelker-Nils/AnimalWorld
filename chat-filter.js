// Server-side moderation. Only filtered text is persisted or broadcast.
function cleanChat(value,limit=240){
  if(typeof value!=='string')return '';
  const text=value.normalize('NFKC').replace(/[\p{Cc}\p{Cf}]/gu,'').replace(/\s+/g,' ').trim().slice(0,limit);
  const substitutions={'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','@':'a','$':'s','\u00df':'ss'};
  let normalized='',positions=[];
  for(let i=0;i<text.length;i++){
    const c=text[i].toLowerCase().normalize('NFKD').replace(/\p{M}/gu,'');
    for(const letter of substitutions[c]||c){normalized+=letter;positions.push(i);}
  }
  const words=['scheisse','scheiss','scheisser','arsch','arschloch','arschloecher','wichser','wixer','hurensohn','hurentochter','hure','fotze','fick','ficken','ficker','gefickt','verfickt','fuck','fucking','fucker','motherfucker','shit','bullshit','bitch','bastard','cunt','nigger','nigga','faggot','schwuchtel','idiot','idioten','asshole','assholes'];
  const hidden=new Set();
  for(const word of words){
    const pattern=new RegExp('(^|[^a-z0-9])('+[...word].map(c=>c+'+').join('[^a-z0-9]*')+')(?![a-z0-9])','g');
    for(const match of normalized.matchAll(pattern)){
      const start=match.index+match[1].length,end=start+match[2].length-1;
      for(let i=positions[start];i<=positions[end];i++)hidden.add(i);
    }
  }
  return text.split('').map((c,i)=>hidden.has(i)?'*':c).join('');
}
globalThis.cleanChat=cleanChat;
