'use strict';
var pubsub = require('../models/redis.js').pubSub;
var dockerEvents = require('./docker.js');

/**
 * Eventing module for mavis. Currently only hooks into docker container
 * events being sent via redis pubsub.
 * @module mavis:events
 */
module.exports = {
  listen: listen
};

/**
 * Listens for docker events via redis pubsub.
 */
function listen () {
  pubsub.on(eventName('docker_daemon_up'), dockerEvents.handleDockUp);
  pubsub.on(eventName('docker_daemon_down'), dockerEvents.handleDockDown);
}

/**
 * Returns the fully namespaced event name for the given event postfix.
 * @param {String} postfix Postfix name for the event.
 * @return {String} The full event name.
 */
function eventName(postfix) {
  return process.env.DOCKER_EVENTS_NAMESPACE + postfix;
}
