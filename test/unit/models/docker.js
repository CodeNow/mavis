'use strict';

require('loadenv')();

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
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
        done();
      });

      it('should cb error if kill failed', function (done) {
        var error = new Error('iceberg');
        docker._client.kill.yieldsAsync(error);

        docker.killSwarmContainer(function (err) {
          expect(err).to.equal(error);
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