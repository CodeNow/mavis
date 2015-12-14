'use strict';

require('loadenv')();

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;
var Code = require('code');
var expect = Code.expect;

var createCount = require('callback-count');
var nock = require('nock');
var redis = require('redis');
var Dockerode = require('dockerode');
var sinon = require('sinon');

var Hermes = require('runnable-hermes');
var dockData = require('../../../lib/models/dockData.js');
var Server = require('../../../lib/server.js');
var sampleSwarmInfoRes = require('../../fixtures/sampleSwarmInfoRes.js');
var server = new Server();

var publishedEvents = [
  'container.life-cycle.died',
  'docker.events-stream.connected',
  'docker.events-stream.disconnected'
];

var subscribedEvents = [
  'dock.removed'
];

var queues = [
  'weave.start',
  'on-dock-unhealthy',
  'cluster-instance-provision'
];

var testPublisher = new Hermes({
  hostname: process.env.RABBITMQ_HOSTNAME,
  password: process.env.RABBITMQ_PASSWORD,
  port: process.env.RABBITMQ_PORT,
  username: process.env.RABBITMQ_USERNAME,
  publishedEvents: publishedEvents,
  queues: queues,
  name: 'testPublisher'
});

var testSubscriber = new Hermes({
  hostname: process.env.RABBITMQ_HOSTNAME,
  password: process.env.RABBITMQ_PASSWORD,
  port: process.env.RABBITMQ_PORT,
  username: process.env.RABBITMQ_USERNAME,
  subscribedEvents: subscribedEvents,
  queues: queues,
  name: 'testSubscriber'
});

var testRedis = redis.createClient(
  process.env.REDIS_PORT,
  process.env.REDIS_IPADDRESS);


describe('lib/workers/on-dock-unhealthy functional test', function () {
  var testHost = 'http://10.20.1.26:4242';
  var testGihubId = 2194285;

  beforeEach(function (done) {
    // connect publisher so exchanges are generated before sever init
    testPublisher.connect(done);
  });

  beforeEach(function (done) {
    server.start(done);
  });

  beforeEach(function (done) {
    // connect subscriber after server has started
    testSubscriber.connect(done);
  });

  lab.beforeEach(function (done) {
    // nock swarm call
    sinon.stub(Dockerode.prototype, 'info')
      .yieldsAsync(null, sampleSwarmInfoRes([]));

    testRedis.flushall(done);
  });

  beforeEach(function(done) {
    dockData.addHost(testHost, 'test,tags', done);
  });

  afterEach(function (done) {
    Dockerode.prototype.info.restore();
    testSubscriber.close(done);
  });

  afterEach(function (done) {
    testPublisher.close(done);
  });

  afterEach(function (done) {
    server.stop(done);
  });

  describe('on-docker-unhealthy event', function () {
    var killRouteNock;

    beforeEach(function (done) {
      killRouteNock = nock(testHost).post('/containers/swarm/kill');
      done();
    });

    it('should remove host and publish two events', function (done) {
      killRouteNock.reply(200);
      var count = createCount(2, done);

      testSubscriber.subscribe('cluster-instance-provision', function (data, cb) {
        expect(data.githubId).to.equal(testGihubId);
        cb();
        count.next();
      });

      testSubscriber.subscribe('dock.removed', function (data, cb) {
        expect(data.host).to.equal(testHost);
        cb();
        dockData.getAllDocks(function (err, data) {
          if (err) { return count.next(err); }
          expect(data.length).to.equal(0);
          count.next();
        });
      });

      testPublisher.publish('on-dock-unhealthy', {
        host: testHost,
        githubId: testGihubId
      });
    });

    it('should remove host and publish two events if kill errors', function (done) {
      killRouteNock.reply(404);
      var count = createCount(2, done);

      testSubscriber.subscribe('cluster-instance-provision', function (data, cb) {
        expect(data.githubId).to.equal(testGihubId);
        cb();
        count.next();
      });

      testSubscriber.subscribe('dock.removed', function (data, cb) {
        expect(data.host).to.equal(testHost);
        cb();
        dockData.getAllDocks(function (err, data) {
          if (err) { return count.next(err); }
          expect(data.length).to.equal(0);
          count.next();
        });
      });

      testPublisher.publish('on-dock-unhealthy', {
        host: testHost,
        githubId: testGihubId
      });
    });
  }); // on-docker-unhealthy event
}); // end on-dock-unhealthy functional test
