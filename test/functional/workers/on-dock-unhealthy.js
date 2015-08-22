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
    lab.test('should remove host and public on-dock-removed', function (done) {
      rabbitMQ.hermesClient.publish('on-dock-unhealthy', { host: testHost });
      rabbitMQ.hermesClient.subscribe('on-dock-removed', function (data, cb) {
        expect(data.host).to.equal(testHost);
        cb();
        dockData.getAllDocks(function (err, data) {
          if (err) { return done(err); }
          expect(data.length).to.equal(0);
          done();
        });
      });
    });
  }); // on-docker-unhealthy event
}); // end on-dock-unhealthy functional test