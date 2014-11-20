'use strict';
require('../../lib/loadenv.js')();

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var redisClient = require('../../lib/models/redis.js');
var dockerEvents = require('../../lib/events/docker.js');
var dockData = require('../../lib/models/dockData.js');

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

lab.experiment('docker.js unit test', function () {
  lab.beforeEach(function (done) {
    redisClient.flushall(done);
  });

  lab.experiment('container', function () {
    lab.beforeEach(function (done) {
      dockData.addHost('http://0.0.0.0:4242', done);
    });
    lab.experiment('handleStart', function () {
      lab.test('should handle normal container start', function (done) {
        dockerEvents.handleStart({
          ip: '0.0.0.0',
          from: 'ubuntu'
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '0', 'http://0.0.0.0:4242');
          done();
        });
      });

      lab.test('should handle normal container start invalid ip', function (done) {
        dockerEvents.handleStart({
          ip: null,
          from: 'ubuntu'
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '0', '0', 'http://0.0.0.0:4242');
          done();
        });
      });

      lab.test('should handle normal container start * 2', function (done) {
        dockerEvents.handleStart({
          ip: '0.0.0.0',
          from: 'ubuntu'
        });
        dockerEvents.handleStart({
          ip: '0.0.0.0',
          from: 'ubuntu'
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '2', '0', 'http://0.0.0.0:4242');
          done();
        });
      });

      lab.test('should not do anything if non registered dock', function (done) {
        dockerEvents.handleStart({
          ip: '0.0.0.10',
          from: 'ubuntu'
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '0', '0', 'http://0.0.0.0:4242');
          done();
        });
      });

      lab.test('should handle container start invalid from', function (done) {
        dockerEvents.handleStart({
          ip: '0.0.0.0',
          from: null
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '0', '0', 'http://0.0.0.0:4242');
          done();
        });
      });

      lab.test('should handle build container start', function (done) {
        dockerEvents.handleStart({
          ip: '0.0.0.0',
          from: process.env.IMAGE_BUILDER
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '0', '1', 'http://0.0.0.0:4242');
          done();
        });
      });

      lab.test('should handle build container start invalid ip', function (done) {
        dockerEvents.handleStart({
          ip: null,
          from: process.env.IMAGE_BUILDER
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '0', '0', 'http://0.0.0.0:4242');
          done();
        });
      });

      lab.test('should handle build container start * 2', function (done) {
        dockerEvents.handleStart({
          ip: '0.0.0.0',
          from: process.env.IMAGE_BUILDER
        });
        dockerEvents.handleStart({
          ip: '0.0.0.0',
          from: process.env.IMAGE_BUILDER
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '0', '2', 'http://0.0.0.0:4242');
          done();
        });
      });
      lab.test('should not do anything if invalid data', function (done) {
        dockerEvents.handleStart(null);
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '0', '0', 'http://0.0.0.0:4242');
          done();
        });
      });
      lab.test('should not do anything if non registered dock', function (done) {
        dockerEvents.handleStart({
          ip: '0.0.0.10',
          from: process.env.IMAGE_BUILDER
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '0', '0', 'http://0.0.0.0:4242');
          done();
        });
      });
    }); // handleStart

    lab.experiment('handleDie', function () {
      lab.beforeEach(function(done) {
        dockerEvents.handleStart({
          ip: '0.0.0.0',
          from: process.env.IMAGE_BUILDER
        });
        dockerEvents.handleStart({
          ip: '0.0.0.0',
          from: 'ubuntu'
        });
        done();
      });

      lab.test('should handle normal container stop', function (done) {
        dockerEvents.handleDie({
          ip: '0.0.0.0',
          from: 'ubuntu'
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '0', '1', 'http://0.0.0.0:4242');
          done();
        });
      });

      lab.test('should handle normal container stop * 2', function (done) {
        dockerEvents.handleDie({
          ip: '0.0.0.0',
          from: 'ubuntu'
        });
        dockerEvents.handleDie({
          ip: '0.0.0.0',
          from: 'ubuntu'
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '-1', '1', 'http://0.0.0.0:4242');
          done();
        });
      });

      lab.test('should handle normal container stop invalid ip', function (done) {
        dockerEvents.handleDie({
          ip: null,
          from: 'ubuntu'
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '1', 'http://0.0.0.0:4242');
          done();
        });
      });

      lab.test('should not do anything if non registered dock', function (done) {
        dockerEvents.handleDie({
          ip: '0.0.0.10',
          from: 'ubuntu'
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '1', 'http://0.0.0.0:4242');
          done();
        });
      });

      lab.test('should handle container stop invalid from', function (done) {
        dockerEvents.handleDie({
          ip: '0.0.0.0',
          from: null
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '1', 'http://0.0.0.0:4242');
          done();
        });
      });

      lab.test('should handle build container stop', function (done) {
        dockerEvents.handleDie({
          ip: '0.0.0.0',
          from: process.env.IMAGE_BUILDER
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '0', 'http://0.0.0.0:4242');
          done();
        });
      });

      lab.test('should handle build container stop * 2', function (done) {
        dockerEvents.handleDie({
          ip: '0.0.0.0',
          from: process.env.IMAGE_BUILDER
        });
        dockerEvents.handleDie({
          ip: '0.0.0.0',
          from: process.env.IMAGE_BUILDER
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '-1', 'http://0.0.0.0:4242');
          done();
        });
      });

      lab.test('should handle build container stop invalid ip', function (done) {
        dockerEvents.handleDie({
          ip: null,
          from: process.env.IMAGE_BUILDER
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '1', 'http://0.0.0.0:4242');
          done();
        });
      });
      lab.test('should not do anything if invalid data', function (done) {
        dockerEvents.handleDie(null);
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '1', 'http://0.0.0.0:4242');
          done();
        });
      });
      lab.test('should not do anything if non registered dock', function (done) {
        dockerEvents.handleDie({
          ip: '0.0.0.10',
          from: process.env.IMAGE_BUILDER
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '1', 'http://0.0.0.0:4242');
          done();
        });
      });
    }); // handleDie
  }); // container

  lab.experiment('deamon', function () {
    lab.experiment('handleDockUp', function () {
      lab.test('should add host', function (done) {
        dockerEvents.handleDockUp({
          ip: '0.0.0.0'
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '0', '0', 'http://0.0.0.0:4242');
          done();
        });
      });

      lab.test('should add host only once', function (done) {
        dockerEvents.handleDockUp({
          ip: '0.0.0.0'
        });
        dockerEvents.handleDockUp({
          ip: '0.0.0.0'
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '0', '0', 'http://0.0.0.0:4242');
          done();
        });
      });

      lab.test('should add different hosts', function (done) {
        dockerEvents.handleDockUp({
          ip: '0.0.0.0'
        });
        dockerEvents.handleDockUp({
          ip: '0.0.1.0'
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          Lab.expect(data.length).to.equal(2);
          dataExpectN(data, 1, '0', '0', 'http://0.0.0.0:4242');
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
          ip: '0.0.0.0'
        });
        done();
      });
      lab.test('should remove host', function (done) {
        dockerEvents.handleDockDown({
          ip: '0.0.0.0'
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
          ip: '0.0.0.0'
        });
        dockerEvents.handleDockDown({
          ip: '0.0.0.0'
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
          ip: '0.0.1.0'
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '0', '0', 'http://0.0.0.0:4242');
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
          dataExpect1(data, '0', '0', 'http://0.0.0.0:4242');
          done();
        });
      });
      lab.test('should not remove host if invalid data', function (done) {
        dockerEvents.handleDockDown(null);
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '0', '0', 'http://0.0.0.0:4242');
          done();
        });
      });
    }); // handleDockDown
  }); // deamon
}); // docker events