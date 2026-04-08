@echo off
setlocal

echo.
echo  ====================================================
echo   Print Shop Generator - Ejecutando Tests
echo  ====================================================
echo.

set APP_DIR=%~dp0..
cd /d "%APP_DIR%"

:: Activar entorno virtual
call venv\Scripts\activate.bat

:: Instalar dependencias de desarrollo si no existen
pip show pytest >nul 2>&1
if errorlevel 1 (
    echo Instalando dependencias de desarrollo...
    pip install -r requirements-dev.txt --quiet
)

:: Ejecutar tests
echo Ejecutando tests...
echo.

cd backend
python -m pytest tests/ -v --tb=short

echo.
echo  ====================================================
echo   Tests completados
echo  ====================================================
echo.

pause
