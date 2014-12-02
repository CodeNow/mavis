'use strict';
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var noop = require('101/noop');
var error = require('../../lib/error.js');
var rollbar = require('rollbar');

lab.experiment('error.js unit test', function () {
  lab.experiment('errorCaster', function () {
    lab.test('basic', function (done) {
      var err = error.errorCaster(404, 'anand', { type:'test' });
      Lab.expect(err.output.statusCode).to.equal(404);
      Lab.expect(err.data.type).to.equal('test');
      Lab.expect(err.stack).to.be.a('string');
      Lab.expect(err.message).to.equal('anand');
      done();
    });
  });
  lab.experiment('errorResponder', function () {
    lab.test('casted error', function (done) {
      var err = error.errorCaster(404, 'anand', { type:'test' });
      var resTest = {
        json: function (error) {
          Lab.expect(error).to.equal(err.output.payload);
          done();
        },
        status: function (errCode) {
          Lab.expect(errCode).to.equal(404);
          return this;
        }
      };
      error.errorResponder(err, null, resTest, null);
    });
    lab.test('random error', function (done) {
      var err = new Error('test');
      var resTest = {
        json: function (error) {
          Lab.expect(error).to.eql({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'An internal server error occurred'
          });
          done();
        },
        status: function (errCode) {
          Lab.expect(errCode).to.equal(500);
          return this;
        }
      };
      error.errorResponder(err, null, resTest, null);
    });
    lab.experiment('non-test env', function() {
      var env;
      var handleErrorWithPayloadData;
      lab.beforeEach(function (done) {
        env = process.env.NODE_ENV;
        handleErrorWithPayloadData = rollbar.handleErrorWithPayloadData;
        process.env.NODE_ENV = 'staging'; // set env to not be test
        rollbar.handleErrorWithPayloadData = noop; // to be safe
        done();
      });
      lab.afterEach(function (done) {
        process.env.NODE_ENV = env; // restore env
        rollbar.handleErrorWithPayloadData = handleErrorWithPayloadData; // restore method
        done();
      });
      lab.test('random error causes report to be called', function (done) {
        var err = new Error('test');
        var mockRes = {
          status: function () {
            return this;
          },
          json: noop,
        };
        rollbar.handleErrorWithPayloadData = function (error) {
          Lab.expect(error.message).to.equal(err.message);
          done(); // make sure report is called
        };
        error.errorResponder(err, null, mockRes, null);
      });
    });
  });
});
