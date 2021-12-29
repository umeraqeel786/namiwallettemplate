import { computeStyles } from '@popperjs/core';
import axios from 'axios';

const data = [
    {
        "unit": "3618f4a2da86282e2733827fe3a016f5f81cdd41fc30b8fcedb96bbf.RFasimNFT",
        "quantity": "1"
    },
    {
        "unit": "6755d6b7c1482a0f4e0dd43b064595fd3193e806dc54454f7e7a12bb.johntnet",
        "quantity": "1"
    },
    {
        "unit": "6755d6b7c1482a0f4e0dd43b064595fd3193e806dc54454f7e7a12bb.hassankhan",
        "quantity": "1"
    },
    {
        "unit": "6755d6b7c1482a0f4e0dd43b064595fd3193e806dc54454f7e7a12bb.johntnetsvasdvasaxcxccv",
        "quantity": "1"
    },
    {
        "unit": "6851f49daf392da04263bf0a7bd7a9e78d32609ebe2351660632cbda.Pronft",
        "quantity": "1"
    },
    {
        "unit": "884724e9db5bf0a7461e273b4ab5ce3d6f85630143fce696aa7259c8.PIADA4",
        "quantity": "1"
    },
    {
        "unit": "884724e9db5bf0a7461e273b4ab5ce3d6f85630143fce696aa7259c8.PIADA13",
        "quantity": "1"
    },
    {
        "unit": "9a9001bdadf5b1caf25dc34e79e55e3f2ca74c1b0cb3735dd4af0566.2fdygfgfy",
        "quantity": "1"
    },
    {
        "unit": "9d98ea3382be2125b1cda65b3462add72efb52aab8f29dffc0905941.RFtestingnft3",
        "quantity": "1"
    },
    {
        "unit": "af6cb1514ab46ffad6adde2606c4fd4442d2afeb4206fc2f42c9a291.islamicart",
        "quantity": "1"
    },
    {
        "unit": "af6cb1514ab46ffad6adde2606c4fd4442d2afeb4206fc2f42c9a291.islamicart2",
        "quantity": "1"
    },
    {
        "unit": "af6cb1514ab46ffad6adde2606c4fd4442d2afeb4206fc2f42c9a291.islamicart4",
        "quantity": "1"
    },
    {
        "unit": "af6cb1514ab46ffad6adde2606c4fd4442d2afeb4206fc2f42c9a291.johntnetsvasdvasa",
        "quantity": "1"
    },
    {
        "unit": "e943af1d6284eef0de1e6c5fb45cdcef87b8c8bf8165d102cac55676.johnhassan",
        "quantity": "1"
    }
]

for (let i = 0; i < data.length; i++) { 
const value  = data[i].unit;
var a = value.split(".")
 const base = a[0];
 const toConvet = a[1];
 const toHexx = toHex(toConvet)  
 const id = base+toHexx;
 console.log("id",id)
 const val = await sendrequest(id)
 
}

function toHex(str,hex) {
    try{
      hex = unescape(encodeURIComponent(str))
      .split('').map(function(v){
        return v.charCodeAt(0).toString(16)
      }).join('')
    }
    catch(e){
      hex = str
      console.log('invalid text input: ' + str)
    }
    return hex
  }
  
async function sendrequest (id) {
  var config = {
    method: 'get',
    url: `https://cardano-testnet.blockfrost.io/api/v0/assets/${id}`,
    headers: { 
      'project_id': 'testnetF1MdXqYX2gt8QVYCyHGcgQQMr9LJZJuD'
    }
  };
  
  axios(config)
  .then(function (response) {
      console.log(response.data.onchain_metadata.image)
  //  console.log(JSON.stringify(response.data));
  })
  .catch(function (error) {
    console.log(error);
  });
}
  
