const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Falta el archivo obligatorio: ${relativePath}`);
  }
  return fs.readFileSync(absolutePath, 'utf8');
}

const requiredFiles = [
  'Dockerfile',
  'compose.yaml',
  'nginx.conf',
  'k8s/namespace.yaml',
  'k8s/configmap.yaml',
  'k8s/deployment.yaml',
  'k8s/service.yaml',
  'k8s/servicemonitor.yaml',
  'k8s/prometheus-rules.yaml',
  'k8s/grafana-dashboard.yaml',
  'docs/kubernetes-aks.md',
  'test/basic.test.js',
];

for (const relativePath of requiredFiles) {
  read(relativePath);
}

const workflow = read('.github/workflows/ci-cd.yml');
const dockerfile = read('Dockerfile');
const deployment = read('k8s/deployment.yaml');
const compose = read('compose.yaml');

const checks = [
  ['pipeline ejecuta pruebas', workflow.includes('Ejecutar pruebas y umbral de cobertura')],
  ['pipeline bloquea vulnerabilidades Trivy', workflow.includes('severity: HIGH,CRITICAL') && workflow.includes('exit-code: "1"')],
  ['pipeline despliega en AKS', workflow.includes('deploy-aks')],
  ['pipeline instala Prometheus y Grafana', workflow.includes('kube-prometheus-stack')],
  ['pipeline genera una alerta ante fallos', workflow.includes('name: alert')],
  ['pipeline usa usuario no root', dockerfile.includes('USER 1000:1000') && deployment.includes('runAsNonRoot: true')],
  ['AKS usa tres réplicas', deployment.includes('replicas: 3')],
  ['AKS usa probes de salud', deployment.includes('readinessProbe') && deployment.includes('livenessProbe')],
  ['Compose usa healthchecks', compose.includes('healthcheck')],
];

const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);

if (failures.length > 0) {
  console.error('Validación de cumplimiento fallida:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Cumplimiento verificable: ${checks.length}/${checks.length} controles presentes`);
