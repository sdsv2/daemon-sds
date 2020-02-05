"use strict";

const config = require("../config.json");
const common = require("../common");

exports.daemonKey = function (req, res, next) {
  // body...
  if(req.params.apiKey != config.daemon.apiKey){
    common.log("invalid api key "+req.params.apiKey);
    res.json({
      status: 500,
      message: 'api key failed'
    });
  }else{
    next();
  }
};
