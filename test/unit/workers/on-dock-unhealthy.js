'use strict';

require('loadenv')();

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var afterEach = lab.afterEach;
var beforeEach = lab.beforeEach;
var Code = require('code');
var expect = Code.expect;

var sinon = require('sinon');

var ponos = require('ponos');
var TaskFatalError = ponos.TaskFatalError;
var TaskError = ponos.TaskError;
var dockData = require('../../../lib/models/dockData.js');
var rabbitMQ = require('../../../lib/rabbitmq.js');
var Events = require('../../../lib/models/events.js');
var Docker = require('../../../lib/models/docker.js');
var onDockUnhealthy = require('../../../lib/workers/on-dock-unhealthy.js');

describe('lib/workers/on-dock-unhealthy unit test', function () {
  describe('failed', function () {
    beforeEach(function (done) {
      sinon.spy(Events, '_hasValidHost');
      sinon.stub(dockData, 'deleteHost')
      done();
    });

    afterEach(function (done) {
      Events._hasValidHost.restore();
      dockData.deleteHost.restore();
      done();
    });

    it('should throw error if invalid host', function (done) {
      onDockUnhealthy({})
        .then(function () {
          throw new Error('Should not happen');
        })
        .catch(function (err) {
          expect(err).to.be.instanceOf(TaskFatalError);
          sinon.assert.calledOnce(Events._hasValidHost);
          done();
        });
    });

    it('should throw error delete host failed', function (done) {
      dockData.deleteHost.yieldsAsync(new Error('Redis error'));
      onDockUnhealthy({
        host: 'http://10.12.12.11:4242',
      })
      .then(function () {
        throw new Error('Should not happen');
      })
      .catch(function (err) {
        expect(err).to.be.instanceOf(TaskError);
        sinon.assert.calledOnce(Events._hasValidHost);
        sinon.assert.calledOnce(dockData.deleteHost);
        sinon.assert.calledWith(
          dockData.deleteHost,
          'http://10.12.12.11:4242'
        );
        done();
      });
    });
  }); // end failed

  describe('success', function () {
    beforeEach(function (done) {
      sinon.spy(Events, '_hasValidHost');
      sinon.stub(dockData, 'deleteHost').yieldsAsync(null);
      done();
    });

    afterEach(function (done) {
      Events._hasValidHost.restore();
      dockData.deleteHost.restore();
      rabbitMQ._publisher = null;
      done();
    });

    it('should emit provision and wait events', function (done) {
      var dockerUrl = 'http://10.12.12.11:4242';

      rabbitMQ._publisher = {
        publish: function (name, data) {}
      };
      sinon.spy(rabbitMQ._publisher, 'publish');
      onDockUnhealthy({
        host: dockerUrl,
        githubId: 12312
      })
      .then(function () {
        sinon.assert.calledOnce(Events._hasValidHost);

        sinon.assert.calledOnce(dockData.deleteHost);
        sinon.assert.calledWith(
          dockData.deleteHost,
          dockerUrl
        );

        sinon.assert.calledOnce(rabbitMQ._publisher.publish);
        sinon.assert.calledWith(
          rabbitMQ._publisher.publish,
          'dock.wait-for-removal',
          sinon.match({ dockerUrl: dockerUrl })
        );

        done();
      });
    });
  });
}); // end on-dock-unhealthy unit test
