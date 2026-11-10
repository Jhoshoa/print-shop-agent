# 01 - Configuracion Inicial de AWS

Este documento cubre la configuracion inicial de tu cuenta AWS, incluyendo seguridad, presupuestos y permisos.

**Tiempo estimado:** 30-45 minutos

**Siguiente documento:** [02 - Lanzar Instancia EC2](02-lanzar-instancia-ec2.md)

---

## Tabla de Contenidos

1. [Requisitos Previos](#1-requisitos-previos)
2. [Crear Cuenta AWS](#2-crear-cuenta-aws)
3. [Configurar Presupuesto de $5 USD](#3-configurar-presupuesto-de-5-usd)
4. [Configurar IAM](#4-configurar-iam-usuarios-y-permisos)
5. [Crear Security Groups](#5-crear-security-groups)
6. [Crear Key Pair para SSH](#6-crear-key-pair-para-ssh)

---

## 1. Requisitos Previos

### En tu computadora local:

1. **Navegador web** (Chrome, Firefox, Edge)
2. **Cliente SSH** - Ya incluido en Windows 10/11, Mac y Linux
3. **Git** - Para clonar el repositorio (opcional)

### Verificar que tienes SSH disponible:

```bash
ssh -V
```

Deberia mostrar algo como: `OpenSSH_for_Windows_8.1p1` o similar.

### Informacion necesaria:

- **Tarjeta de credito/debito** - AWS requiere una para crear la cuenta
- **Correo electronico** - Para la cuenta de AWS
- **Numero de telefono** - Para verificacion

---

## 2. Crear Cuenta AWS

### Paso 2.1: Ir al sitio web de AWS

1. Abre tu navegador y ve a: **https://aws.amazon.com**
2. Haz clic en el boton **"Create an AWS Account"** (esquina superior derecha)

### Paso 2.2: Informacion de la cuenta

1. **Email address**: Tu correo electronico
2. **AWS account name**: `print-shop-production` (o el nombre que prefieras)
3. Haz clic en **"Verify email address"**
4. Revisa tu correo y copia el codigo de verificacion
5. Ingresa el codigo en AWS

### Paso 2.3: Crear contrasena

1. Crea una contrasena segura (minimo 8 caracteres, mayusculas, minusculas, numeros)
2. Haz clic en **"Continue"**

### Paso 2.4: Informacion de contacto

1. Selecciona **"Personal"** o **"Business"**
2. Completa todos los campos:
   - Full name (nombre completo)
   - Phone number (numero de telefono con codigo de pais)
   - Country (pais)
   - Address (direccion)
   - City (ciudad)
   - State/Province (estado/provincia)
   - Postal code (codigo postal)
3. Acepta los terminos y haz clic en **"Continue"**

### Paso 2.5: Informacion de pago

1. Ingresa los datos de tu tarjeta:
   - Numero de tarjeta
   - Fecha de expiracion
   - Nombre del titular
   - CVV
2. Direccion de facturacion
3. Haz clic en **"Verify and Continue"**

> **Nota**: AWS puede hacer un cargo temporal de $1 USD para verificar la tarjeta. Se revierte automaticamente.

### Paso 2.6: Verificacion de identidad

1. Selecciona tu pais
2. Ingresa tu numero de telefono
3. Ingresa el codigo captcha
4. Haz clic en **"Send SMS"** o **"Call me now"**
5. Ingresa el codigo de verificacion recibido

### Paso 2.7: Seleccionar plan de soporte

1. Selecciona **"Basic support - Free"**
2. Haz clic en **"Complete sign up"**

### Paso 2.8: Esperar activacion

1. La cuenta puede tardar unos minutos en activarse
2. Recibiras un correo cuando este lista
3. Haz clic en **"Go to the AWS Management Console"**

### Paso 2.9: Iniciar sesion

1. Selecciona **"Root user"**
2. Ingresa tu correo electronico
3. Ingresa tu contrasena
4. Ya estas dentro de la consola de AWS!

---

## 3. Configurar Presupuesto de $5 USD

> **IMPORTANTE**: Este paso es CRITICO para evitar cargos inesperados.

### Paso 3.1: Acceder a AWS Budgets

1. En la consola de AWS, haz clic en la barra de busqueda superior
2. Escribe **"Budgets"**
3. Haz clic en **"AWS Budgets"**

### Paso 3.2: Crear un presupuesto

1. Haz clic en **"Create a budget"**
2. Selecciona **"Customize (advanced)"**
3. Selecciona **"Cost budget - Recommended"**
4. Haz clic en **"Next"**

### Paso 3.3: Configurar detalles del presupuesto

| Campo | Valor |
|-------|-------|
| Budget name | `print-shop-monthly-budget` |
| Period | Monthly |
| Budget renewal type | Recurring budget |
| Start month | Mes actual |
| Budgeting method | Fixed |
| Budgeted amount | `5.00` |
| Budget scope | All AWS services |

Haz clic en **"Next"**

### Paso 3.4: Configurar alertas

Crearemos 3 alertas:

#### Alerta 1: 50% ($2.50)

1. Haz clic en **"Add an alert threshold"**
2. **Threshold**: `50` %
3. **Trigger**: Actual
4. **Email recipients**: Tu correo electronico

#### Alerta 2: 80% ($4.00)

1. Haz clic en **"Add an alert threshold"**
2. **Threshold**: `80` %
3. **Trigger**: Actual
4. **Email recipients**: Tu correo electronico

#### Alerta 3: 100% ($5.00)

1. Haz clic en **"Add an alert threshold"**
2. **Threshold**: `100` %
3. **Trigger**: Actual
4. **Email recipients**: Tu correo electronico

### Paso 3.5: Revisar y crear

1. Haz clic en **"Next"**
2. Revisa la configuracion
3. Haz clic en **"Create budget"**

Ahora recibiras correos cuando:
- Gastes $2.50 (50%)
- Gastes $4.00 (80%)
- Gastes $5.00 (100%)

---

## 4. Configurar IAM (Usuarios y Permisos)

### Que es IAM?

IAM (Identity and Access Management) gestiona:
- **Usuarios**: Personas que acceden a AWS
- **Roles**: Permisos para servicios de AWS
- **Politicas**: Conjuntos de permisos

> **IMPORTANTE**: NUNCA uses la cuenta Root para tareas diarias.

### Paso 4.1: Acceder a IAM

1. En la consola de AWS, busca **"IAM"**
2. Haz clic en **"IAM"**

### Paso 4.2: Activar MFA para Root (MUY IMPORTANTE)

1. En el dashboard de IAM, busca **"Add MFA for root user"**
2. Haz clic en **"Add MFA"**
3. Selecciona **"Authenticator app"**
4. Haz clic en **"Next"**
5. Instala una app de autenticacion en tu telefono:
   - **Google Authenticator** (iOS/Android)
   - **Microsoft Authenticator** (iOS/Android)
   - **Authy** (iOS/Android)
6. Escanea el codigo QR con la app
7. Ingresa 2 codigos consecutivos de la app
8. Haz clic en **"Add MFA"**

### Paso 4.3: Crear usuario IAM

1. En el menu izquierdo, haz clic en **"Users"**
2. Haz clic en **"Create user"**

### Paso 4.4: Configurar usuario

| Campo | Valor |
|-------|-------|
| User name | `admin-print-shop` |
| Provide user access to console | Si (marcado) |
| User type | I want to create an IAM user |
| Console password | Custom password (crea una segura) |
| Require password reset | No (desmarcado) |

Haz clic en **"Next"**

### Paso 4.5: Asignar permisos

1. Selecciona **"Attach policies directly"**
2. Busca y marca estas politicas:

| Politica | Proposito |
|----------|-----------|
| `AmazonEC2FullAccess` | Gestionar EC2 |
| `AmazonEventBridgeFullAccess` | Scheduler |
| `AWSLambda_FullAccess` | Funciones Lambda |
| `IAMFullAccess` | Gestionar roles |
| `AWSBudgetsActionsWithAWSResourceControlAccess` | Presupuestos |

3. Haz clic en **"Next"**

### Paso 4.6: Revisar y crear

1. Revisa la configuracion
2. Haz clic en **"Create user"**
3. **GUARDA** las credenciales mostradas:
   - Console sign-in URL
   - User name
   - Password

### Paso 4.7: Crear alias de cuenta (opcional)

1. En el dashboard de IAM, busca **"Account Alias"**
2. Haz clic en **"Create"**
3. Ingresa un alias: `print-shop-aws`
4. URL de acceso: `https://print-shop-aws.signin.aws.amazon.com/console`

### Paso 4.8: Cambiar a usuario IAM

1. Cierra sesion de la cuenta Root
2. Ve a la URL del usuario IAM
3. Ingresa las credenciales de `admin-print-shop`
4. **A partir de ahora, usa siempre este usuario**

---

## 5. Crear Security Groups

### Que es un Security Group?

Es un firewall virtual que controla el trafico de entrada y salida de tus instancias EC2.

### Paso 5.1: Acceder a VPC

1. En la consola de AWS, busca **"VPC"**
2. Haz clic en **"VPC"**

### Paso 5.2: Ir a Security Groups

1. En el menu izquierdo, haz clic en **"Security groups"**
2. Haz clic en **"Create security group"**

### Paso 5.3: Configuracion basica

| Campo | Valor |
|-------|-------|
| Security group name | `print-shop-sg` |
| Description | `Security group for Print Shop Generator` |
| VPC | Selecciona la VPC default |

### Paso 5.4: Reglas de entrada (Inbound rules)

Haz clic en **"Add rule"** para cada regla:

| Tipo | Puerto | Origen | Descripcion |
|------|--------|--------|-------------|
| SSH | 22 | My IP | SSH desde mi IP |
| HTTP | 80 | 0.0.0.0/0 | Acceso web publico |
| HTTPS | 443 | 0.0.0.0/0 | Acceso web seguro |

**Para agregar cada regla:**

1. **SSH:**
   - Type: SSH
   - Source type: **My IP** (detecta tu IP automaticamente)
   - Description: `SSH access from my IP`

2. **HTTP:**
   - Type: HTTP
   - Source type: Anywhere-IPv4
   - Description: `HTTP public access`

3. **HTTPS:**
   - Type: HTTPS
   - Source type: Anywhere-IPv4
   - Description: `HTTPS public access`

### Paso 5.5: Reglas de salida (Outbound rules)

Deja la regla por defecto (permite todo el trafico de salida).

### Paso 5.6: Crear el Security Group

1. Revisa la configuracion
2. Haz clic en **"Create security group"**
3. **Anota** el Security Group ID (ejemplo: `sg-0abc123def456789`)

---

## 6. Crear Key Pair para SSH

### Que es un Key Pair?

Es un par de claves criptograficas que permite conectarte de forma segura a tu instancia EC2 sin usar contrasenas.

### Paso 6.1: Acceder a EC2

1. En la consola de AWS, busca **"EC2"**
2. Haz clic en **"EC2"**

### Paso 6.2: Crear Key Pair

1. En el menu izquierdo, bajo **"Network & Security"**, haz clic en **"Key Pairs"**
2. Haz clic en **"Create key pair"**

### Paso 6.3: Configurar Key Pair

| Campo | Valor |
|-------|-------|
| Name | `print-shop-key` |
| Key pair type | RSA |
| Private key file format | `.pem` (para PowerShell/Mac/Linux) |

> Si usas PuTTY en Windows, selecciona `.ppk`

4. Haz clic en **"Create key pair"**

### Paso 6.4: Guardar el archivo

1. El archivo se descarga automaticamente
2. **GUARDA** este archivo en un lugar seguro
3. **NUNCA** compartas este archivo
4. **NUNCA** lo subas a GitHub

### Paso 6.5: Mover a ubicacion segura

**Windows PowerShell:**
```powershell
# Ir a descargas
cd $HOME\Downloads

# Crear carpeta .ssh si no existe
mkdir -p $HOME\.ssh

# Mover archivo
move print-shop-key.pem $HOME\.ssh\
```

**Mac/Linux:**
```bash
# Mover a .ssh
mv ~/Downloads/print-shop-key.pem ~/.ssh/

# Establecer permisos (MUY IMPORTANTE)
chmod 400 ~/.ssh/print-shop-key.pem
```

---

## Checklist de Verificacion

Antes de continuar al siguiente documento, verifica:

- [ ] Cuenta AWS creada y activa
- [ ] Presupuesto de $5 configurado con 3 alertas
- [ ] MFA activado en cuenta Root
- [ ] Usuario IAM `admin-print-shop` creado
- [ ] Iniciaste sesion con usuario IAM (no Root)
- [ ] Security Group `print-shop-sg` creado
- [ ] Key Pair `print-shop-key` creado y guardado

---

## Siguiente Paso

Continua con: **[02 - Lanzar Instancia EC2](02-lanzar-instancia-ec2.md)**
