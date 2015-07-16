'use strict';

var redisClient = require('./redis.js');
var error = require('../error.js');
var log = require('../logger').child({ module: 'model:dockData' });

/**
 * Model for fetching and mutating dock data stored in redis. Data for each dock
 * contains the following fields:
 *
 *    numBuilds        num builds running on system
 *    numContainers    num container running on system
 *    host             full url to host docker instance
 *    krainHost        full url to krain
 *    filibusterHost   full url to filibuster
 *
 * @module mavis:dock-data
 */
module.exports = {
  getAllDocks: getAllDocks,
  getValidDocks: getValidDocks,
  incKey: incKey,
  setKey: setKey,
  deleteHost: deleteHost,
  addHost: addHost
};

/**
 * Constructs a list of all docks and yields it to the given callback.
 * @param {function} cb Callback to execute once the docks list has been
 *                      constructed.
 */
function getAllDocks (cb) {
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
 * Constructs a list of all valid docks filtered by the given tags.
 * @param {string} tags A comma separated list of tags.
 * @param {Function} cb Callback to execute with the resulting list of docks.
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
      }, 'Invalid tag type: ' + (typeof tags));
    }

    log.trace({ docks: docks, tags: tags }, 'Filtered docks by tag');

    cb(null, docks);
  });
}

/**
 * Increments or decrements a dock's redis counter. These are used to keep
 * track of the number of concurrent builds and running containers on a dock.
 * @param {string} host Hostname of the dock.
 * @param {string} type Type of the counter to increment (can be `container_run`
 *                      or `container_build`)
 * @param {number} amount Amount by which to increment the counter.
 * @param {function} cb Callback to execute when the counter has been
 *                      incremented.
 */
function incKey (host, type, amount, cb) {
  log.trace({ host: host, type: type, amount: amount }, 'Incrementing key');
  host = augmentHost(host);
  var key = (type === 'container_run') ? 'numContainers' : 'numBuilds';
  redisClient.exists(host, function(err, data) {
    if (err) { return cb(err); }
    if (data === '0') { return cb(error.create('key does not exist')); }
    redisClient.hincrby(host, key, amount, cb);
  });
}

/**
 * Sets a specific field to the given value on a dock's data in redis.
 * @param {string} host Hostname of the dock.
 * @param {string} field Name of the field to set.
 * @param {mixed} value Value to set for the field.
 * @param {function} cb Callback to execute after the field has been set.
 */
function setKey (host, field, value, cb) {
  log.trace({ host: host, field: field, value: value }, 'Setting key');
  host = augmentHost(host);
  redisClient.hset(host, field, value, cb);
}

/**
 * Delete's a docker host model from redis.
 * @param {string} host Hostname of the dock.
 */
function deleteHost (host, cb) {
  log.trace({ host: host }, 'Deleting host: ' + host);
  host = augmentHost(host);
  redisClient.del(host, cb);
}

/**
 * Creates a new host data and saves it to the redis instance.
 * @param {string} host Address of the host including protocol and port.
 * @param {string} tags Comma separated list of tags
 * @param {Function} cb Callback to execute once the host has been added.
 */
function addHost(host, tags, cb) {
  tags = (tags || '').split(',').map(function (item) {
    return item.trim();
  }).join(',');

  log.trace({ host: host, tags: tags }, 'Adding host');

  redisClient.hmset(
    augmentHost(host),
    'numContainers', '0',
    'numBuilds', '0',
    'host', host,
    'tags', tags,
    cb
  );
}

/**
 * Augments a given host name by prepending the redis host keys.
 * @param {string} host Host to augment.
 * @return {string} The augmented host.
 */
function augmentHost(host) {
  var augmented = process.env.REDIS_HOST_KEYS + host;
  log.trace({ host: host, augmented: augmented }, 'Augmenting host: ' + host);
  return augmented;
}
