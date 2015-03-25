'use strict';
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var redisClient = require('../../lib/models/redis.js');
var pubSub = require('../../lib/models/redis.js').pubSub;
var dockData = require('../../lib/models/dockData.js');
var expect = Lab.expect;
var sinon = require('sinon');
var error = require('../../lib/error');

var request = require('request');
// start app
require('../../index.js');

function dataExpect1(data, numContainers, numBuilds, host) {
  expect(data.length).to.equal(1);
  dataExpectN(data, 0, numContainers, numBuilds, host);
}

function dataExpectN(data, n, numContainers, numBuilds, host) {
  data.forEach(function(item) {
    if(item.host === host) {
      expect(item.numContainers).to.equal(numContainers);
      expect(item.numBuilds).to.equal(numBuilds);
    }
  });
}

function dataExpectNone (data) {
  expect(data.length).to.equal(0);
}

function getDocks(cb) {
  request('http://localhost:'+process.env.PORT+'/docks', function (err, response, body) {
    if (err || response.statusCode !== 200) {
      return cb(err || '200');
    }
    cb(null, JSON.parse(body));
  });
}

var host = 'http://0.0.0.0:4242';

lab.experiment('events test', function () {
  lab.beforeEach(function (done) {
    redisClient.flushall(done);
  });

  lab.experiment('runnable:docker:events:die', function () {
    lab.beforeEach(function (done) {
      dockData.addHost(host, done);
      pubSub.publish(process.env.DOCKER_EVENTS_NAMESPACE + 'start', {
        ip: '0.0.0.0',
        host: host,
        from: process.env.IMAGE_BUILDER
      });
      pubSub.publish(process.env.DOCKER_EVENTS_NAMESPACE + 'start', {
        ip: '0.0.0.0',
        host: host,
        from: 'ubuntu'
      });
    });

    lab.test('should show normal container die', function(done){
      pubSub.publish(process.env.DOCKER_EVENTS_NAMESPACE + 'die', {
        ip: '0.0.0.0',
        host: host,
        from: 'ubuntu'
      });
      getDocks(function test (err, data) {
        if (data.length === 0) { return getDocks(test); }
        dataExpect1(data, -1, 0, host);
        done();
      });
    });

    lab.test('should show build container die', function(done){
      pubSub.publish(process.env.DOCKER_EVENTS_NAMESPACE + 'die', {
        ip: '0.0.0.0',
        host: host,
        from: process.env.IMAGE_BUILDER
      });
      getDocks(function test (err, data) {
        if (data.length === 0) { return getDocks(test); }
        dataExpect1(data, 0, -1, host);
        done();
      });
    });

    lab.experiment('missing host error', function() {
      lab.test('should show build container die', function(done){
        pubSub.publish(process.env.DOCKER_EVENTS_NAMESPACE + 'die', {
          ip: '0.0.0.0',
          from: process.env.IMAGE_BUILDER
        });
        var spy = sinon.stub(error, 'log');
        getDocks(function test () {
          expect(spy.calledOnce).to.be.true();
          expect(spy.firstCall).to.exist();
          expect(spy.firstCall.args).to.exist();
          expect(spy.firstCall.args[0]).to.exist();
          expect(spy.firstCall.args[0]).to.match(/invalid data/);
          error.log.restore();
          done();
        });
      });
    });
  }); // runnable:docker:events:die

  lab.experiment('runnable:docker:events:docker_daemon_down', function () {
    lab.beforeEach(function (done) {
      dockData.addHost(host, done);
    });

    lab.test('should remove host', function(done){
      pubSub.publish(process.env.DOCKER_EVENTS_NAMESPACE + 'docker_daemon_down', {
        ip: '0.0.0.0',
        host: host,
        from: 'ubuntu'
      });
      getDocks(function test (err, data) {
        if (data.length !== 0) { return getDocks(test); }
        dataExpectNone(data);
        done();
      });
    });
    lab.experiment('missing host error', function() {
      lab.test('should show build container die', function(done){
        pubSub.publish(process.env.DOCKER_EVENTS_NAMESPACE + 'docker_daemon_down', {
          ip: '0.0.0.0',
          from: 'ubuntu'
        });
        var spy = sinon.stub(error, 'log');
        getDocks(function test () {
          expect(spy.calledOnce).to.be.true();
          expect(spy.firstCall).to.exist();
          expect(spy.firstCall.args).to.exist();
          expect(spy.firstCall.args[0]).to.exist();
          expect(spy.firstCall.args[0]).to.match(/invalid data/);
          error.log.restore();
          done();
        });
      });
    });
  }); // runnable:docker:events:docker_daemon_down

  lab.experiment('runnable:docker:events:docker_daemon_up', function () {
    lab.test('should add host', function(done){
      pubSub.publish(process.env.DOCKER_EVENTS_NAMESPACE + 'docker_daemon_up', {
        ip: '0.0.0.0',
        host: host,
        from: 'ubuntu'
      });
      getDocks(function test (err, data) {
        if (data.length === 0) { return getDocks(test); }
        dataExpect1(data, 0, 0, host);
        done();
      });
    });
    lab.experiment('missing host error', function() {
      lab.test('should show build container die', function(done){
        pubSub.publish(process.env.DOCKER_EVENTS_NAMESPACE + 'docker_daemon_up', {
          ip: '0.0.0.0',
          from: 'ubuntu'
        });
        var spy = sinon.stub(error, 'log');
        getDocks(function test () {
          expect(spy.calledOnce).to.be.true();
          expect(spy.firstCall).to.exist();
          expect(spy.firstCall.args).to.exist();
          expect(spy.firstCall.args[0]).to.exist();
          expect(spy.firstCall.args[0]).to.match(/invalid data/);
          error.log.restore();
          done();
        });
      });
    });
  }); // runnable:docker:events:docker_daemon_up
}); // events test