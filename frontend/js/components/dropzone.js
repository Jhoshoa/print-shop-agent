/**
 * Componente Dropzone
 *
 * Maneja el arrastrar y soltar de archivos, así como la selección manual.
 * Incluye validación de tipo y tamaño de archivo.
 */

import { SUPPORTED_FORMATS, LIMITS } from '../utils/constants.js';

export class Dropzone {
    /**
     * @param {string} dropzoneId - ID del elemento dropzone
     * @param {string} inputId - ID del input file
     * @param {Object} callbacks - Callbacks para eventos
     */
    constructor(dropzoneId, inputId, callbacks = {}) {
        this.dropzone = document.getElementById(dropzoneId);
        this.input = document.getElementById(inputId);
        this.callbacks = {
            onFilesAdded: () => {},
            onError: () => {},
            onDragStateChange: () => {},
            ...callbacks,
        };

        this.acceptedTypes = SUPPORTED_FORMATS;
        this.maxFileSize = LIMITS.MAX_FILE_SIZE_BYTES;
        this.isDragging = false;
        this.dragCounter = 0;

        this.init();
    }

    /**
     * Inicializa el componente
     */
    init() {
        if (!this.dropzone || !this.input) {
            console.error('Dropzone: elementos no encontrados');
            return;
        }

        this.bindEvents();
        this.setupAccessibility();
    }

    /**
     * Configura atributos de accesibilidad
     */
    setupAccessibility() {
        this.dropzone.setAttribute('role', 'button');
        this.dropzone.setAttribute('tabindex', '0');
        this.dropzone.setAttribute('aria-label', 'Área para arrastrar y soltar imágenes. Presiona Enter o haz clic para seleccionar archivos.');
    }

    /**
     * Vincula eventos del dropzone
     */
    bindEvents() {
        // Click para abrir selector de archivos
        this.dropzone.addEventListener('click', (e) => {
            if (e.target.closest('button')) return; // Ignorar clicks en botones internos
            this.input.click();
        });

        // Teclado - Enter/Space para abrir selector
        this.dropzone.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.input.click();
            }
        });

        // Eventos de drag and drop
        this.dropzone.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        this.dropzone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.dropzone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.dropzone.addEventListener('drop', (e) => this.handleDrop(e));

        // Cambio en input file
        this.input.addEventListener('change', (e) => this.handleInputChange(e));

        // Prevenir comportamiento por defecto en el documento
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());

        // Soporte para pegar imágenes (Ctrl+V)
        document.addEventListener('paste', (e) => this.handlePaste(e));
    }

    /**
     * Maneja entrada de drag
     */
    handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();

        this.dragCounter++;

        if (!this.isDragging) {
            this.isDragging = true;
            this.dropzone.classList.add('dragover');
            this.callbacks.onDragStateChange(true);
        }
    }

    /**
     * Maneja dragover
     */
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();

        // Indicar que se aceptan los archivos
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'copy';
        }
    }

    /**
     * Maneja salida de drag
     */
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();

        this.dragCounter--;

        if (this.dragCounter === 0) {
            this.isDragging = false;
            this.dropzone.classList.remove('dragover');
            this.callbacks.onDragStateChange(false);
        }
    }

    /**
     * Maneja el drop de archivos
     */
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        // Reset estado de drag
        this.dragCounter = 0;
        this.isDragging = false;
        this.dropzone.classList.remove('dragover');
        this.callbacks.onDragStateChange(false);

        // Obtener archivos
        const files = e.dataTransfer?.files;
        if (files?.length > 0) {
            this.processFiles(files);
        }
    }

    /**
     * Maneja cambio en el input file
     */
    handleInputChange(e) {
        const files = e.target.files;
        if (files?.length > 0) {
            this.processFiles(files);
        }
        // Reset input para permitir seleccionar el mismo archivo
        e.target.value = '';
    }

    /**
     * Maneja el pegado de imágenes desde el portapapeles
     */
    handlePaste(e) {
        const items = e.clipboardData?.items;
        if (!items) return;

        const imageFiles = [];

        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    imageFiles.push(file);
                }
            }
        }

        if (imageFiles.length > 0) {
            e.preventDefault();
            this.processFiles(imageFiles);
        }
    }

    /**
     * Procesa los archivos seleccionados
     * @param {FileList|Array} fileList - Lista de archivos
     */
    processFiles(fileList) {
        const files = Array.from(fileList);

        // Filtrar y validar archivos
        const validFiles = [];
        const errors = [];

        for (const file of files) {
            const validation = this.validateFile(file);

            if (validation.valid) {
                validFiles.push(file);
            } else {
                errors.push({
                    filename: file.name,
                    error: validation.error,
                });
            }
        }

        // Reportar errores
        if (errors.length > 0) {
            const errorMessage = errors.length === 1
                ? `${errors[0].filename}: ${errors[0].error}`
                : `${errors.length} archivos rechazados (formatos no válidos o muy grandes)`;

            this.callbacks.onError(errorMessage);
            console.warn('Archivos rechazados:', errors);
        }

        // Procesar archivos válidos
        if (validFiles.length > 0) {
            this.callbacks.onFilesAdded(validFiles);
        } else if (files.length > 0 && validFiles.length === 0) {
            // Todos los archivos fueron rechazados
            this.callbacks.onError('No se encontraron imágenes válidas');
        }
    }

    /**
     * Valida un archivo
     * @param {File} file - Archivo a validar
     * @returns {{valid: boolean, error?: string}}
     */
    validateFile(file) {
        // Validar tipo MIME
        if (!this.acceptedTypes.includes(file.type)) {
            const extension = file.name.split('.').pop()?.toUpperCase() || 'desconocido';
            return {
                valid: false,
                error: `Formato .${extension} no soportado`,
            };
        }

        // Validar tamaño
        if (file.size > this.maxFileSize) {
            const sizeMB = (file.size / 1024 / 1024).toFixed(1);
            const maxMB = this.maxFileSize / 1024 / 1024;
            return {
                valid: false,
                error: `Archivo muy grande (${sizeMB}MB, máx. ${maxMB}MB)`,
            };
        }

        // Validar que no esté vacío
        if (file.size === 0) {
            return {
                valid: false,
                error: 'Archivo vacío',
            };
        }

        return { valid: true };
    }

    /**
     * Habilita o deshabilita el dropzone
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        if (enabled) {
            this.dropzone.classList.remove('disabled');
            this.dropzone.removeAttribute('aria-disabled');
            this.input.disabled = false;
        } else {
            this.dropzone.classList.add('disabled');
            this.dropzone.setAttribute('aria-disabled', 'true');
            this.input.disabled = true;
        }
    }

    /**
     * Abre el selector de archivos programáticamente
     */
    openFileSelector() {
        this.input.click();
    }
}
