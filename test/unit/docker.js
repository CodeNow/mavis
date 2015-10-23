'use strict';

require('loadenv')('mavis:env');

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var redisClient = require('../../lib/models/redis.js');
var dockerEvents = require('../../lib/events/docker.js');
var dockData = require('../../lib/models/dockData.js');
var host = 'http://0.0.0.0:4242';
var Code = require('code');
var expect = Code.expect;

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

lab.experiment('docker.js unit test', function () {
  lab.beforeEach(function (done) {
    redisClient.flushall(done);
  });

  lab.experiment('deamon', function () {
    lab.experiment('handleDockUp', function () {
      lab.test('should add host without tags', function (done) {
        dockerEvents.handleDockUp({
          ip: '0.0.0.0',
          host: host
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '0', '0', host);
          done();
        });
      });
      lab.test('should add host with tags', function (done) {
        var tags = 'test,tags';
        dockerEvents.handleDockUp({
          ip: '0.0.0.0',
          host: host,
          tags: tags
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          expect(data[0].tags).to.equal(tags);
          dataExpect1(data, '0', '0', host);
          done();
        });
      });

      lab.test('should add host only once', function (done) {
        dockerEvents.handleDockUp({
          ip: '0.0.0.0',
          host: host
        });
        dockerEvents.handleDockUp({
          ip: '0.0.0.0',
          host: host
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '0', '0', host);
          done();
        });
      });

      lab.test('should add different hosts', function (done) {
        dockerEvents.handleDockUp({
          ip: '0.0.0.0',
          host: host
        });
        dockerEvents.handleDockUp({
          ip: '0.0.1.0',
          host: 'http://0.0.1.0:4242'
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          expect(data.length).to.equal(2);
          dataExpectN(data, 1, '0', '0', host);
          dataExpectN(data, 0, '0', '0', 'http://0.0.1.0:4242');
          done();
        });
      });

      lab.test('should not add host if data invalid', function (done) {
        dockerEvents.handleDockUp({
          ip: null
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpectNone(data);
          done();
        });
      });
      lab.test('should not add host if invalid data', function (done) {
        dockerEvents.handleDockUp(null);
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpectNone(data);
          done();
        });
      });
    }); // handleDockUp

    lab.experiment('handleDockDown', function () {
      lab.beforeEach(function(done) {
        dockerEvents.handleDockUp({
          ip: '0.0.0.0',
          host: host
        });
        done();
      });
      lab.test('should remove host', function (done) {
        dockerEvents.handleDockDown({
          ip: '0.0.0.0',
          host: host
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpectNone(data);
          done();
        });
      });
      lab.test('should do nothing if host removed twice', function (done) {
        dockerEvents.handleDockDown({
          ip: '0.0.0.0',
          host: host
        });
        dockerEvents.handleDockDown({
          ip: '0.0.0.0',
          host: host
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpectNone(data);
          done();
        });
      });
      lab.test('should not remove host if diff ip', function (done) {
        dockerEvents.handleDockDown({
          ip: '0.0.1.0',
          host: 'http://0.0.1.0:4242'
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '0', '0', host);
          done();
        });
      });
      lab.test('should not remove host if invalid ip', function (done) {
        dockerEvents.handleDockDown({
          ip: null
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '0', '0', host);
          done();
        });
      });
      lab.test('should not remove host if invalid data', function (done) {
        dockerEvents.handleDockDown(null);
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '0', '0', host);
          done();
        });
      });
    }); // handleDockDown
  }); // deamon
}); // docker events
