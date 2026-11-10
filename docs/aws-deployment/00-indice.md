# Guia de Deployment en AWS EC2

## Print Shop Generator - Documentacion de Deployment

Esta carpeta contiene la documentacion completa para desplegar Print Shop Generator en AWS EC2 t4g.small.

---

## Estructura de Documentos

Sigue los documentos en orden numerico:

| # | Documento | Descripcion | Tiempo Est. |
|---|-----------|-------------|-------------|
| 01 | [Configuracion Inicial AWS](01-configuracion-inicial-aws.md) | Cuenta, IAM, Budget, Security Groups | 30-45 min |
| 02 | [Lanzar Instancia EC2](02-lanzar-instancia-ec2.md) | Crear y conectarse a EC2 | 15-20 min |
| 03a | [Deployment SIN Docker](03a-deployment-sin-docker.md) | **Recomendado** - Python directo | 20-30 min |
| 03b | [Deployment CON Docker](03b-deployment-con-docker.md) | Alternativa con contenedores | 20-30 min |
| 04 | [Instance Scheduler](04-instance-scheduler.md) | Encendido/apagado automatico | 20-30 min |
| 05 | [Dominio y HTTPS](05-dominio-https.md) | DNS, Route 53, SSL (opcional) | 30-45 min |
| 06 | [Mantenimiento](06-mantenimiento.md) | Monitoreo, comandos, troubleshooting | Referencia |

---

## Cual Opcion de Deployment Elegir?

### OPCION A: Sin Docker (Recomendado)

```
Python 3.12 + uvicorn + systemd
```

**Ventajas:**
- Menor uso de RAM (~200-400 MB)
- Inicio mas rapido (~5 segundos)
- Depuracion mas simple
- Menos capas de abstraccion

**Ideal para:**
- Este proyecto especifico
- Instancias pequenas (t4g.small)
- Deployments simples

### OPCION B: Con Docker

```
Docker + docker-compose
```

**Ventajas:**
- Ambiente aislado
- Reproducible en cualquier servidor
- Facil rollback de versiones

**Ideal para:**
- Proyectos con multiples servicios
- Equipos que ya usan Docker
- CI/CD con imagenes Docker

---

## Resumen de Costos

| Componente | Costo/mes |
|------------|-----------|
| EC2 t4g.small (97.5 horas) | $1.64 |
| EBS gp3 (10 GB) | $0.80 |
| Lambda + EventBridge | $0.00 |
| **TOTAL** | **~$2.50/mes** |

Con dominio personalizado: ~$3.00/mes

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        INTERNET                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Security Group (SSH:22, HTTP:80, HTTPS:443)                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  EC2 t4g.small (2 vCPU, 2 GB RAM, ARM64)                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Print Shop Generator (FastAPI + Frontend)          │    │
│  │  Puerto 80                                          │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  EBS Volume (10 GB gp3)                             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Instance Scheduler (EventBridge + Lambda)                   │
│  Encender: L-V 11:25 AM | Apagar: L-V 4:05 PM              │
└─────────────────────────────────────────────────────────────┘
```

---

## Checklist Rapido

### Antes de empezar:
- [ ] Tarjeta de credito/debito
- [ ] Correo electronico
- [ ] Telefono para verificacion

### Configuracion AWS (Doc 01):
- [ ] Cuenta AWS creada
- [ ] Presupuesto $5 configurado
- [ ] Usuario IAM creado
- [ ] MFA activado en Root
- [ ] Security Group creado
- [ ] Key Pair creado y guardado

### EC2 (Doc 02):
- [ ] Instancia lanzada
- [ ] Conexion SSH funcionando

### Deployment (Doc 03a o 03b):
- [ ] Aplicacion instalada
- [ ] Servicio systemd activo
- [ ] Acceso web funcionando

### Scheduler (Doc 04):
- [ ] Lambda START creada
- [ ] Lambda STOP creada
- [ ] EventBridge configurado
- [ ] Probado manualmente

### Opcional (Doc 05):
- [ ] Dominio configurado
- [ ] DNS dinamico funcionando
- [ ] HTTPS con certificado SSL
