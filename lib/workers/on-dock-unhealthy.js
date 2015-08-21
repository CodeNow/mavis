/**
 * Respond to dock-unhealthy event from docker-listener
 *  - remove host from mavis
 * @module lib/workers/on-dock-unhealthy
 */
'use strict';
require('loadenv')();
var log = require('./logger').child({ module: __filename });
var put = require('101/put');
var domain = require('domain');
var error = require('error');
var url = require('url');

var dockData = require('models/dockData.js');

module.exports = OnDockUnhealthyWorker;

module.exports.worker = function (data, done) {
  log.info({
    tx: true,
    data: data
  }, 'StartInstanceContainerWorker module.exports.worker');
  var workerDomain = domain.create();
  workerDomain.on('error', function (err) {
    log.fatal({
      tx: true,
      data: data,
      err: err
    }, 'start-instance-container domain error');
    error.workerErrorHandler(err, data);
    // ack job and clear to prevent loop
    done();
  });
  workerDomain.run(function () {
    log.info(put({
      tx: true
    }, data), 'hermes.subscribe on-dock-unhealthy start');
    var worker = new OnDockUnhealthyWorker();
    worker.handle(data, done);
  });
};

function OnDockUnhealthyWorker () {
  log.info('OnDockUnhealthyWorker constructor');
}

/**
 * main handler for docker unhealthy event
 * should redeploy all containers on unhealthy dock
 * @param {Object} data  event meta data
 * @param {Function} cb  sends ACK signal to rabbitMQ
 */
OnDockUnhealthyWorker.prototype.handle = function (data, cb) {
  var dockerHost = data.host;
  var logData = {
    tx: true,
    dockerHost: dockerHost,
    data: data
  };
  log.info(logData, 'handle');
  if (!isValidHost(dockerHost)) {
    log.error(logData, 'handle invalid dockerHost');
    return error.log('invalid data', data);
  }
  dockData.deleteHost(data.host, error.logIfErr);
  cb();
};

/**
 * ensures host if correct format http://10.0.0.0:4242
 * @param  {string}  host string to check
 * @return {Boolean}      true if valid, false if not
 */
function isValidHost (host) {
  var parsedUrl = url.parse(host);
  if (!parsedUrl.protocol || !parsedUrl.port || !parsedUrl.hostname) {
    return false;
  }
  return true;
}
