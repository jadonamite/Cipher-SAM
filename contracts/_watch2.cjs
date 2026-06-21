const txid="c29f29f8a305d5cd8f6c6da29f744b5b5d4bff9da3b030913c0d84f531b24f68";
async function get(u){ for(let i=0;i<6;i++){ try{ return await (await fetch(u)).json(); }catch(e){ await new Promise(r=>setTimeout(r,2000)); } } return null; }
(async()=>{
  for(let i=0;i<90;i++){
    const t = await get("https://api.mainnet.hiro.so/extended/v1/tx/"+txid);
    if(t && t.tx_status && t.tx_status!=="pending"){
      console.log("FINAL:", t.tx_status, "| contract:", t.smart_contract && t.smart_contract.contract_id, "| block:", t.block_height);
      process.exit(0);
    }
    await new Promise(r=>setTimeout(r,20000));
  }
  console.log("still pending after ~30min");
})();
