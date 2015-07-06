'use strict';

var bunyan = require('bunyan');

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
    }
  ],
  serializers: bunyan.stdSerializers
});
