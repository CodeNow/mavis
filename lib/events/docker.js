'use strict';
require('../loadenv.js')();

var dockData = require('../models/dockData.js');
var error = require('../error.js');
var debug = require('debug')('mavis:events:docker:');

function handleStart(data) {
  debug('handleStart', data);
  if (!isContainerDataValid(data)) {
    return error.log('invalid data', data);
  }
  var host = encodeHostFromIp(data.ip);
  var type = getTypeFromImage(data.from);
  var inc = 1;

  dockData.incKey(host, type, inc, error.logIfErr);
}

function handleDie(data) {
  debug('handleDie', data);
  if (!isContainerDataValid(data)) {
    return error.log('invalid data', data);
  }
  var host = encodeHostFromIp(data.ip);
  var type = getTypeFromImage(data.from);
  var inc = -1;

  dockData.incKey(host, type, inc, error.logIfErr);
}

function handleDockDown(data) {
  debug('handleDockDown', data);
  if (!isIpValid(data)) {
    return error.log('invalid data', data);
  }
  var host = encodeHostFromIp(data.ip);

  dockData.deleteHost(host, error.logIfErr);
}

function handleDockUp(data) {
  debug('handleDockUp', data);
  if (!isIpValid(data)) {
    return error.log('invalid data', data);
  }
  var host = encodeHostFromIp(data.ip);

  dockData.addHost(host, error.logIfErr);
}

/**
 * turns ip into properly formatted host
 * @param  'string' ip ip to convert
 * @return 'string'    converted string
 */
function encodeHostFromIp(ip) {
  return 'http://' + ip + ':4242';
}

/**
 * returns key type based on image name
 * @param  'string' image image name
 * @return 'string'        type
 */
function getTypeFromImage (image) {
  if (!image.indexOf(process.env.IMAGE_BUILDER)) {
    return 'container_build';
  } else {
    return 'container_run';
  }
}

/**
 * check if data from a container event is valid
 * @param  {object}  data validated data
 * @return {Boolean}      true if valid else false
 */
function isContainerDataValid (data) {
  if (!data ||
    typeof data.from !== 'string' ||
    !isIpValid(data)) {
      return false;
  }

  return true;
}

/**
 * ensures data has ip address
 * @param  {[type]}  data [description]
 * @return {Boolean}      [description]
 */
function isIpValid (data) {
  if (!data ||
    !data.ip ||
    typeof data.ip !== 'string') {
      return false;
  }

  return true;
}

module.exports.handleStart = handleStart;
module.exports.handleDie = handleDie;
module.exports.handleDockDown = handleDockDown;
module.exports.handleDockUp = handleDockUp;