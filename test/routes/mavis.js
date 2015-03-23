'use strict';
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var app = require('../../lib/app.js');
var createCount = require('callback-count');
var supertest = require('supertest');
var redis = require('redis');
var createCount = require('callback-count');

var redisClient = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_IPADDRESS);
var dock = ['http://10.101.2.1:4242','http://10.101.2.2:4242','http://10.101.2.3:4242'];
var rnC = 'numContainers';
var rnB = 'numBuilds';
var rh = 'host';

function augmentHost(host) {
  return process.env.REDIS_HOST_KEYS + host;
}

lab.experiment('mavis tests', function () {
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

  lab.experiment('errors', function () {
    lab.test('should 400 if no type sent', function (done) {
      supertest(app)
        .post('/dock')
        .expect(400)
        .end(done);
    });

    lab.test('should 400 if invalid type sent', function (done) {
      supertest(app)
        .post('/dock')
        .send({
          type: 'Anand'
        })
        .expect(400)
        .end(done);
    });

    lab.test('should 404 if no docks are left', function (done) {
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

  lab.experiment('logic', function () {
    lab.beforeEach(function (done){
      var count = createCount(done);
      redisClient.hmset(augmentHost(dock[1]), rnC, '0', rnB, '0', rh, dock[1], count.inc().next);
      redisClient.hmset(augmentHost(dock[2]), rnC, '0', rnB, '0', rh, dock[2], count.inc().next);
      redisClient.hmset(augmentHost(dock[0]), rnC, '0', rnB, '0', rh, dock[0], count.inc().next);
    });

    lab.test('should update container_run redis key', function (done) {
      getDock('container_run', function (err, res) {
        if(err) {
          console.error('ERROR', err);
          return done(err);
        }
        redisClient.hget(augmentHost(res.body.dockHost), rnC, function (err, data) {
          if (err) {
            return done(err);
          }
          Lab.expect(data).to.equal('1');
          done();
        });
      });
    });

    lab.test( 'should not update redis container keys when finding random dock', function(done) {
      getDock('find_random_dock', function (err, res) {
        var counter = createCount(2 * dock.length, done);
        dock.forEach(function(dock) {
          redisClient.hget(augmentHost(dock), rnC, function(err, data) {
            if (err) { return done(err); }
            Lab.expect(data).to.equal('0');
            counter.next();
          });
          redisClient.hget(augmentHost(dock), rnB, function (err, data) {
            if (err) { return done(err); }
            Lab.expect(data).to.equal('0');
            counter.next();
          });
        });
      });
    });

    lab.test('should return prev dock if sent', function (done) {
      var dock = '10.5.1.4';
      getDock({
        type: 'container_run',
        prevDock: dock
      }, function (err, res) {
        Lab.expect(res.body.dockHost).to.equal(dock);
        done(err);
      });
    });
    lab.test('should update container_build redis key', function (done) {
      getDock('container_build', function (err, res) {
        if(err) {
          console.error('ERROR', err);
          return done(err);
        }
        redisClient.hget(augmentHost(res.body.dockHost), rnB, function (err, data) {
          if (err) {
            return done(err);
          }
          Lab.expect(data).to.equal('1');
          done();
        });
      });
    });
    lab.test('should grab dock with lowest builds', function (done) {
      var count = createCount(function (err) {
        if (err) {
          return done(err);
        }
        getDock('container_run', function (err, res) {
          if(err) {
            console.error('ERROR', err);
            return done(err);
          }
          Lab.expect(res.body.dockHost).to.equal(dock[2]);
          done();
        });
      });
      redisClient.hmset(augmentHost(dock[1]), rnC, '0', rnB, '2', rh, dock[1], count.inc().next);
      redisClient.hmset(augmentHost(dock[2]), rnC, '0', rnB, '1', rh, dock[2], count.inc().next);
      redisClient.hmset(augmentHost(dock[0]), rnC, '0', rnB, '3', rh, dock[0], count.inc().next);
    });

    lab.test('should grab dock with lowest builds', function (done) {
      var count = createCount(function (err) {
        if (err) {
          return done(err);
        }
        getDock('container_run', function (err, res) {
          if(err) {
            console.error('ERROR', err);
            return done(err);
          }
          Lab.expect(res.body.dockHost).to.equal(dock[2]);
          done();
        });
      });
      redisClient.hmset(augmentHost(dock[1]), rnC, '0', rnB, '2', rh, dock[1], count.inc().next);
      redisClient.hmset(augmentHost(dock[2]), rnC, '0', rnB, '1', rh, dock[2], count.inc().next);
      redisClient.hmset(augmentHost(dock[0]), rnC, '0', rnB, '3', rh, dock[0], count.inc().next);
    });
    lab.test('should grab dock with lowest containers', function (done) {
      var count = createCount(function (err) {
        if (err) {
          return done(err);
        }
        getDock('container_run', function (err, res) {
          if(err) {
            console.error('ERROR', err);
            return done(err);
          }
          Lab.expect(res.body.dockHost).to.equal(dock[0]);
          done();
        });
      });
      redisClient.hmset(augmentHost(dock[1]), rnC, '3', rnB, '0', rh, dock[1], count.inc().next);
      redisClient.hmset(augmentHost(dock[2]), rnC, '2', rnB, '0', rh, dock[2], count.inc().next);
      redisClient.hmset(augmentHost(dock[0]), rnC, '1', rnB, '0', rh, dock[0], count.inc().next);
    });
    lab.test('should grab dock with history', function (done) {
      var count = createCount(function (err) {
        if (err) {
          return done(err);
        }
        getDock({
          type: 'container_run',
          prevDock: dock[0]
        }, function (err, res) {
          if(err) {
            console.error('ERROR', err);
            return done(err);
          }
          Lab.expect(res.body.dockHost).to.equal(dock[0]);
          done();
        });
      });
      redisClient.hmset(augmentHost(dock[0]), rnC, '1', rnB, '1', rh, dock[0], count.inc().next);
    });
    lab.test('invalid data for docks should still be fine', function (done) {
      var count = createCount(function (err) {
        if (err) {
          return done(err);
        }
        getDock('container_run', function (err, res) {
          if(err) {
            console.error('ERROR', err);
            return done(err);
          }
          Lab.expect(res.body.dockHost).to.equal(dock[0]);
          done();
        });
      });
      redisClient.hdel(augmentHost(dock[1]), rnC, rh, count.inc().next);
      redisClient.hdel(augmentHost(dock[2]), rnC, rnB, count.inc().next);

      redisClient.hmset(augmentHost('http://0.0.0.3:4242'),
        rnB, '0', rh, '0.0.0.3', count.inc().next);
      redisClient.hmset(augmentHost('http://0.0.0.4:4242'),
        rnC, '1', count.inc().next);
      redisClient.hmset(augmentHost('http://0.0.0.5:4242'),
        rnC, '1', rh, '0.0.0.5', count.inc().next);
      redisClient.hmset(augmentHost('http://0.0.0.6:4242'),
        rnC, '1', rnB, '0', count.inc().next);
      redisClient.hmset(augmentHost('http://0.0.0.7:4242'),
        'cat', '1', count.inc().next);
    });
    lab.test('should spread load evenly', function (done) {
      var count = createCount(function (err){
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
          redisClient.hget(augmentHost(dock[i]), rnC, checkData);
        }
      });
      for (var i = 30 - 1; i >= 0; i--) {
        getDock('container_run', count.inc().next);
      }
    });
  });
});