/**
 * Constantes de la aplicación
 *
 * Centraliza todos los valores constantes para fácil mantenimiento.
 */

// URL base del API (misma que sirve el frontend)
export const API_BASE_URL = window.location.origin;

// Límites de la aplicación
export const LIMITS = {
    MAX_IMAGES: 100,
    MAX_FILE_SIZE_MB: 10,
    MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
    MIN_IMAGE_WIDTH_CM: 1,
    MAX_IMAGE_WIDTH_CM: 30,
};

// Formatos de imagen soportados
export const SUPPORTED_FORMATS = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
];

// Extensiones permitidas para mostrar al usuario
export const SUPPORTED_EXTENSIONS = ['JPG', 'PNG', 'WEBP', 'GIF', 'BMP'];

// Tamaños de página disponibles (dimensiones en cm)
export const PAGE_SIZES = {
    carta: { width: 21.59, height: 27.94, label: 'Carta (Letter)' },
    a4: { width: 21.0, height: 29.7, label: 'A4' },
    a3: { width: 29.7, height: 42.0, label: 'A3' },
    oficio: { width: 21.59, height: 35.56, label: 'Oficio (Folio)' },
    legal: { width: 21.59, height: 35.56, label: 'Legal' },
};

// Orientaciones de página
export const ORIENTATION = {
    VERTICAL: 'vertical',
    HORIZONTAL: 'horizontal',
    PORTRAIT: 'portrait',
    LANDSCAPE: 'landscape',
};

// Alineación de imágenes
export const IMAGE_ALIGNMENT = {
    LEFT: 'left',
    CENTER: 'center',
    RIGHT: 'right',
};

// Disposición de imágenes
export const IMAGE_LAYOUT = {
    VERTICAL: 'vertical',   // Una imagen por línea (con enters)
    INLINE: 'inline',       // Múltiples imágenes en línea (con espacios)
};

// Configuración por defecto
export const DEFAULT_CONFIG = {
    pageSize: 'carta',
    imageWidthCm: 10,
    imagesPerRow: 'auto',
    spacingCm: 0.5,
    marginsCm: 1.5,
    borders: false,
    orientation: 'portrait',
    imageAlignment: 'left',     // left, center, right
    imageLayout: 'vertical',    // vertical (enters), inline (espacios)
};

// Tiempos de notificación (ms)
export const NOTIFICATION_DURATION = {
    success: 4000,
    error: 6000,
    warning: 5000,
    info: 4000,
};

// Teclas de atajo
export const KEYBOARD_SHORTCUTS = {
    GENERATE: 'Enter',
    CLEAR: 'Escape',
    SELECT_FILES: 'o',
};

// Estados de la aplicación
export const APP_STATES = {
    IDLE: 'idle',
    LOADING: 'loading',
    PROCESSING: 'processing',
    SUCCESS: 'success',
    ERROR: 'error',
};

// Versión de la aplicación
export const APP_VERSION = '2.0.0';
