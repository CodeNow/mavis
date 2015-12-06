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

  this.client = new Dockerode(put({
    dockerUrl: parsedHost.hostname,
    port: parsedHost.port
  }, certs));

  this.logData = {
    dockerUrl: dockerUrl
  };
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
  log.info(self.logData, 'Docker.prototype.killSwarmContainer');

  self.client.getContainer('swarm').kill(function (err) {
    if (err) {
      log.error(put({ err: err }, self.logData), 'killSwarmContainer error killing container');
      return cb(err);
    }

    log.trace(self.logData, 'killSwarmContainer killing container success');
    cb(null);
  });
};
