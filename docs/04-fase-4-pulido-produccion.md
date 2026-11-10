# Fase 4: Pulido y Producción

> **Objetivo:** Preparar la aplicación para uso diario en producción con auto-actualización, manejo de errores robusto, y scripts de inicio
> **Duración estimada de desarrollo:** 2-3 horas
> **Resultado:** Aplicación lista para producción con CI/CD y auto-update

---

## Tabla de Contenidos

1. [Checklist de Tareas](#checklist-de-tareas)
2. [GitHub Actions CI/CD](#github-actions-cicd)
3. [Sistema de Auto-Actualización](#sistema-de-auto-actualización)
4. [Scripts de Inicio](#scripts-de-inicio)
5. [Manejo de Errores Robusto](#manejo-de-errores-robusto)
6. [Sistema de Logging](#sistema-de-logging)
7. [Limpieza Automática de Archivos](#limpieza-automática-de-archivos)
8. [Health Monitoring](#health-monitoring)
9. [README del Proyecto](#readme-del-proyecto)
10. [Verificación Final](#verificación-final)

---

## Checklist de Tareas

- [ ] Configurar GitHub Actions para CI/CD
- [ ] Implementar sistema de auto-actualización
- [ ] Crear scripts de inicio para Windows
- [ ] Implementar manejo de errores robusto
- [ ] Configurar logging a archivo
- [ ] Implementar limpieza automática de archivos antiguos
- [ ] Agregar health monitoring
- [ ] Crear README completo
- [ ] Probar flujo completo de producción

---

## GitHub Actions CI/CD

### .github/workflows/ci.yml

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  PYTHON_VERSION: "3.12"

jobs:
  # ============================================
  # JOB: Lint and Type Check
  # ============================================
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Cache pip dependencies
        uses: actions/cache@v4
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('requirements*.txt') }}
          restore-keys: |
            ${{ runner.os }}-pip-

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install ruff mypy
          pip install -r requirements.txt

      - name: Run Ruff linter
        run: ruff check backend/

      - name: Run Ruff formatter check
        run: ruff format --check backend/

      - name: Run MyPy type checker
        run: mypy backend/app --config-file pyproject.toml
        continue-on-error: true  # No fallar por errores de tipos inicialmente

  # ============================================
  # JOB: Tests
  # ============================================
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    needs: lint

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Cache pip dependencies
        uses: actions/cache@v4
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('requirements*.txt') }}

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Run tests with coverage
        run: |
          cd backend
          pytest tests/ -v --cov=app --cov-report=xml --cov-report=term

      - name: Upload coverage report
        uses: codecov/codecov-action@v4
        with:
          files: backend/coverage.xml
          fail_ci_if_error: false

  # ============================================
  # JOB: Build Docker Image
  # ============================================
  build:
    name: Build Docker Image
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: docker/Dockerfile
          push: false
          tags: print-shop-generator:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ============================================
  # JOB: Create Release
  # ============================================
  release:
    name: Create Release
    runs-on: ubuntu-latest
    needs: [test, build]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Get version from pyproject.toml
        id: version
        run: |
          VERSION=$(grep -oP '(?<=version = ")[^"]*' pyproject.toml)
          echo "version=$VERSION" >> $GITHUB_OUTPUT

      - name: Check if tag exists
        id: check_tag
        run: |
          if git rev-parse "v${{ steps.version.outputs.version }}" >/dev/null 2>&1; then
            echo "exists=true" >> $GITHUB_OUTPUT
          else
            echo "exists=false" >> $GITHUB_OUTPUT
          fi

      - name: Create Release
        if: steps.check_tag.outputs.exists == 'false'
        uses: softprops/action-gh-release@v1
        with:
          tag_name: v${{ steps.version.outputs.version }}
          name: Release v${{ steps.version.outputs.version }}
          generate_release_notes: true
          draft: false
          prerelease: false
```

---

## Sistema de Auto-Actualización

### scripts/update.py

```python
#!/usr/bin/env python3
"""
Sistema de Auto-Actualización para Print Shop Generator

Este script verifica si hay actualizaciones en GitHub y las aplica automáticamente.
Diseñado para ejecutarse diariamente mediante Windows Task Scheduler.
"""

import json
import logging
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# Configuración
REPO_URL = "https://github.com/tu-usuario/print-shop-generator.git"
BRANCH = "main"
LOG_FILE = Path("logs/update.log")

# Configurar logging
LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)


def get_app_dir() -> Path:
    """Obtiene el directorio de la aplicación."""
    return Path(__file__).parent.parent.resolve()


def run_command(cmd: list[str], cwd: Path | None = None) -> tuple[bool, str]:
    """
    Ejecuta un comando y retorna el resultado.

    Returns:
        Tupla (éxito, output)
    """
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd or get_app_dir(),
            capture_output=True,
            text=True,
            timeout=120,
        )
        output = result.stdout + result.stderr
        return result.returncode == 0, output.strip()
    except subprocess.TimeoutExpired:
        return False, "Timeout ejecutando comando"
    except Exception as e:
        return False, str(e)


def get_current_commit() -> str | None:
    """Obtiene el hash del commit actual."""
    success, output = run_command(["git", "rev-parse", "HEAD"])
    return output[:8] if success else None


def get_remote_commit() -> str | None:
    """Obtiene el hash del último commit remoto."""
    # Fetch sin pull
    run_command(["git", "fetch", "origin", BRANCH])

    success, output = run_command(["git", "rev-parse", f"origin/{BRANCH}"])
    return output[:8] if success else None


def check_for_updates() -> bool:
    """
    Verifica si hay actualizaciones disponibles.

    Returns:
        True si hay actualizaciones
    """
    local = get_current_commit()
    remote = get_remote_commit()

    if not local or not remote:
        logger.error("No se pudo obtener información de commits")
        return False

    has_updates = local != remote
    logger.info(f"Local: {local} | Remote: {remote} | Updates: {has_updates}")

    return has_updates


def backup_config() -> dict | None:
    """
    Hace backup de archivos de configuración locales.

    Returns:
        Dict con las configuraciones o None
    """
    config_files = [".env", "user_configs.json"]
    backup = {}

    for filename in config_files:
        filepath = get_app_dir() / filename
        if filepath.exists():
            backup[filename] = filepath.read_text(encoding="utf-8")
            logger.debug(f"Backup de {filename}")

    return backup if backup else None


def restore_config(backup: dict) -> None:
    """Restaura archivos de configuración desde backup."""
    for filename, content in backup.items():
        filepath = get_app_dir() / filename
        filepath.write_text(content, encoding="utf-8")
        logger.debug(f"Restaurado {filename}")


def update_application() -> bool:
    """
    Descarga y aplica actualizaciones.

    Returns:
        True si la actualización fue exitosa
    """
    app_dir = get_app_dir()

    # 1. Backup de configuración
    backup = backup_config()

    # 2. Stash cambios locales si los hay
    run_command(["git", "stash"])

    # 3. Pull cambios
    success, output = run_command(["git", "pull", "origin", BRANCH])

    if not success:
        logger.error(f"Error en git pull: {output}")
        run_command(["git", "stash", "pop"])
        return False

    logger.info("Código actualizado correctamente")

    # 4. Restaurar configuración
    if backup:
        restore_config(backup)

    # 5. Actualizar dependencias si requirements.txt cambió
    if "requirements.txt" in output:
        logger.info("Actualizando dependencias...")
        venv_pip = app_dir / "venv" / "Scripts" / "pip.exe"

        if venv_pip.exists():
            success, _ = run_command([
                str(venv_pip), "install", "-r", "requirements.txt", "-q"
            ])
            if success:
                logger.info("Dependencias actualizadas")
            else:
                logger.warning("Error actualizando dependencias")

    return True


def restart_application() -> None:
    """
    Reinicia la aplicación si está corriendo.

    En Windows, intenta terminar el proceso uvicorn y reiniciarlo.
    """
    # Buscar proceso de uvicorn
    try:
        # Matar proceso existente
        subprocess.run(
            ["taskkill", "/f", "/im", "python.exe", "/fi", "WINDOWTITLE eq print-shop*"],
            capture_output=True,
        )
        logger.info("Proceso anterior terminado")
    except Exception:
        pass  # Puede que no esté corriendo

    # Iniciar nuevo proceso
    app_dir = get_app_dir()
    start_script = app_dir / "scripts" / "start.bat"

    if start_script.exists():
        subprocess.Popen(
            ["cmd", "/c", str(start_script)],
            cwd=app_dir,
            creationflags=subprocess.CREATE_NEW_CONSOLE,
        )
        logger.info("Aplicación reiniciada")


def save_update_log(success: bool, message: str) -> None:
    """Guarda registro de la actualización."""
    log_file = get_app_dir() / "logs" / "updates.json"
    log_file.parent.mkdir(parents=True, exist_ok=True)

    # Cargar logs existentes
    logs = []
    if log_file.exists():
        try:
            logs = json.loads(log_file.read_text())
        except Exception:
            pass

    # Agregar nuevo log
    logs.append({
        "timestamp": datetime.now().isoformat(),
        "success": success,
        "message": message,
        "commit": get_current_commit(),
    })

    # Mantener solo los últimos 50 logs
    logs = logs[-50:]

    log_file.write_text(json.dumps(logs, indent=2))


def main() -> int:
    """
    Función principal.

    Returns:
        Código de salida (0 = éxito)
    """
    logger.info("=" * 50)
    logger.info("Iniciando verificación de actualizaciones")
    logger.info("=" * 50)

    try:
        # Verificar que estamos en un repo git
        if not (get_app_dir() / ".git").exists():
            logger.error("No es un repositorio git")
            return 1

        # Verificar actualizaciones
        if not check_for_updates():
            logger.info("No hay actualizaciones disponibles")
            save_update_log(True, "No hay actualizaciones")
            return 0

        # Aplicar actualización
        logger.info("Actualizaciones encontradas, aplicando...")

        if update_application():
            logger.info("Actualización completada exitosamente")
            save_update_log(True, "Actualización aplicada")

            # Reiniciar si está configurado
            if os.environ.get("AUTO_RESTART", "false").lower() == "true":
                restart_application()

            return 0
        else:
            logger.error("Error aplicando actualización")
            save_update_log(False, "Error en actualización")
            return 1

    except Exception as e:
        logger.exception(f"Error inesperado: {e}")
        save_update_log(False, str(e))
        return 1


if __name__ == "__main__":
    sys.exit(main())
```

### scripts/setup_auto_update.bat

```batch
@echo off
:: Configura la tarea programada para auto-actualización diaria
:: Ejecutar como Administrador

echo ========================================
echo   Configurando Auto-Actualizacion
echo ========================================
echo.

set APP_DIR=%~dp0..
set PYTHON_PATH=%APP_DIR%\venv\Scripts\python.exe
set SCRIPT_PATH=%APP_DIR%\scripts\update.py
set TASK_NAME=PrintShopGenerator_AutoUpdate

:: Verificar que existe Python
if not exist "%PYTHON_PATH%" (
    echo [ERROR] No se encontro Python en el entorno virtual
    echo Ejecuta install.bat primero
    pause
    exit /b 1
)

:: Eliminar tarea existente si hay
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

:: Crear nueva tarea (ejecutar diariamente a las 6:00 AM)
schtasks /create ^
    /tn "%TASK_NAME%" ^
    /tr "\"%PYTHON_PATH%\" \"%SCRIPT_PATH%\"" ^
    /sc daily ^
    /st 06:00 ^
    /ru "%USERNAME%" ^
    /rl highest ^
    /f

if %errorlevel% equ 0 (
    echo.
    echo [OK] Tarea programada creada exitosamente
    echo     Nombre: %TASK_NAME%
    echo     Horario: Diariamente a las 6:00 AM
    echo.
    echo Para modificar el horario, usa el Programador de Tareas de Windows
) else (
    echo.
    echo [ERROR] No se pudo crear la tarea programada
    echo Intenta ejecutar este script como Administrador
)

pause
```

---

## Scripts de Inicio

### scripts/install.bat (versión completa)

```batch
@echo off
setlocal enabledelayedexpansion

echo.
echo  ====================================================
echo   Print Shop Generator - Instalacion Completa
echo  ====================================================
echo.

set APP_DIR=%~dp0..
cd /d "%APP_DIR%"

:: ============================================
:: 1. Verificar Python
:: ============================================
echo [1/6] Verificando Python...

python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Python no esta instalado o no esta en PATH
    echo.
    echo Descarga Python desde: https://www.python.org/downloads/
    echo Asegurate de marcar "Add Python to PATH" durante la instalacion
    echo.
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo        Python %PYTHON_VERSION% encontrado

:: ============================================
:: 2. Crear Virtual Environment
:: ============================================
echo.
echo [2/6] Creando entorno virtual...

if exist "venv" (
    echo        Entorno virtual existente encontrado
) else (
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] No se pudo crear el entorno virtual
        pause
        exit /b 1
    )
    echo        Entorno virtual creado
)

:: ============================================
:: 3. Activar y actualizar pip
:: ============================================
echo.
echo [3/6] Activando entorno y actualizando pip...

call venv\Scripts\activate.bat
python -m pip install --upgrade pip --quiet
echo        pip actualizado

:: ============================================
:: 4. Instalar dependencias
:: ============================================
echo.
echo [4/6] Instalando dependencias...

pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo [ERROR] Error instalando dependencias
    pause
    exit /b 1
)
echo        Dependencias instaladas

:: ============================================
:: 5. Crear directorios necesarios
:: ============================================
echo.
echo [5/6] Creando directorios...

if not exist "output" mkdir output
if not exist "logs" mkdir logs
echo. > output\.gitkeep
echo. > logs\.gitkeep
echo        Directorios creados

:: ============================================
:: 6. Crear archivo .env si no existe
:: ============================================
echo.
echo [6/6] Configurando variables de entorno...

if not exist ".env" (
    copy .env.example .env >nul 2>&1
    if not exist ".env" (
        echo APP_ENV=production > .env
        echo LOG_LEVEL=INFO >> .env
        echo HOST=127.0.0.1 >> .env
        echo PORT=8000 >> .env
    )
    echo        Archivo .env creado
) else (
    echo        Archivo .env existente
)

:: ============================================
:: Resumen final
:: ============================================
echo.
echo  ====================================================
echo   Instalacion Completada!
echo  ====================================================
echo.
echo   Para iniciar la aplicacion:
echo     1. Ejecuta: start.bat
echo     2. Abre en el navegador: http://localhost:8000
echo.
echo   Para configurar auto-actualizacion:
echo     Ejecuta como Admin: scripts\setup_auto_update.bat
echo.
echo  ====================================================
echo.

pause
```

### scripts/start.bat (versión completa)

```batch
@echo off
setlocal

title Print Shop Generator

echo.
echo  ====================================================
echo   Print Shop Generator
echo  ====================================================
echo.

set APP_DIR=%~dp0..
cd /d "%APP_DIR%"

:: ============================================
:: Verificar instalacion
:: ============================================
if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Entorno virtual no encontrado
    echo Ejecuta install.bat primero
    pause
    exit /b 1
)

