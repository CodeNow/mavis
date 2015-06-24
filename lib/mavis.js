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
var log = require('./logger').child({ module: 'mavis' });


function obtainOptimalHost (hint, cb) {
  log.info({ hint: hint }, 'Obtaining optimal host.');

  // check data
  if (!hint.type) {
    return cb(error(400, 'no type specified'));
  }

  if (isValidHintType(hint.type)) {
    return cb(error(400, 'cannot handle type '+hint.type));
  }

  var hasPreviousDock = typeof hint.prevDock === 'string';
  var isTypeRandom = hint.type === 'find_random_dock';

  // Do not allow prevDock hints when using type `find_random_dock`
  if (isTypeRandom && hasPreviousDock) {
    return cb(error(400, 'cannot handle type ' + hint.type + ' with prevDock'));
  }

  //FIXME: for now if prevDock sent, return it
  if (typeof hint.prevDock === 'string') {
    log.debug('Hint provided a previous dock, skipping optimal host lookup.');
    return dockData.incKey(hint.prevDock, hint.type, 1, function (err) {
      cb(err, hint.prevDock);
    });
  }

  log.debug('Hint did not provide previous dock, finding optimal host.');
  dockData.getValidDocks(hint.tags, function (err, currentStates) {
    if (err) { return cb(err); }
    processData(hint, currentStates, function (err, host) {
      if (err) { return cb(err); }

      if (!isTypeRandom) {
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
  return hintType !== 'container_run' &&
    hintType !== 'container_build' &&
    hintType !== 'find_random_dock';
}

function processData (hint, currentStates, cb) {
  log.info({
    hint: hint,
    currentStates: currentStates
  }, 'Processing data: ' + hint + ' ' + currentStates);

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

  log.debug({
    hint: hint,
    currentStates: currentStates,
    optimalDock: optimalDock
  }, 'Found optimal dock: ' + optimalDock.host);

  cb(null, optimalDock.host);
}

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

module.exports.obtainOptimalHost = obtainOptimalHost;
