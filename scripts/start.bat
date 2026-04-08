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
    echo Ejecuta scripts\install.bat primero
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
    echo Ejecuta scripts\install.bat primero
    pause
    exit /b 1
)

:: ============================================
:: Iniciar servidor
:: ============================================
echo   Iniciando servidor...
echo   URL: http://localhost:8000
echo   Documentacion API: http://localhost:8000/docs
echo.
echo   Presiona Ctrl+C para detener
echo  ====================================================
echo.

:: Abrir navegador despues de 2 segundos
start /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8000"

:: Iniciar FastAPI
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

:: Si llega aqui, el servidor se detuvo
echo.
echo Servidor detenido.
pause
