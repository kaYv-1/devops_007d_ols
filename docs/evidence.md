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

## Reflexiones individuales

Las reflexiones individuales deben ser redactadas por los estudiantes, basadas
en su propio trabajo. No deben incluir secretos, tokens ni datos sensibles.
