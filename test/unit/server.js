'use strict';

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var afterEach = lab.afterEach;
var beforeEach = lab.beforeEach;
var Code = require('code');
var expect = Code.expect;

var sinon = require('sinon');

var Redis = require('../../lib/models/redis.js');
var monitor = require('monitor-dog');
var WorkerServer = require('../../lib/models/worker-server.js');
var docksMonitor = require('../../lib/models/docks-monitor');
var RabbitMQ = require('../../lib/rabbitmq.js');
var Server = require('../../lib/server.js');
var app = require('../../lib/app');
var Docker = require('../../lib/models/docker.js');


describe('server.js unit test', function () {
  describe('start', function () {
    beforeEach(function (done) {
      sinon.stub(monitor, 'startSocketsMonitor');
      sinon.stub(docksMonitor, 'start');
      sinon.stub(Redis, 'connect');
      sinon.stub(app, 'listen');
      sinon.stub(RabbitMQ, 'create');
      sinon.stub(WorkerServer, 'listen');
      sinon.stub(Docker, 'loadCerts');
      done();
    });

    afterEach(function (done) {
      monitor.startSocketsMonitor.restore();
      docksMonitor.start.restore();
      Redis.connect.restore();
      app.listen.restore();
      RabbitMQ.create.restore();
      WorkerServer.listen.restore();
      Docker.loadCerts.restore();
      done();
    });

    it('should startup all services', function (done) {
      monitor.startSocketsMonitor.returns();
      docksMonitor.start.returns();
      Redis.connect.returns();
      Docker.loadCerts.returns();
      app.listen.yieldsAsync();
      RabbitMQ.create.yieldsAsync();
      WorkerServer.listen.yieldsAsync();

      var server = new Server();
      server.start(function (err) {
        expect(err).to.not.exist();
        expect(monitor.startSocketsMonitor.calledOnce).to.be.true();
        expect(docksMonitor.start.calledOnce).to.be.true();
        expect(Redis.connect.calledOnce).to.be.true();
        expect(app.listen.calledOnce).to.be.true();
        expect(RabbitMQ.create.calledOnce).to.be.true();
        expect(WorkerServer.listen.calledOnce).to.be.true();
        done();
      });
    });

    it('should cb err if rabbitmq setup failed', function (done) {
      monitor.startSocketsMonitor.returns();
      docksMonitor.start.returns();
      Redis.connect.returns();
      app.listen.yieldsAsync();
      RabbitMQ.create.yieldsAsync('Error');
      WorkerServer.listen.yieldsAsync();

      var server = new Server();
      server.start(function (err) {
        expect(err).to.exist();
        done();
      });
    });
  }); // end start

  describe('stop', function () {
    beforeEach(function (done) {
      sinon.stub(monitor, 'stopSocketsMonitor');
      sinon.stub(docksMonitor, 'stop');
      sinon.stub(Redis, 'disconnect');
      sinon.stub(app, 'listen').yieldsAsync({
        close: function () {}
      });
      sinon.stub(RabbitMQ, 'close');
      sinon.stub(WorkerServer, 'stop');
      done();
    });

    afterEach(function (done) {
      monitor.stopSocketsMonitor.restore();
      docksMonitor.stop.restore();
      Redis.disconnect.restore();
      app.listen.restore();
      RabbitMQ.close.restore();
      WorkerServer.stop.restore();
      done();
    });

    it('should shutdown all services', function (done) {
      monitor.stopSocketsMonitor.returns();
      docksMonitor.stop.returns();
      Redis.disconnect.returns();
      RabbitMQ.close.yieldsAsync();
      WorkerServer.stop.yieldsAsync();

      var server = new Server();
      server.server = {
        close: function (cb) {
          cb();
        }
      }
      server.stop(function (err) {
        expect(err).to.not.exist();
        expect(monitor.stopSocketsMonitor.calledOnce).to.be.true();
        expect(docksMonitor.stop.calledOnce).to.be.true();
        expect(Redis.disconnect.calledOnce).to.be.true();
        expect(RabbitMQ.close.calledOnce).to.be.true();
        expect(WorkerServer.stop.calledOnce).to.be.true();
        done();
      });
    });

    it('should swallow error', function (done) {
      monitor.stopSocketsMonitor.returns();
      docksMonitor.stop.returns();
      Redis.disconnect.returns();
      RabbitMQ.close.yieldsAsync();
      WorkerServer.stop.yieldsAsync('Error');

      var server = new Server();
      server.server = {
        close: function (cb) {
          cb();
        }
      }
      server.stop(function (err) {
        expect(err).to.not.exist();
        expect(monitor.stopSocketsMonitor.calledOnce).to.be.true();
        expect(docksMonitor.stop.calledOnce).to.be.true();
        expect(Redis.disconnect.calledOnce).to.be.true();
        expect(RabbitMQ.close.calledOnce).to.be.true();
        expect(WorkerServer.stop.calledOnce).to.be.true();
        done();
      });
    });
  }); // end stop
}); // end server.js unit test
