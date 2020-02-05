'use strict';

const config = require('../config.json');
const common = require('../common');

const modelTopup = require('../models/topup');

exports.early_validation = function (dataTopup) {
  // body...
  try{
    if(!dataTopup[0].rs_member_id){
      return 'nomor chip RS tidak valid';
    }

    if(dataTopup[0].status != 'Active'){
      return 'nomor RS tidak aktif';
    }

    if(dataTopup[0].nominal && dataTopup[0].topup_qty > dataTopup[0].max_qty){
      return 'quantity melebihi quota';
    }
    //nothing wrong
    return null;
  }catch(error){
    common.log("error "+error.message);
    return error.message;
  }
};

exports.pricing_validation = async function (member, dataTopup, outlet, callback) {
  // body...
  try{
    //data price
    let price = 0; let nominal = 0;
    await new Promise(function(resolve, reject) {
      modelTopup.pricing(dataTopup[0].stock_ref_id, dataTopup[0].rs_type_id, dataTopup[0].ref_type_id, function(err, data){
        if(err){
          common.log("error pricing "+data);
          callback(data, '');
          resolve();
        }else{
          price = data[0];
          nominal = data[1];
          resolve();
        }
      });
    });
    common.log("price "+price);
    if(!price || dataTopup[0].ref_type_id == 9){
      callback('harga belum diset','');
      return;
    }

    let total_price = 0;
    if(dataTopup[0].nominal){
      if(!price){
        callback('harga per unit belum diset','');
        return;
      }else{
        total_price = price * dataTopup[0].topup_qty;
      }
    }else if(dataTopup[0].ref_type_id == 9){
      total_price = dataTopup[0].topup_qty;
    }else{
      if(price > 50){
        callback('angka diskon tidak valid','');
        return;
      }else{
        total_price = dataTopup[0].topup_qty * (100 - price)/100;
      }
    }

    //saldo canvassser
    if(dataTopup[0].credit == 0){
      if(dataTopup[0].payment_gateway == 0){
        if(total_price > member[0].member_balance){
          callback('saldo tidak mencukupi', '');
          return;
        }
      }
    }else{
      if(total_price > outlet[0].planfond + outlet[0].balance);
    }

    //NO ERROR SIR!!
    callback('', total_price);
    return;
  }catch(error){
    common.log("error "+error.message);
    callback(error.message, '');
    return;
  }
};
