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
  console.error(err);
  if(err.code) {
    return res.json(err.code, err);
  }
  return res.json(500, err, err.stack);
}

module.exports.errorResponder = errorResponder;
module.exports.errorCaster = errorCaster;