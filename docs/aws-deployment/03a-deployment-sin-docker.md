# 03a - Deployment SIN Docker (Recomendado)

Este documento cubre el deployment de Print Shop Generator usando Python directamente, sin Docker.

**Tiempo estimado:** 20-30 minutos

**Documento anterior:** [02 - Lanzar Instancia EC2](02-lanzar-instancia-ec2.md)

**Siguiente documento:** [04 - Instance Scheduler](04-instance-scheduler.md)

---

## Por que Sin Docker?

| Aspecto | Sin Docker | Con Docker |
|---------|------------|------------|
| **Uso de RAM** | ~200-400 MB | ~400-600 MB |
| **Tiempo de inicio** | ~5 segundos | ~15-30 segundos |
| **Complejidad** | Simple | Media |
| **Depuracion** | Facil | Requiere docker logs |

Para una instancia t4g.small (2 GB RAM), sin Docker es la mejor opcion.

---

## Tabla de Contenidos

1. [Conectarse a la Instancia](#1-conectarse-a-la-instancia)
2. [Verificar Requisitos](#2-verificar-requisitos)
3. [Subir el Codigo](#3-subir-el-codigo)
4. [Crear Entorno Virtual](#4-crear-entorno-virtual)
5. [Instalar Dependencias](#5-instalar-dependencias)
6. [Configurar Variables de Entorno](#6-configurar-variables-de-entorno)
7. [Probar la Aplicacion](#7-probar-la-aplicacion)
8. [Crear Servicio Systemd](#8-crear-servicio-systemd)
9. [Verificar Funcionamiento](#9-verificar-funcionamiento)

---

## 1. Conectarse a la Instancia

```bash
ssh -i ~/.ssh/print-shop-key.pem ec2-user@TU_IP_PUBLICA
```

---

## 2. Verificar Requisitos

```bash
# Verificar Python
python3.12 --version
# Esperado: Python 3.12.x

# Verificar git
git --version
# Esperado: git version 2.x.x
```

Si Python no esta instalado:

```bash
sudo dnf install -y python3.12 python3.12-pip python3.12-devel
sudo dnf install -y gcc libffi-devel file-libs
```

---

## 3. Subir el Codigo

### Opcion A: Clonar desde GitHub

```bash
cd ~
git clone https://github.com/TU_USUARIO/print-shop-agent.git print-shop
cd print-shop
```

### Opcion B: Subir manualmente con SCP

**Desde tu computadora local (PowerShell):**

```powershell
# 1. Comprimir el proyecto (excluir archivos innecesarios)
cd C:\Users\josoe\Documents\print-shop-agent

# Crear archivo comprimido
tar -czvf print-shop.tar.gz `
    --exclude='.git' `
    --exclude='venv' `
    --exclude='output/*' `
    --exclude='__pycache__' `
    --exclude='*.pyc' `
    --exclude='.env' `
    .

# 2. Subir al servidor
scp -i "$HOME\.ssh\print-shop-key.pem" print-shop.tar.gz ec2-user@TU_IP:/home/ec2-user/
```

**Luego en el servidor:**

```bash
cd ~
mkdir -p print-shop
cd print-shop
tar -xzvf ../print-shop.tar.gz
rm ../print-shop.tar.gz
```

---

## 4. Crear Entorno Virtual

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

---

## 5. Instalar Dependencias

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

Esto tomara 1-2 minutos.

---

## 6. Configurar Variables de Entorno

Crear el archivo `.env` en el directorio `backend/`:

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

---

## 7. Probar la Aplicacion

### Crear directorios necesarios:

```bash
mkdir -p ~/print-shop/backend/output
mkdir -p ~/print-shop/backend/logs
```

### Probar que funciona:

```bash
cd ~/print-shop/backend
source ../venv/bin/activate

# Iniciar en puerto 8000 para prueba (no requiere root)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**En otra terminal o desde tu navegador:**

```bash
# Probar el health endpoint
curl http://localhost:8000/api/health
```

Deberia responder con JSON indicando que esta funcionando.

Presiona `Ctrl+C` para detener.

---

## 8. Crear Servicio Systemd

### Paso 8.1: Crear archivo de servicio

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

Guarda con `Ctrl+O`, Enter, `Ctrl+X`.

### Paso 8.2: Activar y arrancar el servicio

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

Deberia mostrar: `Active: active (running)`

---

## 9. Verificar Funcionamiento

### Verificar el servicio:

```bash
sudo systemctl status print-shop
```

### Ver logs en tiempo real:

```bash
sudo journalctl -u print-shop -f
```

### Probar desde el navegador:

Abre tu navegador y ve a:

```
http://TU_IP_PUBLICA
```

Deberia cargar la interfaz de Print Shop Generator.

### Probar la API:

```bash
curl http://TU_IP_PUBLICA/api/health
```

---

## Comandos Utiles

```bash
# Ver estado del servicio
sudo systemctl status print-shop

# Reiniciar el servicio
sudo systemctl restart print-shop

# Detener el servicio
sudo systemctl stop print-shop

# Ver ultimos 100 logs
sudo journalctl -u print-shop -n 100

# Ver logs del archivo
tail -f ~/print-shop/backend/logs/app.log
tail -f ~/print-shop/backend/logs/error.log

# Actualizar codigo (si usas git)
cd ~/print-shop
git pull
sudo systemctl restart print-shop
```

---

## Problemas Comunes

### Error: "Permission denied" en puerto 80

El puerto 80 requiere permisos de root. El servicio systemd ya corre como root.

Si necesitas probar manualmente en puerto 80:

```bash
sudo /home/ec2-user/print-shop/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 80
```

### Error: "Module not found"

```bash
cd ~/print-shop
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart print-shop
```

### Error en logs: "output directory not found"

```bash
mkdir -p ~/print-shop/backend/output
mkdir -p ~/print-shop/backend/logs
sudo systemctl restart print-shop
```

### La pagina no carga

1. Verificar que el servicio esta corriendo:
   ```bash
   sudo systemctl status print-shop
   ```

2. Verificar que el puerto 80 esta abierto en Security Group

3. Verificar los logs:
   ```bash
   sudo journalctl -u print-shop -n 50
   ```

---

## Checklist de Verificacion

- [ ] Codigo subido a ~/print-shop
- [ ] Entorno virtual creado y activado
- [ ] Dependencias instaladas
- [ ] Archivo .env creado en backend/
- [ ] Directorios output/ y logs/ creados
- [ ] Servicio systemd creado
- [ ] Servicio activo y corriendo
- [ ] Aplicacion accesible en http://TU_IP

---

## Siguiente Paso

Continua con: **[04 - Instance Scheduler](04-instance-scheduler.md)**
