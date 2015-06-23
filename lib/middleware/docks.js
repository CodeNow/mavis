'use strict';

var url = require('url');

var dockData = require('../models/dockData.js');
var error = require('../error.js');
var log = require('../logger').child({ module: 'middleware:docks' });

/**
 * @module mavis:middleware:docks
 * @author Anand Patel
 */
module.exports = {
  list: list,
  update: update,
  remove: remove,
  add: add
};

function list (req, res, next) {
  log.debug('Listing valid docks');

  var tags = req.body.tags || req.query.tags;
  dockData.getValidDocks(tags, function (err, data) {
    if (err) { return next(err); }
    log.trace({ tags: tags }, 'Docks successfully listed');
    res.status(200).json(data);
  });
}

function update (req, res, next) {
  log.debug({
    query: req.query,
    body: req.body
  }, 'Updating docks');

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
    log.trace({
      host: host,
      key: key,
      value: value
    }, 'Dock successfully updated');
    res.status(200).end();
  });
}

function remove (req, res, next) {
  log.debug({
    query: req.query,
    body: req.body
  }, 'Removing dock');

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
    log.trace({ host: host }, 'Dock host successfully removed');
    res.status(200).end();
  });
}

function add (req, res, next) {
  log.debug({
    query: req.query,
    body: req.body
  }, 'Adding dock');

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
    log.debug({ host: host, tags: tags }, 'Dock successfully added');
    res.status(200).end();
  });
}

// helpers
function isHostUrlValid (host) {
  var pHost = url.parse(host);
  var valid = pHost.protocol && pHost.hostname && pHost.port
  log.trace({ host: host, valid: valid }, 'isHostUrlValid');
  return valid;
}

function isKeyValid(key) {
  var valid = ~key.indexOf('numContainer') || ~key.indexOf('numBuilds');
  log.trace({ key: key, valid: valid }, 'isKeyValid');
  return valid;
}
