# devops_007d_ols

Microservicio base y flujo de trabajo Git/GitHub para la Evaluación Parcial N°1 de Ingeniería DevOps (DOY0101). Este repositorio es el punto de partida del pipeline DevOps que iremos ampliando durante el semestre.

## Integrantes

- Nombre Apellido 1 — GitHub: kaYv-1
- Nombre Apellido 2 — GitHub: kaliyx

## 1. Sobre el proyecto

El microservicio está construido en Node.js, sin dependencias externas, con dos rutas simples (`/` y `/health`) y un set de pruebas automatizadas. La idea de mantenerlo minimalista fue enfocar el trabajo del parcial en el flujo de Git y la automatización, no en la complejidad del código en sí.

## 2. Modelo de ramificación elegido: GitFlow

Optamos por [GitFlow](https://nvie.com/posts/a-successful-git-branching-model/) por sobre trunk-based development. Las razones concretas fueron:

- La pauta pide explícitamente las ramas `main`, `develop`, `feature/<nombre>` y `hotfix/<nombre>`, que corresponden directamente a la estructura de GitFlow.
- Al trabajar en pareja, nos convenía que cada persona pudiera abrir su propia rama de trabajo (`feature/...`) sin afectar lo que el otro tiene en curso, y que quedara claro en el nombre de la rama qué se estaba resolviendo.
- Mantener `main` intocable salvo por merges desde `develop` o `hotfix/` nos da una versión de referencia siempre estable, algo valioso cuando recién estamos aprendiendo a coordinar cambios en equipo.
- Trunk-based development apunta a integraciones muy frecuentes sobre una sola rama, apoyado en feature flags — un enfoque que tiene sentido con pipelines de CI/CD más maduros que el que estamos construyendo en este primer parcial.

## 3. Organización de ramas

| Rama | Para qué sirve |
|---|---|
| `main` | Versión estable del proyecto. Recibe cambios solo vía merge desde `develop` o desde un `hotfix/`. |
| `develop` | Rama donde se integran todas las features antes de pasar a `main`. |
| `feature/<nombre>` | Se abre desde `develop` para desarrollar una funcionalidad puntual. |
| `hotfix/<nombre>` | Se abre desde `main` para resolver un problema urgente sin esperar el ciclo normal de `develop`. |

Convención de nombres: minúsculas, palabras separadas por guion medio. Ejemplos usados en este repo: `feature/health-endpoint`, `feature/root-message`.

## 4. Convenciones de commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/): `<tipo>: <qué se hizo>`.

- `feat` — funcionalidad nueva
- `fix` — corrección de un error
- `chore` — configuración o tareas de mantenimiento
- `docs` — cambios de documentación
- `test` — pruebas nuevas o corregidas

Ejemplos reales del historial: `feat: agrega timestamp al endpoint de health`, `chore: agrega base del microservicio`.

## 5. Cómo trabajamos con Pull Requests

1. Se crea la rama correspondiente (`feature/` desde `develop`, `hotfix/` desde `main`).
2. Se desarrolla y se comitea siguiendo la convención anterior.
3. Se sube con `git push -u origin <rama>`.
4. Se abre el Pull Request en GitHub, apuntando a `develop` (features) o a `main` (hotfix).
5. El otro integrante revisa antes de aprobar: que los tests pasen, que el mensaje de commit sea coherente, y que el cambio corresponda a lo descrito en el PR.
6. Se aprueba el merge y se elimina la rama ya integrada.
7. Se sincroniza la copia local (`git pull`) antes de abrir la siguiente rama.

## 6. Automatización con GitHub Actions

El workflow vive en `.github/workflows/ci.yml` y se dispara en dos casos: cada `push` a `develop` y cada Pull Request hacia `main`. En ambos casos instala las dependencias del proyecto y corre los tests (`npm test`), de forma que ningún cambio llegue a `main` sin haber pasado esa verificación automática. Más sobre la herramienta en la [documentación oficial de GitHub Actions](https://docs.github.com/es/actions).

## 7. Estructura de carpetas

```
.
├── src/                    # Código del microservicio
├── test/                   # Pruebas automatizadas
├── .github/workflows/      # Configuración de CI/CD
├── package.json
├── .gitignore
└── README.md
```

## 8. Versionado

Usamos [Semantic Versioning](https://semver.org/lang/es/) (`MAJOR.MINOR.PATCH`) en `package.json`. Los tags de versión se generan sobre `main`, solo después de que un merge desde `develop` o un `hotfix` quedó confirmado.

## 9. Ejecutar el proyecto

```bash
npm install
npm start
```

Para correr las pruebas:

```bash
npm test
```

## 10. Uso de Inteligencia Artificial

Utilizamos Claude (Anthropic) como apoyo durante el desarrollo de este encargo: para generar el esqueleto inicial del microservicio de prueba, guiarnos en la sintaxis de los comandos de Git/GitHub paso a paso, y para redactar y ordenar este README.
