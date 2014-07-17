'use strict';
var Lab = require('lab');
var app = require('../app.js');
var supertest = require('supertest');

Lab.experiment('route tests', function () {
  Lab.experiment('GET', function () {
    Lab.test('/ - app info', function(done) {
      supertest(app)
        .get('/')
        .end(function(err, res) {
          if(err) {
            console.error('ERROR', err);
            return done(err);
          }
          Lab.expect(res.body.message).to.equal('runnable mavis: the fairy tactician');
          done(err);
        });
    });

    Lab.test('/fake - unimplemented route', function(done) {
      supertest(app)
        .get('/fake')
        .expect(404)
        .end(function(err, res) {
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
