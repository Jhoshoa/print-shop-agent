/**
 * Panel de Opciones Avanzadas
 *
 * Panel expandible con todas las opciones de configuración del documento.
 * Incluye vista previa del layout y persistencia de configuración.
 *
 * @version 1.0.0
 */

import { PAGE_SIZES, DEFAULT_CONFIG, IMAGE_ALIGNMENT, IMAGE_LAYOUT } from '../utils/constants.js';
import { StorageService } from '../services/storage.js';
import { debounce } from '../utils/helpers.js';

export class OptionsPanel {
    /**
     * @param {string} containerId - ID del contenedor donde renderizar el panel
     * @param {Object} callbacks - Callbacks para eventos
     */
    constructor(containerId, callbacks = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.callbacks = {
            onChange: () => {},
            onSaveDefaults: () => {},
            onRestoreDefaults: () => {},
            onError: () => {},
            ...callbacks,
        };

        this.isExpanded = false;
        this.config = { ...DEFAULT_CONFIG };
        this.imageCount = 0;
        this.elements = {};

        this.init();
    }

    /**
     * Inicializa el panel
     */
    init() {
        if (!this.container) {
            console.error('OptionsPanel: contenedor no encontrado');
            return;
        }

        this.loadSavedConfig();
        this.createPanel();
        this.cacheElements();
        this.bindEvents();
        this.applyConfigToUI();

        // Cargar preferencia de estado expandido
        const prefs = StorageService.getPreferences();
        if (prefs.optionsPanelExpanded) {
            this.expand();
        }
    }

