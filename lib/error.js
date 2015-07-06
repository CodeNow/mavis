'use strict';

var envIs = require('101/env-is');
var pick = require('101/pick');
var noop = require('101/noop');
var rollbar = require('rollbar');
var Boom = require('boom');

var log = require('./logger').child({ module: 'error' });

if (process.env.ROLLBAR_KEY) {
  rollbar.init(process.env.ROLLBAR_KEY, {
    environment: process.env.NODE_ENV || 'development',
    branch: process.env.ROLLBAR_OPTIONS_BRANCH,
    root: process.env.ROOT_DIR
  });
}

function errorCaster(code, message, data) {
  return Boom.create(code, message, data);
}

function errorResponder(err, req, res, next) {
  if (!err.isBoom) {
    err = errorCaster(500, err.message || 'Unknown', { err: err });
  }
  err.reformat();
  // respond error
  res
    .status(err.output.statusCode)
    .json(err.output.payload);
  // log errors
  logError(err, req);
}

function logIfErr (err) {
  if (err) {
    logError(err);
  }
}

function logError (err, req) {
  if (!err.isBoom) {
    err = errorCaster(500, err.message || 'Unknown', { err: err });
  }
  if (!req || !req.url || !req.method) {
    req = null;
  }
  err.reformat();
  var statusCode = err.output.statusCode;
  if (statusCode >= 500) {
    log.warn({
      statusCode: statusCode,
      method: req ? req.method : 'unknown method',
      status: req ? req.url : 'unknown url'
    }, 'Bad application error.');
  }
  else {
    log.warn({
      statusCode: statusCode,
      method: req ? req.method : 'unknown method',
      status: req ? req.url : 'unknown url'
    }, 'Acceptable application error.');
  }

  if (!envIs('test')) {
    report(err, req);
  }

  if (statusCode >= 500) {
    log.error({ err: err }, 'Boom Error');
    if (err.data && err.data.err) {
      log.error({ err: err.data.err }, 'Original Error')
    }
  }
}

function report (err, req) {
  var custom = err.data || {};
  if (custom.err) { // prevent sending circular
    var errKeys;
    try {
      errKeys = Object.keys(custom.err);
    }
    catch (err) {
      errKeys = [];
    }
    custom.err = pick(custom.err, ['message', 'stack']);
  }
  rollbar.handleErrorWithPayloadData(err, { custom: custom }, req, noop);
}

function create(message, data) {
  var err = new Error(message);
  err.data = data;
  logError(err);
  return err;
}

module.exports.errorResponder = errorResponder;
module.exports.errorCaster = errorCaster;
module.exports.logIfErr = logIfErr;
module.exports.create = create;
module.exports.log = logError;
