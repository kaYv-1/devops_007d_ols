# Informe para preparar la Evaluacion N.° 3

## 1. Resultado del proyecto

El proyecto implementa un microservicio Node.js con observabilidad, seguridad,
contenedores, CI/CD y despliegue en Azure Kubernetes Service.

Evidencias principales:

- Repositorio remoto: `kaYv-1/devops_007d_ols`.
- Rama de entrega: `main`.
- Commit final: `820190be718b60810af0886e3656614ff6017de1`.
- Workflow final exitoso: [CI/CD #80](https://github.com/kaYv-1/devops_007d_ols/actions/runs/45342557219).
- Pull request final: [#59](https://github.com/kaYv-1/devops_007d_ols/pull/59).
- Pruebas locales: 11 exitosas.
- Cobertura de líneas: 88.14 %.
- Pipeline final: test, security, build-scan-push, deploy y deploy-aks exitosos.

## 2. Requisitos de la pauta

### IE1 - Observabilidad

El proyecto expone `GET /metrics` con métricas de solicitudes, errores,
latencia y proceso mediante `prom-client`.

Demostrar:

1. El endpoint `/metrics` de AKS o Docker Compose.
2. Métricas de solicitudes totales.
3. Métricas de errores.
4. Histograma de duración.
5. Métricas de memoria y CPU.

Archivo clave:

- `src/index.js`.

### IE2 - Despliegue de Kubernetes en una nube

La aplicación se despliega en Azure Kubernetes Service mediante manifiestos
Kubernetes y OIDC.

Demostrar:

1. Namespace `devops-staging`.
2. Deployment `micro-demo` con tres réplicas.
3. Service `micro-demo` de tipo LoadBalancer.
4. Rollout completado.
5. Endpoint `/health` accesible desde la IP externa.

Comandos sugeridos:

```bash
kubectl get namespace devops-staging
kubectl get deployments,pods,service -n devops-staging
kubectl rollout status deployment/micro-demo -n devops-staging
kubectl get service micro-demo -n devops-staging
```

Archivos clave:

- `k8s/namespace.yaml`
- `k8s/configmap.yaml`
- `k8s/deployment.yaml`
- `k8s/service.yaml`

### IE3 - Dashboards y visualización

Prometheus y Grafana están instalados mediante `kube-prometheus-stack`.

El `ServiceMonitor` recopila `/metrics` cada 30 segundos. El dashboard muestra:

- solicitudes por segundo;
- errores HTTP por segundo;
- latencia p95;
- memoria RSS.

Las reglas alertan por:

- servicio no disponible;
- tasa de errores mayor al 5 %;
- latencia p95 mayor a 1 segundo.

Comandos sugeridos:

```bash
kubectl get service -n monitoring
kubectl get secret -n monitoring kube-prometheus-stack-grafana \
  -o jsonpath="{.data.admin-password}" | base64 --decode
kubectl get servicemonitor,prometheusrule -A
```

Archivos clave:

- `k8s/servicemonitor.yaml`
- `k8s/prometheus-rules.yaml`
- `k8s/grafana-dashboard.yaml`

### IE4 - Documentación técnica

La documentación explica arquitectura, configuración, ejecución, seguridad,
Azure OIDC, GHCR y trazabilidad.

Archivos clave:

- `README.md`
- `docs/kubernetes-aks.md`
- `docs/evidence.md`

Demostrar:

1. La imagen se identifica mediante el SHA corto del commit.
2. GHCR publica el artefacto validado.
3. AKS descarga exactamente esa misma imagen.
4. `/health` sirve como smoke test.
5. Los Pull Requests explican qué corregían y quedan registrados.

### IE5 - Cumplimiento y políticas

El proyecto usa:

- Snyk para dependencias y código.
- Trivy para filesystem e imagen.
- SonarQube Cloud para calidad.
- Protección de rama `main`.
- Auditoría `scripts/validate-compliance.js`.
- Contenedor no root.
- Límites de CPU y memoria.
- Seccomp y eliminación de capabilities.

Punto importante: no desactivar ni aumentar los umbrales de detección.
Trivy usa `HIGH,CRITICAL` y `exit-code: "1"`.

### IE6 - Bloqueo automático del pipeline

El pipeline bloquea cada cambio si:

- las pruebas o la cobertura no pasan;
- falta el token Snyk;
- Snyk encuentra vulnerabilidades;
- Trivy encuentra vulnerabilidades críticas o altas;
- SonarQube no aprueba;
- falta alguna evidencia obligatoria del auditor;
- el build o despliegue falla.

El job `alert` abre un issue automático ante fallos en un push.

Demostración sugerida:

1. Mostrar la ejecución verde CI/CD #80.
2. Mostrar la configuración bloqueante de Trivy.
3. Explicar cómo funciona el job `alert`.
4. Si el docente solicita una prueba negativa, crear una rama temporal,
   introducir deliberadamente una falla pequeña y verificable y restaurarla
   después. No ocultar ni desactivar controles.

## 3. Guion de demostración de 5 a 7 minutos

1. Abrir GitHub y presentar `main`.
2. Mostrar el historial de PRs y el merge final.
3. Abrir CI/CD #80 y explicar cada job.
4. Mostrar el escaneo Trivy y el bloqueo configurable.
5. Mostrar la aplicación e `/health` en AKS.
6. Mostrar los tres pods activos.
7. Abrir Grafana.
8. Mostrar solicitudes, errores y latencia.
9. Explicar una alerta del proyecto.
10. Abrir el README y cerrar con arquitectura y trazabilidad.

## 4. Preguntas frecuentes

### ¿Por qué usar AKS?

Es un servicio Kubernetes administrado de Azure que permite desplegar réplicas,
usar LoadBalancer, escalar y administrar configuración sin operar los nodos
de Kubernetes manualmente.

### ¿Por qué usar Prometheus y Grafana?

Prometheus recoge métricas con intervalos periódicos y permite consultas y
alertas. Grafana convierte esas métricas en dashboards visuales.

### ¿Cómo se autentica GitHub con Azure?

Mediante identidad federada OIDC con un Service Principal. GitHub presenta
una aserción cuyo `subject` coincide con el Environment `staging`; Azure cambia
ese token por credenciales temporales.

### ¿Qué hace el ServiceMonitor?

Indica a Prometheus qué Services, namespace y ruta `/metrics` debe monitorear.

### ¿Qué ocurre si una réplica falla?

El Deployment mantiene tres réplicas y reemplaza pods que no están disponibles.
Las readiness y liveness probes controlan disponibilidad y reinicio.

### ¿Por qué el contenedor usa UID 1000?

Kubernetes necesita una identidad numérica verificable para validar
`runAsNonRoot`. El usuario nombrado `node` no era verificable de forma segura
por el runtime del clúster.

### ¿Cómo se evita desplegar una imagen vulnerable?

El job construye la imagen, ejecuta Trivy con umbral alto/crítico y solamente
publica o despliega si el escaneo termina exitosamente.

### ¿Qué diferencia hay entre Compose y Kubernetes?

Compose sirve para una validación local o de staging efímero. Kubernetes
mantiene estado y réplicas en AKS, reemplaza pods, aplica recursos y expone
un LoadBalancer.

### ¿Qué pasa si falta SNYK_TOKEN?

El job `security` falla antes de continuar con Snyk, Trivy, build y despliegue.
Esto demuestra que el pipeline no continúa en un estado de seguridad desconocido.

### ¿Qué demuestra el pipeline?

Una entrega trazable y reproducible: código probado, imagen escaneada,
artefacto identificado por SHA, despliegue en staging y pruebas de disponibilidad.

## 5. Checklist antes de la entrega

- [ ] `main` contiene todos los PR fusionados.
- [ ] El pipeline final está verde.
- [ ] Las capturas no muestran secretos ni contraseñas.
- [ ] Los tres pods están activos.
- [ ] `/health` responde correctamente.
- [ ] `/metrics` responde correctamente.
- [ ] Grafana muestra los paneles del proyecto.
- [ ] Prometheus reconoce el `ServiceMonitor`.
- [ ] Las reglas de alerta están cargadas.
- [ ] Se capturó la protección de la rama `main`.
- [ ] Los secretos existen sin revelar sus valores.
- [ ] El Environment `staging` existe.
- [ ] El repositorio, el informe y las capturas están disponibles.
- [ ] El enlace de GitHub fue enviado por AVA y correo.
- [ ] Las reflexiones individuales fueron escritas por cada integrante sin IA.
- [ ] Se declaró el uso de IA en el informe.

## 6. Uso de inteligencia artificial

Debes declarar en el informe que GitHub Copilot se utilizó como apoyo para:

- revisar código y configuración;
- generar documentación;
- diseñar manifiestos y scripts;
- diagnosticar fallos del pipeline;
- preparar evidencias.

Debes indicar además que las decisiones técnicas, validaciones y conclusiones
fueron revisadas por los integrantes. Las reflexiones individuales deben ser
originales y redactadas sin apoyo de IA.

## 7. Archivos de apoyo

- Evidencia técnica: `docs/evidence.md`.
- Configuración AKS: `docs/kubernetes-aks.md`.
- Auditoría: `scripts/validate-compliance.js`.
- Dashboard: `k8s/grafana-dashboard.yaml`.
- Reglas: `k8s/prometheus-rules.yaml`.
- Scraping: `k8s/servicemonitor.yaml`.
