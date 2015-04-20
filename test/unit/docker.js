'use strict';
require('../../lib/loadenv.js')();

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var redisClient = require('../../lib/models/redis.js');
var dockerEvents = require('../../lib/events/docker.js');
var dockData = require('../../lib/models/dockData.js');
var host = 'http://0.0.0.0:4242';

function dataExpect1(data, numContainers, numBuilds, host) {
  Lab.expect(data.length).to.equal(1);
  dataExpectN(data, 0, numContainers, numBuilds, host);
}

function dataExpectN(data, n, numContainers, numBuilds, host) {
  data.forEach(function(item) {
    if(item.host === host) {
      Lab.expect(item.numContainers).to.equal(numContainers);
      Lab.expect(item.numBuilds).to.equal(numBuilds);
    }
  });
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
      dockData.addHost(host, done);
    });

    lab.experiment('handleDestroy', function () {
      var containerRunFrom = process.env.RUNNABLE_REGISTRY +
        '/146592/5511da373f57ab170045d58d:5511da373f57ab170045d590';
      var imageBuilderFrom = process.env.IMAGE_BUILDER +
        ':d1.4.1-v2.0.2';

      lab.beforeEach(function(done) {
        dockData.setKey(host,'numBuilds', 1, done);
      });

      lab.beforeEach(function(done) {
        dockData.setKey(host,'numContainers', 1, done);
      });

      lab.test('should handle normal container stop', function (done) {
        dockerEvents.handleDestroy({
          ip: '0.0.0.0',
          host: host,
          from: containerRunFrom,
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '0', '1', host);
          done();
        });
      });

      lab.test('should handle normal container stop * 2', function (done) {
        var eventData = {
          ip: '0.0.0.0',
          host: host,
          from: containerRunFrom
        };
        dockerEvents.handleDestroy(eventData);
        dockerEvents.handleDestroy(eventData);
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '-1', '1', host);
          done();
        });
      });

      lab.test('should handle normal container stop invalid `ip` field', function (done) {
        dockerEvents.handleDestroy({
          ip: null,
          host: null,
          from: containerRunFrom
        });

        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '1', host);
          done();
        });
      });

      lab.test('should not do anything when given a non registered dock', function (done) {
        dockerEvents.handleDestroy({
          ip: '0.0.1.0',
          host: 'http://0.0.1.0:4242',
          from: containerRunFrom
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '1', host);
          done();
        });
      });

      lab.test('should handle container stop with invalid `from` field', function (done) {
        dockerEvents.handleDestroy({
          ip: '0.0.0.0',
          host: host,
          from: null
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '1', host);
          done();
        });
      });

      lab.test('should do nothing when given unknown container type via `from`', function(done) {
        dockerEvents.handleDestroy({
          ip: '0.0.0.0',
          host: host,
          from: 'zettio/weavetools:0.9.0'
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '1', host);
          done();
        });
      });

      lab.test('should handle build container stop', function (done) {
        dockerEvents.handleDestroy({
          ip: '0.0.0.0',
          host: host,
          from: imageBuilderFrom
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '0', host);
          done();
        });
      });

      lab.test('should handle build container stop * 2', function (done) {
        var eventData = {
          ip: '0.0.0.0',
          host: host,
          from: imageBuilderFrom
        };
        dockerEvents.handleDestroy(eventData);
        dockerEvents.handleDestroy(eventData);
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '-1', host);
          done();
        });
      });

      lab.test('should handle build container stop with invalid ip', function (done) {
        dockerEvents.handleDestroy({
          ip: null,
          from: imageBuilderFrom
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '1', host);
          done();
        });
      });

      lab.test('should do nothing when given invalid data', function (done) {
        dockerEvents.handleDestroy(null);
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '1', host);
          done();
        });
      });

      lab.test('should not do anything when given a non registered dock from image builder', function (done) {
        dockerEvents.handleDestroy({
          ip: '0.0.1.0',
          host: 'http://0.0.1.0:4242',
          from: imageBuilderFrom
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '1', host);
          done();
        });
      });
    }); // handleDestroy
  }); // container

  lab.experiment('deamon', function () {
    lab.experiment('handleDockUp', function () {
      lab.test('should add host', function (done) {
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
          Lab.expect(data.length).to.equal(2);
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