:: ============================================
:: Activar entorno virtual
:: ============================================
call venv\Scripts\activate.bat

:: Verificar dependencias
python -c "import fastapi" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Dependencias no instaladas
    echo Ejecuta install.bat primero
    pause
    exit /b 1
)

:: ============================================
:: Iniciar servidor
:: ============================================
echo   Iniciando servidor...
echo   URL: http://localhost:8000
echo.
echo   Presiona Ctrl+C para detener
echo  ====================================================
echo.

:: Abrir navegador despues de 2 segundos
start /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8000"

:: Iniciar FastAPI
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

:: Si llega aqui, el servidor se detuvo
echo.
echo Servidor detenido.
pause
```

### scripts/start_background.bat

```batch
@echo off
:: Inicia el servidor en segundo plano (sin ventana de consola)

set APP_DIR=%~dp0..
cd /d "%APP_DIR%"

:: Activar entorno
call venv\Scripts\activate.bat

:: Iniciar en background usando pythonw
start /b pythonw -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --app-dir backend

echo Servidor iniciado en segundo plano
echo URL: http://localhost:8000
```

---

## Manejo de Errores Robusto

### backend/app/core/error_handlers.py

```python
"""
Manejadores de errores globales para la aplicación.
"""

import traceback
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.core.exceptions import PrintShopError
from app.core.logging import logger


