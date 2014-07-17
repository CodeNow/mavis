'use strict';
var queue = require('./queue.js');
var middleware = require('./middleware.js');
var express = require('express');
var app = module.exports = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');

app.use(morgan('--- :remote-addr - :response-time ms- [:date] ' +
  '":method :url HTTP/:http-version" :status :res[content-length] ' +
  '":referrer" ":user-agent"'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// gets dock single threaded
app.post('/dock', queue(middleware));

// error handler
app.use(require('./error.js').errorResponder);

app.get('/', function (req, res) {
  res.json(200, {
    message: 'runnable mavis: the fairy tactician'
  });
});
app.all('*', function (req, res) {
  res.json(404, {
    message: 'route not implemented'
  });
});
