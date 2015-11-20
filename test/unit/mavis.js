'use strict';

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;
var Code = require('code');
var expect = Code.expect;

require('loadenv')('mavis:test');
var monitor = require('monitor-dog');
var mavis = require('../../lib/mavis');

var monitorFixture = require('../fixtures/monitor');
var dockDataFixture = require('../fixtures/dockData');
var dockData = require('../../lib/models/dockData');

describe('mavis', function() {
  beforeEach(function (done) {
    monitorFixture.stubAll();
    dockDataFixture.stub();
    done();
  });

  afterEach(function (done) {
    monitorFixture.restoreAll();
    dockDataFixture.restore();
    done();
  });

  describe('obtainOptimalHost', function() {
    it('should emit a datadog event when a host is selected', function(done) {
      var hint = { type: 'container_build' };
      mavis.obtainOptimalHost(hint, function (err) {
        if (err) { return done(err); }
        expect(monitor.event.calledOnce).to.be.true();
        expect(monitor.event.firstCall.args[0].title)
          .to.equal('mavis.host.selected');
        done();
      });
    });

    describe('with a previous dock that no longer exists', function () {
      beforeEach(function (done) {
        dockData.getValidDocks.yieldsAsync(null, [
          {
            host: '4567'
          }
        ]);
        done();
      });
      it('should find a new dock', function (done) {
        var hint = { prevDock: '1234', type: 'container_build' };
        mavis.obtainOptimalHost(hint, function (err, host) {
          if (err) { return done(err); }
          expect(host).to.equal('4567');
          done();
        });
      });
    });

    describe('with a previous dock that still exists', function () {
      beforeEach(function (done) {
        dockData.getValidDocks.yieldsAsync(null, [
          {
            host: '4567'
          },
          {
            host: '1234'
          }
        ]);
        done();
      });
      it('should find a new dock', function (done) {
        var hint = { prevDock: '1234', type: 'container_build' };
        mavis.obtainOptimalHost(hint, function (err, host) {
          if (err) { return done(err); }
          expect(host).to.equal('1234');
          done();
        });
      });
    });

  });
});
