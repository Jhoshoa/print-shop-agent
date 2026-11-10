# Fase 1: Backend Básico

> **Objetivo:** Implementar la API con FastAPI y el generador de documentos Word
> **Duración estimada de desarrollo:** 4-6 horas
> **Resultado:** API funcional que recibe imágenes y genera documentos .docx

---

## Tabla de Contenidos

1. [Checklist de Tareas](#checklist-de-tareas)
2. [Configuración del Proyecto](#configuración-del-proyecto)
3. [Modelos Pydantic](#modelos-pydantic)
4. [Configuración de la Aplicación](#configuración-de-la-aplicación)
5. [Constantes y Excepciones](#constantes-y-excepciones)
6. [Servicio de Procesamiento de Imágenes](#servicio-de-procesamiento-de-imágenes)
7. [Servicio Generador de Documentos](#servicio-generador-de-documentos)
8. [Servicio de Gestión de Archivos](#servicio-de-gestión-de-archivos)
9. [Rutas de la API](#rutas-de-la-api)
10. [Aplicación Principal](#aplicación-principal)
11. [Tests Unitarios](#tests-unitarios)
12. [Verificación de la Fase](#verificación-de-la-fase)

---

## Checklist de Tareas

- [ ] Crear estructura de carpetas del backend
- [ ] Implementar configuración con Pydantic Settings
- [ ] Crear modelos de Request/Response
- [ ] Implementar constantes y excepciones
- [ ] Crear servicio de procesamiento de imágenes
- [ ] Crear servicio generador de documentos
- [ ] Crear servicio de gestión de archivos
- [ ] Implementar rutas de la API
- [ ] Configurar aplicación FastAPI principal
- [ ] Escribir tests unitarios básicos
- [ ] Probar endpoint con Postman/curl

---

## Configuración del Proyecto

### Paso 1: Crear estructura de carpetas

```powershell
# Windows PowerShell
cd print-shop-generator

# Crear estructura del backend
mkdir -p backend/app/api/routes
mkdir -p backend/app/core
mkdir -p backend/app/models
mkdir -p backend/app/services
mkdir -p backend/app/utils
mkdir -p backend/tests/test_api
mkdir -p output

# Crear archivos __init__.py
$dirs = @(
    "backend/app",
    "backend/app/api",
    "backend/app/api/routes",
    "backend/app/core",
    "backend/app/models",
    "backend/app/services",
    "backend/app/utils",
    "backend/tests",
    "backend/tests/test_api"
)

foreach ($dir in $dirs) {
    New-Item -ItemType File -Path "$dir/__init__.py" -Force
}

# Crear .gitkeep en output
New-Item -ItemType File -Path "output/.gitkeep" -Force
```

---

## Modelos Pydantic

### backend/app/models/requests.py

```python
"""
Modelos Pydantic para las solicitudes de la API.

Este módulo define la estructura de datos que esperamos recibir
en los endpoints de la aplicación.
"""

from typing import Literal

from pydantic import BaseModel, Field, field_validator


class DocumentConfig(BaseModel):
    """Configuración para la generación del documento."""

    page_size: Literal["carta", "a4", "a3", "oficio", "legal"] = Field(
        default="carta",
        description="Tamaño de la página del documento",
    )
    page_orientation: Literal["vertical", "horizontal"] = Field(
        default="vertical",
        description="Orientación de la página",
    )
    image_width_cm: float = Field(
        default=10.0,
        ge=1.0,
        le=30.0,
        description="Ancho de cada imagen en centímetros",
    )
    image_height_cm: float | None = Field(
        default=None,
        ge=1.0,
        le=40.0,
        description="Alto de cada imagen en cm. Si es None, se calcula proporcionalmente",
    )
    images_per_row: int | Literal["auto"] = Field(
        default="auto",
        description="Número de imágenes por fila. 'auto' calcula según el ancho",
    )
    spacing_cm: float = Field(
        default=0.5,
        ge=0.0,
        le=3.0,
        description="Espacio entre imágenes en centímetros",
    )
    margins_cm: float = Field(
        default=1.5,
        ge=0.5,
        le=5.0,
        description="Márgenes de la página en centímetros",
    )
    borders: bool = Field(
        default=False,
        description="Agregar bordes a las imágenes",
    )
    filename: str = Field(
        default="documento",
        min_length=1,
        max_length=100,
        description="Nombre del archivo sin extensión",
    )

    @field_validator("filename")
    @classmethod
    def sanitize_filename(cls, v: str) -> str:
        """Elimina caracteres no válidos del nombre de archivo."""
        invalid_chars = '<>:"/\\|?*'
        for char in invalid_chars:
            v = v.replace(char, "_")
        return v.strip()

    @field_validator("images_per_row", mode="before")
    @classmethod
    def validate_images_per_row(cls, v: int | str) -> int | str:
        """Valida que images_per_row sea 'auto' o un entero válido."""
        if isinstance(v, str):
            if v.lower() == "auto":
                return "auto"
            try:
                return int(v)
            except ValueError:
                return "auto"
        if isinstance(v, int) and v < 1:
            return "auto"
        return v


class GenerateDocumentRequest(BaseModel):
    """Solicitud para generar un documento con imágenes."""

    images: list[str] = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Lista de imágenes en formato base64",
    )
    config: DocumentConfig = Field(
        default_factory=DocumentConfig,
        description="Configuración del documento",
    )

    @field_validator("images")
    @classmethod
    def validate_images(cls, v: list[str]) -> list[str]:
        """Valida que las imágenes no estén vacías."""
        if not v:
            raise ValueError("Debe proporcionar al menos una imagen")
        # Validar que cada imagen tenga contenido
        for i, img in enumerate(v):
            if not img or len(img) < 100:  # Base64 mínimo razonable
                raise ValueError(f"La imagen {i + 1} está vacía o es inválida")
        return v


class SaveConfigRequest(BaseModel):
    """Solicitud para guardar configuración personalizada."""

    config: DocumentConfig
    name: str = Field(
        default="default",
        min_length=1,
        max_length=50,
        description="Nombre de la configuración",
    )
```

### backend/app/models/responses.py

```python
"""
Modelos Pydantic para las respuestas de la API.

Este módulo define la estructura de datos que devolvemos
desde los endpoints de la aplicación.
"""

from datetime import datetime

from pydantic import BaseModel, Field


class GenerateDocumentResponse(BaseModel):
    """Respuesta exitosa de generación de documento."""

    success: bool = Field(default=True)
    filename: str = Field(description="Nombre del archivo generado")
    path: str = Field(description="Ruta completa del archivo")
    pages: int = Field(description="Número de páginas del documento")
    images_placed: int = Field(description="Número de imágenes colocadas")
    file_size_kb: float = Field(description="Tamaño del archivo en KB")
    created_at: datetime = Field(default_factory=datetime.now)


class ErrorResponse(BaseModel):
    """Respuesta de error."""

    success: bool = Field(default=False)
    error: str = Field(description="Mensaje de error")
    detail: str | None = Field(default=None, description="Detalle adicional del error")
    code: str = Field(description="Código de error interno")


class HealthResponse(BaseModel):
    """Respuesta del health check."""

    status: str = Field(default="healthy")
    version: str
    environment: str
    timestamp: datetime = Field(default_factory=datetime.now)


class ConfigResponse(BaseModel):
    """Respuesta con configuración actual."""

    page_sizes: list[str]
    orientations: list[str]
    defaults: dict
```

### backend/app/models/__init__.py

```python
"""Modelos Pydantic de la aplicación."""

from app.models.requests import (
    DocumentConfig,
    GenerateDocumentRequest,
    SaveConfigRequest,
)
from app.models.responses import (
    ConfigResponse,
    ErrorResponse,
    GenerateDocumentResponse,
    HealthResponse,
)

__all__ = [
    "DocumentConfig",
    "GenerateDocumentRequest",
    "SaveConfigRequest",
    "GenerateDocumentResponse",
    "ErrorResponse",
    "HealthResponse",
    "ConfigResponse",
]
```

---

## Configuración de la Aplicación

### backend/app/config.py

```python
"""
Configuración de la aplicación usando Pydantic Settings.

Carga configuración desde variables de entorno y archivo .env
"""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración principal de la aplicación."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = Field(default="Print Shop Generator")
    app_version: str = Field(default="1.0.0")
    app_env: Literal["development", "production", "testing"] = Field(
        default="development"
    )

    # Server
    host: str = Field(default="127.0.0.1")
    port: int = Field(default=8000)
    reload: bool = Field(default=True)

    # Logging
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = Field(default="INFO")
    log_format: Literal["pretty", "json"] = Field(default="pretty")

    # Paths
    output_dir: Path = Field(default=Path("./output"))
    frontend_dir: Path = Field(default=Path("./frontend"))

    # Limits
    max_file_size_mb: int = Field(default=50)
    max_images_per_request: int = Field(default=100)
    cleanup_days: int = Field(default=7)

    # Default Document Settings
    default_page_size: str = Field(default="carta")
    default_image_width_cm: float = Field(default=10.0)
    default_margins_cm: float = Field(default=1.5)
    default_spacing_cm: float = Field(default=0.5)

    @property
    def is_development(self) -> bool:
        """Verifica si estamos en modo desarrollo."""
        return self.app_env == "development"

    @property
    def is_production(self) -> bool:
        """Verifica si estamos en modo producción."""
        return self.app_env == "production"

    def get_output_path(self) -> Path:
        """Obtiene la ruta de output, creándola si no existe."""
        self.output_dir.mkdir(parents=True, exist_ok=True)
        return self.output_dir


@lru_cache
def get_settings() -> Settings:
    """
    Obtiene la instancia de configuración (singleton).

    Usa lru_cache para evitar recargar la configuración en cada llamada.
    """
    return Settings()


# Instancia global para importación directa
settings = get_settings()
```

---

## Constantes y Excepciones

### backend/app/core/constants.py

```python
"""
Constantes del sistema.

Define valores fijos como tamaños de página, límites, etc.
"""

from typing import NamedTuple


class PageDimensions(NamedTuple):
    """Dimensiones de una página en centímetros."""

    width: float
    height: float


# Tamaños de página en centímetros (ancho x alto)
PAGE_SIZES: dict[str, PageDimensions] = {
    "carta": PageDimensions(21.59, 27.94),
    "a4": PageDimensions(21.0, 29.7),
    "a3": PageDimensions(29.7, 42.0),
    "oficio": PageDimensions(21.59, 35.56),
    "legal": PageDimensions(21.59, 35.56),
}

# Orientaciones válidas
ORIENTATIONS = ["vertical", "horizontal"]

# Formatos de imagen soportados
SUPPORTED_IMAGE_FORMATS = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "image/gif": [".gif"],
    "image/bmp": [".bmp"],
}

# MIME types permitidos
ALLOWED_MIME_TYPES = list(SUPPORTED_IMAGE_FORMATS.keys())

# Extensiones permitidas (flat list)
ALLOWED_EXTENSIONS = [
    ext for exts in SUPPORTED_IMAGE_FORMATS.values() for ext in exts
]

# Límites del sistema
LIMITS = {
    "min_image_width_cm": 1.0,
    "max_image_width_cm": 30.0,
    "min_image_height_cm": 1.0,
    "max_image_height_cm": 40.0,
    "min_margins_cm": 0.5,
    "max_margins_cm": 5.0,
    "min_spacing_cm": 0.0,
    "max_spacing_cm": 3.0,
    "max_images_per_row": 6,
    "max_images_per_document": 100,
}

# Conversión de unidades
CM_TO_EMU = 360000  # 1 cm = 360000 EMUs (English Metric Units)
CM_TO_INCHES = 0.393701
INCHES_TO_CM = 2.54

# Colores para bordes (en formato RGB)
BORDER_COLOR_BLACK = (0, 0, 0)
BORDER_COLOR_GRAY = (128, 128, 128)
BORDER_WIDTH_PT = 1  # Puntos
```

### backend/app/core/exceptions.py

```python
"""
Excepciones personalizadas de la aplicación.

Define errores específicos para mejor manejo y mensajes claros.
"""

from typing import Any


class PrintShopError(Exception):
    """Excepción base para errores de la aplicación."""

    def __init__(
        self,
        message: str,
        code: str = "UNKNOWN_ERROR",
        detail: str | None = None,
    ) -> None:
        self.message = message
        self.code = code
        self.detail = detail
        super().__init__(self.message)

    def to_dict(self) -> dict[str, Any]:
        """Convierte la excepción a diccionario para respuesta JSON."""
        return {
            "success": False,
            "error": self.message,
            "code": self.code,
            "detail": self.detail,
        }


class ImageProcessingError(PrintShopError):
    """Error al procesar una imagen."""

    def __init__(self, message: str, detail: str | None = None) -> None:
        super().__init__(
            message=message,
            code="IMAGE_PROCESSING_ERROR",
            detail=detail,
        )


class InvalidImageError(PrintShopError):
    """Error cuando una imagen es inválida o corrupta."""

    def __init__(self, message: str = "Imagen inválida o corrupta") -> None:
        super().__init__(
            message=message,
            code="INVALID_IMAGE",
        )


class DocumentGenerationError(PrintShopError):
    """Error al generar el documento Word."""

    def __init__(self, message: str, detail: str | None = None) -> None:
        super().__init__(
            message=message,
            code="DOCUMENT_GENERATION_ERROR",
            detail=detail,
        )


class FileOperationError(PrintShopError):
    """Error en operaciones de archivo."""

    def __init__(self, message: str, detail: str | None = None) -> None:
        super().__init__(
            message=message,
            code="FILE_OPERATION_ERROR",
            detail=detail,
        )


class ConfigurationError(PrintShopError):
    """Error de configuración."""

    def __init__(self, message: str, detail: str | None = None) -> None:
        super().__init__(
            message=message,
            code="CONFIGURATION_ERROR",
            detail=detail,
        )


class ValidationError(PrintShopError):
    """Error de validación de datos."""

    def __init__(self, message: str, detail: str | None = None) -> None:
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            detail=detail,
        )
```

### backend/app/core/logging.py

```python
"""
Configuración de logging para la aplicación.

Proporciona logging estructurado con soporte para desarrollo y producción.
"""

import logging
import sys
from typing import Literal

from app.config import settings


def setup_logging(
    level: str | None = None,
    format_type: Literal["pretty", "json"] | None = None,
) -> logging.Logger:
    """
    Configura el logging de la aplicación.

    Args:
        level: Nivel de logging (DEBUG, INFO, WARNING, ERROR)
        format_type: Formato de salida (pretty para desarrollo, json para producción)

    Returns:
        Logger configurado
    """
    level = level or settings.log_level
    format_type = format_type or settings.log_format

    # Crear logger
    logger = logging.getLogger("print_shop")
    logger.setLevel(getattr(logging, level.upper()))

    # Evitar duplicados
    if logger.handlers:
        return logger

    # Crear handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(getattr(logging, level.upper()))

    # Formato según el tipo
    if format_type == "json":
        # Formato JSON para producción (compatible con sistemas de logging)
        formatter = logging.Formatter(
            '{"time": "%(asctime)s", "level": "%(levelname)s", '
            '"module": "%(module)s", "message": "%(message)s"}'
        )
    else:
        # Formato legible para desarrollo
        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)-8s | %(module)s:%(lineno)d | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

    handler.setFormatter(formatter)
    logger.addHandler(handler)

    return logger


# Logger global de la aplicación
logger = setup_logging()
```

### backend/app/core/__init__.py

```python
"""Core modules."""

from app.core.constants import (
    ALLOWED_EXTENSIONS,
    ALLOWED_MIME_TYPES,
    LIMITS,
    ORIENTATIONS,
    PAGE_SIZES,
)
from app.core.exceptions import (
    ConfigurationError,
    DocumentGenerationError,
    FileOperationError,
    ImageProcessingError,
    InvalidImageError,
    PrintShopError,
    ValidationError,
)
from app.core.logging import logger, setup_logging

__all__ = [
    # Constants
    "PAGE_SIZES",
    "ORIENTATIONS",
    "ALLOWED_EXTENSIONS",
    "ALLOWED_MIME_TYPES",
    "LIMITS",
    # Exceptions
    "PrintShopError",
    "ImageProcessingError",
    "InvalidImageError",
    "DocumentGenerationError",
    "FileOperationError",
    "ConfigurationError",
    "ValidationError",
    # Logging
    "logger",
    "setup_logging",
]
```

---

## Servicio de Procesamiento de Imágenes

### backend/app/services/image_processor.py

```python
"""
Servicio de procesamiento de imágenes.

Maneja la decodificación, validación y transformación de imágenes.
"""

import base64
import io
from dataclasses import dataclass
from typing import Literal

from PIL import Image

from app.core import (
    ALLOWED_MIME_TYPES,
    ImageProcessingError,
    InvalidImageError,
    logger,
)


@dataclass
class ImageInfo:
    """Información de una imagen procesada."""

    width: int
    height: int
    format: str
    mode: str
    orientation: Literal["horizontal", "vertical", "square"]
    size_bytes: int
    aspect_ratio: float


@dataclass
class ProcessedImage:
    """Imagen procesada lista para insertar en documento."""

    data: bytes
    info: ImageInfo
    stream: io.BytesIO


class ImageProcessor:
    """Procesador de imágenes para el generador de documentos."""

    # Tamaño máximo en bytes (10MB)
    MAX_IMAGE_SIZE = 10 * 1024 * 1024

    # Dimensión máxima en píxeles
    MAX_DIMENSION = 8000

    def __init__(self) -> None:
        """Inicializa el procesador de imágenes."""
        self._processed_count = 0

    def decode_base64(self, base64_string: str) -> bytes:
        """
        Decodifica una imagen desde base64.

        Args:
            base64_string: Imagen en formato base64 (puede incluir data URI)

        Returns:
            Bytes de la imagen

        Raises:
            InvalidImageError: Si el base64 es inválido
        """
        try:
            # Remover prefijo data URI si existe
            if "," in base64_string:
                # Formato: data:image/png;base64,xxxxx
                base64_string = base64_string.split(",", 1)[1]

            # Decodificar
            image_bytes = base64.b64decode(base64_string)

            # Validar tamaño
            if len(image_bytes) > self.MAX_IMAGE_SIZE:
                raise InvalidImageError(
                    f"Imagen muy grande: {len(image_bytes) / 1024 / 1024:.1f}MB "
                    f"(máximo: {self.MAX_IMAGE_SIZE / 1024 / 1024:.0f}MB)"
                )

            return image_bytes

        except base64.binascii.Error as e:
            raise InvalidImageError(f"Base64 inválido: {e}") from e

    def validate_image(self, image_bytes: bytes) -> Image.Image:
        """
        Valida que los bytes sean una imagen válida.

        Args:
            image_bytes: Bytes de la imagen

        Returns:
            Objeto PIL Image

        Raises:
            InvalidImageError: Si la imagen es inválida o corrupta
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))

            # Verificar que se puede leer
            image.verify()

            # Reabrir después de verify (verify cierra el archivo)
            image = Image.open(io.BytesIO(image_bytes))

            # Validar formato
            mime_type = Image.MIME.get(image.format, "")
            if mime_type and mime_type not in ALLOWED_MIME_TYPES:
                raise InvalidImageError(
                    f"Formato no soportado: {image.format}. "
                    f"Formatos válidos: JPEG, PNG, WEBP, GIF, BMP"
                )

            # Validar dimensiones
            if image.width > self.MAX_DIMENSION or image.height > self.MAX_DIMENSION:
                raise InvalidImageError(
                    f"Imagen muy grande: {image.width}x{image.height}. "
                    f"Máximo: {self.MAX_DIMENSION}x{self.MAX_DIMENSION}"
                )

            return image

        except InvalidImageError:
            raise
        except Exception as e:
            raise InvalidImageError(f"Imagen corrupta o inválida: {e}") from e

    def get_orientation(
        self, width: int, height: int
    ) -> Literal["horizontal", "vertical", "square"]:
        """
        Determina la orientación de una imagen.

        Args:
            width: Ancho en píxeles
            height: Alto en píxeles

        Returns:
            Orientación: 'horizontal', 'vertical', o 'square'
        """
        ratio = width / height

        if ratio > 1.1:
            return "horizontal"
        elif ratio < 0.9:
            return "vertical"
        else:
            return "square"

    def get_image_info(self, image: Image.Image, size_bytes: int) -> ImageInfo:
        """
        Obtiene información detallada de una imagen.

        Args:
            image: Objeto PIL Image
            size_bytes: Tamaño en bytes

        Returns:
            ImageInfo con los detalles
        """
        return ImageInfo(
            width=image.width,
            height=image.height,
            format=image.format or "UNKNOWN",
            mode=image.mode,
            orientation=self.get_orientation(image.width, image.height),
            size_bytes=size_bytes,
            aspect_ratio=round(image.width / image.height, 3),
        )

    def convert_to_rgb(self, image: Image.Image) -> Image.Image:
        """
        Convierte la imagen a RGB si es necesario.

        Necesario para insertar en Word algunas imágenes PNG con transparencia.

        Args:
            image: Objeto PIL Image

        Returns:
            Imagen en modo RGB
        """
        if image.mode in ("RGBA", "LA", "P"):
            # Crear fondo blanco
            background = Image.new("RGB", image.size, (255, 255, 255))

            if image.mode == "P":
                image = image.convert("RGBA")

            if image.mode in ("RGBA", "LA"):
                background.paste(image, mask=image.split()[-1])
                return background

        if image.mode != "RGB":
            return image.convert("RGB")

        return image

    def resize_if_needed(
        self,
        image: Image.Image,
        max_width: int = 2000,
        max_height: int = 2000,
    ) -> Image.Image:
        """
        Redimensiona la imagen si excede los límites.

        Mantiene la relación de aspecto.

        Args:
            image: Objeto PIL Image
            max_width: Ancho máximo
            max_height: Alto máximo

        Returns:
            Imagen redimensionada o la original si no excede límites
        """
        if image.width <= max_width and image.height <= max_height:
            return image

        # Calcular nuevo tamaño manteniendo aspecto
        ratio = min(max_width / image.width, max_height / image.height)
        new_width = int(image.width * ratio)
        new_height = int(image.height * ratio)

        logger.debug(
            f"Redimensionando imagen: {image.width}x{image.height} -> "
            f"{new_width}x{new_height}"
        )

        return image.resize((new_width, new_height), Image.Resampling.LANCZOS)

    def process_image(
        self,
        base64_string: str,
        resize: bool = True,
    ) -> ProcessedImage:
        """
        Procesa una imagen completa: decodifica, valida, y prepara.

        Args:
            base64_string: Imagen en base64
            resize: Si redimensionar imágenes grandes

        Returns:
            ProcessedImage lista para usar

        Raises:
            ImageProcessingError: Si hay error en el procesamiento
        """
        try:
            # 1. Decodificar base64
            image_bytes = self.decode_base64(base64_string)

            # 2. Validar imagen
            image = self.validate_image(image_bytes)

            # 3. Obtener info antes de transformar
            original_info = self.get_image_info(image, len(image_bytes))

            # 4. Convertir a RGB si es necesario
            image = self.convert_to_rgb(image)

            # 5. Redimensionar si es necesario
            if resize:
                image = self.resize_if_needed(image)

            # 6. Convertir a bytes (JPEG para mejor compatibilidad con Word)
            output_buffer = io.BytesIO()
            image.save(output_buffer, format="JPEG", quality=95, optimize=True)
            final_bytes = output_buffer.getvalue()

            # 7. Crear stream para python-docx
            output_buffer.seek(0)

            self._processed_count += 1

            logger.debug(
                f"Imagen procesada #{self._processed_count}: "
                f"{original_info.width}x{original_info.height} "
                f"({original_info.orientation})"
            )

            return ProcessedImage(
                data=final_bytes,
                info=original_info,
                stream=output_buffer,
            )

        except (InvalidImageError, ImageProcessingError):
            raise
        except Exception as e:
            raise ImageProcessingError(
                f"Error procesando imagen: {e}",
                detail=str(type(e).__name__),
            ) from e

    def process_multiple(
        self,
        base64_images: list[str],
        resize: bool = True,
    ) -> list[ProcessedImage]:
        """
        Procesa múltiples imágenes.

        Args:
            base64_images: Lista de imágenes en base64
            resize: Si redimensionar imágenes grandes

        Returns:
            Lista de ProcessedImage

        Raises:
            ImageProcessingError: Si hay error en alguna imagen
        """
        processed: list[ProcessedImage] = []

        for i, base64_img in enumerate(base64_images):
            try:
                processed_img = self.process_image(base64_img, resize=resize)
                processed.append(processed_img)
            except (InvalidImageError, ImageProcessingError) as e:
                raise ImageProcessingError(
                    f"Error en imagen {i + 1}: {e.message}",
                    detail=e.detail,
                ) from e

        logger.info(f"Procesadas {len(processed)} imágenes correctamente")
        return processed

    @property
    def processed_count(self) -> int:
        """Número de imágenes procesadas."""
        return self._processed_count


# Instancia singleton
image_processor = ImageProcessor()
```

---

## Servicio Generador de Documentos

### backend/app/services/document_generator.py

```python
"""
Servicio generador de documentos Word.

Crea documentos .docx con imágenes acomodadas según la configuración.
"""

import math
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
from docx.shared import Cm, Pt
from docx.table import Table

from app.config import settings
from app.core import (
    PAGE_SIZES,
    DocumentGenerationError,
    logger,
)
from app.models import DocumentConfig
from app.services.image_processor import ProcessedImage


@dataclass
class GenerationResult:
    """Resultado de la generación de un documento."""

    filename: str
    path: Path
    pages: int
    images_placed: int
    file_size_bytes: int

    @property
    def file_size_kb(self) -> float:
        """Tamaño del archivo en KB."""
        return round(self.file_size_bytes / 1024, 2)


class DocumentGenerator:
    """Generador de documentos Word con imágenes."""

    def __init__(self, output_dir: Path | None = None) -> None:
        """
        Inicializa el generador.

        Args:
            output_dir: Directorio de salida para los documentos
        """
        self.output_dir = output_dir or settings.get_output_path()

    def _get_page_dimensions(
        self,
        page_size: str,
        orientation: str,
    ) -> tuple[float, float]:
        """
        Obtiene las dimensiones de la página en centímetros.

        Args:
            page_size: Tamaño de página (carta, a4, etc.)
            orientation: Orientación (vertical, horizontal)

        Returns:
            Tupla (ancho, alto) en centímetros
        """
        dimensions = PAGE_SIZES.get(page_size, PAGE_SIZES["carta"])
        width, height = dimensions.width, dimensions.height

        if orientation == "horizontal":
            width, height = height, width

        return width, height

    def _calculate_images_per_row(
        self,
        config: DocumentConfig,
        page_width: float,
    ) -> int:
        """
        Calcula cuántas imágenes caben por fila.

        Args:
            config: Configuración del documento
            page_width: Ancho de página en cm

        Returns:
            Número de imágenes por fila
        """
        if config.images_per_row != "auto":
            return int(config.images_per_row)

        # Espacio disponible = ancho página - márgenes
        available_width = page_width - (config.margins_cm * 2)

        # Imágenes que caben considerando el espacio entre ellas
        image_total_width = config.image_width_cm + config.spacing_cm
        images_per_row = int(available_width / image_total_width)

        # Mínimo 1, máximo 6
        return max(1, min(images_per_row, 6))

    def _calculate_rows_needed(
        self,
        total_images: int,
        images_per_row: int,
    ) -> int:
        """
        Calcula el número de filas necesarias.

        Args:
            total_images: Total de imágenes
            images_per_row: Imágenes por fila

        Returns:
            Número de filas
        """
        return math.ceil(total_images / images_per_row)

    def _setup_document(
        self,
        config: DocumentConfig,
    ) -> tuple[Document, float, float]:
        """
        Configura un documento nuevo con las dimensiones especificadas.

        Args:
            config: Configuración del documento

        Returns:
            Tupla (Document, ancho_página, alto_página)
        """
        doc = Document()

        page_width, page_height = self._get_page_dimensions(
            config.page_size,
            config.page_orientation,
        )

        # Configurar sección
        section = doc.sections[0]
        section.page_width = Cm(page_width)
        section.page_height = Cm(page_height)
        section.left_margin = Cm(config.margins_cm)
        section.right_margin = Cm(config.margins_cm)
        section.top_margin = Cm(config.margins_cm)
        section.bottom_margin = Cm(config.margins_cm)

        return doc, page_width, page_height

    def _create_table(
        self,
        doc: Document,
        rows: int,
        cols: int,
    ) -> Table:
        """
        Crea una tabla para acomodar las imágenes.

        Args:
            doc: Documento Word
            rows: Número de filas
            cols: Número de columnas

        Returns:
            Tabla creada
        """
        table = doc.add_table(rows=rows, cols=cols)

        # Eliminar bordes de la tabla
        tbl = table._tbl
        tbl_pr = tbl.tblPr if tbl.tblPr is not None else parse_xml(
            f'<w:tblPr {nsdecls("w")}/>'
        )

        # Configurar bordes invisibles
        tbl_borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            '<w:top w:val="none"/>'
            '<w:left w:val="none"/>'
            '<w:bottom w:val="none"/>'
            '<w:right w:val="none"/>'
            '<w:insideH w:val="none"/>'
            '<w:insideV w:val="none"/>'
            "</w:tblBorders>"
        )
        tbl_pr.append(tbl_borders)

        return table

    def _insert_image(
        self,
        cell,
        image: ProcessedImage,
        width_cm: float,
        height_cm: float | None,
        add_border: bool,
    ) -> None:
        """
        Inserta una imagen en una celda de la tabla.

        Args:
            cell: Celda de la tabla
            image: Imagen procesada
            width_cm: Ancho en centímetros
            height_cm: Alto en centímetros (None = proporcional)
            add_border: Agregar borde a la imagen
        """
        # Configurar celda
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER

        # Obtener o crear párrafo
        paragraph = cell.paragraphs[0] if cell.paragraphs else cell.add_paragraph()
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER

        # Resetear el stream de la imagen
        image.stream.seek(0)

        # Crear run e insertar imagen
        run = paragraph.add_run()

        # Calcular dimensiones
        if height_cm is None:
            # Mantener proporción
            aspect_ratio = image.info.aspect_ratio
            height_cm = width_cm / aspect_ratio

        # Insertar imagen con dimensiones
        picture = run.add_picture(image.stream, width=Cm(width_cm), height=Cm(height_cm))

        # Agregar borde si está configurado
        if add_border:
            self._add_picture_border(picture)

    def _add_picture_border(self, picture) -> None:
        """
        Agrega un borde negro a una imagen.

        Args:
            picture: Objeto InlineShape de la imagen
        """
        # Obtener el elemento XML de la imagen
        inline = picture._inline
        spPr = inline.graphic.graphicData.pic.spPr

        # Crear elemento de línea
        ln = parse_xml(
            f'<a:ln {nsdecls("a")} w="12700">'  # 1pt = 12700 EMUs
            '<a:solidFill><a:srgbClr val="000000"/></a:solidFill>'
            "</a:ln>"
        )
        spPr.append(ln)

    def _estimate_pages(
        self,
        total_images: int,
        images_per_row: int,
        image_height_cm: float,
        page_height: float,
        margins_cm: float,
        spacing_cm: float,
    ) -> int:
        """
        Estima el número de páginas del documento.

        Args:
            total_images: Total de imágenes
            images_per_row: Imágenes por fila
            image_height_cm: Alto de cada imagen
            page_height: Alto de página
            margins_cm: Márgenes
            spacing_cm: Espacio entre imágenes

        Returns:
            Número estimado de páginas
        """
        # Espacio disponible por página
        available_height = page_height - (margins_cm * 2)

        # Altura de cada fila (imagen + espaciado)
        row_height = image_height_cm + spacing_cm

        # Filas por página
        rows_per_page = max(1, int(available_height / row_height))

        # Total de filas necesarias
        total_rows = math.ceil(total_images / images_per_row)

        # Páginas necesarias
        return max(1, math.ceil(total_rows / rows_per_page))

    def generate(
        self,
        images: list[ProcessedImage],
        config: DocumentConfig,
    ) -> GenerationResult:
        """
        Genera un documento Word con las imágenes.

        Args:
            images: Lista de imágenes procesadas
            config: Configuración del documento

        Returns:
            GenerationResult con información del documento generado

        Raises:
            DocumentGenerationError: Si hay error en la generación
        """
        if not images:
            raise DocumentGenerationError("No hay imágenes para generar el documento")

        try:
            logger.info(
                f"Generando documento: {len(images)} imágenes, "
                f"tamaño={config.page_size}, ancho_img={config.image_width_cm}cm"
            )

            # 1. Configurar documento
            doc, page_width, page_height = self._setup_document(config)

            # 2. Calcular layout
            images_per_row = self._calculate_images_per_row(config, page_width)
            rows_needed = self._calculate_rows_needed(len(images), images_per_row)

            logger.debug(
                f"Layout: {images_per_row} imágenes/fila, {rows_needed} filas totales"
            )

            # 3. Crear tabla
            table = self._create_table(doc, rows_needed, images_per_row)

            # 4. Insertar imágenes
            for idx, image in enumerate(images):
                row = idx // images_per_row
                col = idx % images_per_row

                cell = table.rows[row].cells[col]

                self._insert_image(
                    cell=cell,
                    image=image,
                    width_cm=config.image_width_cm,
                    height_cm=config.image_height_cm,
                    add_border=config.borders,
                )

            # 5. Generar nombre de archivo
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{config.filename}_{timestamp}.docx"
            output_path = self.output_dir / filename

            # 6. Guardar documento
            doc.save(str(output_path))

            # 7. Obtener tamaño del archivo
            file_size = output_path.stat().st_size

            # 8. Estimar páginas
            avg_image_height = config.image_width_cm / 1.5  # Aspect ratio típico
            estimated_pages = self._estimate_pages(
                len(images),
                images_per_row,
                config.image_height_cm or avg_image_height,
                page_height,
                config.margins_cm,
                config.spacing_cm,
            )

            result = GenerationResult(
                filename=filename,
                path=output_path,
                pages=estimated_pages,
                images_placed=len(images),
                file_size_bytes=file_size,
            )

            logger.info(
                f"Documento generado: {filename} "
                f"({result.file_size_kb}KB, ~{estimated_pages} páginas)"
            )

            return result

        except DocumentGenerationError:
            raise
        except Exception as e:
            raise DocumentGenerationError(
                f"Error generando documento: {e}",
                detail=str(type(e).__name__),
            ) from e


# Instancia singleton
document_generator = DocumentGenerator()
```

---

## Servicio de Gestión de Archivos

### backend/app/services/file_manager.py

```python
"""
Servicio de gestión de archivos.

Maneja operaciones de archivos: limpieza, listado, etc.
"""

from datetime import datetime, timedelta
from pathlib import Path

from app.config import settings
from app.core import FileOperationError, logger


class FileManager:
    """Gestor de archivos del sistema."""

    def __init__(self, output_dir: Path | None = None) -> None:
        """
        Inicializa el gestor de archivos.

        Args:
            output_dir: Directorio de archivos generados
        """
        self.output_dir = output_dir or settings.get_output_path()

    def get_file_path(self, filename: str) -> Path:
        """
        Obtiene la ruta completa de un archivo.

        Args:
            filename: Nombre del archivo

        Returns:
            Path completo

        Raises:
            FileOperationError: Si el archivo no existe
        """
        file_path = self.output_dir / filename

        if not file_path.exists():
            raise FileOperationError(f"Archivo no encontrado: {filename}")

        return file_path

    def list_files(
        self,
        extension: str = ".docx",
        limit: int = 50,
    ) -> list[dict]:
        """
        Lista los archivos generados.

        Args:
            extension: Extensión a filtrar
            limit: Número máximo de archivos

        Returns:
            Lista de diccionarios con información de archivos
        """
        files = []

        for file_path in sorted(
            self.output_dir.glob(f"*{extension}"),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )[:limit]:
            stat = file_path.stat()
            files.append({
                "filename": file_path.name,
                "size_kb": round(stat.st_size / 1024, 2),
                "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            })

        return files

    def delete_file(self, filename: str) -> bool:
        """
        Elimina un archivo.

        Args:
            filename: Nombre del archivo

        Returns:
            True si se eliminó correctamente

        Raises:
            FileOperationError: Si hay error al eliminar
        """
        try:
            file_path = self.get_file_path(filename)
            file_path.unlink()
            logger.info(f"Archivo eliminado: {filename}")
            return True
        except FileOperationError:
            raise
        except Exception as e:
            raise FileOperationError(f"Error eliminando archivo: {e}") from e

    def cleanup_old_files(
        self,
        days: int | None = None,
        extension: str = ".docx",
    ) -> int:
        """
        Elimina archivos más antiguos que X días.

        Args:
            days: Días de antigüedad (default: settings.cleanup_days)
            extension: Extensión de archivos a limpiar

        Returns:
            Número de archivos eliminados
        """
        days = days or settings.cleanup_days
        cutoff_date = datetime.now() - timedelta(days=days)
        deleted_count = 0

        for file_path in self.output_dir.glob(f"*{extension}"):
            file_mtime = datetime.fromtimestamp(file_path.stat().st_mtime)

            if file_mtime < cutoff_date:
                try:
                    file_path.unlink()
                    deleted_count += 1
                    logger.debug(f"Archivo antiguo eliminado: {file_path.name}")
                except Exception as e:
                    logger.warning(f"No se pudo eliminar {file_path.name}: {e}")

        if deleted_count > 0:
            logger.info(f"Limpieza completada: {deleted_count} archivos eliminados")

        return deleted_count

    def get_disk_usage(self) -> dict:
        """
        Obtiene información del uso de disco.

        Returns:
            Diccionario con información de uso
        """
        total_size = 0
        file_count = 0

        for file_path in self.output_dir.glob("*"):
            if file_path.is_file():
                total_size += file_path.stat().st_size
                file_count += 1

        return {
            "total_files": file_count,
            "total_size_mb": round(total_size / 1024 / 1024, 2),
            "output_dir": str(self.output_dir),
        }


# Instancia singleton
file_manager = FileManager()
```

### backend/app/services/__init__.py

```python
"""Servicios de la aplicación."""

from app.services.document_generator import (
    DocumentGenerator,
    GenerationResult,
    document_generator,
)
from app.services.file_manager import FileManager, file_manager
from app.services.image_processor import (
    ImageInfo,
    ImageProcessor,
    ProcessedImage,
    image_processor,
)

__all__ = [
    # Image Processor
    "ImageProcessor",
    "ImageInfo",
    "ProcessedImage",
    "image_processor",
    # Document Generator
    "DocumentGenerator",
    "GenerationResult",
    "document_generator",
    # File Manager
    "FileManager",
    "file_manager",
]
```

---

## Rutas de la API

### backend/app/api/routes/generator.py

```python
"""
Rutas de la API para generación de documentos.
"""

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

from app.core import DocumentGenerationError, ImageProcessingError, logger
from app.models import GenerateDocumentRequest, GenerateDocumentResponse
from app.services import document_generator, file_manager, image_processor


router = APIRouter(prefix="/generator", tags=["Generator"])


@router.post(
    "/generate",
    response_model=GenerateDocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generar documento Word",
    description="Genera un documento Word con las imágenes proporcionadas",
)
async def generate_document(
    request: GenerateDocumentRequest,
) -> GenerateDocumentResponse:
    """
    Genera un documento Word con las imágenes proporcionadas.

    - **images**: Lista de imágenes en base64
    - **config**: Configuración del documento (opcional)
    """
    try:
        logger.info(f"Solicitud de generación: {len(request.images)} imágenes")

        # 1. Procesar imágenes
        processed_images = image_processor.process_multiple(request.images)

        # 2. Generar documento
        result = document_generator.generate(processed_images, request.config)

        # 3. Retornar respuesta
        return GenerateDocumentResponse(
            success=True,
            filename=result.filename,
            path=str(result.path.absolute()),
            pages=result.pages,
            images_placed=result.images_placed,
            file_size_kb=result.file_size_kb,
        )

    except ImageProcessingError as e:
        logger.error(f"Error procesando imágenes: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.to_dict(),
        ) from e

    except DocumentGenerationError as e:
        logger.error(f"Error generando documento: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=e.to_dict(),
        ) from e


@router.get(
    "/download/{filename}",
    summary="Descargar documento",
    description="Descarga un documento generado previamente",
)
async def download_document(filename: str) -> FileResponse:
    """
    Descarga un documento generado.

    - **filename**: Nombre del archivo a descargar
    """
    try:
        file_path = file_manager.get_file_path(filename)

        return FileResponse(
            path=str(file_path),
            filename=filename,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Archivo no encontrado: {filename}",
        ) from e


@router.get(
    "/files",
    summary="Listar archivos",
    description="Lista los documentos generados recientemente",
)
async def list_files(limit: int = 20) -> dict:
    """
    Lista los documentos generados.

    - **limit**: Número máximo de archivos a listar
    """
    files = file_manager.list_files(limit=limit)
    return {"files": files, "count": len(files)}


@router.delete(
    "/files/{filename}",
    summary="Eliminar archivo",
    description="Elimina un documento generado",
)
async def delete_file(filename: str) -> dict:
    """
    Elimina un documento.

    - **filename**: Nombre del archivo a eliminar
    """
    try:
        file_manager.delete_file(filename)
        return {"success": True, "message": f"Archivo {filename} eliminado"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
```

### backend/app/api/routes/config.py

```python
"""
Rutas de la API para configuración.
"""

from fastapi import APIRouter

from app.config import settings
from app.core import ORIENTATIONS, PAGE_SIZES
from app.models import ConfigResponse


router = APIRouter(prefix="/config", tags=["Configuration"])


@router.get(
    "/defaults",
    response_model=ConfigResponse,
    summary="Obtener configuración por defecto",
    description="Retorna los valores por defecto y opciones disponibles",
)
async def get_defaults() -> ConfigResponse:
    """Obtiene la configuración por defecto del sistema."""
    return ConfigResponse(
        page_sizes=list(PAGE_SIZES.keys()),
        orientations=ORIENTATIONS,
        defaults={
            "page_size": settings.default_page_size,
            "page_orientation": "vertical",
            "image_width_cm": settings.default_image_width_cm,
            "image_height_cm": None,
            "images_per_row": "auto",
            "spacing_cm": settings.default_spacing_cm,
            "margins_cm": settings.default_margins_cm,
            "borders": False,
            "filename": "documento",
        },
    )


@router.get(
    "/page-sizes",
    summary="Obtener tamaños de página",
    description="Retorna los tamaños de página disponibles con sus dimensiones",
)
async def get_page_sizes() -> dict:
    """Obtiene los tamaños de página disponibles."""
    return {
        name: {"width_cm": dims.width, "height_cm": dims.height}
        for name, dims in PAGE_SIZES.items()
    }
```

### backend/app/api/routes/health.py

```python
"""
Rutas de health check y estado del sistema.
"""

from fastapi import APIRouter

from app.config import settings
from app.models import HealthResponse
from app.services import file_manager


router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    description="Verifica el estado de la aplicación",
)
async def health_check() -> HealthResponse:
    """Verifica que la aplicación esté funcionando."""
    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        environment=settings.app_env,
    )


@router.get(
    "/status",
    summary="Estado del sistema",
    description="Retorna información detallada del estado del sistema",
)
async def system_status() -> dict:
    """Obtiene el estado detallado del sistema."""
    disk_usage = file_manager.get_disk_usage()

    return {
        "application": {
            "name": settings.app_name,
            "version": settings.app_version,
            "environment": settings.app_env,
        },
        "storage": disk_usage,
        "limits": {
            "max_file_size_mb": settings.max_file_size_mb,
            "max_images_per_request": settings.max_images_per_request,
        },
    }
```

### backend/app/api/routes/__init__.py

```python
"""Rutas de la API."""

from app.api.routes.config import router as config_router
from app.api.routes.generator import router as generator_router
from app.api.routes.health import router as health_router

__all__ = ["generator_router", "config_router", "health_router"]
```

### backend/app/api/__init__.py

```python
"""API module."""

from fastapi import APIRouter

from app.api.routes import config_router, generator_router, health_router


# Router principal que agrupa todos los sub-routers
api_router = APIRouter(prefix="/api")

# Incluir routers
api_router.include_router(health_router)
api_router.include_router(generator_router)
api_router.include_router(config_router)

__all__ = ["api_router"]
```

---

## Aplicación Principal

### backend/app/main.py

```python
"""
Aplicación principal FastAPI.

Entry point de la aplicación.
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api import api_router
from app.config import settings
from app.core import PrintShopError, logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Maneja el ciclo de vida de la aplicación.

    - Startup: inicialización
    - Shutdown: limpieza
    """
    # === STARTUP ===
    logger.info(f"Iniciando {settings.app_name} v{settings.app_version}")
    logger.info(f"Entorno: {settings.app_env}")
    logger.info(f"Output dir: {settings.get_output_path()}")

    yield

    # === SHUTDOWN ===
    logger.info("Cerrando aplicación...")


def create_app() -> FastAPI:
    """
    Factory function para crear la aplicación FastAPI.

    Returns:
        Instancia configurada de FastAPI
    """
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="API para generar documentos Word con imágenes",
        docs_url="/docs" if settings.is_development else None,
        redoc_url="/redoc" if settings.is_development else None,
        lifespan=lifespan,
    )

    # === MIDDLEWARE ===

    # CORS - permitir requests del frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if settings.is_development else ["http://localhost:8000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # === EXCEPTION HANDLERS ===

    @app.exception_handler(PrintShopError)
    async def print_shop_error_handler(
        request: Request,
        exc: PrintShopError,
    ) -> JSONResponse:
        """Maneja excepciones personalizadas de la aplicación."""
        logger.error(f"PrintShopError: {exc.message} ({exc.code})")
        return JSONResponse(
            status_code=400,
            content=exc.to_dict(),
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        """Maneja excepciones no controladas."""
        logger.exception(f"Error no controlado: {exc}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Error interno del servidor",
                "code": "INTERNAL_ERROR",
            },
        )

    # === ROUTES ===

    # API routes
    app.include_router(api_router)

    # Servir frontend estático
    frontend_path = Path(__file__).parent.parent.parent / "frontend"
    if frontend_path.exists():
        app.mount(
            "/",
            StaticFiles(directory=str(frontend_path), html=True),
            name="frontend",
        )

    return app


# Crear instancia de la aplicación
app = create_app()


# === PARA DESARROLLO ===
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
    )
```

---

## Tests Unitarios

### backend/tests/conftest.py

```python
"""
Fixtures compartidos para tests.
"""

import base64
from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.models import DocumentConfig


@pytest.fixture
def client() -> TestClient:
    """Cliente de prueba para la API."""
    return TestClient(app)


@pytest.fixture
def sample_image_base64() -> str:
    """Genera una imagen de prueba en base64."""
    # Crear imagen roja de 100x100
    img = Image.new("RGB", (100, 100), color="red")

    # Convertir a bytes
    buffer = BytesIO()
    img.save(buffer, format="JPEG")
    buffer.seek(0)

    # Codificar en base64
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


@pytest.fixture
def sample_images_base64(sample_image_base64: str) -> list[str]:
    """Lista de imágenes de prueba."""
    return [sample_image_base64] * 4


@pytest.fixture
def default_config() -> DocumentConfig:
    """Configuración por defecto para tests."""
    return DocumentConfig(
        page_size="carta",
        page_orientation="vertical",
        image_width_cm=10.0,
        images_per_row="auto",
        filename="test_document",
    )
```

### backend/tests/test_generator.py

```python
"""
Tests para el servicio generador de documentos.
"""

import pytest

from app.models import DocumentConfig
from app.services import document_generator, image_processor
from app.services.image_processor import ProcessedImage


class TestDocumentGenerator:
    """Tests para DocumentGenerator."""

    def test_generate_single_image(
        self,
        sample_image_base64: str,
        default_config: DocumentConfig,
    ) -> None:
        """Test generación con una imagen."""
        # Procesar imagen
        processed = image_processor.process_image(sample_image_base64)

        # Generar documento
        result = document_generator.generate([processed], default_config)

        assert result.filename.startswith("test_document_")
        assert result.filename.endswith(".docx")
        assert result.images_placed == 1
        assert result.path.exists()

        # Limpiar
        result.path.unlink()

    def test_generate_multiple_images(
        self,
        sample_images_base64: list[str],
        default_config: DocumentConfig,
    ) -> None:
        """Test generación con múltiples imágenes."""
        # Procesar imágenes
        processed = image_processor.process_multiple(sample_images_base64)

        # Generar documento
        result = document_generator.generate(processed, default_config)

        assert result.images_placed == 4
        assert result.path.exists()

        # Limpiar
        result.path.unlink()

    def test_different_page_sizes(
        self,
        sample_image_base64: str,
    ) -> None:
        """Test generación con diferentes tamaños de página."""
        processed = image_processor.process_image(sample_image_base64)

        for page_size in ["carta", "a4", "a3", "oficio"]:
            config = DocumentConfig(
                page_size=page_size,
                filename=f"test_{page_size}",
            )
            result = document_generator.generate([processed], config)

            assert result.path.exists()
            result.path.unlink()
```

### backend/tests/test_image_processor.py

```python
"""
Tests para el servicio de procesamiento de imágenes.
"""

import base64
from io import BytesIO

import pytest
from PIL import Image

from app.core import InvalidImageError
from app.services import image_processor


class TestImageProcessor:
    """Tests para ImageProcessor."""

    def test_decode_valid_base64(self, sample_image_base64: str) -> None:
        """Test decodificación de base64 válido."""
        result = image_processor.decode_base64(sample_image_base64)
        assert isinstance(result, bytes)
        assert len(result) > 0

    def test_decode_with_data_uri(self, sample_image_base64: str) -> None:
        """Test decodificación con prefijo data URI."""
        data_uri = f"data:image/jpeg;base64,{sample_image_base64}"
        result = image_processor.decode_base64(data_uri)
        assert isinstance(result, bytes)

    def test_decode_invalid_base64(self) -> None:
        """Test error con base64 inválido."""
        with pytest.raises(InvalidImageError):
            image_processor.decode_base64("not-valid-base64!!!")

    def test_validate_valid_image(self, sample_image_base64: str) -> None:
        """Test validación de imagen válida."""
        image_bytes = image_processor.decode_base64(sample_image_base64)
        result = image_processor.validate_image(image_bytes)
        assert isinstance(result, Image.Image)

    def test_validate_invalid_image(self) -> None:
        """Test error con imagen inválida."""
        with pytest.raises(InvalidImageError):
            image_processor.validate_image(b"not an image")

    def test_get_orientation_horizontal(self) -> None:
        """Test detección de orientación horizontal."""
        result = image_processor.get_orientation(200, 100)
        assert result == "horizontal"

    def test_get_orientation_vertical(self) -> None:
        """Test detección de orientación vertical."""
        result = image_processor.get_orientation(100, 200)
        assert result == "vertical"

    def test_get_orientation_square(self) -> None:
        """Test detección de orientación cuadrada."""
        result = image_processor.get_orientation(100, 100)
        assert result == "square"

    def test_process_image_complete(self, sample_image_base64: str) -> None:
        """Test procesamiento completo de imagen."""
        result = image_processor.process_image(sample_image_base64)

        assert result.data is not None
        assert len(result.data) > 0
        assert result.info.width == 100
        assert result.info.height == 100
        assert result.stream is not None
```

### backend/tests/test_api/test_routes.py

```python
"""
Tests para las rutas de la API.
"""

import pytest
from fastapi.testclient import TestClient


class TestHealthRoutes:
    """Tests para rutas de health check."""

    def test_health_check(self, client: TestClient) -> None:
        """Test endpoint de health check."""
        response = client.get("/api/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data

    def test_system_status(self, client: TestClient) -> None:
        """Test endpoint de estado del sistema."""
        response = client.get("/api/status")

        assert response.status_code == 200
        data = response.json()
        assert "application" in data
        assert "storage" in data


class TestConfigRoutes:
    """Tests para rutas de configuración."""

    def test_get_defaults(self, client: TestClient) -> None:
        """Test obtener configuración por defecto."""
        response = client.get("/api/config/defaults")

        assert response.status_code == 200
        data = response.json()
        assert "page_sizes" in data
        assert "carta" in data["page_sizes"]
        assert "defaults" in data

    def test_get_page_sizes(self, client: TestClient) -> None:
        """Test obtener tamaños de página."""
        response = client.get("/api/config/page-sizes")

        assert response.status_code == 200
        data = response.json()
        assert "carta" in data
        assert "width_cm" in data["carta"]


class TestGeneratorRoutes:
    """Tests para rutas de generación."""

    def test_generate_document(
        self,
        client: TestClient,
        sample_images_base64: list[str],
    ) -> None:
        """Test generar documento."""
        response = client.post(
            "/api/generator/generate",
            json={
                "images": sample_images_base64,
                "config": {
                    "page_size": "carta",
                    "image_width_cm": 10,
                    "filename": "test_api",
                },
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["images_placed"] == 4
        assert "filename" in data

    def test_generate_empty_images(self, client: TestClient) -> None:
        """Test error con lista vacía de imágenes."""
        response = client.post(
            "/api/generator/generate",
            json={"images": []},
        )

        assert response.status_code == 422  # Validation error

    def test_list_files(self, client: TestClient) -> None:
        """Test listar archivos."""
        response = client.get("/api/generator/files")

        assert response.status_code == 200
        data = response.json()
        assert "files" in data
        assert "count" in data
```

---

## Verificación de la Fase

### Ejecutar tests

```bash
# Activar entorno virtual
.\venv\Scripts\Activate.ps1  # Windows
source venv/bin/activate      # Linux/Mac

# Ejecutar todos los tests
pytest

# Con cobertura
pytest --cov=app --cov-report=html

# Tests específicos
pytest backend/tests/test_generator.py -v
```

### Probar la API manualmente

```bash
# Iniciar servidor
cd backend
python -m uvicorn app.main:app --reload

# En otra terminal, probar endpoints:

# Health check
curl http://localhost:8000/api/health

# Configuración
curl http://localhost:8000/api/config/defaults

# Documentación interactiva
# Abrir en navegador: http://localhost:8000/docs
```

### Checklist de verificación

- [ ] Servidor inicia sin errores
- [ ] Health check responde correctamente
- [ ] Endpoint /docs muestra documentación Swagger
- [ ] Tests pasan (pytest)
- [ ] Se puede generar un documento con imágenes de prueba

---

## Próximos Pasos

Una vez completada esta fase, continúa con:

**[Fase 2: Frontend Funcional](./02-fase-2-frontend-funcional.md)**

---

*Fase 1: Backend Básico - Print Shop Generator*
