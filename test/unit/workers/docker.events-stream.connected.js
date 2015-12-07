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
var dockerEventsStreamConnected = require('../../../lib/workers/docker.events-stream.connected.js');

describe('lib/workers/docker.events-stream.connected.js unit test', function () {
  it('should throw error if invalid host', function (done) {
    sinon.stub(Events, '_hasValidHost').returns(false);
    dockerEventsStreamConnected({})
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

  it('should add new dock', function (done) {
    sinon.spy(Events, '_hasValidHost');
    sinon.stub(dockData, 'addHost').yieldsAsync(null);
    dockerEventsStreamConnected({
      host: 'https://10.10.11.12:4242',
      tags: ['build', 'run']
    })
    .then(function () {
      expect(Events._hasValidHost.calledOnce).to.be.true();
      Events._hasValidHost.restore();
      expect(dockData.addHost.calledOnce).to.be.true();
      var args = dockData.addHost.getCall(0).args;
      expect(args[0]).to.equal('https://10.10.11.12:4242');
      expect(args[1]).to.deep.equal(['build', 'run']);
      dockData.addHost.restore();
      done();
    })
    .catch(done);
  });
}); // end docker.events-stream.connected unit test
