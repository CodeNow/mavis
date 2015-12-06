/**
  * Handles `dock.wait-for-removal` event
  * @module lib/workers/dock.wait-for-removal
  */
'use strict';

var isString = require('101/is-string');
var Promise = require('bluebird');
var TaskFatalError = require('ponos').TaskFatalError;

var Events = Promise.promisifyAll(require('../models/events.js'));
var log = require('../logger').child({ module: 'workers' });

module.exports = function (job) {
  return Promise.resolve()
    .then(function validateArguments () {
      if (!isString(job.dockerUrl)) {
        throw new TaskFatalError('missing dockerUrl');
      }
    })
    .then(function () {
      return Events.handleWaitForDockRemovedAsync(job);
    })
    .catch(function (err) {
      log.error({ err: err }, 'dock.wait-for-removal error');
      throw err;
    });
};
