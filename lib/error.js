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
  if(!~process.env.NODE_ENV.indexOf('test')) {
    console.error(err);
  }
  if(err.code) {
    return res.status(err.code).json(err);
  }
  return res.status(500).json(err);
}

function logIfErr (err) {
  if (err) {
    console.error(err, err.stack);
  }
}

module.exports.errorResponder = errorResponder;
module.exports.errorCaster = errorCaster;
module.exports.logIfErr = logIfErr;