'use strict';

const config = require('../config.json');
const common = require('../common');

const modelDaemon = require('../models/daemon');
const xlControl = require('./xl');
const indosatControl = require('./indosat');

exports.index = async function (topupId, sdRandomID) {
  // body...
  try{
    let records = [];
    await new Promise(function(resolve, reject) {
      modelDaemon.getData(topupId, function(err, data){
        if(err){
          modelDaemon.errorMsg(topupId, data, function(errC, dataC){
            if(!errC){
              return;
            }
          });
        }else{
          resolve();
          records = data;
        }
      })
    });

    let nameModemRandom = null;
    await new Promise(function(resolve, reject) {
      console.log("search modem by random ID "+sdRandomID);
      modelDaemon.getModemRandom(sdRandomID, function(err, data){
        if(err){
          modelDaemon.errorMsg(topupId, data, function(errC, dataC){
            if(!errC){
              return;
            }
          });
        }else{
          resolve();
          nameModemRandom = data[0].modem;
        }
      });
    });

    if(records[0].ref_type_id == 1){
      common.log("ref type id "+records[0].ref_type_id);
      common.log("ts "+records[0].exec_ts);
      xlControl.index(records);
    }else if(records[0].ref_type_id == 3){
      common.log("ref type id "+records[0].ref_type_id);
      indosatControl.index(records, nameModemRandom);
    }else{
      common.log("no process topup id "+topupId);
    }
  }catch(error){
    common.log("eror daemon stock "+error.message);
  }
};
