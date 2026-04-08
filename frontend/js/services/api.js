/**
 * Cliente API
 *
 * Maneja toda la comunicación con el backend FastAPI.
 * Incluye manejo de errores, reintentos y formateo de respuestas.
 */

import { API_BASE_URL } from '../utils/constants.js';

export class ApiClient {
    /**
     * @param {string} baseUrl - URL base del API
     * @param {Object} options - Opciones de configuración
     */
    constructor(baseUrl = API_BASE_URL, options = {}) {
        this.baseUrl = baseUrl;
        this.options = {
            timeout: 60000, // 60 segundos para generación de documentos grandes
            retries: 1,
            ...options,
        };
    }

    /**
     * Realiza una petición HTTP al API
     * @param {string} endpoint - Endpoint del API
     * @param {Object} options - Opciones de fetch
     * @returns {Promise<Object>}
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        };

        // Crear AbortController para timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);
        config.signal = controller.signal;

        let lastError;
        let attempts = 0;

        while (attempts <= this.options.retries) {
            try {
                const response = await fetch(url, config);
                clearTimeout(timeoutId);

                // Intentar parsear JSON
                let data;
                const contentType = response.headers.get('content-type');

                if (contentType?.includes('application/json')) {
                    data = await response.json();
                } else {
                    // Para descargas de archivos u otros tipos
                    data = await response.blob();
                }

                // Verificar errores HTTP
                if (!response.ok) {
                    const errorMessage = this.extractErrorMessage(data, response.status);
                    throw new ApiError(errorMessage, response.status, data);
                }

                return data;

            } catch (error) {
                clearTimeout(timeoutId);
                lastError = error;

                // No reintentar ciertos errores
                if (error.name === 'AbortError') {
                    throw new ApiError('La solicitud tardó demasiado tiempo', 408);
                }

                if (error instanceof ApiError) {
                    // No reintentar errores de cliente (4xx)
                    if (error.status >= 400 && error.status < 500) {
                        throw error;
                    }
                }

                // Reintentar solo errores de red o servidor
                attempts++;
                if (attempts <= this.options.retries) {
                    await this.delay(1000 * attempts); // Backoff exponencial simple
                    continue;
                }

                // Manejar errores de conexión
                if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                    throw new ApiError(
                        'No se puede conectar con el servidor. Verifica que esté ejecutándose.',
                        0
                    );
                }

                throw error;
            }
        }

        throw lastError;
    }

    /**
     * Extrae el mensaje de error de una respuesta
     */
    extractErrorMessage(data, status) {
        if (typeof data === 'object') {
            return data.detail?.error
                || data.detail?.message
                || data.error
                || data.message
                || `Error del servidor (${status})`;
        }
        return `Error HTTP ${status}`;
    }

    /**
     * Espera un tiempo determinado
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // =========================================
    // Métodos HTTP
    // =========================================

    /**
     * GET request
     * @param {string} endpoint
     * @returns {Promise<Object>}
     */
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    /**
     * POST request
     * @param {string} endpoint
     * @param {Object} body
     * @returns {Promise<Object>}
     */
    async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    /**
     * DELETE request
     * @param {string} endpoint
     * @returns {Promise<Object>}
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // =========================================
    // Endpoints específicos
    // =========================================

    /**
     * Obtiene la configuración por defecto del servidor
     * @returns {Promise<Object>}
     */
    async getDefaults() {
        return this.get('/api/config/defaults');
    }

    /**
     * Obtiene los tamaños de página disponibles
     * @returns {Promise<Object>}
     */
    async getPageSizes() {
        return this.get('/api/config/page-sizes');
    }

    /**
     * Genera un documento Word
     * @param {Array<string>} images - Imágenes en base64
     * @param {Object} config - Configuración del documento
     * @returns {Promise<Object>} - Resultado de la generación
     */
    async generateDocument(images, config) {
        if (!images || images.length === 0) {
            throw new ApiError('Se requiere al menos una imagen', 400);
        }

        const payload = {
            images,
            config: {
                page_size: config.page_size || config.pageSize || 'carta',
                image_width_cm: parseFloat(config.image_width_cm || config.imageWidthCm) || 10,
                images_per_row: config.images_per_row || config.imagesPerRow || 'auto',
                filename: config.filename || 'documento',
                // Opciones avanzadas (Fase 3)
                orientation: config.orientation || 'portrait',
                spacing_cm: parseFloat(config.spacing_cm || config.spacingCm) || 0.5,
                margins_cm: parseFloat(config.margins_cm || config.marginsCm) || 1.5,
                borders: Boolean(config.borders),
            },
        };

        return this.post('/api/generator/generate', payload);
    }

    /**
     * Lista los archivos generados
     * @param {number} limit - Número máximo de archivos
     * @returns {Promise<Object>}
     */
    async listFiles(limit = 20) {
        return this.get(`/api/generator/files?limit=${limit}`);
    }

    /**
     * Elimina un archivo generado
     * @param {string} filename - Nombre del archivo
     * @returns {Promise<Object>}
     */
    async deleteFile(filename) {
        return this.delete(`/api/generator/files/${encodeURIComponent(filename)}`);
    }

    /**
     * Obtiene la URL de descarga de un archivo
     * @param {string} filename - Nombre del archivo
     * @returns {string}
     */
    getDownloadUrl(filename) {
        return `${this.baseUrl}/api/generator/download/${encodeURIComponent(filename)}`;
    }

    /**
     * Verifica el estado del servidor
     * @returns {Promise<Object>}
     */
    async healthCheck() {
        return this.get('/api/health');
    }

    /**
     * Obtiene el estado detallado del servidor
     * @returns {Promise<Object>}
     */
    async getStatus() {
        return this.get('/api/health/status');
    }

    /**
     * Verifica si el servidor está listo para procesar
     * @returns {Promise<boolean>}
     */
    async isReady() {
        try {
            const response = await this.get('/api/health/ready');
            return response.ready === true;
        } catch {
            return false;
        }
    }
}

/**
 * Clase de error personalizada para errores del API
 */
export class ApiError extends Error {
    /**
     * @param {string} message - Mensaje de error
     * @param {number} status - Código de estado HTTP
     * @param {Object} data - Datos adicionales del error
     */
    constructor(message, status = 0, data = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }

    /**
     * Verifica si es un error de red
     */
    isNetworkError() {
        return this.status === 0;
    }

    /**
     * Verifica si es un error de cliente (4xx)
     */
    isClientError() {
        return this.status >= 400 && this.status < 500;
    }

    /**
     * Verifica si es un error de servidor (5xx)
     */
    isServerError() {
        return this.status >= 500;
    }

    /**
     * Verifica si es un error de timeout
     */
    isTimeout() {
        return this.status === 408;
    }
}
