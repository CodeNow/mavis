'use strict';

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;
var Code = require('code');
var expect = Code.expect;
var sinon = require('sinon');

require('loadenv')('mavis:test');
var monitor = require('monitor-dog');
var monitorFixture = require('../../fixtures/monitor');
var dockDataFixture = require('../../fixtures/dockData');
var dockData = require('../../../lib/models/dockData');
var docksMonitor = require('../../../lib/models/docks-monitor');

describe('docks-monitor', function() {
  var clock;
  var docks = dockDataFixture.docks;

  beforeEach(function (done) {
    clock = sinon.useFakeTimers();
    monitorFixture.stubAll();
    docksMonitor.start();
    dockDataFixture.stub();
    done();
  });

  afterEach(function (done) {
    monitorFixture.restoreAll();
    clock.restore();
    docksMonitor.stop();
    dockDataFixture.restore();
    done();
  });

  it('should periodically report dock metrics', function(done) {
    clock.tick(docksMonitor.interval);
    expect(monitor.gauge.callCount).to.equal(4);
    expect(monitor.gauge.firstCall.calledWith(
      'numBuilds', docks[0].numBuilds
    )).to.be.true();
    expect(monitor.gauge.secondCall.calledWith(
      'numContainers', docks[0].numContainers
    )).to.be.true();
    expect(monitor.gauge.thirdCall.calledWith(
      'numBuilds', docks[1].numBuilds
    )).to.be.true();
    expect(monitor.gauge.lastCall.calledWith(
      'numContainers', docks[1].numContainers
    )).to.be.true();
    done();
  });

  it('should ignore errors when reporting dock metrics', function(done) {
    dockData.getValidDocks.yields(new Error('wowza'));
    clock.tick(docksMonitor.interval);
    expect(monitor.gauge.callCount).to.equal(0);
    done();
  });

  it('should ignore non-object docks list', function(done) {
    dockData.getValidDocks.yields(null, 1);
    clock.tick(docksMonitor.interval);
    expect(monitor.gauge.callCount).to.equal(0);
    done();
  });
});
