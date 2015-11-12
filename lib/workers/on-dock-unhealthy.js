/**
  * Handles `on-dock-unhealthy` event
  * @module lib/workers/on-dock-unhealthy
  */
'use strict';

var Promise = require('bluebird');
var Events = Promise.promisifyAll(require('../models/events.js'));
var log = require('../logger').child({ module: 'workers' });

module.exports = function (job) {
  return Promise.resolve()
    .then(function handleDied () {
      Events.handleUnhealthyAsync(job);
    })
    .catch(function (err) {
      log.error({ err: err }, 'on-dock-unhealthy error');
      throw err;
    });
};
