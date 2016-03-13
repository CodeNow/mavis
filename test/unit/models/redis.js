'use strict';

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var afterEach = lab.afterEach;
var beforeEach = lab.beforeEach;
var Code = require('code');
var expect = Code.expect;

var fs = require('fs');
var sinon = require('sinon');
var redis = require('redis');

var Redis = require('../../../lib/models/redis.js');

describe('lib/models/redis.js unit test', function () {
  describe('connect', function () {
    beforeEach(function (done) {
      sinon.stub(redis, 'createClient');
      done();
    });

    afterEach(function (done) {
      redis.createClient.restore();
      done();
    });

    describe('with tls', function (done) {
      var prevCACert = process.env.REDIS_CACERT;

      beforeEach(function (done) {
        process.env.REDIS_CACERT = 'foo';
        sinon.stub(fs, 'readFileSync').returns('bar');
        redis.createClient.returns({ on: sinon.stub() });
        done();
      });

      afterEach(function (done) {
        process.env.REDIS_CACERT = prevCACert;
        fs.readFileSync.restore();
        done();
      });

      it('should create a client with tls options', function (done) {
        Redis.connect();
        sinon.assert.called(fs.readFileSync)
        sinon.assert.calledWithExactly(
          fs.readFileSync,
          'foo',
          'utf-8'
        );
        sinon.assert.calledWith(
          redis.createClient,
          {
            host: process.env.REDIS_IPADDRESS,
            port: process.env.REDIS_PORT,
            tls: {
              rejectUnauthorized: true,
              ca: [ 'bar' ]
            }
          }
        );
        done();
      });
    });

    it('should create clients and attach error handles', function (done) {
      var redisMock = {
        on: sinon.stub()
      };
      redis.createClient.returns(redisMock);
      Redis.connect();
      expect(redisMock.on.calledOnce).to.be.true();
      done();
    });
  }); // end connect

  describe('disconnect', function () {
    it('should create clients and attach error handles', function (done) {
      Redis.client = {
        quit: sinon.stub()
      };

      Redis.disconnect();
      expect(Redis.client.quit.calledOnce).to.be.true();
      done();
    });
  }); // end disconnect

  describe('_handleError', function () {
    it('should throw when called', function (done) {
      var testErr = new Error('Gríma Wormtongue');
      expect(function () {
        Redis._handleError(testErr);
      }).to.throw(Error);
      done();
    });
  }); // end _handleError
}); // end redis.js unit test
