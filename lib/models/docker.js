/**
 * Docker API requests
 * @module lib/models/docker
 */
'use strict';
require('loadenv')('mavis:env');

var Dockerode = require('dockerode');
var put = require('101/put');
var fs = require('fs');
var join = require('path').join;
var url = require('url');

var log = require('../logger').child({ module: 'docker' });

var certs = {};

module.exports = Docker;

/**
 * class used to talk to docker
 * @param {string} dockerUrl format: http://hostname:hostport
 */
function Docker (dockerUrl) {
  var parsedHost = url.parse(dockerUrl);

  this._client = new Dockerode(put({
    host: parsedHost.hostname,
    port: parsedHost.port
  }, certs));

  this._logData = {
    dockerUrl: dockerUrl
  };
  log.trace(this._logData, 'Docker constructor');
}

/**
 * loads certs for docker. does not throw if failed, just logs
 * sync function as this should only happen once on startup
 */
Docker.loadCerts = function () {
  // try/catch is a better pattern for this, since checking to see if it exists
  // and then reading files can lead to race conditions (unlikely, but still)
  try {
    var certPath = process.env.DOCKER_CERT_PATH;
    certs.ca = fs.readFileSync(join(certPath, '/ca.pem'));
    certs.cert = fs.readFileSync(join(certPath, '/cert.pem'));
    certs.key = fs.readFileSync(join(certPath, '/key.pem'));
    log.info('Docker.loadCerts docker certificates loaded');
  } catch (err) {
    log.warn({ err: err }, 'Docker.loadCerts cannot load certificates for docker');
    throw err;
  }
};

/**
 * stop swarm docker container
 * if already dead or 404 continue
 * @param  {Function} cb (err)
 */
Docker.prototype.killSwarmContainer = function (cb) {
  var self = this;
  log.info(self._logData, 'Docker.prototype.killSwarmContainer');

  self._client.getContainer(process.env.SWARM_CONTAINER_NAME).kill(function (err) {
    if (err) {
      if (!Docker._ignorableKillError(err)) {
        log.error(put({ err: err }, self._logData), 'killSwarmContainer error killing container');
        return cb(err);
      }
    }

    log.trace(self._logData, 'killSwarmContainer killing container success');
    cb(null);
  });
};

/**
 * check to see if the error returned from swarm killing is ignorable
 * @param  {Object} err object from dockerode kill api
 * @return {Boolean}    true if ignorable, false if not
 */
Docker._ignorableKillError = function (err) {
  var is404 = err.statusCode === 404;
  var isNotRunning = (err.statusCode === 500) && /notrunning/.test(err.json);
  return is404 || isNotRunning;
};
