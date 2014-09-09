'use strict';
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var app = require('../lib/app.js');
var createCount = require('callback-count');
var supertest = require('supertest');
var redis = require('redis');
var redisClient = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_IPADDRESS);
var dock = ['10.101.2.1', '10.101.2.2', '10.101.2.3'];
var rnC = 'numContainers';
var rnB = 'numBuilds';
var rh = 'host';

lab.experiment('docks route tests', function () {
  lab.beforeEach(function (done) {
    redisClient.del(process.env.REDIS_HOST_KEYS, dock[1], dock[2], dock[0], done);
  });
  lab.experiment('GET', function () {
    lab.beforeEach(function (done){
      var count = createCount(done);
      redisClient.lpush(process.env.REDIS_HOST_KEYS, dock[1], dock[2], dock[0], count.inc().next);
      redisClient.hmset(dock[1], rnC, '0', rnB, '0', rh, dock[1], count.inc().next);
      redisClient.hmset(dock[2], rnC, '0', rnB, '0', rh, dock[2], count.inc().next);
      redisClient.hmset(dock[0], rnC, '0', rnB, '0', rh, dock[0], count.inc().next);
    });

    lab.test('/docks', function (done) {
      supertest(app)
        .get('/docks')
        .end(function (err, res) {
          if(err) {
            return done(err);
          }
          dock.forEach(function (host){
            Lab.expect(res.body).to.contain({ numContainers: 0, numBuilds: 0, host: host });
          });
          done(err);
        });
    });
  });
});