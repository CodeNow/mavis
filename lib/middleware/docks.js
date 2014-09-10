'use strict';
var dockData = require('../models/dockData.js');
var error = require('../error.js');
var url = require('url');

function list (req, res, next) {
  dockData.getValidDocks(function (err, data) {
    if(err) { return next(err); }
    res.status(200).json(data);
  });
}

function update (req, res, next) {
  var host = req.body.host || req.query.host;
  var key = req.body.key || req.query.key;
  var value = req.body.value || req.query.value;

  if (!host) {
    return next(error.errorCaster(400, 'host param is required'));
  }
  if (!isHostUrlValid(host)) {
    return next(error.errorCaster(400, 'host must be in form http://1.1.1.1:4242', host));
  }

  if (!key) {
    return next(error.errorCaster(400, 'key param is required'));
  }
  if (!isKeyValid(key)) {
    return next(error.errorCaster(400, 'key param is invalid'));
  }

  if (!value) {
    return next(error.errorCaster(400, 'value param is required'));
  }

  dockData.setKey(host, key, value, function (err) {
    if(err) { return next(err); }
    res.status(200).end();
  });
}

function remove (req, res, next) {
  var host = req.body.host || req.query.host;
  if (!host) {
    return next(error.errorCaster(400, 'host param is required'));
  }
  // validate host
  if (!isHostUrlValid(host)) {
    return next(error.errorCaster(400, 'host must be in form http://1.1.1.1:4242', host));
  }

  dockData.deleteHost(host, function (err) {
    if(err) { return next(err); }
    res.status(200).end();
  });
}

function add (req, res, next) {
  var host = req.body.host || req.query.host;
  if (!host) {
    return next(error.errorCaster(400, 'host param is required'));
  }
  // validate host
  if (!isHostUrlValid(host)) {
    return next(error.errorCaster(400, 'host must be in form http://1.1.1.1:4242', host));
  }

  dockData.addHost(host, function (err) {
    if(err) { return next(err); }
    res.status(200).end();
  });
}

// helpers
function isHostUrlValid (host) {
  var pHost = url.parse(host);
  return pHost.protocol && pHost.hostname && pHost.port;
}

function isKeyValid(key) {
  if (~key.indexOf('numContainer') || ~key.indexOf('numBuilds')) {
    return true;
  }
  return false;
}


module.exports.list = list;
module.exports.update = update;
module.exports.remove = remove;
module.exports.add = add;