    /**
     * Crea el HTML del panel
     */
    createPanel() {
        this.container.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <!-- Header colapsable -->
                <button
                    id="options-header"
                    type="button"
                    class="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    aria-expanded="false"
                    aria-controls="options-content"
                >
                    <div class="flex items-center gap-2">
                        <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <span class="font-medium text-gray-700">Opciones de documento</span>
                        <span id="options-summary" class="text-sm text-gray-500 ml-2"></span>
                    </div>
                    <svg id="options-chevron" class="w-5 h-5 text-gray-500 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </button>

                <!-- Contenido expandible -->
                <div id="options-content" class="hidden border-t border-gray-200">
                    <div class="p-4 space-y-4">
                        <!-- Fila 1: Configuración de página -->
                        <div>
                            <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Configuración de Página</h4>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <!-- Tamaño de hoja -->
                                <div>
                                    <label for="opt-page-size" class="block text-sm font-medium text-gray-700 mb-1">
                                        Tamaño de hoja
                                    </label>
                                    <select id="opt-page-size" class="input-field">
                                        <option value="carta">Carta (21.59 x 27.94 cm)</option>
                                        <option value="a4">A4 (21 x 29.7 cm)</option>
                                        <option value="a3">A3 (29.7 x 42 cm)</option>
                                        <option value="oficio">Oficio (21.59 x 35.56 cm)</option>
                                        <option value="legal">Legal (21.59 x 35.56 cm)</option>
                                    </select>
                                </div>

                                <!-- Orientación -->
                                <div>
                                    <label for="opt-orientation" class="block text-sm font-medium text-gray-700 mb-1">
                                        Orientación
                                    </label>
                                    <select id="opt-orientation" class="input-field">
                                        <option value="portrait">Vertical (Retrato)</option>
                                        <option value="landscape">Horizontal (Paisaje)</option>
                                    </select>
                                </div>

                                <!-- Márgenes -->
                                <div>
                                    <label for="opt-margins" class="block text-sm font-medium text-gray-700 mb-1">
                                        Márgenes (cm)
                                    </label>
                                    <input type="number" id="opt-margins" class="input-field"
                                        value="1.5" min="0.5" max="5" step="0.5">
                                </div>
                            </div>
                        </div>

                        <!-- Fila 2: Configuración de imágenes -->
                        <div>
                            <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Configuración de Imágenes</h4>
                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <!-- Ancho de imagen -->
                                <div>
                                    <label for="opt-image-width" class="block text-sm font-medium text-gray-700 mb-1">
                                        Ancho (cm)
                                    </label>
                                    <input type="number" id="opt-image-width" class="input-field"
                                        value="10" min="1" max="30" step="0.5">
                                </div>

                                <!-- Imágenes por fila -->
                                <div>
                                    <label for="opt-images-per-row" class="block text-sm font-medium text-gray-700 mb-1">
                                        Por fila
                                    </label>
                                    <select id="opt-images-per-row" class="input-field">
                                        <option value="auto">Auto</option>
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                        <option value="5">5</option>
                                        <option value="6">6</option>
                                    </select>
                                </div>

                                <!-- Espacio entre imágenes -->
                                <div>
                                    <label for="opt-spacing" class="block text-sm font-medium text-gray-700 mb-1">
                                        Espacio (cm)
                                    </label>
                                    <input type="number" id="opt-spacing" class="input-field"
                                        value="0.5" min="0" max="3" step="0.1">
                                </div>

                                <!-- Bordes -->
                                <div class="flex items-end pb-1">
                                    <label class="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" id="opt-borders" class="checkbox-field">
                                        <span class="text-sm text-gray-700">Bordes</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Fila 3: Posicionamiento de imágenes -->
                        <div>
                            <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Posicionamiento</h4>
                            <div class="grid grid-cols-2 gap-4">
                                <!-- Alineación -->
                                <div>
                                    <label for="opt-alignment" class="block text-sm font-medium text-gray-700 mb-1">
                                        Alineación
                                    </label>
                                    <select id="opt-alignment" class="input-field">
                                        <option value="left">Izquierda</option>
                                        <option value="center">Centro</option>
                                        <option value="right">Derecha</option>
                                    </select>
                                </div>

                                <!-- Disposición -->
                                <div>
                                    <label for="opt-layout" class="block text-sm font-medium text-gray-700 mb-1">
                                        Disposición
                                    </label>
                                    <select id="opt-layout" class="input-field">
                                        <option value="vertical">Vertical (una por línea)</option>
                                        <option value="inline">En línea (lado a lado)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Fila 3: Nombre de archivo -->
                        <div>
                            <label for="opt-filename" class="block text-sm font-medium text-gray-700 mb-1">
                                Nombre del archivo
                            </label>
                            <input type="text" id="opt-filename" class="input-field"
                                placeholder="documento" maxlength="100">
                        </div>

                        <!-- Acciones -->
                        <div class="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-100">
                            <button id="btn-save-defaults" type="button"
                                class="text-sm text-primary-600 hover:text-primary-700 font-medium">
                                Guardar como predeterminado
                            </button>
                            <button id="btn-restore-defaults" type="button"
                                class="text-sm text-gray-500 hover:text-gray-700">
                                Restaurar valores originales
                            </button>
                        </div>
                    </div>

                    <!-- Vista previa del layout -->
                    <div id="layout-preview-section" class="px-4 pb-4">
                        <div class="bg-gray-50 rounded-lg p-4">
                            <p class="text-sm font-medium text-gray-600 mb-3">Vista previa del layout:</p>
                            <div id="layout-preview" class="flex justify-center"></div>
                            <p id="layout-preview-info" class="text-xs text-gray-500 mt-2 text-center"></p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.addStyles();
    }

