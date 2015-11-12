/**
  * Handles docker `container.life-cycle.died` events.
  * updates container build counts
  * @param {object} data Docker die event data.
  * @return {string} The type of container described by the event.
  * @see  {@link https://docs.docker.com/reference/api/docker_remote_api_v1.17/}
  *       for information about docker events.
  * @see  {@link https://github.com/codenow/docker-listener/}
  *       for runnable specific ways of handling a mutating event data.
  * @module lib/workers/container.life-cycle.died
  */
'use strict';

var Promise = require('bluebird');
var Events = Promise.promisifyAll(require('../models/events.js'));
var log = require('../logger').child({ module: 'workers' });

module.exports = function (job) {
  return Promise.resolve()
    .then(function handleDied () {
      Events.handleDiedAsync(job);
    })
    .catch(function (err) {
      log.error({ err: err }, 'container.life-cycle.died error');
      throw err;
    });
};
