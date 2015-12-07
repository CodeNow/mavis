'use strict';
require('loadenv')();

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var Code = require('code');
var expect = Code.expect;

var sinon = require('sinon');
var ponos = require('ponos');
var TaskFatalError = ponos.TaskFatalError;

var Events = require('../../../lib/models/events.js');
var dockData = require('../../../lib/models/dockData.js');
var containerLifeCycleDied = require('../../../lib/workers/container.life-cycle.died.js');

describe('container.life-cycle.died.js unit test', function () {
  it('should throw error if invalid from', function (done) {
    sinon.stub(Events, '_hasValidFrom').returns(false);
    containerLifeCycleDied({})
      .then(function () {
        throw new Error('Should not happen');
      })
      .catch(function (err) {
        expect(err).to.be.instanceOf(TaskFatalError);
        expect(Events._hasValidFrom.calledOnce).to.be.true();
        Events._hasValidFrom.restore();
        done();
      });
  });

  it('should throw error if invalid host', function (done) {
    sinon.stub(Events, '_hasValidFrom').returns(true);
    sinon.stub(Events, '_hasValidHost').returns(false);
    containerLifeCycleDied({})
      .then(function () {
        throw new Error('Should not happen');
      })
      .catch(function (err) {
        expect(err).to.be.instanceOf(TaskFatalError);
        expect(Events._hasValidFrom.calledOnce).to.be.true();
        expect(Events._hasValidHost.calledOnce).to.be.true();
        Events._hasValidFrom.restore();
        Events._hasValidHost.restore();
        done();
      });
  });

  it('should do nothing if not build container', function (done) {
    sinon.stub(Events, '_hasValidFrom').returns(true);
    sinon.stub(Events, '_hasValidHost').returns(true);
    sinon.stub(Events, '_getType').returns('unknown');
    sinon.stub(dockData, 'incKey');
    containerLifeCycleDied({})
      .then(function () {
        expect(Events._hasValidFrom.calledOnce).to.be.true();
        expect(Events._hasValidHost.calledOnce).to.be.true();
        expect(Events._getType.calledOnce).to.be.true();
        expect(dockData.incKey.called).to.be.false();
        Events._hasValidFrom.restore();
        Events._hasValidHost.restore();
        Events._getType.restore();
        dockData.incKey.restore();
        done();
      })
      .catch(done);
  });

  it('should increment counter if build container', function (done) {
    sinon.stub(Events, '_hasValidFrom').returns(true);
    sinon.stub(Events, '_hasValidHost').returns(true);
    sinon.stub(Events, '_getType').returns('container_build');
    sinon.stub(dockData, 'incKey').yieldsAsync(null);
    containerLifeCycleDied({
      host: 'https://10.12.12.14:4242'
    })
    .then(function () {
      expect(Events._hasValidFrom.calledOnce).to.be.true();
      expect(Events._hasValidHost.calledOnce).to.be.true();
      expect(Events._getType.calledOnce).to.be.true();
      expect(dockData.incKey.calledOnce).to.be.true();
      var incArgs = dockData.incKey.getCall(0).args;
      expect(incArgs[0]).to.equal('https://10.12.12.14:4242');
      expect(incArgs[1]).to.equal('container_build');
      expect(incArgs[2]).to.equal(-1);
      Events._hasValidFrom.restore();
      Events._hasValidHost.restore();
      Events._getType.restore();
      dockData.incKey.restore();
      done();
    })
    .catch(done);
  });
}); // end container.life-cycle.died unit test
