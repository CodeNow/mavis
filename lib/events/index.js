'use strict';
var messenger = require('../models/redis.js').pubSub;
var dockerEvents = require('./docker.js');

function listen () {
  messenger.on('runnable:docker:start', dockerEvents.handleStart);
  messenger.on('runnable:docker:die', dockerEvents.handleDie);
  messenger.on('runnable:docker:docker_daemon_down', dockerEvents.handleDockDown);
  messenger.on('runnable:docker:docker_daemon_up', dockerEvents.handleDockUp);
}

module.exports.listen = listen;
