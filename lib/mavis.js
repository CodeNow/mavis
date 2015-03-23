'use strict';
/** scheduler
  params per box
    # builds acceptable/building
    # containres possible/running
    has hint.prevDock
*/
require('./loadenv')();
var error = require('./error.js').errorCaster;
var dockData = require('./models/dockData.js');
var debug = require('debug')('mavis:mavis');

function obtainOptimalHost (hint, cb) {
  debug('obtainOptimalHost', hint);
  // check data
  if (!hint.type) {
    return cb(error(400, 'no type specified'));
  }

  // container_find event do you speak it, motherfucker?
  if (isValidHintType(hint.type)) {
    return cb(error(400, 'cannot handle type '+hint.type));
  }

  //FIXME: for now if prevDock sent, return it
  if (typeof hint.prevDock === 'string') {
    debug('hint provided a previous dock, skipping optimal host lookup.')
    if (hint.type != 'find_random_dock') {
      return dockData.incKey(hint.prevDock, hint.type, 1, function (err) {
        cb(err, hint.prevDock);
      });
    }
    else {
      cb(null, hint.prevDock);
    }
  }

  debug('hint did not provide previous dock, finding optimal host.')
  dockData.getValidDocks(function (err, currentStates) {
    if (err) { return cb(err); }
    processData(hint, currentStates, function (err, host) {
      if (err) { return cb(err); }

      if (hint.type != 'find_random_dock') {
        dockData.incKey(host, hint.type, 1, function (err) {
          cb(err, host);
        });
      }
      else {
        cb(null, host);
      }
    });
  });
}

/**
 * Determines if a hint type sent to `obtainOptimalHost` is valid.
 * @return {Boolean} `true` if the hint type is valid, `false` otherwise.
 */
function isValidHintType(hintType) {
  return hintType !== 'container_run'
      && hintType !== 'container_build'
      && hintType !== 'find_random_dock';
}

function processData (hint, currentStates, cb) {
  debug('processData', hint, currentStates);
  if (currentStates.length <= 0) {
    return cb(error(503, 'no docks avalible'));
  }
  // take info about docks and maps jobs do them
  var optimalDock = currentStates.reduce(function (prevDockData, dockData) {
    dockData.weight = formulateWeight(hint, dockData);
    if (typeof prevDockData !== 'object') {
      return dockData;
    }
    return dockData.weight < prevDockData.weight ? dockData : prevDockData;
  }, 0);
  debug('processData - optimalDock', optimalDock);
  cb(null, optimalDock.host);
}

function formulateWeight (hint, info) {
  debug('formulateWeight', hint, info);
  var weight = info.numBuilds * process.env.BUILD_WEIGHT;
  weight += info.numContainers * process.env.CONTAINER_WEIGHT;
  if(info.host !== hint.prevDock) {
    weight += process.env.HISTORY_WEIGHT;
  }
  debug('formulateWeight - weight', weight);
  return weight;
}

module.exports.obtainOptimalHost = obtainOptimalHost;