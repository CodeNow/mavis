'use strict';
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var app = require('../lib/app.js');
var createCount = require('callback-count');
var supertest = require('supertest');
var redis = require('redis');
var redisClient = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_IPADDRESS);
var dock = ['http://10.101.2.1:4242','http://10.101.2.2:4242','http://10.101.2.3:4242'];
var rnC = 'numContainers';
var rnB = 'numBuilds';
var rh = 'host';

function augmentHost(host) {
  return process.env.REDIS_HOST_KEYS + host;
}

lab.experiment('docks route tests', function () {
  lab.beforeEach(function (done) {
    redisClient.keys(process.env.REDIS_HOST_KEYS+'*', function(err, data) {
      if (!data) { return done(); }
      var count = createCount(done);
      count.inc();
      data.forEach(function(key) {
        redisClient.del(key, count.inc().next);
      });
      count.next();
    });
  });
  lab.experiment('GET /docks', function () {
    lab.beforeEach(function (done){
      var count = createCount(done);
      redisClient.hmset(augmentHost(dock[1]), rnC, '0', rnB, '0', rh, dock[1], count.inc().next);
      redisClient.hmset(augmentHost(dock[2]), rnC, '0', rnB, '0', rh, dock[2], count.inc().next);
      redisClient.hmset(augmentHost(dock[0]), rnC, '0', rnB, '0', rh, dock[0], count.inc().next);
    });

    lab.test('should get list of docks', function (done) {
      supertest(app)
        .get('/docks')
        .expect(200)
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

  lab.experiment('DELETE /docks', function () {
    lab.beforeEach(function (done){
      var count = createCount(done);
      redisClient.hmset(augmentHost(dock[1]), rnC, '0', rnB, '0', rh, dock[1], count.inc().next);
      redisClient.hmset(augmentHost(dock[2]), rnC, '0', rnB, '0', rh, dock[2], count.inc().next);
      redisClient.hmset(augmentHost(dock[0]), rnC, '0', rnB, '0', rh, dock[0], count.inc().next);
    });

    lab.test('should delete given host in body', function (done) {
      var delHost = 'http://10.101.2.1:4242';
      supertest(app)
        .delete('/docks')
        .send({
          host: delHost
        })
        .expect(200)
        .end(function (err) {
          if(err) { return done(err); }
          supertest(app)
            .get('/docks')
            .expect(200)
            .end(function (err, res) {
              Lab.expect(res.body).to.not.contain({
                numContainers: 0,
                numBuilds: 0,
                host: delHost
              });
              done(err);
            });
        });
    });

    lab.test('should delete given host in query', function (done) {
      var delHost = 'http://10.101.2.1:4242';
      supertest(app)
        .delete('/docks')
        .query({
          host: delHost
        })
        .expect(200)
        .end(function (err) {
          if(err) { return done(err); }
          supertest(app)
            .get('/docks')
            .expect(200)
            .end(function (err, res) {
              Lab.expect(res.body).to.not.contain({
                numContainers: 0,
                numBuilds: 0,
                host: delHost
              });
              done(err);
            });
        });
    });

    lab.test('should not delete other host', function (done) {
      var delHost = 'http://10.101.2.1:4342';
      supertest(app)
        .delete('/docks')
        .send({
          host: delHost
        })
        .expect(200)
        .end(function (err) {
          if(err) { return done(err); }
          supertest(app)
            .get('/docks')
            .expect(200)
            .end(function (err, res) {
              dock.forEach(function (host){
                Lab.expect(res.body).to.contain({ numContainers: 0, numBuilds: 0, host: host });
              });
              done(err);
            });
        });
    });

    lab.test('should error if host not sent', function (done) {
      supertest(app)
        .delete('/docks')
        .expect(400)
        .end(done);
    });

    lab.test('should error if invalid host sent (blank)', function (done) {
      supertest(app)
        .delete('/docks')
        .send({ host: ' ' })
        .expect(400)
        .end(done);
    });

    lab.test('should error if invalid host sent (no protocol)', function (done) {
      supertest(app)
        .delete('/docks')
        .send({ host: '10.101.2.1:4342' })
        .expect(400)
        .end(done);
    });

    lab.test('should error if invalid host sent (no hostname)', function (done) {
      supertest(app)
        .delete('/docks')
        .send({ host: 'http://:4342' })
        .expect(400)
        .end(done);
    });

    lab.test('should error if invalid host sent (no port)', function (done) {
      supertest(app)
        .delete('/docks')
        .send({ host: 'http://10.101.2.1' })
        .expect(400)
        .end(done);
    });
  });

  function post (body, check) {
    supertest(app)
      .post('/docks')
      .send(body)
      .expect(200)
      .end(function () {
        supertest(app)
          .get('/docks')
          .expect(200)
          .end(check);
      });
  }

  lab.experiment('POST /docks', function () {
    lab.beforeEach(function (done){
      var count = createCount(done);
      redisClient.hmset(augmentHost(dock[0]), rnC, '0', rnB, '0', rh, dock[0], count.inc().next);
    });
    lab.test('should update numBuilds', function (done) {
      var host = 'http://10.101.2.1:4242';
      post({
        host: host,
        key: 'numBuilds',
        value: 1234
      }, function (err, res) {
        if (err) { return done(err); }
        Lab.expect(res.body).to.contain({ numContainers: 0, numBuilds: 1234, host: host });
        done();
      });
    });
    lab.test('should update numContainers', function (done) {
      var host = 'http://10.101.2.1:4242';
      post({
        host: host,
        key: 'numContainers',
        value: 1234
      }, function (err, res) {
        if (err) { return done(err); }
        Lab.expect(res.body).to.contain({ numContainers: 1234, numBuilds: 0, host: host });
        done();
      });
    });

    lab.test('should error if host not sent', function (done) {
      supertest(app)
        .post('/docks')
        .expect(400)
        .end(done);
    });

    lab.test('should error if invalid host sent (blank)', function (done) {
      supertest(app)
        .post('/docks')
        .send({ host: ' ' })
        .expect(400)
        .end(done);
    });

    lab.test('should error key not sent', function (done) {
      var host = 'http://10.101.2.1:4242';
      supertest(app)
        .post('/docks')
        .send({ host: host })
        .expect(400)
        .end(done);
    });

    lab.test('should error if invalid key sent (blank)', function (done) {
      var host = 'http://10.101.2.1:4242';
      supertest(app)
        .post('/docks')
        .send({ host: host, key: ' ' })
        .expect(400)
        .end(done);
    });

    lab.test('should error value not sent', function (done) {
      var host = 'http://10.101.2.1:4242';
      supertest(app)
        .post('/docks')
        .send({ host: host, key: 'numContainers' })
        .expect(400)
        .end(done);
    });
  });

  lab.experiment('PUT /docks', function () {
    lab.test('should add a dock (host in body)', function (done) {
      var host = 'http://10.101.2.1:4242';
      supertest(app)
        .put('/docks')
        .send({
          host: host
        })
        .expect(200)
        .end(function (err) {
          if(err) { return done(err); }
          supertest(app)
            .get('/docks')
            .expect(200)
            .end(function (err, res) {
              Lab.expect(res.body).to.contain({
                numContainers: 0,
                numBuilds: 0,
                host: host
              });
              done(err);
            });
        });
    });

    lab.test('should add a dock (host in query)', function (done) {
      var host = 'http://10.101.2.1:4242';
      supertest(app)
        .put('/docks')
        .query({
          host: host
        })
        .expect(200)
        .end(function (err) {
          if(err) { return done(err); }
          supertest(app)
            .get('/docks')
            .expect(200)
            .end(function (err, res) {
              Lab.expect(res.body).to.contain({
                numContainers: 0,
                numBuilds: 0,
                host: host
              });
              done(err);
            });
        });
    });

    lab.test('should error if host not sent', function (done) {
      supertest(app)
        .put('/docks')
        .expect(400)
        .end(done);
    });

    lab.test('should error if invalid host sent (blank)', function (done) {
      supertest(app)
        .put('/docks')
        .send({ host: ' ' })
        .expect(400)
        .end(done);
    });

    lab.test('should error if invalid host sent (no protocol)', function (done) {
      supertest(app)
        .put('/docks')
        .send({ host: '10.101.2.1:4342' })
        .expect(400)
        .end(done);
    });

    lab.test('should error if invalid host sent (no hostname)', function (done) {
      supertest(app)
        .put('/docks')
        .send({ host: 'http://:4342' })
        .expect(400)
        .end(done);
    });

    lab.test('should error if invalid host sent (no port)', function (done) {
      supertest(app)
        .put('/docks')
        .send({ host: 'http://10.101.2.1' })
        .expect(400)
        .end(done);
    });
  });
});