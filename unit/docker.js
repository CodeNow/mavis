'use strict';
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var redis = require('redis');
var redisClient = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_IPADDRESS);
var redisPubSub = require('redis-pubsub-emitter');
var emitter = redisPubSub.createClient(process.env.REDIS_PORT, process.env.REDIS_IPADDRESS);
var dockerEvent = require('../lib/events/docker.js');
var dockData = require('../lib/models/dockData.js');

lab.experiment('docker events', function () {
  lab.beforeEach(function (done) {
    dockerEvent.listen();
    redisClient.flushall(done);
  });
  lab.afterEach(function (done) {
    dockerEvent.stop();
    redisClient.flushall(done);
  });

  lab.experiment('listen', function () {
    lab.before(function (done) {
      dockData.addHost('http://0.0.0.0:4242', done);
    });
    lab.test('should handle runnable:docker:start normal container', function (done) {
      emitter.on('runnable:docker:start', function() {
        dockData.getAllDocks(function() {
          console.log(arguments);
        });
        done();
      });
      emitter.publish('runnable:docker:start', {
        container: 'container_id',
        ip: '0.0.0.0',
        from: 'anandkumarpatel/best'
      });
    });

  }); // listen
}); // docker events