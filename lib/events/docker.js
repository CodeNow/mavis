'use strict';
require('../loadenv.js')();

var dockData = require('../models/dockData.js');
var error = require('../error.js');
var debug = require('debug')('mavis:events:docker:');

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
    return cb(new Error('Invalid event data'));
  }

  var host = data.host;
  var type = getTypeFromImage(data.from);
  var inc = -1;

  if (type == 'unknown') {
    debug('unknown image type, ignoring');
    return cb(null, false);
  }

  dockData.incKey(host, type, inc, error.logIfErr);
  return cb(null, true);
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
  var host = data.host;

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
  var host = data.host;

  dockData.addHost(host, error.logIfErr);
}

/**
 * Determines an internal counter type given an image name.
 * @param {string} image Name of the image.
 * @return {string} Counter key type (either `'container_build'` or `'container_run'`).
 */
function getTypeFromImage (image) {
  var type = 'unknown';

  if (image === process.env.IMAGE_BUILDER) {
    type = 'container_build';
  }
  else if (~image.indexOf(process.env.RUNNABLE_REGISTRY)) {
    type = 'container_run';
  }

  debug('handleDie:type', type);
  return type;
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

module.exports.handleDie = handleDie;
module.exports.handleDockDown = handleDockDown;
module.exports.handleDockUp = handleDockUp;
