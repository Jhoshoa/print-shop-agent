# 06 - Mantenimiento

Este documento contiene comandos utiles, monitoreo y solucion de problemas.

---

## Tabla de Contenidos

1. [Conexion SSH](#1-conexion-ssh)
2. [Comandos del Servicio](#2-comandos-del-servicio)
3. [Ver Logs](#3-ver-logs)
4. [Actualizar la Aplicacion](#4-actualizar-la-aplicacion)
5. [Backups](#5-backups)
6. [Monitoreo](#6-monitoreo)
7. [Troubleshooting](#7-troubleshooting)
8. [Costos](#8-costos)

---

## 1. Conexion SSH

```bash
ssh -i ~/.ssh/print-shop-key.pem ec2-user@TU_IP_PUBLICA
```

**Encontrar IP actual:**

1. Ve a **EC2** > **Instances**
2. Copia la **Public IPv4 address**

---

## 2. Comandos del Servicio

### Sin Docker

```bash
# Ver estado
sudo systemctl status print-shop

# Iniciar
sudo systemctl start print-shop

# Detener
sudo systemctl stop print-shop

# Reiniciar
sudo systemctl restart print-shop

# Ver si esta habilitado al inicio
sudo systemctl is-enabled print-shop
```

### Con Docker

```bash
# Ver contenedores
docker ps

# Ver estado
docker-compose ps

# Iniciar
docker-compose up -d

# Detener
docker-compose down

# Reiniciar
docker-compose restart

# Ver uso de recursos
docker stats
```

---

## 3. Ver Logs

### Sin Docker

```bash
# Logs en tiempo real (systemd)
sudo journalctl -u print-shop -f

# Ultimos 100 logs
sudo journalctl -u print-shop -n 100

# Logs desde hace 1 hora
sudo journalctl -u print-shop --since "1 hour ago"

# Logs del archivo
tail -f ~/print-shop/backend/logs/app.log
tail -f ~/print-shop/backend/logs/error.log

# Ultimas 50 lineas
tail -50 ~/print-shop/backend/logs/error.log
```

### Con Docker

```bash
# Logs en tiempo real
docker-compose logs -f

# Ultimas 100 lineas
docker-compose logs --tail=100

# Solo errores
docker-compose logs 2>&1 | grep -i error
```

---

## 4. Actualizar la Aplicacion

### Sin Docker

```bash
cd ~/print-shop

# Si usas git
git pull

# Reinstalar dependencias (si cambiaron)
source venv/bin/activate
pip install -r requirements.txt

# Reiniciar
sudo systemctl restart print-shop

# Verificar
sudo systemctl status print-shop
```

### Con Docker

```bash
cd ~/print-shop

# Si usas git
git pull

# Reconstruir imagen
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Verificar
docker-compose ps
```

---

## 5. Backups

### Sin Docker

```bash
# Crear directorio de backups
mkdir -p ~/backups

# Backup de documentos generados
tar czf ~/backups/output-$(date +%Y%m%d).tar.gz ~/print-shop/backend/output/

# Backup de logs
tar czf ~/backups/logs-$(date +%Y%m%d).tar.gz ~/print-shop/backend/logs/

# Ver backups
ls -la ~/backups/
```

### Con Docker

```bash
mkdir -p ~/backups

# Backup de documentos
docker run --rm \
  -v print_shop_output:/data \
  -v ~/backups:/backup \
  alpine tar czf /backup/output-$(date +%Y%m%d).tar.gz -C /data .

# Ver backups
ls -la ~/backups/
```

### Restaurar backup

```bash
# Sin Docker
cd ~/print-shop/backend
tar xzf ~/backups/output-YYYYMMDD.tar.gz

# Con Docker
docker run --rm \
  -v print_shop_output:/data \
  -v ~/backups:/backup \
  alpine tar xzf /backup/output-YYYYMMDD.tar.gz -C /data
```

---

## 6. Monitoreo

### Uso de recursos del sistema

```bash
# CPU y memoria en tiempo real
top

# Mejor visualizacion (instalar si no existe)
sudo dnf install -y htop
htop

# Memoria
free -h

# Espacio en disco
df -h

# Procesos de Python
ps aux | grep python
```

### Verificar conectividad

```bash
# Probar API
curl http://localhost/api/health

# Probar desde afuera
curl http://TU_IP/api/health
```

### CloudWatch (Opcional)

1. Ve a **CloudWatch** > **Metrics** > **EC2**
2. Selecciona tu instancia
3. Ve metricas de CPU, Red, Disco

---

## 7. Troubleshooting

### La aplicacion no responde

1. **Verificar servicio:**
   ```bash
   # Sin Docker
   sudo systemctl status print-shop

   # Con Docker
   docker-compose ps
   ```

2. **Ver logs de errores:**
   ```bash
   # Sin Docker
   sudo journalctl -u print-shop -n 50

   # Con Docker
   docker-compose logs --tail=50
   ```

3. **Reiniciar servicio:**
   ```bash
   # Sin Docker
   sudo systemctl restart print-shop

   # Con Docker
   docker-compose restart
   ```

### No puedo conectar por SSH

1. **Verificar que la instancia esta corriendo** en la consola EC2

2. **Verificar tu IP:**
   - Tu IP puede haber cambiado
   - Actualiza la regla SSH en Security Group

3. **Verificar permisos del key:**
   ```bash
   chmod 400 ~/.ssh/print-shop-key.pem
   ```

### El scheduler no funciona

1. **Verificar schedules en EventBridge:**
   - Ve a EventBridge > Schedules
   - Ambos deben estar "Enabled"

2. **Probar Lambda manualmente:**
   - Ve a Lambda > tu funcion > Test

3. **Ver logs de Lambda:**
   - Ve a CloudWatch > Log groups
   - Busca `/aws/lambda/start-print-shop-instance`

### Error de memoria

```bash
# Ver memoria disponible
free -h

# Ver procesos que mas memoria usan
ps aux --sort=-%mem | head -10
```

**Soluciones:**
- Reiniciar el servicio
- Considerar upgrade a t4g.medium (4 GB RAM)

### Error "Port 80 already in use"

```bash
# Ver que usa el puerto 80
sudo lsof -i :80

# Matar proceso
sudo kill -9 <PID>

# Reiniciar servicio
sudo systemctl restart print-shop
```

### Error de permisos en output/

```bash
# Sin Docker
sudo chown -R ec2-user:ec2-user ~/print-shop/backend/output/
sudo chmod -R 755 ~/print-shop/backend/output/
```

---

## 8. Costos

### Verificar costos actuales

1. Ve a **AWS Cost Explorer**
2. O busca **"Billing"** en la consola

### Desglose esperado

| Servicio | Costo/mes |
|----------|-----------|
| EC2 t4g.small (97.5 horas) | $1.64 |
| EBS gp3 (10 GB) | $0.80 |
| Lambda | $0.00 |
| EventBridge | $0.00 |
| Route 53 (opcional) | $0.50 |
| **TOTAL** | **~$2.50-3.00** |

### Alertas de presupuesto

Deberias recibir emails cuando alcances:
- 50% ($2.50)
- 80% ($4.00)
- 100% ($5.00)

---

## Comandos de Referencia Rapida

### Conexion
```bash
ssh -i ~/.ssh/print-shop-key.pem ec2-user@IP
```

### Sin Docker
```bash
sudo systemctl status print-shop    # Estado
sudo systemctl restart print-shop   # Reiniciar
sudo journalctl -u print-shop -f    # Logs
```

### Con Docker
```bash
docker-compose ps          # Estado
docker-compose restart     # Reiniciar
docker-compose logs -f     # Logs
```

### Sistema
```bash
free -h                    # Memoria
df -h                      # Disco
htop                       # Procesos
```

### EC2 Metadata
```bash
# IP publica
curl http://169.254.169.254/latest/meta-data/public-ipv4

# Instance ID
curl http://169.254.169.254/latest/meta-data/instance-id

# Region
curl http://169.254.169.254/latest/meta-data/placement/region
```

---

## Checklist de Mantenimiento Periodico

### Semanal
- [ ] Verificar que el scheduler funciona
- [ ] Revisar logs por errores
- [ ] Verificar espacio en disco

### Mensual
- [ ] Revisar costos en AWS Billing
- [ ] Crear backup de documentos
- [ ] Actualizar sistema: `sudo dnf update -y`

### Cuando hay cambios
- [ ] Probar cambios localmente primero
- [ ] Hacer backup antes de actualizar
- [ ] Verificar que todo funciona despues de actualizar
