'use strict';
require('../loadenv.js')();

var dockData = require('../models/dockData.js');
var error = require('../error.js');
var debug = require('debug')('mavis:events:docker:');

/**
 * Handles docker `die` events.
 * @param {object} data Docker die event data.
 * @return {string} The type of container described by the event.
 * @see  {@link https://docs.docker.com/reference/api/docker_remote_api_v1.17/}
 *       for information about docker events.
 * @see  {@link https://github.com/codenow/docker-listener/}
 *       for runnable specific ways of handling a mutating event data.
 */
function handleDestroy(data) {
  debug('handleDestroy', data);
  if (!hasValidFrom(data) || !hasValidHost(data)) {
    return error.log('invalid data', data);
  }

  var host = data.host;
  var type = getType(data);
  var inc = -1;

  if (type === 'unknown') {
    debug('unknown container type, ignoring');
  }
  else {
    dockData.incKey(host, type, inc, error.logIfErr);
  }

  return type;
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
  if (!hasValidHost(data)) {
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
  if (!hasValidHost(data)) {
    return error.log('invalid data', data);
  }
  var host = data.host;

  dockData.addHost(host, error.logIfErr);
}

/**
 * Determine type of container from given event data.
 * @param {Object} data Event data.
 * @return {string} The container type for the event.
 *  Possible values: `container_build`, `container_run`,
 *  or `unknown`.
 */
function getType(data) {
  var type = 'unknown';
  if (~data.from.indexOf(process.env.IMAGE_BUILDER)) {
    type = 'container_build';
  }
  else if (~data.from.indexOf(process.env.RUNNABLE_REGISTRY)) {
    type = 'container_run';
  }
  debug('getType', type);
  return type;
}

/**
 * Determines if given event data has a valid `from` field.
 * @param  {Object} data Event data to check.
 * @return {Boolean} `true` if the data has a valid `from` field, `false` otherwise.
 */
function hasValidFrom(data) {
  return data && typeof data.from === 'string';
}

/**
 * Determines if given event data has a valid `host` field.
 * @param  {Object} data Event data to check.
 * @return {Boolean} `true` if the data has a valid `host` field, `false` otherwise.
 */
function hasValidHost(data) {
  return data && typeof data.host === 'string';
}

module.exports.handleDestroy = handleDestroy;
module.exports.handleDockDown = handleDockDown;
module.exports.handleDockUp = handleDockUp;
