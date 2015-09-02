'use strict';

require('loadenv')();

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var after = lab.after;
var before = lab.before;
var beforeEach = lab.beforeEach;
var Code = require('code');
var expect = Code.expect;

var createCount = require('callback-count');

var dockData = require('../../../lib/models/dockData.js');
var server = require('../../../lib/server.js');
var rabbitMQ = require('../../../lib/rabbitmq.js');
var redisClient = require('../../../lib/models/redis.js');

describe('on-dock-unhealthy functional test', function () {
  var testHost = 'http://10.20.1.26:4242';
  var testGihubId = 2194285;

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
    lab.test('should remove host and publish two events', function (done) {
      var count = createCount(2, done);

      rabbitMQ.hermesClient.subscribe('cluster-instance-provision', function (data, cb) {
        expect(data.githubId).to.equal(testGihubId);
        cb();
        count.next();
      });
      rabbitMQ.hermesClient.subscribe('on-dock-removed', function (data, cb) {
        expect(data.host).to.equal(testHost);
        cb();
        dockData.getAllDocks(function (err, data) {
          if (err) { return count.next(err); }
          expect(data.length).to.equal(0);
          count.next();
        });
      });
      rabbitMQ.hermesClient.publish('on-dock-unhealthy', {
        host: testHost,
        githubId: testGihubId
      });
    });
  }); // on-docker-unhealthy event
}); // end on-dock-unhealthy functional test