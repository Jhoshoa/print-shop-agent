# Diagramas de Arquitectura AWS

Diagramas PlantUML que ilustran la arquitectura de Print Shop Generator en AWS.

---

## Archivos y Documentos Relacionados

| Diagrama | Descripcion | Documento |
|----------|-------------|-----------|
| `01-arquitectura-general.puml` | Vista general de servicios AWS | [00-indice.md](../aws-deployment/00-indice.md) |
| `02-flujo-red.puml` | Security Groups, requests HTTP | [01-configuracion-inicial-aws.md](../aws-deployment/01-configuracion-inicial-aws.md) |
| `03-instance-scheduler.puml` | EventBridge + Lambda | [04-instance-scheduler.md](../aws-deployment/04-instance-scheduler.md) |
| `04-iam-roles.puml` | Usuarios, roles, politicas | [01-configuracion-inicial-aws.md](../aws-deployment/01-configuracion-inicial-aws.md) |
| `05-dns-dominio.puml` | Route 53, DNS dinamico | [05-dominio-https.md](../aws-deployment/05-dominio-https.md) |
| `06-deployment-sin-docker.puml` | Arquitectura sin Docker | [03a-deployment-sin-docker.md](../aws-deployment/03a-deployment-sin-docker.md) |
| `07-deployment-con-docker.puml` | Arquitectura con Docker | [03b-deployment-con-docker.md](../aws-deployment/03b-deployment-con-docker.md) |
| `08-costos-presupuesto.puml` | AWS Budgets, costos | [06-mantenimiento.md](../aws-deployment/06-mantenimiento.md) |

---

## Como Visualizar los Diagramas

### Opcion 1: PlantUML Online (Mas facil)

1. Ve a [PlantUML Web Server](https://www.plantuml.com/plantuml/uml/)
2. Copia el contenido de cualquier archivo `.puml`
3. Pega en el editor
4. El diagrama se renderiza automaticamente

### Opcion 2: VS Code

1. Instala la extension **"PlantUML"**
2. Abre cualquier archivo `.puml`
3. Presiona `Alt+D` para ver el preview

### Opcion 3: Generar imagenes

```bash
# Instalar PlantUML (requiere Java)
# Windows (con Chocolatey)
choco install plantuml

# Mac
brew install plantuml

# Generar PNG
plantuml -tpng *.puml

# Generar SVG (mejor calidad)
plantuml -tsvg *.puml
```

### Opcion 4: Docker

```bash
docker run --rm -v $(pwd):/data plantuml/plantuml -tpng /data/*.puml
```

---

## Arquitectura de Referencia Rapida

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
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Instance Scheduler (EventBridge + Lambda)                   │
│  Encender: L-V 11:25 AM | Apagar: L-V 4:05 PM              │
└─────────────────────────────────────────────────────────────┘
```

---

## Servicios AWS Utilizados

| Servicio | Proposito | Costo/mes |
|----------|-----------|-----------|
| **EC2** | Servidor de aplicacion | ~$1.64 |
| **EBS** | Almacenamiento | ~$0.80 |
| **Lambda** | Funciones scheduler | $0.00 |
| **EventBridge** | Triggers programados | $0.00 |
| **IAM** | Usuarios y permisos | $0.00 |
| **VPC** | Red virtual | $0.00 |
| **Security Groups** | Firewall | $0.00 |
| **Route 53** | DNS (opcional) | ~$0.50 |
| **TOTAL** | | **~$2.50-3.00** |

---

## Documentacion Completa

Ver carpeta: [`../aws-deployment/`](../aws-deployment/)

| Documento | Descripcion |
|-----------|-------------|
| [00-indice.md](../aws-deployment/00-indice.md) | Guia de navegacion |
| [01-configuracion-inicial-aws.md](../aws-deployment/01-configuracion-inicial-aws.md) | Cuenta, IAM, Security Groups |
| [02-lanzar-instancia-ec2.md](../aws-deployment/02-lanzar-instancia-ec2.md) | Crear instancia EC2 |
| [03a-deployment-sin-docker.md](../aws-deployment/03a-deployment-sin-docker.md) | Deployment sin Docker |
| [03b-deployment-con-docker.md](../aws-deployment/03b-deployment-con-docker.md) | Deployment con Docker |
| [04-instance-scheduler.md](../aws-deployment/04-instance-scheduler.md) | Encendido/apagado automatico |
| [05-dominio-https.md](../aws-deployment/05-dominio-https.md) | DNS y HTTPS |
| [06-mantenimiento.md](../aws-deployment/06-mantenimiento.md) | Comandos y troubleshooting |
