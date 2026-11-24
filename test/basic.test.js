const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { createServer, parsePort, server, startServer, sum } = require('../src/index.js');

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

test('GET /health ignora la query string', async () => {
  await withServer(async (port) => {
    const response = await getResponse(port, '/health?verbose=true');

    assert.strictEqual(response.statusCode, 200);
    assert.deepStrictEqual(JSON.parse(response.body), { status: 'ok' });
  });
});

test('GET /metrics expone métricas Prometheus', async () => {
  await withServer(async (port) => {
    const response = await getResponse(port, '/metrics');

    assert.strictEqual(response.statusCode, 200);
    assert.match(response.headers['content-type'], /text\/plain/);
    assert.match(response.body, /micro_demo_http_requests_total/);
    assert.match(response.body, /micro_demo_http_request_duration_seconds/);
  });
});

test('el dashboard conserva los paneles base y agrega señales de EP3', () => {
  const dashboardPath = path.resolve(__dirname, '..', 'k8s', 'grafana-dashboard.yaml');
  const dashboardYaml = fs.readFileSync(dashboardPath, 'utf8');
  const marker = '  micro-demo.json: |';
  const markerIndex = dashboardYaml.indexOf(marker);

  assert.notStrictEqual(markerIndex, -1);
  const block = dashboardYaml.slice(markerIndex + marker.length).replace(/^\r?\n/, '');
  const jsonLines = block.split(/\r?\n/)
    .filter((line) => line.startsWith('    '))
    .map((line) => line.slice(4));
  const dashboard = JSON.parse(jsonLines.join('\n'));
  const panels = new Map(dashboard.panels.map((panel) => [panel.title, panel]));

  assert.strictEqual(dashboard.panels.length, 10);
  assert.ok(panels.has('Solicitudes por segundo'));
  assert.ok(panels.has('Errores HTTP por segundo'));
  assert.ok(panels.has('Latencia p95'));
  assert.ok(panels.has('Memoria RSS'));
  assert.match(panels.get('CPU por pod').targets[0].expr, /container_cpu_usage_seconds_total/);
  assert.match(panels.get('Memoria de trabajo por pod').targets[0].expr, /container_memory_working_set_bytes/);
  assert.strictEqual(panels.get('Cobertura de pruebas').type, 'gauge');
  const coverageThresholds = panels.get('Cobertura de pruebas').fieldConfig.defaults.thresholds.steps;
  assert.strictEqual(coverageThresholds[0].color, 'red');
  assert.strictEqual(coverageThresholds[1].value, 80);
  assert.strictEqual(panels.get('Disponibilidad (up)').targets[0].expr, 'avg(up{namespace="devops-staging",service="micro-demo"})');
});

test('un método distinto de GET devuelve 405', async () => {
  await withServer(async (port) => {
    const response = await getResponse(port, '/health', 'POST');

    assert.strictEqual(response.statusCode, 405);
    assert.deepStrictEqual(JSON.parse(response.body), { error: 'method not allowed' });
    assert.strictEqual(response.headers.allow, 'GET');
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

test('las respuestas incluyen un identificador de solicitud y los errores se registran', async () => {
  await withServer(async (port) => {
    const response = await getResponse(port, '/missing-path');
    const metrics = await getResponse(port, '/metrics');

    assert.match(response.headers['x-request-id'], /^[0-9a-f-]{36}$/);
    assert.match(metrics.body, /micro_demo_http_errors_total\{[^}]*status_code="404"/);
  });
});

test('parsePort rechaza puertos inválidos', () => {
  assert.throws(() => parsePort('invalid'), /PORT debe ser un entero/);
  assert.throws(() => parsePort(0), /PORT debe ser un entero/);
  assert.strictEqual(parsePort('3000'), 3000);
});

test('el servidor puede iniciar y apagarse ordenadamente', async () => {
  const testServer = createServer();
  const shutdown = startServer(0, testServer);

  await new Promise((resolve) => testServer.once('listening', resolve));
  const closed = new Promise((resolve, reject) => {
    testServer.once('close', resolve);
    testServer.once('error', reject);
  });
  shutdown();
  await closed;
  assert.strictEqual(testServer.listening, false);

  process.removeListener('SIGINT', shutdown);
  process.removeListener('SIGTERM', shutdown);
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

function getResponse(port, pathname, method = 'GET') {
  return new Promise((resolve, reject) => {
    const request = http.request(`http://localhost:${port}${pathname}`, { method }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        body,
      }));
    });
    request.on('error', reject);
    request.end();
  });
}
