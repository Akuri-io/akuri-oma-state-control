# 🚀 GitHub Actions Workflows Configuration

## 📋 Overview

Los workflows de GitHub Actions proporcionan CI/CD automatizado para tu librería `akuri-oma-state-control`. Se ejecutan automáticamente y manejan:

- ✅ Build y tests en cada push/PR
- ✅ Publicación automática en npm
- ✅ Versionado automático
- ✅ Creación de releases

## 📁 Archivos de Workflow

### 1. `ci.yml` - Continuous Integration
```yaml
name: CI/CD Pipeline
on: [push, pull_request]
```
**Función**:
- Ejecuta build en Node.js 18.x y 20.x
- Ejecuta linting y tests
- Verifica que los archivos de build se generen correctamente
- Crea artifacts para descarga

### 2. `publish.yml` - NPM Publication
```yaml
name: Publish to NPM
on: [release, workflow_dispatch]
```
**Función**:
- Se ejecuta cuando se crea un release en GitHub
- Permite publicación manual desde Actions
- Publica automáticamente en npm
- Crea assets del release

### 3. `auto-release.yml` - Automatic Versioning
```yaml
name: Auto Version and Release
on: [push to main with specific paths]
```
**Función**:
- Detecta automáticamente el tipo de versión (major/minor/patch)
- Crea PR para version bump
- Publica automáticamente cuando se mergea a main

## 🔒 Configuración de GitHub Environments (Recomendado)

Los workflows incluyen configuración de `environment: production` para mayor seguridad:

### Beneficios de usar Environments:
- **Protección contra publicaciones accidentales**
- **Control de acceso granular** (quién puede hacer publish)
- **Required reviews** antes de publicar
- **Branch protection** para el entorno de producción
- **Audit trail** de quién aprobó cada publicación

### Cómo configurar el Environment "production":
1. Ve a tu repositorio en GitHub
2. **Settings** → **Environments**
3. Click **New environment**
4. Nombre: `production`
5. **Optional protections**:
   - ✅ "Required reviewers" (agregar maintainers)
   - ✅ "Wait timer" (ej: 5 minutos para revisión)
   - ✅ "Deployment branches" (solo main branch)

## 🔧 Configuración de Secrets

Para que los workflows funcionen correctamente, necesitas configurar estos secrets en tu repositorio de GitHub:

### 1. NPM_TOKEN (Obligatorio)

**Para qué**: Publicar automáticamente en npm registry

**Cómo obtenerlo**:
1. Ve a https://www.npmjs.com/settings/tokens
2. Crea un nuevo token (Automation o Publishing)
3. Copia el token

**En GitHub**:
1. Ve a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. New repository secret
4. Nombre: `NPM_TOKEN`
5. Valor: [tu token de npm]

### 2. GITHUB_TOKEN (Automático)
- ✅ Ya existe automáticamente
- ✅ Permisos de lectura/escritura en el repositorio
- ✅ No necesitas configurarlo manualmente

## 🏗️ Tipos de Publicación

### Opción 1: Publicación Manual por Release
```bash
# 1. Hacer cambios y commit
git add .
git commit -m "feat: add new feature"
git push

# 2. Crear release en GitHub
# - Ir a Releases
# - Draft a new release
# - Tag version: v1.0.0
# - Publish release

# 3. Workflow se ejecuta automáticamente
```

### Opción 2: Publicación Automática (Recomendado)
```bash
# 1. Usar Conventional Commits para auto-versioning:
# feat: add new feature -> minor version bump
# fix: bug fix -> patch version bump
# feat!: breaking change -> major version bump

git commit -m "feat: add vehicle state persistence"
git push

# 2. Workflow auto-detecta el tipo y crea PR
# 3. Merge PR -> auto-publish + auto-release
```

### Opción 3: Publicación Manual desde Actions
```bash
# 1. Ve a Actions tab en GitHub
# 2. Select "Publish to NPM" workflow
# 3. Click "Run workflow"
# 4. Especifica la versión manualmente
```

## 📊 Monitoring y Debugging

### Ver logs de workflows:
1. Ve a la tab **Actions** en tu repositorio
2. Click en el workflow run que quieres revisar
3. Click en cualquier job para ver logs detallados

### Artifacts de build:
- Los archivos de build se guardan por 7 días
- Download desde la página del workflow run
- Útil para testing local antes de publicar

## 🔍 Troubleshooting

### Error: `NPM_TOKEN` no válido
```
Error: 401 Unauthorized - PUT https://registry.npmjs.org/akuri-oma-state-control
```
**Solución**: 
1. Verificar que el token sea válido
2. Regenerar token en npm
3. Actualizar secret en GitHub

### Error: Build fail en CI
```
Error: Build process failed
```
**Solución**:
1. Revisar logs del job "test-and-build"
2. Verificar que las dependencias estén bien
3. Testear localmente: `npm run build`

### Error: Version already exists
```
Error: 403 Forbidden - PUT https://registry.npmjs.org/akuri-oma-state-control
```
**Solución**:
1. Incrementar versión en package.json
2. O verificar que la versión no exista en npm

## 🔄 Workflow States

### Verde ✅ (Success)
- Build completado
- Tests pasando
- Lista para publicar

### Rojo ❌ (Failure)
- Error en build o tests
- Token inválido
- Dependencias faltantes

### Amarillo 🟡 (In Progress)
- Workflow ejecutándose
- Build en progreso
- Tests ejecutándose

## 🚀 Próximos Pasos

1. **Configurar NPM_TOKEN** en GitHub Secrets
2. **Probar CI** con un push a develop
3. **Probar publicación** con un release de prueba
4. **Activar auto-versioning** mergeando a main

## 📚 Referencias

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Conventional Commits](https://www.conventionalcommits.org/)

## 🔒 Seguridad y Mejores Prácticas

### Configuración de Environment "production":
- **Required reviewers**: Agrega maintainers que deben aprobar cada publicación
- **Wait timer**: 5-10 minutos para permitir cancelación en caso de error
- **Branch restrictions**: Solo permite deployments desde main/production branches

### Protección adicional recomendada:
```bash
# En Settings → Branches
# Agregar rule para main branch:
# ✅ Require pull request reviews before merging
# ✅ Dismiss stale reviews when new commits are pushed  
# ✅ Require status checks to pass before merging
# ✅ Require branches to be up to date before merging
```

### Roles y permisos:
- **Maintainers**: Pueden aprobar publicaciones
- **Contributors**: Pueden crear PRs pero no publicar directamente
- **Collaborators**: Acceso de solo lectura

### NPM Token Security:
- ✅ Usar tokens de tipo "Automation" (más restrictivos)
- ✅ Rotar tokens regularmente
- ✅ Monitorear uso de tokens en npm dashboard
- ✅ Revocar tokens inmediatamente si hay sospecha de compromiso

### Monitoring y Alerts:
- Configurar GitHub webhooks para notifications de failures
- Monitorear npm package para uso inusual
- Revisar logs de GitHub Actions regularmente

---

## 📊 Workflow Status Dashboard

### Indicadores de salud del proyecto:
- **🟢 Verde**: CI passing, última publicación exitosa
- **🟡 Amarillo**: CI running, construcción en progreso  
- **🔴 Rojo**: CI failure, revisión de logs requerida

### Métricas importantes:
- Tiempo promedio de build: < 5 minutos
- Frecuencia de releases: Semanal/Mensual
- Success rate de publicaciones: > 95%

---

**💡 Tip**: Empieza con publicación manual por release hasta estar cómodo con el proceso, luego activa auto-versioning con environment protection enabled.