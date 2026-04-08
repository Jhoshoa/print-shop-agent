/**
 * Componente ImageGrid
 *
 * Muestra las imágenes cargadas en un grid responsive con opciones
 * de eliminar y vista previa.
 */

import { escapeHtml } from '../utils/helpers.js';

export class ImageGrid {
    /**
     * @param {string} containerId - ID del contenedor del grid
     * @param {Object} callbacks - Callbacks para eventos
     */
    constructor(containerId, callbacks = {}) {
        this.container = document.getElementById(containerId);
        this.callbacks = {
            onRemove: () => {},
            onImageClick: () => {},
            onReorder: () => {},
            ...callbacks,
        };
        this.images = [];
        this.selectedIndex = null;

        this.init();
    }

    /**
     * Inicializa el componente
     */
    init() {
        if (!this.container) {
            console.error('ImageGrid: contenedor no encontrado');
            return;
        }

        this.setupAccessibility();
    }

    /**
     * Configura accesibilidad
     */
    setupAccessibility() {
        this.container.setAttribute('role', 'grid');
        this.container.setAttribute('aria-label', 'Imágenes cargadas');
    }

    /**
     * Renderiza el grid de imágenes
     * @param {Array} images - Array de objetos imagen con {data, name, size, type}
     */
    render(images) {
        this.images = images;
        this.container.innerHTML = '';

        if (images.length === 0) {
            this.renderEmptyState();
            return;
        }

        images.forEach((image, index) => {
            const item = this.createImageItem(image, index);
            this.container.appendChild(item);
        });
    }

    /**
     * Renderiza estado vacío
     */
    renderEmptyState() {
        this.container.innerHTML = `
            <div class="col-span-full text-center py-8 text-gray-400">
                <p>No hay imágenes cargadas</p>
            </div>
        `;
    }

    /**
     * Crea un elemento de imagen
     * @param {Object} image - Datos de la imagen
     * @param {number} index - Índice en el array
     * @returns {HTMLElement}
     */
    createImageItem(image, index) {
        const div = document.createElement('div');
        div.className = 'image-item';
        div.title = image.name;
        div.setAttribute('role', 'gridcell');
        div.setAttribute('tabindex', '0');
        div.setAttribute('aria-label', `Imagen ${index + 1}: ${image.name}`);
        div.dataset.index = index;

        // Imagen con lazy loading
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
        number.setAttribute('aria-hidden', 'true');
        div.appendChild(number);

        // Indicador de tamaño (si está disponible)
        if (image.size) {
            const sizeKB = Math.round(image.size / 1024);
            const sizeIndicator = document.createElement('span');
            sizeIndicator.className = 'image-size';
            sizeIndicator.textContent = sizeKB > 1024
                ? `${(sizeKB / 1024).toFixed(1)}MB`
                : `${sizeKB}KB`;
            sizeIndicator.setAttribute('aria-hidden', 'true');
            div.appendChild(sizeIndicator);
        }

        // Botón eliminar
        const removeBtn = this.createRemoveButton(index);
        div.appendChild(removeBtn);

        // Event listeners
        div.addEventListener('click', (e) => {
            if (e.target.closest('.remove-btn')) return;
            this.handleImageClick(index);
        });

        div.addEventListener('keydown', (e) => {
            this.handleKeydown(e, index);
        });

        return div;
    }

    /**
     * Crea el botón de eliminar
     * @param {number} index - Índice de la imagen
     * @returns {HTMLButtonElement}
     */
    createRemoveButton(index) {
        const button = document.createElement('button');
        button.className = 'remove-btn';
        button.type = 'button';
        button.title = 'Eliminar imagen';
        button.setAttribute('aria-label', `Eliminar imagen ${index + 1}`);
        button.innerHTML = `
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        `;

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeImage(index);
        });

        return button;
    }

    /**
     * Maneja el click en una imagen
     * @param {number} index
     */
    handleImageClick(index) {
        this.selectedIndex = index;
        this.callbacks.onImageClick(index, this.images[index]);
    }

    /**
     * Maneja eventos de teclado
     * @param {KeyboardEvent} e
     * @param {number} index
     */
    handleKeydown(e, index) {
        const items = this.container.querySelectorAll('.image-item');
        const cols = this.getColumnCount();
        let newIndex = index;

        switch (e.key) {
            case 'ArrowRight':
                newIndex = Math.min(index + 1, items.length - 1);
                break;
            case 'ArrowLeft':
                newIndex = Math.max(index - 1, 0);
                break;
            case 'ArrowDown':
                newIndex = Math.min(index + cols, items.length - 1);
                break;
            case 'ArrowUp':
                newIndex = Math.max(index - cols, 0);
                break;
            case 'Delete':
            case 'Backspace':
                e.preventDefault();
                this.removeImage(index);
                return;
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.handleImageClick(index);
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
     * Obtiene el número de columnas actual del grid
     * @returns {number}
     */
    getColumnCount() {
        if (!this.container.firstElementChild) return 4;

        const containerWidth = this.container.offsetWidth;
        const itemWidth = this.container.firstElementChild.offsetWidth;
        const gap = parseInt(getComputedStyle(this.container).gap) || 8;

        return Math.max(1, Math.floor((containerWidth + gap) / (itemWidth + gap)));
    }

    /**
     * Elimina una imagen
     * @param {number} index
     */
    removeImage(index) {
        if (index < 0 || index >= this.images.length) return;

        // Animación de salida
        const items = this.container.querySelectorAll('.image-item');
        const item = items[index];

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
     * Agrega una imagen al final
     * @param {Object} image
     */
    addImage(image) {
        const index = this.images.length;
        this.images.push(image);

        const item = this.createImageItem(image, index);
        item.classList.add('adding');
        this.container.appendChild(item);

        // Remover clase de animación
        requestAnimationFrame(() => {
            item.classList.remove('adding');
        });
    }

    /**
     * Limpia el grid
     */
    clear() {
        this.images = [];
        this.selectedIndex = null;
        this.container.innerHTML = '';
    }

    /**
     * Obtiene el conteo de imágenes
     * @returns {number}
     */
    getCount() {
        return this.images.length;
    }

    /**
     * Obtiene las imágenes actuales
     * @returns {Array}
     */
    getImages() {
        return [...this.images];
    }
}
