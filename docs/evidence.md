# Evidencia de ejecución y trazabilidad

## Evidencia principal

- Pull request de observabilidad y AKS: [#40](https://github.com/kaYv-1/devops_007d_ols/pull/40).
- Corrección de vulnerabilidades Trivy: [#44](https://github.com/kaYv-1/devops_007d_ols/pull/44).
- Corrección de runtime y OIDC: [#47](https://github.com/kaYv-1/devops_007d_ols/pull/47).
- Diagnóstico de rollout AKS: [#52](https://github.com/kaYv-1/devops_007d_ols/pull/52).
- Usuario numérico para AKS: [#55](https://github.com/kaYv-1/devops_007d_ols/pull/55).
- Prometheus y Grafana: [#58](https://github.com/kaYv-1/devops_007d_ols/pull/58).
- Workflow final exitoso: [CI/CD #77](https://github.com/kaYv-1/devops_007d_ols/actions/runs/45340834505).
- Commit final de observabilidad: `ee7e8d8047cf39b61a2696c520f867b870d4310e`.

## Evidencia reproducible

El workflow final verificó:

1. 11 pruebas locales exitosas.
2. Cobertura de líneas mínima superior al 80 %.
3. Análisis Snyk de dependencias y código.
4. Trivy `HIGH,CRITICAL` sobre filesystem e imagen con bloqueo activo.
5. SonarQube Cloud.
6. Publicación de la imagen en GHCR.
7. Despliegue Compose.
8. Autenticación Azure mediante OIDC.
9. Rollout de Kubernetes.
10. Smoke test `/health`.
11. Instalación de Prometheus y Grafana.

## Validación del chart Pushgateway para EP3

Validación estática realizada el 2026-11-24 con Helm 4.3.2 y el chart
`prometheus-community/prometheus-pushgateway` versión 3.11.2:

```bash
helm template pushgateway prometheus-community/prometheus-pushgateway \
  --version 3.11.2 --namespace monitoring \
  --set serviceMonitor.enabled=true \
  --set serviceMonitor.namespace=monitoring \
  --set serviceMonitor.additionalLabels.release=kube-prometheus-stack \
  --set serviceMonitor.honorLabels=true
```

Resultado del render: Service `pushgateway-prometheus-pushgateway` y
ServiceMonitor del mismo nombre, label `release=kube-prometheus-stack` y
`honorLabels=true`. El workflow repite estas comprobaciones contra el clúster
en tiempo de despliegue. Esta validación no instala recursos en AKS ni
comprueba un clúster real; el encendido y `AKS_ENABLED=true` son pasos manuales
del equipo descritos en [`checklist-presentacion.md`](checklist-presentacion.md).

## Validación local de cambios EP3

Ejecutada el 2026-11-24, hora local `-03:00`, desde la rama
`feature/ep3-observability`:

| Comando | Resultado | Salida generada |
|---|---|---|
| `npm.cmd test` | 12/12 pruebas; cobertura de líneas 88.00% (mínimo 80%). | `reports/coverage.txt` contiene `88.00`; `reports/test-report.html`. |
| `npm.cmd audit` | 0 vulnerabilidades en la rama de trabajo. | Salida de auditoría en terminal. |
| `node scripts/validate-compliance.js` | 8/8 controles PASS. | Tabla impresa en terminal. |
| `actionlint .github/workflows/ci-cd.yml` | Exit code 0; workflow sin diagnósticos. | Validación en terminal. |

Estos resultados son ejecuciones locales, no acreditan un run de GitHub Actions
ni una instalación en AKS. El artifact de Actions y los paneles con métricas
reales quedan pendientes de una ejecución con los secretos, variables y clúster
configurados por el equipo.

## Comandos de evidencia

```bash
npm test
node scripts/validate-compliance.js

kubectl get deployments,pods,service -n devops-staging
kubectl rollout status deployment/micro-demo -n devops-staging
kubectl get service micro-demo -n devops-staging
kubectl get service -n monitoring
kubectl get servicemonitor,prometheusrule -A
```

## Capturas necesarias para la entrega

Conservar capturas de:

- ejecución verde de CI/CD #77;
- resultado del smoke test de AKS;
- dashboard de Grafana;
- consultas a Prometheus;
- alertas o panel de reglas;
- configuración de protección de la rama `main`;
- checks obligatorios de GitHub;
- lista de secrets configurados sin mostrar los valores;
- historial de Pull Requests fusionados.

## Demostración IE6

La rama `demo/falla-critica` agrega `lodash@4.17.15` como dependencia directa,
sin utilizarla en el microservicio. El flujo esperado es crear un PR hacia `main`,
dejar que Snyk y/o Trivy detecten la vulnerabilidad HIGH, y comprobar que el check
`security` fallido impide la fusión cuando la protección manual de `main` está activa.
El push fallido a la rama activa el job `alert`, que crea un issue; el job de alerta
se ejecuta para `push`, no para el evento `pull_request`. Los jobs de publicación y
despliegue permanecen bloqueados por la dependencia `needs: security` y/o por sus
condiciones de ejecución sobre `main`.

No se fusiona el PR de demostración ni se reutiliza la dependencia en el servicio.
Tomar las capturas personalmente, evitando mostrar secrets o tokens:

1. **PR de demostración con checks rojos:** [CAPTURA 1]
2. **Job `security` fallido y hallazgo HIGH de Snyk o Trivy:** [CAPTURA 2]
3. **Fusión bloqueada por protección de `main`:** [CAPTURA 3]
4. **Issue automático creado por el fallo del push:** [CAPTURA 4]

## Reflexiones individuales

Las reflexiones individuales deben ser redactadas por los estudiantes, basadas
en su propio trabajo. No deben incluir secretos, tokens ni datos sensibles.
