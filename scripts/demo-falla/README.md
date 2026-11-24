# Demo IE6: falla crítica controlada

Esta rama introduce **solo para la demostración** `lodash@4.17.15`, una versión
antigua con vulnerabilidades de severidad alta conocidas. La dependencia no se usa
en el servicio. No ejecutar código de explotación ni fusionar esta rama a `main`.

La rama `demo/falla-critica` preparada para la evaluación ya contiene el cambio y
un commit sin fusionar. Para reproducirlo desde la rama de trabajo EP3:

```bash
git switch feature/ep3-observability
git switch -c demo/falla-critica
npm install --save-exact lodash@4.17.15
git add package.json package-lock.json
git commit -m "demo: introduce dependencia vulnerable para IE6"
git push -u origin demo/falla-critica
```

El cambio actual usa esta versión intencionalmente vulnerable; no actualizarla ni
integrarla a `main` durante la evaluación. Para documentar la evidencia:

1. Crear un Pull Request desde `demo/falla-critica` hacia `main`.
2. Verificar que `test` pase y que `security` detecte la vulnerabilidad HIGH mediante
   Snyk y/o Trivy. El resultado depende de que el repositorio tenga configurado su
   `SNYK_TOKEN`; no cambiar ni copiar ese secreto.
3. Confirmar que la protección de rama (configuración manual) no permite fusionar el
   PR con `security` en rojo. `build-scan-push` y `deploy` no deben publicar/desplegar
   el cambio bloqueado.
4. El workflow abre automáticamente un issue de alerta en el evento `push` que falla.
   La alerta es para el push de la rama; el job `alert` no se ejecuta en el evento
   `pull_request`.
5. Dejar el PR abierto y sin fusionar, tomar capturas sin credenciales y luego cerrar
   el PR o borrar la rama de demostración cuando el equipo ya no necesite la evidencia.

La validación de cumplimiento local revisa los controles de plataforma y puede pasar
en esta rama: el fallo intencional es el escaneo de la dependencia en `security`, no
la forma de los manifiestos.