def setup_error_handlers(app: FastAPI) -> None:
    """Configura los manejadores de errores globales."""

    @app.exception_handler(PrintShopError)
    async def print_shop_error_handler(
        request: Request,
        exc: PrintShopError,
    ) -> JSONResponse:
        """Maneja errores personalizados de la aplicación."""
        logger.warning(
            f"PrintShopError: {exc.code} - {exc.message}",
            extra={"path": request.url.path},
        )
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "error": exc.message,
                "code": exc.code,
                "detail": exc.detail,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        """Maneja errores de validación de Pydantic."""
        errors = []
        for error in exc.errors():
            field = " -> ".join(str(loc) for loc in error["loc"])
            errors.append(f"{field}: {error['msg']}")

        logger.warning(
            f"Validation error: {errors}",
            extra={"path": request.url.path},
        )

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "error": "Error de validación",
                "code": "VALIDATION_ERROR",
                "detail": errors,
            },
        )

    @app.exception_handler(Exception)
    async def general_error_handler(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        """Maneja cualquier excepción no controlada."""
        # Log completo del error
        logger.error(
            f"Unhandled exception: {type(exc).__name__}: {exc}",
            extra={
                "path": request.url.path,
                "traceback": traceback.format_exc(),
            },
        )

        # En producción, no exponer detalles del error
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": "Error interno del servidor",
                "code": "INTERNAL_ERROR",
                "detail": None,  # No exponer detalles en producción
            },
        )
