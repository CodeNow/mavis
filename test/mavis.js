'use strict';
var Lab = require('lab');
var app = require('../app.js');
var createCount = require('callback-count');
var supertest = require('supertest');
var redis = require('redis');
var redisClient = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_IPADDRESS);
var dock = ['10.101.2.1', '10.101.2.2', '10.101.2.3'];
var rnC = 'numContainers';
var rnB = 'numBuilds';
var rh = 'host';

Lab.experiment('mavis tests', function () {
  Lab.beforeEach(function (done) {
    var count = createCount(done);
    redisClient.del(process.env.REDIS_HOST_KEYS, dock[1], dock[2], dock[0], count.inc().next);
  });

  Lab.experiment('errors', function () {
    Lab.test('should 400 if no type sent', function(done) {
      supertest(app)
        .post('/dock')
        .expect(400)
        .end(done);
    });

    Lab.test('should 400 if invalid type sent', function(done) {
      supertest(app)
        .post('/dock')
        .send({
          type: 'Anand'
        })
        .expect(400)
        .end(done);
    });

    Lab.test('should 404 if no docks are left', function(done) {
      supertest(app)
        .post('/dock')
        .send({
          type: 'container_run'
        })
        .expect(503)
        .end(done);
    });
  });


  function getDock (data, done) {
    if (typeof data === 'string') {
      data = {
        type: data
      };
    }
    supertest(app)
      .post('/dock')
      .send(data)
    .expect(200)
    .end(done);
  }

  Lab.experiment('logic', function () {
    Lab.beforeEach(function(done){
      var count = createCount(done);
      redisClient.lpush(process.env.REDIS_HOST_KEYS, dock[1], dock[2], dock[0], count.inc().next);
      redisClient.hmset(dock[1], rnC, '0', rnB, '0', rh, dock[1], count.inc().next);
      redisClient.hmset(dock[2], rnC, '0', rnB, '0', rh, dock[2], count.inc().next);
      redisClient.hmset(dock[0], rnC, '0', rnB, '0', rh, dock[0], count.inc().next);
    });

    Lab.test('should update container_run redis key', function(done) {
      getDock('container_run', function(err, res) {
        if(err) {
          console.error('ERROR', err);
          return done(err);
        }
        redisClient.hget(res.body.dockHost, rnC, function(err, data) {
          if (err) {
            return done(err);
          }
          Lab.expect(data).to.equal('1');
          done();
        });
      });
    });
    Lab.test('should update container_build redis key', function(done) {
      getDock('container_build', function(err, res) {
        if(err) {
          console.error('ERROR', err);
          return done(err);
        }
        redisClient.hget(res.body.dockHost, rnB, function(err, data) {
          if (err) {
            return done(err);
          }
          Lab.expect(data).to.equal('1');
          done();
        });
      });
    });
    Lab.test('should grab dock with lowest builds', function(done) {
      var count = createCount(function(err) {
        if (err) {
          return done(err);
        }
        getDock('container_run', function(err, res) {
          if(err) {
            console.error('ERROR', err);
            return done(err);
          }
          Lab.expect(res.body.dockHost).to.equal(dock[2]);
          done();
        });
      });
      redisClient.hmset(dock[1], rnC, '0', rnB, '2', rh, dock[1], count.inc().next);
      redisClient.hmset(dock[2], rnC, '0', rnB, '1', rh, dock[2], count.inc().next);
      redisClient.hmset(dock[0], rnC, '0', rnB, '3', rh, dock[0], count.inc().next);
    });

    Lab.test('should grab dock with lowest builds', function(done) {
      var count = createCount(function(err) {
        if (err) {
          return done(err);
        }
        getDock('container_run', function(err, res) {
          if(err) {
            console.error('ERROR', err);
            return done(err);
          }
          Lab.expect(res.body.dockHost).to.equal(dock[2]);
          done();
        });
      });
      redisClient.hmset(dock[1], rnC, '0', rnB, '2', rh, dock[1], count.inc().next);
      redisClient.hmset(dock[2], rnC, '0', rnB, '1', rh, dock[2], count.inc().next);
      redisClient.hmset(dock[0], rnC, '0', rnB, '3', rh, dock[0], count.inc().next);
    });
    Lab.test('should grab dock with lowest containers', function(done) {
      var count = createCount(function(err) {
        if (err) {
          return done(err);
        }
        getDock('container_run', function(err, res) {
          if(err) {
            console.error('ERROR', err);
            return done(err);
          }
          Lab.expect(res.body.dockHost).to.equal(dock[0]);
          done();
        });
      });
      redisClient.hmset(dock[1], rnC, '3', rnB, '0', rh, dock[1], count.inc().next);
      redisClient.hmset(dock[2], rnC, '2', rnB, '0', rh, dock[2], count.inc().next);
      redisClient.hmset(dock[0], rnC, '1', rnB, '0', rh, dock[0], count.inc().next);
    });
    Lab.test('should grab dock with history', function(done) {
      var count = createCount(function(err) {
        if (err) {
          return done(err);
        }
        getDock({
          type: 'container_run',
          prevDock: dock[0]
        }, function(err, res) {
          if(err) {
            console.error('ERROR', err);
            return done(err);
          }
          Lab.expect(res.body.dockHost).to.equal(dock[0]);
          done();
        });
      });
      redisClient.hmset(dock[0], rnC, '1', rnB, '1', rh, dock[0], count.inc().next);
    });
    Lab.test('should spread load evenly', function(done) {
      var count = createCount(function(err){
        if(err) {
          return done(err);
        }
        var endCount = createCount(dock.length, done);
        function checkData(err, data) {
          if (err) {
            return endCount.next(err);
          }
          Lab.expect(data).to.equal('10');
          endCount.next();
        }
        for (var i = dock.length - 1; i >= 0; i--) {
          redisClient.hget(dock[i], rnC, checkData);
        }
      });
      for (var i = 30 - 1; i >= 0; i--) {
        getDock('container_run', count.inc().next);
      }
    });
  });
});