'use strict';

const connection = require('../db');
const common = require('../common');

exports.getData = function (topupId, callback) {
  // body...
  return new Promise(function(resolve, reject) {
    let sql = "SELECT * FROM topup INNER JOIN stock_ref USING(stock_ref_id) INNER JOIN rs_chip USING(rs_id) INNER JOIN sd_chip USING(sd_id) INNER JOIN site USING(site_id) WHERE topup_id=?";
    connection.query(sql, [topupId], function(err, rows, fields){
      if(err){
        common.log("error query daemon "+err);
      }else{
        if(!rows[0]){
          callback('failed', 'proses gagal - data tidak ditemukan');
          resolve();
          return;
        }else{
          callback('',rows);
          resolve();
          return;
        }
      }
    });
  });
};

exports.errorMsg = function (trxId, errMsg, callback) {
  // body...
  return new Promise(function(resolve, reject) {
    let sql = "UPDATE topup SET error_msg=?, need_reply=?, topup_status=? WHERE topup_id=?";
    connection.query(sql, [errMsg, 1, 'F', trxId], function(err, rows, fields){
      if(err){
        common.log("update error "+err);
        throw err;
        return;
      }else{
        resolve();
        callback('','');
        return;
      }
    });
  });
};

exports.reversal = function (transId, callback) {
  // body...
  return new Promise(function(resolve, reject) {
    let sql = "SELECT * FROM topup INNER JOIN member USING (member_id) LEFT JOIN rs_chip USING(rs_id) LEFT JOIN sd_stock USING(sd_id, stock_ref_id) INNER JOIN mutation ON mutation.member_id = topup.member_id AND mutation.trans_id = topup.trans_id WHERE topup.trans_id=?";
    connection.query(sql, [transId], function(err, rows, fields){
      if(err){
        common.log("reversal query "+err);
        throw err;
        return;
      }else{
        if(!rows[0]){
          resolve();
          callback('failed','reversal: valid row not found');
          return;
        }else{
          callback('', rows);
          resolve();
          return;
        }
      }
    });
  });
};

exports.updateTopup = function (transId, topupStatus, needReply, errMsg, callback) {
  // body...
  return new Promise(function(resolve, reject) {
    let sql = "UPDATE topup SET topup_status=?, need_reply=?, error_msg=? WHERE trans_id=?";
    connection.query(sql, [topupStatus, needReply, errMsg, transId], function(err, rows, fields){
      if(err){
        common.log("update topup "+err);
        throw err;
        return;
      }else{
        resolve();
        callback('','');
        return;
      }
    });
  });
};

exports.getModemRandom = function (sdID, callback) {
  // body...
  return new Promise(function(resolve, reject) {
    let sql = "SELECT * FROM sd_chip WHERE sd_id=?";
    connection.query(sql, [sdID], function(err, rows, fields){
      if(err){
        common.log("search modem by sd id "+err.message);
        throw err.message;
      }else{
        callback('', rows);
        resolve();
      }
    });
  });
};
