/**
 * Grid de Imágenes con Reordenamiento Drag & Drop
 *
 * Permite reordenar las imágenes arrastrándolas y soltándolas.
 * Extiende la funcionalidad del ImageGrid básico.
 *
 * @version 1.0.0
 */

import { escapeHtml } from '../utils/helpers.js';

export class SortableImageGrid {
    /**
     * @param {string} containerId - ID del contenedor del grid
     * @param {Object} callbacks - Callbacks para eventos
     */
    constructor(containerId, callbacks = {}) {
        this.container = document.getElementById(containerId);
        this.callbacks = {
            onRemove: () => {},
            onReorder: () => {},
            onImageClick: () => {},
            ...callbacks,
        };

        this.images = [];
        this.draggedItem = null;
        this.draggedIndex = null;
        this.placeholder = null;

        this.init();
    }

    /**
     * Inicializa el componente
     */
    init() {
        if (!this.container) {
            console.error('SortableImageGrid: contenedor no encontrado');
            return;
        }

        this.container.setAttribute('role', 'grid');
        this.container.setAttribute('aria-label', 'Imágenes cargadas - arrastra para reordenar');
    }

    /**
     * Renderiza el grid de imágenes
     * @param {Array} images - Array de objetos imagen
     */
    render(images) {
        this.images = images;
        this.container.innerHTML = '';

        if (images.length === 0) {
            return;
        }

        images.forEach((image, index) => {
            const item = this.createImageItem(image, index);
            this.container.appendChild(item);
        });
    }

