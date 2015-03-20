'use strict';
require('../loadenv.js')();

var dockData = require('../models/dockData.js');
var error = require('../error.js');
var debug = require('debug')('mavis:events:docker:');
var client = require('../models/api-client.js').client;

/**
 * Handles docker `die` events.
 * @param {object} data Docker die event data.
 * @param {handleDieCallback} cb Callback to be executed when handle die completes.
 * @see  {@link https://docs.docker.com/reference/api/docker_remote_api_v1.17/}
 *       for information about docker events.
 * @see  {@link https://github.com/codenow/docker-listener/}
 *       for runnable specific ways of handling a mutating event data.
 */

/**
 * Callback fired when handleDie completes.
 * @callback handleDieCallback
 * @param {Error} err Error response, if applicable.
 * @param {Boolean} isInstance `true` if the container was an instance, `false` otherwise.
 */
function handleDie(data, cb) {
  debug('handleDie', data);
  cb = (!cb) ? function() {} : cb;

  if (!isContainerDataValid(data)) {
    error.log('invalid data', data);
    return cb(new Error('Invalid event data'))
  }

  var host = encodeHostFromIp(data.ip);
  var type = getTypeFromImage(data.from);
  var inc = -1;

  debug('handleDie:type', type);

  // Decrement for container builds
  if (type === 'container_build') {
    dockData.incKey(host, type, inc, error.logIfErr);
    return cb(null, false);
  }

  // Check for instance information for all other container deaths
  isInstanceContainer(data.id, function(err, isInstance) {
    if (err) {
      error.log('container die -> isInstance', err);
      return cb(err);
    }

    if (isInstance) {
      debug('instance container found, decrementing');
      dockData.incKey(host, type, inc, error.logIfErr);
      return cb(null, true);
    }
    else {
      debug('not an instance container, ignoring');
    }
    cb(null, false);
  });
}

/**
 * Handles docker `down` events.
 * @param  {object} data Information describing the `down` event.
 * @see  {@link https://docs.docker.com/reference/api/docker_remote_api_v1.17/}
 *       for information about docker events.
 * @see  {@link https://github.com/codenow/docker-listener/}
 *       for runnable specific ways of handling a mutating event data.
 */
function handleDockDown(data) {
  debug('handleDockDown', data);
  if (!isIpValid(data)) {
    return error.log('invalid data', data);
  }
  var host = encodeHostFromIp(data.ip);

  dockData.deleteHost(host, error.logIfErr);
}

/**
 * Handles docker `up` events.
 * @param  {object} data Information describing the `up` event.
 * @see  {@link https://docs.docker.com/reference/api/docker_remote_api_v1.17/}
 *       for information about docker events.
 * @see  {@link https://github.com/codenow/docker-listener/}
 *       for runnable specific ways of handling a mutating event data.
 */
function handleDockUp(data) {
  debug('handleDockUp', data);
  if (!isIpValid(data)) {
    return error.log('invalid data', data);
  }
  var host = encodeHostFromIp(data.ip);

  dockData.addHost(host, error.logIfErr);
}

/**
 * Generates a properly formatted host given an ip.
 *
 * @example
 * // returns 'http://127.0.0.1:4242'
 * encodeHostFromIp('127.0.0.1');
 *
 * @param {string} ip IP to transform.
 * @return {string} Properly formatted host.
 */
function encodeHostFromIp(ip) {
  return 'http://' + ip + ':4242';
}

/**
 * Determines an internal counter type given an image name.
 * @param {string} image Name of the image.
 * @return {string} Counter key type (either `'container_build'` or `'container_run'`).
 */
function getTypeFromImage (image) {
  return image === process.env.IMAGE_BUILDER ? 'container_build' : 'container_run';
}

/**
 * Determines whether or not the given data correctly represents
 * a container event.
 * @param  {Object}  data Data to test.
 * @return {Boolean}      `true` if the data represents a container event, `false` otherwise.
 */
function isContainerDataValid (data) {
  if (!data || typeof data.from !== 'string' || typeof data.id !== 'string') {
    return false;
  }
  return isIpValid(data);
}

/**
 * Determines whether or not given event data has an ip address.
 * @param  {object}  data Event data to test.
 * @return {Boolean}      `true` if the event data has an ip, `false` otherwise.
 */
function isIpValid (data) {
  if (!data || !data.ip || typeof data.ip !== 'string') {
      return false;
  }
  return true;
}

/**
 * Determines if a container with the given id represents a
 * runnable instance container via the api.
 * @param  {string}   id Id of the container to check.
 * @param  {isInstanceCallback} cb Callback to execute after the check has been made.
 */

/**
 * Handles the response from the isInstanceContainer check.
 * @callback isInstanceCallback
 * @param err Error response, if applicable.
 * @param {boolean} isInstance True if the id represented an instance, false otherwise.
 */
function isInstanceContainer(id, cb) {
  var query = {
    owner: {
      github: process.env.HELLO_RUNNABLE_GITHUB_ID
    },
    'container.dockerContainer': id
  };
  client.fetchInstances(query, function(err, body) {
    if (err) { return cb(err); }
    cb(null, body.length != 0);
  });
}

module.exports.handleDie = handleDie;
module.exports.handleDockDown = handleDockDown;
module.exports.handleDockUp = handleDockUp;
