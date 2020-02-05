'use strict';

const connection = require('../db');
const common = require('../common');

exports.dataTopup = function (trxId, callback) {
  // body...
  return new Promise(function(resolve, reject) {
    let sql ="SELECT *,topup.member_id AS topup_member_id, rs_chip.member_id AS rs_member_id, DATE(topup_ts) AS inv_date FROM topup LEFT JOIN rs_chip ON rs_chip.rs_id = topup.rs_id INNER JOIN stock_ref ON stock_ref.stock_ref_id = topup.stock_ref_id INNER JOIN stock_ref_type ON stock_ref_type.ref_type_id = stock_ref.ref_type_id WHERE topup_id=? AND topup_status=''"
    connection.query(sql, [trxId], function(err, rows, fields){
      if(err){
        common.log("query saldo "+err);
        throw err;
        return;
      }else{
        if(!rows[0]){
          callback('failed', 'data tidak ada');
          return;
        }else{
          resolve();
          callback('', rows);
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
    connection.query(sql, [errMsg, 1, 'D', trxId], function(err, rows, fields){
      if(err){
        common.log("update error "+err);
        return;
      }else{
        resolve();
        callback('','');
      }
    });
  });
};

exports.pricing = async function (stock_ref_id, rs_type_id, ref_type_id, callback) {
  // body...
  await new Promise(function(resolve, reject) {
    let sql = "SELECT * FROM pricing INNER JOIN stock_ref ON stock_ref.stock_ref_id = pricing.stock_ref_id WHERE pricing.stock_ref_id=? AND stock_ref.ref_type_id=? AND rs_type_id=?";
    connection.query(sql, [stock_ref_id, ref_type_id, rs_type_id], function(err, rows, fields){
      if(err){
        common.log("pricing "+err);
        throw err;
        return;
      }else{
        if(!rows[0]){
          resolve();
          callback('failed','harga tidak tersedia');
          return;
        }else{
          resolve();
          let listData = [rows[0].price, rows[0].nominal];
          callback('', listData);
          return;
        }
      }
    });
  });
}

exports.dataStock = function (sdID, stockRefId, callback) {
  // body...
  return new Promise(function(resolve, reject) {
    common.log("sdID "+sdID);
    common.log("stockRefID "+stockRefId);
    let sql ="SELECT sd_stock_id, qty, IF(last_topup < DATE_SUB(NOW(), INTERVAL 10 SECOND), NOW(), DATE_ADD(last_topup, INTERVAL 10 SECOND)) AS new_ts FROM sd_stock INNER JOIN sd_chip USING(sd_id) WHERE sd_id=? AND stock_ref_id=?";
    connection.query(sql, [sdID, stockRefId], function(err, rows, fields){
      if(err){
        common.log("data stock "+err);
        throw err;
        return;
      }else{
        if(!rows[0]){
          callback('failed', 'data stock tidak ada');
          resolve();
          return;
        }else{
          common.log("find data stock");
          resolve();
          callback('',rows);
          return;
        }
      }
    });
  });
}

exports.createDataStock = function (sdID, stockRefId, callback) {
  // body...
  return new Promise(function(resolve, reject) {
    let sql = "INSERT INTO sd_stock (sd_id, stock_ref_id, admin_id) VALUE(?,?,?)";
    connection.query(sql, [sdID, stockRefId, 1], function(err, rows, fields){
      if(err){
        common.log("create sd stock "+err);
        throw err;
        return;
      }else{
        common.log("create sd stock success");
        callback('','success');
        resolve();
        return;
      }
    });
  });
};

exports.trx = function (transType, transRef, callback) {
  // body...
  return new Promise(function(resolve, reject) {
    let sql = "INSERT INTO transaction (trans_type, trans_ref, trans_date, trans_time) VALUE(?, ?, CURDATE(), CURTIME())";
    connection.query(sql, [transType, transRef], function(err, rows, fields){
      if(err){
        common.log("insert transaction "+err);
        throw err;
        return;
      }else{
        resolve();
        callback('',rows.insertId);
        return;
      }
    });
  });
};

exports.mutation = function (transId, amount, member, callback) {
  // body...
  let memberId = member[0].member_id;
  let old_balance = member[0].member_balance;
  let new_balance = old_balance + amount;

  return new Promise(function(resolve, reject) {
    let sql = "UPDATE member SET member_balance=? WHERE member_id=?";
    connection.query(sql, [new_balance, memberId], function(err, rows, fields){
      if(err){
        common.log("update member "+err);
        throw err;
        return;
      }
    });

    sql = "INSERT INTO mutation (trans_id, member_id, amount, balance) value(?, ?, ?, ?)";
    connection.query(sql, [transId, memberId, amount, new_balance], function(err, rows, fields){
      if(err){
        common.log("insert mutation "+err);
        throw err;
        return;
      }else{
        resolve();
        callback('','mutation has insert');
        return;
      }
    });
  });
};


exports.outlet_mutation = function (transId, amount, outlet, callback) {
  // body...
  let outletId = outlet[0].outlet_id;
  let old_balance = outlet[0].balance;
  let new_balance = old_balance + amount;

  return new Promise(function(resolve, reject) {
    let sql = "UPDATE outlet SET balance=? WHERE outlet=?";
    connection.query(sql, [new_balance, outletId], function(err, rows, fields){
      if(err){
        common.log("update outlet "+err);
        throw err;
        return;
      }
    });

    sql = "INSERT INTO outlet_mutation (trans_id, outlet_id, mutation, balance) value(?, ?, ?, ?)";
    connection.query(sql, [transId, outletId, amount, new_balance], function(err, rows, fields){
      if(err){
        common.log("insert outlet mutation "+err);
        throw err;
        return;
      }else{
        resolve();
        callback('','outlet mutation has insert');
        return;
      }
    });
  });
};

exports.updateSD = function (exec_ts, sdID, callback) {
  // body...
  return new Promise(function(resolve, reject) {
    let sql = "UPDATE sd_chip SET last_topup=? WHERE sd_id=?";
    connection.query(sql, [exec_ts, sdID], function(err, rows, fields){
      if(err){
        common.log("update sd chip "+err);
        throw err;
        return;
      }else{
        resolve();
        callback('','update success');
        return;
      }
    });
  });
};

exports.updateTopup = function (transId, topupStatus, exec_ts, topupId, callback) {
  // body...
  return new Promise(function(resolve, reject) {
    let sql = "UPDATE topup SET topup_status=?, trans_id=?, exec_ts=? WHERE topup_id =?";
    connection.query(sql, [topupStatus, transId, exec_ts, topupId], function(err, rows, fields){
      if(err){
        common.log("update topup end "+err);
        throw err;
        return;
      }else{
        resolve();
        callback('', 'update success');
        return;
      }
    })
  });
};

exports.randomSD = function (refTypeID, callback) {
  // body...
  return new Promise(function(resolve, reject) {
    let sql = "SELECT * FROM sd_chip WHERE ref_type_id=? ORDER BY last_topup ASC LIMIT 1";
    connection.query(sql, [refTypeID], function(err, rows, data){
      if(err){
        common.log("query random sd  "+err.message);
        throw err.message;
      }else{
        callback('', rows);
        resolve();
      }
    });
  });
};

exports.insertExecStock = function (topupID, sdID, callback) {
  // body...
  return new Promise(function(resolve, reject) {
    let sql = "INSERT INTO exec_stock VALUE(?, ?)";
    connection.query(sql, [topupID, sdID], function(err, rows, fields){
      if(err){
        common.log("insert exec_stock "+err);
        throw err;
        return;
      }else{
        resolve();
        callback('', 'insert success');
        return;
      }
    })
  });
};
