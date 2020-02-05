'use strict';

const config = require('../config.json');
const common = require('../common');

const modelDaemon = require('../models/daemon');
const modelTopup = require('../models/topup');

exports.index = async function (transId) {
  // body...
  try{
    let records = [];
    await new Promise(function(resolve, reject) {
      common.log("get data reversal trans id "+transId);
      modelDaemon.reversal(transId, function(err, data){
        if(err){
          common.log(data);
          return;
        }else{
          resolve();
          records = data;
        }
      });
    });

    let revTransId = 0;
    await new Promise(function(resolve, reject) {
      common.log("create table transaction reversal trans ref "+transId);
      modelTopup.trx('rev', transId, function(err, data){
        if(!err){
          resolve();
          revTransId = data;
        }
      });
    });

    await new Promise(function(resolve, reject) {
      common.log("create mutation from new trans id "+revTransId);
      modelTopup.mutation(revTransId, -records[0].amount, records, function(err, data){
        if(!err){
          resolve();
        }
      })
    });

    await new Promise(function(resolve, reject) {
      modelDaemon.updateTopup(transId, 'R', 1, 'auto reversal', function(err, data){
        if(!err){
          common.log("trans id "+transId+" has reversal");
          return;
        }
      });
    });
  }catch(error){
    common.log("error "+error.message);
  }
};
