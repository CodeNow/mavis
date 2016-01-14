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
var TaskFatalError = require('ponos').TaskFatalError;

var Events = require('../../../lib/models/events.js');
var ensureDockRemovedWorker = require('../../../lib/workers/dock.wait-for-removal.js');

describe('lib/workers/dock.wait-for-removal unit test', function () {
  describe('run', function () {
    beforeEach(function (done) {
      sinon.stub(Events, 'handleEnsureDockRemovedAsync');
      done();
    });

    afterEach(function (done) {
      Events.handleEnsureDockRemovedAsync.restore();
      done();
    });

    it('should throw error if handleEnsureDockRemovedAsync failed', function (done) {
      var error = new Error('test');
      Events.handleEnsureDockRemovedAsync.throws(error);
      ensureDockRemovedWorker({
        dockerUrl: '10.0.0.1:4224',
        githubId: '2335750'
      })
      .asCallback(function (err) {
        expect(err).to.equal(error);
        done();
      });
    });

    it('should throw missing dockerUrl', function (done) {
      ensureDockRemovedWorker({})
      .asCallback(function (err) {
        expect(err).to.be.instanceOf(TaskFatalError);
        done();
      });
    });

    it('should throw missing githubId', function (done) {
      ensureDockRemovedWorker({
        dockerUrl: '10.0.0.1:4224',
      })
      .asCallback(function (err) {
        expect(err).to.be.instanceOf(TaskFatalError);
        done();
      });
    });

    it('should be fine if no errors', function (done) {
      Events.handleEnsureDockRemovedAsync.returns();
      ensureDockRemovedWorker({
        dockerUrl: '10.0.0.1:4224',
        githubId: '2335750'
      }).asCallback(done);
    });
  }); // end run
}); // end docker.events-stream.connected unit test
