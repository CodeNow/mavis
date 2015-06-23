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
var log = require('../logger').child({ module: 'model:dockData' });

module.exports = {
  getAllDocks: getAllDocks,
  getValidDocks: getValidDocks,
  incKey: incKey,
  setKey: setKey,
  deleteHost: deleteHost,
  addHost: addHost
};

function getAllDocks (cb) {
  // get data about docks
  var host = augmentHost('*');
  log.debug({ host: host }, 'Get all docks for host: ' + host);
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
  log.debug({ tags: tags }, 'Fetching valid docks');

  getAllDocks(function (err, docks) {
    if (err) { return cb(err); }

    log.trace({ docks: docks }, 'Got all docks');

    // filter for only valid docks
    docks = docks.filter(function (host) {
      if (host && host.host && host.numBuilds && host.numContainers) {
        host.numContainers = parseInt(host.numContainers);
        host.numBuilds = parseInt(host.numBuilds);
        return true;
      }
      return false;
    });

    log.trace({ docks: docks }, 'Filtered to valid docks');

    if (typeof tags === 'string') {
      var tagArray = tags.split(',').map(function (item) {
        return item.trim();
      });
      docks = docks.filter(function(dock) {
        if (!dock.tags) { return false; }
        var dockTagArray = dock.tags.split(',');
        return dockTagArray.some(function(currentTag) {
          return ~tagArray.indexOf(currentTag);
        });
      });
    } else {
      log.debug({
        tags: tags,
        type: (typeof tags)
      }, 'Invalid tag type: ' + (typeof tags))
    }

    log.trace({ docsk: docks, tags: tags }, 'Filtered docks by tag');

    cb(null, docks);
  });
}

function incKey (host, type, amount, cb) {
  host = augmentHost(host);

  log.trace({
    host: host,
    type: type,
    amount: amount
  }, 'Incrementing key');

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
  log.trace({
    host: host,
    field: field,
    value: value
  }, 'Setting key');
  host = augmentHost(host);
  redisClient.hset(host, field, value, cb);
}

function deleteHost (host, cb) {
  log.trace({ host: host }, 'Deleting host: ' + host);
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
  // sanitize tags
  tags = tags.split(',').map(function (item) {
    return item.trim();
  }).join(',');

  log.trace({ host: host, tags: tags }, 'Adding host');

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
  var augmented = process.env.REDIS_HOST_KEYS + host;
  log.trace({
    host: host,
    augmented: augmented
  }, 'Augmenting host: ' + host);
  return augmented;
}
