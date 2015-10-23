'use strict';

require('loadenv')('mavis:env');

var dockData = require('../models/dockData.js');
var error = require('../error.js');
var log = require('../logger').child({ module: 'events:docker' });

/**
 * Event handlers for docker events.
 * @module mavis:events:docker
 */
module.exports = {
  handleDockDown: handleDockDown,
  handleDockUp: handleDockUp
};

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
 * Determines if given event data has a valid `host` field.
 * @param  {Object} data Event data to check.
 * @return {Boolean} `true` if the data has a valid `host` field, `false`
 *  otherwise.
 */
function hasValidHost(data) {
  return data && typeof data.host === 'string';
}
