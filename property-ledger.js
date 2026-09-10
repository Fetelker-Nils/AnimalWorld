// The transaction is the sole authority for online property ownership.
async function purchaseProperty(storage,homes,owner,request){
  const home=homes.find(h=>h.id===request.id);
  if(!home||typeof request.request!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(request.request)||request.amount!==home.price)return {ok:false,request:request.request,reason:'Ungueltiger Kauf.'};
  return storage.transaction(async tx=>{
    const receiptKey='receipt:'+owner+':'+request.request,receipt=await tx.get(receiptKey);if(receipt)return receipt;
    const key='property:'+home.id,previous=await tx.get(key);
    const result={request:request.request,id:home.id,ok:!previous,reason:previous?'Diese Immobilie wurde bereits verkauft.':'Gekauft! Dein Online-Eigentum ist gespeichert.'};
    if(!previous)await tx.put(key,{owner,id:home.id});
    await tx.put(receiptKey,result);return result;
  });
}
globalThis.purchaseProperty=purchaseProperty;
