'use strict';
require('./loadenv.js')();
var app = require('./app.js');

app.listen(process.env.HOST_POST);
console.log('server listen on', process.env.HOST_POST);