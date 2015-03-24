require('../loadenv.js')();
var User = require('runnable');

var client = new User(process.env.API_HOST);
var isLoggedIn = false;

/**
 * Constructs and authorizes an API client.
 * @param {loginCallback} cb Handles response.
 */

/**
 * Response callback to execute after client login has completed.
 * @callback loginCallback
 * @param err Error response, if applicable.
 * @param {boolean} didLogin Whether or not the method actually performed a client github login.
 *   `true` if a request was made to the api, `false` if the client was already logged in.
 */
function login(cb) {
  if (!isLoggedIn) {
    isLoggedIn = true;
    client.githubLogin(process.env.HELLO_RUNNABLE_API_TOKEN, function(err, token) {
      if (err) { return cb(err); }
      client.attrs.accounts.github.accessToken = token;
      cb(null, true);
    });
  }
  else {
    cb(null, false);
  }
}

/**
 * Logs the api client out.
 * @callback logoutCallback
 */

/**
 * Response callback to execute after the client has been logged out.
 * @param err Error response, if applicable.
 * @param {boolean} wasLoggedIn `true` if the client was logged in, `false` otherwise.
 */
function logout(cb) {
  if (isLoggedIn) {
    isLoggedIn = false;
    client.logout(function(err) {
      if (err) { return cb(err); }
      cb(null, true);
    });
  }
  else {
    cb(null, false);
  }
}

module.exports = {
  client: client,
  login: login,
  logout: logout
};
