'use strict';
require('loadenv')();

var Promise = require('bluebird')
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
var ErrorCat = require('error-cat');

var RabbitMQ = require('../../../lib/rabbitmq.js');
var Events = require('../../../lib/models/events.js');
var dockData = require('../../../lib/models/dockData.js');
var dockerEventsStreamDisconnected = require('../../../lib/workers/docker.events-stream.disconnected.js');

describe('docker.events-stream.disconnected.js unit test', function () {

  it('should throw error if invalid host', function (done) {
    sinon.stub(Events, '_hasValidHost').returns(false);
    dockerEventsStreamDisconnected({})
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

  it('should delete dock', function (done) {
    sinon.spy(Events, '_hasValidHost');
    sinon.stub(dockData, 'deleteHost').yieldsAsync(null);
    dockerEventsStreamDisconnected({
      host: 'https://10.10.11.12:4242',
      tags: ['build', 'run']
    })
    .then(function () {
      expect(Events._hasValidHost.calledOnce).to.be.true();
      Events._hasValidHost.restore();
      expect(dockData.deleteHost.calledOnce).to.be.true();
      var args = dockData.deleteHost.getCall(0).args;
      expect(args[0]).to.equal('https://10.10.11.12:4242');
      dockData.deleteHost.restore();
      done();
    })
    .catch(function (err) {
      throw new Error('Should not happen');
    });
  });
}); // end docker.events-stream.disconnected unit test
