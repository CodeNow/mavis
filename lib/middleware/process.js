'use strict';

var mavis = require('../mavis.js');

/**
 * Express request queue processor that finds optimal hosts.
 * @module mavis:process
 */
module.exports = optimalHostProcessor;

/**
 * Express route for determining an optimal host for the given hint.
 * @param {object} req Express request object.
 * @param {string} req.body JSON hint to use when determining the optimal host.
 * @param {object} res Express result object.
 * @param {function} next Express next method.
 * @param {function} cb Callback to execute once an optimal host has been found.
 */
function optimalHostProcessor (req, res, next, cb) {
  var hint = req.body;
  mavis.obtainOptimalHost(hint, function (err, dockHost) {
    cb();
    if (err) { return next(err); }
    res.status(200).json({ dockHost: dockHost });
  });
}
