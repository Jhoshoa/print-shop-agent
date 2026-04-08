# Print Shop Generator

Aplicación web local para generar documentos Word (.docx) a partir de imágenes, optimizada para impresión en tiendas de impresión/papelerías.

## Descripción

Esta herramienta permite:
- Cargar múltiples imágenes (drag & drop, click, o Ctrl+V)
- Reordenar las imágenes arrastrándolas
- Configurar el layout del documento (tamaño de página, orientación, márgenes, etc.)
- Generar un documento Word listo para imprimir
- Mantener un historial de documentos generados

## Capturas de Pantalla

```
┌────────────────────────────────────────────────┐
│  📄 Generador de Documentos                    │
│     Arrastra tus imágenes y genera documentos  │
├────────────────────────────────────────────────┤
│                                                │
│     ┌──────────────────────────────────┐      │
│     │                                  │      │
│     │    Arrastra las imágenes aquí    │      │
│     │    o haz clic para seleccionar   │      │
│     │                                  │      │
│     └──────────────────────────────────┘      │
│                                                │
│  🖼️ Imágenes cargadas: 8                       │
│  ┌────┬────┬────┬────┬────┬────┬────┬────┐   │
│  │ 1  │ 2  │ 3  │ 4  │ 5  │ 6  │ 7  │ 8  │   │
│  └────┴────┴────┴────┴────┴────┴────┴────┘   │
│                                                │
│  ⚙️ Opciones: CARTA V · 10cm                   │
│                                                │
│  [      Generar Documento (8 imágenes)      ]  │
│                                                │
└────────────────────────────────────────────────┘
```

## Requisitos del Sistema

### Opción 1: Docker (Recomendado)
- Docker Desktop
- 200MB de espacio en disco

### Opción 2: Instalación Local
- Python 3.10 o superior
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- 100MB de espacio en disco

## Instalación Rápida

```bash
# 1. Clonar o descargar el proyecto
cd print-shop-agent

# 2. Crear entorno virtual
python -m venv venv

# 3. Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 4. Instalar dependencias
pip install -r requirements.txt
```

## Ejecución

### Inicio Rápido

```bash
# Windows
scripts\start.bat

# Linux/Mac
./scripts/start.sh
```

### Manual

```bash
# Activar entorno virtual
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Iniciar servidor
cd backend
python -m uvicorn app.main:app --reload
```

Abrir en el navegador: **http://localhost:8000**

## Docker

### Ejecutar con Docker Compose

La forma más sencilla de ejecutar la aplicación es usando Docker:

```bash
# Construir e iniciar los contenedores
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down

# Verificar archivos generados en el contenedor
docker exec print-shop-app sh -c "ls -la /app/backend/output/"
```

> **Nota:** Al iniciar el contenedor, se borran automáticamente los archivos `.docx` anteriores de la carpeta output.

Acceder en: **http://localhost** (puerto 80)

### Configurar Dominio Local (Opcional)

Para acceder mediante `http://print-shop-agent.com`:

1. Abrir **PowerShell como Administrador**
2. Ejecutar:
```powershell
cd C:\Users\<username>\Documents\print-shop-agent\scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
.\add-hosts-entry.ps1
```

El script `add-hosts-entry.ps1`:
- Agrega `127.0.0.1 print-shop-agent.com` al archivo hosts de Windows
- Limpia el cache DNS automáticamente
- Verifica permisos de administrador

### Docker Hub

```bash
# Descargar y ejecutar desde Docker Hub
docker pull <username>/print-shop-generator:latest
docker run -d -p 80:8000 <username>/print-shop-generator:latest
```

## Uso

1. **Cargar imágenes**: Arrastra archivos al área de carga, haz clic para seleccionar, o usa Ctrl+V para pegar
2. **Reordenar**: Arrastra las miniaturas para cambiar el orden
3. **Configurar**: Ajusta el tamaño de página, orientación, márgenes, etc.
4. **Generar**: Haz clic en "Generar Documento" o presiona Ctrl+Enter
5. **Descargar**: El documento se descarga automáticamente

## Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `O` | Abrir selector de archivos |
| `Ctrl + V` | Pegar imagen |
| `Ctrl + Enter` | Generar documento |
| `Escape` | Limpiar imágenes |

## Estructura del Proyecto

```
print-shop-agent/
├── backend/                 # Servidor FastAPI
│   ├── app/
│   │   ├── api/            # Endpoints REST
│   │   ├── core/           # Configuración
│   │   ├── models/         # Schemas Pydantic
│   │   └── services/       # Lógica de negocio
│   ├── tests/              # Tests con pytest
│   └── README.md
├── frontend/               # Interfaz web
│   ├── js/
│   │   ├── components/     # Componentes UI
│   │   ├── services/       # API y Storage
│   │   └── utils/          # Utilidades
│   ├── css/
│   └── README.md
├── scripts/                # Scripts de utilidad
│   ├── start.bat           # Iniciar servidor (Windows)
│   ├── test.bat            # Ejecutar tests (Windows)
│   ├── entrypoint.sh       # Entrypoint Docker (limpieza)
│   └── add-hosts-entry.ps1 # Configurar DNS local (Admin)
├── docs/                   # Documentación adicional
├── Dockerfile              # Imagen Docker (backend + frontend)
├── docker-compose.yml      # Orquestación de contenedores
├── requirements.txt        # Dependencias de producción
├── requirements-dev.txt    # Dependencias de desarrollo
└── README.md
```

## Tests

```bash
# Ejecutar todos los tests
pytest backend/tests -v

# Con cobertura
pytest backend/tests --cov=backend/app --cov-report=html

# Usando script
scripts\test.bat   # Windows
./scripts/test.sh  # Linux/Mac
```

## Configuración Disponible

| Opción | Valores | Default |
|--------|---------|---------|
| Tamaño de página | Carta, A4, A3, Oficio, Legal | Carta |
| Orientación | Vertical, Horizontal | Vertical |
| Ancho de imagen | 1-30 cm | 10 cm |
| Imágenes por fila | Auto, 1-6 | Auto |
| Márgenes | 0.5-5 cm | 1.5 cm |
| Espaciado | 0-3 cm | 0.5 cm |
| Bordes | Sí/No | No |

## API REST

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/health` | Estado del servidor |
| GET | `/api/config/defaults` | Configuración por defecto |
| POST | `/api/generate` | Generar documento |
| GET | `/api/download/{file}` | Descargar documento |

Documentación completa: http://localhost:8000/docs

## Tecnologías

### Backend
- FastAPI
- python-docx
- Pillow
- Pydantic
- Uvicorn

### Frontend
- JavaScript ES6 (Vanilla)
- TailwindCSS
- HTML5 APIs (Drag & Drop, File, Clipboard)

## Limitaciones

- Máximo 100 imágenes por documento
- Máximo 10MB por imagen
- Formatos: JPG, PNG, WebP, GIF, BMP
- Requiere conexión al servidor local

## Licencia

MIT License - Uso libre para proyectos personales y comerciales.

## Soporte

Para reportar bugs o solicitar funcionalidades:
1. Revisa la documentación en `/docs`
2. Revisa los READMEs en `/backend` y `/frontend`
3. Contacta al desarrollador

---

Desarrollado con Claude Code
