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
if not exist "frontend" mkdir frontend
echo        Directorios creados

:: ============================================
:: 6. Crear archivo .env si no existe
:: ============================================
echo.
echo [6/6] Configurando variables de entorno...

if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
    ) else (
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
echo     1. Ejecuta: scripts\start.bat
echo     2. Abre en el navegador: http://localhost:8000
echo.
echo  ====================================================
echo.

pause
