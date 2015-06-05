'use strict';
var messenger = require('../models/redis.js').pubSub;
var dockerEvents = require('./docker.js');

function listen () {
  messenger.on(process.env.DOCKER_EVENTS_NAMESPACE + 'die', dockerEvents.handleDie);
  messenger.on(process.env.DOCKER_EVENTS_NAMESPACE + 'destroy', dockerEvents.handleDestroy);
  messenger.on(process.env.DOCKER_EVENTS_NAMESPACE + 'docker_daemon_down', dockerEvents.handleDockDown);
  messenger.on(process.env.DOCKER_EVENTS_NAMESPACE + 'docker_daemon_up', dockerEvents.handleDockUp);
}

module.exports.listen = listen;
