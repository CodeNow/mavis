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

  lab.experiment('container', function () {
    lab.beforeEach(function (done) {
      dockData.addHost(host, '', done);
    });
    lab.experiment('handleDie', function () {
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

      lab.test('should not decrement container run count', function (done) {
        dockerEvents.handleDie({
          ip: '0.0.0.0',
          host: host,
          from: containerRunFrom,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '1', host);
          done();
        });
      });

      lab.test('should not decrement container run count * 2', function (done) {
        var eventData = {
          ip: '0.0.0.0',
          host: host,
          from: containerRunFrom,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
        };
        dockerEvents.handleDie(eventData);
        dockerEvents.handleDie(eventData);
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '1', host);
          done();
        });
      });

      lab.test('should not decrement counts for invalid `ip` field', function (done) {
        dockerEvents.handleDie({
          ip: null,
          host: null,
          from: containerRunFrom,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
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
        dockerEvents.handleDie({
          ip: '0.0.1.0',
          host: 'http://0.0.1.0:4242',
          from: containerRunFrom,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '1', host);
          done();
        });
      });

      lab.test('should handle container die with invalid `from` field', function (done) {
        dockerEvents.handleDie({
          ip: '0.0.0.0',
          host: host,
          from: null,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
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
        dockerEvents.handleDie({
          ip: '0.0.0.0',
          host: host,
          from: 'zettio/weavetools:0.9.0',
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '1', host);
          done();
        });
      });

      lab.test('should decrement container build count', function (done) {
        dockerEvents.handleDie({
          ip: '0.0.0.0',
          host: host,
          from: imageBuilderFrom,
          inspectData: {
            Config: {
              Labels: { type: process.env.IMAGE_BUILDER_LABEL }
            }
          }
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '0', host);
          done();
        });
      });

      lab.test('should decrement container build count * 2', function (done) {
        var eventData = {
          ip: '0.0.0.0',
          host: host,
          from: imageBuilderFrom,
          inspectData: {
            Config: {
              Labels: { type: process.env.IMAGE_BUILDER_LABEL }
            }
          }
        };
        dockerEvents.handleDie(eventData);
        dockerEvents.handleDie(eventData);
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '-1', host);
          done();
        });
      });

      lab.test('should not decrement container build count with invalid ip', function (done) {
        dockerEvents.handleDie({
          ip: null,
          from: imageBuilderFrom,
          inspectData: {
            Config: {
              Labels: { type: process.env.IMAGE_BUILDER_LABEL }
            }
          }
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
        dockerEvents.handleDie(null);
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '1', host);
          done();
        });
      });

      lab.test('should not do anything when given a non registered dock from image builder', function (done) {
        dockerEvents.handleDie({
          ip: '0.0.1.0',
          host: 'http://0.0.1.0:4242',
          from: imageBuilderFrom,
          inspectData: {
            Config: {
              Labels: { type: process.env.IMAGE_BUILDER_LABEL }
            }
          }
        });
        dockData.getAllDocks(function test(err, data) {
          if (err || !data) {
            return dockData.getAllDocks(test);
          }
          dataExpect1(data, '1', '1', host);
          done();
        });
      });
    }); // handleDie
  }); // container

  lab.experiment('deamon', function () {
    lab.experiment('handleDockUp', function () {
      lab.test('should add host without tags', function (done) {
        dockerEvents.handleDockUp({
          ip: '0.0.0.0',
          host: host,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
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
          tags: tags,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
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
          host: host,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
        });
        dockerEvents.handleDockUp({
          ip: '0.0.0.0',
          host: host,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
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
          host: host,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
        });
        dockerEvents.handleDockUp({
          ip: '0.0.1.0',
          host: 'http://0.0.1.0:4242',
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
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
          ip: null,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
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
          host: host,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
        });
        done();
      });
      lab.test('should remove host', function (done) {
        dockerEvents.handleDockDown({
          ip: '0.0.0.0',
          host: host,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
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
          host: host,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
        });
        dockerEvents.handleDockDown({
          ip: '0.0.0.0',
          host: host,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
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
          host: 'http://0.0.1.0:4242',
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
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
          ip: null,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
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
