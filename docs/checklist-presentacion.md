# Checklist de presentación EP3

## Verificaciones antes de exponer

- [ ] Clúster AKS encendido y accesible con `kubectl config current-context`.
- [ ] Variable de repositorio `AKS_ENABLED=true` configurada antes del push que ejecuta `deploy-aks`.
- [ ] Último workflow de `main` en estado verde; confirmar que `deploy-aks` corrió si AKS está habilitado.
- [ ] URL de Grafana y credenciales de acceso disponibles para el equipo por un canal seguro; no copiarlas a capturas ni al repositorio.
- [ ] Dashboard Micro Demo cargado y con datos en sus diez paneles: cuatro señales de aplicación, CPU/memoria por pod, tiempo de despliegue, cobertura, errores de última hora y disponibilidad.
- [ ] Pushgateway tiene métricas de la última ejecución y el label `job="ci_cd_micro_demo"` se conserva.
- [ ] Rama `demo/falla-critica` lista; su cambio de dependencia vulnerable no se ha fusionado.
- [ ] Protección de `main` activa y checks obligatorios verificados en GitHub.
- [ ] Capturas de pipeline, dashboard, alertas, demo de falla y protección de rama tomadas por el equipo, sin secretos visibles.
- [ ] Reflexiones individuales redactadas por cada integrante sin IA.
- [ ] Después de la presentación y la nota, apagar o eliminar el clúster AKS y los recursos de observabilidad que generen costos.

## Pasos manuales fuera del alcance de la automatización

1. **Activar protección de rama:** GitHub → Settings → Branches (o Rulesets) → exigir
   Pull Request, exigir los status checks `test`, `security` y `build-scan-push`, y no
   permitir bypass. Verificar los nombres reales de checks disponibles y tomar captura.
2. **Encender AKS:** iniciar el clúster en Azure y definir la variable de repositorio
   `AKS_ENABLED=true`. Revisar previamente el costo y los recursos asociados.
3. **Presentación y autoría:** tomar las capturas requeridas y escribir las reflexiones
   personales individuales. No delegar estas tareas a IA.
4. **Cierre de costos:** apagar o eliminar el clúster y los recursos temporales al
   terminar la presentación, según el procedimiento autorizado del equipo.