```

---

## Sistema de Logging

### backend/app/core/logging.py (versión mejorada)

```python
"""
Sistema de logging mejorado con soporte para archivos.
"""

import logging
import sys
from datetime import datetime
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Literal

from app.config import settings


class ColoredFormatter(logging.Formatter):
    """Formatter con colores para la consola."""

    COLORS = {
        "DEBUG": "\033[36m",     # Cyan
        "INFO": "\033[32m",      # Green
        "WARNING": "\033[33m",   # Yellow
        "ERROR": "\033[31m",     # Red
        "CRITICAL": "\033[35m",  # Magenta
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, "")
        record.levelname = f"{color}{record.levelname:8}{self.RESET}"
        return super().format(record)


def setup_logging(
    level: str | None = None,
    log_to_file: bool = True,
    log_dir: Path | None = None,
) -> logging.Logger:
    """
    Configura el sistema de logging.

    Args:
        level: Nivel de logging
        log_to_file: Si guardar logs en archivo
        log_dir: Directorio para archivos de log

    Returns:
        Logger configurado
    """
    level = level or settings.log_level
    log_dir = log_dir or Path("./logs")

    # Crear logger
    logger = logging.getLogger("print_shop")
    logger.setLevel(getattr(logging, level.upper()))

    # Evitar duplicados
    if logger.handlers:
        return logger

    # Formato base
    log_format = "%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d | %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    # Handler para consola (con colores)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, level.upper()))

    if sys.stdout.isatty():  # Solo colores si es terminal interactiva
        console_handler.setFormatter(ColoredFormatter(log_format, date_format))
    else:
        console_handler.setFormatter(logging.Formatter(log_format, date_format))

    logger.addHandler(console_handler)

    # Handler para archivo (rotativo)
    if log_to_file:
        log_dir.mkdir(parents=True, exist_ok=True)
        log_file = log_dir / f"app_{datetime.now().strftime('%Y%m%d')}.log"

        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,
            encoding="utf-8",
        )
        file_handler.setLevel(logging.DEBUG)  # Guardar todo en archivo
        file_handler.setFormatter(logging.Formatter(log_format, date_format))
        logger.addHandler(file_handler)

    return logger


