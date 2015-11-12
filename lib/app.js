'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var expressBunyanLogger = require('express-bunyan-logger');

var queue = require('./queue.js');
var processer = require('./middleware/process.js');
var docks = require('./middleware/docks.js');
var log = require('./logger');

/**
 * Mavis express application. This is the main interface to mavis from the rest
 * of the runnable system.
 * @module mavis:app
 */
var app = module.exports = express();

app.use(expressBunyanLogger({ logger: log }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Request dock (build or run)
app.post('/dock', queue(processer));

// Dock CRUD routes
app.get('/docks', docks.list);
app.post('/docks', docks.update);
app.delete('/docks', docks.remove);
app.put('/docks', docks.add);

// error handler
app.use(require('./error.js').errorResponder);

// Default slash endpoint (mainly used to quickly test if mavis is up)
app.get('/', function (req, res) {
  res.status(200).json({ message: 'Mavis: the fairy tactician' });
});

// Not found
app.all('*', function (req, res) {
  res.status(404).json({ message: 'Route not found' });
});
