'use strict';

require('loadenv')();

var put = require('101/put');
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var after = lab.after;
var before = lab.before;
var beforeEach = lab.beforeEach;
var Code = require('code');
var expect = Code.expect;

var createCount = require('callback-count');

var Hermes = require('runnable-hermes');
var dockData = require('../../../lib/models/dockData.js');
var Server = require('../../../lib/server.js');
var rabbitMQ = require('../../../lib/rabbitmq.js');
var WorkerServer = require('../../../lib/models/worker-server.js');
var redis = require('../../../lib/models/redis.js');

describe('on-dock-unhealthy functional test', function () {
  var testHost = 'http://10.20.1.26:4242';
  var testGihubId = 2194285;
  var ctx = {};

  before(function (done) {
    redis.connect();
    rabbitMQ.create(done);
  });
  before(function (done) {
    WorkerServer.listen(done);
  });

  before(function (done) {
    var opts = {
      hostname: process.env.RABBITMQ_HOSTNAME,
      password: process.env.RABBITMQ_PASSWORD,
      port: process.env.RABBITMQ_PORT,
      username: process.env.RABBITMQ_USERNAME,
      name: 'mavis'
    };
    ctx.rabbitClient = new Hermes(put({
      queues: [
        'on-dock-unhealthy',
        'on-dock-removed',
        'cluster-instance-provision'
      ],
    }, opts))
    // connect publisher only since ponos is handling subscriber
    .connect(done);
  });

  after(function (done) {
    ctx.rabbitClient.close(done);
  });

  lab.beforeEach(function (done) {
    redis.client.flushall(done);
  });

  beforeEach(function(done) {
    dockData.addHost(testHost, 'test,tags', done);
  });

  after(function (done) {
    WorkerServer.stop(done);
  })
  after(function (done) {
    redis.disconnect();
    rabbitMQ.close(done);
  });

  describe('on-docker-unhealthy event', function () {
    it('should remove host and publish two events', function (done) {
      var count = createCount(2, done);

      ctx.rabbitClient.subscribe('cluster-instance-provision', function (data, cb) {
        expect(data.githubId).to.equal(testGihubId);
        cb();
        count.next();
      });
      ctx.rabbitClient.subscribe('on-dock-removed', function (data, cb) {
        expect(data.host).to.equal(testHost);
        cb();
        dockData.getAllDocks(function (err, data) {
          if (err) { return count.next(err); }
          expect(data.length).to.equal(0);
          count.next();
        });
      });
      ctx.rabbitClient.publish('on-dock-unhealthy', {
        host: testHost,
        githubId: testGihubId
      });
    });
  }); // on-docker-unhealthy event
}); // end on-dock-unhealthy functional test
