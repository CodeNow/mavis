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

  describe('success', function () {
    afterEach(function (done) {
      rabbitMQ._publisher = null;
      done();
    });
    it('should delete host if valid', function (done) {
      sinon.spy(Events, '_hasValidHost');
      sinon.stub(dockData, 'deleteHost').yieldsAsync(null);
      rabbitMQ._publisher = {
        publish: function (name, data) {}
      };
      sinon.spy(rabbitMQ._publisher, 'publish');
      onDockUnhealthy({
        host: 'http://10.12.12.11:4242',
        githubId: 12312
      })
      .then(function () {
        expect(Events._hasValidHost.calledOnce).to.be.true();
        Events._hasValidHost.restore();

        expect(dockData.deleteHost.called).to.be.true();
        expect(dockData.deleteHost.getCall(0).args[0]).to.equal('http://10.12.12.11:4242');
        dockData.deleteHost.restore();

        expect(rabbitMQ._publisher.publish.getCall(0).args[0]).to.equal('on-dock-removed');
        expect(rabbitMQ._publisher.publish.getCall(0).args[1]).to.deep.equal({
          host: 'http://10.12.12.11:4242',
          githubId: 12312
        });
        expect(rabbitMQ._publisher.publish.getCall(1).args[0]).to.equal('cluster-instance-provision');
        expect(rabbitMQ._publisher.publish.getCall(1).args[1]).to.deep.equal({
          githubId: 12312
        });
        rabbitMQ._publisher.publish.restore();
        done();
      })
      .catch(function (err) {
        throw new Error('Should not happen');
      });
    });
  });
}); // end on-dock-unhealthy unit test
