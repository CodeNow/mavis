'use strict';
var dockData = require('../models/dockData.js');
var error = require('../error.js');
var url = require('url');
var debug = require('debug')('mavis:docks:middleware');

function list (req, res, next) {
  debug('list');
  var tags = req.body.tags || req.query.tags;
  dockData.getValidDocks(tags, function (err, data) {
    if(err) { return next(err); }
    debug('200!', 'list');
    res.status(200).json(data);
  });
}

function update (req, res, next) {
  debug('update', req.query, req.body);
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
    debug('200!', 'update');
    res.status(200).end();
  });
}

function remove (req, res, next) {
  debug('remove', req.query, req.body);
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
    debug('200!', 'remove', req.query, req.body);
    res.status(200).end();
  });
}

function add (req, res, next) {
  debug('add', req.query, req.body);
  var host = req.body.host || req.query.host;
  var tags = req.body.tags || req.query.tags;
  if (!host) {
    return next(error.errorCaster(400, 'host param is required'));
  }
  // validate host
  if (!isHostUrlValid(host)) {
    return next(error.errorCaster(400, 'host must be in form http://1.1.1.1:4242', host));
  }

  dockData.addHost(host, tags, function (err) {
    if(err) { return next(err); }
    debug('200!', 'add');
    res.status(200).end();
  });
}

// helpers
function isHostUrlValid (host) {
  debug('isHostUrlValid');
  var pHost = url.parse(host);
  return pHost.protocol && pHost.hostname && pHost.port;
}

function isKeyValid(key) {
  debug('isKeyValid');
  if (~key.indexOf('numContainer') || ~key.indexOf('numBuilds')) {
    return true;
  }
  return false;
}


module.exports.list = list;
module.exports.update = update;
module.exports.remove = remove;
module.exports.add = add;