    /**
     * Agrega estilos CSS necesarios
     */
    addStyles() {
        if (document.getElementById('options-panel-styles')) return;

        const style = document.createElement('style');
        style.id = 'options-panel-styles';
        style.textContent = `
            .input-field {
                width: 100%;
                padding: 0.5rem 0.75rem;
                border: 1px solid #d1d5db;
                border-radius: 0.5rem;
                font-size: 0.875rem;
                background-color: white;
                transition: border-color 0.15s, box-shadow 0.15s;
            }
            .input-field:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            .input-field:disabled {
                background-color: #f3f4f6;
                cursor: not-allowed;
            }
            .checkbox-field {
                width: 1.125rem;
                height: 1.125rem;
                border-radius: 0.25rem;
                border: 1px solid #d1d5db;
                cursor: pointer;
                accent-color: #3b82f6;
            }
            #options-chevron.expanded {
                transform: rotate(180deg);
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Cachea referencias a elementos
     */
    cacheElements() {
        this.elements = {
            header: document.getElementById('options-header'),
            content: document.getElementById('options-content'),
            chevron: document.getElementById('options-chevron'),
            summary: document.getElementById('options-summary'),
            pageSize: document.getElementById('opt-page-size'),
            orientation: document.getElementById('opt-orientation'),
            margins: document.getElementById('opt-margins'),
            imageWidth: document.getElementById('opt-image-width'),
            imagesPerRow: document.getElementById('opt-images-per-row'),
            spacing: document.getElementById('opt-spacing'),
            borders: document.getElementById('opt-borders'),
            filename: document.getElementById('opt-filename'),
            alignment: document.getElementById('opt-alignment'),
            layout: document.getElementById('opt-layout'),
            saveDefaults: document.getElementById('btn-save-defaults'),
            restoreDefaults: document.getElementById('btn-restore-defaults'),
            layoutPreview: document.getElementById('layout-preview'),
            layoutPreviewInfo: document.getElementById('layout-preview-info'),
        };
    }

    /**
     * Vincula eventos
     */
    bindEvents() {
        // Toggle panel
        this.elements.header?.addEventListener('click', () => this.toggle());

        // Guardar defaults
        this.elements.saveDefaults?.addEventListener('click', () => this.saveAsDefault());

        // Restaurar defaults
        this.elements.restoreDefaults?.addEventListener('click', () => this.restoreDefaults());

        // Cambios en inputs -> actualizar preview y notificar
        const debouncedUpdate = debounce(() => {
            this.updateConfig();
            this.updatePreview();
            this.updateSummary();
            this.callbacks.onChange(this.getConfig());
        }, 150);

        const inputIds = ['pageSize', 'orientation', 'margins', 'imageWidth', 'imagesPerRow', 'spacing', 'borders', 'filename', 'alignment', 'layout'];

        inputIds.forEach(key => {
            const element = this.elements[key];
            if (element) {
                const eventType = element.type === 'checkbox' ? 'change' : 'input';
                element.addEventListener(eventType, debouncedUpdate);
            }
        });
    }

    /**
     * Expande o colapsa el panel
     */
    toggle() {
        this.isExpanded = !this.isExpanded;
        this.updatePanelState();

        if (this.isExpanded) {
            this.updatePreview();
        }

        // Guardar preferencia
        StorageService.setPreference('optionsPanelExpanded', this.isExpanded);
    }

    /**
     * Expande el panel
     */
    expand() {
        if (!this.isExpanded) {
            this.isExpanded = true;
            this.updatePanelState();
            this.updatePreview();
        }
    }

    /**
     * Colapsa el panel
     */
    collapse() {
        if (this.isExpanded) {
            this.isExpanded = false;
            this.updatePanelState();
        }
    }

    /**
     * Actualiza el estado visual del panel
     */
    updatePanelState() {
        this.elements.content?.classList.toggle('hidden', !this.isExpanded);
        this.elements.chevron?.classList.toggle('expanded', this.isExpanded);
        this.elements.header?.setAttribute('aria-expanded', this.isExpanded.toString());
    }

    /**
     * Carga configuración guardada
     */
    loadSavedConfig() {
        const saved = StorageService.getConfig();
        if (saved) {
            this.config = { ...DEFAULT_CONFIG, ...saved };
        }
    }

    /**
     * Aplica la configuración actual a los elementos UI
     */
    applyConfigToUI() {
        if (this.elements.pageSize) this.elements.pageSize.value = this.config.pageSize || 'carta';
        if (this.elements.orientation) this.elements.orientation.value = this.config.orientation || 'portrait';
        if (this.elements.margins) this.elements.margins.value = this.config.marginsCm ?? 1.5;
        if (this.elements.imageWidth) this.elements.imageWidth.value = this.config.imageWidthCm ?? 10;
        if (this.elements.imagesPerRow) this.elements.imagesPerRow.value = this.config.imagesPerRow || 'auto';
        if (this.elements.spacing) this.elements.spacing.value = this.config.spacingCm ?? 0.5;
        if (this.elements.borders) this.elements.borders.checked = this.config.borders ?? false;
        if (this.elements.filename) this.elements.filename.value = this.config.filename || '';
        if (this.elements.alignment) this.elements.alignment.value = this.config.imageAlignment || 'left';
        if (this.elements.layout) this.elements.layout.value = this.config.imageLayout || 'vertical';

        this.updateSummary();
    }

    /**
     * Actualiza la configuración desde los elementos UI
     */
    updateConfig() {
        this.config = {
            pageSize: this.elements.pageSize?.value || 'carta',
            orientation: this.elements.orientation?.value || 'portrait',
            marginsCm: parseFloat(this.elements.margins?.value) || 1.5,
            imageWidthCm: parseFloat(this.elements.imageWidth?.value) || 10,
            imagesPerRow: this.elements.imagesPerRow?.value || 'auto',
            spacingCm: parseFloat(this.elements.spacing?.value) || 0.5,
            borders: this.elements.borders?.checked || false,
            filename: this.elements.filename?.value || 'documento',
            imageAlignment: this.elements.alignment?.value || 'left',
            imageLayout: this.elements.layout?.value || 'vertical',
        };
    }

    /**
     * Obtiene la configuración actual en formato para el API
     * @returns {Object}
     */
    getConfig() {
        this.updateConfig();

        // Convertir orientation de portrait/landscape a vertical/horizontal para el API
        const orientationMap = {
            'portrait': 'vertical',
            'landscape': 'horizontal',
        };

        return {
            page_size: this.config.pageSize,
            page_orientation: orientationMap[this.config.orientation] || 'vertical',
            margins_cm: this.config.marginsCm,
            image_width_cm: this.config.imageWidthCm,
            images_per_row: this.config.imagesPerRow,
            spacing_cm: this.config.spacingCm,
            borders: this.config.borders,
            filename: this.config.filename,
            image_alignment: this.config.imageAlignment,
            image_layout: this.config.imageLayout,
        };
    }

    /**
     * Establece la configuración
     * @param {Object} config
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
        this.applyConfigToUI();
        this.updatePreview();
    }

    /**
     * Guarda la configuración actual como predeterminada
     */
    saveAsDefault() {
        this.updateConfig();

        if (StorageService.saveConfig(this.config)) {
            this.callbacks.onSaveDefaults();
        } else {
            this.callbacks.onError('No se pudo guardar la configuración');
        }
    }

    /**
     * Restaura los valores originales
     */
    restoreDefaults() {
        this.config = { ...DEFAULT_CONFIG };
        this.applyConfigToUI();
        this.updatePreview();
        this.callbacks.onRestoreDefaults();
        this.callbacks.onChange(this.getConfig());
    }

    /**
     * Actualiza el resumen mostrado en el header
     */
    updateSummary() {
        if (!this.elements.summary) return;

        const size = this.config.pageSize?.toUpperCase() || 'CARTA';
        const orientation = this.config.orientation === 'landscape' ? 'H' : 'V';
        const width = this.config.imageWidthCm || 10;
        const alignmentIcons = { 'left': '◀', 'center': '●', 'right': '▶' };
        const alignIcon = alignmentIcons[this.config.imageAlignment] || '◀';

        this.elements.summary.textContent = `${size} ${orientation} · ${width}cm · ${alignIcon}`;
    }

    /**
     * Establece el número de imágenes para la preview
     * @param {number} count
     */
    setImageCount(count) {
        this.imageCount = count;
        if (this.isExpanded) {
            this.updatePreview();
        }
    }

    /**
     * Actualiza la vista previa del layout
     */
    updatePreview() {
        const container = this.elements.layoutPreview;
        const info = this.elements.layoutPreviewInfo;
        if (!container) return;

        this.updateConfig();

        // Obtener dimensiones de página
        const pageSize = PAGE_SIZES[this.config.pageSize] || PAGE_SIZES.carta;
        let pageWidth = pageSize.width;
        let pageHeight = pageSize.height;

        if (this.config.orientation === 'landscape') {
            [pageWidth, pageHeight] = [pageHeight, pageWidth];
        }

        // Calcular imágenes por fila
        const margins = this.config.marginsCm;
        const availableWidth = pageWidth - (margins * 2);
        const imageWidth = this.config.imageWidthCm;
        const spacing = this.config.spacingCm;
        const alignment = this.config.imageAlignment || 'left';
        const layout = this.config.imageLayout || 'vertical';

        let imagesPerRow;
        if (layout === 'vertical') {
            // En layout vertical, siempre 1 imagen por fila
            imagesPerRow = 1;
        } else if (this.config.imagesPerRow === 'auto') {
            imagesPerRow = Math.max(1, Math.floor((availableWidth + spacing) / (imageWidth + spacing)));
        } else {
            imagesPerRow = parseInt(this.config.imagesPerRow) || 1;
        }

        const displayCount = Math.max(this.imageCount, 4);
        const rows = Math.ceil(displayCount / imagesPerRow);

        // Escala para visualización (ajustar al contenedor)
        const scale = 6;
        const previewWidth = pageWidth * scale;
        const previewHeight = Math.min(pageHeight * scale, 180);

        // Mapear alineación a justify-content
        const alignmentMap = {
            'left': 'flex-start',
            'center': 'center',
            'right': 'flex-end',
        };
        const justifyContent = alignmentMap[alignment] || 'flex-start';

        // Crear preview visual según layout
        const maxDisplayImages = layout === 'vertical' ? 4 : Math.min(displayCount, imagesPerRow * 3);

        let imageElements;
        if (layout === 'vertical') {
            // Layout vertical: cada imagen en su propia fila
            imageElements = Array(maxDisplayImages)
                .fill(0)
                .map((_, i) => `
                    <div class="w-full flex" style="justify-content: ${justifyContent};">
                        <div class="bg-gray-200 border ${this.config.borders ? 'border-gray-400' : 'border-gray-300'} rounded-sm flex items-center justify-center text-xs text-gray-400"
                            style="width: ${imageWidth * scale}px; height: ${imageWidth * scale * 0.75}px;">
                            ${i + 1}
                        </div>
                    </div>
                `)
                .join('');
        } else {
            // Layout inline: imágenes lado a lado
            imageElements = Array(maxDisplayImages)
                .fill(0)
                .map((_, i) => `
                    <div class="bg-gray-200 border ${this.config.borders ? 'border-gray-400' : 'border-gray-300'} rounded-sm flex items-center justify-center text-xs text-gray-400"
                        style="width: ${imageWidth * scale}px; height: ${imageWidth * scale * 0.75}px;">
                        ${i + 1}
                    </div>
                `)
                .join('');
        }

        // Estilos del contenedor según layout
        const containerStyle = layout === 'vertical'
            ? `flex-direction: column; gap: ${spacing * scale}px;`
            : `flex-wrap: wrap; gap: ${spacing * scale}px; justify-content: ${justifyContent};`;

        container.innerHTML = `
            <div class="relative bg-white border border-gray-300 shadow-sm rounded overflow-hidden"
                style="width: ${previewWidth}px; height: ${previewHeight}px;">
                <div class="absolute inset-0 flex"
                    style="padding: ${margins * scale}px; ${containerStyle}">
                    ${imageElements}
                </div>
            </div>
        `;

        // Actualizar info
        if (info) {
            const imageLabel = this.imageCount === 1 ? 'imagen' : 'imágenes';
            const alignmentLabels = { 'left': 'Izq', 'center': 'Centro', 'right': 'Der' };
            const layoutLabels = { 'vertical': 'Vertical', 'inline': 'En línea' };
            const alignLabel = alignmentLabels[alignment] || 'Izq';
            const layoutLabel = layoutLabels[layout] || 'Vertical';

            info.textContent = `${imagesPerRow} por fila · ${alignLabel} · ${layoutLabel} · ${this.imageCount || 0} ${imageLabel}`;
        }
    }

    /**
     * Obtiene el nombre de archivo actual
     * @returns {string}
     */
    getFilename() {
        return this.elements.filename?.value || this.config.filename || 'documento';
    }

    /**
     * Establece el nombre de archivo
     * @param {string} filename
     */
    setFilename(filename) {
        if (this.elements.filename) {
            this.elements.filename.value = filename;
        }
        this.config.filename = filename;
    }
}
