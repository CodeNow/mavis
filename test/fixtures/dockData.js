'use strict';

var sinon = require('sinon');
var dockData = require('../../lib/models/dockData');

/**
 * Dock fixtures.
 * @type Array
 */
var docks = [
  { host: 'http://1.2.3.4:1234', numBuilds: 30, numContainers: 1 },
  { host: 'http://1.2.3.5:1234', numBuilds: 10, numContainers: 100 }
];

/**
 * Fixture for stubbing the results of dock data. This should be used when
 * unit testing methods that depend on results from dockData.getValidDocks.
 * @author Ryan Sandor Richards
 * @module mavis:test:fixtures
 */
module.exports = {
  stub: stub,
  restore: restore,
  docks: docks
};

/**
 * Stubs relevant methods of the dockData model.
 */
function stub() {
  // Note: this needs to be .yields and not .yieldsAsync to work with the
  //       tests below.
  sinon.stub(dockData, 'getValidDocks').yields(null, docks);
}

/**
 * Restores stubbed dockData model methods.
 */
function restore() {
  dockData.getValidDocks.restore();
}
