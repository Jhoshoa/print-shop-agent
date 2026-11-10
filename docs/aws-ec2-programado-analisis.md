# AWS EC2 con Horario Programado - Análisis de Costos

Este documento analiza el costo de ejecutar una instancia AWS EC2 t4g solo durante horario laboral específico.

## Escenario

| Parámetro | Valor |
|-----------|-------|
| **Días** | Lunes a Viernes |
| **Horario** | 11:30 AM - 4:00 PM |
| **Horas/día** | 4.5 horas |
| **Horas/semana** | 22.5 horas |
| **Horas/mes** | ~97.5 horas |

---

## Cálculo de Costos

### Instancias T4g (ARM - Graviton2)

Las instancias T4g ofrecen el mejor precio/rendimiento para cargas de trabajo generales.

| Instancia | vCPU | RAM | $/hora | Horas/mes | Compute | Storage 10GB | **Total/mes** |
|-----------|------|-----|--------|-----------|---------|--------------|---------------|
| **t4g.micro** | 2 | 1 GB | $0.0084 | 97.5 | $0.82 | $0.80 | **$1.62** |
| **t4g.small** | 2 | 2 GB | $0.0168 | 97.5 | $1.64 | $0.80 | **$2.44** |
| **t4g.medium** | 2 | 4 GB | $0.0336 | 97.5 | $3.28 | $0.80 | **$4.08** |
| **t4g.large** | 2 | 8 GB | $0.0672 | 97.5 | $6.55 | $0.80 | **$7.35** |

### Instancias T3 (Intel/AMD x86)

Si necesitas compatibilidad x86 en lugar de ARM:

| Instancia | vCPU | RAM | $/hora | Horas/mes | Compute | Storage 10GB | **Total/mes** |
|-----------|------|-----|--------|-----------|---------|--------------|---------------|
| **t3.micro** | 2 | 1 GB | $0.0104 | 97.5 | $1.01 | $0.80 | **$1.81** |
| **t3.small** | 2 | 2 GB | $0.0208 | 97.5 | $2.03 | $0.80 | **$2.83** |
| **t3.medium** | 2 | 4 GB | $0.0416 | 97.5 | $4.06 | $0.80 | **$4.86** |

---

## Comparación: Horario Programado vs 24/7

### Ahorro con Horario Programado

| Instancia | 24/7 (730h/mes) | Programado (97.5h) | **Ahorro** |
|-----------|-----------------|--------------------| -----------|
| t4g.micro | $6.13/mes | $1.62/mes | **74%** |
| t4g.small | $12.26/mes | $2.44/mes | **80%** |
| t4g.medium | $24.53/mes | $4.08/mes | **83%** |
| t4g.large | $49.06/mes | $7.35/mes | **85%** |

### Comparación con Otras Plataformas

| Plataforma | Disponibilidad | Recursos | Costo/mes |
|------------|----------------|----------|-----------|
| **AWS EC2 t4g.small (programado)** | L-V 11:30-16:00 | 2 vCPU, 2 GB | **$2.44** |
| **AWS EC2 t4g.small (24/7)** | Siempre | 2 vCPU, 2 GB | $12.26 |
| **Hetzner CX22** | Siempre | 2 vCPU, 4 GB | ~$4.10 |
| **Railway** | Siempre | Variable | $5-10 |
| **Render Starter** | Siempre | 0.5 vCPU, 512 MB | $7 |

---

## Cómo Configurar el Encendido/Apagado Automático

### Opción 1: AWS Instance Scheduler (Oficial)

AWS proporciona una solución gratuita para programar instancias.

**Documentación:** https://aws.amazon.com/solutions/implementations/instance-scheduler-on-aws/

**Configuración:**
```yaml
Periodo:
  nombre: horario-laboral
  inicio: 11:25
  fin: 16:05
  dias: lun,mar,mie,jue,vie
  timezone: America/La_Paz  # Ajustar a tu zona
```

**Ventajas:**
- Solución oficial de AWS
- Soporta múltiples instancias
- Interfaz de configuración
- Logs y monitoreo

---

### Opción 2: Amazon EventBridge + Lambda

Crear funciones Lambda que enciendan/apaguen la instancia con triggers de EventBridge.

#### Paso 1: Crear función Lambda para encender

```python
import boto3

def lambda_handler(event, context):
    ec2 = boto3.client('ec2', region_name='us-east-1')
    instance_id = 'i-xxxxxxxxxxxxxxxxx'  # Tu instance ID

    ec2.start_instances(InstanceIds=[instance_id])
    return f'Started instance: {instance_id}'
```

#### Paso 2: Crear función Lambda para apagar

```python
import boto3

def lambda_handler(event, context):
    ec2 = boto3.client('ec2', region_name='us-east-1')
    instance_id = 'i-xxxxxxxxxxxxxxxxx'  # Tu instance ID

    ec2.stop_instances(InstanceIds=[instance_id])
    return f'Stopped instance: {instance_id}'
```

