'use strict';
var put = require('101/put');
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var Code = require('code');
var expect = Code.expect;
var redis = require('../../lib/models/redis.js');
var dockData = require('../../lib/models/dockData.js');
var events = require('../../lib/models/events.js');
var sinon = require('sinon');
var Server = require('../../lib/server.js');
var request = require('request');
var Hermes = require('runnable-hermes');


function dataExpect1(data, numContainers, numBuilds, host) {
  expect(data.length).to.equal(1);
  dataExpectN(data, 0, numContainers, numBuilds, host);
}

function dataExpectN(data, n, numContainers, numBuilds, host) {
  data.forEach(function(item) {
    if(item.host === host) {
      expect(item.numContainers).to.equal(numContainers);
      expect(item.numBuilds).to.equal(numBuilds);
    }
  });
}

function dataExpectNone (data) {
  expect(data.length).to.equal(0);
}

function getDocks(cb) {
  request('http://localhost:'+process.env.PORT+'/docks', function (err, response, body) {
    if (err || response.statusCode !== 200) {
      return cb(err || '200');
    }
    cb(null, JSON.parse(body));
  });
}

var host = 'http://0.0.0.0:4242';
var ctx = {};

lab.experiment('events test', function () {
  lab.beforeEach(function (done) {
    var opts = {
      hostname: process.env.RABBITMQ_HOSTNAME,
      password: process.env.RABBITMQ_PASSWORD,
      port: process.env.RABBITMQ_PORT,
      username: process.env.RABBITMQ_USERNAME,
      name: 'mavis'
    };

    ctx.rabbit = new Hermes(put({
      queues: [
        'on-dock-unhealthy'
      ],
      publishedEvents: [
        'container.life-cycle.died',
        'docker.events-stream.connected',
        'docker.events-stream.disconnected'
      ]
      }, opts))
    .on('error', done)
    .connect(done);
  });
  lab.afterEach(function (done) {
    ctx.rabbit.close(done);
  });

  lab.beforeEach(function(done) {
    ctx.server = new Server();
    ctx.server.start(done);
  });

  lab.afterEach(function(done) {
    ctx.server.stop(done);
  });

  lab.beforeEach(function (done) {
    redis.client.flushall(done);
  });

  lab.experiment('container.life-cycle.died', function () {
    var containerRunFrom = process.env.RUNNABLE_REGISTRY +
      '/146592/5511da373f57ab170045d58d:5511da373f57ab170045d590';

    lab.beforeEach(function (done) {
      dockData.addHost(host, '', done);
    });


    lab.test('should decrement build count', function (done) {
      getDocks(function test(err, data) {
        // reccur
        if (data[0].numBuilds === 0) { return getDocks(test); }
        dataExpect1(data, 0, -1, host);
        done();
      });
      ctx.rabbit.publish('container.life-cycle.died', {
        ip: '0.0.0.0',
        host: host,
        from: process.env.IMAGE_BUILDER,
        inspectData: {
          Config: {
            Labels: { type: process.env.IMAGE_BUILDER_LABEL }
          }
        }
      });
    });
  }); // container.life-cycle.died

  lab.experiment('docker.events-stream.disconnected', function () {
    lab.beforeEach(function (done) {
      dockData.addHost(host, '', done);
    });

    lab.test('should remove host', function(done){
      ctx.rabbit.publish('docker.events-stream.disconnected',  {
        ip: '0.0.0.0',
        host: host,
        from: 'ubuntu',
        inspectData: {
          Config: {
            Labels: { type: '' }
          }
        }
      });
      // reccur
      getDocks(function test (err, data) {
        if (data.length !== 0) { return getDocks(test); }
        dataExpectNone(data);
        done();
      });
    });
  }); // docker.events-stream.disconnected

  lab.experiment('docker.events-stream.connected', function () {
    lab.test('should add host without tags', function(done){
      ctx.rabbit.publish('docker.events-stream.connected',  {
        ip: '0.0.0.0',
        host: host,
        from: 'ubuntu',
        inspectData: {
          Config: {
            Labels: { type: '' }
          }
        }
      });
      getDocks(function test (err, data) {
        if (data.length === 0) { return getDocks(test); }
        dataExpect1(data, 0, 0, host);
        done();
      });
    });
    lab.test('should add host with tags', function(done){
      var tags = 'test,tags';
      ctx.rabbit.publish('docker.events-stream.connected',  {
        ip: '0.0.0.0',
        host: host,
        from: 'ubuntu',
        tags: tags,
        inspectData: {
          Config: {
            Labels: { type: '' }
          }
        }
      });
      getDocks(function test (err, data) {
        if (data.length === 0) { return getDocks(test); }
        expect(data[0].tags).to.deep.equal(tags);
        dataExpect1(data, 0, 0, host);
        done();
      });
    });
  }); // docker.events-stream.connected
}); // events test
