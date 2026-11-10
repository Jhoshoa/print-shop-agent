# 00 - Arquitectura y Setup Inicial

> **Documento:** Configuración del entorno de desarrollo y arquitectura del proyecto
> **Nivel:** Senior Developer Best Practices

---

## Tabla de Contenidos

1. [Estructura del Proyecto](#estructura-del-proyecto)
2. [Configuración del Entorno](#configuración-del-entorno)
3. [Dependencias y Requirements](#dependencias-y-requirements)
4. [Configuración de Calidad de Código](#configuración-de-calidad-de-código)
5. [Docker Setup](#docker-setup)
6. [Git Configuration](#git-configuration)
7. [VS Code Configuration](#vs-code-configuration)
8. [Variables de Entorno](#variables-de-entorno)
9. [Scripts de Utilidad](#scripts-de-utilidad)

---

## Estructura del Proyecto

```
print-shop-generator/
│
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI/CD
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI application entry point
│   │   ├── config.py                 # Settings y configuración (Pydantic)
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── generator.py      # Endpoints de generación
│   │   │   │   ├── config.py         # Endpoints de configuración
│   │   │   │   └── health.py         # Health checks
│   │   │   └── dependencies.py       # Dependencias compartidas
│   │   │
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── exceptions.py         # Excepciones personalizadas
│   │   │   ├── logging.py            # Configuración de logging
│   │   │   └── constants.py          # Constantes del sistema
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── requests.py           # Modelos de request (Pydantic)
│   │   │   └── responses.py          # Modelos de response (Pydantic)
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── document_generator.py # Lógica de generación DOCX
│   │   │   ├── image_processor.py    # Procesamiento de imágenes
│   │   │   └── file_manager.py       # Gestión de archivos
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── helpers.py            # Funciones auxiliares
│   │
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py               # Fixtures de pytest
│       ├── test_generator.py
│       ├── test_image_processor.py
│       └── test_api/
│           ├── __init__.py
│           └── test_routes.py
│
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── app.js                    # Módulo principal
│       ├── components/
│       │   ├── dropzone.js           # Componente drag & drop
│       │   ├── imageGrid.js          # Grid de imágenes
│       │   ├── optionsPanel.js       # Panel de opciones
│       │   └── notifications.js      # Sistema de notificaciones
│       ├── services/
│       │   └── api.js                # Cliente API
│       └── utils/
│           ├── constants.js          # Constantes
│           └── helpers.js            # Utilidades
│
├── output/                           # Documentos generados (gitignored)
│   └── .gitkeep
│
├── scripts/
│   ├── start.bat                     # Iniciar en Windows
│   ├── start.sh                      # Iniciar en Linux/Mac
│   ├── install.bat                   # Instalación Windows
│   ├── install.sh                    # Instalación Linux/Mac
│   └── update.py                     # Auto-actualización
│
├── docker/
│   ├── Dockerfile                    # Dockerfile principal
│   ├── Dockerfile.dev                # Dockerfile para desarrollo
│   └── .dockerignore
│
├── .vscode/
│   ├── settings.json                 # Configuración VS Code
│   ├── launch.json                   # Debug configuration
│   └── extensions.json               # Extensiones recomendadas
│
├── .env.example                      # Ejemplo de variables de entorno
├── .env                              # Variables de entorno (gitignored)
├── .gitignore
├── .pre-commit-config.yaml           # Pre-commit hooks
├── docker-compose.yml                # Docker Compose
├── docker-compose.dev.yml            # Docker Compose para desarrollo
├── pyproject.toml                    # Configuración Python moderna
├── requirements.txt                  # Dependencias de producción
├── requirements-dev.txt              # Dependencias de desarrollo
├── README.md
└── LICENSE
```

---

## Configuración del Entorno

### Requisitos del Sistema

| Requisito | Versión Mínima | Recomendada |
|-----------|----------------|-------------|
| Python | 3.10 | 3.12 |
| pip | 21.0 | 24.0 |
| Node.js (opcional) | 18.0 | 20.0 |
| Git | 2.30 | 2.40 |
| Docker (opcional) | 20.10 | 24.0 |

### Setup del Virtual Environment

```powershell
# Windows PowerShell

# 1. Verificar versión de Python
python --version  # Debe ser 3.10+

# 2. Crear directorio del proyecto
mkdir print-shop-generator
cd print-shop-generator

# 3. Crear virtual environment
python -m venv venv

# 4. Activar virtual environment
.\venv\Scripts\Activate.ps1

# Si hay error de ejecución de scripts:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 5. Actualizar pip
python -m pip install --upgrade pip

# 6. Instalar dependencias
pip install -r requirements.txt

# 7. Instalar dependencias de desarrollo
pip install -r requirements-dev.txt
```

```bash
# Linux/Mac (Bash)

# 1. Verificar versión de Python
python3 --version  # Debe ser 3.10+

# 2. Crear directorio del proyecto
mkdir print-shop-generator
cd print-shop-generator

# 3. Crear virtual environment
python3 -m venv venv

# 4. Activar virtual environment
source venv/bin/activate

# 5. Actualizar pip
pip install --upgrade pip

# 6. Instalar dependencias
pip install -r requirements.txt

# 7. Instalar dependencias de desarrollo
pip install -r requirements-dev.txt
```

### Verificar Instalación

```python
# verify_install.py
import sys

def check_installation():
    """Verifica que todas las dependencias estén instaladas."""
    required = [
        ("fastapi", "0.109.0"),
        ("uvicorn", "0.27.0"),
        ("python-docx", "1.1.0"),
        ("Pillow", "10.2.0"),
        ("pydantic", "2.5.0"),
    ]

    print(f"Python version: {sys.version}")
    print("-" * 40)

    all_ok = True
    for package, min_version in required:
        try:
            mod = __import__(package.replace("-", "_"))
            version = getattr(mod, "__version__", "unknown")
            print(f"✓ {package}: {version}")
        except ImportError:
            print(f"✗ {package}: NOT INSTALLED")
            all_ok = False

    return all_ok

if __name__ == "__main__":
    if check_installation():
        print("\n✅ All dependencies installed correctly!")
    else:
        print("\n❌ Some dependencies are missing. Run: pip install -r requirements.txt")
```

---

## Dependencias y Requirements

### requirements.txt (Producción)

```txt
# Web Framework
fastapi==0.109.2
uvicorn[standard]==0.27.1
python-multipart==0.0.9

# Document Generation
python-docx==1.1.0
Pillow==10.2.0

# Validation & Settings
pydantic==2.6.1
pydantic-settings==2.1.0

# Utilities
python-dateutil==2.8.2
aiofiles==23.2.1
```

### requirements-dev.txt (Desarrollo)

```txt
# Include production dependencies
-r requirements.txt

# Testing
pytest==8.0.0
pytest-asyncio==0.23.4
pytest-cov==4.1.0
httpx==0.26.0  # Para testing de FastAPI

# Code Quality
ruff==0.2.1        # Linter + Formatter (reemplaza flake8, black, isort)
mypy==1.8.0        # Type checking
pre-commit==3.6.0  # Git hooks

# Development
watchfiles==0.21.0  # Hot reload
ipython==8.21.0     # Better REPL
rich==13.7.0        # Pretty console output

# Documentation
mkdocs==1.5.3
mkdocs-material==9.5.7
```

### pyproject.toml (Configuración Moderna)

```toml
[project]
name = "print-shop-generator"
version = "1.0.0"
description = "Generador de documentos Word para imprentas"
readme = "README.md"
requires-python = ">=3.10"
license = {text = "MIT"}
authors = [
    {name = "Tu Nombre", email = "tu@email.com"}
]
keywords = ["print", "document", "word", "docx", "generator"]

[project.urls]
Homepage = "https://github.com/tu-usuario/print-shop-generator"
Repository = "https://github.com/tu-usuario/print-shop-generator.git"

# ============================================
# RUFF - Linter y Formatter moderno
# ============================================
[tool.ruff]
target-version = "py310"
line-length = 100
exclude = [
    ".git",
    ".venv",
    "venv",
    "__pycache__",
    "*.pyc",
    ".mypy_cache",
    ".pytest_cache",
    "dist",
    "build",
]

[tool.ruff.lint]
select = [
    "E",      # pycodestyle errors
    "W",      # pycodestyle warnings
    "F",      # Pyflakes
    "I",      # isort
    "B",      # flake8-bugbear
    "C4",     # flake8-comprehensions
    "UP",     # pyupgrade
    "ARG",    # flake8-unused-arguments
    "SIM",    # flake8-simplify
    "TCH",    # flake8-type-checking
    "PTH",    # flake8-use-pathlib
    "ERA",    # eradicate (commented code)
    "PL",     # Pylint
    "RUF",    # Ruff-specific rules
]
ignore = [
    "E501",   # line too long (handled by formatter)
    "PLR0913", # too many arguments
]

[tool.ruff.lint.per-file-ignores]
"tests/*" = ["ARG", "PLR2004"]  # Allow magic values in tests

[tool.ruff.lint.isort]
known-first-party = ["app"]
force-single-line = false
lines-after-imports = 2

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
skip-magic-trailing-comma = false
line-ending = "auto"

# ============================================
# MYPY - Type Checking
# ============================================
[tool.mypy]
python_version = "3.10"
strict = true
warn_return_any = true
warn_unused_ignores = true
disallow_untyped_defs = true
disallow_incomplete_defs = true
check_untyped_defs = true
no_implicit_optional = true
warn_redundant_casts = true

[[tool.mypy.overrides]]
module = [
    "docx.*",
    "PIL.*",
]
ignore_missing_imports = true

# ============================================
# PYTEST - Testing
# ============================================
[tool.pytest.ini_options]
testpaths = ["backend/tests"]
python_files = ["test_*.py"]
python_functions = ["test_*"]
asyncio_mode = "auto"
addopts = [
    "-v",
    "--tb=short",
    "--strict-markers",
    "-ra",
]
markers = [
    "slow: marks tests as slow",
    "integration: marks tests as integration tests",
]

# ============================================
# COVERAGE - Code Coverage
# ============================================
[tool.coverage.run]
source = ["backend/app"]
branch = true
omit = [
    "*/tests/*",
    "*/__init__.py",
]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise AssertionError",
    "raise NotImplementedError",
    "if __name__ == .__main__.:",
    "if TYPE_CHECKING:",
]
fail_under = 80
show_missing = true
```

---

## Configuración de Calidad de Código

### .pre-commit-config.yaml

```yaml
# Pre-commit hooks para mantener calidad de código
# Instalar: pre-commit install
# Ejecutar manualmente: pre-commit run --all-files

repos:
  # Ruff - Linter y Formatter
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.2.1
    hooks:
      - id: ruff
        args: [--fix, --exit-non-zero-on-fix]
      - id: ruff-format

  # MyPy - Type Checking
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.8.0
    hooks:
      - id: mypy
        additional_dependencies:
          - pydantic>=2.0
          - types-python-dateutil
        args: [--config-file=pyproject.toml]
        exclude: ^tests/

  # General hooks
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-added-large-files
        args: ['--maxkb=1000']
      - id: check-merge-conflict
      - id: detect-private-key
      - id: check-case-conflict

  # Commit message format
  - repo: https://github.com/commitizen-tools/commitizen
    rev: v3.14.1
    hooks:
      - id: commitizen
        stages: [commit-msg]
```

### Instalar Pre-commit Hooks

```bash
# Instalar pre-commit
pip install pre-commit

# Instalar hooks en el repositorio
pre-commit install
pre-commit install --hook-type commit-msg

# Ejecutar en todos los archivos (primera vez)
pre-commit run --all-files
```

---

## Docker Setup

### docker/Dockerfile

```dockerfile
# ============================================
# STAGE 1: Builder
# ============================================
FROM python:3.12-slim as builder

WORKDIR /app

# Instalar dependencias del sistema para compilar
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Crear virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copiar e instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ============================================
# STAGE 2: Production
# ============================================
FROM python:3.12-slim as production

WORKDIR /app

# Crear usuario no-root por seguridad
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Copiar virtual environment del builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Instalar dependencias del sistema necesarias en runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copiar código de la aplicación
COPY --chown=appuser:appgroup backend/app ./app
COPY --chown=appuser:appgroup frontend ./frontend

# Crear directorio de output
RUN mkdir -p /app/output && chown appuser:appgroup /app/output

# Cambiar a usuario no-root
USER appuser

# Variables de entorno
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Exponer puerto
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" || exit 1

# Comando de inicio
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker/Dockerfile.dev

```dockerfile
# Dockerfile para desarrollo con hot-reload
FROM python:3.12-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt requirements-dev.txt ./

# Instalar dependencias
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements-dev.txt

# Variables de entorno
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Exponer puerto
EXPOSE 8000

# Comando con hot-reload
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### docker/.dockerignore

```
# Git
.git
.gitignore

# Python
__pycache__
*.py[cod]
*$py.class
*.so
.Python
.venv
venv/
ENV/
.mypy_cache/
.pytest_cache/
*.egg-info/
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# Testing
htmlcov/
.coverage
coverage.xml

# Docs
docs/
*.md
!README.md

# Output
output/*.docx

# Environment
.env
.env.local
*.log

# OS
.DS_Store
Thumbs.db
```

### docker-compose.yml (Producción)

```yaml
version: "3.9"

services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile
    container_name: print-shop-generator
    restart: unless-stopped
    ports:
      - "8000:8000"
    volumes:
      # Persistir documentos generados
      - ./output:/app/output
      # Configuración externa (opcional)
      - ./config.json:/app/config.json:ro
    environment:
      - APP_ENV=production
      - LOG_LEVEL=INFO
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  default:
    name: print-shop-network
```

### docker-compose.dev.yml (Desarrollo)

```yaml
version: "3.9"

services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile.dev
    container_name: print-shop-generator-dev
    ports:
      - "8000:8000"
    volumes:
      # Mount código para hot-reload
      - ./backend:/app/backend
      - ./frontend:/app/frontend
      - ./output:/app/output
    environment:
      - APP_ENV=development
      - LOG_LEVEL=DEBUG
      - RELOAD=true
    # Override command para desarrollo
    command: >
      uvicorn app.main:app
      --host 0.0.0.0
      --port 8000
      --reload
      --reload-dir /app/backend

networks:
  default:
    name: print-shop-network-dev
```

### Comandos Docker Útiles

```bash
# === DESARROLLO ===

# Construir imagen de desarrollo
docker-compose -f docker-compose.dev.yml build

# Iniciar en modo desarrollo (con hot-reload)
docker-compose -f docker-compose.dev.yml up

# Iniciar en background
docker-compose -f docker-compose.dev.yml up -d

# Ver logs
docker-compose -f docker-compose.dev.yml logs -f

# Detener
docker-compose -f docker-compose.dev.yml down


# === PRODUCCIÓN ===

# Construir imagen de producción
docker-compose build

# Iniciar en producción
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Reiniciar
docker-compose restart app

# Detener y limpiar
docker-compose down

# Detener, limpiar y eliminar volúmenes
docker-compose down -v


# === UTILIDADES ===

# Entrar al contenedor
docker exec -it print-shop-generator /bin/bash

# Ver uso de recursos
docker stats print-shop-generator

# Limpiar imágenes no usadas
docker image prune -f
```

---

## Git Configuration

### .gitignore

```gitignore
# ============================================
# Python
# ============================================
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual Environment
.venv/
venv/
ENV/
env/
.env

# ============================================
# IDE / Editors
# ============================================
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
.idea/
*.swp
*.swo
*~
.project
.pydevproject
.settings/

# ============================================
# Testing / Coverage
# ============================================
.pytest_cache/
.coverage
htmlcov/
.tox/
.nox/
coverage.xml
*.cover
*.py,cover
.hypothesis/

# ============================================
# Type Checking
# ============================================
.mypy_cache/
.dmypy.json
dmypy.json

# ============================================
# Documentation
# ============================================
site/
docs/_build/

# ============================================
# Application Specific
# ============================================
# Output directory (documentos generados)
output/*.docx
output/*.pdf
!output/.gitkeep

# Logs
*.log
logs/

# Archivos de configuración local
config.local.json
.env.local
.env.*.local

# Archivos temporales
tmp/
temp/
*.tmp
*.temp

# ============================================
# OS Specific
# ============================================
# macOS
.DS_Store
.AppleDouble
.LSOverride
._*

# Windows
Thumbs.db
ehthumbs.db
Desktop.ini
$RECYCLE.BIN/
*.lnk

# Linux
*~

# ============================================
# Docker
# ============================================
.docker/

# ============================================
# Secrets (NUNCA commitear)
# ============================================
*.pem
*.key
secrets/
.secrets
credentials.json
```

### .gitattributes

```gitattributes
# Auto detect text files and perform LF normalization
* text=auto

# Python
*.py text diff=python
*.pyi text diff=python

# Web
*.html text diff=html
*.css text diff=css
*.js text diff=javascript
*.json text

# Documentation
*.md text diff=markdown
*.txt text
*.rst text

# Config
*.yml text
*.yaml text
*.toml text
*.ini text
*.cfg text

# Shell
*.sh text eol=lf
*.bash text eol=lf

# Windows
*.bat text eol=crlf
*.cmd text eol=crlf
*.ps1 text eol=crlf

# Binary
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.ico binary
*.webp binary
*.docx binary
*.pdf binary
*.zip binary
*.tar.gz binary
```

---

## VS Code Configuration

### .vscode/settings.json

```json
{
  // Python
  "python.defaultInterpreterPath": "${workspaceFolder}/venv/Scripts/python.exe",
  "python.terminal.activateEnvironment": true,

  // Formatting
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll": "explicit",
      "source.organizeImports": "explicit"
    }
  },

  // Ruff
  "ruff.enable": true,
  "ruff.lint.run": "onSave",
  "ruff.fixAll": true,
  "ruff.organizeImports": true,

  // MyPy
  "mypy-type-checker.args": [
    "--config-file=${workspaceFolder}/pyproject.toml"
  ],

  // Testing
  "python.testing.pytestEnabled": true,
  "python.testing.pytestPath": "pytest",
  "python.testing.pytestArgs": [
    "backend/tests",
    "-v"
  ],

  // Editor
  "editor.rulers": [100],
  "editor.tabSize": 4,
  "editor.insertSpaces": true,
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,

  // Files
  "files.exclude": {
    "**/__pycache__": true,
    "**/*.pyc": true,
    ".mypy_cache": true,
    ".pytest_cache": true,
    ".ruff_cache": true,
    "**/.DS_Store": true
  },

  // Search
  "search.exclude": {
    "**/venv": true,
    "**/node_modules": true,
    "**/.git": true,
    "**/output": true
  },

  // HTML/CSS/JS
  "[html]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[css]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },

  // Terminal
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "terminal.integrated.env.windows": {
    "PYTHONPATH": "${workspaceFolder}"
  }
}
```

### .vscode/launch.json

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "FastAPI: Debug",
      "type": "debugpy",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "app.main:app",
        "--host", "127.0.0.1",
        "--port", "8000",
        "--reload"
      ],
      "cwd": "${workspaceFolder}/backend",
      "env": {
        "PYTHONPATH": "${workspaceFolder}/backend",
        "APP_ENV": "development"
      },
      "jinja": true,
      "justMyCode": false
    },
    {
      "name": "Pytest: Current File",
      "type": "debugpy",
      "request": "launch",
      "module": "pytest",
      "args": [
        "${file}",
        "-v",
        "-s"
      ],
      "cwd": "${workspaceFolder}",
      "env": {
        "PYTHONPATH": "${workspaceFolder}/backend"
      }
    },
    {
      "name": "Pytest: All Tests",
      "type": "debugpy",
      "request": "launch",
      "module": "pytest",
      "args": [
        "backend/tests",
        "-v"
      ],
      "cwd": "${workspaceFolder}",
      "env": {
        "PYTHONPATH": "${workspaceFolder}/backend"
      }
    }
  ]
}
```

### .vscode/extensions.json

```json
{
  "recommendations": [
    // Python
    "ms-python.python",
    "ms-python.vscode-pylance",
    "ms-python.debugpy",
    "charliermarsh.ruff",
    "ms-python.mypy-type-checker",

    // Web
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",

    // Docker
    "ms-azuretools.vscode-docker",

    // Git
    "eamodio.gitlens",
    "mhutchie.git-graph",

    // Utilities
    "usernamehw.errorlens",
    "gruntfuggly.todo-tree",
    "streetsidesoftware.code-spell-checker",
    "streetsidesoftware.code-spell-checker-spanish",

    // Markdown
    "yzhang.markdown-all-in-one",
    "davidanson.vscode-markdownlint"
  ]
}
```

---

## Variables de Entorno

### .env.example

```bash
# ============================================
# Application
# ============================================
APP_ENV=development  # development | production
APP_NAME="Print Shop Generator"
APP_VERSION=1.0.0

# ============================================
# Server
# ============================================
HOST=127.0.0.1
PORT=8000
RELOAD=true  # Solo en desarrollo

# ============================================
# Logging
# ============================================
LOG_LEVEL=DEBUG  # DEBUG | INFO | WARNING | ERROR
LOG_FORMAT=pretty  # pretty | json

# ============================================
# Output
# ============================================
OUTPUT_DIR=./output
MAX_FILE_SIZE_MB=50
CLEANUP_DAYS=7

# ============================================
# Default Document Settings
# ============================================
DEFAULT_PAGE_SIZE=carta
DEFAULT_IMAGE_WIDTH_CM=10
DEFAULT_MARGINS_CM=1.5
DEFAULT_SPACING_CM=0.5

# ============================================
# Security (para futuro uso)
# ============================================
# SECRET_KEY=your-secret-key-here
# ALLOWED_ORIGINS=http://localhost:8000
```

---

## Scripts de Utilidad

### scripts/install.bat (Windows)

```batch
@echo off
echo ========================================
echo   Print Shop Generator - Instalacion
echo ========================================
echo.

:: Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python no esta instalado o no esta en PATH
    echo Descarga Python desde: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [1/5] Creando virtual environment...
python -m venv venv
if errorlevel 1 (
    echo [ERROR] No se pudo crear el virtual environment
    pause
    exit /b 1
)

echo [2/5] Activando virtual environment...
call venv\Scripts\activate.bat

echo [3/5] Actualizando pip...
python -m pip install --upgrade pip --quiet

echo [4/5] Instalando dependencias...
pip install -r requirements.txt --quiet

echo [5/5] Creando carpeta de output...
if not exist "output" mkdir output
echo. > output\.gitkeep

echo.
echo ========================================
echo   Instalacion completada!
echo ========================================
echo.
echo Para iniciar la aplicacion, ejecuta: start.bat
echo.
pause
```

### scripts/start.bat (Windows)

```batch
@echo off
echo ========================================
echo   Print Shop Generator
echo ========================================

:: Activar virtual environment
call venv\Scripts\activate.bat

:: Verificar instalación
python -c "import fastapi" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Dependencias no instaladas. Ejecuta install.bat primero.
    pause
    exit /b 1
)

:: Iniciar servidor
echo.
echo Iniciando servidor en http://localhost:8000
echo Presiona Ctrl+C para detener
echo.

:: Abrir navegador después de 2 segundos
start /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8000"

:: Iniciar FastAPI
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### scripts/start.sh (Linux/Mac)

```bash
#!/bin/bash

echo "========================================"
echo "  Print Shop Generator"
echo "========================================"

# Activar virtual environment
source venv/bin/activate

# Verificar instalación
python -c "import fastapi" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "[ERROR] Dependencias no instaladas. Ejecuta install.sh primero."
    exit 1
fi

echo ""
echo "Iniciando servidor en http://localhost:8000"
echo "Presiona Ctrl+C para detener"
echo ""

# Abrir navegador después de 2 segundos (en background)
(sleep 2 && xdg-open http://localhost:8000 2>/dev/null || open http://localhost:8000 2>/dev/null) &

# Iniciar FastAPI
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

---

## Próximos Pasos

Con esta configuración base establecida, procede a:

1. **[Fase 1: Backend Básico](./01-fase-1-backend-basico.md)** - Implementar la API y generador de documentos
2. **[Fase 2: Frontend Funcional](./02-fase-2-frontend-funcional.md)** - Crear la interfaz de usuario
3. **[Fase 3: Opciones Avanzadas](./03-fase-3-opciones-avanzadas.md)** - Agregar funcionalidades extras
4. **[Fase 4: Pulido y Producción](./04-fase-4-pulido-produccion.md)** - Preparar para uso diario

---

*Documento de arquitectura y setup - Print Shop Generator*
*Best Practices para Python + FastAPI*
