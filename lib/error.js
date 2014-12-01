'use strict';

var envIs = require('101/env-is');
var pick = require('101/pick');
var noop = require('101/noop');
var rollbar = require('rollbar');
if (process.env.ROLLBAR_KEY) {
  rollbar.init(process.env.ROLLBAR_KEY, {
    environment: process.env.NODE_ENV || 'development',
    branch: process.env.ROLLBAR_OPTIONS_BRANCH,
    codeVersion: process.env._VERSION_GIT_COMMIT,
    root: process.env.ROOT_DIR
  });
}

function errorCaster(code, message, data) {
  var err = new Error(message);
  err.code = code;
  err.data = {
    data: data,
    stack: err.stack
  };
  return err;
}

function errorResponder(err, req, res, next) {
  log(err);
  if(err.code) {
    return res.status(err.code).json(err);
  }
  return res.status(500).json(err);
}

function logIfErr (err) {
  if (err) {
    log(err);
  }
}

function log (err) {
  if (process.env.LOG_ERRORS) {
    console.error(err.message);
    console.error(err.stack);
    if (err.data) {
      console.error(err.data);
    }
  }
  if (!envIs('test')) {
    report(err);
  }
}

function report (err) {
  var cusom = err.data || {};
  var req = custom.req;
  delete custom.req;
  if (custom.err) {
    var errKeys;
    try {
      errKeys = Object.keys(custom.err);
    }
    catch (err) {
      errKeys = [];
    }
    custom.err = pick(custom.err, ['message', 'stack'].concat(errKeys));
  }
  rollbar.handleErrorWithPayloadData(err, {custom: custom}, req, noop);
}

function create(message, data) {
  var err = new Error(message);
  err.data = data;
  log(err);
  return err;
}

module.exports.errorResponder = errorResponder;
module.exports.errorCaster = errorCaster;
module.exports.logIfErr = logIfErr;
module.exports.create = create;
module.exports.log = log;
