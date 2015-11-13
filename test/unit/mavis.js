// 'use strict';
//
// var Lab = require('lab');
// var lab = exports.lab = Lab.script();
// var describe = lab.describe;
// var it = lab.it;
// var beforeEach = lab.beforeEach;
// var afterEach = lab.afterEach;
// var Code = require('code');
// var expect = Code.expect;
//
// require('loadenv')('mavis:test');
// var monitor = require('monitor-dog');
// var mavis = require('../../lib/mavis');
//
// var monitorFixture = require('../fixtures/monitor');
// var dockDataFixture = require('../fixtures/dockData');
//
// describe('mavis', function() {
//   beforeEach(function (done) {
//     monitorFixture.stubAll();
//     dockDataFixture.stub();
//     done();
//   });
//
//   afterEach(function (done) {
//     monitorFixture.restoreAll();
//     dockDataFixture.restore();
//     done();
//   });
//
//   describe('obtainOptimalHost', function() {
//     it('should emit a datadog event when a host is selected', function(done) {
//       var hint = { type: 'container_build' };
//       mavis.obtainOptimalHost(hint, function (err) {
//         if (err) { return done(err); }
//         expect(monitor.event.calledOnce).to.be.true();
//         expect(monitor.event.firstCall.args[0].title)
//           .to.equal('mavis.host.selected');
//         done();
//       });
//     });
//   });
// });
