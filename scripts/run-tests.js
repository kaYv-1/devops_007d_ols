const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const MINIMUM_COVERAGE_PERCENT = 80;

const coverageDir = path.join(root, 'coverage'); // ejecucion de las pruebas
fs.mkdirSync(coverageDir, { recursive: true });
const lcovPath = path.join(coverageDir, 'lcov.info');
const testResult = spawnSync(process.execPath, [
  '--experimental-test-coverage',
  '--test-reporter=tap',
  '--test-reporter=lcov',
  '--test-reporter-destination=stdout',
  `--test-reporter-destination=${lcovPath}`,
  'test/basic.test.js',
], {
  cwd: root,
  env: process.env,
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
const lcovReport = fs.existsSync(lcovPath) ? fs.readFileSync(lcovPath, 'utf8') : '';
const hasLcovReport = /^TN:.*\r?\nSF:.+\r?\n/m.test(lcovReport)
  && /\r?\nDA:\d+,\d+/m.test(lcovReport)
  && /end_of_record/.test(lcovReport);
console.log(`\nCobertura de líneas: ${coveragePercent.toFixed(2)}% (mínimo requerido: ${MINIMUM_COVERAGE_PERCENT}%)`);
if (!hasLcovReport) {
  console.error('No se generó un reporte LCOV válido en coverage/lcov.info.');
}

const reportsDir = path.join(root, 'reports');
fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(
  path.join(reportsDir, 'coverage.txt'),
  `${coveragePercent.toFixed(2)}\n`,
  'utf8',
);

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

if (testResult.status !== 0 || reportResult.status !== 0 || !coverageMatch || coveragePercent < MINIMUM_COVERAGE_PERCENT || !hasLcovReport) { // validacion final
  process.exitCode = 1;
}
