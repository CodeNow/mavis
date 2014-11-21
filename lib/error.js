'use strict';
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