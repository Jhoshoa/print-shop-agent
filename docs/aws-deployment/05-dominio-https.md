# 05 - Dominio y HTTPS (Opcional)

Este documento cubre como configurar un dominio personalizado y certificado SSL.

**Tiempo estimado:** 30-45 minutos

**Documento anterior:** [04 - Instance Scheduler](04-instance-scheduler.md)

**Siguiente documento:** [06 - Mantenimiento](06-mantenimiento.md)

---

## Opciones Disponibles

| Opcion | Descripcion | Costo |
|--------|-------------|-------|
| Sin dominio | Acceso por IP publica | $0 |
| Dominio externo | Usar dominio que ya tienes | $0 (solo DNS) |
| Route 53 | Comprar dominio en AWS | ~$13/ano (.com) |

---

## El Problema de la IP Dinamica

Cuando la instancia se reinicia, la IP publica **cambia**. Opciones:

| Solucion | Descripcion | Costo |
|----------|-------------|-------|
| Elastic IP | IP fija permanente | ~$3.60/mes cuando apagado |
| **DNS Dinamico** | Actualizar DNS al iniciar | $0.50/mes (Route 53) |
| Ver IP manualmente | Revisar en consola EC2 | $0 |

**Recomendacion:** DNS Dinamico es la mejor opcion para este caso.

---

## Tabla de Contenidos

