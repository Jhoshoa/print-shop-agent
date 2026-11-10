# 03b - Deployment CON Docker

Este documento cubre el deployment de Print Shop Generator usando Docker y docker-compose.

**Tiempo estimado:** 20-30 minutos

**Documento anterior:** [02 - Lanzar Instancia EC2](02-lanzar-instancia-ec2.md)

**Siguiente documento:** [04 - Instance Scheduler](04-instance-scheduler.md)

---

## Cuando Usar Docker?

| Ventaja | Descripcion |
|---------|-------------|
| Aislamiento | Ambiente completamente aislado del host |
| Reproducibilidad | Mismo resultado en cualquier servidor |
| Rollback | Facil volver a version anterior |
| Multi-servicio | Ideal si tienes multiples contenedores |

> **Nota:** Para este proyecto simple, la opcion sin Docker es mas eficiente. Usa Docker si ya tienes experiencia con el o si planeas escalar.

---

## Tabla de Contenidos

1. [Conectarse a la Instancia](#1-conectarse-a-la-instancia)
2. [Verificar Docker](#2-verificar-docker)
3. [Subir el Codigo](#3-subir-el-codigo)
4. [Construir y Ejecutar](#4-construir-y-ejecutar)
5. [Crear Servicio Systemd](#5-crear-servicio-systemd)
6. [Verificar Funcionamiento](#6-verificar-funcionamiento)

---

## 1. Conectarse a la Instancia

```bash
ssh -i ~/.ssh/print-shop-key.pem ec2-user@TU_IP_PUBLICA
```

---

## 2. Verificar Docker

```bash
# Verificar Docker
docker --version
# Esperado: Docker version 2x.x.x

# Verificar Docker Compose
docker-compose --version
# Esperado: Docker Compose version v2.x.x

# Verificar que puedes ejecutar sin sudo
docker run hello-world
```

Si Docker no esta instalado:

```bash
sudo dnf install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Cerrar sesion y reconectar
exit
```

Reconecta por SSH y luego instala Docker Compose:

```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
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
# 1. Comprimir el proyecto
cd C:\Users\josoe\Documents\print-shop-agent

tar -czvf print-shop.tar.gz `
    --exclude='.git' `
    --exclude='venv' `
    --exclude='output/*' `
    --exclude='__pycache__' `
    --exclude='*.pyc' `
    .

# 2. Subir al servidor
scp -i "$HOME\.ssh\print-shop-key.pem" print-shop.tar.gz ec2-user@TU_IP:/home/ec2-user/
```

**En el servidor:**

```bash
cd ~
mkdir -p print-shop
cd print-shop
tar -xzvf ../print-shop.tar.gz
rm ../print-shop.tar.gz
```

---

## 4. Construir y Ejecutar

### Paso 4.1: Verificar docker-compose.yml

El archivo ya tiene la configuracion correcta:

```bash
cat ~/print-shop/docker-compose.yml
```

Deberia mostrar:

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
```

> **Nota:** Las variables de entorno ya estan en docker-compose.yml. No necesitas crear un archivo .env.

### Paso 4.2: Construir la imagen

```bash
cd ~/print-shop

# Construir (toma 2-5 minutos la primera vez)
docker-compose build
```

### Paso 4.3: Iniciar el contenedor

```bash
# Iniciar en segundo plano
docker-compose up -d

# Verificar estado
docker-compose ps
```

Deberia mostrar:

```
NAME              STATUS    PORTS
print-shop-app    Up        0.0.0.0:80->8000/tcp
```

### Paso 4.4: Ver logs

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Presiona Ctrl+C para salir
```

---

## 5. Crear Servicio Systemd

Para que Docker inicie automaticamente cuando la instancia arranque:

### Paso 5.1: Crear archivo de servicio

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

Guarda con `Ctrl+O`, Enter, `Ctrl+X`.

### Paso 5.2: Activar el servicio

```bash
sudo systemctl daemon-reload
sudo systemctl enable print-shop
```

> **Nota:** No necesitas `start` porque el contenedor ya esta corriendo.

---

## 6. Verificar Funcionamiento

### Ver estado del contenedor:

```bash
docker-compose ps
```

### Ver logs:

```bash
docker-compose logs -f
```

### Probar desde el navegador:

Abre tu navegador y ve a:

```
http://TU_IP_PUBLICA
```

### Probar la API:

```bash
curl http://TU_IP_PUBLICA/api/health
```

---

## Comandos Utiles

```bash
# Ver contenedores
docker ps

# Ver logs en tiempo real
docker-compose logs -f

# Ver ultimos 100 logs
docker-compose logs --tail=100

# Reiniciar contenedor
docker-compose restart

# Detener contenedor
docker-compose down

# Reconstruir (despues de cambios en codigo)
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Ver uso de recursos
docker stats

# Entrar al contenedor
docker exec -it print-shop-app bash

# Limpiar imagenes no usadas
docker system prune -af
```

---

## Actualizar la Aplicacion

```bash
cd ~/print-shop

# Si usas git
git pull

# Reconstruir y reiniciar
docker-compose down
docker-compose build
docker-compose up -d
```

---

## Problemas Comunes

### Error: "permission denied" al ejecutar docker

```bash
# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Cerrar sesion y reconectar
exit
```

### Error: "port 80 already in use"

```bash
# Ver que esta usando el puerto 80
sudo lsof -i :80

# Si es otro proceso, matarlo
sudo kill -9 <PID>

# Reiniciar contenedor
docker-compose up -d
```

### Error: "image not found" o "build failed"

```bash
# Reconstruir sin cache
docker-compose build --no-cache

# Iniciar
docker-compose up -d
```

### El contenedor se reinicia constantemente

```bash
# Ver logs para encontrar el error
docker-compose logs --tail=50
```

### La pagina no carga

1. Verificar que el contenedor esta corriendo:
   ```bash
   docker ps
   ```

2. Verificar el puerto 80 en Security Group

3. Ver logs:
   ```bash
   docker-compose logs
   ```

---

## Volumenes de Docker

Los datos se persisten en volumenes de Docker:

```bash
# Ver volumenes
docker volume ls

# Ver ubicacion de volumenes
docker volume inspect print_shop_output
docker volume inspect print_shop_logs
```

Los archivos estan en: `/var/lib/docker/volumes/print_shop_output/_data/`

### Backup de documentos:

```bash
# Crear backup
docker run --rm \
  -v print_shop_output:/data \
  -v ~/backups:/backup \
  alpine tar czf /backup/output-$(date +%Y%m%d).tar.gz /data
```

---

## Checklist de Verificacion

- [ ] Docker instalado y funcionando
- [ ] Docker Compose instalado
- [ ] Codigo subido a ~/print-shop
- [ ] Imagen construida exitosamente
- [ ] Contenedor corriendo
- [ ] Servicio systemd creado
- [ ] Aplicacion accesible en http://TU_IP

---

## Siguiente Paso

Continua con: **[04 - Instance Scheduler](04-instance-scheduler.md)**
