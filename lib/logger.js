'use strict';

var bunyan = require('bunyan');
var RedisTransport = require('bunyan-redis');

/**
 * Bunyan logger for mavis.
 * @author Ryan Sandor Richards
 * @module mavis:logger
 */
module.exports = bunyan.createLogger({
  name: 'mavis',
  streams: [
    {
      level: process.env.LOG_LEVEL,
      stream: process.stdout
    },
    {
      type: 'raw',
      level: process.env.LOG_REDIS_LEVEL,
      stream: new RedisTransport({
        container: process.env.LOG_REDIS_KEY,
        host: process.env.LOG_REDIS_HOST,
        port: process.env.LOG_REDIS_PORT
      })
    }
  ],
  serializers: bunyan.stdSerializers
});
