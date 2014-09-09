'use strict';
var Lab = require('lab');

Lab.experiment('loadenv.js unit test', function () {
  Lab.experiment('basic', function () {
    Lab.test('load 2 times', function(done) {
      var loadenv = require('../lib/loadenv.js');
      loadenv();
      loadenv();
      done();
    });
  });
});
