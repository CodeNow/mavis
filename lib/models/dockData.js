'use strict';
/**
 * Docker Data is formated link so:
 * numBuilds:     num builds running on system
 * numContainers  num container running on system
 * host:          full url to host docker instance
 */

var redisClient = require('./redis.js');

function getAllDocks (cb) {
  // get data about docks
  redisClient.lrange(process.env.REDIS_HOST_KEYS, 0, -1, function(err, keys) {
    if (err) { return cb(err); }

    var multi = redisClient.multi();
    keys.forEach(function(data) {
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
    data.forEach(function (data) {
      if (data && data.host && data.numBuilds && data.numContainers) {
        data.numContainers = parseInt(data.numContainers);
        data.numBuilds = parseInt(data.numBuilds);
        filteredData.push(data);
      }
    });
    cb(null, filteredData);
  });
}

function incKey (host, type, amount, cb) {
  // update redis of new selection
  var key = '';
  if (type === 'container_run') {
    key = 'numContainers';
  } else {
    key = 'numBuilds';
  }
  redisClient.hincrby(host, key, amount, cb);
}

module.exports.getAllDocks = getAllDocks;
module.exports.getValidDocks = getValidDocks;
module.exports.incKey = incKey;
