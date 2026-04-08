# Print Shop Generator - Backend

API REST construida con FastAPI para generar documentos Word (.docx) a partir de imágenes.

## Tecnologías

- **FastAPI** - Framework web async de alto rendimiento
- **python-docx** - Generación de documentos Word
- **Pillow (PIL)** - Procesamiento de imágenes
- **Pydantic** - Validación de datos
- **Uvicorn** - Servidor ASGI

## Estructura del Proyecto

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Entry point, configuración FastAPI
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py        # Endpoints de la API
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py        # Configuración y settings
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py       # Modelos Pydantic
│   └── services/
│       ├── __init__.py
│       ├── document_generator.py  # Generación de documentos
│       └── image_processor.py     # Procesamiento de imágenes
├── tests/
│   ├── conftest.py          # Fixtures compartidos
│   ├── test_api/
│   │   └── test_routes.py   # Tests de endpoints
│   ├── test_document_generator.py
│   └── test_image_processor.py
└── README.md
```

## Requisitos

- Python 3.10+
- pip

## Instalación

```bash
# Desde la raíz del proyecto
cd print-shop-agent

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Para desarrollo (incluye pytest):
pip install -r requirements-dev.txt
```

## Ejecución

### Desarrollo (con hot reload)

```bash
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Producción

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Usando el script de inicio

```bash
# Windows
scripts\start.bat

# Linux/Mac
./scripts/start.sh
```

La aplicación estará disponible en: http://localhost:8000

## API Endpoints

### Health & Status

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/health` | Estado del servidor |
| GET | `/api/health/status` | Información del sistema |
| GET | `/api/health/ready` | Verificación de disponibilidad |

### Configuración

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/config/defaults` | Configuración por defecto |
| GET | `/api/config/page-sizes` | Tamaños de página disponibles |

### Generación de Documentos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/generate` | Generar documento Word |
| GET | `/api/files` | Listar archivos generados |
| GET | `/api/download/{filename}` | Descargar documento |
| DELETE | `/api/files/{filename}` | Eliminar documento |

### Ejemplo de Request (POST /api/generate)

```json
{
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "data:image/png;base64,iVBORw0KGgo..."
  ],
  "config": {
    "page_size": "carta",
    "page_orientation": "vertical",
    "image_width_cm": 10,
    "images_per_row": "auto",
    "margins_cm": 1.5,
    "spacing_cm": 0.5,
    "borders": false,
    "filename": "mi_documento"
  }
}
```

### Respuesta Exitosa

```json
{
  "success": true,
  "filename": "mi_documento.docx",
  "pages": 3,
  "images_placed": 12,
  "file_size_kb": 245.5
}
```

## Tests

### Ejecutar todos los tests

```bash
cd print-shop-agent
pytest backend/tests -v
```

### Con cobertura de código

```bash
pytest backend/tests --cov=backend/app --cov-report=html
```

### Tests específicos

```bash
# Solo tests de API
pytest backend/tests/test_api -v

# Solo tests del generador
pytest backend/tests/test_document_generator.py -v

# Solo tests del procesador de imágenes
pytest backend/tests/test_image_processor.py -v
```

### Usando el script de test

```bash
# Windows
scripts\test.bat

# Linux/Mac
./scripts/test.sh
```

## Configuración

### Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | Entorno de ejecución | `development` |
| `OUTPUT_DIR` | Directorio de salida | `output` |
| `MAX_IMAGES` | Máximo de imágenes | `100` |
| `MAX_FILE_SIZE_MB` | Tamaño máximo por imagen | `10` |

### Tamaños de Página Soportados

| Código | Nombre | Dimensiones (cm) |
|--------|--------|------------------|
| `carta` | Carta (Letter) | 21.59 x 27.94 |
| `a4` | A4 | 21.0 x 29.7 |
| `a3` | A3 | 29.7 x 42.0 |
| `oficio` | Oficio | 21.59 x 35.56 |
| `legal` | Legal | 21.59 x 35.56 |

## Documentación Interactiva

Con el servidor corriendo, accede a:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Arquitectura

```
┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│   FastAPI API   │
│   (Browser)     │     │    /api/*       │
└─────────────────┘     └────────┬────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
             ┌──────────┐ ┌──────────┐ ┌──────────┐
             │  Image   │ │ Document │ │  File    │
             │Processor │ │Generator │ │ Storage  │
             └──────────┘ └──────────┘ └──────────┘
                    │            │            │
                    ▼            ▼            ▼
               [Pillow]    [python-docx]  [output/]
```

## Notas de Desarrollo

- El servidor sirve el frontend estático desde `../frontend`
- Los documentos generados se guardan en `output/` (creado automáticamente)
- Las imágenes se procesan en memoria (no se guardan en disco)
- Soporte para formatos: JPEG, PNG, WebP, GIF, BMP
- Las imágenes RGBA se convierten a RGB automáticamente
