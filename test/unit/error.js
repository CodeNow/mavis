'use strict';
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var error = require('../../lib/error.js');

lab.experiment('error.js unit test', function () {
  lab.experiment('errorCaster', function () {
    lab.test('basic', function (done) {
      var err = error.errorCaster(404, 'anand', { type:'test' });
      Lab.expect(err.code).to.equal(404);
      Lab.expect(err.data.data.type).to.equal('test');
      Lab.expect(err.data.stack).to.be.a('string');
      Lab.expect(err.message).to.equal('anand');
      done();
    });
  });
  lab.experiment('errorResponder', function () {
    lab.test('casted error', function (done) {
      var err = error.errorCaster(404, 'anand', { type:'test' });
      var resTest = {
        json: function (error) {
          Lab.expect(error).to.equal(err);
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
          Lab.expect(error).to.equal(err);
          done();
        },
        status: function (errCode) {
          Lab.expect(errCode).to.equal(500);
          return this;
        }
      };
      error.errorResponder(err, null, resTest, null);
    });
  });
});
