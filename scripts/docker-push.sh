#!/bin/bash
# ============================================
# Print Shop Generator - Docker Push Script
# ============================================
# Construye y sube la imagen a Docker Hub con versionamiento
#
# REQUISITOS:
#   - Docker instalado y corriendo
#   - Cuenta en Docker Hub
#   - Haber ejecutado 'docker login' previamente
#
# COMO EJECUTAR:
#   ./docker-push.sh 1.0.0
#   ./docker-push.sh 1.0.0 mi-usuario
#   ./docker-push.sh 1.0.0 mi-usuario --skip-latest
#
# EJEMPLOS:
#   ./docker-push.sh 1.0.0                    # Primera version
#   ./docker-push.sh 1.0.1                    # Bug fix
#   ./docker-push.sh 1.1.0                    # Nueva funcionalidad
#   ./docker-push.sh 2.0.0                    # Cambio mayor
#
# ============================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuracion
IMAGE_NAME="print-shop-generator"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Parametros
VERSION=$1
USUARIO=$2
SKIP_LATEST=$3

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN} Print Shop Generator - Docker Push${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# Validar version
if [ -z "$VERSION" ]; then
    echo -e "${RED}ERROR: Debes especificar una version${NC}"
    echo -e "${YELLOW}Uso: ./docker-push.sh <version> [usuario] [--skip-latest]${NC}"
    echo -e "${YELLOW}Ejemplo: ./docker-push.sh 1.0.0${NC}"
    exit 1
fi

# Validar formato semver
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}ERROR: Version debe ser formato semver (ej: 1.0.0)${NC}"
    exit 1
fi

# Obtener usuario de Docker Hub
if [ -z "$USUARIO" ]; then
    echo -e "${CYAN}Obteniendo usuario de Docker Hub...${NC}"
    USUARIO=$(docker info 2>/dev/null | grep "Username" | awk -F': ' '{print $2}')

    if [ -z "$USUARIO" ]; then
        echo -e "${RED}ERROR: No se pudo obtener el usuario de Docker Hub.${NC}"
        echo -e "${YELLOW}Ejecuta 'docker login' primero o especifica el usuario como segundo parametro${NC}"
        exit 1
    fi
fi

FULL_IMAGE_NAME="$USUARIO/$IMAGE_NAME"

echo -e "${CYAN}Usuario:  ${NC}$USUARIO"
echo -e "${CYAN}Imagen:   ${NC}$FULL_IMAGE_NAME"
echo -e "${CYAN}Version:  ${NC}$VERSION"
echo ""

# Verificar Docker
echo -e "${CYAN}Verificando Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Docker no esta corriendo. Inicia Docker.${NC}"
    exit 1
fi
echo -e "${GREEN}  Docker OK${NC}"

# Cambiar al directorio del proyecto
cd "$PROJECT_DIR"

# Build imagen con version
echo ""
echo -e "${CYAN}Construyendo imagen version $VERSION...${NC}"
docker build -t "${FULL_IMAGE_NAME}:${VERSION}" .
echo -e "${GREEN}  Build OK: ${FULL_IMAGE_NAME}:${VERSION}${NC}"

# Tag latest (opcional)
if [ "$SKIP_LATEST" != "--skip-latest" ]; then
    echo -e "${CYAN}Creando tag 'latest'...${NC}"
    docker tag "${FULL_IMAGE_NAME}:${VERSION}" "${FULL_IMAGE_NAME}:latest"
    echo -e "${GREEN}  Tag OK: ${FULL_IMAGE_NAME}:latest${NC}"
fi

# Push a Docker Hub
echo ""
echo -e "${CYAN}Subiendo a Docker Hub...${NC}"

docker push "${FULL_IMAGE_NAME}:${VERSION}"
echo -e "${GREEN}  Push OK: ${FULL_IMAGE_NAME}:${VERSION}${NC}"

if [ "$SKIP_LATEST" != "--skip-latest" ]; then
    docker push "${FULL_IMAGE_NAME}:latest"
    echo -e "${GREEN}  Push OK: ${FULL_IMAGE_NAME}:latest${NC}"
fi

# Resumen
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN} Completado!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "Imagen publicada:"
echo -e "${YELLOW}  docker pull ${FULL_IMAGE_NAME}:${VERSION}${NC}"
if [ "$SKIP_LATEST" != "--skip-latest" ]; then
    echo -e "${YELLOW}  docker pull ${FULL_IMAGE_NAME}:latest${NC}"
fi
echo ""
echo -e "Para ejecutar en otra maquina:"
echo -e "  docker run -d -p 80:8000 ${FULL_IMAGE_NAME}:${VERSION}"
echo ""
