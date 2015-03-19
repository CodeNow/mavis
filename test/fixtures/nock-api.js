'use strict';

require('../../lib/loadenv.js')();
var nock = require('nock');
nock.enableNetConnect();

/**
 * Sets up persistent nock intercepts for various API endpoints.
 * @param  {Function} cb Callback to execute after endpoints have been intercepted.
 */
function intercept(cb) {
  var scope = nock(process.env.API_HOST).persist();

  scope.post('/auth/github/token')
    .reply(200, 'example_token');

  scope.get('/users/me')
    .replyWithFile(200, __dirname + '/data/user.json')

  scope.intercept('/auth', 'DELETE')
    .reply(200);

  scope
    .get('/instances?owner[github]=10224339&container.dockerContainer=1')
      .replyWithFile(200, __dirname + '/data/instances.json')
    .get('/instances?owner[github]=10224339&container.dockerContainer=invalid')
      .reply(200, '[]')

  if (cb) { cb(); }
}

function clean(cb) {
  nock.cleanAll();
  if (cb) { cb(); }
}

module.exports = {
  nock: intercept,
  clean: clean
}
