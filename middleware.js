'use strict';
var mavis = require('./mavis.js');

module.exports = function process (req, res, next, cb) {
  var hint = req.body;

  mavis.obtainOptimalHost(hint , function (err, dockHost) {
    cb();
    if (err) {
      return next(err);
    }
    res.send(200, dockHost);
  });
};