import * as NS from '@test-ui/mocha';

QUnit.module('public API tests');

QUnit.test('index.ts exports are present', assert => {
  assert.ok(NS.MochaTestClient, 'MochaTestClient exists');
  assert.ok(NS.MochaTestServer, 'MochaTestServer exists');
});
