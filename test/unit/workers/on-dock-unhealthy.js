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
var Worker = require('../../../lib/workers/on-dock-unhealthy.js');
var dockData = require('../../../lib/models/dockData.js');
var rabbitMQ = require('../../../lib/rabbitmq.js');
var Events = require('../../../lib/models/events.js');
var Docker = require('../../../lib/models/docker.js');
var onDockUnhealthy = require('../../../lib/workers/on-dock-unhealthy.js');

describe('on-dock-unhealthy unit test', function () {
  it('should throw error if invalid host', function (done) {
    sinon.spy(Events, '_hasValidHost');
    onDockUnhealthy({})
      .then(function () {
        throw new Error('Should not happen');
      })
      .catch(function (err) {
        expect(err).to.be.instanceOf(TaskFatalError);
        expect(Events._hasValidHost.calledOnce).to.be.true();
        Events._hasValidHost.restore();
        done();
      });
  });

  it('should throw error delete host failed', function (done) {
    sinon.spy(Events, '_hasValidHost');
    sinon.stub(dockData, 'deleteHost').yieldsAsync(new Error('Redis error'));
    onDockUnhealthy({
      host: 'http://10.12.12.11:4242',
    })
    .then(function () {
      throw new Error('Should not happen');
    })
    .catch(function (err) {
      expect(err).to.be.instanceOf(TaskError);
      expect(Events._hasValidHost.calledOnce).to.be.true();
      expect(dockData.deleteHost.called).to.be.true();
      expect(dockData.deleteHost.getCall(0).args[0]).to.equal('http://10.12.12.11:4242');
      dockData.deleteHost.restore();
      Events._hasValidHost.restore();
      done();
    });
  });

  it('should throw if killingSwarmContainer failed', function (done) {
    var dockerUrl = 'http://10.12.12.11:4242';

    sinon.spy(Events, '_hasValidHost');
    sinon.stub(dockData, 'deleteHost').yieldsAsync(null);
    sinon.stub(Docker.prototype, 'killSwarmContainer').yieldsAsync(new Error('Docker Error'));

    onDockUnhealthy({
      host: dockerUrl,
    })
    .then(function () {
      throw new Error('Should not happen');
    })
    .catch(function (err) {
      expect(err).to.be.instanceOf(TaskError);
      expect(Events._hasValidHost.calledOnce).to.be.true();
      expect(dockData.deleteHost.called).to.be.true();
      expect(dockData.deleteHost.getCall(0).args[0]).to.equal(dockerUrl);
      dockData.deleteHost.restore();
      Events._hasValidHost.restore();
      Docker.prototype.killSwarmContainer.restore();
      done();
    });
  });

  describe('success', function () {
    beforeEach(function (done) {
      sinon.spy(Events, '_hasValidHost');
      sinon.stub(dockData, 'deleteHost').yieldsAsync(null);
      sinon.stub(Docker.prototype, 'killSwarmContainer').yieldsAsync(null);
      done();
    });

    afterEach(function (done) {
      Events._hasValidHost.restore();
      dockData.deleteHost.restore();
      Docker.prototype.killSwarmContainer.restore();
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
        expect(Events._hasValidHost.calledOnce).to.be.true();

        expect(dockData.deleteHost.called).to.be.true();
        expect(dockData.deleteHost.getCall(0).args[0]).to.equal(dockerUrl);

        sinon.assert.calledTwice(rabbitMQ._publisher.publish);

        sinon.assert.calledWith(
          rabbitMQ._publisher.publish.getCall(0),
          'cluster-instance-provision',
          sinon.match({ githubId: 12312 })
        );

        sinon.assert.calledWith(
          rabbitMQ._publisher.publish.getCall(1),
          'wait-for-dock-removed',
          sinon.match({ dockerUrl: dockerUrl })
        );

        done();
      });
    });
  });
}); // end on-dock-unhealthy unit test
