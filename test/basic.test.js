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

test('GET /health devuelve 200 y estado ok', async () => {
  await withServer(async (port) => {
    const response = await getResponse(port, '/health');

    assert.strictEqual(response.statusCode, 200);
    assert.deepStrictEqual(JSON.parse(response.body), { status: 'ok' });
  });
});

test('GET / devuelve 200 y el mensaje esperado', async () => {
  await withServer(async (port) => {
    const response = await getResponse(port, '/');

    assert.strictEqual(response.statusCode, 200);
    assert.deepStrictEqual(JSON.parse(response.body), { message: 'micro-demo funcionando' });
  });
});

test('GET a una ruta inexistente devuelve 404', async () => {
  await withServer(async (port) => {
    const response = await getResponse(port, '/missing-path');

    assert.strictEqual(response.statusCode, 404);
    assert.deepStrictEqual(JSON.parse(response.body), { error: 'not found' });
  });
});

async function withServer(run) {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  try {
    await run(port);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  }
}

function getResponse(port, pathname) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${port}${pathname}`, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    }).on('error', reject);
  });
}
