# Despliegue en Azure Kubernetes Service

La aplicación se despliega en el namespace `devops-staging` mediante los
manifiestos de [k8s/](../k8s/). El `Deployment` mantiene tres réplicas,
ejecuta el contenedor como usuario no root, limita CPU y memoria, y usa
`/health` para readiness y liveness. El `Service` publica HTTP mediante un
Azure Load Balancer.

## Configuración requerida en GitHub

El workflow necesita estas variables y secretos:

- Variables: `AKS_RESOURCE_GROUP` y `AKS_CLUSTER_NAME`.
- Secretos: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID` y `AZURE_SUBSCRIPTION_ID`.

La identidad federada de Azure debe permitir a GitHub Actions autenticarse
mediante OIDC y tener permisos `Azure Kubernetes Service Cluster User Role`
sobre el clúster. Para este repositorio y el Environment `staging`, la
credencial federada debe usar:

- Issuer: `https://token.actions.githubusercontent.com`.
- Audience: `api://AzureADTokenExchange`.
- Subject: `repo:kaYv-1@173298876/devops_007d_ols@1338805463:environment:staging`.

El `subject` debe coincidir exactamente con el que muestra el error de
`azure/login`; no se debe sustituir por el formato genérico
`repo:kaYv-1/devops_007d_ols:environment:staging`. El token `GITHUB_TOKEN` se
usa para crear el secreto de lectura de GHCR durante el despliegue.

## Flujo de despliegue

El job `deploy-aks` se ejecuta en pushes a `main` cuando
`vars.AKS_ENABLED` es `true`. El job:

1. Se autentica en Azure mediante OIDC.
2. Obtiene el contexto del clúster AKS.
3. Crea o actualiza el secreto de lectura de GHCR.
4. Sustituye la etiqueta de imagen por el SHA corto del commit.
5. Aplica namespace, configuración, Deployment y Service.
6. Espera el rollout de las tres réplicas.
7. Espera la IP externa y ejecuta un smoke test contra `/health`.

Las anotaciones `prometheus.io/*` dejan preparado el scraping de
`/metrics` para la siguiente fase.
