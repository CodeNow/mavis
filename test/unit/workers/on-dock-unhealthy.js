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

var Worker = require('../../../lib/workers/on-dock-unhealthy.js');
var dockData = require('../../../lib/models/dockData.js');
var error = require('../../../lib/error.js');
var rabbitMQ = require('../../../lib/rabbitmq.js');

describe('on-dock-unhealthy unit test', function () {
  var worker;
  beforeEach(function (done) {
    worker = new Worker();
    rabbitMQ.hermesClient =  {
      publish: sinon.stub()
    };
    done();
  });

  afterEach(function(done) {
    delete rabbitMQ.hermesClient;
    done();
  });

  describe('worker', function() {
    beforeEach(function(done) {
      sinon.stub(Worker.prototype, 'handle');
      sinon.stub(error, 'log').returns();
      done();
    });

    afterEach(function(done) {
      Worker.prototype.handle.restore();
      error.log.restore();
      done();
    });

    it('should call handle', function(done) {
      Worker.prototype.handle.yieldsAsync();
      Worker.worker({}, function (err) {
        expect(err).to.not.exist();
        expect(Worker.prototype.handle.called).to.be.true();
        done();
      });
    });

    it('should catch thrown errors', function(done) {
      Worker.prototype.handle.throws();
      Worker.worker({}, function (err) {
        expect(err).to.not.exist();
        expect(error.log.called).to.be.true();
        expect(Worker.prototype.handle.called).to.be.true();
        done();
      });
    });
  }); // end worker

  describe('handle', function () {
    beforeEach(function(done) {
      sinon.stub(Worker, '_isValidHost');
      sinon.stub(dockData, 'deleteHost');
      sinon.stub(error, 'log').returns();
      done();
    });

    afterEach(function(done) {
      Worker._isValidHost.restore();
      dockData.deleteHost.restore();
      error.log.restore();
      done();
    });

    it('should error if invalid host', function(done) {
      Worker._isValidHost.returns(false);
      rabbitMQ.hermesClient.publish.returns();
      worker.handle({}, function (err) {
        expect(err).to.not.exist();
        expect(dockData.deleteHost.called).to.be.false();
        expect(error.log.called).to.be.true();
        expect(rabbitMQ.hermesClient.publish.called).to.be.false();
        done();
      });
    });

    it('should error if delete failed', function(done) {
      Worker._isValidHost.returns(true);
      dockData.deleteHost.yieldsAsync(new Error('fire sword'));
      worker.handle({host: 'http://10.0.0.0:4242'}, function (err) {
        expect(err).to.not.exist();
        expect(dockData.deleteHost.called).to.be.true();
        expect(error.log.called).to.be.true();
        expect(rabbitMQ.hermesClient.publish.called).to.be.false();
        done();
      });
    });

    it('should delete host', function(done) {
      var testHost = 'http://10.20.1.26:4242';
      var testGihubId = 2194285;
      var testData = {
        host: testHost,
        githubId: testGihubId
      };
      Worker._isValidHost.returns(true);
      dockData.deleteHost.yieldsAsync();
      rabbitMQ.hermesClient.publish.returns();
      worker.handle(testData, function (err) {
        expect(err).to.not.exist();
        expect(dockData.deleteHost.called).to.be.true();
        expect(error.log.called).to.be.false();
        expect(rabbitMQ.hermesClient.publish
          .withArgs('on-dock-removed', {host: testHost}));
        expect(rabbitMQ.hermesClient.publish
          .withArgs('cluster-instance-provision', {githubId: testGihubId}));
        done();
      });
    });
  }); // handle

  describe('_isValidHost', function() {
    it('should return true', function(done) {
      ['http://10.2.1.0:4242',
      'http://coolDock:4242',
      'https://10.2.1.0:4242',
      'http://10.2.1.0:123'].forEach(function (host) {
        var output = Worker._isValidHost(host);
        expect(output).to.be.true();
      });
      done();
    });

    it('should return false', function(done) {
      ['://10.2.1.0:4242',
      {}, [], null, undefined,
      'http://coolDock',
      'asdhflas',
      'http://:4242',
      '4242',
      '10.0.0.1'
      ].forEach(function (host) {
        var output = Worker._isValidHost(host);
        expect(output).to.be.false();
      });
      done();
    });
  }); // end _isValidHost
}); // end on-dock-unhealthy unit test