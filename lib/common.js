'use strict';

const date = require('date-and-time');

exports.log = function (dataLog, dataLog2) {
  // body...
  let now = new Date();
  console.log('[',date.format(now, 'YYYY-MM-DD HH:mm:ss'),']', '[Info]', dataLog, dataLog2 ? dataLog2: '');
};

exports.now = function () {
  // body...
  let now = new Date();
  return date.format(now, 'YYYY-MM-DD HH:mm:ss');
};

exports.date = function () {
  // body...
  let now = new Date();
  return date.format(now, 'YYYY-MM-DD');
};
