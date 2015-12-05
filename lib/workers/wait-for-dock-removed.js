/**
  * Handles `wait-for-dock-removed` event
  * @module lib/workers/wait-for-dock-removed
  */
'use strict';

var Promise = require('bluebird');
var Events = Promise.promisifyAll(require('../models/events.js'));
var log = require('../logger').child({ module: 'workers' });

module.exports = function (job) {
  return Events.handleWaitForDockRemoved(job)
    .catch(function (err) {
      log.error({ err: err }, 'wait-for-dock-removed error');
      throw err;
    });
};
