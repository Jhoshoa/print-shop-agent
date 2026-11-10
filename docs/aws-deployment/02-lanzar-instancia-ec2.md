# 02 - Lanzar Instancia EC2

Este documento cubre como lanzar y conectarse a una instancia EC2 t4g.small.

**Tiempo estimado:** 15-20 minutos

**Documento anterior:** [01 - Configuracion Inicial AWS](01-configuracion-inicial-aws.md)

**Siguiente documento:**
- [03a - Deployment SIN Docker](03a-deployment-sin-docker.md) (Recomendado)
- [03b - Deployment CON Docker](03b-deployment-con-docker.md)

---

## Tabla de Contenidos

1. [Lanzar Instancia EC2](#1-lanzar-instancia-ec2)
2. [Conectarse a la Instancia](#2-conectarse-a-la-instancia)
3. [Verificar la Instalacion](#3-verificar-la-instalacion)

---

## 1. Lanzar Instancia EC2

### Paso 1.1: Ir a EC2 Dashboard

1. En la consola de AWS, ve a **EC2**
2. Haz clic en **"Launch instance"**

### Paso 1.2: Nombre y etiquetas

1. **Name**: `print-shop-server`
2. Haz clic en **"Add additional tags"**
3. Agrega estas etiquetas:

| Key | Value |
|-----|-------|
| Environment | production |
| Project | print-shop |
| Schedule | print-shop-schedule |

### Paso 1.3: Seleccionar AMI (Sistema Operativo)

1. Selecciona **"Amazon Linux 2023 AMI"**
2. **IMPORTANTE**: Selecciona la arquitectura **"64-bit (Arm)"**

> Las instancias t4g usan procesadores ARM (Graviton), mas economicos y eficientes.

### Paso 1.4: Seleccionar tipo de instancia

1. En **"Instance type"**, haz clic en el dropdown
2. Busca y selecciona **"t4g.small"**

**Especificaciones de t4g.small:**

| Caracteristica | Valor |
|----------------|-------|
| vCPU | 2 (ARM Graviton2) |
| RAM | 2 GB |
| Red | Hasta 5 Gbps |
| Costo | $0.0168/hora |

### Paso 1.5: Configurar Key Pair

1. En **"Key pair (login)"**, selecciona `print-shop-key`

### Paso 1.6: Configurar red

1. En **"Network settings"**, haz clic en **"Edit"**

| Campo | Valor |
|-------|-------|
| VPC | VPC default |
| Subnet | No preference |
| Auto-assign public IP | **Enable** |
| Firewall | Select existing security group |
| Security group | `print-shop-sg` |

### Paso 1.7: Configurar almacenamiento

En **"Configure storage"**:

| Campo | Valor |
|-------|-------|
| Size | `10` GiB |
| Volume type | gp3 |
| IOPS | 3000 (default) |
| Throughput | 125 (default) |

### Paso 1.8: User Data (Configuracion automatica)

1. Expande **"Advanced details"**
2. En **"User data"**, pega UNO de los siguientes scripts:

---

#### Para Deployment SIN Docker (Recomendado):

```bash
#!/bin/bash
# ==================================================
# User Data - Print Shop Generator SIN Docker
# ==================================================

# Actualizar sistema
dnf update -y

# Instalar Python 3.12
dnf install -y python3.12 python3.12-pip python3.12-devel

# Instalar dependencias del sistema
dnf install -y gcc libffi-devel file-libs

# Instalar git
dnf install -y git

# Crear directorio de la aplicacion
mkdir -p /home/ec2-user/print-shop
chown ec2-user:ec2-user /home/ec2-user/print-shop

# Log de finalizacion
echo "Setup SIN Docker completado: $(date)" >> /var/log/user-data.log
```

---

#### Para Deployment CON Docker:

```bash
#!/bin/bash
# ==================================================
# User Data - Print Shop Generator CON Docker
# ==================================================

# Actualizar sistema
dnf update -y

# Instalar Docker
dnf install -y docker

# Iniciar Docker
systemctl start docker
systemctl enable docker

# Agregar usuario al grupo docker
usermod -aG docker ec2-user

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Instalar git
dnf install -y git

# Crear directorio
mkdir -p /home/ec2-user/print-shop
chown ec2-user:ec2-user /home/ec2-user/print-shop

# Log de finalizacion
echo "Setup CON Docker completado: $(date)" >> /var/log/user-data.log
```

---

### Paso 1.9: Revisar y lanzar

1. En **"Summary"**, revisa:

| Campo | Valor esperado |
|-------|----------------|
| Instance type | t4g.small |
| AMI | Amazon Linux 2023 (ARM) |
| Key pair | print-shop-key |
| Security group | print-shop-sg |
| Storage | 10 GiB gp3 |

2. Haz clic en **"Launch instance"**

### Paso 1.10: Esperar que inicie

1. Haz clic en el **Instance ID** para ver los detalles
2. Espera hasta que:
   - **Instance state**: Running (verde)
   - **Status checks**: 2/2 checks passed
3. **Anota la Public IPv4 address** (ejemplo: `54.123.45.67`)

---

## 2. Conectarse a la Instancia

### Metodo 1: SSH desde Terminal (Recomendado)

**Windows PowerShell:**
```powershell
ssh -i "$HOME\.ssh\print-shop-key.pem" ec2-user@TU_IP_PUBLICA
```

**Mac/Linux:**
```bash
ssh -i ~/.ssh/print-shop-key.pem ec2-user@TU_IP_PUBLICA
```

> Reemplaza `TU_IP_PUBLICA` con la IP de tu instancia (ejemplo: `54.123.45.67`)

### Primera conexion

Veras un mensaje como:

```
The authenticity of host '54.123.45.67' can't be established.
ED25519 key fingerprint is SHA256:xxxxx.
Are you sure you want to continue connecting (yes/no)?
```

Escribe `yes` y presiona Enter.

### Metodo 2: EC2 Instance Connect (Alternativa)

1. En la consola de EC2, selecciona tu instancia
2. Haz clic en **"Connect"**
3. Selecciona la pestana **"EC2 Instance Connect"**
4. Haz clic en **"Connect"**
5. Se abre una terminal en el navegador

---

## 3. Verificar la Instalacion

Una vez conectado, ejecuta estos comandos:

### Verificar que el User Data termino:

```bash
cat /var/log/user-data.log
```

Deberia mostrar: `Setup completado: [fecha]`

Si no aparece, espera 1-2 minutos y verifica de nuevo:

```bash
sudo tail -f /var/log/cloud-init-output.log
```

### Verificar sistema:

```bash
# Espacio en disco
df -h

# Memoria
free -h

# Arquitectura (deberia ser aarch64)
uname -m
```

### Si elegiste SIN Docker:

```bash
# Verificar Python
python3.12 --version

# Verificar git
git --version
```

### Si elegiste CON Docker:

```bash
# Verificar Docker
docker --version

# Verificar Docker Compose
docker-compose --version

# Verificar que puedes ejecutar Docker sin sudo
docker run hello-world
```

> Si `docker run` falla con "permission denied", cierra la sesion SSH y reconectate para que el grupo surta efecto.

---

## Problemas Comunes

### "Permission denied" al conectar por SSH

```bash
# En Mac/Linux, verificar permisos del key
chmod 400 ~/.ssh/print-shop-key.pem
```

### "Connection timed out"

1. Verifica que la instancia este en estado "Running"
2. Verifica que el Security Group tenga la regla SSH
3. Verifica que tu IP no haya cambiado (actualiza la regla SSH)

### User Data no se ejecuto

```bash
# Ver logs de cloud-init
sudo cat /var/log/cloud-init-output.log

# Ejecutar manualmente si es necesario
sudo dnf update -y
# ... resto de comandos del User Data
```

---

## Checklist de Verificacion

- [ ] Instancia EC2 en estado "Running"
- [ ] Status checks: 2/2 passed
- [ ] IP publica anotada
- [ ] Conexion SSH funcionando
- [ ] User Data ejecutado correctamente
- [ ] Python 3.12 instalado (si elegiste sin Docker)
- [ ] Docker instalado (si elegiste con Docker)

---

## Siguiente Paso

Elige UNA opcion:

- **Recomendado:** [03a - Deployment SIN Docker](03a-deployment-sin-docker.md)
- **Alternativa:** [03b - Deployment CON Docker](03b-deployment-con-docker.md)
