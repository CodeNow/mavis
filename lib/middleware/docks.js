'use strict';
var dockData = require('../models/dockData.js');

function list (req, res, next) {
  dockData.getValidDocks(function (err, data) {
    if(err) { return next(err); }
    res.send(200, data);
  });
}
function update (req, res, next) {
  next();
}
function remove (req, res, next) {
  next();
}
function add (req, res, next) {
  next();
}


module.exports.list = list;
module.exports.update = update;
module.exports.remove = remove;
module.exports.add = add;