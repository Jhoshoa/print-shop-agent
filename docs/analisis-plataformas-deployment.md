# Análisis de Plataformas de Deployment

Este documento analiza las diferentes opciones para deployar Print Shop Generator, comparando costos, recursos y características.

## Tabla de Contenidos

- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Comparativa Rápida](#comparativa-rápida)
- [Análisis Detallado por Plataforma](#análisis-detallado-por-plataforma)
- [Recomendaciones por Caso de Uso](#recomendaciones-por-caso-de-uso)
- [Conclusión Final](#conclusión-final)

---

## Resumen Ejecutivo

### El Problema con Render Free

| Recurso | Render Free | Mínimo Recomendado |
|---------|-------------|-------------------|
| CPU | 0.1 CPU | 0.5+ CPU |
| RAM | 512 MB | 1 GB+ |
| Spin Down | 15 min | Sin spin down |

**Conclusión:** Para generación de documentos Word con imágenes, necesitamos al menos **0.5 CPU y 1 GB RAM** sin spin down.

### Top 3 Recomendaciones

| Ranking | Opción | Costo/mes | Por qué |
|---------|--------|-----------|---------|
| 🥇 | **Hetzner + Coolify** | ~€4-7 | Mejor precio/rendimiento, control total |
| 🥈 | **Railway Hobby** | ~$5-10 | Fácil setup, buen balance |
| 🥉 | **DigitalOcean App Platform** | $5-12 | Confiable, buena documentación |

---

## Comparativa Rápida

### Plataformas PaaS (Managed)

| Plataforma | Plan Mínimo | CPU | RAM | Spin Down | Docker | CI/CD |
|------------|-------------|-----|-----|-----------|--------|-------|
| **Render** | Free | 0.1 | 512 MB | ⚠️ 15 min | ✅ | ✅ |
| **Render** | Starter $7 | 0.5 | 512 MB | ❌ | ✅ | ✅ |
| **Railway** | Hobby $5 | Variable | Variable | ❌ | ✅ | ✅ |
| **Fly.io** | ~$5 | 1 shared | 256 MB+ | ⚠️ Config | ✅ | ✅ |
| **DigitalOcean** | Basic $5 | 1 shared | 512 MB | ❌ | ✅ | ✅ |
| **Google Cloud Run** | Pay-per-use | Variable | Variable | ⚠️ Sí | ✅ | ✅ |

### VPS + Self-Hosted (Mejor Precio/Rendimiento)

| Proveedor | Plan | CPU | RAM | Precio | Ubicación |
|-----------|------|-----|-----|--------|-----------|
| **Hetzner** | CX22 | 2 vCPU | 4 GB | €3.79/mes | EU/US |
| **Hetzner** | CAX11 (ARM) | 2 vCPU | 4 GB | €3.79/mes | EU |
| **DigitalOcean** | Droplet | 1 vCPU | 1 GB | $6/mes | Global |
| **Vultr** | Cloud | 1 vCPU | 1 GB | $5/mes | Global |
| **Linode** | Nanode | 1 vCPU | 1 GB | $5/mes | Global |

---

## Análisis Detallado por Plataforma

### 1. Railway

**Sitio:** [railway.com](https://railway.com/pricing)

| Aspecto | Detalle |
|---------|---------|
| **Modelo** | Pago por uso (CPU-segundo, RAM-segundo) |
| **Plan Hobby** | $5/mes incluidos + uso adicional |
| **Free Trial** | $5 crédito único (30 días) |
| **Spin Down** | ❌ No (siempre activo) |
| **Docker** | ✅ Nativo |
| **Límite Gasto** | ✅ Configurable (único en la industria) |

**Pros:**
- Facturación por segundo real de uso
- Sin spin down en plan Hobby
- Límite de gasto configurable
- Excelente DX (Developer Experience)
- Auto-deploy desde GitHub

**Contras:**
- Costos pueden escalar impredeciblemente
- Sin free tier permanente
- Menos regiones que competidores

**Costo Estimado para Print Shop:**
```
~$5-10/mes (uso moderado)
~$15-20/mes (uso intensivo)
```

---

### 2. Fly.io

**Sitio:** [fly.io/pricing](https://fly.io/pricing/)

| Aspecto | Detalle |
|---------|---------|
| **Modelo** | Pago por uso + plan base |
| **Plan Hobby** | $5/mes + recursos |
| **Compute** | ~$1.94/mes (shared 256MB, 24/7) |
| **Storage** | $0.15/GB/mes |
| **Bandwidth** | $0.02/GB (outbound) |

**Pros:**
- Firecracker microVMs (muy eficiente)
- Multi-región fácil
- Buen rendimiento
- Calculadora de precios disponible

**Contras:**
- Ya no tiene free tier para nuevos usuarios
- Configuración más compleja
- Puede tener cold starts si no se configura bien

**Costo Estimado:**
```
~$5-8/mes (instancia pequeña 24/7)
~$12-15/mes (1GB RAM, mejor rendimiento)
```

---

### 3. DigitalOcean App Platform

**Sitio:** [digitalocean.com/pricing/app-platform](https://www.digitalocean.com/pricing/app-platform)

| Aspecto | Detalle |
|---------|---------|
| **Basic** | $5/mes (1 shared CPU, 512 MB) |
| **Professional** | $12/mes (1 dedicated CPU, 1 GB) |
| **Bandwidth** | 100 GB incluido, $0.02/GB extra |
| **Free Tier** | Solo sitios estáticos |

**Pros:**
- Empresa establecida y confiable
- Excelente documentación
- Sin spin down en planes pagos
- Fácil escalado
- Managed databases disponibles

**Contras:**
- Más caro que alternativas
- Menos flexible que VPS

**Costo Estimado:**
```
$5/mes (básico, puede ser lento)
$12/mes (recomendado para producción)
```

---

### 4. Google Cloud Run

**Sitio:** [cloud.google.com/run/pricing](https://cloud.google.com/run/pricing)

| Aspecto | Detalle |
|---------|---------|
| **Modelo** | Pago por uso (100ms mínimo) |
| **Free Tier** | 180,000 vCPU-sec, 360,000 GiB-sec/mes |
| **vCPU** | $0.00002400/vCPU-segundo |
| **RAM** | $0.00000250/GiB-segundo |

**Pros:**
- Free tier generoso
- Escala a cero (no pagas si no usas)
- Infraestructura Google
- GPU disponible para ML

**Contras:**
- Cold starts (escala a cero)
- Curva de aprendizaje
- Costos pueden escalar rápido
- Requiere cuenta GCP

**Costo Estimado:**
```
$0-5/mes (uso bajo, dentro de free tier)
$10-30/mes (uso moderado-alto)
```

---

### 5. Hetzner Cloud + Coolify (⭐ RECOMENDADO)

**Sitios:**
- [hetzner.com/cloud](https://www.hetzner.com/cloud/)
- [coolify.io](https://coolify.io/)

| Plan Hetzner | CPU | RAM | Storage | Precio |
|--------------|-----|-----|---------|--------|
| **CX22** | 2 vCPU Intel | 4 GB | 40 GB NVMe | €3.79/mes |
| **CAX11** | 2 vCPU ARM | 4 GB | 40 GB NVMe | €3.79/mes |
| **CX32** | 4 vCPU | 8 GB | 80 GB NVMe | €7.59/mes |

**Coolify:** Panel de control self-hosted (gratuito) que te da experiencia tipo Vercel/Heroku.

**Pros:**
- **Mejor precio/rendimiento del mercado**
- 2 vCPU + 4 GB RAM por €3.79 (imbatible)
- Sin spin down
- Control total del servidor
- Coolify hace el deployment fácil
- SSL automático con Let's Encrypt
- 20 TB de tráfico incluido

**Contras:**
- Requiere setup inicial (~30 min)
- Tú manejas el servidor (updates, seguridad)
- Datacenter principal en Europa (hay US también)

**Setup Básico:**
```bash
# 1. Crear servidor Hetzner (CX22 o CAX11)
# 2. Instalar Coolify
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
# 3. Acceder al panel web y conectar GitHub
# 4. Deploy con un click
```

**Costo Total:**
```
€3.79/mes (~$4.10 USD) - Servidor completo
€0/mes - Coolify (self-hosted gratis)
─────────────────────────────
~$4-5/mes TOTAL
```

---

### 6. Render (Planes Pagos)

**Sitio:** [render.com](https://render.com/pricing)

| Plan | CPU | RAM | Precio | Spin Down |
|------|-----|-----|--------|-----------|
| **Free** | 0.1 | 512 MB | $0 | ⚠️ 15 min |
| **Starter** | 0.5 | 512 MB | $7/mes | ❌ |
| **Standard** | 1 | 2 GB | $25/mes | ❌ |

**Análisis:**
- Starter ($7) elimina spin down pero sigue con recursos limitados
- Para tu caso, mejor ir a alternativas más económicas con más recursos

---

## Comparativa de Costos Mensual

### Para recursos equivalentes (~1 vCPU, 1 GB RAM, sin spin down)

| Plataforma | Costo Estimado | Recursos | Notas |
|------------|----------------|----------|-------|
| **Hetzner + Coolify** | ~$4 | 2 vCPU, 4 GB | ⭐ Mejor valor |
| **Railway** | ~$7-10 | Variable | Fácil setup |
| **Vultr/Linode** | ~$5-6 | 1 vCPU, 1 GB | VPS básico |
| **DigitalOcean App** | $5-12 | 1 CPU, 512MB-1GB | Managed |
| **Fly.io** | ~$7-10 | 1 shared, 1 GB | microVMs |
| **Render Starter** | $7 | 0.5 CPU, 512 MB | Limitado |
| **Cloud Run** | ~$5-15 | Variable | Pay-per-use |

---

## Recomendaciones por Caso de Uso

### 🎯 Uso Personal / Side Project
**Recomendación:** Hetzner CX22 + Coolify
- **Costo:** ~$4/mes
- **Por qué:** Máximos recursos por mínimo precio

### 🚀 Startup / MVP
**Recomendación:** Railway Hobby
- **Costo:** ~$5-15/mes
- **Por qué:** Balance entre facilidad y costo

### 🏢 Producción / Empresa
**Recomendación:** DigitalOcean App Platform o Hetzner + Coolify
- **Costo:** $12-25/mes
- **Por qué:** Confiabilidad y soporte

### 💰 Presupuesto Mínimo Absoluto
**Recomendación:** Hetzner CAX11 (ARM) + Coolify
- **Costo:** €3.79/mes (~$4)
- **Por qué:** 2 vCPU + 4 GB RAM imbatible

---

## Conclusión Final

### Para Print Shop Generator específicamente:

| Criterio | Ganador |
|----------|---------|
| **Mejor Precio** | Hetzner + Coolify (~$4/mes) |
| **Más Fácil** | Railway ($5-10/mes) |
| **Más Confiable** | DigitalOcean ($12/mes) |
| **Más Flexible** | Google Cloud Run (variable) |

### Mi Recomendación Principal: **Hetzner + Coolify**

**Por qué:**
1. **4x más recursos** que Render Free por ~$4/mes
2. **Sin spin down** - siempre disponible
3. **Coolify** hace el deployment tan fácil como Vercel
4. **20 TB tráfico** incluido
5. **Control total** del servidor

**Pasos para migrar:**
1. Crear cuenta en Hetzner Cloud
2. Crear servidor CX22 (€3.79/mes)
3. Instalar Coolify (1 comando)
4. Conectar GitHub
5. Deploy automático

---

## Enlaces y Referencias

### Plataformas PaaS
- [Railway Pricing](https://railway.com/pricing)
- [Fly.io Pricing](https://fly.io/pricing/)
- [DigitalOcean App Platform](https://www.digitalocean.com/pricing/app-platform)
- [Google Cloud Run Pricing](https://cloud.google.com/run/pricing)
- [Render Pricing](https://render.com/pricing)

### VPS Providers
- [Hetzner Cloud](https://www.hetzner.com/cloud/)
- [Vultr](https://www.vultr.com/pricing/)
- [Linode](https://www.linode.com/pricing/)
- [DigitalOcean Droplets](https://www.digitalocean.com/pricing/droplets)

### Self-Hosted Tools
- [Coolify](https://coolify.io/) - PaaS self-hosted gratuito
- [Dokploy](https://dokploy.com/) - Alternativa a Coolify
- [CapRover](https://caprover.com/) - Otra opción self-hosted

### Calculadoras de Precios
- [Fly.io Calculator](https://fly.io/calculator)
- [Hetzner Pricing](https://www.hetzner.com/cloud/)
- [Cloud Run Pricing Calculator](https://cloud.google.com/products/calculator)
