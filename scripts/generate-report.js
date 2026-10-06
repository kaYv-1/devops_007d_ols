const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const reportsDir = path.join(root, 'reports');
const outputFile = path.join(reportsDir, 'test-report.html');

fs.mkdirSync(reportsDir, { recursive: true });

const testResult = spawnSync(process.execPath, ['--test', '--test-reporter=tap', 'test/basic.test.js'], {
  cwd: root,
  encoding: 'utf8',
});

const stdout = `${testResult.stdout || ''}${testResult.stderr || ''}`;
const rows = [];
const lines = stdout.split(/\r?\n/);
let pendingRow = null;

for (const line of lines) {
  const match = line.match(/^((?:not )?ok)\s+\d+\s+-\s+(.+)$/);
  if (match) {
    pendingRow = {
      name: match[2].trim(),
      status: match[1].startsWith('not') ? 'failed' : 'passed',
      duration: 0,
    };
    continue;
  }

  if (pendingRow && line.includes('duration_ms:')) {
    const durationMatch = line.match(/duration_ms:\s*([\d.]+)/i);
    if (durationMatch) {
      pendingRow.duration = Number(durationMatch[1] || 0);
    }
    continue;
  }

  if (pendingRow && line.trim() === '...') {
    rows.push(pendingRow);
    pendingRow = null;
  }
}

const passCount = rows.filter((row) => row.status === 'passed').length;
const failCount = rows.filter((row) => row.status === 'failed').length;
const totalDuration = rows.reduce((total, row) => total + row.duration, 0);

const rowsHtml = rows.length
  ? rows.map((row) => `
      <tr>
        <td>${escapeHtml(row.name)}</td>
        <td>${row.status === 'passed' ? 'PASÓ' : 'FALLÓ'}</td>
        <td>${row.duration.toFixed(3)} ms</td>
      </tr>`).join('')
  : '<tr><td colspan="3">No hay resultados de pruebas</td></tr>';

const html = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reporte de pruebas</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 2rem; background: #f5f7fa; color: #1f2937; }
      .card { max-width: 1100px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08); padding: 2rem; }
      h1 { margin-bottom: 1rem; }
      .summary { display: flex; gap: 1rem; margin: 1rem 0 2rem; flex-wrap: wrap; }
      .pill { background: #eef2ff; padding: 0.8rem 1rem; border-radius: 10px; font-weight: 600; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 0.85rem 1rem; border-bottom: 1px solid #e5e7eb; text-align: left; }
      th { background: #f8fafc; }
      .passed { color: #15803d; font-weight: 700; }
      .failed { color: #b91c1c; font-weight: 700; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Reporte de pruebas unitarias</h1>
      <div class="summary">
        <div class="pill">Total: ${rows.length}</div>
        <div class="pill">Aprobadas: ${passCount}</div>
        <div class="pill">Fallidas: ${failCount}</div>
        <div class="pill">Duración total: ${totalDuration.toFixed(3)} ms</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Nombre de prueba</th>
            <th>Estado</th>
            <th>Duración</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  </body>
</html>`;

fs.writeFileSync(outputFile, html, 'utf8');
console.log(`Reporte generado en ${outputFile}`);

if (testResult.status !== 0) {
  process.exit(testResult.status || 1);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
