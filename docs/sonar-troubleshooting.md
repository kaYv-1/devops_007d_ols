# SonarQube Cloud: cobertura y Quality Gate

El workflow de GitHub Actions ejecuta las pruebas en el job `test` y publica
`coverage/lcov.info` como el artifact `lcov`. El job `security` lo descarga
antes del escaneo. `scripts/run-tests.js` conserva el reporte TAP y el umbral
local de cobertura, y normaliza las rutas `SF:` de LCOV a rutas relativas con
separadores `/`, como `src/index.js`.

El análisis Sonar se ejecuta en pull requests dirigidos a `main` y en pushes a
`main`. Los pushes directos a ramas secundarias no se analizan porque la
organización de SonarQube Cloud no permite consultar Quality Gates para ramas
que no son la principal; el análisis de pull request conserva el Quality Gate.

## Comprobaciones manuales pendientes

Estas comprobaciones requieren acceso a la configuración web de GitHub o
SonarQube Cloud; no se pueden confirmar desde el repositorio:

1. En SonarQube Cloud, abre el proyecto `micro-demo` y ve a
   **Administration → Analysis Method**. Desactiva **Automatic Analysis** y
   deja habilitado el análisis **With GitHub Actions**. El análisis automático
   no importa la cobertura del workflow y puede entrar en conflicto con el
   análisis de CI.
2. En GitHub, abre **Settings → Secrets and variables → Actions** y confirma
   que existe el secret `SONAR_TOKEN`. En SonarQube Cloud, confirma que el token
   correspondiente no ha expirado. No copies el valor del token a logs ni al
   repositorio.
3. En SonarQube Cloud, abre **Administration → New Code** y confirma que la
   definición sea razonable, por ejemplo **Previous version** o
   **Reference branch: main**. El Quality Gate **Sonar way** exige al menos
   80% de cobertura en código nuevo.
4. En SonarQube Cloud, abre **Administration → Branches & Pull Requests** y
   confirma que la rama principal configurada sea `main`.
5. Después de fusionar el PR, espera a que el workflow de `main` termine.
   Confirma en SonarQube Cloud que **Coverage** sea mayor que 0% y el
   **Quality Gate** esté en **Passed**. Toma una captura como evidencia para
   IE5.
6. Opcional para IE5/IE6: en GitHub, agrega el check de SonarQube como status
   check requerido en la regla de protección de `main`.
