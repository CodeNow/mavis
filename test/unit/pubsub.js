'use strict';
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var Code = require('code');
var expect = Code.expect;

var createCount = require('callback-count');
var pubSub = require('../../lib/models/redis.js').pubSub;

lab.experiment('event pubSub unit test', function () {
  lab.experiment('onEvent', function () {
    var testData = {
      string: 'hi',
      object: {
        hello: 'test'
      },
      number: 124,
      bool: true
    };
    var key = 'runnable:test:event';
    lab.test('should callback with correct data on registered event', function (done) {
      pubSub.on(key, function test (data) {
        pubSub.removeListener(key, test);
        expect(testData).to.deep.equal(data);
        done();
      });

      pubSub.publish(key, testData);
    });

    lab.test('should callback with data on registered event with wildcard', function (done) {
      var globKey = 'runnable:test:*';
      pubSub.on(globKey, function test (data) {
        pubSub.removeListener(globKey, test);
        expect(testData).to.deep.equal(data);
        done();
      });

      pubSub.publish(key, testData);
    });

    lab.test('should not callback', function (done) {
      var globKey = 'runnable:fake:test:*';
      function errTest() {
        done(new Error('should not have called this'));
      }
      pubSub.on(globKey, errTest);
      pubSub.on(key, function test() {
        pubSub.removeListener(globKey, errTest);
        pubSub.removeListener(key, test);
        done();
      });

      pubSub.publish(key, testData);
    });

    lab.test('should callback all functions', function (done) {
      var globKey = 'runnable:test:*';
      function test (data) {
        expect(testData).to.deep.equal(data);
        count.next();
      }
      var count = createCount(4, function() {
        pubSub.removeAllListeners(key);
        pubSub.removeAllListeners(globKey);
        done();
      });
      pubSub.on(key, test);
      pubSub.on(key, test);
      pubSub.on(globKey, test);
      pubSub.on(globKey, test);
      pubSub.on('fake', function() {
        done(new Error('should not have called this'));
      });
      pubSub.on('runnable:', function() {
        done(new Error('should not have called this'));
      });

      pubSub.publish(key, testData);
    });
  }); // onEvent
}); // event pubSub