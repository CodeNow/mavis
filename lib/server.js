'use strict';
/**
 * Module for starting and stopping the RESTful mavis server.
 * @module mavis:server
 */

require('loadenv')('mavis:env');

var monitor = require('monitor-dog');
var app = require('./app');
var docksMonitor = require('./models/docks-monitor');
var log = require('./logger').child({ module: __filename });
if (process.env.NEWRELIC_KEY) { require('newrelic'); }
var Redis = require('./models/redis.js');
var rabbitMQ = require('./rabbitmq.js');
var WorkerServer = require('./models/worker-server.js');


module.exports = Server;

/**
 * Creates instance of Express and an HTTP server
 * @class
 * @return this
 */
function Server () {
  log.info('Server constructor');
  return this
};
/**
 * The express application server for mavis.
 */
var server;

/**
 * Starts the mavis express application.
 * @param {function} cb Callback to execute after the server has been started.
 */
Server.prototype.start = function (cb) {
  monitor.startSocketsMonitor();
  docksMonitor.start();
  Redis.connect();
  this.server = app.listen(process.env.PORT, function(err) {
    if (err) {
      log.fatal({ err: err }, 'Error starting server. Exiting');
      return cb(err);
    }
    log.info({ port: process.env.PORT }, 'Mavis server started.');
    rabbitMQ.create(function (err) {
      if (err) {
        log.fatal({ err: err }, 'Error starting workers. Exiting');
        return cb(err);
      }
      log.info('connected to rabbit');
      WorkerServer.listen(cb);
    });
  });
}

/**
 * Stops the mavis express application.
 * @param {function} cb Callback to execute after the server has been stopped.
 */
Server.prototype.stop = function (cb) {
  if (!this.server) {
    throw new Error('App was not started.');
  }
  log.info('Stopping mavis server');
  monitor.stopSocketsMonitor();
  docksMonitor.stop();
  Redis.disconnect();
  this.server.stop(function (err) {
    log.fatal({ err: err }, 'Error stopping server');
    WorkerServer.stop(function (err) {
      log.fatal({ err: err }, 'Error unloading workers');
      rabbitMQ.close(function (err) {
        log.fatal({ err: err }, 'Error closing workers');
        cb();
      });
    });
  });
}
