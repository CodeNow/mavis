/**
 * Docker API requests
 * @module lib/models/docker
 */
'use strict';
require('loadenv')('mavis:env');

var Dockerode = require('dockerode');
var ErrorCat = require('error-cat');
var fs = require('fs');
var join = require('path').join;
var put = require('101/put');
var url = require('url');

var log = require('../logger').child({ module: 'docker' });

var certs = {};
var error = new ErrorCat();

module.exports = Docker;

/**
 * class used to talk to docker
 * @param {string} dockerUrl format: http://hostname:hostport
 */
function Docker (dockerUrl) {
  var parsedHost = url.parse(dockerUrl);

  this._client = new Dockerode(put({
    host: parsedHost.hostname,
    port: parsedHost.port,
    timeout: process.env.DOCKER_TIMEOUT_MS
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
 * @param  {Function} cb (err)
 */
Docker.prototype.killSwarmContainer = function (cb) {
  var self = this;
  log.info(self._logData, 'Docker.prototype.killSwarmContainer');

  self._client.getContainer(process.env.SWARM_CONTAINER_NAME).kill(function (err) {
    if (err) { return cb(err); }

    log.trace(self._logData, 'killSwarmContainer killing container success');
    cb(null);
  });
};

/**
 * checks swarm to see if dock still in rotation.
 * will cb with error if dock still in rotation
 * @param {String} dockerUrl docker host to check for format: http://10.0.0.1:4242
 * @param {Function} cb (err)
 */
Docker.ensureDockRemoved = function (dockerUrl, cb) {
  var swarmClient =new Dockerode(put({
    host: process.env.SWARM_HOSTNAME,
    port: process.env.SWARM_PORT
  }, certs));

  var dockerHost = url.parse(dockerUrl).host;
  var logData = {
    dockerHost: dockerHost
  };
  log.info(logData, 'Docker.ensureDockRemoved');

  swarmClient.info(function (err, infoData) {
    log.trace({
      err: err,
      infoData: infoData
    }, 'ensureDockRemoved: info');
    if (err) { return cb(err); }
    // format of this is really bad, it is an array of arrays of strings
    // one of the strings should be the dockerHost
    // look at the test for sample responses
    var isInList = infoData.DriverStatus.some(function (item) {
      // the second item of this array should container docker host
      // format: 10.0.0.1:4242
      return item[1] === dockerHost;
    });

    if (isInList) {
      log.trace(put({
        info: infoData.DriverStatus
      }, logData), 'ensureDockRemoved: dock has NOT been removed');
      return cb(error.create(412, 'dock still exist', infoData.DriverStatus));
    }

    log.trace(logData, 'ensureDockRemoved: dock has been removed');
    return cb(null);
  });
};
