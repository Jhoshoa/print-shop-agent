# ============================================
# Print Shop Generator - Add Hosts Entry
# ============================================
# Este script agrega la entrada DNS local para print-shop-agent.com
#
# REQUISITOS:
#   - Ejecutar como Administrador
#
# COMO EJECUTAR:
#   1. Abrir PowerShell como Administrador:
#      - Presionar Windows + X
#      - Seleccionar "Windows PowerShell (Admin)" o "Terminal (Admin)"
#
#   2. Navegar a la carpeta del proyecto:
#      cd C:\Users\<username>\Documents\print-shop-agent\scripts
#
#   3. Habilitar ejecucion de scripts (solo primera vez):
#      Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
#
#   4. Ejecutar el script:
#      .\add-hosts-entry.ps1
#
# COMANDO RAPIDO (copiar y pegar en PowerShell Admin):
#   cd C:\Users\<username>\Documents\print-shop-agent\scripts; .\add-hosts-entry.ps1
#
# ============================================

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$entry = "127.0.0.1 print-shop-agent.com"

# Verificar si se ejecuta como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host ""
    Write-Host "ERROR: Este script requiere permisos de Administrador" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, ejecuta PowerShell como Administrador y vuelve a intentar." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Print Shop Generator - Configurar DNS Local" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si la entrada ya existe
$hostsContent = Get-Content $hostsPath -Raw
if ($hostsContent -match "print-shop-agent\.com") {
    Write-Host "La entrada ya existe en el archivo hosts." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Contenido actual:" -ForegroundColor Gray
    Get-Content $hostsPath | Select-String "print-shop-agent"
    Write-Host ""
} else {
    # Agregar la entrada
    Write-Host "Agregando entrada al archivo hosts..." -ForegroundColor White
    Add-Content -Path $hostsPath -Value "`n$entry" -Encoding ASCII
    Write-Host ""
    Write-Host "Entrada agregada exitosamente!" -ForegroundColor Green
    Write-Host "  $entry" -ForegroundColor Gray
    Write-Host ""
}

# Limpiar cache DNS
Write-Host "Limpiando cache DNS..." -ForegroundColor White
ipconfig /flushdns | Out-Null
Write-Host "Cache DNS limpiado." -ForegroundColor Green
Write-Host ""

# Mostrar resultado
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Configuracion completada!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ahora puedes acceder a:" -ForegroundColor White
Write-Host "  http://print-shop-agent.com" -ForegroundColor Yellow
Write-Host ""
Write-Host "Asegurate de que Docker este corriendo:" -ForegroundColor White
Write-Host "  docker-compose up -d" -ForegroundColor Gray
Write-Host ""
