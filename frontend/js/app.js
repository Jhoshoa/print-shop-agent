/**
 * Print Shop Generator - Módulo Principal
 *
 * Entry point de la aplicación. Inicializa componentes,
 * maneja el estado global y coordina el flujo principal.
 *
 * @version 2.0.0 - Fase 3: Opciones Avanzadas
 */

import { Dropzone } from './components/dropzone.js';
import { SortableImageGrid } from './components/sortableImageGrid.js';
import { Notifications } from './components/notifications.js';
import { OptionsPanel } from './components/optionsPanel.js';
import { HistoryPanel } from './components/historyPanel.js';
import { LayoutPreview } from './components/layoutPreview.js';
import { ApiClient, ApiError } from './services/api.js';
import { StorageService } from './services/storage.js';
import { LIMITS, DEFAULT_CONFIG, KEYBOARD_SHORTCUTS, APP_VERSION } from './utils/constants.js';
import { formatFileSize, sanitizeFilename, debounce } from './utils/helpers.js';

class PrintShopApp {
    constructor() {
        // Estado de la aplicación
        this.images = [];
        this.isProcessing = false;
        this.lastResult = null;

        // Componentes (inicializados en init())
        this.notifications = null;
        this.dropzone = null;
        this.imageGrid = null;
        this.optionsPanel = null;
        this.historyPanel = null;
        this.layoutPreview = null;
        this.api = null;

        // Referencias DOM
        this.elements = {};
    }

    /**
     * Inicializa la aplicación
     */
    init() {
        this.cacheElements();
        this.initComponents();
        this.bindEvents();
        this.loadDefaults();
        this.checkServerHealth();

        console.log(`Print Shop Generator v${APP_VERSION} initialized`);
    }

    /**
     * Cachea referencias a elementos del DOM
     */
    cacheElements() {
        this.elements = {
            // Sections
            imagesSection: document.getElementById('images-section'),
            optionsPanelContainer: document.getElementById('options-panel-container'),
            generateSection: document.getElementById('generate-section'),
            resultSection: document.getElementById('result-section'),
            historySection: document.getElementById('history-section'),
            layoutPreviewContainer: document.getElementById('layout-preview-container'),

            // Buttons
            btnClear: document.getElementById('btn-clear'),
            btnGenerate: document.getElementById('btn-generate'),
            btnGenerateText: document.getElementById('btn-generate-text'),
            btnDownload: document.getElementById('btn-download'),
            btnNew: document.getElementById('btn-new'),
            btnOptions: document.getElementById('btn-options'),

            // Result display
            resultFilename: document.getElementById('result-filename'),
            resultPages: document.getElementById('result-pages'),
            resultSize: document.getElementById('result-size'),

            // Counters & grids
            imageCount: document.getElementById('image-count'),
            imagesGrid: document.getElementById('images-grid'),

            // Loading overlay
            loadingOverlay: document.getElementById('loading-overlay'),
            loadingText: document.getElementById('loading-text'),

            // Server status indicator
            serverStatus: document.getElementById('server-status'),
        };
    }

    /**
     * Inicializa componentes de la aplicación
     */
    initComponents() {
        // Sistema de notificaciones
        this.notifications = new Notifications('notifications', {
            maxNotifications: 4,
        });

        // Cliente API
        this.api = new ApiClient();

        // Dropzone para drag & drop
        this.dropzone = new Dropzone('dropzone', 'file-input', {
            onFilesAdded: (files) => this.handleFilesAdded(files),
            onError: (message) => this.notifications.error(message),
            onDragStateChange: (isDragging) => this.handleDragStateChange(isDragging),
        });

        // Grid de imágenes con reordenamiento
        this.imageGrid = new SortableImageGrid('images-grid', {
            onRemove: (index) => this.handleImageRemove(index),
            onReorder: (newImages) => this.handleImagesReorder(newImages),
            onImageClick: (index, image) => this.handleImageClick(index, image),
        });

        // Panel de opciones avanzadas
        this.optionsPanel = new OptionsPanel('options-panel-container', {
            onChange: (config) => this.handleConfigChange(config),
            onSaveDefaults: () => this.notifications.success('Configuración guardada como predeterminada'),
            onRestoreDefaults: () => this.notifications.info('Valores restaurados'),
            onError: (msg) => this.notifications.error(msg),
        });

        // Panel de historial
        this.historyPanel = new HistoryPanel('history-section', {
            onDownload: (filename) => this.handleHistoryDownload(filename),
            onClear: () => this.notifications.info('Historial limpiado'),
        });

        // Vista previa del layout
        this.layoutPreview = new LayoutPreview('layout-preview-container', {
            scale: 0.25,
            maxHeight: 300,
        });
    }

