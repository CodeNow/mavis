'use strict';

require('loadenv')('mavis:env');
var url = require('url');
var keypather = require('keypather')();
var TaskFatalError = require('ponos').TaskFatalError;
var TaskError = require('ponos').TaskError;
var put = require('101/put');

var dockData = require('../models/dockData.js');
var Docker = require('../models/docker.js');
var rabbitMQ = require('../rabbitmq.js');
var log = require('../logger').child({ module: 'events:docker' });

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
  log.debug({ data: data }, 'Events.handleDied');
  if (!Events._hasValidFrom(data) || !Events._hasValidHost(data)) {
    var err = new TaskFatalError('container.life-cycle.died', 'Failed validation');
    return cb(err);
  }
  var type = Events._getType(data);
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
  log.info({ data: data }, 'Events.handleDockDown');
  if (!Events._hasValidHost(data)) {
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
  log.info({ data: data }, 'Events.handleDockUp');
  if (!Events._hasValidHost(data)) {
    var err = new TaskFatalError('docker.events-stream.connected', 'Failed validation: no host');
    return cb(err);
  }
  dockData.addHost(data.host, data.tags, cb);
};

Events.handleUnhealthy = function (data, cb) {
  log.info({ data: data }, 'Events.handleUnhealthy');
  if (!Events._hasValidHost(data)) {
    var err = new TaskFatalError('Failed validation: no host');
    return cb(err);
  }

  dockData.deleteHost(data.host, function (err) {
    if (err) {
      var taskErr = new TaskError('handleUnhealthy', 'Failed to delete host', err);
      return cb(taskErr);
    }

    rabbitMQ.getPublisher().publish('dock.wait-for-removal', {
      dockerUrl: data.host
    });
    cb();
  });
};

/**
 * waits for dock to be removed form swarm
 * start by trying killing swarm, then ensure dock is not in swarm anymore
 * this will throw TaskError if dock is still in rotation and ponos will retry
 * publish dock.removed event once dock is removed
 * @param  {Object}   data job data
 * @param  {String}   data.dockerUrl url to check for format: http://10.0.0.1:4242
 * @param  {Function} cb   (err)
 */
Events.handleEnsureDockRemoved = function (data, cb) {
  var logData = { data: data };
  log.info(logData, 'Events.handleEnsureDockRemoved');
  var docker = new Docker(data.dockerUrl);

  docker.killSwarmContainer(function (err) {
    // ignore error here, we will retry until dock is out of rotation
    if (err) {
      log.warn(put({ err: err }, logData), 'handleEnsureDockRemoved killSwarmContainer error');
    }

    Docker.ensureDockRemoved(data.dockerUrl, function (err) {
      if (err) {
        var taskErr = new TaskError('dock.wait-for-removal', 'dock still exists', err);
        return cb(taskErr);
      }

      log.trace(logData, 'handleEnsureDockRemoved publishing dock.removed');
      rabbitMQ.getPublisher().publish('dock.removed', {
        host: data.dockerUrl
      });
      cb();
    });
  });
};

/**
 * Determine type of container from given event data.
 * @param {Object} data Event data.
 * @return {string} The container type for the event.
 *  Possible values: `container_build`, `container_run`,
 *  or `unknown`.
 */
Events._getType = function (data) {
  var type = 'unknown';
  var labelType = keypather.get(data, 'inspectData.Config.Labels.type') || '';
  var eventFrom = keypather.get(data, 'from') || '';
  if (~labelType.indexOf(process.env.IMAGE_BUILDER_LABEL)) {
    type = 'container_build';
  }
  else if (~eventFrom.indexOf(process.env.RUNNABLE_REGISTRY)) {
    type = 'container_run';
  }
  log.trace({ data: data, type: type }, 'Determined event type: ' + type);
  return type;
};

/**
 * Determines if given event data has a valid `from` field.
 * @param  {Object} data Event data to check.
 * @return {Boolean} `true` if the data has a valid `from` field, `false`
 *   otherwise.
 */
Events._hasValidFrom = function (data) {
  return data && typeof data.from === 'string';
};

/**
 * Determines if given event data has a valid `host` field.
 * Ensures host if correct format http://10.0.0.0:4242
 * @param  {Object} data Event data to check.
 * @return {Boolean} `true` if the data has a valid `host` field, `false`
 *  otherwise.
 */
Events._hasValidHost = function (data) {
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
};
