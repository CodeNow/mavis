'use strict';

require('./loadenv.js')();

var app = require('./app');
var dd = require('./models/datadog');
var log = require('./logger').child({ module: 'server' });

var expressApp;

if (process.env.NEWRELIC_KEY) {
  require('newrelic');
}

module.exports = {
  start: start,
  stop: stop
};

/**
 * Starts the mavis express application.
 * @param {function} cb Callback to execute after the server has been started.
 */
function start (cb) {
  dd.monitorStart();
  expressApp = app.listen(process.env.PORT, function(err) {
    if (err) {
      log.error({ err: err }, 'Error starting application');
      return process.exit(1);
    }
    log.info('Mavis server started and listening on port: ' + process.env.PORT);
    if (cb) { cb(); }
  });
};

/**
 * Stops the mavis express application.
 * @param {function} cb Callback to execute after the server has been stopped.
 */
function stop (cb) {
  if (!expressApp) {
    throw new Error('App was not started.');
  }

  log.info('Stopping mavis server');
  expressApp.close(cb);
}
