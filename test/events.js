'use strict';
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var redisClient = require('../lib/models/redis.js');
var pubSub = require('../lib/models/redis.js').pubSub;
var dockData = require('../lib/models/dockData.js');

var request = require('request');
// start app
require('../index.js');

function getDocks(cb) {
  request('http://localhost:'+process.env.PORT+'/docks', function (err, response, body) {
    if (err || response.statusCode !== 200) {
      return cb(err || '200');
    }
    cb(null, body);
  });
}

lab.experiment('events test', function () {
  lab.beforeEach(function (done) {
    redisClient.flushall(done);
  });

  lab.experiment('start', function () {
    lab.beforeEach(function (done) {
      dockData.addHost('http://0.0.0.0:4242', done);
    });

    lab.test('should show normal container start', function(done){
      pubSub.publish('runnable:docker:start', {
        ip: '0.0.0.0',
        from: 'ubuntu'
      });
      getDocks(function test(err, data) {
        if (data.length === 0) { return getDocks(test)}

        done();
      });
    });
  });
  // lab.experiment('stop', function () {
  // });
  // lab.experiment('deamon stop', function () {
  // });
  // lab.experiment('deamon start', function () {
  // });
});