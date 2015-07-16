'use strict';

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var beforeEach = lab.beforeEach;
var after = lab.after;
var afterEach = lab.afterEach;
var Code = require('code');
var expect = Code.expect;
var sinon = require('sinon');
var supertest = require('supertest');

var app = require('../../lib/app.js');

describe('basic routes', function() {
  describe('GET', function() {
    it('/ should return app info', function(done) {
      supertest(app).get('/').end(function (err, res) {
        if (err) { return done(err); }
        expect(res.body.message).to.equal('Mavis: the fairy tactician');
        done();
      });
    });
    it('should return 404 for unknown routes', function(done) {
      supertest(app).get('/fake').expect(404).end(function (err, res) {
        if (err) { return done(err); }
        expect(res.body.message).to.equal('Route not found');
        done();
      });
    });
  });
});
