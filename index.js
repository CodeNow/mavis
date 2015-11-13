'use strict';

var Server = require('./lib/server.js');
var server = new Server();
var ErrorCat = require('error-cat');
var error = new ErrorCat();

server.start(function (err) {
  if (err) { error.createAndReport(500, 'failed to start', err); }
});
