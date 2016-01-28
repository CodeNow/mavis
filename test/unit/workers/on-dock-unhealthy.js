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
      sinon.spy(Events, '_hasValidHost')
      sinon.stub(dockData, 'deleteHost')
      sinon.stub(dockData, 'getDockByHost').yieldsAsync(null, {
        tags: '12312,build,run'
      })
      done();
    });

    afterEach(function (done) {
      Events._hasValidHost.restore();
      dockData.deleteHost.restore();
      dockData.getDockByHost.restore();
      done();
    });

    it('should throw error if invalid host', function (done) {
      onDockUnhealthy({})
        .asCallback(function (err) {
          expect(err).to.be.instanceOf(TaskFatalError);
          sinon.assert.calledOnce(Events._hasValidHost);
          done();
        });
    });

    it('should throw error get host failed', function (done) {
      dockData.getDockByHost.yieldsAsync(new Error('Redis error'));
      onDockUnhealthy({
        host: 'http://10.12.12.11:4242'
      })
      .catch(function (err) {
        expect(err).to.be.instanceOf(TaskFatalError);
        expect(err.message).to.contain('Dock is not in mavis');
        sinon.assert.calledOnce(Events._hasValidHost);
        sinon.assert.calledOnce(dockData.getDockByHost);
        sinon.assert.calledWith(
          dockData.getDockByHost,
          'http://10.12.12.11:4242'
        );
        sinon.assert.notCalled(dockData.deleteHost);
        done();
      });
    });

    it('should throw error get host found no host', function (done) {
      dockData.getDockByHost.yieldsAsync(null);
      onDockUnhealthy({
        host: 'http://10.12.12.11:4242'
      })
      .catch(function (err) {
        expect(err).to.be.instanceOf(TaskFatalError);
        expect(err.message).to.contain('Dock is not in mavis');
        sinon.assert.calledOnce(Events._hasValidHost);
        sinon.assert.calledOnce(dockData.getDockByHost);
        sinon.assert.calledWith(
          dockData.getDockByHost,
          'http://10.12.12.11:4242'
        );
        sinon.assert.notCalled(dockData.deleteHost);
        done();
      });
    });

    it('should throw error delete host failed', function (done) {
      dockData.deleteHost.yieldsAsync(new Error('Redis error'));
      onDockUnhealthy({
        host: 'http://10.12.12.11:4242'
      })
      .catch(function (err) {
        expect(err).to.be.instanceOf(TaskError);
        expect(err.message).to.contain('Failed to delete host');
        sinon.assert.calledOnce(Events._hasValidHost);
        sinon.assert.calledOnce(dockData.getDockByHost);
        sinon.assert.calledWith(
          dockData.getDockByHost,
          'http://10.12.12.11:4242'
        );
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
      sinon.stub(dockData, 'getDockByHost').yieldsAsync(null, {
        tags: '12312,build,run'
      });
      done();
    });

    afterEach(function (done) {
      Events._hasValidHost.restore()
      dockData.deleteHost.restore()
      dockData.getDockByHost.restore()
      rabbitMQ._publisher = null
      done()
    });

    it('should emit provision and wait events', function (done) {
      var dockerUrl = 'http://10.12.12.11:4242';

      rabbitMQ._publisher = {
        publish: function (name, data) {}
      };
      sinon.spy(rabbitMQ._publisher, 'publish');
      onDockUnhealthy({
        host: dockerUrl
      })
      .then(function () {
        sinon.assert.calledOnce(Events._hasValidHost);

        sinon.assert.calledOnce(dockData.getDockByHost);
        sinon.assert.calledWith(
          dockData.getDockByHost,
          dockerUrl
        )

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
