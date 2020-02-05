'use strict';

const connection = require('../db');
const common = require('../common');

exports.byOutletId = async function (outletId, callback) {
  // body...
  await new Promise(function(resolve, reject) {
    try{
      let sql = "SELECT * FROM outlet WHERE outlet_id=?";
      connection.query(sql, [outletId], function(err, rows, fields){
        if(err){
          common.log("by outlet ID "+err);
          throw err;
          return;
        }else{
          callback('', rows);
          resolve();
          return;
        }
      });
    }
    catch(error){
      common.log("error "+error);
      reject();
      callback('failed', error);
      return;
    }
  });
};
