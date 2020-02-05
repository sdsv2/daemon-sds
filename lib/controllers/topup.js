'use strict';

const config = require('../config.json');
const common = require('../common');

const modelTopup = require('../models/topup');
const modelMember = require('../models/member');
const modelOutlet = require('../models/outlet');
const validationControl = require('./validation');
const stockControl = require('./stock');
const daemonControl = require('./stockDaemon');

exports.index = async function (req, res, next) {
  // body...
  let records = [];
  try{
    await new Promise(function(resolve, reject) {
      modelTopup.dataTopup(req.params.trxId, function(err, data){
        if(err){
          res.json({status: 'failed', message: data});
          return;
        }else{
          resolve();
          records = data;
        }
      });
    });
    if(records.length > 0){
      //data member
      common.log("records "+JSON.stringify(records));
      let member = [];
      await new Promise(function(resolve, reject) {
        modelMember.byMemberId(records[0].topup_member_id, function(err, data){
          if(!err){
            resolve();
            member = data;
          }
        });
      });
      //data outlet
      let outlet = [];
      await new Promise(function(resolve, reject) {
        modelOutlet.byOutletId(records[0].outlet_id, function(err, data){
          if(!err){
            resolve();
            outlet = data;
          }
        })
      });

      let error = validationControl.early_validation(records);
      if(error){
        await new Promise(function(resolve, reject) {
          modelTopup.errorMsg(req.params.trxId, error, function(err, data){
            if(!err){
              res.json({status:'failed', message: error});
              return;
            }
          });
        });
      }

      //totalPrice
      let totalPrice = 0;
      await new Promise(function(resolve, reject) {
        common.log("pricing validation");
        validationControl.pricing_validation(member, records, outlet, function(error, data){
          if(error){
              modelTopup.errorMsg(req.params.trxId, error, function(err, data){
                if(!err){
                  res.json({status:'failed', message: error});
                  return;
                }
              });
          }else{
            resolve();
            totalPrice = data;
          }
        });
      });

      //stock sd
      //menambahkan kondisi untuk nilai stock virtual H2H
      let stockRefId = null;
      let topupQty = null;
      if(records[0].mapping){
        stockRefId = records[0].mapping;
        topupQty = records[0].topup_qty * records[0].nominal;
      }else{
        stockRefId = records[0].stock_ref_id;
        topupQty = records[0].topup_qty;
      }

      //ganti sd id berdasarkan topup.pl mr.bowo
      console.log('sd id induk '+records[0].sd_id);
      if(config.randomSD.isat_stock_free && records[0].ref_type_id == config.randomSD.isat_ref_type_id){
        await new Promise(function(resolve, reject) {
          modelTopup.randomSD(records[0].ref_type_id, function(err, data){
            if(error){
              modelTopup.errorMsg(req.params.trxId, error, function(err, data){
                if(!err){
                  res.json({status:'failed', message: error});
                  return;
                }
              });
            }else{
              resolve();
              records[0].sd_id = data[0].sd_id;
            }
          });
        });
      }
      console.log('sd id free '+records[0].sd_id);

      let dataStock = [];
      await new Promise(function(resolve, reject) {
        common.log("read data stock");
        stockControl.dataStock(records[0].sd_id, stockRefId, function(err, data){
          if(err){
            common.log(data);
            resolve();
          }else{
            common.log("after read succes");
            dataStock = data;
            resolve();
          }
        });
      });

      if(dataStock.length < 1){
        await new Promise(function(resolve, reject) {
          common.log("read data stock second");
          stockControl.dataStock(records[0].sd_id, stockRefId, function(err, data){
            if(err){
              common.log("data stock second failed");
              resolve();
            }else{
              dataStock = data;
              resolve();
            }
          })
        });
      }

      //THE REAL TRANSACTION BEGINS
      let outletId = outlet[0].outlet_id;
      let invDate = records[0].inv_date;
      let period = outlet[0].period;
      let invStatus = 'Unpaid';
      let payTrxId = null;
      let loan = 1;
      let noteBank = null;

      let transId = 0;
      await new Promise(function(resolve, reject) {
        common.log("create transactions");
        modelTopup.trx('top', null, function(err, data){
          if(!err){
            resolve();
            transId = data;
          }
        });
      });

      //outlet or canvasser mutation
      if(records[0].credit == 0){
        if(records[0].payment_gateway == 0){
          await new Promise(function(resolve, reject) {
            modelTopup.mutation(transId, -totalPrice, member, function(err, data){
              if(!err){
                resolve();
              }
            });
          });
        }else{//sgo mandiri etc
          await new Promise(function(resolve, reject) {
            modelTopup.outlet_mutation(transId, -totalPrice, outlet, function(err, data){
              if(!err){
                resolve();
              }
            })
          });
        }
        period = 0;
        invStatus = 'paid';
        loan : 0;
      }else{
        if(period < 1){
          await new Promise(function(resolve, reject) {
            modelTopup.errorMsg(req.params.trxId, 'outlet tidak diperbolehkan hutang', function(err, data){
              if(!err){
                res.json({status:'failed', message: error});
                return;
              }
            });
          });
        }else{
          await new Promise(function(resolve, reject) {
            modelTopup.outlet_mutation(transId, -totalPrice, outlet, function(err, data){
              if(!err){
                resolve();
              }
            })
          });
        }
      }

      //prepare schedule for next topup
      await new Promise(function(resolve, reject) {
        common.log("prepare schedule for next topup");
        modelTopup.updateSD(dataStock[0].new_ts, records[0].sd_id, function(err, data){
          if(!err){
            resolve();
          }
        })
      });

      //topup document/queue approve
      let topupStatus = 'W'; //normal trx
      if(records[0].payment_gateway != 0){
        topupStatus = 'WT';
      }

      //update Topup
      await new Promise(function(resolve, reject) {
        modelTopup.updateTopup(transId, topupStatus, dataStock[0].new_ts, req.params.trxId, function(err, data){
          if(!err){
            resolve();
          }
        })
      });

      //additional table exec_stock
      if(config.randomSD.isat_stock_free && records[0].ref_type_id == config.randomSD.isat_ref_type_id){
        await new Promise(function(resolve, reject) {
          modelTopup.insertExecStock(records[0].topup_id, records[0].sd_id, function(err,data){
            if(!err){
              resolve();
            }
          });
        });
      }

      daemonControl.index(req.params.trxId, records[0].sd_id);

      res.json({status: 'success', message: "topupID "+req.params.trxId+" under process"});
    }
  }
  catch(error){
    common.log("error "+error.message);
    res.json({status: 'failed', message: error.message});
    return;
  }
};
