'use strict';
var async = require('async');
var processer = null;
var queue = async.queue(function (task, cb) {
  processer(task.req, task.res, task.next, cb);
}, 1);

module.exports = function onReq (middleware) {
  processer = middleware;
  return function (req, res, next) {
    queue.push({
      req: req,
      res: res,
      next: next
    });
  };
};
