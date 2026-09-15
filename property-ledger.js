// The transaction is the sole authority for online property ownership.
async function purchaseProperty(storage,homes,owner,request){
  const home=homes.find(h=>h.id===request.id),action=request.action||'buy';
  if(!['buy','sell','claim','release'].includes(action)||!home||typeof request.request!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(request.request)||request.amount!==home.price)return {ok:false,request:request.request,reason:'Ungueltiger Kauf.'};
  return storage.transaction(async tx=>{
    const receiptKey='receipt:'+owner+':'+request.request,receipt=await tx.get(receiptKey);if(receipt)return receipt;
    const key='property:'+home.id,previous=await tx.get(key);
    const selling=action==='sell'||action==='release';
    const ok=selling?previous?.owner===owner:!previous||action==='claim'&&previous.owner===owner;
    const result={request:request.request,id:home.id,ok,action,reason:ok?(selling?'Verkauft!':'Dein Eigentum ist gespeichert.'):selling?'Diese Immobilie gehoert dir nicht.':'Diese Immobilie ist bereits vergeben. Der Kaufpreis wird erstattet.'};
    if(ok){if(selling)await tx.delete(key);else await tx.put(key,{owner,id:home.id});}
    await tx.put(receiptKey,result);return result;
  });
}
globalThis.purchaseProperty=purchaseProperty;
