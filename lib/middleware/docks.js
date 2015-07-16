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

/**
 * Express route that lists each data model for all valid docker hosts.
 * @param {object} req The express request object.
 * @param {object} res The express response object.
 * @param {object} next Express next method.
 */
function list (req, res, next) {
  log.trace('Listing valid docks');
  var tags = req.body.tags || req.query.tags;
  dockData.getValidDocks(tags, function (err, data) {
    if (err) { return next(err); }
    log.trace({ tags: tags }, 'Docks successfully listed');
    res.status(200).json(data);
  });
}

/**
 * Express route for updating a dock's data model.
 * @param {object} req The express request object.
 * @param {string} req.body.host Host for the dock (required).
 * @param {string} req.body.key Key for the value to change (required).
 * @param {string} req.body.value Value to set (required).
 * @param {object} res The express response object.
 * @param {object} next Express next method.
 */
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
    return next(error.errorCaster(
      400, 'host must be in form http://1.1.1.1:4242', host
    ));
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

/**
 * Express route for removing a docker host from the data model.
 * @param {object} req The express request object.
 * @param {string} req.body.host Host to remove, optional if req.query.host is
 *                               set.
 * @param {string} req.query.host Host to remove optional if req.body.host is
 *                                set.
 * @param {object} res The express response object.
 * @param {object} next Express next method.
 */
function remove (req, res, next) {
  var host = req.body.host || req.query.host;

  // Validations
  if (!host) {
    return next(error.errorCaster(400, 'host param is required'));
  }
  if (!isHostUrlValid(host)) {
    return next(error.errorCaster(
      400, 'host must be in form http://1.1.1.1:4242', host
    ));
  }

  log.info({ host: host }, 'Removing dock');
  dockData.deleteHost(host, function (err) {
    if(err) { return next(err); }
    log.trace({ host: host }, 'Dock host successfully removed');
    res.status(200).end();
  });
}

/**
 * Express route for adding dock to the data model.
 * @param {object} req The express request object.
 * @param {string} req.body.host Host for the dock to add.
 * @param {string} req.body.tags Comma separated list of tags for the host.
 * @param {string} req.query.host Host for the dock to add (optional if not set
 *                 by req.body.host).
 * @param {string} req.query.tags Comma separated list of tags for the host
 *                 (optional if not set by req.body.tags).
 * @param {object} res The express response object.
 * @param {object} next Express next method.
 */
function add (req, res, next) {
  var host = req.body.host || req.query.host;
  var tags = req.body.tags || req.query.tags;

  // Validations
  if (!host) {
    return next(error.errorCaster(400, 'host param is required'));
  }
  if (!isHostUrlValid(host)) {
    return next(error.errorCaster(
      400, 'host must be in form http://1.1.1.1:4242', host
    ));
  }

  log.info({ host: host, tags: tags }, 'Adding dock');
  dockData.addHost(host, tags, function (err) {
    if(err) { return next(err); }
    log.debug({ host: host, tags: tags }, 'Dock successfully added');
    res.status(200).end();
  });
}

/**
 * Determines if a given host is valid.
 * @param {string} host Host to validate.
 * @return `true` if the host is valid, `false` otherwise.
 */
function isHostUrlValid (host) {
  var pHost = url.parse(host);
  var valid = pHost.protocol && pHost.hostname && pHost.port;
  log.trace({ host: host, valid: valid }, 'isHostUrlValid');
  return valid;
}

/**
 * Determines if a given redis key for a host is valid. Currently only the
 * following keys are considered valid: `numContainer` and `numBuilds`.
 * @param {string} key Key to validate.
 * @return `true` if the given key is valid, `false` otherwise.
 */
function isKeyValid(key) {
  var valid = ~key.indexOf('numContainer') || ~key.indexOf('numBuilds');
  log.trace({ key: key, valid: valid }, 'isKeyValid');
  return valid;
}
