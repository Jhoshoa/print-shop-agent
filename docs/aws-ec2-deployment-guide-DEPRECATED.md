# Guia Completa de Deployment en AWS EC2 t4g.small

## Print Shop Generator - Deployment Profesional en AWS

Este documento proporciona instrucciones paso a paso para desplegar Print Shop Generator en AWS EC2 con todas las mejores practicas de seguridad, costos y disponibilidad.

---

## Tabla de Contenidos

1. [Resumen del Proyecto](#1-resumen-del-proyecto)
2. [Requisitos Previos](#2-requisitos-previos)
3. [Crear Cuenta AWS](#3-crear-cuenta-aws)
4. [Configurar Presupuesto de $5 USD](#4-configurar-presupuesto-de-5-usd)
5. [Configurar IAM (Usuarios y Permisos)](#5-configurar-iam-usuarios-y-permisos)
6. [Crear Security Groups](#6-crear-security-groups)
7. [Crear Key Pair para SSH](#7-crear-key-pair-para-ssh)
8. [Lanzar Instancia EC2 t4g.small](#8-lanzar-instancia-ec2-t4gsmall)
9. [Conectarse a la Instancia](#9-conectarse-a-la-instancia)
10. [OPCION A: Desplegar SIN Docker (Recomendado)](#10-opcion-a-desplegar-sin-docker-recomendado)
11. [OPCION B: Desplegar CON Docker](#11-opcion-b-desplegar-con-docker)
12. [Configurar AWS Instance Scheduler](#12-configurar-aws-instance-scheduler)
13. [Acceso a la Aplicacion (URL)](#13-acceso-a-la-aplicacion-url)
14. [Configurar Dominio Personalizado](#14-configurar-dominio-personalizado)
15. [Configurar HTTPS con Certificado SSL](#15-configurar-https-con-certificado-ssl)
16. [Monitoreo y Mantenimiento](#16-monitoreo-y-mantenimiento)
17. [Resumen de Costos](#17-resumen-de-costos)
18. [Troubleshooting](#18-troubleshooting)

---

## 1. Resumen del Proyecto

### Que es Print Shop Generator?

Es una aplicacion web que convierte multiples imagenes en documentos Word (.docx) formateados para talleres de impresion. Consiste en:

- **Backend**: Python 3.12 con FastAPI
- **Frontend**: Vanilla JavaScript ES6
- **Puerto**: 80 en produccion
- **Deployment**: Sin Docker (recomendado) o con Docker (opcional)

### Arquitectura en AWS

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Security Group                                │
│                 (Puerto 80 HTTP, 22 SSH)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EC2 t4g.small                                 │
│                   (2 vCPU, 2 GB RAM)                            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │    OPCION A: Sin Docker (Recomendado)                   │    │
│  │    Python 3.12 + uvicorn + systemd                      │    │
│  │    Puerto 80 directo                                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                         - O -                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │    OPCION B: Con Docker                                 │    │
│  │    Docker + docker-compose                              │    │
│  │    Puerto 80 -> 8000                                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    EBS Volume                              │  │
│  │                    10 GB gp3                               │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Instance Scheduler (EventBridge + Lambda)           │
│                                                                  │
│    Encender: Lunes-Viernes 11:25 AM                             │
│    Apagar:   Lunes-Viernes 4:05 PM                              │
└─────────────────────────────────────────────────────────────────┘
```

### Costos Estimados

| Componente | Especificacion | Costo/mes |
|------------|----------------|-----------|
| EC2 t4g.small | 97.5 horas/mes | $1.64 |
| EBS gp3 | 10 GB | $0.80 |
| Transfer | < 100 GB | $0.00 |
| Lambda | < 1M requests | $0.00 |
| **TOTAL** | | **~$2.50/mes** |

### Diferencias Clave: Sin Docker vs Con Docker

| Aspecto | OPCION A: Sin Docker | OPCION B: Con Docker |
|---------|----------------------|----------------------|
| **Uso de RAM** | ~200-400 MB | ~400-600 MB |
| **Tiempo de inicio** | ~5 segundos | ~15-30 segundos |
| **Complejidad** | Simple | Media |
| **Depuracion** | `journalctl -u print-shop` | `docker-compose logs` |
| **Actualizacion** | `git pull && systemctl restart` | `docker-compose build && up` |
| **Archivo .env** | En `backend/.env` | No necesario (usa docker-compose.yml) |
| **OUTPUT_DIR** | `./output` (relativo) | `/app/backend/output` (absoluto) |
| **Puerto** | 80 directo | 8000 interno, 80 externo |
| **Aislamiento** | Comparte sistema | Contenedor aislado |

**Recomendacion**: Usa OPCION A (sin Docker) para este proyecto. Es mas simple, usa menos recursos y es mas facil de depurar.

---

## 2. Requisitos Previos

Antes de comenzar, necesitas tener lo siguiente:

### En tu computadora local:

1. **Navegador web** (Chrome, Firefox, Edge)
2. **Cliente SSH** - Ya incluido en Windows 10/11, Mac y Linux
3. **Git** - Para clonar el repositorio (opcional si subes manualmente)

### Verificar que tienes SSH disponible:

Abre una terminal (PowerShell en Windows, Terminal en Mac/Linux) y ejecuta:

```bash
ssh -V
```

Deberia mostrar algo como: `OpenSSH_for_Windows_8.1p1` o similar.

### Informacion necesaria:

- **Tarjeta de credito/debito** - AWS requiere una para crear la cuenta (no te cobraran inmediatamente)
- **Correo electronico** - Para la cuenta de AWS
- **Numero de telefono** - Para verificacion

---

## 3. Crear Cuenta AWS

### Paso 3.1: Ir al sitio web de AWS

1. Abre tu navegador y ve a: **https://aws.amazon.com**
2. Haz clic en el boton **"Create an AWS Account"** (esquina superior derecha)

### Paso 3.2: Informacion de la cuenta

1. **Email address**: Tu correo electronico
2. **AWS account name**: Un nombre para tu cuenta (ejemplo: `mi-cuenta-aws` o `print-shop-production`)
3. Haz clic en **"Verify email address"**
4. Revisa tu correo y copia el codigo de verificacion
5. Ingresa el codigo en AWS

### Paso 3.3: Crear contrasena

1. Crea una contrasena segura (minimo 8 caracteres, mayusculas, minusculas, numeros)
2. Haz clic en **"Continue"**

### Paso 3.4: Informacion de contacto

1. Selecciona **"Personal"** (para uso personal) o **"Business"** (para empresa)
2. Completa todos los campos:
   - Full name (nombre completo)
   - Phone number (numero de telefono con codigo de pais)
   - Country (pais)
   - Address (direccion)
   - City (ciudad)
   - State/Province (estado/provincia)
   - Postal code (codigo postal)
3. Acepta los terminos y haz clic en **"Continue"**

### Paso 3.5: Informacion de pago

1. Ingresa los datos de tu tarjeta de credito/debito:
   - Numero de tarjeta
   - Fecha de expiracion
   - Nombre del titular
   - CVV
2. Direccion de facturacion (puede ser la misma)
3. Haz clic en **"Verify and Continue"**

**Nota importante**: AWS puede hacer un cargo temporal de $1 USD para verificar la tarjeta. Este cargo se revierte automaticamente.

### Paso 3.6: Verificacion de identidad

1. Selecciona tu pais
2. Ingresa tu numero de telefono
3. Ingresa el codigo captcha
4. Haz clic en **"Send SMS"** o **"Call me now"**
5. Ingresa el codigo de verificacion recibido

### Paso 3.7: Seleccionar plan de soporte

1. Selecciona **"Basic support - Free"** (soporte basico gratuito)
2. Haz clic en **"Complete sign up"**

### Paso 3.8: Esperar activacion

1. La cuenta puede tardar unos minutos en activarse
2. Recibiras un correo cuando este lista
3. Una vez activada, haz clic en **"Go to the AWS Management Console"**

### Paso 3.9: Iniciar sesion como Root User

1. Selecciona **"Root user"**
2. Ingresa tu correo electronico
3. Ingresa tu contrasena
4. Ya estas dentro de la consola de AWS!

---

## 4. Configurar Presupuesto de $5 USD

**IMPORTANTE**: Este paso es CRITICO para evitar cargos inesperados. AWS te enviara alertas cuando te acerques al limite.

### Paso 4.1: Acceder a AWS Budgets

1. En la consola de AWS, haz clic en la barra de busqueda superior
2. Escribe **"Budgets"**
3. Haz clic en **"AWS Budgets"** en los resultados

### Paso 4.2: Crear un presupuesto

1. Haz clic en **"Create a budget"**
2. Selecciona **"Customize (advanced)"**
3. Selecciona **"Cost budget - Recommended"**
4. Haz clic en **"Next"**

### Paso 4.3: Configurar detalles del presupuesto

1. **Budget name**: `print-shop-monthly-budget`
2. **Period**: Monthly (mensual)
3. **Budget renewal type**: Recurring budget (presupuesto recurrente)
4. **Start month**: El mes actual
5. **Budgeting method**: Fixed (fijo)
6. **Enter your budgeted amount**: `5.00` (USD)
7. **Budget scope**: All AWS services
8. Haz clic en **"Next"**

### Paso 4.4: Configurar alertas

Vamos a crear 3 alertas a diferentes niveles:

#### Alerta 1: 50% del presupuesto ($2.50)

1. Haz clic en **"Add an alert threshold"**
2. **Threshold**: `50` %
3. **Trigger**: Actual (costos reales)
4. **Email recipients**: Tu correo electronico
5. Haz clic en **"Add email recipients"** y agrega tu correo

#### Alerta 2: 80% del presupuesto ($4.00)

1. Haz clic en **"Add an alert threshold"**
2. **Threshold**: `80` %
3. **Trigger**: Actual
4. **Email recipients**: Tu correo electronico

#### Alerta 3: 100% del presupuesto ($5.00)

1. Haz clic en **"Add an alert threshold"**
2. **Threshold**: `100` %
3. **Trigger**: Actual
4. **Email recipients**: Tu correo electronico

### Paso 4.5: Configurar acciones automaticas (Opcional pero recomendado)

Para mayor proteccion, puedes configurar que AWS detenga recursos automaticamente:

1. En la alerta del 100%, haz clic en **"Add action"**
2. **Action type**: Apply IAM policy
3. Esto requiere configuracion adicional de IAM (lo veremos mas adelante)

Por ahora, solo las alertas por correo son suficientes.

### Paso 4.6: Revisar y crear

1. Haz clic en **"Next"**
2. Revisa la configuracion
3. Haz clic en **"Create budget"**

Ahora recibiras correos cuando:
- Gastes $2.50 (50%)
- Gastes $4.00 (80%)
- Gastes $5.00 (100%)

---

## 5. Configurar IAM (Usuarios y Permisos)

### Que es IAM?

IAM (Identity and Access Management) es el servicio de AWS para gestionar:
- **Usuarios**: Personas que acceden a AWS
- **Roles**: Permisos que se asignan a servicios de AWS
- **Politicas**: Conjuntos de permisos especificos

### Por que es importante?

Por seguridad, **NUNCA** debes usar la cuenta Root para tareas diarias. Debes crear un usuario IAM con los permisos necesarios.

### Paso 5.1: Acceder a IAM

1. En la consola de AWS, busca **"IAM"**
2. Haz clic en **"IAM"**

### Paso 5.2: Activar MFA para Root (Muy Importante)

1. En el dashboard de IAM, busca **"Add MFA for root user"**
2. Haz clic en **"Add MFA"**
3. Selecciona **"Authenticator app"**
4. Haz clic en **"Next"**
5. Instala una app de autenticacion en tu telefono:
   - **Google Authenticator** (iOS/Android)
   - **Microsoft Authenticator** (iOS/Android)
   - **Authy** (iOS/Android)
6. En la app, escanea el codigo QR que muestra AWS
7. Ingresa 2 codigos consecutivos de la app
8. Haz clic en **"Add MFA"**

### Paso 5.3: Crear usuario IAM para administracion

1. En el menu izquierdo, haz clic en **"Users"**
2. Haz clic en **"Create user"**

### Paso 5.4: Configurar usuario

1. **User name**: `admin-print-shop`
2. Marca la casilla **"Provide user access to the AWS Management Console"**
3. Selecciona **"I want to create an IAM user"**
4. **Console password**: Custom password (crea una contrasena segura)
5. Desmarca **"Users must create a new password at next sign-in"**
6. Haz clic en **"Next"**

### Paso 5.5: Asignar permisos

1. Selecciona **"Attach policies directly"**
2. Busca y marca las siguientes politicas:
   - `AmazonEC2FullAccess` - Para gestionar EC2
   - `AmazonEventBridgeFullAccess` - Para el scheduler
   - `AWSLambda_FullAccess` - Para las funciones Lambda
   - `IAMFullAccess` - Para gestionar roles
   - `AWSBudgetsActionsWithAWSResourceControlAccess` - Para presupuestos
3. Haz clic en **"Next"**

### Paso 5.6: Revisar y crear

1. Revisa la configuracion
2. Haz clic en **"Create user"**
3. **IMPORTANTE**: Guarda las credenciales mostradas:
   - Console sign-in URL
   - User name
   - Password

### Paso 5.7: Crear alias de cuenta (opcional pero recomendado)

1. En el dashboard de IAM, busca **"Account Alias"**
2. Haz clic en **"Create"**
3. Ingresa un alias como: `print-shop-aws`
4. Esto te permite iniciar sesion con: `https://print-shop-aws.signin.aws.amazon.com/console`

### Paso 5.8: Cerrar sesion e iniciar con usuario IAM

1. Cierra sesion de la cuenta Root
2. Ve a la URL de inicio de sesion del usuario IAM
3. Ingresa las credenciales del usuario `admin-print-shop`
4. A partir de ahora, usa este usuario para todas las tareas

---

## 6. Crear Security Groups

### Que es un Security Group?

Un Security Group es un firewall virtual que controla el trafico de entrada y salida de tus instancias EC2.

### Paso 6.1: Acceder a VPC

1. En la consola de AWS, busca **"VPC"**
2. Haz clic en **"VPC"**

### Paso 6.2: Ir a Security Groups

1. En el menu izquierdo, haz clic en **"Security groups"**
2. Haz clic en **"Create security group"**

### Paso 6.3: Configurar Security Group

**Configuracion basica:**

1. **Security group name**: `print-shop-sg`
2. **Description**: `Security group for Print Shop Generator application`
3. **VPC**: Selecciona la VPC default (ya deberia estar seleccionada)

**Reglas de entrada (Inbound rules):**

Haz clic en **"Add rule"** para cada regla:

| Tipo | Protocolo | Puerto | Origen | Descripcion |
|------|-----------|--------|--------|-------------|
| SSH | TCP | 22 | My IP | Acceso SSH desde mi IP |
| HTTP | TCP | 80 | 0.0.0.0/0 | Acceso web publico |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Acceso web seguro |

**Como agregar cada regla:**

1. **Regla SSH:**
   - Type: SSH
   - Source type: My IP (esto detecta automaticamente tu IP actual)
   - Description: `SSH access from my IP`

2. **Regla HTTP:**
   - Type: HTTP
   - Source type: Anywhere-IPv4
   - Description: `HTTP public access`

3. **Regla HTTPS:**
   - Type: HTTPS
   - Source type: Anywhere-IPv4
   - Description: `HTTPS public access`

**Reglas de salida (Outbound rules):**

Deja la regla por defecto que permite todo el trafico de salida:

| Tipo | Protocolo | Puerto | Destino |
|------|-----------|--------|---------|
| All traffic | All | All | 0.0.0.0/0 |

### Paso 6.4: Crear el Security Group

1. Revisa la configuracion
2. Haz clic en **"Create security group"**
3. Anota el **Security Group ID** (ejemplo: `sg-0abc123def456789`)

---

## 7. Crear Key Pair para SSH

### Que es un Key Pair?

Un Key Pair es un par de claves criptograficas (publica y privada) que permite conectarte de forma segura a tu instancia EC2 sin usar contrasenas.

### Paso 7.1: Acceder a EC2

1. En la consola de AWS, busca **"EC2"**
2. Haz clic en **"EC2"**

### Paso 7.2: Crear Key Pair

1. En el menu izquierdo, bajo **"Network & Security"**, haz clic en **"Key Pairs"**
2. Haz clic en **"Create key pair"**

### Paso 7.3: Configurar Key Pair

1. **Name**: `print-shop-key`
2. **Key pair type**: RSA
3. **Private key file format**:
   - Si usas Windows con PuTTY: selecciona `.ppk`
   - Si usas Windows PowerShell, Mac o Linux: selecciona `.pem`
4. Haz clic en **"Create key pair"**

### Paso 7.4: Guardar el archivo de clave

1. El archivo se descargara automaticamente (`print-shop-key.pem` o `print-shop-key.ppk`)
2. **IMPORTANTE**: Guarda este archivo en un lugar seguro
3. **NUNCA** compartas este archivo con nadie
4. **NUNCA** subas este archivo a GitHub o repositorios publicos

### Paso 7.5: Configurar permisos del archivo (Mac/Linux/Windows PowerShell)

Abre una terminal y ejecuta:

**Windows PowerShell:**
```powershell
# Ir a la carpeta de descargas
cd $HOME\Downloads

# Ver que el archivo existe
dir print-shop-key.pem

# Mover a una ubicacion segura
mkdir -p $HOME\.ssh
move print-shop-key.pem $HOME\.ssh\

# En Windows, los permisos se manejan diferente
# El archivo debe estar accesible solo por tu usuario
```

**Mac/Linux:**
```bash
# Ir a la carpeta de descargas
cd ~/Downloads

# Mover a la carpeta .ssh
mv print-shop-key.pem ~/.ssh/

# Establecer permisos correctos (MUY IMPORTANTE)
chmod 400 ~/.ssh/print-shop-key.pem
```

---

## 8. Lanzar Instancia EC2 t4g.small

### Paso 8.1: Ir a EC2 Dashboard

1. En la consola de AWS, ve a **EC2**
2. Haz clic en **"Launch instance"**

### Paso 8.2: Nombre y etiquetas

1. **Name**: `print-shop-server`
2. Haz clic en **"Add additional tags"**
3. Agrega estas etiquetas (utiles para el scheduler):
   - Key: `Environment`, Value: `production`
   - Key: `Project`, Value: `print-shop`
   - Key: `Schedule`, Value: `print-shop-schedule`

### Paso 8.3: Seleccionar AMI (Sistema Operativo)

1. Selecciona **"Amazon Linux 2023 AMI"**
2. Asegurate de seleccionar la arquitectura **"64-bit (Arm)"**

**Nota importante**: Las instancias t4g usan procesadores ARM (Graviton), por lo que debes seleccionar una AMI ARM.

### Paso 8.4: Seleccionar tipo de instancia

1. En **"Instance type"**, haz clic en el dropdown
2. Busca y selecciona **"t4g.small"**

Especificaciones de t4g.small:
- 2 vCPU (ARM Graviton2)
- 2 GB RAM
- Hasta 5 Gbps de red
- $0.0168/hora

### Paso 8.5: Configurar Key Pair

1. En **"Key pair (login)"**, selecciona `print-shop-key`

### Paso 8.6: Configurar red

1. En **"Network settings"**, haz clic en **"Edit"**
2. **VPC**: Selecciona la VPC default
3. **Subnet**: Selecciona cualquier subnet (o deja "No preference")
4. **Auto-assign public IP**: Enable
5. **Firewall (security groups)**: Select existing security group
6. Selecciona `print-shop-sg`

### Paso 8.7: Configurar almacenamiento

1. En **"Configure storage"**:
   - **Size**: `10` GiB
   - **Volume type**: gp3
   - **IOPS**: 3000 (default)
   - **Throughput**: 125 (default)

### Paso 8.8: Configuracion avanzada (User Data)

1. Expande **"Advanced details"**
2. En **"User data"**, pega UNO de los siguientes scripts segun tu eleccion:

#### User Data para OPCION A - Sin Docker (Recomendado):

```bash
#!/bin/bash
# ==================================================
# User Data - Print Shop Generator SIN Docker
# ==================================================

# Update system
dnf update -y

# Install Python 3.12 and dependencies
dnf install -y python3.12 python3.12-pip python3.12-devel
dnf install -y gcc libffi-devel

# Install system dependency for python-magic
dnf install -y file-libs

# Create app directory
mkdir -p /home/ec2-user/print-shop
chown ec2-user:ec2-user /home/ec2-user/print-shop

# Install git
dnf install -y git

# Log completion
echo "Setup completed at $(date)" >> /var/log/user-data.log
```

#### User Data para OPCION B - Con Docker:

```bash
#!/bin/bash
# ==================================================
# User Data - Print Shop Generator CON Docker
# ==================================================

# Update system
dnf update -y

# Install Docker
dnf install -y docker

# Start Docker service
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group
usermod -aG docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create app directory
mkdir -p /home/ec2-user/print-shop
chown ec2-user:ec2-user /home/ec2-user/print-shop

# Install git
dnf install -y git

# Log completion
echo "Setup completed at $(date)" >> /var/log/user-data.log
```

Este script se ejecutara automaticamente cuando la instancia inicie por primera vez.

### Paso 8.9: Revisar y lanzar

1. En **"Summary"**, revisa:
   - Instance type: t4g.small
   - AMI: Amazon Linux 2023 (ARM)
   - Key pair: print-shop-key
   - Security group: print-shop-sg
   - Storage: 10 GiB gp3
2. Haz clic en **"Launch instance"**

### Paso 8.10: Esperar que inicie

1. Haz clic en el Instance ID para ver los detalles
2. Espera hasta que:
   - **Instance state**: Running (verde)
   - **Status checks**: 2/2 checks passed
3. Anota la **Public IPv4 address** (ejemplo: `54.123.45.67`)

---

## 9. Conectarse a la Instancia

### Metodo 1: Usando SSH desde terminal (Recomendado)

**Windows PowerShell:**
```powershell
ssh -i "$HOME\.ssh\print-shop-key.pem" ec2-user@54.123.45.67
```

**Mac/Linux:**
```bash
ssh -i ~/.ssh/print-shop-key.pem ec2-user@54.123.45.67
```

Reemplaza `54.123.45.67` con la IP publica de tu instancia.

### Primera conexion

La primera vez que te conectes, veras un mensaje como:

```
The authenticity of host '54.123.45.67' can't be established.
ED25519 key fingerprint is SHA256:xxxxx.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

Escribe `yes` y presiona Enter.

### Metodo 2: Usando EC2 Instance Connect (Alternativa)

1. En la consola de EC2, selecciona tu instancia
2. Haz clic en **"Connect"**
3. Selecciona la pestana **"EC2 Instance Connect"**
4. Haz clic en **"Connect"**
5. Se abrira una terminal en el navegador

### Verificar la instalacion

Una vez conectado, ejecuta estos comandos para verificar que el sistema esta listo:

```bash
# Verificar espacio en disco
df -h

# Verificar memoria
free -h

# Verificar que el User Data termino (espera si es necesario)
cat /var/log/user-data.log
```

**Si usaste el User Data para OPCION A (sin Docker):**

```bash
# Verificar Python
python3.12 --version

# Verificar git
git --version
```

**Si usaste el User Data para OPCION B (con Docker):**

```bash
# Verificar Docker
docker --version

# Verificar Docker Compose
docker-compose --version
```

Si el User Data no ha terminado, espera 1-2 minutos y verifica de nuevo. Puedes ver el progreso con:

```bash
sudo tail -f /var/log/cloud-init-output.log
```

---

## 10. OPCION A: Desplegar SIN Docker (Recomendado)

Esta opcion es mas simple, usa menos memoria y es mas facil de depurar. Ejecuta Python y uvicorn directamente en la instancia.

### Ventajas de NO usar Docker:

| Aspecto | Sin Docker | Con Docker |
|---------|------------|------------|
| Uso de RAM | ~200-400 MB | ~400-600 MB |
| Complejidad | Simple | Media |
| Tiempo de inicio | ~5 segundos | ~15-30 segundos |
| Depuracion | Facil | Requiere docker logs |
| Actualizaciones | git pull + restart | rebuild imagen |

### Paso 10.1: Conectarse a la instancia

```bash
ssh -i ~/.ssh/print-shop-key.pem ec2-user@TU_IP_PUBLICA
```

### Paso 10.2: Verificar Python

```bash
python3.12 --version
```

Si no esta instalado:

```bash
sudo dnf install -y python3.12 python3.12-pip python3.12-devel
```

### Paso 10.3: Instalar dependencia del sistema

La libreria `python-magic` requiere `libmagic`:

```bash
sudo dnf install -y file-libs
```

### Paso 10.4: Crear directorio de la aplicacion

```bash
mkdir -p ~/print-shop
cd ~/print-shop
```

### Paso 10.5: Subir el codigo fuente

**Opcion A - Clonar desde GitHub:**

```bash
# Instalar git si no esta
sudo dnf install -y git

# Clonar el repositorio (reemplaza con tu URL)
git clone https://github.com/TU_USUARIO/print-shop-agent.git .
```

**Opcion B - Subir manualmente con SCP:**

Desde tu computadora local (PowerShell):

```powershell
# Comprimir el proyecto (excluir archivos innecesarios)
cd C:\Users\josoe\Documents\print-shop-agent
tar -czvf print-shop.tar.gz --exclude='.git' --exclude='venv' --exclude='output/*' --exclude='__pycache__' --exclude='*.pyc' .

# Subir al servidor
scp -i "$HOME\.ssh\print-shop-key.pem" print-shop.tar.gz ec2-user@TU_IP:/home/ec2-user/print-shop/
```

Luego en el servidor:

```bash
cd ~/print-shop
tar -xzvf print-shop.tar.gz
rm print-shop.tar.gz
```

### Paso 10.6: Crear entorno virtual

```bash
cd ~/print-shop

# Crear entorno virtual
python3.12 -m venv venv

# Activar entorno virtual
source venv/bin/activate

# Verificar que estas en el venv
which python
# Deberia mostrar: /home/ec2-user/print-shop/venv/bin/python
```

### Paso 10.7: Instalar dependencias

```bash
# Asegurarse de estar en el directorio correcto
cd ~/print-shop

# Activar venv si no esta activo
source venv/bin/activate

# Actualizar pip
pip install --upgrade pip

# Instalar dependencias
pip install -r requirements.txt
```

### Paso 10.8: Crear archivo de entorno

**IMPORTANTE**: El archivo `.env` debe estar en el directorio `backend/` porque es donde se ejecuta la aplicacion.

```bash
nano ~/print-shop/backend/.env
```

Pega el siguiente contenido:

```bash
# ============================================
# Print Shop Generator - Produccion SIN Docker
# ============================================

# Application
APP_ENV=production
APP_NAME="Print Shop Generator"
APP_VERSION=1.0.0

# Server
HOST=0.0.0.0
PORT=80
RELOAD=false

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# Output - Ruta relativa al directorio backend/
OUTPUT_DIR=./output
MAX_FILE_SIZE_MB=50
CLEANUP_DAYS=7

# Default Document Settings
DEFAULT_PAGE_SIZE=carta
DEFAULT_IMAGE_WIDTH_CM=10
DEFAULT_MARGINS_CM=1.5
DEFAULT_SPACING_CM=0.5
```

Guarda con `Ctrl+O`, Enter, `Ctrl+X`.

### Paso 10.9: Crear directorios necesarios

```bash
mkdir -p ~/print-shop/backend/output
mkdir -p ~/print-shop/backend/logs
```

### Paso 10.10: Probar que funciona

```bash
cd ~/print-shop/backend
source ../venv/bin/activate

# Probar la aplicacion (puerto 8000 para test)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Abre otra terminal y prueba:

```bash
curl http://localhost:8000/api/health
```

Si funciona, presiona `Ctrl+C` para detener.

### Paso 10.11: Crear servicio systemd

Este servicio permite:
- Iniciar la app automaticamente al arrancar la instancia
- Reiniciar automaticamente si falla
- Ejecutar en puerto 80 (requiere permisos root)

```bash
sudo nano /etc/systemd/system/print-shop.service
```

Pega el siguiente contenido:

```ini
[Unit]
Description=Print Shop Generator
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/home/ec2-user/print-shop/backend
Environment="PATH=/home/ec2-user/print-shop/venv/bin"
ExecStart=/home/ec2-user/print-shop/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 80
Restart=always
RestartSec=5

# Logs
StandardOutput=append:/home/ec2-user/print-shop/backend/logs/app.log
StandardError=append:/home/ec2-user/print-shop/backend/logs/error.log

[Install]
WantedBy=multi-user.target
```

**Nota**: No necesitamos `EnvironmentFile` porque pydantic-settings carga automaticamente el archivo `.env` del directorio de trabajo (`WorkingDirectory`).

Guarda con `Ctrl+O`, Enter, `Ctrl+X`.

### Paso 10.12: Activar y arrancar el servicio

```bash
# Recargar configuracion de systemd
sudo systemctl daemon-reload

# Habilitar inicio automatico
sudo systemctl enable print-shop

# Iniciar el servicio
sudo systemctl start print-shop

# Verificar estado
sudo systemctl status print-shop
```

### Paso 10.13: Verificar que funciona

```bash
# Ver logs en tiempo real
sudo journalctl -u print-shop -f

# O ver los archivos de log
tail -f ~/print-shop/backend/logs/app.log
```

### Paso 10.14: Probar desde el navegador

Abre tu navegador y ve a:

```
http://TU_IP_PUBLICA
```

Deberia cargar la interfaz de Print Shop Generator.

### Paso 10.15: Comandos utiles

```bash
# Ver estado del servicio
sudo systemctl status print-shop

# Reiniciar el servicio
sudo systemctl restart print-shop

# Detener el servicio
sudo systemctl stop print-shop

# Ver logs recientes
sudo journalctl -u print-shop --since "10 minutes ago"

# Actualizar codigo (si usas git)
cd ~/print-shop
git pull
sudo systemctl restart print-shop
```

---

## 11. OPCION B: Desplegar CON Docker

Si prefieres usar Docker, sigue estos pasos. Docker es util si quieres un ambiente aislado o planeas escalar a multiples contenedores.

### Paso 11.1: Conectarse a la instancia

```bash
ssh -i ~/.ssh/print-shop-key.pem ec2-user@TU_IP_PUBLICA
```

### Paso 11.2: Verificar Docker

```bash
docker --version
docker-compose --version
```

Si no estan instalados:

```bash
# Instalar Docker
sudo dnf install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Cerrar sesion y reconectar para aplicar grupo
exit
```

Reconecta por SSH y luego:

```bash
# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Paso 11.3: Crear directorio y subir codigo

```bash
mkdir -p ~/print-shop
cd ~/print-shop
```

Sube el codigo usando git clone o SCP (ver instrucciones en Opcion A, Paso 10.5).

### Paso 11.4: Verificar variables de entorno

Con Docker, las variables de entorno ya estan configuradas en `docker-compose.yml`.

**No necesitas crear un archivo `.env`** porque docker-compose.yml ya contiene:

```yaml
environment:
  - APP_ENV=production
  - HOST=0.0.0.0
  - PORT=8000
  - LOG_LEVEL=INFO
  - OUTPUT_DIR=/app/backend/output
```

Si quieres modificar alguna variable, edita directamente el `docker-compose.yml`:

```bash
nano ~/print-shop/docker-compose.yml
```

### Paso 11.5: Verificar docker-compose.yml

Asegurate de que el archivo tenga el puerto mapeado a 80:

```bash
nano docker-compose.yml
```

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: print-shop-app
    restart: unless-stopped
    environment:
      - APP_ENV=production
      - HOST=0.0.0.0
      - PORT=8000
      - LOG_LEVEL=INFO
      - OUTPUT_DIR=/app/backend/output
    ports:
      - "80:8000"
    volumes:
      - print_shop_output:/app/backend/output
      - print_shop_logs:/app/backend/logs
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

volumes:
  print_shop_output:
    name: print_shop_output
  print_shop_logs:
    name: print_shop_logs
```

### Paso 11.6: Construir y ejecutar

```bash
cd ~/print-shop

# Construir la imagen (toma unos minutos la primera vez)
docker-compose build

# Iniciar el servicio
docker-compose up -d

# Verificar que esta corriendo
docker-compose ps

# Ver logs
docker-compose logs -f
```

### Paso 11.7: Probar la aplicacion

Abre tu navegador y ve a:

```
http://TU_IP_PUBLICA
```

### Paso 11.8: Crear servicio systemd para Docker

```bash
sudo nano /etc/systemd/system/print-shop.service
```

Pega:

```ini
[Unit]
Description=Print Shop Generator Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ec2-user/print-shop
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=ec2-user
Group=ec2-user

[Install]
WantedBy=multi-user.target
```

Activa el servicio:

```bash
sudo systemctl daemon-reload
sudo systemctl enable print-shop
sudo systemctl start print-shop
```

### Paso 11.9: Comandos utiles Docker

```bash
# Ver contenedores
docker ps

# Ver logs
docker-compose logs -f

# Reiniciar
docker-compose restart

# Reconstruir (despues de cambios)
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Limpiar imagenes no usadas
docker system prune -af
```

---

## 12. Configurar AWS Instance Scheduler

El Instance Scheduler permite encender y apagar automaticamente la instancia EC2 segun un horario definido.

### Horario objetivo:
- **Dias**: Lunes a Viernes
- **Horario**: 11:30 AM - 4:00 PM (hora local Bolivia UTC-4)
- **En UTC**: 15:30 - 20:00

### Metodo: EventBridge + Lambda (Simple y gratuito)

#### Paso 12.1: Crear rol IAM para Lambda

1. Ve a **IAM** > **Roles** > **Create role**
2. **Trusted entity type**: AWS service
3. **Service**: Lambda
4. Haz clic en **Next**
5. Busca y selecciona: `AmazonEC2FullAccess`
6. Haz clic en **Next**
7. **Role name**: `lambda-ec2-scheduler-role`
8. Haz clic en **Create role**

#### Paso 12.2: Obtener el Instance ID

1. Ve a **EC2** > **Instances**
2. Selecciona tu instancia `print-shop-server`
3. Copia el **Instance ID** (ejemplo: `i-0abc123def456789`)

#### Paso 12.3: Crear funcion Lambda para ENCENDER

1. Ve a **Lambda** en la consola de AWS
2. Haz clic en **Create function**
3. **Function name**: `start-print-shop-instance`
4. **Runtime**: Python 3.12
5. **Architecture**: arm64 (mas economico)
6. Expande **Change default execution role**
7. Selecciona **Use an existing role**
8. Selecciona `lambda-ec2-scheduler-role`
9. Haz clic en **Create function**

En el editor de codigo, reemplaza el contenido con:

```python
import boto3

def lambda_handler(event, context):
    ec2 = boto3.client('ec2', region_name='us-east-1')  # Ajusta la region
    instance_id = 'i-0abc123def456789'  # Reemplaza con tu Instance ID

    try:
        ec2.start_instances(InstanceIds=[instance_id])
        print(f'Started instance: {instance_id}')
        return {
            'statusCode': 200,
            'body': f'Started instance: {instance_id}'
        }
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'body': f'Error: {str(e)}'
        }
```

**IMPORTANTE**: Cambia estos valores:
- `region_name='us-east-1'` - Cambia a tu region
- `instance_id = 'i-0abc123def456789'` - Cambia a tu Instance ID real

Haz clic en **Deploy**.

#### Paso 12.4: Crear funcion Lambda para APAGAR

1. Haz clic en **Create function**
2. **Function name**: `stop-print-shop-instance`
3. **Runtime**: Python 3.12
4. **Architecture**: arm64
5. Usa el rol `lambda-ec2-scheduler-role`
6. Haz clic en **Create function**

Codigo:

```python
import boto3

def lambda_handler(event, context):
    ec2 = boto3.client('ec2', region_name='us-east-1')  # Ajusta la region
    instance_id = 'i-0abc123def456789'  # Reemplaza con tu Instance ID

    try:
        ec2.stop_instances(InstanceIds=[instance_id])
        print(f'Stopped instance: {instance_id}')
        return {
            'statusCode': 200,
            'body': f'Stopped instance: {instance_id}'
        }
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'body': f'Error: {str(e)}'
        }
```

Haz clic en **Deploy**.

#### Paso 12.5: Crear regla EventBridge para ENCENDER

1. Ve a **Amazon EventBridge** en la consola
2. En el menu izquierdo, haz clic en **Schedules**
3. Haz clic en **Create schedule**

**Configuracion:**

1. **Schedule name**: `start-print-shop-daily`
2. **Description**: `Start Print Shop EC2 instance at 11:25 AM Bolivia time`
3. **Schedule group**: default

**Schedule pattern:**
1. Selecciona **Recurring schedule**
2. **Schedule type**: Cron-based schedule
3. **Cron expression**: `25 15 ? * MON-FRI *`

   Explicacion:
   - `25` = minuto 25
   - `15` = hora 15 UTC (11:25 AM Bolivia UTC-4)
   - `?` = cualquier dia del mes
   - `*` = cualquier mes
   - `MON-FRI` = lunes a viernes
   - `*` = cualquier ano

4. **Timezone**: UTC
5. **Flexible time window**: Off

**Target:**
1. Selecciona **AWS Lambda**
2. **Invoke**: `start-print-shop-instance`

**Settings:**
1. **Retry policy**: Default (3 retries)
2. Haz clic en **Next**
3. Revisa y haz clic en **Create schedule**

#### Paso 12.6: Crear regla EventBridge para APAGAR

1. Haz clic en **Create schedule**
2. **Schedule name**: `stop-print-shop-daily`
3. **Description**: `Stop Print Shop EC2 instance at 4:05 PM Bolivia time`

**Schedule pattern:**
1. **Cron expression**: `5 20 ? * MON-FRI *`

   Explicacion:
   - `5` = minuto 5
   - `20` = hora 20 UTC (4:05 PM Bolivia UTC-4)
   - Resto igual que antes

**Target:**
1. Selecciona **AWS Lambda**
2. **Invoke**: `stop-print-shop-instance`

3. Haz clic en **Create schedule**

#### Paso 12.7: Probar las funciones

1. Ve a **Lambda** > `start-print-shop-instance`
2. Haz clic en **Test**
3. Crea un evento de prueba con nombre `test`
4. Haz clic en **Test**
5. Verifica que la instancia se encienda en EC2

6. Repite con `stop-print-shop-instance`

---

## 13. Acceso a la Aplicacion (URL)

### Sin dominio personalizado

Cuando la instancia esta corriendo, puedes acceder a la aplicacion usando la IP publica:

```
http://TU_IP_PUBLICA
```

Ejemplo: `http://54.123.45.67`

### Problema: La IP cambia cada vez que se reinicia

Cuando una instancia EC2 se detiene y vuelve a iniciar, la IP publica cambia. Tienes varias opciones:

#### Opcion 1: Elastic IP (IP Fija) - No recomendado para este caso

Una Elastic IP es una IP publica estatica que se mantiene igual.

**Costo**:
- GRATIS si la instancia esta corriendo
- $0.005/hora (~$3.65/mes) cuando la instancia esta apagada

**Por que NO la recomiendo**:
Con el scheduler apagando la instancia 19.5 horas al dia (aprox), pagarias unos $3/mes adicionales solo por la IP. Esto casi duplicaria tu costo total.

#### Opcion 2: Usar la IP publica temporal (Recomendado sin dominio)

Cada vez que la instancia enciende, obtiene una nueva IP. Puedes:

1. **Ver la IP en la consola EC2** cada vez que necesites acceder
2. **Crear un bookmark que apunte a la consola EC2** para ver rapidamente la IP

#### Opcion 3: Dominio personalizado con DNS dinamico (Recomendado)

La mejor opcion es configurar un dominio con DNS dinamico. Lo veremos en la siguiente seccion.

### Necesitas ALB o Proxy?

**Para este caso de uso, NO necesitas ALB (Application Load Balancer) ni Nginx como proxy.**

Razones:
- **ALB**: Cuesta ~$16/mes minimo. Solo es necesario si tienes multiples instancias o necesitas balanceo de carga.
- **Nginx proxy**: Solo es necesario si necesitas HTTPS o multiples aplicaciones en el mismo servidor.

**Configuracion actual suficiente:**
```
Internet -> Security Group -> EC2:80 -> Docker:8000 -> FastAPI
```

Si en el futuro necesitas HTTPS (certificado SSL), puedes agregar Nginx como proxy. Lo explicare en la seccion correspondiente.

---

## 14. Configurar Dominio Personalizado

### Opcion A: Usar un dominio existente (si ya tienes uno)

Si ya tienes un dominio (ejemplo: `midominio.com`), puedes crear un subdominio para la aplicacion.

#### Paso 14.A.1: Configurar registro DNS

Accede al panel de control de tu registrador de dominio (GoDaddy, Namecheap, Cloudflare, etc.)

1. Ve a la seccion de DNS
2. Agrega un registro tipo **A**:
   - **Name/Host**: `printshop` (esto creara `printshop.midominio.com`)
   - **Type**: A
   - **Value/Points to**: La IP publica de tu EC2
   - **TTL**: 300 (5 minutos)

3. El problema es que la IP cambia. Solucion: DNS dinamico (ver Opcion B)

### Opcion B: Comprar un dominio nuevo con Route 53

AWS Route 53 es el servicio de DNS de AWS. Puedes comprar dominios directamente.

#### Paso 14.B.1: Acceder a Route 53

1. En la consola de AWS, busca **Route 53**
2. Haz clic en **Route 53**

#### Paso 14.B.2: Comprar dominio

1. Haz clic en **Register domain**
2. Busca el dominio que deseas (ejemplo: `printshop-generator.com`)
3. Verifica la disponibilidad
4. Selecciona la extension (.com, .net, .org, etc.)
5. Haz clic en **Select**
6. Completa la informacion de contacto
7. Haz clic en **Continue**
8. Acepta los terminos
9. Haz clic en **Complete Order**

**Costo**: Depende de la extension
- `.com`: ~$13/ano
- `.net`: ~$11/ano
- `.click`: ~$3/ano

#### Paso 14.B.3: Esperar activacion

El registro de dominio puede tardar hasta 24 horas, pero generalmente es mas rapido (minutos a pocas horas).

#### Paso 14.B.4: Crear zona hospedada (se crea automaticamente con la compra)

1. Ve a **Route 53** > **Hosted zones**
2. Tu dominio deberia aparecer ahi

#### Paso 14.B.5: Crear registro A

1. Haz clic en tu dominio
2. Haz clic en **Create record**
3. **Record type**: A
4. **Record name**: Dejar vacio para el dominio raiz, o escribir `app` para `app.tudominio.com`
5. **Value**: La IP publica de tu EC2
6. **TTL**: 300
7. Haz clic en **Create records**

### Opcion C: DNS Dinamico con Route 53 (Mejor solucion)

Para que el DNS se actualice automaticamente cuando la IP cambia:

#### Paso 14.C.1: Crear politica IAM para actualizar Route 53

1. Ve a **IAM** > **Policies** > **Create policy**
2. Selecciona la pestana **JSON**
3. Pega:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "route53:ChangeResourceRecordSets"
            ],
            "Resource": "arn:aws:route53:::hostedzone/TU_HOSTED_ZONE_ID"
        },
        {
            "Effect": "Allow",
            "Action": [
                "route53:ListHostedZones",
                "route53:GetHostedZone"
            ],
            "Resource": "*"
        }
    ]
}
```

Reemplaza `TU_HOSTED_ZONE_ID` con el ID de tu zona hospedada (lo encuentras en Route 53 > Hosted zones).

4. **Policy name**: `route53-dynamic-dns-policy`
5. Haz clic en **Create policy**

#### Paso 14.C.2: Crear rol IAM para EC2

1. Ve a **IAM** > **Roles** > **Create role**
2. **Trusted entity**: AWS service
3. **Service**: EC2
4. Haz clic en **Next**
5. Busca y selecciona `route53-dynamic-dns-policy`
6. **Role name**: `ec2-route53-dynamic-dns`
7. Haz clic en **Create role**

#### Paso 14.C.3: Asignar rol a la instancia EC2

1. Ve a **EC2** > **Instances**
2. Selecciona tu instancia
3. Haz clic en **Actions** > **Security** > **Modify IAM role**
4. Selecciona `ec2-route53-dynamic-dns`
5. Haz clic en **Update IAM role**

#### Paso 14.C.4: Crear script de actualizacion DNS

Conectate a la instancia por SSH y ejecuta:

```bash
sudo nano /usr/local/bin/update-dns.sh
```

Pega:

```bash
#!/bin/bash
# Script para actualizar DNS en Route 53

# Configuracion (MODIFICA ESTOS VALORES)
HOSTED_ZONE_ID="TU_HOSTED_ZONE_ID"
DOMAIN_NAME="app.tudominio.com"
TTL=300

# Obtener IP publica actual
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

if [ -z "$PUBLIC_IP" ]; then
    echo "Error: No se pudo obtener la IP publica"
    exit 1
fi

echo "IP Publica: $PUBLIC_IP"
echo "Dominio: $DOMAIN_NAME"

# Crear JSON para la actualizacion
CHANGE_BATCH=$(cat <<EOF
{
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "$DOMAIN_NAME",
                "Type": "A",
                "TTL": $TTL,
                "ResourceRecords": [
                    {
                        "Value": "$PUBLIC_IP"
                    }
                ]
            }
        }
    ]
}
EOF
)

# Ejecutar actualizacion
aws route53 change-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --change-batch "$CHANGE_BATCH"

echo "DNS actualizado correctamente"
```

Guarda y haz ejecutable:

```bash
sudo chmod +x /usr/local/bin/update-dns.sh
```

#### Paso 14.C.5: Ejecutar al iniciar la instancia

```bash
sudo nano /etc/systemd/system/update-dns.service
```

Pega:

```ini
[Unit]
Description=Update Route 53 DNS with current public IP
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/update-dns.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

Activa el servicio:

```bash
sudo systemctl daemon-reload
sudo systemctl enable update-dns
sudo systemctl start update-dns
```

Ahora, cada vez que la instancia inicie, actualizara automaticamente el DNS con su nueva IP.

---

## 15. Configurar HTTPS con Certificado SSL

Si necesitas HTTPS (recomendado si manejas datos sensibles o quieres que el navegador no muestre advertencias):

### Opcion A: Let's Encrypt con Certbot (Gratuito)

#### Paso 15.A.1: Instalar Nginx y Certbot

```bash
sudo dnf install -y nginx
sudo dnf install -y certbot python3-certbot-nginx
```

#### Paso 15.A.2: Configurar Nginx como proxy

```bash
sudo nano /etc/nginx/conf.d/print-shop.conf
```

Pega:

```nginx
server {
    listen 80;
    server_name app.tudominio.com;  # Cambia a tu dominio

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Aumentar limite para subida de imagenes
        client_max_body_size 100M;
    }
}
```

#### Paso 15.A.3: Modificar la configuracion del servicio

**Si usas OPCION A (sin Docker):**

Modifica el servicio systemd para usar puerto 8000:

```bash
sudo nano /etc/systemd/system/print-shop.service
```

Cambia la linea ExecStart:
```ini
ExecStart=/home/ec2-user/print-shop/venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Reinicia:
```bash
sudo systemctl daemon-reload
sudo systemctl restart print-shop
```

**Si usas OPCION B (con Docker):**

Cambia el puerto de 80 a 8000 en docker-compose.yml:

```yaml
ports:
  - "8000:8000"
```

Reinicia Docker:

```bash
cd ~/print-shop
docker-compose down
docker-compose up -d
```

#### Paso 15.A.4: Iniciar Nginx

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### Paso 15.A.5: Obtener certificado SSL

```bash
sudo certbot --nginx -d app.tudominio.com
```

Sigue las instrucciones:
1. Ingresa tu correo electronico
2. Acepta los terminos
3. Selecciona si deseas recibir correos
4. Certbot configurara automaticamente HTTPS

#### Paso 15.A.6: Renovacion automatica

Certbot configura automaticamente la renovacion. Verifica con:

```bash
sudo systemctl status certbot-renew.timer
```

---

## 16. Monitoreo y Mantenimiento

### Ver logs de la aplicacion

**OPCION A (sin Docker):**

```bash
# Ver logs en tiempo real con journalctl
sudo journalctl -u print-shop -f

# Ver ultimos 100 logs
sudo journalctl -u print-shop -n 100

# Ver logs del archivo
tail -f ~/print-shop/backend/logs/app.log
tail -f ~/print-shop/backend/logs/error.log
```

**OPCION B (con Docker):**

```bash
cd ~/print-shop
docker-compose logs -f

# Solo ultimas 100 lineas
docker-compose logs --tail=100
```

### Ver uso de recursos

```bash
# CPU y memoria (instalar si no existe)
sudo dnf install -y htop
htop

# Espacio en disco
df -h

# Memoria
free -h

# Procesos de Python (sin Docker)
ps aux | grep uvicorn

# Uso de Docker (si aplica)
docker stats
```

### Actualizar la aplicacion

**OPCION A (sin Docker):**

```bash
cd ~/print-shop

# Si usas Git
git pull

# Reinstalar dependencias si cambiaron
source venv/bin/activate
pip install -r requirements.txt

# Reiniciar el servicio
sudo systemctl restart print-shop

# Verificar estado
sudo systemctl status print-shop
```

**OPCION B (con Docker):**

```bash
cd ~/print-shop

# Si usas Git
git pull

# Reconstruir y reiniciar
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Backups de documentos generados

**OPCION A (sin Docker):**

```bash
# Crear directorio de backups
mkdir -p ~/backups

# Crear backup
tar czf ~/backups/output-$(date +%Y%m%d).tar.gz ~/print-shop/backend/output/

# Restaurar backup
tar xzf ~/backups/output-YYYYMMDD.tar.gz -C /
```

**OPCION B (con Docker):**

```bash
# Crear backup
docker run --rm -v print_shop_output:/data -v ~/backups:/backup alpine tar czf /backup/output-$(date +%Y%m%d).tar.gz /data

# Restaurar backup
docker run --rm -v print_shop_output:/data -v ~/backups:/backup alpine tar xzf /backup/output-YYYYMMDD.tar.gz -C /
```

### Configurar CloudWatch Alarms (Opcional)

1. Ve a **CloudWatch** > **Alarms** > **Create alarm**
2. Selecciona metrica: EC2 > Per-Instance Metrics > CPUUtilization
3. Configura umbral: > 80% por 5 minutos
4. Configura notificacion por email

---

## 17. Resumen de Costos

### Desglose mensual estimado

| Servicio | Detalle | Costo |
|----------|---------|-------|
| EC2 t4g.small | 97.5 horas @ $0.0168/hora | $1.64 |
| EBS gp3 | 10 GB @ $0.08/GB | $0.80 |
| Lambda | < 1M requests | $0.00 |
| EventBridge | Reglas de scheduling | $0.00 |
| Route 53 Hosted Zone | 1 zona | $0.50 |
| Route 53 Queries | < 1M | ~$0.00 |
| Transfer Out | < 100 GB | $0.00 |
| **TOTAL** | | **~$2.95/mes** |

### Sin Route 53 (sin dominio personalizado)

| Servicio | Costo |
|----------|-------|
| EC2 + EBS | $2.44 |
| Lambda + EventBridge | $0.00 |
| **TOTAL** | **~$2.50/mes** |

### Con dominio de Route 53

| Servicio | Costo anual |
|----------|-------------|
| Hosting mensual | ~$3/mes = $36/ano |
| Dominio .com | ~$13/ano |
| **TOTAL ANUAL** | **~$49/ano** |

---

## 18. Troubleshooting

### La instancia no enciende

1. Verifica los logs de Lambda:
   - Ve a **Lambda** > tu funcion > **Monitor** > **View logs in CloudWatch**
2. Verifica que el Instance ID sea correcto
3. Verifica que la region sea correcta

### No puedo conectarme por SSH

1. Verifica que la instancia este corriendo
2. Verifica que el Security Group tenga la regla SSH
3. Verifica que tu IP no haya cambiado:
   - Actualiza la regla SSH con tu IP actual
4. Verifica los permisos del archivo .pem:
   ```bash
   chmod 400 ~/.ssh/print-shop-key.pem
   ```

### La aplicacion no carga

**OPCION A (sin Docker):**

1. Verifica que el servicio este corriendo:
   ```bash
   sudo systemctl status print-shop
   ```
2. Verifica los logs:
   ```bash
   sudo journalctl -u print-shop -n 50
   tail -50 ~/print-shop/backend/logs/error.log
   ```
3. Reinicia el servicio:
   ```bash
   sudo systemctl restart print-shop
   ```
4. Verifica que el puerto 80 este abierto en el Security Group

**OPCION B (con Docker):**

1. Verifica que Docker este corriendo:
   ```bash
   docker-compose ps
   ```
2. Verifica los logs:
   ```bash
   docker-compose logs
   ```
3. Reinicia el contenedor:
   ```bash
   docker-compose restart
   ```
4. Verifica que el puerto 80 este abierto en el Security Group

### El scheduler no funciona

1. Verifica las reglas de EventBridge:
   - Ve a **EventBridge** > **Schedules**
   - Verifica que las reglas esten activas
2. Prueba las funciones Lambda manualmente
3. Verifica los logs de CloudWatch

### Error de memoria

Si la aplicacion se queda sin memoria:

1. Verifica el uso de memoria:
   ```bash
   free -h

   # Si usas Docker
   docker stats

   # Si no usas Docker
   ps aux --sort=-%mem | head -10
   ```
2. Considera actualizar a t4g.medium (4 GB RAM)
3. Si usas la OPCION A (sin Docker), generalmente usaras menos memoria (~200-400 MB vs ~400-600 MB con Docker)

### El DNS no actualiza

1. Verifica que el rol IAM este asignado a la instancia
2. Ejecuta el script manualmente:
   ```bash
   sudo /usr/local/bin/update-dns.sh
   ```
3. Revisa los logs de error

---

## Apendice A: Comandos Utiles

### Conexion SSH

```bash
ssh -i ~/.ssh/print-shop-key.pem ec2-user@TU_IP
```

### Servicio (OPCION A - sin Docker)

```bash
# Ver estado del servicio
sudo systemctl status print-shop

# Iniciar servicio
sudo systemctl start print-shop

# Detener servicio
sudo systemctl stop print-shop

# Reiniciar servicio
sudo systemctl restart print-shop

# Ver logs en tiempo real
sudo journalctl -u print-shop -f

# Activar entorno virtual
cd ~/print-shop && source venv/bin/activate

# Actualizar dependencias
pip install -r requirements.txt
```

### Docker (OPCION B)

```bash
# Ver contenedores
docker ps

# Ver logs
docker-compose logs -f

# Reiniciar
docker-compose restart

# Reconstruir
docker-compose up -d --build

# Limpiar imagenes no usadas
docker system prune -af
```

### Instancia EC2

```bash
# Ver IP publica desde dentro de la instancia
curl http://169.254.169.254/latest/meta-data/public-ipv4

# Ver Instance ID
curl http://169.254.169.254/latest/meta-data/instance-id

# Ver memoria disponible
free -h

# Ver espacio en disco
df -h

# Ver procesos
top
```

---

## Apendice B: Lista de Verificacion de Seguridad

- [ ] MFA activado en cuenta Root
- [ ] Usuario IAM creado para administracion diaria
- [ ] Cuenta Root NO usada para tareas diarias
- [ ] Key Pair guardado en lugar seguro
- [ ] Security Group con reglas minimas necesarias
- [ ] SSH limitado a tu IP
- [ ] Presupuesto de $5 configurado con alertas
- [ ] Instancia con arquitectura ARM (t4g) para mejor costo
- [ ] User Data NO contiene secretos
- [ ] Variables de entorno sensibles en .env (no en repositorio)

---

## Apendice C: Checklist de Deployment

### Configuracion inicial AWS

1. [ ] Cuenta AWS creada y verificada
2. [ ] Presupuesto de $5 configurado con alertas
3. [ ] Usuario IAM creado
4. [ ] MFA activado en cuenta Root
5. [ ] Security Group creado (puertos 22, 80, 443)
6. [ ] Key Pair creado y guardado en lugar seguro

### Instancia EC2

7. [ ] Instancia EC2 t4g.small lanzada
8. [ ] User Data ejecutado correctamente
9. [ ] Conexion SSH funcionando

### Deployment (elige una opcion)

**OPCION A - Sin Docker:**
10. [ ] Python 3.12 instalado
11. [ ] Entorno virtual creado
12. [ ] Dependencias instaladas (pip install)
13. [ ] Archivo .env configurado
14. [ ] Servicio systemd creado y activo
15. [ ] Aplicacion accesible en http://TU_IP

**OPCION B - Con Docker:**
10. [ ] Docker instalado
11. [ ] Docker Compose instalado
12. [ ] Archivo .env configurado
13. [ ] docker-compose build exitoso
14. [ ] Contenedor corriendo
15. [ ] Aplicacion accesible en http://TU_IP

### Scheduler

16. [ ] Rol IAM para Lambda creado
17. [ ] Lambda function START creada y probada
18. [ ] Lambda function STOP creada y probada
19. [ ] EventBridge schedule START configurado
20. [ ] EventBridge schedule STOP configurado
21. [ ] Scheduler probado manualmente

### Opcional

22. [ ] Dominio configurado (Route 53 o externo)
23. [ ] DNS dinamico configurado
24. [ ] HTTPS con Let's Encrypt configurado

---

*Documento creado para Print Shop Generator*
*Ultima actualizacion: Abril 2026*