#### Paso 3: Crear reglas de EventBridge

**Regla para encender (11:25 AM L-V):**
```
Nombre: start-print-shop-instance
Expresión cron: cron(25 15 ? * MON-FRI *)  # UTC - ajustar a tu zona
Target: Lambda función start
```

**Regla para apagar (4:05 PM L-V):**
```
Nombre: stop-print-shop-instance
Expresión cron: cron(5 20 ? * MON-FRI *)   # UTC - ajustar a tu zona
Target: Lambda función stop
```

**Nota sobre zonas horarias:**
- EventBridge usa UTC
- Bolivia (UTC-4): 11:25 local = 15:25 UTC
- Ajusta según tu ubicación

---

### Opción 3: Script con AWS CLI (Simple)

Si tienes un servidor externo (o tu PC) siempre encendido:

#### Scripts Bash

**start-instance.sh:**
```bash
#!/bin/bash
# Encender instancia EC2
INSTANCE_ID="i-xxxxxxxxxxxxxxxxx"
REGION="us-east-1"

aws ec2 start-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION

echo "$(date): Started $INSTANCE_ID" >> /var/log/ec2-scheduler.log
```

**stop-instance.sh:**
```bash
#!/bin/bash
# Apagar instancia EC2
INSTANCE_ID="i-xxxxxxxxxxxxxxxxx"
REGION="us-east-1"

aws ec2 stop-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION

echo "$(date): Stopped $INSTANCE_ID" >> /var/log/ec2-scheduler.log
```

#### Configurar Cron

```bash
# Editar crontab
crontab -e

# Agregar estas líneas (ajustar zona horaria)
25 11 * * 1-5 /path/to/start-instance.sh
5 16 * * 1-5 /path/to/stop-instance.sh
```

---

## Costos Adicionales a Considerar

### Almacenamiento EBS

El disco (EBS) se cobra aunque la instancia esté apagada:

| Tipo | Precio | 10 GB/mes | 20 GB/mes |
|------|--------|-----------|-----------|
| gp3 (SSD) | $0.08/GB | $0.80 | $1.60 |
| gp2 (SSD) | $0.10/GB | $1.00 | $2.00 |

### Elastic IP (Opcional)

Si necesitas IP fija:
- **Gratis** mientras la instancia está corriendo
- **$0.005/hora** cuando está apagada (~$3.60/mes si apagada todo el tiempo)

**Recomendación:** No usar Elastic IP para este caso. Usar DNS dinámico o acceder por IP pública (cambia cada restart).

### Transfer de Datos

- **Entrada:** Gratis
- **Salida:** Primeros 100 GB/mes gratis, luego $0.09/GB

---

## Resumen de Costos Totales

### Configuración Recomendada

| Componente | Especificación | Costo/mes |
|------------|----------------|-----------|
| **EC2 t4g.small** | 2 vCPU, 2 GB RAM (97.5h) | $1.64 |
| **EBS gp3** | 10 GB | $0.80 |
| **Transfer** | < 100 GB | $0.00 |
| **Lambda** | < 1M requests | $0.00 |
| **EventBridge** | Reglas | $0.00 |
| | **TOTAL** | **~$2.50/mes** |

### Comparativa Final

| Opción | Disponibilidad | Recursos | Costo |
|--------|----------------|----------|-------|
| **AWS EC2 Programado** | L-V 11:30-16:00 | 2 vCPU, 2 GB | **$2.50/mes** |
| **Hetzner 24/7** | Siempre | 2 vCPU, 4 GB | $4.10/mes |
| **Render Free** | Siempre (con sleep) | 0.1 vCPU, 512 MB | $0/mes |

---

## Cuándo Elegir Cada Opción

### ✅ AWS EC2 Programado es ideal si:

- Solo necesitas la app en horario específico
- Quieres minimizar costos al máximo
- No te importa esperar ~30-60 seg para que inicie
- Tienes conocimiento básico de AWS

### ✅ Hetzner 24/7 es mejor si:

- Necesitas disponibilidad constante
- Quieres acceso inmediato en cualquier momento
- Prefieres simplicidad (no programar start/stop)
- El costo de ~$4/mes es aceptable

### ✅ Serverless (Cloud Run) es mejor si:

- Uso muy esporádico e impredecible
- Quieres pagar solo por requests reales
- Aceptas cold starts de 30-60 segundos

---

## Referencias

- [AWS EC2 Pricing](https://aws.amazon.com/ec2/pricing/on-demand/)
- [AWS Instance Scheduler](https://aws.amazon.com/solutions/implementations/instance-scheduler-on-aws/)
- [EventBridge Scheduler](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-rule-schedule.html)
- [EC2 T4g Instances](https://aws.amazon.com/ec2/instance-types/t4/)
- [EBS Pricing](https://aws.amazon.com/ebs/pricing/)
