const test = require('node:test');
const assert = require('node:assert');
const { sum } = require('../src/index.js');

test('sum suma dos numeros correctamente', () => {
  assert.strictEqual(sum(2, 3), 5);
});

test('sum funciona con negativos', () => {
  assert.strictEqual(sum(-2, 2), 0);
});
