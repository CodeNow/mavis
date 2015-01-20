'use strict';
var StatsD = require('node-dogstatsd').StatsD;
var client = module.exports = new StatsD(
  process.env.DATADOG_HOST,
  process.env.DATADOG_PORT);
var exec = require('child_process').exec;
var dockData = require('./dockData.js');

function captureSocketCount () {
  var sockets = require('http').globalAgent.sockets;
  var request = require('http').globalAgent.requests;
  var key;

  for (key in sockets) {
    client.gauge('mavis.sockets_open', sockets[key].length, 1,
      ['target:'+key, 'pid:'+process.pid]);
  }

  for (key in request) {
    client.gauge('mavis.sockets_pending', request[key].length, 1,
      ['target:'+key, 'pid:'+process.pid]);
  }

  exec('lsof -p ' + process.pid + ' | wc -l', function (err, stdout) {
    if (err) { return; }
    client.gauge('mavis.openFiles', parseInt(stdout), 1, ['pid:'+process.pid]);
  });

  dockData.getValidDocks(function(err, data) {
    if (err) { return; }
    client.gauge('mavis.numBuilds', data.numBuilds, 1,
      ['pid:'+process.pid, 'dockHost:'+data.host]);
    client.gauge('mavis.numContainers', data.numContainers, 1,
      ['pid:'+process.pid, 'dockHost:'+data.host]);
  });
}

var interval;

function monitorStart () {
  if (interval) { return; }
  interval = setInterval(captureSocketCount, process.env.MONITOR_INTERVAL);
}

function monitorStop () {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}

module.exports.monitorStart = monitorStart;
module.exports.monitorStop  = monitorStop;