# Logger global
logger = setup_logging()
```

---

## Limpieza Automática de Archivos

### backend/app/services/cleanup.py

```python
"""
Servicio de limpieza automática de archivos antiguos.
"""

import asyncio
from datetime import datetime, timedelta
from pathlib import Path

from app.config import settings
from app.core.logging import logger


class CleanupService:
    """Servicio para limpiar archivos antiguos."""

    def __init__(
        self,
        output_dir: Path | None = None,
        logs_dir: Path | None = None,
        retention_days: int | None = None,
    ) -> None:
        self.output_dir = output_dir or settings.get_output_path()
        self.logs_dir = logs_dir or Path("./logs")
        self.retention_days = retention_days or settings.cleanup_days

    def cleanup_old_files(
        self,
        directory: Path,
        extensions: list[str],
        days: int | None = None,
    ) -> int:
        """
        Elimina archivos más antiguos que X días.

        Args:
            directory: Directorio a limpiar
            extensions: Extensiones de archivo a eliminar
            days: Días de retención

        Returns:
            Número de archivos eliminados
        """
        days = days or self.retention_days
        cutoff = datetime.now() - timedelta(days=days)
        deleted = 0

        for ext in extensions:
            for file_path in directory.glob(f"*{ext}"):
                try:
                    mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                    if mtime < cutoff:
                        file_path.unlink()
                        deleted += 1
                        logger.debug(f"Archivo eliminado: {file_path.name}")
                except Exception as e:
                    logger.warning(f"No se pudo eliminar {file_path}: {e}")

        return deleted

    def run_cleanup(self) -> dict:
        """
        Ejecuta limpieza completa.

        Returns:
            Diccionario con resultados
        """
        results = {
            "documents": 0,
            "logs": 0,
            "timestamp": datetime.now().isoformat(),
        }

        # Limpiar documentos
        results["documents"] = self.cleanup_old_files(
            self.output_dir,
            [".docx", ".pdf"],
            self.retention_days,
        )

        # Limpiar logs antiguos (más de 30 días)
        results["logs"] = self.cleanup_old_files(
            self.logs_dir,
            [".log"],
            30,
        )

        total = results["documents"] + results["logs"]
        if total > 0:
            logger.info(
                f"Limpieza completada: {results['documents']} documentos, "
                f"{results['logs']} logs eliminados"
            )

        return results


