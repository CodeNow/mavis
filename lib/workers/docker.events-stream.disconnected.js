/**
  * Handles docker `down` events.
  * @param  {object} data Information describing the `down` event.
  * @see  {@link https://docs.docker.com/reference/api/docker_remote_api_v1.17/}
  *       for information about docker events.
  * @see  {@link https://github.com/codenow/docker-listener/}
  *       for runnable specific ways of handling a mutating event data.
  * @module lib/workers/docker.events-stream.disconnected
  */
'use strict';

var Promise = require('bluebird');
var Events = Promise.promisifyAll(require('../models/events.js'));
var log = require('../logger').child({ module: 'workers' });

module.exports = function (job) {
  return Promise.resolve()
    .then(function handleDockDown () {
      Events.handleDockDown(job);
    })
    .catch(function (err) {
      log.error({ err: err }, 'docker.events-stream.disconnected');
      throw err;
    });
};
