const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) {
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

function indentOf(line) {
  return line.length - line.trimStart().length;
}

function yamlPathValue(lines, pathParts) {
  let scope = lines;

  for (let partIndex = 0; partIndex < pathParts.length; partIndex += 1) {
    const key = pathParts[partIndex].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const keyPattern = new RegExp(`^(\\s*)${key}:\\s*(.*?)\\s*$`);
    const lineIndex = scope.findIndex((line) => keyPattern.test(line));
    if (lineIndex < 0) {
      return null;
    }

    const match = scope[lineIndex].match(keyPattern);
    const value = match[2].replace(/\s+#.*$/, '').trim().replace(/^(['"])(.*)\1$/, '$2');
    if (partIndex === pathParts.length - 1) {
      return value || null;
    }

    const parentIndent = indentOf(scope[lineIndex]);
    let endIndex = lineIndex + 1;
    while (endIndex < scope.length) {
      const line = scope[endIndex];
      if (line.trim() && !line.trimStart().startsWith('#') && indentOf(line) <= parentIndent) {
        break;
      }
      endIndex += 1;
    }
    scope = scope.slice(lineIndex + 1, endIndex);
  }

  return null;
}

function findMicroDemoContainer(deploymentLines) {
  const containersIndex = deploymentLines.findIndex((line) => /^\s*containers:\s*$/.test(line));
  if (containersIndex < 0) {
    return [];
  }

  const containersIndent = indentOf(deploymentLines[containersIndex]);
  const containerIndex = deploymentLines.findIndex(
    (line, index) => index > containersIndex && /^\s*-\s+name:\s*micro-demo\s*$/.test(line),
  );
  if (containerIndex < 0 || indentOf(deploymentLines[containerIndex]) <= containersIndent) {
    return [];
  }

  const containerIndent = indentOf(deploymentLines[containerIndex]);
  let endIndex = containerIndex + 1;
  while (endIndex < deploymentLines.length) {
    const line = deploymentLines[endIndex];
    if (line.trim() && !line.trimStart().startsWith('#') && indentOf(line) <= containerIndent) {
      break;
    }
    endIndex += 1;
  }

  return deploymentLines.slice(containerIndex, endIndex);
}

function workflowSteps(workflow) {
  const lines = workflow.split(/\r?\n/);
  const starts = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (/^\s{6}- name:/.test(lines[index])) {
      starts.push(index);
    }
  }
  return starts.map((start, index) => (
    lines.slice(start, starts[index + 1] ?? lines.length).join('\n')
  ));
}

const deployment = read('k8s/deployment.yaml');
const deploymentLines = deployment.split(/\r?\n/);
const containerLines = findMicroDemoContainer(deploymentLines);
const workflow = read('.github/workflows/ci-cd.yml');
const steps = workflowSteps(workflow);
const trivySteps = steps.filter((step) => /uses:\s*aquasecurity\/trivy-action@/.test(step));
const snykStep = steps.find((step) => (
  /uses:\s*snyk\/actions\/node@/.test(step)
  && /--severity-threshold(?:=|\s+)high(?:\s|$)/.test(step)
));
const runTests = read('scripts/run-tests.js');
const manifestImages = deploymentLines
  .map((line) => line.match(/^\s*image:\s*["']?([^\s"']+)/))
  .filter(Boolean)
  .map((match) => match[1]);

const requestsCpu = yamlPathValue(containerLines, ['resources', 'requests', 'cpu']);
const requestsMemory = yamlPathValue(containerLines, ['resources', 'requests', 'memory']);
const limitsCpu = yamlPathValue(containerLines, ['resources', 'limits', 'cpu']);
const limitsMemory = yamlPathValue(containerLines, ['resources', 'limits', 'memory']);
const readinessPath = yamlPathValue(containerLines, ['readinessProbe', 'httpGet', 'path']);
const livenessPath = yamlPathValue(containerLines, ['livenessProbe', 'httpGet', 'path']);
const minimumCoverage = runTests.match(/const\s+MINIMUM_COVERAGE_PERCENT\s*=\s*(\d+)/);
const coverageIsEnforced = minimumCoverage
  && Number(minimumCoverage[1]) === 80
  && /coveragePercent\s*<\s*MINIMUM_COVERAGE_PERCENT/.test(runTests);
const replacesShaPlaceholder = /IMAGE_REF=.*GITHUB_SHA::7/.test(workflow)
  && /s\|ghcr\.io\/kayv-1\/devops_007d_ols:sha-placeholder\|\$IMAGE_REF\|g/.test(workflow);

const checks = [
  {
    name: 'Deployment no publica la etiqueta :latest',
    passed: manifestImages.length > 0 && manifestImages.every((image) => !/:latest(?:$|@)/.test(image)),
    evidence: manifestImages.length ? manifestImages.join(', ') : 'no se encontró image',
  },
  {
    name: 'La imagen de AKS se reemplaza por el SHA del commit',
    passed: replacesShaPlaceholder,
    evidence: replacesShaPlaceholder ? 'marcador sha-placeholder → IMAGE_REF con GITHUB_SHA' : 'mapeo por SHA ausente',
  },
  {
    name: 'El contenedor define requests y limits de CPU y memoria',
    passed: Boolean(requestsCpu && requestsMemory && limitsCpu && limitsMemory),
    evidence: [
      requestsCpu && requestsMemory ? `requests ${requestsCpu}/${requestsMemory}` : 'requests incompletos',
      limitsCpu && limitsMemory ? `limits ${limitsCpu}/${limitsMemory}` : 'limits incompletos',
    ].join('; '),
  },
  {
    name: 'El contenedor ejecuta con runAsNonRoot=true',
    passed: yamlPathValue(containerLines, ['securityContext', 'runAsNonRoot']) === 'true',
    evidence: yamlPathValue(containerLines, ['securityContext', 'runAsNonRoot']) || 'configuración ausente',
  },
  {
    name: 'Readiness y liveness prueban /health por HTTP',
    passed: readinessPath === '/health' && livenessPath === '/health',
    evidence: `readiness=${readinessPath || 'ausente'}; liveness=${livenessPath || 'ausente'}`,
  },
  {
    name: 'Trivy bloquea HIGH/CRITICAL en filesystem e imagen',
    passed: trivySteps.length >= 2 && trivySteps.every((step) => (
      /severity:\s*HIGH,CRITICAL/.test(step) && /exit-code:\s*["']1["']/.test(step)
    )),
    evidence: `${trivySteps.length} pasos Trivy con HIGH/CRITICAL y exit-code 1`,
  },
  {
    name: 'Snyk bloquea vulnerabilidades de severidad high',
    passed: Boolean(snykStep),
    evidence: snykStep ? '--severity-threshold=high' : 'argumento de severidad high ausente',
  },
  {
    name: 'El runner exige cobertura mínima de 80%',
    passed: Boolean(coverageIsEnforced),
    evidence: minimumCoverage ? `mínimo ${minimumCoverage[1]}% aplicado al resultado` : 'umbral ejecutable ausente',
  },
];

const nameWidth = Math.max(...checks.map(({ name }) => name.length), 'Control'.length);
const evidenceWidth = Math.max(...checks.map(({ evidence }) => evidence.length), 'Evidencia'.length);
const border = `+${'-'.repeat(nameWidth + 2)}+--------+${'-'.repeat(evidenceWidth + 2)}+`;
console.log(border);
console.log(`| ${'Control'.padEnd(nameWidth)} | Estado | ${'Evidencia'.padEnd(evidenceWidth)} |`);
console.log(border);
for (const check of checks) {
  console.log(`| ${check.name.padEnd(nameWidth)} | ${(check.passed ? 'PASS' : 'FAIL').padEnd(6)} | ${check.evidence.padEnd(evidenceWidth)} |`);
}
console.log(border);

const failures = checks.filter(({ passed }) => !passed);
if (failures.length > 0) {
  console.error(`Cumplimiento fallido: ${failures.length}/${checks.length} controles incumplidos.`);
  process.exitCode = 1;
} else {
  console.log(`Cumplimiento verificable: ${checks.length}/${checks.length} controles aprobados.`);
}
