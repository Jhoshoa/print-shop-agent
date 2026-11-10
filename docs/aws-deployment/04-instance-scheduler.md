# 04 - Instance Scheduler

Este documento cubre como configurar el encendido y apagado automatico de la instancia EC2 usando EventBridge y Lambda.

**Tiempo estimado:** 20-30 minutos

**Documento anterior:** [03a](03a-deployment-sin-docker.md) o [03b](03b-deployment-con-docker.md)

**Siguiente documento:** [05 - Dominio y HTTPS](05-dominio-https.md) (Opcional)

---

## Por que Programar la Instancia?

| Escenario | Horas/mes | Costo EC2 |
|-----------|-----------|-----------|
| 24/7 | 730 | $12.26 |
| **L-V 4.5h/dia** | 97.5 | **$1.64** |
| **Ahorro** | -87% | **$10.62** |

---

## Horario Objetivo

| Parametro | Valor |
|-----------|-------|
| Dias | Lunes a Viernes |
| Encender | 11:25 AM (hora Bolivia) |
| Apagar | 4:05 PM (hora Bolivia) |
| Zona horaria | UTC-4 (Bolivia) |

**En UTC:**
- Encender: 15:25 UTC
- Apagar: 20:05 UTC

---

## Tabla de Contenidos

1. [Crear Rol IAM para Lambda](#1-crear-rol-iam-para-lambda)
2. [Obtener Instance ID](#2-obtener-instance-id)
3. [Crear Lambda para Encender](#3-crear-lambda-para-encender)
4. [Crear Lambda para Apagar](#4-crear-lambda-para-apagar)
5. [Crear Schedule en EventBridge](#5-crear-schedule-en-eventbridge)
6. [Probar el Scheduler](#6-probar-el-scheduler)

---

## 1. Crear Rol IAM para Lambda

### Paso 1.1: Ir a IAM

1. En la consola de AWS, busca **"IAM"**
2. Haz clic en **"IAM"**

### Paso 1.2: Crear rol

1. En el menu izquierdo, haz clic en **"Roles"**
2. Haz clic en **"Create role"**

### Paso 1.3: Configurar rol

| Campo | Valor |
|-------|-------|
| Trusted entity type | AWS service |
| Service | Lambda |

Haz clic en **"Next"**

### Paso 1.4: Agregar permisos

Busca y selecciona:

- `AmazonEC2FullAccess`

Haz clic en **"Next"**

### Paso 1.5: Nombrar y crear

| Campo | Valor |
|-------|-------|
| Role name | `lambda-ec2-scheduler-role` |
| Description | Role for Lambda to start/stop EC2 instances |

Haz clic en **"Create role"**

---

## 2. Obtener Instance ID

1. Ve a **EC2** > **Instances**
2. Selecciona tu instancia `print-shop-server`
3. Copia el **Instance ID** (ejemplo: `i-0abc123def456789`)

**Guarda este ID**, lo necesitaras para las funciones Lambda.

---

## 3. Crear Lambda para Encender

### Paso 3.1: Ir a Lambda

1. En la consola de AWS, busca **"Lambda"**
2. Haz clic en **"Lambda"**

### Paso 3.2: Crear funcion

1. Haz clic en **"Create function"**

| Campo | Valor |
|-------|-------|
| Function name | `start-print-shop-instance` |
| Runtime | Python 3.12 |
| Architecture | arm64 |

### Paso 3.3: Configurar permisos

1. Expande **"Change default execution role"**
2. Selecciona **"Use an existing role"**
3. Selecciona `lambda-ec2-scheduler-role`

Haz clic en **"Create function"**

### Paso 3.4: Agregar codigo

En el editor de codigo, reemplaza todo el contenido con:

```python
import boto3

def lambda_handler(event, context):
    # ============================================
    # CONFIGURACION - MODIFICA ESTOS VALORES
    # ============================================
    REGION = 'us-east-1'  # Cambia a tu region
    INSTANCE_ID = 'i-0abc123def456789'  # Cambia a tu Instance ID
    # ============================================

    ec2 = boto3.client('ec2', region_name=REGION)

    try:
        response = ec2.start_instances(InstanceIds=[INSTANCE_ID])
        state = response['StartingInstances'][0]['CurrentState']['Name']
        print(f'Instance {INSTANCE_ID} is now: {state}')

        return {
            'statusCode': 200,
            'body': f'Started instance {INSTANCE_ID}. State: {state}'
        }
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'body': f'Error: {str(e)}'
        }
```

**IMPORTANTE:** Cambia estos valores:
- `REGION`: Tu region de AWS (ej: `us-east-1`, `sa-east-1`)
- `INSTANCE_ID`: El ID de tu instancia EC2

### Paso 3.5: Guardar

Haz clic en **"Deploy"**

---

## 4. Crear Lambda para Apagar

### Paso 4.1: Crear funcion

1. Haz clic en **"Create function"**

| Campo | Valor |
|-------|-------|
| Function name | `stop-print-shop-instance` |
| Runtime | Python 3.12 |
| Architecture | arm64 |
| Execution role | Use existing: `lambda-ec2-scheduler-role` |

Haz clic en **"Create function"**

### Paso 4.2: Agregar codigo

```python
import boto3

def lambda_handler(event, context):
    # ============================================
    # CONFIGURACION - MODIFICA ESTOS VALORES
    # ============================================
    REGION = 'us-east-1'  # Cambia a tu region
    INSTANCE_ID = 'i-0abc123def456789'  # Cambia a tu Instance ID
    # ============================================

    ec2 = boto3.client('ec2', region_name=REGION)

    try:
        response = ec2.stop_instances(InstanceIds=[INSTANCE_ID])
        state = response['StoppingInstances'][0]['CurrentState']['Name']
        print(f'Instance {INSTANCE_ID} is now: {state}')

        return {
            'statusCode': 200,
            'body': f'Stopped instance {INSTANCE_ID}. State: {state}'
        }
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'body': f'Error: {str(e)}'
        }
```

Haz clic en **"Deploy"**

---

## 5. Crear Schedule en EventBridge

### Paso 5.1: Ir a EventBridge

1. En la consola de AWS, busca **"EventBridge"**
2. Haz clic en **"Amazon EventBridge"**

### Paso 5.2: Ir a Schedules

1. En el menu izquierdo, haz clic en **"Schedules"**
2. Haz clic en **"Create schedule"**

---

### Schedule para ENCENDER

| Campo | Valor |
|-------|-------|
| Schedule name | `start-print-shop-daily` |
| Description | Start Print Shop EC2 at 11:25 AM Bolivia |
| Schedule group | default |

**Schedule pattern:**

1. Selecciona **"Recurring schedule"**
2. **Schedule type**: Cron-based schedule
3. **Cron expression**: `25 15 ? * MON-FRI *`

**Explicacion del cron:**

| Campo | Valor | Significado |
|-------|-------|-------------|
| Minuto | 25 | Minuto 25 |
| Hora | 15 | 15:00 UTC = 11:00 Bolivia |
| Dia del mes | ? | Cualquiera |
| Mes | * | Cualquier mes |
| Dia de semana | MON-FRI | Lunes a Viernes |
| Ano | * | Cualquier ano |

4. **Timezone**: UTC
5. **Flexible time window**: Off

**Target:**

1. Selecciona **"AWS Lambda"**
2. **Lambda function**: `start-print-shop-instance`

**Settings:**

1. Haz clic en **"Next"**
2. Revisa y haz clic en **"Create schedule"**

---

### Schedule para APAGAR

1. Haz clic en **"Create schedule"**

| Campo | Valor |
|-------|-------|
| Schedule name | `stop-print-shop-daily` |
| Description | Stop Print Shop EC2 at 4:05 PM Bolivia |

**Schedule pattern:**

- **Cron expression**: `5 20 ? * MON-FRI *`

  (20:05 UTC = 16:05 Bolivia)

**Target:**

- **Lambda function**: `stop-print-shop-instance`

Haz clic en **"Create schedule"**

---

## 6. Probar el Scheduler

### Probar Lambda manualmente

1. Ve a **Lambda** > `start-print-shop-instance`
2. Haz clic en **"Test"**
3. Crea un evento de prueba:
   - Event name: `test`
   - Event JSON: `{}`
4. Haz clic en **"Test"**

Deberia mostrar:
```
"Started instance i-xxxxx. State: pending"
```

5. Ve a **EC2** y verifica que la instancia esta iniciando

6. Repite con `stop-print-shop-instance`

### Verificar schedules

1. Ve a **EventBridge** > **Schedules**
2. Verifica que ambos schedules estan en estado **Enabled**

### Ver logs

1. Ve a **CloudWatch** > **Log groups**
2. Busca `/aws/lambda/start-print-shop-instance`
3. Haz clic para ver los logs de ejecucion

---

## Ajustar Zona Horaria

Si tu zona horaria es diferente a Bolivia (UTC-4):

| Zona Horaria | UTC Offset | 11:25 AM local = |
|--------------|------------|------------------|
| Bolivia | UTC-4 | 15:25 UTC |
| Peru/Colombia | UTC-5 | 16:25 UTC |
| Argentina | UTC-3 | 14:25 UTC |
| Mexico Central | UTC-6 | 17:25 UTC |

Ajusta los cron expressions segun tu zona horaria.

---

## Resumen de Configuracion

| Schedule | Cron (UTC) | Lambda | Hora Bolivia |
|----------|------------|--------|--------------|
| start-print-shop-daily | `25 15 ? * MON-FRI *` | start-print-shop-instance | 11:25 AM |
| stop-print-shop-daily | `5 20 ? * MON-FRI *` | stop-print-shop-instance | 4:05 PM |

---

## Problemas Comunes

### Lambda falla con "Access Denied"

1. Verifica que el rol `lambda-ec2-scheduler-role` tiene `AmazonEC2FullAccess`
2. Verifica que la region es correcta en el codigo

### Schedule no se ejecuta

1. Verifica que el schedule esta **Enabled**
2. Verifica que la expresion cron es correcta
3. Revisa los logs en CloudWatch

### Instancia no inicia

1. Ve a EC2 y verifica el estado de la instancia
2. Revisa los logs de Lambda en CloudWatch
3. Verifica que el Instance ID es correcto

---

## Checklist de Verificacion

- [ ] Rol IAM `lambda-ec2-scheduler-role` creado
- [ ] Lambda `start-print-shop-instance` creada y probada
- [ ] Lambda `stop-print-shop-instance` creada y probada
- [ ] Schedule `start-print-shop-daily` creado y habilitado
- [ ] Schedule `stop-print-shop-daily` creado y habilitado
- [ ] Probado manualmente que las Lambdas funcionan

---

## Siguiente Paso (Opcional)

Si deseas configurar un dominio personalizado o HTTPS:

Continua con: **[05 - Dominio y HTTPS](05-dominio-https.md)**

De lo contrario, tu deployment esta completo. Revisa:

**[06 - Mantenimiento](06-mantenimiento.md)** para comandos utiles y troubleshooting.
