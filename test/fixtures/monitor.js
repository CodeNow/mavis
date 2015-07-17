'use strict';

var monitor = require('monitor-dog');
var clientMethods = ['set', 'increment', 'histogram', 'gauge'];
var sinon = require('sinon');

/**
 * Module for stubbing monitor methods via sinon.
 * @author Ryan Sandor Richards
 * @module mavis:test:fixtures
 */
module.exports = {
  stubAll: stubAll,
  restoreAll: restoreAll
};

/**
 * Stubs all alias methods for the monitor module.
 */
function stubAll() {
  clientMethods.forEach(function (methodName) {
    sinon.stub(monitor, methodName);
  });
}

/**
 * Restores all stubbed alias methods for the monitor module.
 */
function restoreAll() {
  clientMethods.forEach(function (methodName) {
    monitor[methodName].restore();
  });
}
