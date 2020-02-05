'use strict';

const connection = require('../db');
const common = require('../common');


exports.byMemberId = async function (memberId, callback) {
  // body...
  await new Promise(function(resolve, reject) {
    try{
      let sql = "SELECT * FROM member WHERE member_id=?";
      connection.query(sql, [memberId], function(err, rows, fields){
        if(err){
          common.log("by Member ID "+err);
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
