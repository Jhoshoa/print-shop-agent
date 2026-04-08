# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Print Shop Generator is a full-stack web application that converts multiple images into formatted Word documents (.docx) for print shop workflows. Python 3.10+ backend with vanilla JavaScript ES6 frontend.

## Commands

### Development
```bash
# Start dev server (auto-reload enabled)
cd backend && python -m uvicorn app.main:app --reload

# Or use Windows script
scripts\start.bat
```

### Testing
```bash
# Run all tests
pytest backend/tests -v

# With coverage
pytest backend/tests --cov=backend/app --cov-report=html

# Single test file
pytest backend/tests/test_generator.py -v
```

### Code Quality
```bash
# Lint
ruff check backend/

# Format
ruff format backend/

# Type check
mypy backend/app --strict

# All checks
ruff check backend/ && ruff format backend/ --check && mypy backend/app
```

### Installation
```bash
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
pip install -r requirements-dev.txt  # For development
```

## Architecture

### Request Flow
1. Frontend uploads images via drag & drop/paste
2. API client encodes images as base64
3. `POST /api/generator/generate` receives GenerateDocumentRequest
4. `ImageProcessor` validates, resizes, converts images
5. `DocumentGenerator` creates Word document with layout
6. `FileManager` saves to `output/` directory
7. Frontend downloads via `GET /api/generator/download/{filename}`

### Key Backend Components
- **`app/main.py`** - FastAPI app factory, middleware, static file serving
- **`app/services/document_generator.py`** - Core .docx creation logic with smart image layout
- **`app/services/image_processor.py`** - Image validation, resizing, format conversion
- **`app/models/requests.py`** - Pydantic models: `DocumentConfig`, `GenerateDocumentRequest`
- **`app/core/constants.py`** - `PAGE_SIZES`, limits, supported image formats

### Key Frontend Components
- **`js/app.js`** - Main orchestrator, coordinates all components
- **`js/services/api.js`** - API client with retries and error handling
- **`js/components/dropzone.js`** - Drag & drop and clipboard paste handling
- **`js/components/sortableImageGrid.js`** - Reorderable image grid
- **`js/components/optionsPanel.js`** - Document configuration UI

### Data Models
`DocumentConfig` controls document generation:
- `page_size`: carta|a4|a3|oficio|legal
- `page_orientation`: vertical|horizontal
- `image_width_cm`: 1-30
- `images_per_row`: auto or 1-6
- `image_alignment`: left|center|right
- `image_layout`: vertical|inline

### Storage
- No database - documents saved to `output/` with timestamps
- Frontend config/history persisted in localStorage

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/generator/generate` | Generate document from base64 images |
| `GET /api/generator/download/{filename}` | Download generated .docx |
| `GET /api/config/defaults` | Default configuration values |
| `GET /api/config/page-sizes` | Available page sizes |
| `GET /api/health/status` | System status (CPU, memory, disk) |
| `GET /api/files` | List generated files |

Interactive API docs at http://localhost:8000/docs

## Constraints
- Max 100 images per document
- Max 10 MB per image
- Supported formats: JPG, PNG, WebP, GIF, BMP
- Max image dimension: 8000 pixels

## Environment
Configure via `.env` file (see `.env.example`):
- `APP_ENV`, `HOST`, `PORT`, `LOG_LEVEL`
- `OUTPUT_DIR`, `MAX_FILE_SIZE_MB`
- Default document settings (`DEFAULT_PAGE_SIZE`, `DEFAULT_IMAGE_WIDTH_CM`, etc.)

## Docker

### Build and Run
```bash
# Build and start with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Access with Custom Domain
Add to hosts file (`C:\Windows\System32\drivers\etc\hosts` on Windows, `/etc/hosts` on Linux/Mac):
```
127.0.0.1 print-shop-agent.com
```
Then access at http://print-shop-agent.com

### Docker Hub
```bash
# Build image
docker build -t yourusername/print-shop-generator:latest .

# Push to Docker Hub
docker push yourusername/print-shop-generator:latest

# Pull and run on another machine
docker pull yourusername/print-shop-generator:latest
docker run -d -p 8000:8000 yourusername/print-shop-generator:latest
```

### Volumes
- `print_shop_output` - Generated documents persistence
- `print_shop_logs` - Application logs
