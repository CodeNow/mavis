/**
 * Consul API requests
 * @module lib/models/Consul
 */
'use strict';
require('loadenv')('mavis:env');

var consul = require('consul')({
  host: process.env.CONSUL_HOST,
  port: process.env.CONSUL_PORT
});
var url = require('url');
var TaskError = require('ponos').TaskError;

var log = require('../logger').child({ module: 'consul' });

module.exports = Consul;

/**
 * class used to talk to Consul
 */
function Consul () { }

/**
 * waits for dock to be removed from consul
 * will cb with TaskError if dock still exist
 * @param {String} dockerUrl docker host to check for format: http://10.0.0.1:4242
 * @param {Function} cb (err)
 */
Consul.waitForDockRemoved = function (dockerUrl, cb) {
  var host = url.parse(dockerUrl).host;
  var logData = { host: host };
  log.info(logData, 'Consul.prototype.waitForDockRemoved');
  consul.kv.get('swarm/docker/swarm/nodes/' + host, function(err, result) {
    if (err) { return cb(err); }
    // if we have a result that means the key still exist, cb with error
    if (result) {
      var taskErr = new TaskError('wait-for-dock-removed', 'dock still exists', result);
      return cb(taskErr);
    }

    log.trace(logData, 'dock as been removed');
    return cb(null);
  });
};
