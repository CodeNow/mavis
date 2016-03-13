'use strict';

require('loadenv')('mavis:env');

var redis = require('redis');
var ErrorCat = require('error-cat');
var error = new ErrorCat();
var fs = require('fs');

var log = require('../logger').child({ module: 'mavis:redis' });

module.exports = Redis;

/**
 * Module in charge of redis connection
 *  client and pubSub are singletons
 */
function Redis () { }

/**
 * normal redis client
 * @type {Object}
 */
Redis.client = null;

/**
 * creates and connects client and pubSub to redis
 * setup error handlers
 */
Redis.connect = function () {
  log.info({
    redisPort: process.env.REDIS_PORT,
    redisAddr: process.env.REDIS_IPADDRESS
  }, 'connect');

  var redisOptions = {
    host: process.env.REDIS_IPADDRESS,
    port: process.env.REDIS_PORT,
    connect_timeout: 5000 // 5 seconds
  };

  if (process.env.REDIS_CACERT) {
    try {
      // giving an encoding makes this a string
      var ca = fs.readFileSync(process.env.REDIS_CACERT, 'utf-8');
      redisOptions.tls = {
        rejectUnauthorized: true,
        ca: [ ca ]
      }
    } catch (err) {
      log.warn({
        cacert: process.env.REDIS_CACERT,
        err: err
      }, 'redis cert provided but could not be read');
    }
  }

  Redis.client = redis.createClient(redisOptions);

  Redis.client.on('error', Redis._handleError);
};

/**
 * disconnect all redis connections
 */
Redis.disconnect = function () {
  log.info('disconnect');
  Redis.client.quit();
};

/**
 * reports errors on clients
 */
Redis._handleError = function (err) {
  log.error({ err: err }, 'setup');
  throw error.createAndReport(502, 'Redis error', err);
};
