const http = require('http');
const { randomUUID } = require('node:crypto');
const client = require('prom-client');

const metricsRegistry = new client.Registry();
client.collectDefaultMetrics({
  register: metricsRegistry,
  prefix: 'micro_demo_',
});

const requestCounter = new client.Counter({
  name: 'micro_demo_http_requests_total',
  help: 'Total de solicitudes HTTP procesadas.',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry],
});

const errorCounter = new client.Counter({
  name: 'micro_demo_http_errors_total',
  help: 'Total de respuestas HTTP con errores.',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry],
});

const requestDuration = new client.Histogram({
  name: 'micro_demo_http_request_duration_seconds',
  help: 'Duración de las solicitudes HTTP en segundos.',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [metricsRegistry],
});

function parsePort(value) {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT debe ser un entero entre 1 y 65535; recibido: ${value}`);
  }

  return port;
}

const PORT = parsePort(process.env.PORT || 3000);

function sum(a, b) {
  return a + b;
}

function logEvent(event, details) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    ...details,
  }));
}

function getRequestId(req) {
  const requestId = req.headers['x-request-id'];
  return typeof requestId === 'string' && requestId.length > 0
    ? requestId
    : randomUUID();
}

async function handleRequest(req, res) {
  const startedAt = process.hrtime.bigint();
  const requestId = getRequestId(req);
  const pathname = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname;
  const method = req.method || 'GET';
  let route = 'not_found';
  let statusCode = 404;
  let responseBody = { error: 'not found' };
  const responseHeaders = { 'Content-Type': 'application/json' };

  if (method !== 'GET') {
    route = pathname === '/health' || pathname === '/' ? pathname : 'not_found';
    statusCode = 405;
    responseBody = { error: 'method not allowed' };
    responseHeaders.Allow = 'GET';
  } else if (pathname === '/metrics') {
    const metrics = await metricsRegistry.metrics();
    res.writeHead(200, {
      'Content-Type': metricsRegistry.contentType,
      'X-Request-ID': requestId,
    });
    res.end(metrics);
    return;
  } else if (pathname === '/health') {
    route = 'health';
    statusCode = 200;
    responseBody = { status: 'ok' };
  } else if (pathname === '/') {
    route = 'root';
    statusCode = 200;
    responseBody = { message: 'micro-demo funcionando' };
  }

  const elapsedSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
  const labels = { method, route, status_code: String(statusCode) };
  requestCounter.inc(labels);
  requestDuration.observe(labels, elapsedSeconds);
  if (statusCode >= 400) {
    errorCounter.inc(labels);
  }

  res.writeHead(statusCode, {
    ...responseHeaders,
    'X-Request-ID': requestId,
  });
  res.end(JSON.stringify(responseBody));
  logEvent('http_request', {
    request_id: requestId,
    method,
    route,
    status_code: statusCode,
    duration_ms: Number((elapsedSeconds * 1000).toFixed(3)),
  });
}

function createServer() {
  return http.createServer((req, res) => {
    void handleRequest(req, res).catch((error) => {
      const requestId = getRequestId(req);
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'http_request_error',
        request_id: requestId,
        error: error.message,
      }));
      if (!res.headersSent) {
        res.writeHead(500, {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
        });
        res.end(JSON.stringify({ error: 'internal server error' }));
      } else {
        res.destroy(error);
      }
    });
  });
}

const server = createServer();

function startServer(port = PORT, activeServer = server) {
  activeServer.listen(port, () => {
    console.log(`micro-demo escuchando en el puerto ${activeServer.address().port}`);
  });

  const shutdown = () => {
    activeServer.close((error) => {
      if (error) {
        console.error('Error al cerrar el servidor:', error);
        process.exitCode = 1;
      }
    });
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  return shutdown;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  createServer,
  metricsRegistry,
  parsePort,
  server,
  startServer,
  sum,
};

// Hotfix: correccion de puerto en produccion
