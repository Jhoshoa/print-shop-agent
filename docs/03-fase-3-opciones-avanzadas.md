# Fase 3: Opciones Avanzadas

> **Objetivo:** Agregar funcionalidades adicionales como panel de opciones expandible, persistencia de configuración, reordenamiento de imágenes y vista previa
> **Duración estimada de desarrollo:** 3-4 horas
> **Resultado:** Aplicación con todas las opciones configurables y mejor UX

---

## Tabla de Contenidos

1. [Checklist de Tareas](#checklist-de-tareas)
2. [Panel de Opciones Avanzadas](#panel-de-opciones-avanzadas)
3. [Persistencia de Configuración](#persistencia-de-configuración)
4. [Reordenamiento de Imágenes](#reordenamiento-de-imágenes)
5. [Vista Previa del Layout](#vista-previa-del-layout)
6. [Historial de Documentos](#historial-de-documentos)
7. [Mejoras en el Backend](#mejoras-en-el-backend)
8. [Verificación de la Fase](#verificación-de-la-fase)

---

## Checklist de Tareas

- [ ] Implementar panel de opciones avanzadas expandible
- [ ] Agregar persistencia de configuración en localStorage
- [ ] Implementar drag & drop para reordenar imágenes
- [ ] Crear vista previa del layout del documento
- [ ] Agregar historial de documentos generados
- [ ] Implementar endpoint para guardar/cargar configuraciones
- [ ] Agregar opción de bordes en imágenes
- [ ] Implementar orientación de página (vertical/horizontal)

---

## Panel de Opciones Avanzadas

### frontend/js/components/optionsPanel.js

```javascript
/**
 * Panel de Opciones Avanzadas
 *
 * Panel expandible con todas las opciones de configuración del documento.
 */

import { PAGE_SIZES, DEFAULT_CONFIG } from '../utils/constants.js';

export class OptionsPanel {
    /**
     * @param {Object} callbacks - Callbacks para eventos
     */
    constructor(callbacks = {}) {
        this.callbacks = callbacks;
        this.isExpanded = false;
        this.config = { ...DEFAULT_CONFIG };

        this.init();
    }

    /**
     * Inicializa el panel
     */
    init() {
        this.createPanel();
        this.loadSavedConfig();
        this.bindEvents();
    }

    /**
     * Crea el HTML del panel
     */
    createPanel() {
        // Buscar el contenedor de opciones existente o crear uno nuevo
        const optionsSection = document.getElementById('options-section');
        if (!optionsSection) return;

        // Reemplazar contenido con panel avanzado
        optionsSection.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <!-- Header colapsable -->
                <button
                    id="options-header"
                    class="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                    <div class="flex items-center gap-2">
                        <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <span class="font-medium text-gray-700">Opciones de documento</span>
                    </div>
                    <svg id="options-chevron" class="w-5 h-5 text-gray-500 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </button>

                <!-- Contenido expandible -->
                <div id="options-content" class="hidden">
                    <div class="p-4 space-y-4 border-t border-gray-200">
                        <!-- Fila 1: Página -->
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <!-- Tamaño de hoja -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">
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
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Orientación
                                </label>
                                <select id="opt-orientation" class="input-field">
                                    <option value="vertical">Vertical (Retrato)</option>
                                    <option value="horizontal">Horizontal (Paisaje)</option>
                                </select>
                            </div>

                            <!-- Márgenes -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Márgenes (cm)
                                </label>
                                <input type="number" id="opt-margins" class="input-field"
                                    value="1.5" min="0.5" max="5" step="0.5">
                            </div>
                        </div>

                        <!-- Fila 2: Imágenes -->
                        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <!-- Ancho de imagen -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Ancho imagen (cm)
                                </label>
                                <input type="number" id="opt-image-width" class="input-field"
                                    value="10" min="1" max="30" step="0.5">
                            </div>

                            <!-- Alto de imagen -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Alto imagen (cm)
                                </label>
                                <input type="number" id="opt-image-height" class="input-field"
                                    placeholder="Auto" min="1" max="40" step="0.5">
                            </div>

                            <!-- Imágenes por fila -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Imágenes por fila
                                </label>
                                <select id="opt-images-per-row" class="input-field">
                                    <option value="auto">Automático</option>
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
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Espacio (cm)
                                </label>
                                <input type="number" id="opt-spacing" class="input-field"
                                    value="0.5" min="0" max="3" step="0.1">
                            </div>
                        </div>

                        <!-- Fila 3: Opciones adicionales -->
                        <div class="flex flex-wrap items-center gap-6">
                            <!-- Bordes -->
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" id="opt-borders" class="checkbox-field">
                                <span class="text-sm text-gray-700">Agregar bordes a las imágenes</span>
                            </label>

                            <!-- Guardar como predeterminado -->
                            <button id="btn-save-defaults"
                                class="text-sm text-primary-600 hover:text-primary-700 underline">
                                Guardar como predeterminado
                            </button>

                            <!-- Restaurar defaults -->
                            <button id="btn-restore-defaults"
                                class="text-sm text-gray-500 hover:text-gray-700 underline">
                                Restaurar valores originales
                            </button>
                        </div>

                        <!-- Fila 4: Nombre de archivo -->
                        <div class="pt-2 border-t border-gray-100">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Nombre del archivo
                            </label>
                            <input type="text" id="opt-filename" class="input-field"
                                placeholder="documento" maxlength="100">
                        </div>
                    </div>

                    <!-- Vista previa del layout -->
                    <div id="layout-preview" class="px-4 pb-4">
                        <div class="bg-gray-50 rounded-lg p-4">
                            <p class="text-sm font-medium text-gray-600 mb-2">Vista previa del layout:</p>
                            <div id="preview-container" class="flex justify-center">
                                <!-- Preview will be rendered here -->
                            </div>
                            <p id="preview-info" class="text-xs text-gray-500 mt-2 text-center"></p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar estilos para inputs
        this.addInputStyles();

        // Cachear elementos
        this.cacheElements();
    }

    /**
     * Agrega estilos CSS para los inputs
     */
    addInputStyles() {
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
                transition: border-color 0.15s, box-shadow 0.15s;
            }
            .input-field:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            .checkbox-field {
                width: 1rem;
                height: 1rem;
                border-radius: 0.25rem;
                border: 1px solid #d1d5db;
                cursor: pointer;
            }
            .checkbox-field:checked {
                background-color: #3b82f6;
                border-color: #3b82f6;
            }
            #options-content.expanded {
                display: block;
            }
            #options-chevron.rotated {
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
            pageSize: document.getElementById('opt-page-size'),
            orientation: document.getElementById('opt-orientation'),
            margins: document.getElementById('opt-margins'),
            imageWidth: document.getElementById('opt-image-width'),
            imageHeight: document.getElementById('opt-image-height'),
            imagesPerRow: document.getElementById('opt-images-per-row'),
            spacing: document.getElementById('opt-spacing'),
            borders: document.getElementById('opt-borders'),
            filename: document.getElementById('opt-filename'),
            saveDefaults: document.getElementById('btn-save-defaults'),
            restoreDefaults: document.getElementById('btn-restore-defaults'),
            previewContainer: document.getElementById('preview-container'),
            previewInfo: document.getElementById('preview-info'),
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

        // Cambios en inputs -> actualizar preview
        const inputs = [
            'pageSize', 'orientation', 'margins', 'imageWidth',
            'imageHeight', 'imagesPerRow', 'spacing', 'borders'
        ];

        inputs.forEach(key => {
            const element = this.elements[key];
            if (element) {
                element.addEventListener('change', () => {
                    this.updateConfig();
                    this.updatePreview();
                    this.callbacks.onChange?.(this.getConfig());
                });
            }
        });
    }

    /**
     * Expande o colapsa el panel
     */
    toggle() {
        this.isExpanded = !this.isExpanded;

        this.elements.content?.classList.toggle('hidden', !this.isExpanded);
        this.elements.content?.classList.toggle('expanded', this.isExpanded);
        this.elements.chevron?.classList.toggle('rotated', this.isExpanded);

        if (this.isExpanded) {
            this.updatePreview();
        }
    }

    /**
     * Expande el panel
     */
    expand() {
        if (!this.isExpanded) {
            this.toggle();
        }
    }

    /**
     * Colapsa el panel
     */
    collapse() {
        if (this.isExpanded) {
            this.toggle();
        }
    }

    /**
     * Carga configuración guardada
     */
    loadSavedConfig() {
        try {
            const saved = localStorage.getItem('printshop_config');
            if (saved) {
                this.config = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
                this.applyConfigToUI();
            }
        } catch (e) {
            console.warn('Could not load saved config:', e);
        }
    }

    /**
     * Aplica la configuración actual a los elementos UI
     */
    applyConfigToUI() {
        if (this.elements.pageSize) this.elements.pageSize.value = this.config.pageSize || 'carta';
        if (this.elements.orientation) this.elements.orientation.value = this.config.orientation || 'vertical';
        if (this.elements.margins) this.elements.margins.value = this.config.marginsCm || 1.5;
        if (this.elements.imageWidth) this.elements.imageWidth.value = this.config.imageWidthCm || 10;
        if (this.elements.imageHeight) this.elements.imageHeight.value = this.config.imageHeightCm || '';
        if (this.elements.imagesPerRow) this.elements.imagesPerRow.value = this.config.imagesPerRow || 'auto';
        if (this.elements.spacing) this.elements.spacing.value = this.config.spacingCm || 0.5;
        if (this.elements.borders) this.elements.borders.checked = this.config.borders || false;
        if (this.elements.filename) this.elements.filename.value = this.config.filename || '';
    }

    /**
     * Actualiza la configuración desde los elementos UI
     */
    updateConfig() {
        this.config = {
            pageSize: this.elements.pageSize?.value || 'carta',
            orientation: this.elements.orientation?.value || 'vertical',
            marginsCm: parseFloat(this.elements.margins?.value) || 1.5,
            imageWidthCm: parseFloat(this.elements.imageWidth?.value) || 10,
            imageHeightCm: parseFloat(this.elements.imageHeight?.value) || null,
            imagesPerRow: this.elements.imagesPerRow?.value || 'auto',
            spacingCm: parseFloat(this.elements.spacing?.value) || 0.5,
            borders: this.elements.borders?.checked || false,
            filename: this.elements.filename?.value || 'documento',
        };
    }

    /**
     * Obtiene la configuración actual en formato para el API
     */
    getConfig() {
        this.updateConfig();

        return {
            page_size: this.config.pageSize,
            page_orientation: this.config.orientation,
            margins_cm: this.config.marginsCm,
            image_width_cm: this.config.imageWidthCm,
            image_height_cm: this.config.imageHeightCm,
            images_per_row: this.config.imagesPerRow,
            spacing_cm: this.config.spacingCm,
            borders: this.config.borders,
            filename: this.config.filename,
        };
    }

    /**
     * Guarda la configuración actual como predeterminada
     */
    saveAsDefault() {
        this.updateConfig();

        try {
            localStorage.setItem('printshop_config', JSON.stringify(this.config));
            this.callbacks.onSaveDefaults?.();
        } catch (e) {
            console.error('Could not save config:', e);
            this.callbacks.onError?.('No se pudo guardar la configuración');
        }
    }

    /**
     * Restaura los valores originales
     */
    restoreDefaults() {
        this.config = { ...DEFAULT_CONFIG };
        this.applyConfigToUI();
        this.updatePreview();
        this.callbacks.onChange?.(this.getConfig());
    }

    /**
     * Actualiza la vista previa del layout
     */
    updatePreview(imageCount = 4) {
        const container = this.elements.previewContainer;
        const info = this.elements.previewInfo;
        if (!container) return;

        this.updateConfig();

        // Obtener dimensiones de página
        const pageSize = PAGE_SIZES[this.config.pageSize] || PAGE_SIZES.carta;
        let pageWidth = pageSize.width;
        let pageHeight = pageSize.height;

        if (this.config.orientation === 'horizontal') {
            [pageWidth, pageHeight] = [pageHeight, pageWidth];
        }

        // Calcular imágenes por fila
        const margins = this.config.marginsCm;
        const availableWidth = pageWidth - (margins * 2);
        const imageWidth = this.config.imageWidthCm;
        const spacing = this.config.spacingCm;

        let imagesPerRow;
        if (this.config.imagesPerRow === 'auto') {
            imagesPerRow = Math.max(1, Math.floor(availableWidth / (imageWidth + spacing)));
        } else {
            imagesPerRow = parseInt(this.config.imagesPerRow);
        }

        // Crear preview visual (escala 1:10)
        const scale = 10;
        const previewWidth = pageWidth * scale;
        const previewHeight = Math.min(pageHeight * scale, 200); // Limitar altura

        container.innerHTML = `
            <div class="relative bg-white border border-gray-300 shadow-sm"
                style="width: ${previewWidth}px; height: ${previewHeight}px;">
                <div class="absolute inset-0 flex flex-wrap content-start p-${margins * scale / 4}"
                    style="padding: ${margins * scale}px; gap: ${spacing * scale}px;">
                    ${Array(Math.min(imageCount, 12)).fill(0).map(() => `
                        <div class="bg-gray-200 border border-gray-300"
                            style="width: ${imageWidth * scale}px; height: ${imageWidth * scale * 0.75}px;">
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Actualizar info
        const rows = Math.ceil(imageCount / imagesPerRow);
        if (info) {
            info.textContent = `${imagesPerRow} imagen(es) por fila · ~${rows} fila(s) · Página ${this.config.pageSize.toUpperCase()} ${this.config.orientation}`;
        }
    }

    /**
     * Establece el número de imágenes para la preview
     */
    setImageCount(count) {
        this.updatePreview(count);
    }
}
```

---

## Persistencia de Configuración

### frontend/js/services/storage.js

```javascript
/**
 * Servicio de almacenamiento local
 *
 * Maneja la persistencia de datos en localStorage.
 */

const STORAGE_KEYS = {
    CONFIG: 'printshop_config',
    HISTORY: 'printshop_history',
    PREFERENCES: 'printshop_preferences',
};

export class StorageService {
    /**
     * Guarda un valor en localStorage
     */
    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    }

    /**
     * Obtiene un valor de localStorage
     */
    static get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage error:', e);
            return defaultValue;
        }
    }

    /**
     * Elimina un valor de localStorage
     */
    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Guarda la configuración del documento
     */
    static saveConfig(config) {
        return this.set(STORAGE_KEYS.CONFIG, config);
    }

    /**
     * Obtiene la configuración guardada
     */
    static getConfig() {
        return this.get(STORAGE_KEYS.CONFIG);
    }

    /**
     * Agrega un documento al historial
     */
    static addToHistory(document) {
        const history = this.getHistory();

        // Agregar al inicio
        history.unshift({
            ...document,
            timestamp: new Date().toISOString(),
        });

        // Mantener solo los últimos 20
        if (history.length > 20) {
            history.pop();
        }

        return this.set(STORAGE_KEYS.HISTORY, history);
    }

    /**
     * Obtiene el historial de documentos
     */
    static getHistory() {
        return this.get(STORAGE_KEYS.HISTORY, []);
    }

    /**
     * Limpia el historial
     */
    static clearHistory() {
        return this.remove(STORAGE_KEYS.HISTORY);
    }

    /**
     * Guarda preferencias de UI
     */
    static savePreferences(prefs) {
        return this.set(STORAGE_KEYS.PREFERENCES, prefs);
    }

    /**
     * Obtiene preferencias de UI
     */
    static getPreferences() {
        return this.get(STORAGE_KEYS.PREFERENCES, {
            optionsPanelExpanded: false,
            showPreview: true,
        });
    }
}
```

---

## Reordenamiento de Imágenes

### frontend/js/components/sortableImageGrid.js

```javascript
/**
 * Grid de imágenes con soporte para reordenamiento drag & drop
 *
 * Extiende ImageGrid para permitir reordenar imágenes arrastrando.
 */

export class SortableImageGrid {
    constructor(containerId, callbacks = {}) {
        this.container = document.getElementById(containerId);
        this.callbacks = callbacks;
        this.images = [];
        this.draggedItem = null;
        this.draggedIndex = null;
    }

    /**
     * Renderiza el grid con soporte de drag
     */
    render(images) {
        this.images = images;
        this.container.innerHTML = '';

        images.forEach((image, index) => {
            const item = this.createImageItem(image, index);
            this.container.appendChild(item);
        });
    }

    /**
     * Crea un elemento de imagen con drag & drop
     */
    createImageItem(image, index) {
        const div = document.createElement('div');
        div.className = 'image-item';
        div.draggable = true;
        div.dataset.index = index;
        div.title = `${image.name} - Arrastra para reordenar`;

        // Imagen
        const img = document.createElement('img');
        img.src = image.data;
        img.alt = image.name;
        img.loading = 'lazy';
        div.appendChild(img);

        // Número de imagen
        const number = document.createElement('span');
        number.className = 'image-number';
        number.textContent = index + 1;
        div.appendChild(number);

        // Indicador de drag
        const dragHandle = document.createElement('span');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 8h16M4 16h16"/>
            </svg>
        `;
        div.appendChild(dragHandle);

        // Botón eliminar
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.title = 'Eliminar imagen';
        removeBtn.innerHTML = `
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        `;
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.callbacks.onRemove?.(index);
        });
        div.appendChild(removeBtn);

        // Eventos de drag
        div.addEventListener('dragstart', (e) => this.handleDragStart(e, index));
        div.addEventListener('dragend', (e) => this.handleDragEnd(e));
        div.addEventListener('dragover', (e) => this.handleDragOver(e));
        div.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        div.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        div.addEventListener('drop', (e) => this.handleDrop(e, index));

        return div;
    }

    handleDragStart(e, index) {
        this.draggedItem = e.target.closest('.image-item');
        this.draggedIndex = index;

        // Agregar clase de dragging
        setTimeout(() => {
            this.draggedItem?.classList.add('dragging');
        }, 0);

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    }

    handleDragEnd(e) {
        this.draggedItem?.classList.remove('dragging');

        // Remover clases de todos los items
        this.container.querySelectorAll('.image-item').forEach(item => {
            item.classList.remove('drag-over');
        });

        this.draggedItem = null;
        this.draggedIndex = null;
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDragEnter(e) {
        e.preventDefault();
        const item = e.target.closest('.image-item');
        if (item && item !== this.draggedItem) {
            item.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        const item = e.target.closest('.image-item');
        if (item) {
            item.classList.remove('drag-over');
        }
    }

    handleDrop(e, targetIndex) {
        e.preventDefault();

        const item = e.target.closest('.image-item');
        item?.classList.remove('drag-over');

        if (this.draggedIndex === null || this.draggedIndex === targetIndex) {
            return;
        }

        // Reordenar array
        const newImages = [...this.images];
        const [removed] = newImages.splice(this.draggedIndex, 1);
        newImages.splice(targetIndex, 0, removed);

        // Notificar cambio
        this.callbacks.onReorder?.(newImages);

        // Re-renderizar
        this.render(newImages);
    }

    clear() {
        this.images = [];
        this.container.innerHTML = '';
    }
}
```

### Estilos adicionales para drag & drop

Agregar a `frontend/css/styles.css`:

```css
/* ============================================
   SORTABLE IMAGE GRID
   ============================================ */
.image-item.dragging {
    opacity: 0.5;
    transform: scale(0.95);
}

.image-item.drag-over {
    border: 2px solid var(--color-primary);
    transform: scale(1.02);
}

.image-item .drag-handle {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity var(--transition-fast);
    cursor: grab;
}

.image-item:hover .drag-handle {
    opacity: 1;
}

.image-item .drag-handle svg {
    color: white;
}

.image-item .drag-handle:active {
    cursor: grabbing;
}
```

---

## Vista Previa del Layout

### frontend/js/components/layoutPreview.js

```javascript
/**
 * Componente de Vista Previa del Layout
 *
 * Muestra una representación visual de cómo quedará el documento.
 */

import { PAGE_SIZES } from '../utils/constants.js';

export class LayoutPreview {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.config = {};
        this.imageCount = 0;
    }

    /**
     * Actualiza la vista previa
     */
    update(config, imageCount) {
        this.config = config;
        this.imageCount = imageCount;
        this.render();
    }

    /**
     * Renderiza la vista previa
     */
    render() {
        if (!this.container) return;

        const { pageSize, orientation, marginsCm, imageWidthCm, spacingCm, imagesPerRow } = this.config;

        // Obtener dimensiones
        const size = PAGE_SIZES[pageSize] || PAGE_SIZES.carta;
        let width = size.width;
        let height = size.height;

        if (orientation === 'horizontal') {
            [width, height] = [height, width];
        }

        // Calcular layout
        const margins = marginsCm || 1.5;
        const availableWidth = width - (margins * 2);
        const imageWidth = imageWidthCm || 10;
        const spacing = spacingCm || 0.5;

        let perRow;
        if (imagesPerRow === 'auto' || !imagesPerRow) {
            perRow = Math.max(1, Math.floor(availableWidth / (imageWidth + spacing)));
        } else {
            perRow = parseInt(imagesPerRow);
        }

        const rows = Math.ceil(this.imageCount / perRow);

        // Escala para visualización
        const scale = 8;
        const previewWidth = width * scale;
        const previewHeight = Math.min(height * scale, 180);

        // Generar HTML
        this.container.innerHTML = `
            <div class="layout-preview-page"
                style="width: ${previewWidth}px; height: ${previewHeight}px; padding: ${margins * scale}px;">
                <div class="layout-preview-content" style="gap: ${spacing * scale}px;">
                    ${this.renderImages(perRow, imageWidth * scale)}
                </div>
            </div>
            <div class="layout-preview-info">
                <span>${perRow} por fila</span>
                <span>·</span>
                <span>~${rows} fila(s)</span>
                <span>·</span>
                <span>${this.imageCount} imagen(es)</span>
            </div>
        `;
    }

    /**
     * Renderiza las imágenes de la preview
     */
    renderImages(perRow, imageSize) {
        const maxShow = Math.min(this.imageCount, perRow * 3); // Máximo 3 filas

        return Array(maxShow).fill(0).map((_, i) => `
            <div class="layout-preview-image" style="width: ${imageSize}px; height: ${imageSize * 0.7}px;">
                <span>${i + 1}</span>
            </div>
        `).join('');
    }
}
```

### Estilos para LayoutPreview

Agregar a `frontend/css/styles.css`:

```css
/* ============================================
   LAYOUT PREVIEW
   ============================================ */
.layout-preview-page {
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.layout-preview-content {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    height: 100%;
}

.layout-preview-image {
    background: #e5e7eb;
    border: 1px solid #d1d5db;
    border-radius: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: #6b7280;
}

.layout-preview-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: #6b7280;
}
```

---

## Historial de Documentos

### frontend/js/components/historyPanel.js

```javascript
/**
 * Panel de Historial de Documentos
 *
 * Muestra los documentos generados recientemente.
 */

import { StorageService } from '../services/storage.js';
import { formatFileSize } from '../utils/helpers.js';

export class HistoryPanel {
    constructor(containerId, callbacks = {}) {
        this.container = document.getElementById(containerId);
        this.callbacks = callbacks;
        this.history = [];
    }

    /**
     * Inicializa el panel
     */
    init() {
        this.loadHistory();
        this.render();
    }

    /**
     * Carga el historial desde localStorage
     */
    loadHistory() {
        this.history = StorageService.getHistory();
    }

    /**
     * Agrega un documento al historial
     */
    addDocument(doc) {
        StorageService.addToHistory(doc);
        this.loadHistory();
        this.render();
    }

    /**
     * Renderiza el panel
     */
    render() {
        if (!this.container) return;

        if (this.history.length === 0) {
            this.container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <p>No hay documentos recientes</p>
                </div>
            `;
            return;
        }

        this.container.innerHTML = `
            <div class="divide-y divide-gray-100">
                ${this.history.map((doc, index) => this.renderItem(doc, index)).join('')}
            </div>
        `;

        // Bind eventos
        this.container.querySelectorAll('[data-action="download"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filename = e.target.closest('button').dataset.filename;
                this.callbacks.onDownload?.(filename);
            });
        });
    }

    /**
     * Renderiza un item del historial
     */
    renderItem(doc, index) {
        const date = new Date(doc.timestamp);
        const formattedDate = date.toLocaleDateString('es-BO', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });

        return `
            <div class="flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-lg">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-800">${doc.filename}</p>
                        <p class="text-xs text-gray-500">
                            ${doc.images_placed} imágenes · ${formatFileSize(doc.file_size_kb * 1024)} · ${formattedDate}
                        </p>
                    </div>
                </div>
                <button
                    data-action="download"
                    data-filename="${doc.filename}"
                    class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Descargar"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                </button>
            </div>
        `;
    }

    /**
     * Limpia el historial
     */
    clear() {
        StorageService.clearHistory();
        this.history = [];
        this.render();
    }
}
```

---

## Mejoras en el Backend

### backend/app/api/routes/config.py (actualizado)

```python
"""
Rutas de la API para configuración - Versión mejorada
"""

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.config import settings
from app.core import ORIENTATIONS, PAGE_SIZES, logger
from app.models import ConfigResponse, DocumentConfig

router = APIRouter(prefix="/config", tags=["Configuration"])

# Archivo para guardar configuraciones de usuario
CONFIG_FILE = Path("./user_configs.json")


@router.get(
    "/defaults",
    response_model=ConfigResponse,
    summary="Obtener configuración por defecto",
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


@router.get("/page-sizes")
async def get_page_sizes() -> dict:
    """Obtiene los tamaños de página con dimensiones."""
    return {
        name: {
            "width_cm": dims.width,
            "height_cm": dims.height,
            "display_name": f"{name.upper()} ({dims.width} x {dims.height} cm)",
        }
        for name, dims in PAGE_SIZES.items()
    }


@router.post("/save")
async def save_config(name: str, config: DocumentConfig) -> dict:
    """Guarda una configuración con nombre."""
    try:
        configs = {}
        if CONFIG_FILE.exists():
            configs = json.loads(CONFIG_FILE.read_text())

        configs[name] = config.model_dump()
        CONFIG_FILE.write_text(json.dumps(configs, indent=2))

        logger.info(f"Configuración '{name}' guardada")
        return {"success": True, "message": f"Configuración '{name}' guardada"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/load/{name}")
async def load_config(name: str) -> dict:
    """Carga una configuración guardada."""
    try:
        if not CONFIG_FILE.exists():
            raise HTTPException(status_code=404, detail="No hay configuraciones guardadas")

        configs = json.loads(CONFIG_FILE.read_text())

        if name not in configs:
            raise HTTPException(status_code=404, detail=f"Configuración '{name}' no encontrada")

        return configs[name]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/list")
async def list_configs() -> dict:
    """Lista todas las configuraciones guardadas."""
    try:
        if not CONFIG_FILE.exists():
            return {"configs": []}

        configs = json.loads(CONFIG_FILE.read_text())
        return {"configs": list(configs.keys())}

    except Exception as e:
        return {"configs": [], "error": str(e)}
```

---

## Verificación de la Fase

### Checklist de verificación

- [ ] Panel de opciones se expande/colapsa correctamente
- [ ] Cambios en opciones actualizan la vista previa
- [ ] Configuración se guarda en localStorage
- [ ] Al recargar, se carga la configuración guardada
- [ ] "Restaurar valores originales" funciona
- [ ] Imágenes se pueden reordenar arrastrando
- [ ] El orden de imágenes se mantiene al generar
- [ ] Historial muestra documentos generados
- [ ] Se puede descargar desde el historial

### Tests manuales

| Test | Pasos | Resultado esperado |
|------|-------|-------------------|
| Expandir opciones | Click en header de opciones | Panel se expande, chevron rota |
| Cambiar tamaño | Cambiar a A4 | Preview se actualiza |
| Guardar defaults | Cambiar valores, click "Guardar" | Notificación de éxito |
| Persistencia | Recargar página | Valores guardados se cargan |
| Reordenar | Arrastrar imagen 3 a posición 1 | Orden cambia, números se actualizan |
| Generar con orden | Reordenar y generar | Documento respeta orden |
| Historial | Generar documento | Aparece en historial |

---

## Próximos Pasos

Una vez completada esta fase, continúa con:

**[Fase 4: Pulido y Producción](./04-fase-4-pulido-produccion.md)**

---

*Fase 3: Opciones Avanzadas - Print Shop Generator*
