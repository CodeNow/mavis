'use strict';

require('loadenv')('mavis:env');

var redis = require('redis');
var redisPubSub = require('redis-pubsub-emitter');

var port = process.env.REDIS_PORT;
var host = process.env.REDIS_IPADDRESS;

module.exports = redis.createClient(port, host);
module.exports.pubSub = redisPubSub.createClient(port, host);
