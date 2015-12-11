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

var Dockerode = require('dockerode');
var sinon = require('sinon');

var Docker = require('../../../lib/models/docker.js');

describe('lib/models/docker unit test', function () {
  describe('constructor', function () {
    it('should create Docker', function (done) {
      var docker = new Docker('http://10.0.0.1:4242');
      expect(docker._client).to.be.an.instanceof(Dockerode);
      done();
    });
  }); // end constructor

  describe('staticMethods', function () {
    describe('loadCerts', function () {
      it('should throw if missing certs', function (done) {
        process.env.DOCKER_CERT_PATH = 'fake/path';

        expect(Docker.loadCerts).to.throw();
        done();
      });

      it('should load certs', function (done) {
        process.env.DOCKER_CERT_PATH = './test/fixtures/certs';

        expect(Docker.loadCerts).to.not.throw();
        done();
      });
    }); // end loadCerts

    describe('ensureDockRemoved', function () {
      beforeEach(function (done) {
        sinon.stub(Dockerode.prototype, 'info');
        done();
      });

      afterEach(function (done) {
        Dockerode.prototype.info.restore();
        done();
      });

      it('should cb swarm error', function (done) {
        var testError = new Error('bee');
        Dockerode.prototype.info.yieldsAsync(testError);

        Docker.ensureDockRemoved('http://8.8.8.8:4242', function (err) {
          expect(err).to.equal(err);
          done();
        });
      });

      it('should cb error if dock in list', function (done) {
        Dockerode.prototype.info.yieldsAsync(null, {
          DriverStatus: [
            ['yellowjacket', 'mosquito'],
            ['flea', 'ladybug'],
            ['ip-10-1-1-1', '10.0.0.1:4242'],
          ]
        });

        Docker.ensureDockRemoved('http://10.0.0.1:4242', function (err) {
          expect(err.output.statusCode).to.equal(412);
          done();
        });
      });

      it('should cb with null if dock not in list', function (done) {
        Dockerode.prototype.info.yieldsAsync(null, {
          DriverStatus: [
            ['yellowjacket', 'mosquito'],
            ['flea', 'ladybug'],
            ['ip-10-1-1-1', '10.0.0.1:4242'],
          ]
        });

        Docker.ensureDockRemoved('http://10.0.0.2:4242', function (err) {
          expect(err).to.not.exist();
          done();
        });
      });
    }); // end ensureDockRemoved

    describe('_ignorableKillError', function () {
      it('should return false for {}', function (done) {
        expect(Docker._ignorableKillError({}))
          .to.be.false();
        done();
      });

      it('should return false for { statusCode: 400 }', function (done) {
        expect(Docker._ignorableKillError({ statusCode: 400 }))
          .to.be.false();
        done();
      });

      it('should return false for { json: "blood" }', function (done) {
        expect(Docker._ignorableKillError({ json: 'blood' }))
          .to.be.false();
        done();
      });

      it('should return false for { statusCode: 503, json: "runnning" }', function (done) {
        expect(Docker._ignorableKillError({ statusCode: 503, json: 'runnning' }))
          .to.be.false();
        done();
      });

      it('should return true for 500 error', function (done) {
        var real404Error = new Error('Error: HTTP code is 404 which indicates error: no such container - Cannot kill container block: nosuchcontainer: no such id: block')
        real404Error.reason = 'no such container';
        real404Error.statusCode = 404;
        real404Error.json = 'Cannot kill container block: nosuchcontainer: no such id: block\n';

        expect(Docker._ignorableKillError(real404Error))
          .to.be.true();
        done();
      });

      it('should return true for 500 error', function (done) {
        var real500Error = new Error('HTTP code is 500 which indicates error: server error - Cannot kill container swarm: notrunning: Container 1d413830f8b51a79633fb5101daa1d72851c14551dec2e26f364567097188b5e is not running')
        real500Error.reason = 'server error';
        real500Error.statusCode = 500;
        real500Error.json = 'Cannot kill container swarm: notrunning: Container 1d413830f8b51a79633fb5101daa1d72851c14551dec2e26f364567097188b5e is not running\n';

        expect(Docker._ignorableKillError(real500Error))
          .to.be.true();
        done();
      });
    }); // end _ignorableKillError
  }); // end staticMethods

  describe('prototype methods', function () {
    var docker;
    var dockerUrl = 'http://10.0.0.1:4242';

    beforeEach(function (done) {
      docker = new Docker(dockerUrl);
      done();
    });

    describe('killSwarmContainer', function () {
      beforeEach(function (done) {
        docker._client = {
          getContainer: sinon.stub().returnsThis(),
          kill: sinon.stub()
        };
        sinon.stub(Docker, '_ignorableKillError');
        done();
      });

      afterEach(function (done) {
        Docker._ignorableKillError.restore();
        done();
      });

      it('should cb error if kill failed', function (done) {
        var error = new Error('iceberg');
        docker._client.kill.yieldsAsync(error);
        Docker._ignorableKillError.returns(false);

        docker.killSwarmContainer(function (err) {
          expect(err).to.equal(error);
          done();
        });
      });

      it('should cb w/o error if kill error is _ignorableKillError', function (done) {
        var error = new Error('notFound');
        docker._client.kill.yieldsAsync(error);
        Docker._ignorableKillError.returns(true);

        docker.killSwarmContainer(function (err) {
          expect(err).to.not.exist();

          sinon.assert.calledOnce(docker._client.getContainer);
          sinon.assert.calledWith(
            docker._client.getContainer,
            'swarm'
          );
          sinon.assert.calledOnce(docker._client.kill);

          done();
        });
      });

      it('should cb on success', function (done) {
        docker._client.kill.yieldsAsync();

        docker.killSwarmContainer(function (err) {
          expect(err).to.not.exist();

          sinon.assert.calledOnce(docker._client.getContainer);
          sinon.assert.calledWith(
            docker._client.getContainer,
            'swarm'
          );
          sinon.assert.calledOnce(docker._client.kill);

          done();
        });
      });
    }); // end killSwarmContainer
  }); // end prototype methods
  });