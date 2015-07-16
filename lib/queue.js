'use strict';

var async = require('async');

/**
 * Optimal host processing queue. We use this to queue incoming requests for
 * optimal docker hosts so that each request has up-to-date information when a
 * decision is made by mavis.
 *
 * The module exposes a single method that creates a middleware for handling
 * the "find host" express route given a request processing middleware.
 *
 * @module mavis:queue
 */
module.exports = createOptimalHostRoute;

/**
 * The queue processor to use when handling jobs.
 * @type {function}
 */
var processer = null;

/**
 * The asynchronous request processing queue.
 * @type {async.queue}
 */
var queue = async.queue(function (task, cb) {
  processer(task.req, task.res, task.next, cb);
}, 1);

/**
 * Generates a request handling middleware that finds optimal hosts with the
 * given queue processor.
 * @param {function} proc Processor for the optimal host queue.
 * @return {function} An express route handler that enqueues incoming requests.
 */
function createOptimalHostRoute (proc) {
  processer = proc;
  return function (req, res, next) {
    queue.push({ req: req, res: res, next: next });
  };
}
