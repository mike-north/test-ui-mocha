import hello from '@test-ui/mocha';

QUnit.module('test-ui-mocha tests');

QUnit.test('hello', assert => {
  assert.equal(hello(), 'Hello from test-ui-mocha');
});
