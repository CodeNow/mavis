'use strict';
var dotenv = require('dotenv');
var eson = require('eson');
var path = require('path');
var env = process.env.NODE_ENV;
var read = false;

module.exports = function readDotEnvConfigs () {
  if (read === true) {
    return;
  }
  read = true;
  dotenv._getKeysAndValuesFromEnvFilePath(path.resolve(__dirname, './configs/.env.'+ env));
  dotenv._setEnvs();
  dotenv.load();

  process.env = eson()
    .use(convertStringToNumeral)
    .parse(JSON.stringify(process.env));
};

function convertStringToNumeral(key, val) {
  if (typeof val === 'string' && ! isNaN(val)) {
    return parseInt(val);
  } else {
    return val;
  }
}