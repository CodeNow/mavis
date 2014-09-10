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

function getAllDocks (cb) {
  // get data about docks
  var host = augmentHost('*');
  redisClient.keys(host, function (err, keys) {
    if (err) { return cb(err); }

    var multi = redisClient.multi();
    keys.forEach(function (data) {
      multi.hgetall(data);
    });
    multi.exec(cb);
  });
}

function getValidDocks (cb) {
  getAllDocks(function (err, data) {
    if (err) { return cb(err); }

    // filter for only valid data
    var filteredData = [];
    data.forEach(function (host) {
      if (host && host.host && host.numBuilds && host.numContainers) {
        host.numContainers = parseInt(host.numContainers);
        host.numBuilds = parseInt(host.numBuilds);
        filteredData.push(host);
      }
    });
    cb(null, filteredData);
  });
}

function incKey (host, type, amount, cb) {
  host = augmentHost(host);
  // update redis of new selection
  var key = '';
  if (type === 'container_run') {
    key = 'numContainers';
  } else {
    key = 'numBuilds';
  }
  redisClient.hincrby(host, key, amount, cb);
}

function setKey (host, field, value, cb) {
  host = augmentHost(host);
  redisClient.hset(host, field, value, cb);
}

function deleteHost (host, cb) {
  host = augmentHost(host);
  redisClient.del(host, cb);
}

function addHost(host, cb) {
  redisClient.hmset(
    augmentHost(host),
    'numContainers', '0',
    'numBuilds', '0',
    'host', host,
    cb);
}

// helpers
function augmentHost(host) {
  return process.env.REDIS_HOST_KEYS + host;
}

module.exports.getAllDocks = getAllDocks;
module.exports.getValidDocks = getValidDocks;
module.exports.incKey = incKey;
module.exports.setKey = setKey;
module.exports.deleteHost = deleteHost;
module.exports.addHost = addHost;
