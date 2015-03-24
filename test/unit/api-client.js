'use strict';
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('code').expect;

var api = require('../fixtures/nock-api.js');
var apiClient = require('../../lib/models/api-client.js');

lab.experiment('api-client', function() {
  lab.before(function(done) {
    api.nock(done);
  });

  lab.after(function(done) {
    api.clean(done);
  });

  lab.beforeEach(function(done) {
    apiClient.logout(done);
  });

  lab.test('should login via github', function(done) {
    apiClient.login(function (err, didLogin) {
      if (err) { return done(err); }
      expect(didLogin).to.be.true;
      expect(apiClient.client.attrs.accounts.github.accessToken).to.exist();
      done();
    });
  });

  lab.test('should not attempt to login if already logged in', function(done) {
    apiClient.login(function (err, didLogin) {
      if (err) { return done(err); }
      expect(didLogin).to.be.true;

      api.nock();
      apiClient.login(function (err, didLogin) {
        if (err) { return done(err); }
        expect(didLogin).to.be.false;
        done();
      });
    });
  });

  lab.test('should logout appropriately', function(done) {
    apiClient.login(function (err, didLogin) {
      apiClient.logout(function (err, wasLoggedIn) {
        expect(wasLoggedIn).to.be.true;
        done();
      });
    });
  });

  lab.test('should not attempt to logout if not logged in', function(done) {
    apiClient.logout(function (err, wasLoggedIn) {
      expect(wasLoggedIn).to.be.false;
      done();
    });
  });
});
