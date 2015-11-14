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

module.exports = new RabbitMQ();

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
RabbitMQ.prototype.create = function (cb) {
  var opts = {
    hostname: process.env.RABBITMQ_HOSTNAME,
    password: process.env.RABBITMQ_PASSWORD,
    port: process.env.RABBITMQ_PORT,
    username: process.env.RABBITMQ_USERNAME,
    name: 'mavis'
  };

  log.info(opts, 'create');

  this._subscriber = new Hermes(put({
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

  this._publisher = new Hermes(put({
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
RabbitMQ.prototype.getSubscriber = function () {
  return this._subscriber;
};

RabbitMQ.prototype.getPublisher = function () {
  return this._publisher;
};

/**
 * Disconnect publisher only. Since ponos should handle subscriber
 * @param {Function} cb
 * @return null
 */
RabbitMQ.prototype.close = function (cb) {
  log.info('RabbitMQ.prototype.close');
  if (!this._publisher) {
    return cb(null);
  }
  this._publisher.close(cb);
};

/**
 * reports errors on clients
 */
RabbitMQ._handleFatalError = function (err) {
  console.log('handle fatal error', err);
  log.error({ err: err }, '_handleFatalError');
  throw error.createAndReport(502, 'RabbitMQ error', err);
};
