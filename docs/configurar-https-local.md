# Configurar HTTPS Local con mkcert

Esta guía explica cómo configurar HTTPS para el entorno de desarrollo local usando **mkcert**, una herramienta que genera certificados localmente confiables.

## Tabla de Contenidos

- [Requisitos](#requisitos)
- [Instalación de mkcert](#instalación-de-mkcert)
- [Generar Certificados](#generar-certificados)
- [Configurar Docker](#configurar-docker)
- [Configurar archivo hosts](#configurar-archivo-hosts)
- [Verificar funcionamiento](#verificar-funcionamiento)
- [Notas por Sistema Operativo](#notas-por-sistema-operativo)
- [Automatización](#automatización)

---

## Requisitos

- Docker Desktop instalado
- Permisos de administrador (para instalar CA root)
- Acceso a internet (para descargar mkcert)

---

## Instalación de mkcert

### Windows (con Chocolatey)

```powershell
# Instalar Chocolatey si no lo tienes (ejecutar como Admin)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocolType::Tls12; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar mkcert
choco install mkcert -y
```

### Windows (con Scoop)

```powershell
# Instalar Scoop si no lo tienes
irm get.scoop.sh | iex

# Instalar mkcert
scoop install mkcert
```

### Windows (Descarga manual)

1. Descargar desde: https://github.com/FiloSottile/mkcert/releases
2. Descargar `mkcert-vX.X.X-windows-amd64.exe`
3. Renombrar a `mkcert.exe`
4. Mover a una carpeta en el PATH (ej: `C:\Windows\System32`)

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install libnss3-tools
sudo apt install mkcert
```

### Linux (con Homebrew)

```bash
brew install mkcert
brew install nss # si usas Firefox
```

### macOS

```bash
brew install mkcert
brew install nss # si usas Firefox
```

---

## Generar Certificados

### Paso 1: Instalar CA Root (solo una vez)

Este comando instala el certificado raíz en el sistema para que los certificados generados sean confiables:

```bash
mkcert -install
```

> **Nota:** Requiere permisos de administrador. En Windows, aparecerá un diálogo de confirmación.

### Paso 2: Crear carpeta para certificados

```bash
# Desde la raíz del proyecto
mkdir -p certs
cd certs
```

### Paso 3: Generar certificados para el dominio

```bash
mkcert -key-file key.pem -cert-file cert.pem print-shop-agent.com localhost 127.0.0.1
```

Este comando genera:
- `cert.pem` - Certificado público
- `key.pem` - Clave privada

El certificado es válido para:
- `print-shop-agent.com`
- `localhost`
- `127.0.0.1`

---

## Configurar Docker

### Paso 1: Crear configuración de nginx con SSL

Crear archivo `nginx/nginx-ssl.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name print-shop-agent.com localhost;
        return 301 https://$host$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl;
        server_name print-shop-agent.com localhost;

        ssl_certificate /etc/nginx/certs/cert.pem;
        ssl_certificate_key /etc/nginx/certs/key.pem;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        client_max_body_size 100M;

        location / {
            proxy_pass http://app:8000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 300s;
        }
    }
}
```

### Paso 2: Crear docker-compose-ssl.yml

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
    volumes:
      - print_shop_output:/app/backend/output
      - print_shop_logs:/app/backend/logs
    networks:
      - print_shop_network
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  nginx:
    image: nginx:alpine
    container_name: print-shop-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx-ssl.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      app:
        condition: service_healthy
    networks:
      - print_shop_network

volumes:
  print_shop_output:
    name: print_shop_output
  print_shop_logs:
    name: print_shop_logs

networks:
  print_shop_network:
    name: print_shop_network
```

### Paso 3: Ejecutar con SSL

```bash
docker-compose -f docker-compose-ssl.yml up -d
```

---

## Configurar archivo hosts

El archivo hosts **NO necesita cambios** para HTTPS. La entrada existente funciona tanto para HTTP como HTTPS:

```
127.0.0.1 print-shop-agent.com
```

El archivo hosts solo traduce el dominio a IP. El protocolo (http/https) lo determina el puerto:
- Puerto 80 → HTTP
- Puerto 443 → HTTPS

---

## Verificar funcionamiento

### 1. Verificar certificado instalado

```bash
mkcert -CAROOT
# Muestra la carpeta donde está el CA root
```

### 2. Probar HTTPS

Abrir en el navegador:
- https://print-shop-agent.com
- https://localhost

Debe mostrar el candado verde sin advertencias.

### 3. Verificar certificado en el navegador

1. Click en el candado 🔒
2. Ver "Certificado"
3. Debe decir "Emitido por: mkcert"

---

## Notas por Sistema Operativo

### Windows

| Navegador | Soporte automático | Notas |
|-----------|-------------------|-------|
| Chrome | ✅ Sí | Usa el almacén de Windows |
| Edge | ✅ Sí | Usa el almacén de Windows |
| Firefox | ⚠️ Manual | Requiere importar certificado manualmente |
| Brave | ✅ Sí | Usa el almacén de Windows |

**Para Firefox en Windows:**
1. Abrir Firefox → Configuración → Privacidad y Seguridad
2. Sección "Certificados" → Ver certificados
3. Pestaña "Autoridades" → Importar
4. Seleccionar el archivo `rootCA.pem` de la carpeta que muestra `mkcert -CAROOT`

### Linux

| Distribución | Comando adicional |
|--------------|-------------------|
| Ubuntu/Debian | `sudo apt install libnss3-tools` |
| Fedora | `sudo dnf install nss-tools` |
| Arch | `sudo pacman -S nss` |

### macOS

Funciona automáticamente con Safari y Chrome después de `mkcert -install`.

Para Firefox, usar el mismo proceso manual que en Windows.

---

## Automatización

### ¿Conviene crear un script?

**Sí**, es conveniente para:
1. Simplificar el proceso para nuevos desarrolladores
2. Evitar errores en los comandos
3. Verificar requisitos automáticamente

### Lo que el script debería hacer:

1. Verificar si mkcert está instalado
2. Ejecutar `mkcert -install` si es necesario
3. Crear carpeta `certs/`
4. Generar certificados
5. Crear/actualizar configuración de nginx
6. Reiniciar contenedores con SSL

### Lo que NO puede automatizar:

1. Instalación de mkcert (requiere package manager específico)
2. Confirmación de Windows para instalar CA root (requiere interacción del usuario)
3. Configuración manual de Firefox

---

## Resumen de Comandos

```bash
# 1. Instalar mkcert (Windows con Chocolatey)
choco install mkcert -y

# 2. Instalar CA root (solo una vez, requiere admin)
mkcert -install

# 3. Generar certificados
mkdir -p certs
cd certs
mkcert -key-file key.pem -cert-file cert.pem print-shop-agent.com localhost 127.0.0.1

# 4. Levantar con SSL
docker-compose -f docker-compose-ssl.yml up -d

# 5. Acceder
# https://print-shop-agent.com
```

---

## Troubleshooting

### Error: "mkcert no se reconoce como comando"
- Verificar que mkcert esté en el PATH
- Reiniciar la terminal después de instalar

### Error: "permission denied" al instalar CA
- Ejecutar como administrador (Windows)
- Usar `sudo` (Linux/Mac)

### El navegador sigue mostrando "No seguro"
1. Verificar que `mkcert -install` se ejecutó correctamente
2. Limpiar caché del navegador
3. Reiniciar el navegador
4. Verificar que los certificados existen en `certs/`

### Firefox no reconoce el certificado
- Importar manualmente el CA root (ver sección de Windows)

---

## Archivos generados

Después de la configuración, tendrás:

```
print-shop-agent/
├── certs/
│   ├── cert.pem          # Certificado público
│   └── key.pem           # Clave privada (NO compartir)
├── nginx/
│   └── nginx-ssl.conf    # Configuración nginx con SSL
└── docker-compose-ssl.yml # Docker compose con HTTPS
```

> **Importante:** Agregar `certs/` al `.gitignore` para no subir las claves privadas al repositorio.
