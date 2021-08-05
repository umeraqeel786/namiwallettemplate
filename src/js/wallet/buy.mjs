import CoinSelection from './coinSelection.mjs';
window.$ = window.jQuery = import("jquery");
const S = await import('@emurgo/cardano-serialization-lib-browser/cardano_serialization_lib.js')
const _Buffer = (await import('buffer/')).Buffer

async function activateCardano(){
    console.log('connecting');
    const promise = await cardano.enable()
    $("#connectBtn").text('Connected');
    $("#connectBtn").attr('class', 'btn btn-success');
}
activateCardano();

async function getProtocolParameters() {
    // use blockfrost api to get this data
    // blockfrostRequest will be undefined in this example
    // const latest_block = await blockfrostRequest('/blocks/latest')
    const latest_block = await fetch('https://cardano-testnet.blockfrost.io/api/v0/blocks/latest', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'project_id': '69asIMHk1xxKZ6vVvCLfW7Lf6z0P99rT'
        },
        method: 'GET'
    }).then((response) => response.json());
    var slotnumber = latest_block.slot;
    //console.log(slotnumber);
    
    const p = await fetch(`https://cardano-testnet.blockfrost.io/api/v0/epochs/latest/parameters`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'project_id': '69asIMHk1xxKZ6vVvCLfW7Lf6z0P99rT'
        },
        method: 'GET'
    }).then((response) => response.json());
    if (p.status >= 400 && p.status < 600) {
        throw new Error("Bad response from server");
    }

    var value = {
        linearFee: S.LinearFee.new(
        S.BigNum.from_str(p.min_fee_a.toString()),
        S.BigNum.from_str(p.min_fee_b.toString())
        ),
        minUtxo: S.BigNum.from_str(p.min_utxo),
        poolDeposit: S.BigNum.from_str(p.pool_deposit),
        keyDeposit: S.BigNum.from_str(p.key_deposit),
        maxTxSize: p.max_tx_size,
        slot: slotnumber,
    };
    //console.log(value);
    return value;
};

async function triggerPay() {
    var user= await cardano.getUsedAddresses();
    var address="addr_test1qpkfyc0ml2uamzqms20jg3kwnvy23paffasjzv92fv79hlgc7yyk9n77fqxdvfr5hs5526lf20g38m9n60wa2d6wzl4qlxfzee"
    var offer = 0 // parseInt($("#cardano-offer").value);
    offer = document.getElementById("cardano-offer").value
    // WORKS
    return await pay(address, offer);
}

async function pay(addr, adaAmount){
    const cardano = window.cardano
    const protocolParameters = await getProtocolParameters()
    const lovelace = (parseFloat(adaAmount) * 1000000).toString()
    
    const paymentAddr = S.Address.from_bytes(_Buffer.from(await cardano.getChangeAddress(), 'hex')).to_bech32()
    const rawUtxo = await cardano.getUtxos()
    const utxos = rawUtxo.map(u => S.TransactionUnspentOutput.from_bytes(_Buffer.from(u, 'hex')))
    const outputs = S.TransactionOutputs.new()

    outputs.add(
        S.TransactionOutput.new(
            S.Address.from_bech32(addr),
            S.Value.new(
                S.BigNum.from_str(lovelace)
            )
        )
    )

    const MULTIASSET_SIZE = 5848;
    const VALUE_SIZE = 5860;
    const totalAssets = 0

    CoinSelection.setProtocolParameters(
        protocolParameters.minUtxo.to_str(),
        protocolParameters.linearFee.coefficient().to_str(),
        protocolParameters.linearFee.constant().to_str(),
        protocolParameters.maxTxSize.toString()
      );
      
    const selection = await CoinSelection.randomImprove(
      utxos,
      outputs,
      20 + totalAssets,
      protocolParameters.minUtxo.to_str()
    );

    const inputs = selection.input;
    const txBuilder = S.TransactionBuilder.new(
      protocolParameters.linearFee,
      protocolParameters.minUtxo,
      protocolParameters.poolDeposit,
      protocolParameters.keyDeposit
    );

    for (let i = 0; i < inputs.length; i++) {
        const utxo = inputs[i];
        txBuilder.add_input(
          utxo.output().address(),
          utxo.input(),
          utxo.output().amount()
        );
      }
    // var m = S.GeneralTransactionMetadata.new()
    // m.insert(S.BigNum.from_str('0'),S.encode_json_str_to_metadatum(JSON.stringify(JSONmetaData),0))
    // var metaData = S.TransactionMetadata.new(m)
    // txBuilder.set_metadata(metaData)
    txBuilder.add_output(outputs.get(0));

    const change = selection.change;
    const changeMultiAssets = change.multiasset();

    // check if change value is too big for single output
    if (changeMultiAssets && change.to_bytes().length * 2 > VALUE_SIZE) {
        const partialChange = S.Value.new(
          S.BigNum.from_str('0')
        );
    
        const partialMultiAssets = S.MultiAsset.new();
        const policies = changeMultiAssets.keys();
        const makeSplit = () => {
          for (let j = 0; j < changeMultiAssets.len(); j++) {
            const policy = policies.get(j);
            const policyAssets = changeMultiAssets.get(policy);
            const assetNames = policyAssets.keys();
            const assets = S.Assets.new();
            for (let k = 0; k < assetNames.len(); k++) {
              const policyAsset = assetNames.get(k);
              const quantity = policyAssets.get(policyAsset);
              assets.insert(policyAsset, quantity);
              //check size
              const checkMultiAssets = S.MultiAsset.from_bytes(
                partialMultiAssets.to_bytes()
              );
              checkMultiAssets.insert(policy, assets);
              if (checkMultiAssets.to_bytes().length * 2 >= MULTIASSET_SIZE) {
                partialMultiAssets.insert(policy, assets);
                return;
              }
            }
            partialMultiAssets.insert(policy, assets);
          }
        };
        makeSplit();
        partialChange.set_multiasset(partialMultiAssets);
        const minAda = S.min_ada_required(
          partialChange,
          protocolParameters.minUtxo
        );
        partialChange.set_coin(minAda);
    
        txBuilder.add_output(
          S.TransactionOutput.new(
            S.Address.from_bech32(paymentAddr),
            partialChange
          )
        );
    }

    txBuilder.add_change_if_needed(
        S.Address.from_bech32(paymentAddr)
      );
      
    const transaction = S.Transaction.new(
        txBuilder.build(),
        S.TransactionWitnessSet.new(),
        //metaData
    );

    const size = transaction.to_bytes().length * 2;
    if (size > protocolParameters.maxTxSize) throw ERROR.txTooBig;
  
    const witneses = await cardano.signTx(_Buffer.from(transaction.to_bytes(),'hex').toString('hex'))
    const signedTx = S.Transaction.new(transaction.body(), S.TransactionWitnessSet.from_bytes(_Buffer.from(witneses,"hex"))) // ,transaction.metadata()
    const txhash = await cardano.submitTx(_Buffer.from(signedTx.to_bytes(),'hex').toString('hex'))

    return txhash
}

$("#paybtn").on('click', async () => {
    try {
      let txHash = await triggerPay();
      console.log(txHash)
      alert(txHash)
    } catch (error) {
      console.log(error)
    }
});
console.log('this is buy.js');