    /**
     * Vincula event listeners
     */
    bindEvents() {
        // Botones principales
        this.elements.btnClear?.addEventListener('click', () => this.clearAll());
        this.elements.btnGenerate?.addEventListener('click', () => this.generateDocument());
        this.elements.btnNew?.addEventListener('click', () => this.startNew());

        // Botón de opciones en header - toggle panel
        this.elements.btnOptions?.addEventListener('click', () => {
            this.optionsPanel?.toggle();
        });

        // Atajos de teclado globales
        document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));

        // Prevenir cierre accidental con cambios sin guardar
        window.addEventListener('beforeunload', (e) => this.handleBeforeUnload(e));
    }

    /**
     * Carga configuración por defecto desde el servidor
     */
    async loadDefaults() {
        try {
            const config = await this.api.getDefaults();

            if (config?.defaults) {
                // Si no hay config guardada localmente, usar la del servidor
                const savedConfig = StorageService.getConfig();
                if (!savedConfig) {
                    this.optionsPanel?.setConfig({
                        pageSize: config.defaults.page_size,
                        imageWidthCm: config.defaults.image_width_cm,
                        imagesPerRow: config.defaults.images_per_row,
                    });
                }
            }
        } catch (error) {
            console.warn('No se pudo cargar configuración del servidor:', error.message);
        }
    }

    /**
     * Verifica el estado del servidor
     */
    async checkServerHealth() {
        try {
            const isReady = await this.api.isReady();
            this.updateServerStatus(isReady);

            // Re-verificar periódicamente
            setInterval(async () => {
                try {
                    const ready = await this.api.isReady();
                    this.updateServerStatus(ready);
                } catch {
                    this.updateServerStatus(false);
                }
            }, 30000); // Cada 30 segundos
        } catch {
            this.updateServerStatus(false);
        }
    }

    /**
     * Actualiza el indicador de estado del servidor
     */
    updateServerStatus(isOnline) {
        if (this.elements.serverStatus) {
            this.elements.serverStatus.classList.toggle('online', isOnline);
            this.elements.serverStatus.classList.toggle('offline', !isOnline);
            this.elements.serverStatus.title = isOnline ? 'Servidor conectado' : 'Servidor desconectado';
        }
    }

    // =========================================
    // Manejo de archivos
    // =========================================

    /**
     * Maneja archivos agregados desde el dropzone
     */
    async handleFilesAdded(files) {
        if (!files || files.length === 0) return;

        // Validar límite de imágenes
        const currentCount = this.images.length;
        const maxRemaining = LIMITS.MAX_IMAGES - currentCount;

        if (maxRemaining <= 0) {
            this.notifications.warning(`Máximo ${LIMITS.MAX_IMAGES} imágenes permitidas`);
            return;
        }

        let filesToProcess = Array.from(files);

        if (filesToProcess.length > maxRemaining) {
            this.notifications.warning(
                `Se agregarán solo ${maxRemaining} imagen(es). Máximo ${LIMITS.MAX_IMAGES} en total.`
            );
            filesToProcess = filesToProcess.slice(0, maxRemaining);
        }

        this.showLoading('Cargando imágenes...');

        try {
            // Convertir archivos a base64 en paralelo
            const newImages = await Promise.all(
                filesToProcess.map(file => this.fileToBase64(file))
            );

            // Filtrar cualquier null (errores silenciosos)
            const validImages = newImages.filter(img => img !== null);

            if (validImages.length === 0) {
                this.notifications.error('No se pudieron cargar las imágenes');
                return;
            }

            // Agregar al estado
            this.images.push(...validImages);

            // Actualizar UI
            this.updateImagesUI();

            // Notificar éxito
            const count = validImages.length;
            this.notifications.success(
                `${count} imagen${count !== 1 ? 'es' : ''} agregada${count !== 1 ? 's' : ''}`
            );

        } catch (error) {
            console.error('Error cargando imágenes:', error);
            this.notifications.error('Error al cargar algunas imágenes');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Convierte un archivo a objeto de imagen con base64
     * @param {File} file
     * @returns {Promise<Object|null>}
     */
    fileToBase64(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();

            reader.onload = () => {
                resolve({
                    data: reader.result,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified,
                });
            };

            reader.onerror = () => {
                console.error(`Error leyendo archivo: ${file.name}`);
                resolve(null);
            };

            reader.readAsDataURL(file);
        });
    }

    /**
     * Maneja eliminación de una imagen
     */
    handleImageRemove(index) {
        if (index < 0 || index >= this.images.length) return;

        this.images.splice(index, 1);
        this.updateImagesUI();

        if (this.images.length === 0) {
            this.notifications.info('Todas las imágenes eliminadas');
        }
    }

    /**
     * Maneja reordenamiento de imágenes
     */
    handleImagesReorder(newImages) {
        this.images = newImages;
        this.updateImagesUI();
    }

    /**
     * Maneja click en una imagen
     */
    handleImageClick(index, image) {
        // Futuro: abrir modal de preview
        console.log('Image clicked:', index, image.name);
    }

    /**
     * Maneja cambio de estado de drag
     */
    handleDragStateChange(isDragging) {
        document.body.classList.toggle('dragging', isDragging);
    }

    /**
     * Maneja cambio de configuración desde el panel de opciones
     */
    handleConfigChange(config) {
        // Actualizar la vista previa del layout
        this.updateLayoutPreview();
    }

    /**
     * Maneja descarga desde historial
     */
    handleHistoryDownload(filename) {
        const url = this.api.getDownloadUrl(filename);

        // Verificar si el archivo existe
        fetch(url, { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    // Crear link temporal para descargar
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else {
                    this.notifications.warning('El archivo ya no está disponible en el servidor');
                }
            })
            .catch(() => {
                this.notifications.error('Error al descargar el archivo');
            });
    }

    // =========================================
    // Actualización de UI
    // =========================================

    /**
     * Actualiza toda la UI relacionada con imágenes
     */
    updateImagesUI() {
        const hasImages = this.images.length > 0;

        // Mostrar/ocultar secciones
        this.toggleSection(this.elements.imagesSection, hasImages);
        this.toggleSection(this.elements.optionsPanelContainer, hasImages);
        this.toggleSection(this.elements.generateSection, hasImages);
        this.toggleSection(this.elements.resultSection, false);

        // Actualizar contador
        if (this.elements.imageCount) {
            this.elements.imageCount.textContent = this.images.length;
        }

        // Renderizar grid
        this.imageGrid.render(this.images);

        // Actualizar texto del botón
        if (this.elements.btnGenerateText) {
            const count = this.images.length;
            this.elements.btnGenerateText.textContent =
                `Generar Documento (${count} imagen${count !== 1 ? 'es' : ''})`;
        }

        // Actualizar conteo en panel de opciones
        this.optionsPanel?.setImageCount(this.images.length);

        // Actualizar vista previa del layout
        this.updateLayoutPreview();
    }

    /**
     * Actualiza la vista previa del layout
     */
    updateLayoutPreview() {
        if (!this.layoutPreview) return;

        const config = this.optionsPanel?.getConfig() || {};

        // Convertir config a formato del LayoutPreview
        const previewConfig = {
            page_size: config.page_size || 'carta',
            page_orientation: config.orientation === 'landscape' ? 'horizontal' : 'vertical',
            margins_cm: config.margins_cm || 1.5,
            image_width_cm: config.image_width_cm || 10,
            images_per_row: config.images_per_row || 'auto',
            spacing_cm: config.spacing_cm || 0.5,
            borders: config.borders || false,
        };

        this.layoutPreview.update(previewConfig, this.images);
    }

    /**
     * Toggle de visibilidad de una sección
     */
    toggleSection(element, show) {
        if (element) {
            element.classList.toggle('hidden', !show);
        }
    }

    // =========================================
    // Generación de documento
    // =========================================

    /**
     * Genera el documento Word
     */
    async generateDocument() {
        if (this.images.length === 0) {
            this.notifications.warning('Agrega al menos una imagen');
            return;
        }

        if (this.isProcessing) {
            this.notifications.info('Ya hay una generación en proceso');
            return;
        }

        this.isProcessing = true;
        this.showLoading('Generando documento...');
        this.setGenerateButtonState(true);

        try {
            // Preparar datos
            const imageData = this.images.map(img => img.data);

            // Obtener configuración del panel de opciones
            const panelConfig = this.optionsPanel?.getConfig() || {};

            const config = {
                page_size: panelConfig.page_size || 'carta',
                page_orientation: panelConfig.orientation === 'landscape' ? 'horizontal' : 'vertical',
                image_width_cm: panelConfig.image_width_cm || DEFAULT_CONFIG.imageWidthCm,
                images_per_row: panelConfig.images_per_row || 'auto',
                margins_cm: panelConfig.margins_cm || 1.5,
                spacing_cm: panelConfig.spacing_cm || 0.5,
                borders: panelConfig.borders || false,
                filename: sanitizeFilename(panelConfig.filename) || 'documento',
            };

            // Actualizar loading con progreso estimado
            this.showLoading(`Procesando ${imageData.length} imagen${imageData.length !== 1 ? 'es' : ''}...`);

            // Llamar API
            const result = await this.api.generateDocument(imageData, config);

            if (result.success) {
                this.lastResult = result;
                this.showResult(result);

                // Agregar al historial
                this.historyPanel?.addDocument({
                    filename: result.filename,
                    pages: result.pages,
                    images_placed: result.images_placed,
                    file_size_kb: result.file_size_kb,
                    config: config,
                });

                this.notifications.success('Documento generado exitosamente');
            } else {
                throw new Error(result.error || 'Error desconocido al generar');
            }

        } catch (error) {
            console.error('Error generando documento:', error);

            let message = 'Error al generar el documento';

            if (error instanceof ApiError) {
                message = error.message;

                if (error.isTimeout()) {
                    message = 'La generación tardó demasiado. Intenta con menos imágenes.';
                } else if (error.isNetworkError()) {
                    message = 'No hay conexión con el servidor';
                }
            }

            this.notifications.error(message);

        } finally {
            this.isProcessing = false;
            this.hideLoading();
            this.setGenerateButtonState(false);
        }
    }

    /**
     * Muestra el resultado de la generación
     */
    showResult(result) {
        // Actualizar información del resultado
        if (this.elements.resultFilename) {
            this.elements.resultFilename.textContent = result.filename;
        }
        if (this.elements.resultPages) {
            this.elements.resultPages.textContent = result.pages;
        }
        if (this.elements.resultSize) {
            const sizeBytes = (result.file_size_kb || 0) * 1024;
            this.elements.resultSize.textContent = formatFileSize(sizeBytes);
        }

        // Configurar botón de descarga
        if (this.elements.btnDownload) {
            this.elements.btnDownload.href = this.api.getDownloadUrl(result.filename);
            this.elements.btnDownload.download = result.filename;
        }

        // Mostrar sección de resultado, ocultar botón generar
        this.toggleSection(this.elements.generateSection, false);
        this.toggleSection(this.elements.resultSection, true);

        // Expandir historial para mostrar el nuevo documento
        this.historyPanel?.expand();

        // Scroll suave al resultado
        this.elements.resultSection?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });
    }

    /**
     * Establece estado de carga del botón generar
     */
    setGenerateButtonState(loading) {
        const btn = this.elements.btnGenerate;
        if (!btn) return;

        btn.disabled = loading;
        btn.classList.toggle('btn-loading', loading);
    }

    // =========================================
    // Acciones de usuario
    // =========================================

    /**
     * Limpia todas las imágenes
     */
    clearAll() {
        if (this.images.length === 0) return;

        this.images = [];
        this.lastResult = null;
        this.updateImagesUI();
        this.layoutPreview?.clear();
        this.notifications.info('Imágenes eliminadas');
    }

    /**
     * Inicia un nuevo documento
     */
    startNew() {
        this.clearAll();

        // Limpiar nombre de archivo en el panel de opciones
        this.optionsPanel?.setFilename('');

        // Scroll al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // =========================================
    // Loading & UI helpers
    // =========================================

    /**
     * Muestra el overlay de carga
     */
    showLoading(text = 'Procesando...') {
        if (this.elements.loadingText) {
            this.elements.loadingText.textContent = text;
        }
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.remove('hidden');
        }
    }

    /**
     * Oculta el overlay de carga
     */
    hideLoading() {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.add('hidden');
        }
    }

    // =========================================
    // Event handlers globales
    // =========================================

    /**
     * Maneja atajos de teclado globales
     */
    handleGlobalKeydown(e) {
        // No interferir si hay un input enfocado
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
            return;
        }

        // Ctrl/Cmd + Enter: Generar documento
        if ((e.ctrlKey || e.metaKey) && e.key === KEYBOARD_SHORTCUTS.GENERATE) {
            e.preventDefault();
            if (this.images.length > 0 && !this.isProcessing) {
                this.generateDocument();
            }
            return;
        }

        // Escape: Limpiar
        if (e.key === KEYBOARD_SHORTCUTS.CLEAR) {
            if (this.images.length > 0) {
                e.preventDefault();
                this.clearAll();
            }
            return;
        }

        // O: Abrir selector de archivos
        if (e.key.toLowerCase() === KEYBOARD_SHORTCUTS.SELECT_FILES) {
            e.preventDefault();
            this.dropzone.openFileSelector();
            return;
        }
    }

    /**
     * Maneja intento de cerrar la página
     */
    handleBeforeUnload(e) {
        // Solo prevenir si hay imágenes cargadas
        if (this.images.length > 0) {
            e.preventDefault();
            e.returnValue = '¿Seguro que quieres salir? Las imágenes cargadas se perderán.';
            return e.returnValue;
        }
    }
}

// =========================================
// Inicialización
// =========================================

document.addEventListener('DOMContentLoaded', () => {
    const app = new PrintShopApp();
    app.init();

    // Exponer para debugging (solo en desarrollo)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.app = app;
    }
});
