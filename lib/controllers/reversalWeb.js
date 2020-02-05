'use strict';

const config = require('../config.json');
const common = require('../common');

const reversalControl = require('./reversal');

exports.index = function (req, res, next) {
  // body...
  reversalControl.index(req.params.trxId);
  res.json({status: 'success', message: "reversalID "+req.params.trxId+" under process"});
};
