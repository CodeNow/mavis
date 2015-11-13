'use strict';

require('loadenv')('mavis:env');

var exists = require('101/exists');
var keypather = require('keypather')();
var url = require('url');

var dockData = require('../models/dockData.js');
var log = require('../logger').child({ module: 'events:docker' });

var TaskFatalError = require('ponos').TaskFatalError;
var TaskError = require('ponos').TaskError;
var rabbitMQ = require('../rabbitmq.js');


/**
 * Module used to handle runnable events
 */
var Events = module.exports = {};


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
Events.handleDied = function (data, cb) {
  log.debug({ event: data }, 'Die event');
  if (
    !hasValidFrom(data) ||
    !hasValidHost(data) ||
    !hasValidLabelType(data)
  ) {
    var err = new TaskFatalError('container.life-cycle.died', 'Failed validation');
    return cb(err);
  }
  var type = getType(data);
  if (type !== 'container_build') {
    log.debug({ type: type }, 'Invalid container type, ignoring.');
    return cb(null);
  }
  dockData.incKey(data.host, type, -1, cb);
};

/**
 * Handles docker `down` events.
 * @param  {object} data Information describing the `down` event.
 * @see  {@link https://docs.docker.com/reference/api/docker_remote_api_v1.17/}
 *       for information about docker events.
 * @see  {@link https://github.com/codenow/docker-listener/}
 *       for runnable specific ways of handling a mutating event data.
 */
Events.handleDockDown = function (data, cb) {
  log.debug({ event: data }, 'Dock down event');
  if (!hasValidHost(data)) {
    var err = new TaskFatalError('docker.events-stream.disconnected', 'Failed validation: no host');
    return cb(err);
  }
  dockData.deleteHost(data.host, cb);
};

/**
 * Handles docker `up` events.
 * @param  {object} data Information describing the `up` event.
 * @see  {@link https://docs.docker.com/reference/api/docker_remote_api_v1.17/}
 *       for information about docker events.
 * @see  {@link https://github.com/codenow/docker-listener/}
 *       for runnable specific ways of handling a mutating event data.
 */
Events.handleDockUp = function (data, cb) {
  log.debug({ event: data }, 'Dock up event');
  if (!hasValidHost(data)) {
    var err = new TaskFatalError('docker.events-stream.connected', 'Failed validation: no host');
    return cb(err);
  }
  dockData.addHost(data.host, data.tags, cb);
};

Events.handleUnhealthy = function (data, cb) {
  log.debug({ event: data }, 'Dock unhealthy event');
  if (!hasValidHost(data)) {
    var err = new TaskFatalError('Failed validation: no host');
    return cb(err);
  }
  dockData.deleteHost(data.host, function (err) {
    if (err) {
      var taskErr = new TaskError('Failed to delete host', err);
      return cb(taskErr);
    }
    rabbitMQ.getPublisher().publish('on-dock-removed', data);
    rabbitMQ.getPublisher().publish('cluster-instance-provision', {
      githubId: data.githubId
    });
    cb();
  });
};

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
 * Ensures host if correct format http://10.0.0.0:4242
 * @param  {Object} data Event data to check.
 * @return {Boolean} `true` if the data has a valid `host` field, `false`
 *  otherwise.
 */
function hasValidHost(data) {
  if (!data || !data.host) {
    return false;
  }
  var host = data.host;
  if (typeof host !== 'string') { return false; }
  var parsedUrl = url.parse(host);
  if (!parsedUrl.protocol || !parsedUrl.port || !parsedUrl.hostname) {
    return false;
  }
  return true;
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
