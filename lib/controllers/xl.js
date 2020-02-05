'use strict';

const request = require('request');
const querystring = require('querystring');

const config = require('../config.json');
const common = require('../common');

const topupControl = require('./topup');
const reversalControl = require('./reversal');

const date = require('date-and-time');

const modelDaemon = require('../models/daemon');


exports.index = function (dataTopup) {
  // body...
  try{
    let msisdn = dataTopup[0].rs_number;
    common.log("msisdn "+msisdn);
    msisdn = msisdn.replace(/^62/, 0);
    common.log("msisdn after replace "+msisdn);

    let nominal = dataTopup[0].nominal;
    common.log("nominal "+nominal);
    if(nominal){
      nominal = nominal / 1000;
      nominal = nominal+'k';
    }
    common.log("nominal after modif "+nominal);
    let ts = date.format(dataTopup[0].exec_ts, 'YYYY-MM-DD HH:mm:ss');
    common.log("ts "+ts);
    let text = 'ALLDP '+msisdn+' '+dataTopup[0].pin+' '+nominal+'#'+dataTopup[0].topup_qty;
    let url = 'sms?';
    let params = querystring.stringify({
      to: 461,
      ts: ts,
      text: text,
      modem: dataTopup[0].modem
    });
    if(!nominal){
      text = 'DOMPUL '+dataTopup[0].topup_qty+' '+msisdn+' '+dataTopup[0].pin;
      url = 'sms?';
      params = querystring.stringify({
        to: 461,
        ts: ts,
        text: text,
        modem: dataTopup[0].modem
      });
    }
    url = dataTopup[0].site_url+'/send'+url+params;
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
    common.log("error xl "+error.message);
  }
};
