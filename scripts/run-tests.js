const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const coverageDir = path.join(root, 'coverage'); // ejecucion de las pruebas
fs.mkdirSync(coverageDir, { recursive: true });
const testResult = spawnSync(process.execPath, [
  '--experimental-test-coverage',
  '--test-reporter=tap',
  'test/basic.test.js',
], {
  cwd: root,
  env: {
    ...process.env,
    NODE_V8_COVERAGE: coverageDir,
  },
  encoding: 'utf8',
});

if (testResult.stdout) { // salidda de las pruebas
  process.stdout.write(testResult.stdout);
}
if (testResult.stderr) { // salida de las pruebas
  process.stderr.write(testResult.stderr);
}

const coverageMatch = (testResult.stdout || '').match(/^#\s*all files\s*\|\s*([\d.]+)/im);
const coveragePercent = coverageMatch ? Number.parseFloat(coverageMatch[1]) : 0;
console.log(`\nCobertura de líneas: ${coveragePercent.toFixed(2)}% (mínimo requerido: 80%)`);

const reportResult = spawnSync(process.execPath, [path.join(root, 'scripts', 'generate-report.js'), '--from-stdin'], { // ejecucion que genera reportes
  cwd: root,
  input: testResult.stdout || '',
  encoding: 'utf8',
});

if (reportResult.stdout) { // salida de la generacion de reportes
  process.stdout.write(reportResult.stdout);
}
if (reportResult.stderr) { // salida de la generacion de reportes
  process.stderr.write(reportResult.stderr);
}

if (testResult.status !== 0 || reportResult.status !== 0 || !coverageMatch || coveragePercent < 80) { // validacion final
  process.exitCode = 1;
}
