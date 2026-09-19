function createOnlinePanel(send,stopMoving){
  const root=document.querySelector('#online-panel'),input=document.querySelector('#chat-input'),form=document.querySelector('#chat-form'),submit=document.querySelector('#chat-send'),log=document.querySelector('#chat-log'),list=document.querySelector('#online-players'),feedback=document.querySelector('#chat-feedback');
  let messages=[],players=[],self=null,pending=false,timer=null,connected=false;
  const element=(tag,text)=>{const node=document.createElement(tag);node.textContent=text;return node;};
  function line(m){const node=document.createElement('p');node.append(element('strong',m.name+': '),document.createTextNode(m.text));return node;}
  function renderMessages(){
    const bottom=log.scrollHeight-log.scrollTop-log.clientHeight<35;
    log.replaceChildren();
    if(!messages.length)log.append(element('p','Noch keine Nachrichten. Sag Hallo!'));
    for(const m of messages)log.append(line(m));
    if(bottom)log.scrollTop=log.scrollHeight;
  }
  function release(){pending=false;clearTimeout(timer);submit.disabled=!connected;}
  input.addEventListener('focus',stopMoving);
  root.addEventListener('keydown',e=>{if(e.target===input&&e.key==='Escape'){input.blur();e.preventDefault();e.stopPropagation();}});
  form.addEventListener('submit',e=>{
    e.preventDefault();const text=input.value.trim();if(!connected||pending||!text)return;
    if(!send(text)){feedback.textContent='Nicht verbunden. Bitte erneut online beitreten.';return;}
    pending=true;submit.disabled=true;feedback.textContent='Wird gesendet ...';
    timer=setTimeout(()=>{release();feedback.textContent='Keine Bestaetigung. Bitte den Verlauf vor erneutem Senden pruefen.';},10000);
  });
  document.querySelector('#online-toggle').onclick=()=>{const body=document.querySelector('#online-body');body.hidden=!body.hidden;const toggle=document.querySelector('#online-toggle');toggle.setAttribute('aria-expanded',String(!body.hidden));const label=body.hidden?'Chat aufklappen':'Chat einklappen';toggle.setAttribute('aria-label',label);toggle.title=label;if(body.hidden)input.blur();else log.scrollTop=log.scrollHeight;};
  return {
    show(visible){root.hidden=!visible;if(!visible)input.blur();},
    status(status,id){self=id;connected=status==='online';input.disabled=!connected;submit.disabled=!connected||pending;if(status==='offline'){messages=[];players=[];release();list.replaceChildren();renderMessages();feedback.textContent='';}else if(!connected){release();feedback.textContent='Chat ist nicht verbunden.';}},
    receive(data){
      if(data.type==='roster'){players=data.players;list.replaceChildren();for(const p of players)list.append(element('li',p.name+(p.id===self?' (du)':'')));document.querySelector('#online-count').textContent=players.length+' online';}
      if(data.type==='chat-history'){messages=data.messages.slice(-100);renderMessages();}
      if(data.type==='chat-message'){if(!messages.some(m=>m.id===data.message.id)){const bottom=log.scrollHeight-log.scrollTop-log.clientHeight<35;if(!messages.length)log.replaceChildren();messages.push(data.message);messages=messages.slice(-100);log.append(line(data.message));while(log.children.length>100)log.firstElementChild.remove();if(bottom)log.scrollTop=log.scrollHeight;}if(data.message.playerId===self){release();input.value='';feedback.textContent='Gesendet';}}
      if(data.type==='chat-error'){release();feedback.textContent=data.message;}
    }
  };
}
