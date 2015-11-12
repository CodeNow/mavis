'use strict';

var Server = require('./lib/server.js');
var ErrorCat = require('error-cat');
var error = new ErrorCat();

Server.start(function (err) {
  if (err) { error.createAndReport(500, 'failed to start', err); }
});