1. [Opcion A: Sin Dominio](#opcion-a-sin-dominio)
2. [Opcion B: Dominio Existente](#opcion-b-dominio-existente)
3. [Opcion C: Comprar Dominio en Route 53](#opcion-c-comprar-dominio-en-route-53)
4. [Configurar DNS Dinamico](#configurar-dns-dinamico)
5. [Configurar HTTPS](#configurar-https)

---

## Opcion A: Sin Dominio

La forma mas simple: acceder por IP publica.

### Acceder a la aplicacion:

```
http://TU_IP_PUBLICA
```

### Encontrar la IP despues de reinicio:

1. Ve a **EC2** > **Instances**
2. Selecciona tu instancia
3. Copia la **Public IPv4 address**

### Desventaja:

La IP cambia cada vez que la instancia se reinicia (apagado/encendido por scheduler).

---

## Opcion B: Dominio Existente

Si ya tienes un dominio (ej: `midominio.com`):

### Paso 1: Acceder a tu registrador de dominio

Ve al panel de control de tu registrador (GoDaddy, Namecheap, Cloudflare, etc.)

### Paso 2: Crear registro DNS

1. Ve a la seccion de DNS
2. Agrega un registro tipo **A**:

| Campo | Valor |
|-------|-------|
| Name/Host | `printshop` (o el subdominio que quieras) |
| Type | A |
| Value | Tu IP publica de EC2 |
| TTL | 300 (5 minutos) |

Esto creara: `printshop.midominio.com`

### Desventaja:

Deberas actualizar el registro manualmente cada vez que la IP cambie.

**Solucion:** Configura DNS Dinamico (ver seccion abajo).

---

## Opcion C: Comprar Dominio en Route 53

### Paso 1: Ir a Route 53

1. En la consola de AWS, busca **"Route 53"**
2. Haz clic en **"Route 53"**

### Paso 2: Registrar dominio

1. Haz clic en **"Register domain"**
2. Busca el dominio que deseas (ej: `print-shop-app.com`)
3. Verifica disponibilidad
4. Selecciona la extension

**Costos aproximados:**
- `.com`: ~$13/ano
- `.net`: ~$11/ano
- `.click`: ~$3/ano
- `.link`: ~$5/ano

5. Completa la informacion de contacto
6. Acepta los terminos
7. Haz clic en **"Complete Order"**

### Paso 3: Esperar activacion

El registro puede tardar minutos a horas. Recibiras un email cuando este listo.

### Paso 4: Crear registro A

1. Ve a **Route 53** > **Hosted zones**
2. Haz clic en tu dominio
3. Haz clic en **"Create record"**

| Campo | Valor |
|-------|-------|
| Record name | (dejar vacio para dominio raiz, o `app` para subdominio) |
| Record type | A |
| Value | Tu IP publica de EC2 |
| TTL | 300 |

4. Haz clic en **"Create records"**

---

## Configurar DNS Dinamico

Para que el DNS se actualice automaticamente cuando la IP cambie:

### Paso 1: Crear politica IAM

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

**Reemplaza** `TU_HOSTED_ZONE_ID` con el ID de tu zona hospedada (lo encuentras en Route 53 > Hosted zones).

4. **Policy name**: `route53-dynamic-dns-policy`
5. Haz clic en **"Create policy"**

### Paso 2: Crear rol para EC2

1. Ve a **IAM** > **Roles** > **Create role**
2. **Trusted entity**: AWS service
3. **Service**: EC2
4. Haz clic en **Next**
5. Busca y selecciona `route53-dynamic-dns-policy`
6. **Role name**: `ec2-route53-dynamic-dns`
7. Haz clic en **"Create role"**

### Paso 3: Asignar rol a la instancia

1. Ve a **EC2** > **Instances**
2. Selecciona tu instancia
3. Haz clic en **Actions** > **Security** > **Modify IAM role**
4. Selecciona `ec2-route53-dynamic-dns`
5. Haz clic en **"Update IAM role"**

### Paso 4: Crear script en la instancia

Conectate por SSH y ejecuta:

```bash
sudo nano /usr/local/bin/update-dns.sh
```

Pega:

```bash
#!/bin/bash
# ============================================
# Script para actualizar DNS en Route 53
# ============================================

# CONFIGURACION - MODIFICA ESTOS VALORES
HOSTED_ZONE_ID="TU_HOSTED_ZONE_ID"
DOMAIN_NAME="app.tudominio.com"
TTL=300
# ============================================

# Obtener IP publica actual
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

if [ -z "$PUBLIC_IP" ]; then
    echo "Error: No se pudo obtener la IP publica"
    exit 1
fi

echo "$(date): IP Publica: $PUBLIC_IP"
echo "$(date): Dominio: $DOMAIN_NAME"

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

echo "$(date): DNS actualizado correctamente"
```

Guarda y haz ejecutable:

```bash
sudo chmod +x /usr/local/bin/update-dns.sh
```

### Paso 5: Crear servicio systemd

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

### Paso 6: Probar

```bash
sudo /usr/local/bin/update-dns.sh
```

Deberia mostrar que el DNS fue actualizado.

---

## Configurar HTTPS

Para obtener un certificado SSL gratuito con Let's Encrypt:

### Requisito: Tener un dominio configurado

HTTPS requiere un dominio. No funciona solo con IP.

### Paso 1: Instalar Nginx y Certbot

```bash
sudo dnf install -y nginx
sudo dnf install -y certbot python3-certbot-nginx
```

### Paso 2: Configurar Nginx como proxy

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

        # Limite para subida de imagenes
        client_max_body_size 100M;
    }
}
```

### Paso 3: Modificar la aplicacion para usar puerto 8000

**Si usas SIN Docker:**

```bash
sudo nano /etc/systemd/system/print-shop.service
```

Cambia la linea ExecStart:
```ini
ExecStart=/home/ec2-user/print-shop/venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

```bash
sudo systemctl daemon-reload
sudo systemctl restart print-shop
```

**Si usas CON Docker:**

Edita `docker-compose.yml`:
```yaml
ports:
  - "8000:8000"
```

```bash
docker-compose down
docker-compose up -d
```

### Paso 4: Iniciar Nginx

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Paso 5: Obtener certificado SSL

```bash
sudo certbot --nginx -d app.tudominio.com
```

Sigue las instrucciones:
1. Ingresa tu email
2. Acepta los terminos
3. Elige si quieres recibir correos

Certbot configurara automaticamente HTTPS.

### Paso 6: Verificar renovacion automatica

```bash
sudo systemctl status certbot-renew.timer
```

---

## Checklist de Verificacion

- [ ] Dominio registrado/configurado
- [ ] Registro DNS A creado
- [ ] DNS Dinamico configurado (si aplica)
- [ ] Script update-dns.sh creado
- [ ] Servicio update-dns habilitado
- [ ] HTTPS configurado (si aplica)
- [ ] Certificado SSL obtenido

---

## Siguiente Paso

Continua con: **[06 - Mantenimiento](06-mantenimiento.md)**
