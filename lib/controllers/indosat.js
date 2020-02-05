'use strict';

const request = require('request');
const querystring = require('querystring');

const config = require('../config.json');
const common = require('../common');

const reversalControl = require('./reversal');

const date = require('date-and-time');

const modelDaemon = require('../models/daemon');

exports.index = function (dataTopup, nameModemRandom) {
  // body...
  let ts = date.format(dataTopup[0].exec_ts, 'YYYY-MM-DD HH:mm:ss');
  try{
    let msisdn = dataTopup[0].rs_number;
    common.log("msisdn "+msisdn);
    msisdn = msisdn.replace(/^62/, 0);
    common.log("msisdn after replace "+msisdn);

    let nominal = dataTopup[0].nominal;
    common.log("ts "+ts);
    let text = querystring.stringify({
      op: 2,
      type: 'R',
      msisdn: msisdn,
      value: nominal,
      pin: dataTopup[0].pin,
      qty: dataTopup[0].topup_qty,
      ts: ts,
      modem: nameModemRandom
    });
    let url = 'sev?'+text;

    if(!nominal){
      text = '*171*6*3*3*1*'+dataTopup[0].rs_outlet_id+'*'+dataTopup[0].topup_qty+'*'+dataTopup[0].pin+'#';
      let cmd = querystring.stringify({
        cmd: text,
        ts: ts,
        modem: nameModemRandom
      });
      url = 'ussd?'+cmd;
    }
    url = dataTopup[0].site_url+'/send'+url;
    common.log(url);
    if(dataTopup[0].site_url){
      request(url, function(error, response, body){
        if(error){
          common.log("error "+error);
          common.log('error message '+error.message);
          common.log("body "+body);
          common.log("response "+response);
          reversalControl.index(dataTopup[0].trans_id);
        }else{
          modelDaemon.updateTopup(dataTopup[0].trans_id, 'P', 0, null, function(err, data){
            if(!err){
              common.log("succes hit modem for topup id "+dataTopup[0].topup_id+" trans id "+dataTopup[0].trans_id);
            }
          });
        }
      });
    }
  }catch(error){
    common.log("error indosat "+error.message);
  }
};
