'use strict';

require('loadenv')();

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var after = lab.after;
var before = lab.before;
var beforeEach = lab.beforeEach;

var dockData = require('models/dockData.js');
var server = require('server.js');
var rabbitMQ = require('rabbitmq.js');
var redisClient = require('models/redis.js');

describe('on-dock-unhealthy functional test', function () {
  var testHost = 'http://10.20.1.26:4242';
  before(function(done) {
    server.start(done);
  });
  lab.beforeEach(function (done) {
    redisClient.flushall(done);
  });
  beforeEach(function(done) {
    dockData.addHost(testHost, 'test,tags', done);
  });
  after(function(done) {
    server.stop(done);
  });

  lab.experiment('on-docker-unhealthy event', function () {
    lab.test('should remove host', function (done) {
      rabbitMQ.hermesClient.publish('on-dock-unhealthy', { host: testHost });
      function test () {
        setTimeout(function () {
          dockData.getAllDocks(function (err, data) {
            console.log('XXXX', err, data);
            if (err) { return done(err); }
            if (data && data.length !== 0) { return test(); }
            done();
          });
        }, 100);
      }
      test();
    });
  }); // on-docker-unhealthy event
}); // end on-dock-unhealthy functional test