const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const reportsDir = path.join(root, 'reports');
const coverageDir = path.join(root, 'coverage');

fs.mkdirSync(reportsDir, { recursive: true });
fs.rmSync(coverageDir, { recursive: true, force: true });

const env = {
  ...process.env,
  NODE_V8_COVERAGE: coverageDir,
};

const testCommand = [
  '--test',
  '--experimental-test-coverage',
  '--test-reporter=tap',
  'test/*.js',
];

const testResult = spawnSync(process.execPath, testCommand, {
  cwd: root,
  env,
  encoding: 'utf8',
});

if (testResult.stdout) {
  process.stdout.write(testResult.stdout);
}

if (testResult.stderr) {
  process.stderr.write(testResult.stderr);
}

const coveragePercent = calculateCoveragePercent(testResult.stdout || '');
console.log(`\nCobertura actual: ${coveragePercent.toFixed(2)}%`);

const passMatch = (testResult.stdout || '').match(/# pass (\d+)/i);
const failMatch = (testResult.stdout || '').match(/# fail (\d+)/i);
const failed = failMatch ? Number(failMatch[1]) : 0;

const reportScript = path.join(root, 'scripts', 'generate-report.js');
const reportResult = spawnSync(process.execPath, [reportScript], {
  cwd: root,
  encoding: 'utf8',
});

if (reportResult.stdout) {
  process.stdout.write(reportResult.stdout);
}

if (reportResult.stderr) {
  process.stderr.write(reportResult.stderr);
}

if ((testResult.status ?? 0) !== 0 || (reportResult.status ?? 0) !== 0 || failed > 0 || coveragePercent < 80) {
  process.exit(1);
}

console.log(`Reporte HTML generado en ${path.join(reportsDir, 'test-report.html')}`);

function calculateCoveragePercent(output) {
  const match = output.match(/# all files \|\s+([\d.]+)\s+\|/i);
  if (!match) {
    return 0;
  }

  return Number.parseFloat(match[1]);
}
