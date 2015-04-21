'use strict';

require('./loadenv.js')();
var debug = require('debug')('mavis:startup');
var app = require('./app.js');
var dd = require('./models/datadog.js');

var expressApp;

if (process.env.NEWRELIC_KEY) {
  require('newrelic');
}

module.exports.start = function(cb) {
  dd.monitorStart();
  expressApp = app.listen(process.env.PORT, function(err) {
    if (err) {
      debug('Error starting application', err);
      return process.exit(1);
    }
    console.log('server listening on port: '+process.env.PORT);
    if (cb) { cb(); }
  });
};

module.exports.stop = function(cb) {
  if (!expressApp) {
    throw new Error('App was not started.');
  }
  expressApp.close(cb);
}
