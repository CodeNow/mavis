'use strict';

var monitor = require('monitor-dog');
var IntervalMonitor = require('monitor-dog/lib/interval-monitor');
var dockData = require('./dockData.js');
var util = require('util');

/**
 * Interval monitor for reporting dock metrics.
 */
function DocksMonitor() {
  IntervalMonitor.call(this, monitor);
}
util.inherits(DocksMonitor, IntervalMonitor);

/**
 * Reports number of builds and number of running continers to datadog.
 */
DocksMonitor.prototype.run = function () {
  dockData.getValidDocks('', function(err, docks) {
    if (err || typeof docks !== 'object') { return; }
    docks.forEach(function(dock) {
      monitor.gauge('numBuilds', dock.numBuilds, 1,
        ['pid:'+process.pid, 'dockHost:'+dock.host]);
      monitor.gauge('numContainers', dock.numContainers, 1,
        ['pid:'+process.pid, 'dockHost:'+dock.host]);
    });
  });
};

/**
 * Monitors docks and reports metrics on number of builds and number of
 * containers via monitor-dog.
 * @author Ryan Sandor Richards
 * @module mavis:model:interval-monitor
 */
module.exports = new DocksMonitor(monitor);
