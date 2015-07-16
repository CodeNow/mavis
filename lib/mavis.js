'use strict';
/** scheduler
  params per box
    # builds acceptable/building
    # containres possible/running
    has hint.prevDock
*/

require('loadenv')('mavis:env');

var error = require('./error.js').errorCaster;
var dockData = require('./models/dockData.js');
var log = require('./logger').child({ module: 'mavis' });

/**
 * Module for determining optimal hosts given a hint from a client. This is the
 * central brain of Mavis, as it determines how docks are chosen for builds and
 * runs.
 * @module mavis:mavis
 */
module.exports = {
  obtainOptimalHost: obtainOptimalHost
};

/**
 * Finds an optimal host for a build or run given hint information about the
 * request.
 * @param {Object} hint Hint information about the host request.
 * @param {String} hint.type Type of host to find.
 * @param {String} hint.prevDock A dock previously found by this method which
 *                 should be used (bypassing the optimal host lookup).
 * @param {String} hint.tags Comma separated tags used to filter the possible
 *                 docks for the lookup.
 * @param {function} cb Callback to execute once an optimal host has been found.
 */
function obtainOptimalHost (hint, cb) {
  log.info({ hint: hint }, 'Obtaining optimal host.');

  // Validate the incoming data
  if (!hint.type) {
    return cb(error(400, 'No hint type specified'));
  }

  if (isValidHintType(hint.type)) {
    return cb(error(400, 'Cannot handle type: ' + hint.type));
  }

  var hasPreviousDock = typeof hint.prevDock === 'string';
  var isTypeRandom = hint.type === 'find_random_dock';

  // Do not allow prevDock hints when using type `find_random_dock`
  if (isTypeRandom && hasPreviousDock) {
    return cb(error(400, 'Cannot handle type ' + hint.type + ' with prevDock'));
  }

  // FIXME: for now if prevDock sent, return it
  if (typeof hint.prevDock === 'string') {
    log.trace('Hint provided a previous dock, skipping optimal host lookup.');
    return dockData.incKey(hint.prevDock, hint.type, 1, function (err) {
      cb(err, hint.prevDock);
    });
  }

  log.trace('Hint did not provide previous dock, finding optimal host.');
  dockData.getValidDocks(hint.tags, function (err, currentStates) {
    if (err) { return cb(err); }
    processData(hint, currentStates, function (err, host) {
      if (err) { return cb(err); }
      if (isTypeRandom) { return cb(null, host); }
      dockData.incKey(host, hint.type, 1, function (err) { cb(err, host); });
    });
  });
}

/**
 * Determines if a hint type sent to `obtainOptimalHost` is valid.
 * @return {Boolean} `true` if the hint type is valid, `false` otherwise.
 */
function isValidHintType(hintType) {
  return hintType !== 'container_run' &&
    hintType !== 'container_build' &&
    hintType !== 'find_random_dock';
}

/**
 * Given a list of current dock states and a selection hint, this method
 * attempts to find an optimal host for the given job (container build or run).
 * @param {object} hint Hint for the type of job to be performed.
 * @param {function} cb Callback to execute once an optimal host has been found.
 */
function processData (hint, currentStates, cb) {
  log.info({
    hint: hint,
    currentStates: currentStates
  }, 'Processing data: ' + hint + ', ' + currentStates);

  if (currentStates.length <= 0) {
    return cb(error(503, 'no docks avalible'));
  }

  // Linearly search the docks for an optimal host
  var optimalDock = currentStates.reduce(function (prevDockData, dockData) {
    dockData.weight = formulateWeight(hint, dockData);
    if (typeof prevDockData !== 'object') {
      return dockData;
    }
    return dockData.weight < prevDockData.weight ? dockData : prevDockData;
  }, 0);

  log.debug({
    hint: hint,
    currentStates: currentStates,
    optimalDock: optimalDock
  }, 'Found optimal dock: ' + optimalDock.host);

  cb(null, optimalDock.host);
}

/**
 * Formulates the weight for a given hint and dock information. Currently the
 * weight is defined as such:
 *
 *   weight = BUILD_WEIGHT      *  $(number of builds) +
 *            CONTAINER_WEIGHT  *  $(number of running containers)  +
 *            HISTORY_WEIGHT    *  $(has previous dock)
 *
 * @param {Object} hint The hint prodvided to `obtainOptimalHost`.
 * @param {Object} info Information about a given dock.
 */
function formulateWeight (hint, info) {
  log.info({
    hint: hint,
    info: info
  }, 'Formulating weight');

  var weight = info.numBuilds * process.env.BUILD_WEIGHT;
  weight += info.numContainers * process.env.CONTAINER_WEIGHT;
  if(info.host !== hint.prevDock) {
    weight += process.env.HISTORY_WEIGHT;
  }

  log.debug({ weight: weight }, 'Weight found: ' + weight);
  return weight;
}
