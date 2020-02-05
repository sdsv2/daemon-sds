"use strict";

const express = require('express');
const router = express.Router();

const topup = require('../controllers/topup');
const apiKey = require('../controllers/apiKey');
const reversalWeb = require('../controllers/reversalWeb');

router.get('/topup/:apiKey/:trxId',[apiKey.daemonKey], topup.index);
router.get('/reversal/:apiKey/:trxId', [apiKey.daemonKey], reversalWeb.index);

module.exports = router;
