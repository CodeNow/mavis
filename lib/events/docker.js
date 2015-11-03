'use strict';

require('loadenv')('mavis:env');

var dockData = require('../models/dockData.js');
var error = require('../error.js');
var log = require('../logger').child({ module: 'events:docker' });
var exists = require('101/exists');
var keypather = require('keypather')();

/**
 * Event handlers for docker events.
 * @module mavis:events:docker
 */
module.exports = {
  handleDie: handleDie,
  handleDestroy: handleDestroy,
  handleDockDown: handleDockDown,
  handleDockUp: handleDockUp
};

/**
 * Handles docker `die` events.
 * updates container build counts
 * @param {object} data Docker die event data.
 * @return {string} The type of container described by the event.
 * @see  {@link https://docs.docker.com/reference/api/docker_remote_api_v1.17/}
 *       for information about docker events.
 * @see  {@link https://github.com/codenow/docker-listener/}
 *       for runnable specific ways of handling a mutating event data.
 */
function handleDie(data) {
  log.debug({ event: data }, 'Die event');

  if (
    !hasValidFrom(data) ||
    !hasValidHost(data) ||
    !hasValidLabelType(data)
  ) {
    return error.log('invalid data', data);
  }

  var type = getType(data);
  if (type !== 'container_build') {
    log.debug({ type: type }, 'Invalid container type, ignoring.');
  } else {
    dockData.incKey(data.host, type, -1, error.logIfErr);
  }

  return type;
}

/**
 * Handles docker `destroy` events.
 * updates container count
 * @param {object} data Docker destroy event data.
 * @return {string} The type of container described by the event.
 * @see  {@link https://docs.docker.com/reference/api/docker_remote_api_v1.17/}
 *       for information about docker events.
 * @see  {@link https://github.com/codenow/docker-listener/}
 *       for runnable specific ways of handling a mutating event data.
 */
function handleDestroy(data) {
  log.debug({ event: data }, 'Destroy event');

  if (!hasValidFrom(data) || !hasValidHost(data)) {
    return error.log('invalid data', data);
  }

  var type = getType(data);
  if (type !== 'container_run') {
    log.debug({ type: type }, 'Invalid container type, ignoring.');
  } else {
    dockData.incKey(data.host, type, -1, error.logIfErr);
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
  log.debug({ event: data }, 'Dock down event');
  if (!hasValidHost(data)) {
    return error.log('invalid data', data);
  }
  dockData.deleteHost(data.host, error.logIfErr);
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
  log.debug({ event: data }, 'Dock up event');
  if (!hasValidHost(data)) {
    return error.log('invalid data', data);
  }
  dockData.addHost(data.host, data.tags, error.logIfErr);
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
  if (
    hasValidLabelType(data) &&
    ~data.inspectData.Config.Labels.type.indexOf(process.env.IMAGE_BUILDER_LABEL)
  ) {
    type = 'container_build';
  }
  else if (~data.from.indexOf(process.env.RUNNABLE_REGISTRY)) {
    type = 'container_run';
  }
  log.trace({ event: data, type: type }, 'Determined event type: ' + type);
  return type;
}

/**
 * Determines if given event data has a valid `from` field.
 * @param  {Object} data Event data to check.
 * @return {Boolean} `true` if the data has a valid `from` field, `false`
 *   otherwise.
 */
function hasValidFrom(data) {
  return data && typeof data.from === 'string';
}

/**
 * Determines if given event data has a valid `host` field.
 * @param  {Object} data Event data to check.
 * @return {Boolean} `true` if the data has a valid `host` field, `false`
 *  otherwise.
 */
function hasValidHost(data) {
  return data && typeof data.host === 'string';
}

/**
 * Determines if the given event data has a valid inspect data label type.
 * @param {object} data Data to check.
 * @return {boolean} `true` if the label type exists, false otherwise.
 */
function hasValidLabelType(data) {
  var labelType = keypather.get(data, 'inspectData.Config.Labels.type');
  return data && exists(labelType);
}
