'use strict';
require('../../lib/loadenv.js')();

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var redisClient = require('../../lib/models/redis.js');
var dockerEvents = require('../../lib/events/docker.js');
var dockData = require('../../lib/models/dockData.js');
var apiClient = require('../../lib/models/api-client.js');
var api = require('../fixtures/nock-api.js');

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
      dockData.addHost('http://0.0.0.0:4242', done);
    });

    lab.experiment('handleDie', function () {
      lab.before(function(done) {
        api.nock(function(err) {
          if (err) { return done(err); }
          apiClient.login(done);
        });
      });

      lab.after(function(done) {
        apiClient.logout(function(err) {
          if (err) { return done(err); }
          api.clean(done);
        });
      });

      lab.beforeEach(function(done) {
        dockData.setKey('http://0.0.0.0:4242','numBuilds', 1, done);
      });

      lab.beforeEach(function(done) {
        dockData.setKey('http://0.0.0.0:4242','numContainers', 1, done);
      });

      lab.test('should handle normal container stop', function (done) {
        var eventData = {
          ip: '0.0.0.0',
          from: 'ubuntu',
          id: '1'
        };
        dockerEvents.handleDie(eventData, function(err) {
          if (err) { return done(err); }
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return dockData.getAllDocks(test);
            }
            dataExpect1(data, '0', '1', 'http://0.0.0.0:4242');
            done();
          });
        });
      });

      lab.test('should handle normal container stop * 2', function (done) {
        var eventData = {
          ip: '0.0.0.0',
          from: 'ubuntu',
          id: '1'
        };
        dockerEvents.handleDie(eventData, function(err) {
          if (err) { return done(err); }
          dockerEvents.handleDie(eventData, function(err) {
            if (err) { return done(err); }
            dockData.getAllDocks(function test(err, data) {
              if (err || !data) {
                return dockData.getAllDocks(test);
              }
              dataExpect1(data, '-1', '1', 'http://0.0.0.0:4242');
              done();
            });
          });
        });
      });

      lab.test('should handle normal container stop invalid `ip` field', function (done) {
        var eventData = {
          ip: null,
          from: 'ubuntu',
          id: '1'
        };
        dockerEvents.handleDie(eventData, function(err) {
          if (!err) {
            return done(new Error('Did not recieve error from handleDie.'));
          }
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return dockData.getAllDocks(test);
            }
            dataExpect1(data, '1', '1', 'http://0.0.0.0:4242');
            done();
          });
        });
      });

      lab.test('should not do anything when given a non registered dock', function (done) {
        var eventData = {
          ip: '0.0.0.10',
          from: 'ubuntu',
          id: '1'
        };
        dockerEvents.handleDie(eventData, function(err) {
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return dockData.getAllDocks(test);
            }
            dataExpect1(data, '1', '1', 'http://0.0.0.0:4242');
            done();
          });
        });
      });

      lab.test('should not do anything if given an non-instance normal container', function(done) {
        var eventData = {
          ip: '0.0.0.0',
          from: 'ubuntu',
          id: 'invalid'
        };
        dockerEvents.handleDie(eventData, function(err) {
          if (err) { return done(err); }
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return dockData.getAllDocks(test);
            }
            dataExpect1(data, '1', '1', 'http://0.0.0.0:4242');
            done();
          });
        });
      });

      lab.test('should handle container stop with invalid `from` field', function (done) {
        var eventData = {
          ip: '0.0.0.0',
          from: null,
          id: '1'
        };
        dockerEvents.handleDie(eventData, function(err) {
          if (!err) {
            return done(new Error('Did not recieve error from handleDie.'));
          }
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return dockData.getAllDocks(test);
            }
            dataExpect1(data, '1', '1', 'http://0.0.0.0:4242');
            done();
          });
        });
      });

      lab.test('should handle build container stop', function (done) {
        var eventData = {
          ip: '0.0.0.0',
          from: process.env.IMAGE_BUILDER,
          id: '1'
        };
        dockerEvents.handleDie(eventData, function(err) {
          if (err) { return done(err); }
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return dockData.getAllDocks(test);
            }
            dataExpect1(data, '1', '0', 'http://0.0.0.0:4242');
            done();
          });
        });
      });

      lab.test('should handle build container stop * 2', function (done) {
        var eventData = {
          ip: '0.0.0.0',
          from: process.env.IMAGE_BUILDER,
          id: '1'
        };
        dockerEvents.handleDie(eventData, function(err) {
          if (err) { return done(err); }
          dockerEvents.handleDie(eventData, function(err) {
            if (err) { return done(err); }
            dockData.getAllDocks(function test(err, data) {
              if (err || !data) {
                return dockData.getAllDocks(test);
              }
              dataExpect1(data, '1', '-1', 'http://0.0.0.0:4242');
              done();
            });
          });
        });
      });

      lab.test('should handle build container stop invalid ip', function (done) {
        var eventData = {
          ip: null,
          from: process.env.IMAGE_BUILDER,
          id: '1'
        };
        dockerEvents.handleDie(eventData, function(err) {
          if (!err) {
            return done(new Error('Did not recieve error from handleDie.'));
          }
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return dockData.getAllDocks(test);
            }
            dataExpect1(data, '1', '1', 'http://0.0.0.0:4242');
            done();
          });
        });
      });

      lab.test('should not do anything if invalid data', function (done) {
        dockerEvents.handleDie(null, function(err) {
          if (!err) {
            return done(new Error('Did not recieve error from handleDie.'));
          }
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return dockData.getAllDocks(test);
            }
            dataExpect1(data, '1', '1', 'http://0.0.0.0:4242');
            done();
          });
        });
      });

      lab.test('should not do anything if non registered dock', function (done) {
        var eventData = {
          ip: '0.0.0.10',
          from: process.env.IMAGE_BUILDER,
          id: '1'
        };
        dockerEvents.handleDie(eventData, function(err) {
          if (err) { return done(err); }
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return dockData.getAllDocks(test);
            }
            dataExpect1(data, '1', '1', 'http://0.0.0.0:4242');
            done();
          });
        });
      });

      lab.test('should not do anything if given an non-instance build container', function(done) {
        var eventData = {
          ip: '0.0.0.0',
          from: process.env.IMAGE_BUILDER,
          id: 'invalid'
        };
        dockerEvents.handleDie(eventData, function(err) {
          if (err) { return done(err); }
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return dockData.getAllDocks(test);
            }
            dataExpect1(data, '1', '1', 'http://0.0.0.0:4242');
            done();
          });
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