'use strict';

require('./loadenv.js')();
var debug = require('debug')('mavis:startup');
var app = require('./app.js');
var apiClient = require('./models/api-client.js');
var dd = require('./models/datadog.js');

var expressApp;

if (process.env.NEWRELIC_KEY) {
  require('newrelic');
}

module.exports.start = function(cb) {
  dd.monitorStart();
  apiClient.login(function(err) {
    if (err) {
      debug('Error connecting to API', err);
      return process.exit(1);
    }
    expressApp = app.listen(process.env.PORT, function(err) {
      if (err) {
        debug('Error starting application', err);
        return process.exit(1);
      }
      if (cb) { cb(); }
    });
  });
};

module.exports.stop = function(cb) {
  if (!expressApp) {
    throw new Error('App was not started.');
  }

  apiClient.logout(function(err) {
    if (err) { return cb(err); }
    expressApp.close(cb);
  });
}
