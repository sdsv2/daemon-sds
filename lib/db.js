'use strict';

const mysql = require('mysql');
const config = require('./config.json');

let connection = mysql.createConnection({
  host : config.mysql.host,
  user : config.mysql.user,
  password : config.mysql.password,
  database : config.mysql.database
})

connection.connect(function(err){
  if(err){
    console.log('error when connection to db: ', err);
    connection = mysql.createConnection({
      host : config.mysql.host,
      user : config.mysql.user,
      password : config.mysql.password,
      database : config.mysql.database
    });
  }
})

connection.on('error', function(err){
  console.log('db error ',err);
  if(err.code == 'PROTOCOL_CONNECTION_LOST'){
    connection = mysql.createConnection({
      host : config.mysql.host,
      user : config.mysql.user,
      password : config.mysql.password,
      database : config.mysql.database
    });
  }else{
    throw err;
  }
})

module.exports = connection;
