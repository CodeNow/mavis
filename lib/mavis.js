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

function obtainOptimalHost (hint, cb) {
  // check data
  if (!hint.type) {
    return cb(error(400, 'no type specified'));
  }
  if (hint.type !== 'container_run' && hint.type !== 'container_build') {
    return cb(error(400, 'cannot handle type '+hint.type));
  }

  //FIXME: for now if prevDock sent, return it
  if (typeof hint.prevDock === 'string') {
    return cb(null, hint.prevDock);
  }
  dockData.getValidDocks(function (err, currentStates) {
    if (err) { return cb(err); }

    processData(hint, currentStates, function (err, host) {
      if (err) {
        return cb(err);
      }
      dockData.incKey(host, hint.type, 1, function () {
        cb(null, host);
      });
    });
  });
}

function processData (hint, currentStates, cb) {
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
  cb(null, optimalDock.host);
}

function formulateWeight (hint, info) {
  var weight = info.numBuilds * process.env.BUILD_WEIGHT;
  weight += info.numContainers * process.env.CONTAINER_WEIGHT;
  if(info.host !== hint.prevDock) {
    weight += process.env.HISTORY_WEIGHT;
  }
  return weight;
}

module.exports.obtainOptimalHost = obtainOptimalHost;