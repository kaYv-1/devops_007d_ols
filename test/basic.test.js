const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { server, sum } = require('../src/index.js');

test('sum suma dos numeros correctamente', () => {
  assert.strictEqual(sum(2, 3), 5);
});

test('sum funciona con negativos', () => {
  assert.strictEqual(sum(-2, 2), 0);
});

test('sum convierte valores numericos como string', () => {
  assert.strictEqual(sum('2', '3'), 5);
});

test('sum rechaza entradas no numericas', () => {
  assert.throws(() => sum('abc', 2), /finite numeric values/);
});

test('servidor maneja rutas con query strings', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  try {
    const healthResponse = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/health?check=1`, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => resolve({ statusCode: res.statusCode, body }));
      }).on('error', reject);
    });

    assert.strictEqual(healthResponse.statusCode, 200);
    assert.deepStrictEqual(JSON.parse(healthResponse.body), { status: 'ok' });

    const rootResponse = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/?name=alice`, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => resolve({ statusCode: res.statusCode, body }));
      }).on('error', reject);
    });

    assert.strictEqual(rootResponse.statusCode, 200);
    assert.deepStrictEqual(JSON.parse(rootResponse.body), { message: 'micro-demo funcionando' });
  } finally {
    await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  }
});

test('servidor devuelve 404 para rutas inexistentes', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  try {
    const missingResponse = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/missing-path`, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => resolve({ statusCode: res.statusCode, body }));
      }).on('error', reject);
    });

    assert.strictEqual(missingResponse.statusCode, 404);
    assert.deepStrictEqual(JSON.parse(missingResponse.body), { error: 'not found' });
  } finally {
    await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  }
});
