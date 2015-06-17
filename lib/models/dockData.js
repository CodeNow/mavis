'use strict';
/**
 * Docker Data is formated link so:
 * numBuilds:       num builds running on system
 * numContainers    num container running on system
 * host:            full url to host docker instance
 * krainHost:       full url to krain
 * filibusterHost:  full url to filibuster
 */

var redisClient = require('./redis.js');
var error = require('../error.js');
var debug = require('debug')('mavis:dockData:model');

function getAllDocks (cb) {
  // get data about docks
  var host = augmentHost('*');
  debug('getAllDocks', host);
  redisClient.keys(host, function (err, keys) {
    if (err) { return cb(err); }
    var multi = redisClient.multi();
    keys.forEach(function (data) {
      multi.hgetall(data);
    });
    multi.exec(cb);
  });
}

/**
 * gets valid docks and also filter by tags
 * @param {string}   comma separated list of tags
 * @param {Function} cb   (err, arrayOfDocks)
 */
function getValidDocks (tags, cb) {
  debug('getValidDocks:tags', tags);
  getAllDocks(function (err, docks) {
    if (err) { return cb(err); }
    // filter for only valid docks
    debug('getValidDocks:all docks', docks);
    docks = docks.filter(function (host) {
      if (host && host.host && host.numBuilds && host.numContainers) {
        host.numContainers = parseInt(host.numContainers);
        host.numBuilds = parseInt(host.numBuilds);
        return true;
      }
      return false;
    });
    debug('getValidDocks:docks after filter', docks);
    if (typeof tags === 'string') {
      var tagArray = tags.split(',');
      docks = docks.filter(function(dock) {
        if (!dock.tags) { return false; }
        var dockTagArray = dock.tags.split(',');
        return dockTagArray.some(function(currentTag) {
          return ~tagArray.indexOf(currentTag);
        });
      });
    } else {
      debug('getValidDocks:invalid tag type', tags, typeof tags);
    }
    debug('getValidDocks:returning after filter tags', docks);
    cb(null, docks);
  });
}

function incKey (host, type, amount, cb) {
  debug('incKey', host, type, amount);
  host = augmentHost(host);
  // update redis of new selection
  var key = '';
  if (type === 'container_run') {
    key = 'numContainers';
  } else {
    key = 'numBuilds';
  }
  redisClient.exists(host, function(err, data) {
    if (err) { return cb(err); }
    if (data === '0') { return cb(error.create('key does not exist')); }
    redisClient.hincrby(host, key, amount, cb);
  });
}

function setKey (host, field, value, cb) {
  debug('setKey', host, field, value);
  host = augmentHost(host);
  redisClient.hset(host, field, value, cb);
}

function deleteHost (host, cb) {
  debug('deleteHost', host);
  host = augmentHost(host);
  redisClient.del(host, cb);
}

/**
 * saves host and attributes to db
 * @param {string}   host url of host including protocol and port
 * @param {string}   comma separated list of tags
 * @param {Function} cb   (err)
 */
function addHost(host, tags, cb) {
  tags = tags || '';
  debug('addHost', host, 'tags', tags);
  redisClient.hmset(
    augmentHost(host),
    'numContainers', '0',
    'numBuilds', '0',
    'host', host,
    'tags', tags,
    cb);
}

// helpers
function augmentHost(host) {
  debug('augmentHost', host);
  return process.env.REDIS_HOST_KEYS + host;
}

module.exports.getAllDocks = getAllDocks;
module.exports.getValidDocks = getValidDocks;
module.exports.incKey = incKey;
module.exports.setKey = setKey;
module.exports.deleteHost = deleteHost;
module.exports.addHost = addHost;
