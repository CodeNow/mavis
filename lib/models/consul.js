/**
 * Consul API requests
 * @module lib/models/Consul
 */
'use strict';
require('loadenv')('mavis:env');

var url = require('url');
var ErrorCat = require('error-cat');
var error = new ErrorCat();

var log = require('../logger').child({ module: 'consul' });

module.exports = Consul;

/**
 * class used to talk to Consul
 */
function Consul () {}

/**
 * singleton consul client
 * @type {Object}
 */
Consul._client = require('consul')({
  host: process.env.CONSUL_HOST,
  port: process.env.CONSUL_PORT
});

/**
 * waits for dock to be removed from consul
 * will cb with TaskError if dock still exist
 * @param {String} dockerUrl docker host to check for format: http://10.0.0.1:4242
 * @param {Function} cb (err)
 */
Consul.ensureDockRemoved = function (dockerUrl, cb) {
  var host = url.parse(dockerUrl).host;
  var logData = { host: host };
  log.info(logData, 'Consul.prototype.ensureDockRemoved');
  Consul._client.kv.get('swarm/docker/swarm/nodes/' + host, function(err, result) {
    if (err) { return cb(err); }
    // if we have a result that means the key still exist, cb with error
    if (result) {
      return cb(error.create(412, 'dock still exist', result));
    }

    log.trace(logData, 'ensureDockRemoved dock as been removed');
    return cb(null);
  });
};
