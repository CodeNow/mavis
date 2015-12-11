'use strict';

require('loadenv')('mavis:env');

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var Code = require('code');
var expect = Code.expect;
var afterEach = lab.afterEach;
var beforeEach = lab.beforeEach;

var redis = require('../../../lib/models/redis.js');
var events = require('../../../lib/models/events.js');
var dockData = require('../../../lib/models/dockData.js');
var RabbitMQ = require('../../../lib/rabbitmq.js');
var Docker = require('../../../lib/models/docker.js');

var async = require('async');
var sinon = require('sinon');
var TaskError = require('ponos').TaskError;

var host = 'http://0.0.0.0:4242';


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

lab.experiment('lib/models/events.js unit test', function () {
  lab.beforeEach(function (done) {
    redis.connect();
    redis.client.flushall(done);
  });

  lab.experiment('container', function () {
    lab.beforeEach(function (done) {
      dockData.addHost(host, '', done);
    });
    lab.experiment('handleDied', function () {
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
        events.handleDied({
          ip: '0.0.0.0',
          host: host,
          from: containerRunFrom,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
        }, function (err) {
          if (err) { return done(err); }
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return done(new Error('Failed'));
            }
            dataExpect1(data, '1', '1', host);
            done();
          });
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
        async.series([
          events.handleDied.bind(events, eventData),
          events.handleDied.bind(events, eventData)
        ], function (err) {
          if (err) {
            return done(err);
          }
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return done(new Error('Failed'));
            }
            dataExpect1(data, '1', '1', host);
            done();
          });
        });
      });

      lab.test('should not decrement counts for invalid `ip` field', function (done) {
        events.handleDied({
          ip: null,
          host: null,
          from: containerRunFrom,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
        }, function (err) {
          expect(err).to.exist();
          expect(err.message).to.equal('container.life-cycle.died: Failed validation');
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return done(new Error('Failed'));
            }
            dataExpect1(data, '1', '1', host);
            done();
          });
        });
      });

      lab.test('should not do anything when given a non registered dock', function (done) {
        events.handleDied({
          ip: '0.0.1.0',
          host: 'http://0.0.1.0:4242',
          from: containerRunFrom,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
        }, function (err) {
          expect(err).to.not.exist();
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return done(new Error('Failed'));
            }
            dataExpect1(data, '1', '1', host);
            done();
          });
        });
      });

      lab.test('should handle container die with invalid `from` field', function (done) {
        events.handleDied({
          ip: '0.0.0.0',
          host: host,
          from: null,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
        }, function (err) {
          expect(err).to.exist();
          expect(err.message).to.equal('container.life-cycle.died: Failed validation');
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return done(new Error('Failed'));
            }
            dataExpect1(data, '1', '1', host);
            done();
          });
        });

      });

      lab.test('should do nothing when given unknown container type via `from`', function(done) {
        events.handleDied({
          ip: '0.0.0.0',
          host: host,
          from: 'zettio/weavetools:0.9.0',
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
        }, function (err) {
          expect(err).to.not.exist();
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return done(new Error('Failed'));
            }
            dataExpect1(data, '1', '1', host);
            done();
          });
        });
      });

      lab.test('should decrement container build count', function (done) {
        events.handleDied({
          ip: '0.0.0.0',
          host: host,
          from: imageBuilderFrom,
          inspectData: {
            Config: {
              Labels: { type: process.env.IMAGE_BUILDER_LABEL }
            }
          }
        }, function (err) {
          expect(err).to.not.exists();
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return done(new Error('Failed'));
            }
            dataExpect1(data, '1', '0', host);
            done();
          });
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
        async.series([
          events.handleDied.bind(events, eventData),
          events.handleDied.bind(events, eventData)
        ], function (err) {
          expect(err).to.not.exist();
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return done(new Error('Failed'));
            }
            dataExpect1(data, '1', '-1', host);
            done();
          });
        });
      });

      lab.test('should not decrement container build count with invalid ip', function (done) {
        events.handleDied({
          ip: null,
          from: imageBuilderFrom,
          inspectData: {
            Config: {
              Labels: { type: process.env.IMAGE_BUILDER_LABEL }
            }
          }
        }, function (err) {
          expect(err).to.exist();
          expect(err.message).to.equal('container.life-cycle.died: Failed validation');
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return done(new Error('Failed'));
            }
            dataExpect1(data, '1', '1', host);
            done();
          });
        });
      });

      lab.test('should do nothing when given invalid data', function (done) {
        events.handleDied(null, function (err) {
          expect(err).to.exist();
          expect(err.message).to.equal('container.life-cycle.died: Failed validation');
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return done(new Error('Failed'));
            }
            dataExpect1(data, '1', '1', host);
            done();
          });
        });
      });

      lab.test('should not do anything when given a non registered dock from image builder', function (done) {
        events.handleDied({
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
            return done(new Error('Failed'));
          }
          dataExpect1(data, '1', '1', host);
          done();
        });
      });
    }); // handleDied
  }); // container

  lab.experiment('deamon', function () {
    lab.experiment('handleDockUp', function () {
      lab.test('should add host without tags', function (done) {
        events.handleDockUp({
          ip: '0.0.0.0',
          host: host,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
        }, function (err) {
          expect(err).to.not.exists();
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return done('Error with test');
            }
            dataExpect1(data, '0', '0', host);
            done();
          });
        });
      });
      lab.test('should add host with tags', function (done) {
        var tags = 'test,tags';
        events.handleDockUp({
          ip: '0.0.0.0',
          host: host,
          tags: tags,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
        }, function (err) {
          expect(err).to.not.exists();
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return done('Error with test');
            }
            expect(data[0].tags).to.equal(tags);
            dataExpect1(data, '0', '0', host);
            done();
          });
        });
      });

      lab.test('should add host only once', function (done) {
        var data = {
          ip: '0.0.0.0',
          host: host,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
        };
        async.series([
          events.handleDockUp.bind(events, data),
          events.handleDockUp.bind(events, data)
        ], function (err) {
          expect(err).to.not.exists();
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return done('Error with test');
            }
            dataExpect1(data, '0', '0', host);
            done();
          });
        });
      });

      lab.test('should add different hosts', function (done) {
        async.series([
            function (cb) {
              events.handleDockUp({
                ip: '0.0.0.0',
                host: host,
                inspectData: {
                  Config: {
                    Labels: { type: '' }
                  }
                }
              }, cb);
            },
            function (cb) {
              events.handleDockUp({
                ip: '0.0.1.0',
                host: 'http://0.0.1.0:4242',
                inspectData: {
                  Config: {
                    Labels: { type: '' }
                  }
                }
              }, cb);
            }
        ], function (err) {
          expect(err).to.not.exists();
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return done('Error with test');
            }
            expect(data.length).to.equal(2);
            dataExpectN(data, 1, '0', '0', host);
            dataExpectN(data, 0, '0', '0', 'http://0.0.1.0:4242');
            done();
          });
        });
      });

      lab.test('should not add host if data invalid', function (done) {
        events.handleDockUp({
          ip: null,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
        }, function (err) {
          expect(err).to.exist();
          expect(err.message).to.equal('docker.events-stream.connected: Failed validation: no host');
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return done('Error with test');
            }
            dataExpectNone(data);
            done();
          });
        });
      });
      lab.test('should not add host if invalid data', function (done) {
        events.handleDockUp(null, function (err) {
          expect(err).to.exist();
          expect(err.message).to.equal('docker.events-stream.connected: Failed validation: no host');
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return done('Error with test');
            }
            dataExpectNone(data);
            done();
          });
        });
      });
    }); // handleDockUp

    lab.experiment('handleDockDown', function () {
      lab.beforeEach(function(done) {
        events.handleDockUp({
          ip: '0.0.0.0',
          host: host,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
        }, done);
      });
      lab.test('should remove host', function (done) {
        events.handleDockDown({
          ip: '0.0.0.0',
          host: host,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
        }, function (err) {
          expect(err).to.not.exists();
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return done('Error with test');
            }
            dataExpectNone(data);
            done();
          });
        });
      });
      lab.test('should do nothing if host removed twice', function (done) {
        var data = {
          ip: '0.0.0.0',
          host: host,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
        };
        async.series([
          events.handleDockDown.bind(events, data),
          events.handleDockDown.bind(events, data)
        ], function (err) {
          expect(err).to.not.exists();
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return done('Error with test');
            }
            dataExpectNone(data);
            done();
          });
        });
      });
      lab.test('should not remove host if diff ip', function (done) {
        events.handleDockDown({
          ip: '0.0.1.0',
          host: 'http://0.0.1.0:4242',
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
        }, function (err) {
          expect(err).to.not.exists();
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return done('Error with test');
            }
            dataExpect1(data, '0', '0', host);
            done();
          });
        });
      });
      lab.test('should not remove host if invalid ip', function (done) {
        events.handleDockDown({
          ip: null,
          inspectData: {
            Config: {
              Labels: { type: '' }
            }
          }
        }, function (err) {
          expect(err).to.exist();
          expect(err.message).to.equal('docker.events-stream.disconnected: Failed validation: no host');
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return done('Error with test');
            }
            dataExpect1(data, '0', '0', host);
            done();
          });
        });
      });
      lab.test('should not remove host if invalid data', function (done) {
        events.handleDockDown(null, function (err) {
          expect(err).to.exist();
          expect(err.message).to.equal('docker.events-stream.disconnected: Failed validation: no host');
          dockData.getAllDocks(function test(err, data) {
            if (err || !data) {
              return done('Error with test');
            }
            dataExpect1(data, '0', '0', host);
            done();
          });
        });
      });
    }); // handleDockDown
  }); // deamon

  lab.experiment('handleEnsureDockRemoved', function () {
    var publishStub;
    beforeEach(function (done) {
      sinon.stub(Docker, 'ensureDockRemoved');
      sinon.stub(Docker.prototype, 'killSwarmContainer');
      publishStub = sinon.stub();
      sinon.stub(RabbitMQ, 'getPublisher').returns({
        publish: publishStub
      });
      done();
    });

    afterEach(function (done) {
      Docker.ensureDockRemoved.restore();
      Docker.prototype.killSwarmContainer.restore();
      RabbitMQ.getPublisher.restore();
      done();
    });

    lab.test('should cb err if ensureDockRemoved failed', function (done) {
      Docker.prototype.killSwarmContainer.yieldsAsync();
      Docker.ensureDockRemoved.yieldsAsync(new Error('dock not removed'));

      events.handleEnsureDockRemoved({
        dockerUrl: 'http://10.0.0.1:4242'
      }, function (err) {
        expect(err).to.be.an.instanceOf(TaskError);
        done();
      });
    });

    lab.test('should publish dock.removed', function (done) {
      var dockerUrl = 'http://10.0.102.2:4242';
      Docker.prototype.killSwarmContainer.yieldsAsync();
      Docker.ensureDockRemoved.yieldsAsync(null);

      events.handleEnsureDockRemoved({
        dockerUrl: dockerUrl
      }, function (err) {
        expect(err).to.not.exist();

        sinon.assert.calledOnce(Docker.ensureDockRemoved);
        sinon.assert.calledWith(
          Docker.ensureDockRemoved,
          dockerUrl
        );

        sinon.assert.calledOnce(publishStub);
        sinon.assert.calledWith(
          publishStub,
          'dock.removed',
          sinon.match({ host: dockerUrl })
        );

        done();
      });
    });

    lab.test('should publish dock.removed if killSwarm failed', function (done) {
      var dockerUrl = 'http://10.0.102.2:4242';
      Docker.prototype.killSwarmContainer.yieldsAsync(new Error('ladybug'));
      Docker.ensureDockRemoved.yieldsAsync(null);

      events.handleEnsureDockRemoved({
        dockerUrl: dockerUrl
      }, function (err) {
        expect(err).to.not.exist();

        sinon.assert.calledOnce(Docker.ensureDockRemoved);
        sinon.assert.calledWith(
          Docker.ensureDockRemoved,
          dockerUrl
        );

        sinon.assert.calledOnce(publishStub);
        sinon.assert.calledWith(
          publishStub,
          'dock.removed',
          sinon.match({ host: dockerUrl })
        );

        done();
      });
    });

  }); // end handleEnsureDockRemoved
}); // docker events
