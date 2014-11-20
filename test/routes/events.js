'use strict';
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var redisClient = require('../../lib/models/redis.js');
var pubSub = require('../../lib/models/redis.js').pubSub;
var dockData = require('../../lib/models/dockData.js');

var request = require('request');
// start app
require('../../index.js');


function dataExpect1(data, numContainers, numBuilds, host) {
  Lab.expect(data.length).to.equal(1);
  dataExpectN(data, 0, numContainers, numBuilds, host);
}

function dataExpectN(data, n, numContainers, numBuilds, host) {
  Lab.expect(data[n].numContainers).to.equal(numContainers);
  Lab.expect(data[n].numBuilds).to.equal(numBuilds);
  Lab.expect(data[n].host).to.equal(host);
}

function dataExpectNone (data) {
  Lab.expect(data.length).to.equal(0);
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

  lab.experiment('runnable:docker:start', function () {
    lab.beforeEach(function (done) {
      dockData.addHost(host, done);
    });

    lab.test('should show normal container start', function(done){
      pubSub.publish('runnable:docker:start', {
        ip: '0.0.0.0',
        from: 'ubuntu'
      });
      getDocks(function test(err, data) {
        if (data.length === 0) { return getDocks(test); }
        dataExpect1(data, 1, 0, host);
        done();
      });
    });

    lab.test('should show build container start', function(done){
      pubSub.publish('runnable:docker:start', {
        ip: '0.0.0.0',
        from: process.env.IMAGE_BUILDER
      });
      getDocks(function test(err, data) {
        if (data.length === 0) { return getDocks(test); }
        dataExpect1(data, 0, 1, host);
        done();
      });
    });
  }); // runnable:docker:start

  lab.experiment('runnable:docker:die', function () {
    lab.beforeEach(function (done) {
      dockData.addHost(host, done);
      pubSub.publish('runnable:docker:start', {
        ip: '0.0.0.0',
        from: process.env.IMAGE_BUILDER
      });
      pubSub.publish('runnable:docker:start', {
        ip: '0.0.0.0',
        from: 'ubuntu'
      });
    });

    lab.test('should show normal container die', function(done){
      pubSub.publish('runnable:docker:die', {
        ip: '0.0.0.0',
        from: 'ubuntu'
      });
      getDocks(function test(err, data) {
        if (data.length === 0) { return getDocks(test); }
        dataExpect1(data, 0, 1, host);
        done();
      });
    });

    lab.test('should show build container die', function(done){
      pubSub.publish('runnable:docker:die', {
        ip: '0.0.0.0',
        from: process.env.IMAGE_BUILDER
      });
      getDocks(function test(err, data) {
        if (data.length === 0) { return getDocks(test); }
        dataExpect1(data, 1, 0, host);
        done();
      });
    });
  }); // runnable:docker:die

  lab.experiment('runnable:docker:docker_daemon_down', function () {
    lab.beforeEach(function (done) {
      dockData.addHost(host, done);
    });

    lab.test('should remove host', function(done){
      pubSub.publish('runnable:docker:docker_daemon_down', {
        ip: '0.0.0.0',
        from: 'ubuntu'
      });
      getDocks(function test(err, data) {
        if (data.length !== 0) { return getDocks(test); }
        dataExpectNone(data);
        done();
      });
    });
  }); // runnable:docker:docker_daemon_down

  lab.experiment('runnable:docker:docker_daemon_up', function () {
    lab.test('should add host', function(done){
      pubSub.publish('runnable:docker:docker_daemon_up', {
        ip: '0.0.0.0',
        from: 'ubuntu'
      });
      getDocks(function test(err, data) {
        if (data.length === 0) { return getDocks(test); }
        dataExpect1(data, 0, 0, host);
        done();
      });
    });
  }); // runnable:docker:docker_daemon_up
}); // events test