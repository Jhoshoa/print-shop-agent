# Análisis de Plataformas de Deployment v2

Análisis completo incluyendo los grandes proveedores cloud (AWS, Google Cloud, Azure) y plataformas populares (Vercel, Heroku).

## Tabla de Contenidos

- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Comparativa General](#comparativa-general)
- [Grandes Proveedores Cloud](#grandes-proveedores-cloud)
- [Plataformas PaaS Populares](#plataformas-paas-populares)
- [VPS y Self-Hosted](#vps-y-self-hosted)
- [Análisis de Costos por Escenario](#análisis-de-costos-por-escenario)
- [Matriz de Decisión](#matriz-de-decisión)
- [Conclusión Final](#conclusión-final)

---

## Resumen Ejecutivo

### Requerimientos de Print Shop Generator

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| CPU | 0.5 vCPU | 1+ vCPU |
| RAM | 512 MB | 1-2 GB |
| Storage | 1 GB | 5+ GB |
| Spin Down | ❌ No deseado | ❌ No |
| Docker | ✅ Requerido | ✅ Sí |

### Top 5 Recomendaciones (Precio/Rendimiento)

| Rank | Plataforma | Costo/mes | CPU | RAM | Ideal para |
|------|------------|-----------|-----|-----|------------|
| 🥇 | **Hetzner + Coolify** | ~$4 | 2 vCPU | 4 GB | Mejor valor absoluto |
| 🥈 | **Railway** | $5-10 | Variable | Variable | Facilidad de uso |
| 🥉 | **DigitalOcean App** | $5-12 | 1 shared | 512MB-1GB | Confiabilidad |
| 4 | **AWS Lightsail** | $7-10 | 0.25-1 vCPU | 0.5-1 GB | Ecosistema AWS |
| 5 | **Fly.io** | $5-10 | 1 shared | 256MB-1GB | Multi-región |

### ❌ No Recomendados para este proyecto

| Plataforma | Razón |
|------------|-------|
| **Vercel** | No soporta Docker/contenedores persistentes |
| **Render Free** | Muy pocos recursos, spin down 15 min |
| **AWS App Runner** | Será discontinuado en 2026 |

---

## Comparativa General

### Todos los Proveedores - Vista Rápida

| Plataforma | Mín. Precio | CPU | RAM | Docker | Spin Down | Free Tier |
|------------|-------------|-----|-----|--------|-----------|-----------|
| **Vercel** | $0-20 | Serverless | Serverless | ❌ | ⚠️ Sí | ✅ Limitado |
| **Heroku** | $5-7 | Shared | 512 MB | ✅ | ⚠️ Eco sí | ❌ |
| **Render** | $0-7 | 0.1-0.5 | 512 MB | ✅ | ⚠️ Free sí | ✅ Muy limitado |
| **Railway** | $5+ | Variable | Variable | ✅ | ❌ | ❌ Trial |
| **Fly.io** | $5+ | Shared | 256 MB+ | ✅ | ⚠️ Config | ❌ |
| **DigitalOcean App** | $5+ | Shared | 512 MB | ✅ | ❌ | ❌ |
| **AWS Lightsail** | $7+ | 0.25 vCPU | 512 MB | ✅ | ❌ | ✅ 3 meses |
| **AWS App Runner** | ~$5+ | Variable | Variable | ✅ | ⚠️ Sí | ❌ |
| **AWS EC2 t4g** | ~$6+ | 2 vCPU | 1 GB | ✅ | ❌ | ✅ 750h/mes |
| **Google Cloud Run** | $0+ | Variable | Variable | ✅ | ⚠️ Sí | ✅ Generoso |
| **Azure Container Apps** | $0+ | Variable | Variable | ✅ | ⚠️ Sí | ✅ Generoso |
| **Hetzner** | €3.79 | 2 vCPU | 4 GB | ✅ | ❌ | ❌ |

---

## Grandes Proveedores Cloud

### Amazon Web Services (AWS)

#### AWS Lightsail (Recomendado para AWS)

**Sitio:** [aws.amazon.com/lightsail](https://aws.amazon.com/lightsail/pricing/)

| Plan | vCPU | RAM | Storage | Transfer | Precio |
|------|------|-----|---------|----------|--------|
| Nano | 0.25 | 512 MB | 20 GB | 1 TB | $3.50/mes |
| Micro | 0.5 | 1 GB | 40 GB | 2 TB | $5/mes |
| Small | 1 | 2 GB | 60 GB | 3 TB | $10/mes |
| Medium | 2 | 4 GB | 80 GB | 4 TB | $20/mes |

**Container Service:**

| Tier | vCPU | RAM | Precio |
|------|------|-----|--------|
| Nano | 0.25 | 512 MB | $7/mes |
| Micro | 0.5 | 1 GB | $10/mes |
| Small | 1 | 2 GB | $20/mes |

**Pros:**
- Precios predecibles (no sorpresas)
- Free tier 3 meses (containers)
- 500 GB transfer incluido
- Integración con ecosistema AWS

**Contras:**
- Menos flexible que EC2
- Recursos limitados vs competencia
- No escala automáticamente

**Costo para Print Shop:** ~$7-10/mes (Micro container)

---

#### AWS EC2 (Más control)

**Sitio:** [aws.amazon.com/ec2/pricing](https://aws.amazon.com/ec2/pricing/on-demand/)

| Instancia | vCPU | RAM | Precio On-Demand | Precio Spot |
|-----------|------|-----|------------------|-------------|
| t4g.micro | 2 | 1 GB | ~$6/mes | ~$2-3/mes |
| t4g.small | 2 | 2 GB | ~$12/mes | ~$4-5/mes |
| t4g.medium | 2 | 4 GB | ~$24/mes | ~$8-10/mes |
| t3.micro | 2 | 1 GB | ~$8/mes | ~$3/mes |

**Free Tier:** t4g.small gratis 750h/mes hasta Dic 2026

**Pros:**
- Control total
- Múltiples opciones de ahorro (Spot, Reserved)
- Free tier generoso
- ARM (Graviton) muy eficiente

**Contras:**
- Requiere más configuración
- Necesitas manejar infraestructura
- Complejidad de AWS

**Costo para Print Shop:** ~$6-12/mes (t4g.micro/small)

---

#### AWS App Runner ⚠️

**Sitio:** [aws.amazon.com/apprunner](https://aws.amazon.com/apprunner/pricing/)

> ⚠️ **IMPORTANTE:** AWS App Runner será discontinuado para nuevos clientes el 30 de abril de 2026. AWS recomienda migrar a Amazon ECS Express Mode.

| Recurso | Precio (US regions) |
|---------|---------------------|
| vCPU activo | $0.064/vCPU-hora |
| RAM activo | $0.007/GB-hora |
| RAM idle | $0.007/GB-hora |
| Build | $0.005/minuto |

**NO RECOMENDADO** debido a discontinuación próxima.

---

### Google Cloud Platform (GCP)

#### Google Cloud Run

**Sitio:** [cloud.google.com/run/pricing](https://cloud.google.com/run/pricing)

| Recurso | Precio | Free Tier/mes |
|---------|--------|---------------|
| vCPU | $0.000024/vCPU-seg | 180,000 vCPU-seg |
| RAM | $0.0000025/GiB-seg | 360,000 GiB-seg |
| Requests | $0.40/millón | 2 millones |

**Free Tier Equivalente:**
- ~50 horas CPU/mes
- ~100 horas de 1 GB RAM/mes
- 2 millones de requests

**Pros:**
- Free tier muy generoso
- Escala a cero (no pagas si no usas)
- Infraestructura Google
- HTTPS automático

**Contras:**
- Cold starts (30-60 segundos)
- Complejidad de GCP
- Costos impredecibles si escala
- Requiere cuenta GCP con tarjeta

**Costo para Print Shop:**
```
Uso bajo: $0-5/mes (dentro de free tier)
Uso moderado: $10-20/mes
Uso alto: $30-50/mes
```

---

### Microsoft Azure

#### Azure Container Apps

**Sitio:** [azure.microsoft.com/pricing/details/container-apps](https://azure.microsoft.com/en-us/pricing/details/container-apps/)

| Recurso | Precio | Free Tier/mes |
|---------|--------|---------------|
| vCPU | $0.000024/vCPU-seg | 180,000 vCPU-seg |
| RAM | $0.000003/GiB-seg | 360,000 GiB-seg |
| Requests | $0.40/millón | 2 millones |

**Prácticamente idéntico a Google Cloud Run**

**Pros:**
- Free tier generoso (igual que GCP)
- Escala a cero
- Buena integración con Azure DevOps
- Soporte para GPUs serverless

**Contras:**
- Cold starts
- Complejidad de Azure
- Portal puede ser confuso

**Costo para Print Shop:** Similar a Cloud Run, $0-20/mes

---

## Plataformas PaaS Populares

### Vercel ❌

**Sitio:** [vercel.com/pricing](https://vercel.com/pricing)

| Plan | Precio | Serverless Invocations | Bandwidth |
|------|--------|------------------------|-----------|
| Hobby | $0 | 150K/mes | 100 GB |
| Pro | $20/mes | 1M/mes | 1 TB |

**❌ NO COMPATIBLE con Print Shop Generator**

**Razones:**
- No soporta Docker containers
- Solo serverless functions (máx 4.5 MB payload)
- Diseñado para frontend/JAMstack
- No puede ejecutar FastAPI como servidor persistente

**Vercel es ideal para:** Next.js, React, sitios estáticos
**NO es ideal para:** APIs backend, procesamiento de archivos, Docker

---

### Heroku

**Sitio:** [heroku.com/pricing](https://www.heroku.com/pricing/)

| Dyno | vCPU | RAM | Precio | Sleep |
|------|------|-----|--------|-------|
| Eco | Shared | 512 MB | $5/mes (1000h pool) | ⚠️ 30 min |
| Basic | Shared | 512 MB | $7/mes | ❌ No |
| Standard-1X | 1 | 512 MB | $25/mes | ❌ No |
| Standard-2X | 2 | 1 GB | $50/mes | ❌ No |

**Pros:**
- Muy fácil de usar
- Gran ecosistema de add-ons
- Buena documentación
- Git push deploy

**Contras:**
- Caro para lo que ofrece
- 512 MB RAM en planes bajos
- Eco duerme después de 30 min
- Ya no tiene free tier real

**Costo para Print Shop:** $7-25/mes (Basic a Standard)

---

### Railway

**Sitio:** [railway.com/pricing](https://railway.com/pricing)

| Plan | Incluido | Modelo |
|------|----------|--------|
| Trial | $5 crédito único | Pay-per-use |
| Hobby | $5/mes incluidos | Pay-per-use |
| Pro | $20/mes incluidos | Pay-per-use |

**Precios de recursos:**
- vCPU: $0.000463/minuto (~$20/mes 24/7)
- RAM: $0.000231/GB/minuto (~$10/mes por GB 24/7)

**Pros:**
- Excelente DX
- Sin spin down
- Límite de gasto configurable
- Facturación por segundo real

**Contras:**
- Sin free tier permanente
- Costos pueden escalar
- Menos regiones

**Costo para Print Shop:** ~$5-15/mes

---

### Render

**Sitio:** [render.com/pricing](https://render.com/pricing)

| Plan | CPU | RAM | Precio | Sleep |
|------|-----|-----|--------|-------|
| Free | 0.1 | 512 MB | $0 | ⚠️ 15 min |
| Starter | 0.5 | 512 MB | $7/mes | ❌ |
| Standard | 1 | 2 GB | $25/mes | ❌ |
| Pro | 2 | 4 GB | $85/mes | ❌ |

**Ya lo conoces** - Free es muy limitado, Starter es mínimamente viable.

---

### Fly.io

**Sitio:** [fly.io/pricing](https://fly.io/pricing/)

| Recurso | Precio |
|---------|--------|
| Shared CPU (256MB) | ~$1.94/mes (24/7) |
| Shared CPU (1GB) | ~$5.70/mes (24/7) |
| Dedicated CPU | Desde $0.0149/hora |
| Storage | $0.15/GB/mes |
| Bandwidth | $0.02/GB (outbound) |

**Pros:**
- Firecracker microVMs
- Multi-región fácil
- Buen rendimiento/precio
- Máquinas pueden pausarse

**Contras:**
- Ya no hay free tier
- Config más compleja
- Cold starts si escala a 0

**Costo para Print Shop:** ~$5-10/mes

---

### DigitalOcean App Platform

**Sitio:** [digitalocean.com/pricing/app-platform](https://www.digitalocean.com/pricing/app-platform)

| Tier | CPU | RAM | Precio |
|------|-----|-----|--------|
| Basic (shared) | 1 shared | 512 MB | $5/mes |
| Basic (shared) | 1 shared | 1 GB | $10/mes |
| Professional | 1 dedicated | 1 GB | $12/mes |
| Professional | 1 dedicated | 2 GB | $25/mes |

**Pros:**
- Empresa confiable
- Sin sorpresas de facturación
- Buena documentación
- Fácil de usar

**Contras:**
- Más caro que alternativas
- Menos flexible

**Costo para Print Shop:** $5-12/mes

---

## VPS y Self-Hosted

### Hetzner Cloud (⭐ MEJOR VALOR)

**Sitio:** [hetzner.com/cloud](https://www.hetzner.com/cloud/)

| Plan | CPU | RAM | Storage | Transfer | Precio |
|------|-----|-----|---------|----------|--------|
| CX22 | 2 vCPU Intel | 4 GB | 40 GB NVMe | 20 TB | €3.79/mes |
| CAX11 | 2 vCPU ARM | 4 GB | 40 GB NVMe | 20 TB | €3.79/mes |
| CX32 | 4 vCPU | 8 GB | 80 GB NVMe | 20 TB | €7.59/mes |
| CX42 | 8 vCPU | 16 GB | 160 GB NVMe | 20 TB | €14.99/mes |

**Con Coolify (gratis):** Experiencia tipo Vercel/Heroku

**Pros:**
- **MEJOR precio/rendimiento**
- 2 vCPU + 4 GB por €3.79
- 20 TB transfer incluido
- NVMe SSD
- Datacenters en EU y US

**Contras:**
- Requiere setup inicial
- Tú manejas el servidor
- Soporte básico

**Costo para Print Shop:** ~€4-8/mes (~$4-9)

---

### Otros VPS Económicos

| Proveedor | Plan Mínimo | CPU | RAM | Precio |
|-----------|-------------|-----|-----|--------|
| **Vultr** | Cloud Compute | 1 vCPU | 1 GB | $5/mes |
| **Linode** | Nanode | 1 vCPU | 1 GB | $5/mes |
| **DigitalOcean** | Droplet | 1 vCPU | 1 GB | $6/mes |
| **OVH** | Starter | 1 vCPU | 2 GB | €3.50/mes |

---

## Análisis de Costos por Escenario

### Escenario 1: Uso Personal (bajo tráfico)

| Plataforma | Costo/mes | Notas |
|------------|-----------|-------|
| Google Cloud Run | $0-3 | Dentro de free tier |
| Azure Container Apps | $0-3 | Dentro de free tier |
| Hetzner + Coolify | €3.79 | Siempre disponible |
| Railway | $5 | Mínimo fijo |
| Render Free | $0 | Muy lento, sleep 15 min |

**Ganador:** Cloud Run/Azure (si aceptas cold starts) o Hetzner (sin cold starts)

---

### Escenario 2: Proyecto Serio (tráfico moderado)

| Plataforma | Costo/mes | Recursos |
|------------|-----------|----------|
| **Hetzner CX22** | ~$4 | 2 vCPU, 4 GB |
| Railway | $8-15 | Variable |
| DigitalOcean App | $10-12 | 1 CPU, 1 GB |
| Fly.io | $8-12 | 1 CPU, 1 GB |
| AWS Lightsail | $10 | 0.5 vCPU, 1 GB |
| Heroku Basic | $7 | Shared, 512 MB |
| Cloud Run | $10-20 | Variable |

**Ganador:** Hetzner (4x más recursos por menos precio)

---

### Escenario 3: Producción (alto tráfico)

| Plataforma | Costo/mes | Recursos |
|------------|-----------|----------|
| **Hetzner CX32** | ~$8 | 4 vCPU, 8 GB |
| AWS EC2 t4g.medium | ~$25 | 2 vCPU, 4 GB |
| DigitalOcean App Pro | $25 | 1 vCPU, 2 GB |
| Render Standard | $25 | 1 vCPU, 2 GB |
| Heroku Standard-2X | $50 | 2 vCPU, 1 GB |

**Ganador:** Hetzner (mejor precio/rendimiento)

---

## Matriz de Decisión

### ¿Qué plataforma elegir?

```
¿Necesitas Docker?
├── NO → Vercel (solo frontend/serverless)
└── SÍ → Continuar...
    │
    ├── ¿Presupuesto < $5/mes?
    │   ├── ¿Aceptas cold starts?
    │   │   ├── SÍ → Google Cloud Run / Azure Container Apps
    │   │   └── NO → Hetzner + Coolify (~€4)
    │   └── Render Free (muy limitado, no recomendado)
    │
    ├── ¿Presupuesto $5-15/mes?
    │   ├── ¿Quieres simplicidad máxima?
    │   │   ├── SÍ → Railway ($5-10)
    │   │   └── NO → Hetzner + Coolify (mejor valor)
    │   └── ¿Necesitas AWS específicamente? → Lightsail ($7-10)
    │
    └── ¿Presupuesto $15-50/mes?
        ├── ¿Necesitas multi-región? → Fly.io
        ├── ¿Necesitas ecosistema AWS? → EC2 o Lightsail
        └── ¿Quieres máximo rendimiento? → Hetzner CX32/CX42
```

---

## Conclusión Final

### Ranking General (Precio/Rendimiento)

| Rank | Plataforma | Costo | Recursos | Facilidad | Score |
|------|------------|-------|----------|-----------|-------|
| 🥇 | **Hetzner + Coolify** | €3.79 | 2 vCPU/4GB | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 🥈 | **Railway** | $5-10 | Variable | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 🥉 | **Cloud Run** | $0-15 | Variable | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| 4 | **DigitalOcean App** | $5-12 | 1 CPU/1GB | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| 5 | **Fly.io** | $5-10 | Variable | ⭐⭐⭐ | ⭐⭐⭐ |
| 6 | **AWS Lightsail** | $7-10 | 0.5CPU/1GB | ⭐⭐⭐ | ⭐⭐⭐ |
| 7 | **Heroku** | $7-25 | 512MB-1GB | ⭐⭐⭐⭐ | ⭐⭐ |
| 8 | **Render** | $7-25 | 0.5-1 CPU | ⭐⭐⭐⭐ | ⭐⭐ |

### Para Print Shop Generator

**Recomendación #1: Hetzner + Coolify**
- Costo: ~$4/mes
- Recursos: 2 vCPU, 4 GB RAM, 40 GB SSD
- Sin cold starts, siempre disponible
- Setup: ~30 minutos

**Recomendación #2: Railway** (si prefieres no manejar servidor)
- Costo: ~$5-10/mes
- Recursos: Dinámicos según uso
- Muy fácil de usar
- Sin cold starts

**NO usar:**
- ❌ Vercel (no soporta Docker)
- ❌ Render Free (muy lento)
- ❌ AWS App Runner (será discontinuado)

---

## Referencias

### Documentación Oficial
- [AWS Lightsail Pricing](https://aws.amazon.com/lightsail/pricing/)
- [AWS EC2 Pricing](https://aws.amazon.com/ec2/pricing/on-demand/)
- [Google Cloud Run Pricing](https://cloud.google.com/run/pricing)
- [Azure Container Apps Pricing](https://azure.microsoft.com/en-us/pricing/details/container-apps/)
- [Vercel Pricing](https://vercel.com/pricing)
- [Heroku Pricing](https://www.heroku.com/pricing/)
- [Railway Pricing](https://railway.com/pricing)
- [Render Pricing](https://render.com/pricing)
- [Fly.io Pricing](https://fly.io/pricing/)
- [DigitalOcean App Platform](https://www.digitalocean.com/pricing/app-platform)
- [Hetzner Cloud](https://www.hetzner.com/cloud/)

### Herramientas de Comparación
- [Fly.io Calculator](https://fly.io/calculator)
- [AWS Pricing Calculator](https://calculator.aws/)
- [instances.vantage.sh](https://instances.vantage.sh/) - Comparador EC2
