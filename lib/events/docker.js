'use strict';
var dockData = require('../models/dockData.js');
var error = require('../error.js');

function handleStart(data) {
  var host = encodeHostFromIp(data.ip);
  var inc = 1;
  var type = getTypeFromImage(data.from);

  dockData.incKey(host, type, inc, error.logIfErr);
}

function handleDie(data) {
  var host = encodeHostFromIp(data.ip);
  var inc = -1;
  var type = getTypeFromImage(data.from);

  dockData.incKey(host, type, inc, error.logIfErr);
}

function handleDockDown(data) {
  var host = encodeHostFromIp(data.ip);

  dockData.deleteHost(host, error.logIfErr);
}

function handleDockUp(data) {
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
  if (!image.indexOf('runnable/image-builder')) {
    return 'container_build';
  } else {
    return 'container_run';
  }
}

module.exports.handleStart = handleStart;
module.exports.handleDie = handleDie;
module.exports.handleDockDown = handleDockDown;
module.exports.handleDockUp = handleDockUp;