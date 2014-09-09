'use strict';
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var app = require('../lib/app.js');
var supertest = require('supertest');

lab.experiment('route tests', function () {
  lab.experiment('GET', function () {
    lab.test('/ - app info', function (done) {
      supertest(app)
        .get('/')
        .end(function (err, res) {
          if(err) {
            console.error('ERROR', err);
            return done(err);
          }
          Lab.expect(res.body.message).to.equal('runnable mavis: the fairy tactician');
          done(err);
        });
    });

    lab.test('/fake - unimplemented route', function (done) {
      supertest(app)
        .get('/fake')
        .expect(404)
        .end(function (err, res) {
          if (err) {
            console.error('ERROR', err);
            return done(err);
          }
          Lab.expect(res.body.message).to.equal('route not implemented');
          done(err);
        });
    });
  });
});
