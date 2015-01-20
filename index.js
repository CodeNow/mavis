'use strict';
require('./lib/loadenv.js')();
require('newrelic');
var dd = require('./lib/models/datadog.js');
dd.monitorStart();
var app = require('./lib/app.js');

app.listen(process.env.PORT);