# Instancia global
cleanup_service = CleanupService()


async def scheduled_cleanup() -> None:
    """Tarea programada para limpieza periódica."""
    while True:
        # Ejecutar cada 24 horas
        await asyncio.sleep(24 * 60 * 60)
        cleanup_service.run_cleanup()
```

---

## Health Monitoring

### backend/app/api/routes/health.py (versión mejorada)

```python
"""
Rutas de health check y monitoreo.
"""

import platform
import psutil
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter

from app.config import settings
from app.models import HealthResponse
from app.services import file_manager

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check básico."""
    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        environment=settings.app_env,
    )


@router.get("/health/detailed")
async def detailed_health() -> dict:
    """Health check detallado con métricas del sistema."""

    # Uso de CPU y memoria
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage(str(Path.cwd()))

    # Información de almacenamiento
    storage = file_manager.get_disk_usage()

    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "application": {
            "name": settings.app_name,
            "version": settings.app_version,
            "environment": settings.app_env,
            "python_version": platform.python_version(),
        },
        "system": {
            "platform": platform.system(),
            "platform_version": platform.version(),
            "cpu_percent": cpu_percent,
            "memory": {
                "total_gb": round(memory.total / (1024**3), 2),
                "available_gb": round(memory.available / (1024**3), 2),
                "percent_used": memory.percent,
            },
            "disk": {
                "total_gb": round(disk.total / (1024**3), 2),
                "free_gb": round(disk.free / (1024**3), 2),
                "percent_used": round(disk.used / disk.total * 100, 1),
            },
        },
        "storage": storage,
    }


@router.get("/health/ready")
async def readiness_check() -> dict:
    """
    Readiness check - verifica que la aplicación está lista para recibir tráfico.
    """
    checks = {
        "output_dir_writable": False,
        "dependencies_ok": False,
    }

    # Verificar directorio de salida
    try:
        output_dir = settings.get_output_path()
        test_file = output_dir / ".write_test"
        test_file.write_text("test")
        test_file.unlink()
        checks["output_dir_writable"] = True
    except Exception:
        pass

    # Verificar dependencias críticas
    try:
        import docx
        import PIL
        checks["dependencies_ok"] = True
    except ImportError:
        pass

    is_ready = all(checks.values())

    return {
        "ready": is_ready,
        "checks": checks,
        "timestamp": datetime.now().isoformat(),
    }
```

Agregar `psutil` a requirements.txt:

```txt
# Agregar a requirements.txt
psutil==5.9.8
```

---

## README del Proyecto

### README.md

```markdown
# Print Shop Generator

Generador de documentos Word para imprentas. Convierte múltiples imágenes en documentos listos para imprimir.

## Características

- Arrastra y suelta múltiples imágenes
- Configura tamaño de hoja, márgenes, y layout
- Genera documentos Word (.docx) listos para imprimir
- Interfaz web simple y rápida
- Auto-actualización desde GitHub

## Requisitos

- Windows 10/11
- Python 3.10 o superior
- 500MB de espacio en disco

## Instalación Rápida

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/print-shop-generator.git
   cd print-shop-generator
   ```

2. **Ejecutar instalador:**
   ```bash
   scripts\install.bat
   ```

3. **Iniciar aplicación:**
   ```bash
   scripts\start.bat
   ```

4. **Abrir en el navegador:**
   ```
   http://localhost:8000
   ```

## Uso

1. Abre la aplicación en el navegador
2. Arrastra las imágenes desde tu carpeta de Descargas
3. Configura las opciones (tamaño de hoja, ancho de imagen, etc.)
4. Haz clic en "Generar Documento"
5. Descarga el documento Word generado
6. Abre el documento e imprime

## Configuración

### Opciones de Documento

| Opción | Valores | Default |
|--------|---------|---------|
| Tamaño de hoja | Carta, A4, A3, Oficio | Carta |
| Orientación | Vertical, Horizontal | Vertical |
| Ancho de imagen | 1-30 cm | 10 cm |
| Imágenes por fila | Auto, 1-6 | Auto |
| Márgenes | 0.5-5 cm | 1.5 cm |
| Bordes | Sí/No | No |

### Auto-Actualización

Para configurar actualizaciones automáticas diarias:

```bash
# Ejecutar como Administrador
scripts\setup_auto_update.bat
```

## Estructura del Proyecto

```
print-shop-generator/
├── backend/           # API FastAPI
├── frontend/          # Interfaz web
├── scripts/           # Scripts de utilidad
├── output/            # Documentos generados
├── logs/              # Archivos de log
└── docs/              # Documentación
```

## Solución de Problemas

### El servidor no inicia
- Verifica que Python esté instalado: `python --version`
- Ejecuta `install.bat` nuevamente

### Error al generar documento
- Verifica que las imágenes sean JPG, PNG o WEBP
- El tamaño máximo por imagen es 10MB

### Las imágenes no cargan
- Intenta con menos imágenes (máximo 100)
- Verifica que los archivos no estén corruptos

## Desarrollo

### Ejecutar en modo desarrollo
```bash
cd backend
python -m uvicorn app.main:app --reload
```

### Ejecutar tests
```bash
pytest backend/tests -v
```

### Build Docker
```bash
docker-compose build
docker-compose up -d
```

## Licencia

MIT License - Ver [LICENSE](LICENSE)

## Soporte

Si encuentras un problema, abre un issue en GitHub.
```

---

## Verificación Final

### Checklist completo de producción

```markdown
## Pre-deployment

- [ ] Todos los tests pasan (`pytest`)
- [ ] Linter sin errores (`ruff check`)
- [ ] Variables de entorno configuradas (.env)
- [ ] Directorio output/ existe y es escribible
- [ ] Directorio logs/ existe y es escribible

## Instalación

- [ ] `install.bat` ejecuta sin errores
- [ ] Entorno virtual creado correctamente
- [ ] Dependencias instaladas

## Funcionalidad

- [ ] Servidor inicia con `start.bat`
- [ ] Página web carga en http://localhost:8000
- [ ] Health check responde: /api/health
- [ ] Drag & drop de imágenes funciona
- [ ] Configuración de opciones funciona
- [ ] Generación de documento funciona
- [ ] Descarga de documento funciona
- [ ] Historial de documentos funciona

## Producción

- [ ] Auto-actualización configurada
- [ ] Logging a archivo funciona
- [ ] Limpieza automática configurada
- [ ] Backup de configuración funciona

## Documentación

- [ ] README actualizado
- [ ] Documentación de fases completa
- [ ] Comentarios en código
```

### Script de verificación final

```python
#!/usr/bin/env python3
"""
Script de verificación final del sistema.
Ejecutar antes de deploy a producción.
"""

import sys
from pathlib import Path

def check_all():
    """Ejecuta todas las verificaciones."""
    checks = []

    # 1. Verificar estructura de directorios
    required_dirs = ["backend", "frontend", "scripts", "output", "logs"]
    for dir_name in required_dirs:
        exists = Path(dir_name).exists()
        checks.append((f"Directorio {dir_name}/", exists))

    # 2. Verificar archivos críticos
    required_files = [
        "backend/app/main.py",
        "frontend/index.html",
        "scripts/start.bat",
        "requirements.txt",
        ".env",
    ]
    for file_path in required_files:
        exists = Path(file_path).exists()
        checks.append((f"Archivo {file_path}", exists))

    # 3. Verificar imports
    try:
        import fastapi
        import docx
        import PIL
        checks.append(("Dependencias Python", True))
    except ImportError as e:
        checks.append((f"Dependencias Python ({e})", False))

    # 4. Verificar que output es escribible
    try:
        test_file = Path("output/.test")
        test_file.write_text("test")
        test_file.unlink()
        checks.append(("Output escribible", True))
    except Exception:
        checks.append(("Output escribible", False))

    # Mostrar resultados
    print("\n" + "=" * 50)
    print("  VERIFICACIÓN DEL SISTEMA")
    print("=" * 50 + "\n")

    all_ok = True
    for name, passed in checks:
        status = "✓" if passed else "✗"
        color = "\033[32m" if passed else "\033[31m"
        reset = "\033[0m"
        print(f"  {color}{status}{reset} {name}")
        if not passed:
            all_ok = False

    print("\n" + "=" * 50)
    if all_ok:
        print("  ✓ Todas las verificaciones pasaron")
    else:
        print("  ✗ Algunas verificaciones fallaron")
    print("=" * 50 + "\n")

    return 0 if all_ok else 1

if __name__ == "__main__":
    sys.exit(check_all())
```

---

## Resumen de Archivos Creados en esta Fase

```
.github/
└── workflows/
    └── ci.yml                    # GitHub Actions CI/CD

scripts/
├── install.bat                   # Instalación completa
├── start.bat                     # Inicio del servidor
├── start_background.bat          # Inicio en background
├── setup_auto_update.bat         # Configurar auto-update
├── update.py                     # Sistema de actualización
└── verify.py                     # Verificación del sistema

backend/app/core/
├── error_handlers.py             # Manejadores de errores
└── logging.py                    # Sistema de logging mejorado

backend/app/services/
└── cleanup.py                    # Limpieza automática

backend/app/api/routes/
└── health.py                     # Health checks mejorados

README.md                         # Documentación principal
```

---

## Próximos Pasos Post-Producción

1. **Monitoreo:** Configurar alertas si el servidor no responde
2. **Backups:** Programar backups de configuración
3. **Métricas:** Agregar tracking de uso (opcional)
4. **Feedback:** Recopilar feedback de usuarios para mejoras

---

*Fase 4: Pulido y Producción - Print Shop Generator*
*Proyecto listo para uso en producción*
