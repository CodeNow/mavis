var async = require('async');
var queue = async.queue(process, 1);
var processer = null;

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

function process (task, cb) {
  processer(task.req, task.res, task.next, cb);
}