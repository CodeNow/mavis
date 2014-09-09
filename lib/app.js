'use strict';
var queue = require('./queue.js');
var processer = require('./middleware/process.js');
var docks = require('./middleware/docks.js');

var express = require('express');
var app = module.exports = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('--- :remote-addr - :response-time ms- [:date] ' +
    '":method :url HTTP/:http-version" :status :res[content-length] ' +
    '":referrer" ":user-agent"'));
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// gets dock single threaded
app.post('/dock', queue(processer));

// routes to add/update/remove/get docks
app.get('/docks', docks.list);
app.post('/docks', docks.update);
app.delete('/docks', docks.remove);
app.put('/docks', docks.add);

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
