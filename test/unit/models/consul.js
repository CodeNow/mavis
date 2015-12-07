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
var TaskError = require('ponos').TaskError;

var Consul = require('../../../lib/models/consul.js');

describe('lib/models/consul unit test', function () {
  describe('ensureDockRemoved', function () {
    var dockerUrl = 'http://11.17.38.11:4242';

    beforeEach(function (done) {
      sinon.stub(Consul._client.kv, 'get');
      done();
    });

    afterEach(function (done) {
      Consul._client.kv.get.restore();
      done();
    });

    it('should cb with error from Consul._client.kv.get', function (done) {
      var error = new Error('starcraft');

      Consul._client.kv.get.yieldsAsync(error);

      Consul.ensureDockRemoved(dockerUrl, function (err) {
        expect(err).to.equal(error);
        done();
      });
    });

    it('should cb an err if result exists', function (done) {
      // returning non falsey means the dock hasn't been removed
      Consul._client.kv.get.yieldsAsync(null, {some: 'stuff'});

      Consul.ensureDockRemoved(dockerUrl, function (err) {
        expect(err).to.exist();
        done();
      });
    });

    it('should cb with no err if result does not exist', function (done) {
      // returning null means the dock hasn't been removed
      Consul._client.kv.get.yieldsAsync(null, null);

      Consul.ensureDockRemoved(dockerUrl, function (err) {
        expect(err).to.not.exist();
        sinon.assert.calledOnce(Consul._client.kv.get);

        sinon.assert.calledWith(
          Consul._client.kv.get,
          'swarm/docker/swarm/nodes/11.17.38.11:4242'
        );

        done();
      });
    });
  }); // end ensureDockRemoved
});