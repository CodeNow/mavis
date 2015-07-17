'use strict';

require('loadenv')('mavis:env');

var monitor = require('monitor-dog');
var app = require('./app');
var docksMonitor = require('./models/docks-monitor');
var log = require('./logger').child({ module: 'server' });
if (process.env.NEWRELIC_KEY) { require('newrelic'); }

/**
 * Module for starting and stopping the RESTful mavis server.
 * @module mavis:server
 */
module.exports = {
  start: start,
  stop: stop
};

/**
 * The express application server for mavis.
 */
var server;

/**
 * Starts the mavis express application.
 * @param {function} cb Callback to execute after the server has been started.
 */
function start (cb) {
  monitor.startSocketsMonitor();
  docksMonitor.start();
  server = app.listen(process.env.PORT, function(err) {
    if (err) {
      log.error({ err: err }, 'Error starting application');
      return process.exit(1);
    }
    log.info({ port: process.env.PORT }, 'Mavis server started.');
    if (cb) { cb(); }
  });
}

/**
 * Stops the mavis express application.
 * @param {function} cb Callback to execute after the server has been stopped.
 */
function stop (cb) {
  if (!server) {
    throw new Error('App was not started.');
  }
  log.info('Stopping mavis server');
  monitor.stopSocketsMonitor();
  docksMonitor.stop();
  server.close(cb);
}
