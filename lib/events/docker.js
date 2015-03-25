'use strict';
require('../loadenv.js')();

var dockData = require('../models/dockData.js');
var error = require('../error.js');
var debug = require('debug')('mavis:events:docker:');

function handleDie(data) {
  debug('handleDie', data);
  if (!hasValidFrom(data) || !hasValidHost(data)) {
    return error.log('invalid data', data);
  }
  var host = data.host;
  var type = getTypeFromImage(data.from);
  var inc = -1;

  dockData.incKey(host, type, inc, error.logIfErr);
}

function handleDockDown(data) {
  debug('handleDockDown', data);
  if (!hasValidHost(data)) {
    return error.log('invalid data', data);
  }
  var host = data.host;

  dockData.deleteHost(host, error.logIfErr);
}

function handleDockUp(data) {
  debug('handleDockUp', data);
  if (!hasValidHost(data)) {
    return error.log('invalid data', data);
  }
  var host = data.host;

  dockData.addHost(host, error.logIfErr);
}

/**
 * returns key type based on image name
 * @param  'string' image image name
 * @return 'string'        type
 */
function getTypeFromImage (image) {
  return image === process.env.IMAGE_BUILDER ? 'container_build' : 'container_run';
}

/**
 * check if data from a container event is valid
 * @param  {object}  data validated data
 * @return {Boolean}      true if valid else false
 */
function hasValidFrom (data) {
  if (!data ||
    typeof data.from !== 'string') {
      return false;
  }

  return true;
}

/**
 * ensures data has ip address
 * @param  {[type]}  data [description]
 * @return {Boolean}      [description]
 */
function hasValidHost (data) {
  if (!data ||
    typeof data.host !== 'string') {
      return false;
  }

  return true;
}

module.exports.handleDie = handleDie;
module.exports.handleDockDown = handleDockDown;
module.exports.handleDockUp = handleDockUp;