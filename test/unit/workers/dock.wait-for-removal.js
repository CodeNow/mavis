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
      sinon.stub(Events, 'handleensureDockRemovedAsync');
      done();
    });

    afterEach(function (done) {
      Events.handleensureDockRemovedAsync.restore();
      done();
    });

    it('should throw error if handleensureDockRemovedAsync failed', function (done) {
      var error = new Error('test');
      Events.handleensureDockRemovedAsync.throws(error);
      ensureDockRemovedWorker({
        dockerUrl: '10.0.0.1:4224',
      })
      .then(function () {
        throw new Error('should have thrown');
      })
      .catch(function (err) {
        expect(err).to.equal(error);
        done();
      });
    });

    it('should throw missing dockerUrl', function (done) {
      ensureDockRemovedWorker({})
        .then(function () {
          throw new Error('should have thrown');
        })
        .catch(function (err) {
          expect(err).to.be.instanceOf(TaskFatalError);
          done();
        });
    });

    it('should be fine if no errors', function (done) {
      Events.handleensureDockRemovedAsync.returns();
      ensureDockRemovedWorker({
        dockerUrl: '10.0.0.1:4224'
      })
      .then(done)
      .catch(done);
    });
  }); // end run
}); // end docker.events-stream.connected unit test
