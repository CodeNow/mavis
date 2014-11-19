'use strict';
require('./lib/loadenv.js')();
require('./lib/events/index.js');

var app = require('./lib/app.js');

app.listen(process.env.PORT);
console.log('server listen on', process.env.PORT);