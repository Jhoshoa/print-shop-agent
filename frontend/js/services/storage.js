/**
 * Servicio de Almacenamiento Local
 *
 * Maneja la persistencia de datos en localStorage con manejo de errores
 * y validación de datos.
 *
 * @version 1.0.0
 */

const STORAGE_KEYS = {
    CONFIG: 'printshop_config',
    HISTORY: 'printshop_history',
    PREFERENCES: 'printshop_preferences',
};

const MAX_HISTORY_ITEMS = 20;

export class StorageService {
    /**
     * Verifica si localStorage está disponible
     * @returns {boolean}
     */
    static isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Guarda un valor en localStorage
     * @param {string} key - Clave de almacenamiento
     * @param {*} value - Valor a guardar (será serializado a JSON)
     * @returns {boolean} - true si se guardó correctamente
     */
    static set(key, value) {
        if (!this.isAvailable()) {
            console.warn('localStorage no disponible');
            return false;
        }

        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
            return true;
        } catch (e) {
            console.error('Error guardando en localStorage:', e);
            // Posible error de cuota excedida
            if (e.name === 'QuotaExceededError') {
                this.clearOldData();
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch {
                    return false;
                }
            }
            return false;
        }
    }

    /**
     * Obtiene un valor de localStorage
     * @param {string} key - Clave de almacenamiento
     * @param {*} defaultValue - Valor por defecto si no existe
     * @returns {*} - Valor deserializado o defaultValue
     */
    static get(key, defaultValue = null) {
        if (!this.isAvailable()) {
            return defaultValue;
        }

        try {
            const item = localStorage.getItem(key);
            if (item === null) {
                return defaultValue;
            }
            return JSON.parse(item);
        } catch (e) {
            console.error('Error leyendo de localStorage:', e);
            return defaultValue;
        }
    }

    /**
     * Elimina un valor de localStorage
     * @param {string} key - Clave a eliminar
     * @returns {boolean}
     */
    static remove(key) {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            localStorage.removeItem(key);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Limpia datos antiguos para liberar espacio
     */
    static clearOldData() {
        // Reducir historial a la mitad
        const history = this.getHistory();
        if (history.length > MAX_HISTORY_ITEMS / 2) {
            this.set(STORAGE_KEYS.HISTORY, history.slice(0, MAX_HISTORY_ITEMS / 2));
        }
    }

    // =========================================
    // Métodos de Configuración
    // =========================================

    /**
     * Guarda la configuración del documento
     * @param {Object} config - Configuración a guardar
     * @returns {boolean}
     */
    static saveConfig(config) {
        return this.set(STORAGE_KEYS.CONFIG, {
            ...config,
            savedAt: new Date().toISOString(),
        });
    }

    /**
     * Obtiene la configuración guardada
     * @returns {Object|null}
     */
    static getConfig() {
        return this.get(STORAGE_KEYS.CONFIG);
    }

    /**
     * Elimina la configuración guardada
     * @returns {boolean}
     */
    static clearConfig() {
        return this.remove(STORAGE_KEYS.CONFIG);
    }

    // =========================================
    // Métodos de Historial
    // =========================================

    /**
     * Agrega un documento al historial
     * @param {Object} document - Documento generado
     * @returns {boolean}
     */
    static addToHistory(document) {
        const history = this.getHistory();

        // Crear entrada de historial
        const entry = {
            id: this.generateId(),
            filename: document.filename,
            pages: document.pages,
            images_placed: document.images_placed,
            file_size_kb: document.file_size_kb,
            config: document.config || {},
            timestamp: new Date().toISOString(),
        };

        // Agregar al inicio
        history.unshift(entry);

        // Mantener solo los últimos N items
        while (history.length > MAX_HISTORY_ITEMS) {
            history.pop();
        }

        return this.set(STORAGE_KEYS.HISTORY, history);
    }

    /**
     * Obtiene el historial de documentos
     * @returns {Array}
     */
    static getHistory() {
        return this.get(STORAGE_KEYS.HISTORY, []);
    }

    /**
     * Elimina un item del historial por ID
     * @param {string} id - ID del item a eliminar
     * @returns {boolean}
     */
    static removeFromHistory(id) {
        const history = this.getHistory();
        const filtered = history.filter(item => item.id !== id);

        if (filtered.length !== history.length) {
            return this.set(STORAGE_KEYS.HISTORY, filtered);
        }
        return false;
    }

    /**
     * Limpia todo el historial
     * @returns {boolean}
     */
    static clearHistory() {
        return this.remove(STORAGE_KEYS.HISTORY);
    }

    // =========================================
    // Métodos de Preferencias de UI
    // =========================================

    /**
     * Guarda preferencias de UI
     * @param {Object} prefs - Preferencias a guardar
     * @returns {boolean}
     */
    static savePreferences(prefs) {
        const current = this.getPreferences();
        return this.set(STORAGE_KEYS.PREFERENCES, {
            ...current,
            ...prefs,
            updatedAt: new Date().toISOString(),
        });
    }

    /**
     * Obtiene preferencias de UI
     * @returns {Object}
     */
    static getPreferences() {
        return this.get(STORAGE_KEYS.PREFERENCES, {
            optionsPanelExpanded: false,
            showPreview: true,
            showHistory: true,
            theme: 'light',
        });
    }

    /**
     * Actualiza una preferencia específica
     * @param {string} key - Clave de la preferencia
     * @param {*} value - Valor a guardar
     * @returns {boolean}
     */
    static setPreference(key, value) {
        const prefs = this.getPreferences();
        prefs[key] = value;
        return this.savePreferences(prefs);
    }

    /**
     * Obtiene una preferencia específica
     * @param {string} key - Clave de la preferencia
     * @param {*} defaultValue - Valor por defecto
     * @returns {*}
     */
    static getPreference(key, defaultValue = null) {
        const prefs = this.getPreferences();
        return prefs[key] !== undefined ? prefs[key] : defaultValue;
    }

    // =========================================
    // Utilidades
    // =========================================

    /**
     * Genera un ID único
     * @returns {string}
     */
    static generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Obtiene el tamaño total usado en localStorage (aproximado)
     * @returns {number} - Tamaño en bytes
     */
    static getStorageSize() {
        if (!this.isAvailable()) return 0;

        let total = 0;
        for (const key of Object.values(STORAGE_KEYS)) {
            const item = localStorage.getItem(key);
            if (item) {
                total += item.length * 2; // UTF-16 = 2 bytes por carácter
            }
        }
        return total;
    }

    /**
     * Limpia todos los datos de la aplicación
     * @returns {boolean}
     */
    static clearAll() {
        let success = true;
        for (const key of Object.values(STORAGE_KEYS)) {
            if (!this.remove(key)) {
                success = false;
            }
        }
        return success;
    }

    /**
     * Exporta todos los datos como objeto
     * @returns {Object}
     */
    static exportData() {
        return {
            config: this.getConfig(),
            history: this.getHistory(),
            preferences: this.getPreferences(),
            exportedAt: new Date().toISOString(),
        };
    }

    /**
     * Importa datos desde un objeto
     * @param {Object} data - Datos a importar
     * @returns {boolean}
     */
    static importData(data) {
        try {
            if (data.config) this.saveConfig(data.config);
            if (data.history) this.set(STORAGE_KEYS.HISTORY, data.history);
            if (data.preferences) this.savePreferences(data.preferences);
            return true;
        } catch {
            return false;
        }
    }
}

// Exportar constantes para uso externo si es necesario
export { STORAGE_KEYS, MAX_HISTORY_ITEMS };
