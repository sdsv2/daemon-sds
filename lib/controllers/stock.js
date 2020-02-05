'use strict';

const config = require('../config.json');
const common = require('../common');

const modelTopup = require('../models/topup');

exports.dataStock = function (sdID, stockRefId, callback) {
  // body...
  return new Promise(function(resolve, reject) {
    modelTopup.dataStock(sdID, stockRefId, function(err, data){
      if(err){
        if(data == 'data stock tidak ada'){
          modelTopup.createDataStock(sdID, stockRefId, function(errC, dataC){
            if(!errC){
              common.log("after create sucess");
              callback('failed', data);
              resolve();
              return;
            }
          })
        }
      }else{
        callback('', data);
        resolve();
        return;
      }
    });
  });
};
