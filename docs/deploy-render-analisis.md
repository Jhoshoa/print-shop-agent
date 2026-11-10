# Análisis: Deploy en Render.com con CI/CD

Este documento analiza las implicaciones, requisitos y pasos necesarios para deployar Print Shop Generator en Render.com con GitHub Actions.

## Tabla de Contenidos

- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Análisis de Render.com](#análisis-de-rendercom)
- [Implicaciones para el Proyecto](#implicaciones-para-el-proyecto)
- [Arquitectura de Deployment](#arquitectura-de-deployment)
- [Implementación CI/CD](#implementación-cicd)
- [Configuración Paso a Paso](#configuración-paso-a-paso)
- [Costos y Limitaciones](#costos-y-limitaciones)
- [Alternativas Consideradas](#alternativas-consideradas)
- [Recomendación Final](#recomendación-final)

---

## Resumen Ejecutivo

| Aspecto | Evaluación |
|---------|------------|
| Viabilidad | ✅ Alta - El proyecto es compatible |
| Costo | ✅ Gratis (con limitaciones) |
| Complejidad | 🟡 Media - Requiere ajustes menores |
| CI/CD | ✅ Soportado vía Deploy Hooks |
| Limitación Principal | ⚠️ Archivos generados son efímeros |

**Conclusión:** Es viable deployar en Render.com, pero los archivos `.docx` generados se perderán en cada redeploy. Para uso personal/demo esto es aceptable; para producción se necesitaría storage externo.

---

## Análisis de Render.com

### Free Tier - Lo que incluye

| Recurso | Límite Gratuito |
|---------|-----------------|
| RAM | 512 MB |
| CPU | 0.1 CPU |
| Bandwidth | 100 GB/mes |
| Build minutes | 500 min/mes |
| Custom domains | 2 |
| Environments | 2 |
| Log retention | 7 días |

### Características Relevantes

| Característica | Disponible | Notas |
|----------------|------------|-------|
| Docker support | ✅ Sí | Usa nuestro Dockerfile existente |
| Auto-deploy | ✅ Sí | Push a main = deploy automático |
| HTTPS gratis | ✅ Sí | SSL automático en *.onrender.com |
| Custom domain | ✅ Sí | Hasta 2 dominios gratis |
| Deploy hooks | ✅ Sí | Para CI/CD con GitHub Actions |
| Health checks | ✅ Sí | Configurable |

### Limitaciones Importantes

#### 1. Spin Down por Inactividad
```
⚠️ El servicio se "duerme" después de 15 minutos sin tráfico.
   La primera request después toma ~30-60 segundos en responder.
```

**Impacto:** Aceptable para uso personal/demo. No ideal para producción.

#### 2. Filesystem Efímero
```
⚠️ Los archivos creados en runtime se pierden en cada deploy.
   Esto afecta la carpeta /backend/output donde guardamos los .docx
```

**Impacto:**
- Los usuarios pueden generar y descargar documentos normalmente
- El historial de documentos se pierde en cada deploy
- No afecta la funcionalidad principal (generar → descargar)

#### 3. Recursos Limitados
```
⚠️ 512 MB RAM y 0.1 CPU
   Suficiente para uso ligero, puede ser lento con muchas imágenes
```

**Impacto:** Funcional para uso normal. Puede ser lento con documentos de 50+ imágenes.

---

## Implicaciones para el Proyecto

### Cambios Necesarios

| Archivo | Cambio | Razón |
|---------|--------|-------|
| `Dockerfile` | Ninguno | Ya es compatible |
| `docker-compose.yml` | No se usa | Render usa Dockerfile directamente |
| Backend | Ninguno | FastAPI funciona sin cambios |
| Frontend | Ninguno | Se sirve como estático |

### Ajustes Recomendados

#### 1. Crear `render.yaml` (Blueprint)

```yaml
services:
  - type: web
    name: print-shop-generator
    runtime: docker
    dockerfilePath: ./Dockerfile
    dockerContext: .
    envVars:
      - key: APP_ENV
        value: production
      - key: PORT
        value: 8000
    healthCheckPath: /api/health
```

#### 2. Variables de Entorno en Render

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `APP_ENV` | production | Modo producción |
| `PORT` | 8000 | Puerto de la app |
| `LOG_LEVEL` | INFO | Nivel de logs |

### Lo que NO cambia

- ✅ El código del backend
- ✅ El código del frontend
- ✅ El Dockerfile
- ✅ La lógica de generación de documentos
- ✅ La descarga de archivos (funciona igual)

---

## Arquitectura de Deployment

### Flujo Actual (Docker Local)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Usuario   │────▶│   Docker    │────▶│    App      │
│  (Browser)  │     │  (Puerto 80)│     │ (Puerto 8000)│
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Volumen   │
                    │  (output/)  │
                    └─────────────┘
```

### Flujo en Render

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Usuario   │────▶│   Render    │────▶│    App      │
│  (Browser)  │     │   (HTTPS)   │     │ (Puerto 8000)│
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │            ┌─────────────┐            │
       └───────────▶│  onrender   │◀───────────┘
                    │    .com     │
                    │  (SSL auto) │
                    └─────────────┘
```

---

## Implementación CI/CD

### Opción 1: Auto-Deploy de Render (Recomendado)

Render tiene integración nativa con GitHub. Al conectar el repo:
- Push a `main` = Deploy automático
- No necesita GitHub Actions para deploy básico

```
GitHub Push → Render detecta → Build → Deploy
```

### Opción 2: GitHub Actions + Deploy Hook

Para más control (ejecutar tests antes de deploy):

```
GitHub Push → Actions (test) → Deploy Hook → Render Build → Deploy
```

### Workflow de GitHub Actions

Crear `.github/workflows/deploy.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Run linter
        run: ruff check backend/

      - name: Run tests
        run: pytest backend/tests -v

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - name: Deploy to Render
        run: |
          curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_URL }}"
```

### Secretos Necesarios en GitHub

| Secreto | Descripción | Dónde obtenerlo |
|---------|-------------|-----------------|
| `RENDER_DEPLOY_HOOK_URL` | URL del deploy hook | Render Dashboard → Service → Settings |

---

## Configuración Paso a Paso

### Paso 1: Crear cuenta en Render

1. Ir a https://render.com
2. Sign up con GitHub (recomendado para integración directa)

### Paso 2: Crear Web Service

1. Dashboard → **New** → **Web Service**
2. Conectar repositorio de GitHub
3. Configurar:

| Campo | Valor |
|-------|-------|
| Name | `print-shop-generator` |
| Region | `Oregon (US West)` o el más cercano |
| Branch | `main` |
| Runtime | `Docker` |
| Instance Type | `Free` |

### Paso 3: Configurar Variables de Entorno

En Render Dashboard → Service → Environment:

```
APP_ENV=production
PORT=8000
LOG_LEVEL=INFO
HOST=0.0.0.0
```

### Paso 4: Obtener Deploy Hook (para CI/CD)

1. Render Dashboard → Service → **Settings**
2. Sección **Deploy Hook**
3. Copiar la URL

### Paso 5: Configurar GitHub Secret

1. GitHub Repo → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**
3. Name: `RENDER_DEPLOY_HOOK_URL`
4. Value: (pegar URL del paso anterior)

### Paso 6: Crear GitHub Actions Workflow

Crear archivo `.github/workflows/deploy.yml` con el contenido de la sección anterior.

### Paso 7: Push y Verificar

```bash
git add .
git commit -m "feat: add Render deployment configuration"
git push origin main
```

Verificar en:
- GitHub → Actions (debe pasar tests y trigger deploy)
- Render → Dashboard (debe mostrar deploy en progreso)

---

## Costos y Limitaciones

### Tier Gratuito - Suficiente para:

- ✅ Portfolio/Demo personal
- ✅ Uso ocasional (< 100 usuarios/día)
- ✅ Desarrollo y testing
- ✅ MVP/Proof of concept

### Tier Gratuito - NO suficiente para:

- ❌ Producción con usuarios constantes
- ❌ Almacenamiento persistente de documentos
- ❌ Alta disponibilidad (spin down de 15 min)
- ❌ Procesamiento de documentos pesados

### Upgrade Path

Si necesitas más recursos:

| Plan | Costo | Beneficios |
|------|-------|------------|
| Starter | $7/mes | No spin down, 512 MB RAM |
| Standard | $25/mes | 2 GB RAM, mejor CPU |
| Pro | $85/mes | 4 GB RAM, autoscaling |

---

## Alternativas Consideradas

| Plataforma | Gratis | Docker | CI/CD | Spin Down | Notas |
|------------|--------|--------|-------|-----------|-------|
| **Render** | ✅ | ✅ | ✅ | ⚠️ 15 min | Recomendado |
| Railway | ✅ (limitado) | ✅ | ✅ | ❌ | $5 crédito/mes |
| Fly.io | ✅ (limitado) | ✅ | ✅ | ⚠️ | Más complejo |
| Heroku | ❌ | ✅ | ✅ | N/A | Ya no tiene free tier |
| Vercel | ✅ | ❌ | ✅ | ❌ | Solo frontend/serverless |

**Render es la mejor opción** para este proyecto porque:
1. Soporta Docker nativamente
2. Tiene free tier funcional
3. Integración simple con GitHub
4. HTTPS automático

---

## Recomendación Final

### Para Uso Personal/Demo

```
✅ Usar Render Free Tier
✅ Auto-deploy desde GitHub (sin Actions)
✅ Aceptar limitación de filesystem efímero
```

### Para Producción

```
⚠️ Upgrade a Starter ($7/mes) para evitar spin down
⚠️ Considerar storage externo (S3, Cloudinary) para documentos
⚠️ Implementar CI/CD completo con tests
```

### Archivos a Crear

1. `render.yaml` - Blueprint de configuración
2. `.github/workflows/deploy.yml` - Pipeline CI/CD
3. Actualizar `README.md` con URL de producción

---

## Próximos Pasos

1. [ ] Crear cuenta en Render.com
2. [ ] Conectar repositorio de GitHub
3. [ ] Crear Web Service con configuración Docker
4. [ ] Configurar variables de entorno
5. [ ] (Opcional) Configurar GitHub Actions para CI/CD
6. [ ] Verificar deployment funcional
7. [ ] Actualizar README con URL de producción
