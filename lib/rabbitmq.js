/**
 * RabbitMQ job management
 * @module lib/rabbitmq
 */
'use strict';

require('loadenv')();

var Hermes = require('runnable-hermes');
var ErrorCat = require('error-cat');
var error = new ErrorCat();
var put = require('101/put');
var log = require('./logger').child({ module: __filename });



module.exports = RabbitMQ;

/**
 * @class
 */
function RabbitMQ () {
  log.info('RabbitMQ constructor');
  this._publisher = null;
  this._subscriber = null;
}

/**
 * Initiate connection to RabbitMQ server
 */
RabbitMQ.create = function (cb) {
  var opts = {
    hostname: process.env.RABBITMQ_HOSTNAME,
    password: process.env.RABBITMQ_PASSWORD,
    port: process.env.RABBITMQ_PORT,
    username: process.env.RABBITMQ_USERNAME,
    name: 'mavis'
  };

  log.info(opts, 'create');

  RabbitMQ._subscriber = new Hermes(put({
    queues: [
      'on-dock-unhealthy'
    ],
    subscribedEvents: [
      'container.life-cycle.died',
      'docker.events-stream.connected',
      'docker.events-stream.disconnected'
    ]
    }, opts))
  .on('error', RabbitMQ._handleFatalError);

  RabbitMQ._publisher = new Hermes(put({
    queues: [
      'on-dock-removed',
      'cluster-instance-provision'
    ],
  }, opts))
  // connect publisher only since ponos is handling subscriber
  .connect(cb)
  .on('error', RabbitMQ._handleFatalError);
};

/**
 * returns hermes client
 * @return {Object} hermes client
 */
RabbitMQ.getSubscriber = function () {
  return RabbitMQ._subscriber;
};

RabbitMQ.getPublisher = function () {
  return RabbitMQ._publisher;
};

/**
 * Disconnect publisher only. Since ponos should handle subscriber
 * @param {Function} cb
 * @return null
 */
RabbitMQ.close = function (cb) {
  log.info('RabbitMQ.prototype.close');
  if (!this.this._publisher) {
    return cb(null);
  }
  this._publisher.close(cb);
};

/**
 * reports errors on clients
 */
RabbitMQ._handleFatalError = function (err) {
  log.error({ err: err }, '_handleFatalError');
  throw error.createAndReport(502, 'RabbitMQ error', err);
};
