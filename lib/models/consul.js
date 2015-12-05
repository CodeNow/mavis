/**
 * Consul API requests
 * @module lib/models/Consul
 */
'use strict';
require('loadenv')('mavis:env');

var consul = require('consul')({
  host: process.env.CONSUL_HOST
  port: process.env.CONSUL_PORT
});
var put = require('101/put');
var fs = require('fs');
var join = require('path').join;
var url = require('url');

var log = require('./logger.js')(__filename);

module.exports = Consul;

/**
 * class used to talk to Consul
 */
function Consul () { }

/**
 * waits for dock to be removed from consul
 * will cb with TaskError if dock still exist
 * @param {String} host docker host to check for
 * @param {Function} cb (err)
 */
Consul.prototype.waitForDockRemoved = function (host, cb) {
  var host = url.parse(host).host;
  var logData = { host: host };
  log.info(logData, 'Consul.prototype.waitForDockRemoved');
  consul.kv.get('swarm/docker/swarm/nodes/' + host, function(err, result) {
    if (err) { return cb(err); }
    // if we have a result that means the key still exist, cb with error
    if (result) {
      var taskErr = new TaskError('dock still exists', err);
      return cb(taskErr);
    }

    log.trace(logData, 'dock as been removed');
    return cb(null);
  });
};
