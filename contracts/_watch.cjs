const txid="c29f29f8a305d5cd8f6c6da29f744b5b5d4bff9da3b030913c0d84f531b24f68";
(async()=>{
  for(let i=0;i<60;i++){
    try{
      const t = await (await fetch("https://api.mainnet.hiro.so/extended/v1/tx/"+txid)).json();
      if(t.tx_status && t.tx_status!=="pending"){
        console.log("FINAL status:", t.tx_status);
        if(t.smart_contract) console.log("contract:", t.smart_contract.contract_id);
        if(t.block_height) console.log("block:", t.block_height);
        process.exit(0);
      }
    }catch(e){ /* transient, keep polling */ }
    await new Promise(r=>setTimeout(r,20000));
  }
  console.log("Still pending after ~20min");
})();
