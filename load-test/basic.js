'use strict';
var Lab = require('lab');
var app = require('../app.js');
var testPort = 44321;
var request = require('request');
var createCount = require('callback-count');

Lab.experiment('performance test', function () {
  var server = null;
  Lab.beforeEach(function (done) {
    server = app.listen(testPort, done);
  });
  Lab.afterEach(function(done) {
    server.close(done);
  });

  Lab.experiment('instant', function () {
    for (var i = 1; i <= 100000; i = i*10) {
      Lab.test(i + ' req',{ timeout: 2000+i*2 }, reqTest(i, 'instant'));
    }
  });

  Lab.experiment('gradual', function () {
    for (var i = 1; i <= 100000; i = i*10) {
      Lab.test(i + ' req',{ timeout: 2000+i*2 }, reqTest(i, 'gradual'));
    }
  });
});

function reqTest (numReq, type) {
  return function (done) {
    var start = new Date();
    var count = createCount(numReq, function(err) {
      if(err) {
        console.error('ERROR', err);
        return done(err);
      }
      console.log('avg req/s for', numReq, 'req', numReq / ((new Date() - start)/1000));
      done();
    });

    for (var i = numReq; i > 0 ; i--) {
      if (type === 'gradual') {
        setTimeout(sendRequest(count.next), (1000 / numReq) * i);
      } else {
        sendRequest(count.next)();
      }
    }
  };
}

function sendRequest(cb) {
  return function() {
    request.post({
        url: 'http://localhost:'+testPort+'/dock',
        json: {
          type: 'container_run'
        }
      }, checkRes(cb));
  };
}

function checkRes(cb) {
  return function(err, res) {
    if (err) {
      return cb(err);
    }
    if (res.statusCode !== 200) {
      return cb(new Error('req failed'));
    }
    cb();
  };
}