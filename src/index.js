const http = require('http');

const PORT = process.env.PORT || 3000;

function sum(a, b) {
  return a + b;
}

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'micro-demo funcionando' }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`micro-demo escuchando en el puerto ${PORT}`);
  });
}

module.exports = { server, sum };

// Hotfix: correccion de puerto en produccion
