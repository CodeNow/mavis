'use strict';
require('./lib/loadenv.js')();

if (process.env.BYPASS_NEWRELIC != 'true') {
  require('newrelic');
}

var dd = require('./lib/models/datadog.js');
dd.monitorStart();

var app = require('./lib/app.js');
app.listen(process.env.PORT);
console.log('mavis started and running on port ' + process.env.PORT);
