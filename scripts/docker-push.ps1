# ============================================
# Print Shop Generator - Docker Push Script
# ============================================
# Construye y sube la imagen a Docker Hub con versionamiento
#
# REQUISITOS:
#   - Docker Desktop instalado y corriendo
#   - Cuenta en Docker Hub
#   - Haber ejecutado 'docker login' previamente
#
# COMO EJECUTAR:
#   .\docker-push.ps1 -Version 1.0.0
#   .\docker-push.ps1 -Version 1.0.0 -Usuario mi-usuario
#   .\docker-push.ps1 -Version 1.0.0 -SkipLatest
#
# EJEMPLOS:
#   .\docker-push.ps1 -Version 1.0.0                    # Primera version
#   .\docker-push.ps1 -Version 1.0.1                    # Bug fix
#   .\docker-push.ps1 -Version 1.1.0                    # Nueva funcionalidad
#   .\docker-push.ps1 -Version 2.0.0                    # Cambio mayor
#
# ============================================

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,

    [Parameter(Mandatory=$false)]
    [string]$Usuario = "",

    [Parameter(Mandatory=$false)]
    [switch]$SkipLatest = $false,

    [Parameter(Mandatory=$false)]
    [switch]$NoPush = $false
)

$ErrorActionPreference = "Stop"

# Configuracion
$ImageName = "print-shop-generator"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir

# Colores
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Warning { param($msg) Write-Host $msg -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host $msg -ForegroundColor Red }

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Print Shop Generator - Docker Push" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Validar version (formato semver)
if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    Write-Error "ERROR: Version debe ser formato semver (ej: 1.0.0)"
    exit 1
}

# Obtener usuario de Docker Hub
if ([string]::IsNullOrEmpty($Usuario)) {
    Write-Info "Obteniendo usuario de Docker Hub..."
    try {
        $dockerInfo = docker info 2>$null | Select-String "Username"
        if ($dockerInfo) {
            $Usuario = ($dockerInfo -split ":")[1].Trim()
        }
    } catch {}

    if ([string]::IsNullOrEmpty($Usuario)) {
        Write-Error "ERROR: No se pudo obtener el usuario de Docker Hub."
        Write-Warning "Ejecuta 'docker login' primero o usa el parametro -Usuario"
        exit 1
    }
}

$FullImageName = "$Usuario/$ImageName"

Write-Info "Usuario:  $Usuario"
Write-Info "Imagen:   $FullImageName"
Write-Info "Version:  $Version"
Write-Host ""

# Verificar Docker
Write-Info "Verificando Docker..."
$dockerRunning = docker info 2>$null
if (-not $dockerRunning) {
    Write-Error "ERROR: Docker no esta corriendo. Inicia Docker Desktop."
    exit 1
}
Write-Success "  Docker OK"

# Cambiar al directorio del proyecto
Set-Location $ProjectDir

# Build imagen con version
Write-Host ""
Write-Info "Construyendo imagen version $Version..."
docker build -t "${FullImageName}:${Version}" .
if ($LASTEXITCODE -ne 0) {
    Write-Error "ERROR: Fallo el build de la imagen"
    exit 1
}
Write-Success "  Build OK: ${FullImageName}:${Version}"

# Tag latest (opcional)
if (-not $SkipLatest) {
    Write-Info "Creando tag 'latest'..."
    docker tag "${FullImageName}:${Version}" "${FullImageName}:latest"
    Write-Success "  Tag OK: ${FullImageName}:latest"
}

# Push a Docker Hub
if (-not $NoPush) {
    Write-Host ""
    Write-Info "Subiendo a Docker Hub..."

    docker push "${FullImageName}:${Version}"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "ERROR: Fallo el push de la version"
        exit 1
    }
    Write-Success "  Push OK: ${FullImageName}:${Version}"

    if (-not $SkipLatest) {
        docker push "${FullImageName}:latest"
        if ($LASTEXITCODE -ne 0) {
            Write-Error "ERROR: Fallo el push de latest"
            exit 1
        }
        Write-Success "  Push OK: ${FullImageName}:latest"
    }
}

# Resumen
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host " Completado!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Imagen publicada:" -ForegroundColor White
Write-Host "  docker pull ${FullImageName}:${Version}" -ForegroundColor Yellow
if (-not $SkipLatest) {
    Write-Host "  docker pull ${FullImageName}:latest" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Para ejecutar en otra maquina:" -ForegroundColor White
Write-Host "  docker run -d -p 80:8000 ${FullImageName}:${Version}" -ForegroundColor Gray
Write-Host ""