    /**
     * Crea un elemento de imagen con drag & drop
     * @param {Object} image - Datos de la imagen
     * @param {number} index - Índice en el array
     * @returns {HTMLElement}
     */
    createImageItem(image, index) {
        const div = document.createElement('div');
        div.className = 'image-item sortable';
        div.draggable = true;
        div.dataset.index = index;
        div.title = `${escapeHtml(image.name)} - Arrastra para reordenar`;
        div.setAttribute('role', 'gridcell');
        div.setAttribute('tabindex', '0');
        div.setAttribute('aria-label', `Imagen ${index + 1}: ${image.name}`);

        // Imagen
        const img = document.createElement('img');
        img.src = image.data;
        img.alt = escapeHtml(image.name);
        img.loading = 'lazy';
        img.draggable = false;
        div.appendChild(img);

        // Número de imagen (badge)
        const number = document.createElement('span');
        number.className = 'image-number';
        number.textContent = index + 1;
        div.appendChild(number);

        // Indicador de drag (handle)
        const dragHandle = document.createElement('span');
        dragHandle.className = 'drag-handle';
        dragHandle.title = 'Arrastra para reordenar';
        dragHandle.innerHTML = `
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM14 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM14 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
            </svg>
        `;
        div.appendChild(dragHandle);

        // Indicador de tamaño
        if (image.size) {
            const sizeKB = Math.round(image.size / 1024);
            const sizeIndicator = document.createElement('span');
            sizeIndicator.className = 'image-size';
            sizeIndicator.textContent = sizeKB > 1024
                ? `${(sizeKB / 1024).toFixed(1)}MB`
                : `${sizeKB}KB`;
            div.appendChild(sizeIndicator);
        }

        // Botón eliminar
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.type = 'button';
        removeBtn.title = 'Eliminar imagen';
        removeBtn.setAttribute('aria-label', `Eliminar imagen ${index + 1}`);
        removeBtn.innerHTML = `
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        `;
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeImage(index);
        });
        div.appendChild(removeBtn);

        // Eventos de drag
        div.addEventListener('dragstart', (e) => this.handleDragStart(e, index));
        div.addEventListener('dragend', (e) => this.handleDragEnd(e));
        div.addEventListener('dragover', (e) => this.handleDragOver(e, index));
        div.addEventListener('dragenter', (e) => this.handleDragEnter(e, index));
        div.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        div.addEventListener('drop', (e) => this.handleDrop(e, index));

        // Click para seleccionar
        div.addEventListener('click', (e) => {
            if (!e.target.closest('.remove-btn') && !e.target.closest('.drag-handle')) {
                this.callbacks.onImageClick(index, image);
            }
        });

        // Soporte de teclado
        div.addEventListener('keydown', (e) => this.handleKeydown(e, index));

        return div;
    }

    /**
     * Maneja inicio de drag
     */
    handleDragStart(e, index) {
        this.draggedItem = e.target.closest('.image-item');
        this.draggedIndex = index;

        // Estilo visual
        requestAnimationFrame(() => {
            this.draggedItem?.classList.add('dragging');
        });

        // Datos de transferencia
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());

        // Crear imagen de drag personalizada (opcional)
        if (this.draggedItem) {
            const rect = this.draggedItem.getBoundingClientRect();
            e.dataTransfer.setDragImage(this.draggedItem, rect.width / 2, rect.height / 2);
        }
    }

    /**
     * Maneja fin de drag
     */
    handleDragEnd(e) {
        // Limpiar estados
        this.draggedItem?.classList.remove('dragging');

        this.container.querySelectorAll('.image-item').forEach(item => {
            item.classList.remove('drag-over', 'drag-over-left', 'drag-over-right');
        });

        this.draggedItem = null;
        this.draggedIndex = null;
    }

    /**
     * Maneja dragover
     */
    handleDragOver(e, targetIndex) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (this.draggedIndex === null || this.draggedIndex === targetIndex) {
            return;
        }

        const item = e.target.closest('.image-item');
        if (!item || item === this.draggedItem) return;

        // Determinar posición del cursor relativa al elemento
        const rect = item.getBoundingClientRect();
        const midpoint = rect.left + rect.width / 2;

        item.classList.remove('drag-over-left', 'drag-over-right');
        if (e.clientX < midpoint) {
            item.classList.add('drag-over-left');
        } else {
            item.classList.add('drag-over-right');
        }
    }

    /**
     * Maneja dragenter
     */
    handleDragEnter(e, targetIndex) {
        e.preventDefault();

        const item = e.target.closest('.image-item');
        if (item && item !== this.draggedItem) {
            item.classList.add('drag-over');
        }
    }

    /**
     * Maneja dragleave
     */
    handleDragLeave(e) {
        const item = e.target.closest('.image-item');
        if (item && !item.contains(e.relatedTarget)) {
            item.classList.remove('drag-over', 'drag-over-left', 'drag-over-right');
        }
    }

    /**
     * Maneja drop
     */
    handleDrop(e, targetIndex) {
        e.preventDefault();

        const item = e.target.closest('.image-item');
        item?.classList.remove('drag-over', 'drag-over-left', 'drag-over-right');

        if (this.draggedIndex === null || this.draggedIndex === targetIndex) {
            return;
        }

        // Determinar si insertar antes o después según posición del cursor
        const rect = item?.getBoundingClientRect();
        let insertIndex = targetIndex;

        if (rect && e.clientX > rect.left + rect.width / 2) {
            // Insertar después
            if (this.draggedIndex < targetIndex) {
                insertIndex = targetIndex;
            } else {
                insertIndex = targetIndex + 1;
            }
        } else {
            // Insertar antes
            if (this.draggedIndex < targetIndex) {
                insertIndex = targetIndex - 1;
            } else {
                insertIndex = targetIndex;
            }
        }

        // Reordenar array
        const newImages = [...this.images];
        const [removed] = newImages.splice(this.draggedIndex, 1);
        newImages.splice(insertIndex > this.draggedIndex ? insertIndex : insertIndex, 0, removed);

        // Notificar cambio
        this.callbacks.onReorder(newImages);
    }

    /**
     * Maneja eventos de teclado
     */
    handleKeydown(e, index) {
        const items = this.container.querySelectorAll('.image-item');
        let newIndex = index;

        switch (e.key) {
            case 'ArrowRight':
                newIndex = Math.min(index + 1, items.length - 1);
                break;
            case 'ArrowLeft':
                newIndex = Math.max(index - 1, 0);
                break;
            case 'ArrowDown':
                newIndex = Math.min(index + this.getColumnsCount(), items.length - 1);
                break;
            case 'ArrowUp':
                newIndex = Math.max(index - this.getColumnsCount(), 0);
                break;
            case 'Delete':
            case 'Backspace':
                e.preventDefault();
                this.removeImage(index);
                return;
            case ' ':
            case 'Enter':
                e.preventDefault();
                // Ctrl/Cmd + tecla para mover
                if (e.ctrlKey || e.metaKey) {
                    if (e.key === 'ArrowLeft' && index > 0) {
                        this.moveImage(index, index - 1);
                    } else if (e.key === 'ArrowRight' && index < items.length - 1) {
                        this.moveImage(index, index + 1);
                    }
                } else {
                    this.callbacks.onImageClick(index, this.images[index]);
                }
                return;
            default:
                return;
        }

        if (newIndex !== index) {
            e.preventDefault();
            items[newIndex]?.focus();
        }
    }

    /**
     * Obtiene el número de columnas actual
     */
    getColumnsCount() {
        if (!this.container.firstElementChild) return 4;

        const containerWidth = this.container.offsetWidth;
        const itemWidth = this.container.firstElementChild.offsetWidth;
        const gap = parseInt(getComputedStyle(this.container).gap) || 8;

        return Math.max(1, Math.floor((containerWidth + gap) / (itemWidth + gap)));
    }

    /**
     * Mueve una imagen de una posición a otra
     */
    moveImage(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        if (fromIndex < 0 || fromIndex >= this.images.length) return;
        if (toIndex < 0 || toIndex >= this.images.length) return;

        const newImages = [...this.images];
        const [removed] = newImages.splice(fromIndex, 1);
        newImages.splice(toIndex, 0, removed);

        this.callbacks.onReorder(newImages);
    }

    /**
     * Elimina una imagen
     */
    removeImage(index) {
        if (index < 0 || index >= this.images.length) return;

        const item = this.container.querySelector(`[data-index="${index}"]`);

        if (item) {
            item.classList.add('removing');
            setTimeout(() => {
                this.callbacks.onRemove(index);
            }, 150);
        } else {
            this.callbacks.onRemove(index);
        }
    }

    /**
     * Limpia el grid
     */
    clear() {
        this.images = [];
        this.container.innerHTML = '';
    }

    /**
     * Obtiene el conteo de imágenes
     */
    getCount() {
        return this.images.length;
    }

    /**
     * Obtiene las imágenes actuales
     */
    getImages() {
        return [...this.images];
    }
}
