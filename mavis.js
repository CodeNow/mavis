'use strict';
/** scheduler
  params per box
    # builds acceptable/building
    # containres possible/running
    has hint.prevDock
*/
require('./loadenv')();
var redis = require('redis');
var redisClient = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_IPADDRESS);
var error = require('./error.js').errorCaster;

function obtainOptimalHost (hint, cb) {
  // check data
  if (!hint || !hint.type) {
    return cb(error(400, 'no type specified'));
  }
  if (hint.type !== 'container_run' && hint.type !== 'container_build') {
    return cb(error(400, 'cannot handle type '+hint.type));
  }
  getData(function(err, currentStates) {
    if (err) {
      return cb(err);
    }
    processData(hint, currentStates, function (err, host) {
      if (err) {
        return cb(err);
      }
      updateData(host, hint.type, function() {
        cb(null, host);
      });
    });
  });
}

function updateData (host, type, cb) {
  // update redis of new selection
  var key = '';
  if (type === 'container_run') {
    key = 'numContainers';
  } else {
    key = 'numBuilds';
  }
  redisClient.hincrby(host, key, 1, function(err) {
    if (err) {
      return cb(err);
    }
    cb(null);
  });
}

function processData (hint, currentStates, cb) {
  if (currentStates.length <= 0) {
    return cb(error(404, 'no docks avalible'));
  }
  // take info about docks and maps jobs do them
  var optimalDock = currentStates.reduce(function (prevDockData, dockData) {
    dockData.weight = formulateWeight(hint, dockData);
    if (typeof prevDockData !== 'object') {
      return dockData;
    }
    return dockData.weight < prevDockData.weight ? dockData : prevDockData;
  }, 0);
  cb(null, optimalDock.host);
}

function formulateWeight (hint, info, cb) {
  var weight = info.numBuilds * process.env.BUILD_WEIGHT;
  weight += info.numContainers * process.env.CONTAINER_WEIGHT;
  if(hint && info.host !== hint.prevDock) {
    weight += process.env.HISTORY_WEIGHT;
  }
  return weight;
}

function getData (cb) {
  var currentStates = {};
  // get data about docks
  redisClient.lrange(process.env.REDIS_HOST_KEYS, 0, -1, function(err, keys) {
    if (err) {
      return cb(err);
    }
    var multi = redisClient.multi();
    keys.forEach(function(data) {
      multi.hgetall(data);
    });
    multi.exec(function (err, states) {
      if (err) {
        return cb(err);
      }
      // filter for only valid data
      return filterDockData(states, cb);
    });
  });
}

function filterDockData (data, cb) {
  var filteredData = [];
  data.forEach(function (data) {
    if (data && data.host && data.numBuilds && data.numContainers) {
      data.numContainers = parseInt(data.numContainers);
      data.numBuilds = parseInt(data.numBuilds);
      filteredData.push(data);
    }
  });
  cb(null, filteredData);
}

module.exports.obtainOptimalHost = obtainOptimalHost;