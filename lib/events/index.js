'use strict';
var messenger = require('../models/redis.js').pubSub;
var dockerEvents = require('./docker.js');

function listen () {
  // for handleDie will only keep the payload coming from redis pubsub (since handleDie allows
  // an optional callback for testing).
  messenger.on(process.env.DOCKER_EVENTS_NAMESPACE + 'die', function(data) {
    dockerEvents.handleDie(data, null);
  });
  messenger.on(process.env.DOCKER_EVENTS_NAMESPACE + 'docker_daemon_down', dockerEvents.handleDockDown);
  messenger.on(process.env.DOCKER_EVENTS_NAMESPACE + 'docker_daemon_up', dockerEvents.handleDockUp);
}

module.exports.listen = listen;
