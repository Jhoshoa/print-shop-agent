/**
 * Vista Previa del Layout de Impresión
 *
 * Muestra una representación visual de cómo se verán las imágenes
 * en el documento final, respetando la configuración actual.
 *
 * @version 1.0.0
 */

import { PAGE_SIZES, ORIENTATION } from '../utils/constants.js';

export class LayoutPreview {
    /**
     * @param {string} containerId - ID del contenedor de la vista previa
     * @param {Object} options - Opciones de configuración
     */
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            scale: 0.3, // Escala de visualización
            maxHeight: 400, // Altura máxima del contenedor
            ...options,
        };

        this.config = null;
        this.images = [];
        this.pages = [];

        this.init();
    }

    /**
     * Inicializa el componente
     */
    init() {
        if (!this.container) {
            console.warn('LayoutPreview: contenedor no encontrado');
            return;
        }

        this.container.setAttribute('role', 'img');
        this.container.setAttribute('aria-label', 'Vista previa del layout del documento');
    }

    /**
     * Actualiza la configuración
     * @param {Object} config - Configuración del documento
     */
    setConfig(config) {
        this.config = config;
        this.calculateLayout();
        this.render();
    }

    /**
     * Actualiza las imágenes
     * @param {Array} images - Array de imágenes
     */
    setImages(images) {
        this.images = images;
        this.calculateLayout();
        this.render();
    }

    /**
     * Actualiza tanto config como imágenes
     * @param {Object} config - Configuración
     * @param {Array} images - Imágenes
     */
    update(config, images) {
        this.config = config;
        this.images = images;
        this.calculateLayout();
        this.render();
    }

    /**
     * Calcula el layout de las páginas
     */
    calculateLayout() {
        if (!this.config || this.images.length === 0) {
            this.pages = [];
            return;
        }

        const pageSize = PAGE_SIZES[this.config.page_size] || PAGE_SIZES.carta;
        const isHorizontal = this.config.page_orientation === ORIENTATION.HORIZONTAL;

        // Dimensiones de la página en cm
        const pageWidth = isHorizontal ? pageSize.height : pageSize.width;
        const pageHeight = isHorizontal ? pageSize.width : pageSize.height;

        // Área útil (restando márgenes)
        const margins = this.config.margins_cm || 1.5;
        const usableWidth = pageWidth - margins * 2;
        const usableHeight = pageHeight - margins * 2;

        // Dimensiones de imagen
        const imageWidth = this.config.image_width_cm || 10;
        const spacing = this.config.spacing_cm || 0.5;

        // Calcular imágenes por fila
        let imagesPerRow = this.config.images_per_row;
        if (imagesPerRow === 'auto' || !imagesPerRow) {
            imagesPerRow = Math.max(1, Math.floor((usableWidth + spacing) / (imageWidth + spacing)));
        }

        // Calcular altura de imagen (asumiendo proporción 1:1 por defecto)
        // En la práctica, cada imagen tendría su propia proporción
        const imageHeight = imageWidth; // Simplificación para preview

        // Calcular filas por página
        const rowsPerPage = Math.max(1, Math.floor((usableHeight + spacing) / (imageHeight + spacing)));
        const imagesPerPage = imagesPerRow * rowsPerPage;

        // Distribuir imágenes en páginas
        this.pages = [];
        let currentPage = [];
        let currentRow = [];

        this.images.forEach((image, index) => {
            currentRow.push({
                index,
                image,
                width: imageWidth,
                height: imageHeight,
            });

            if (currentRow.length >= imagesPerRow) {
                currentPage.push([...currentRow]);
                currentRow = [];

                if (currentPage.length >= rowsPerPage) {
                    this.pages.push({
                        rows: [...currentPage],
                        pageWidth,
                        pageHeight,
                        margins,
                        imagesPerRow,
                    });
                    currentPage = [];
                }
            }
        });

        // Agregar fila parcial
        if (currentRow.length > 0) {
            currentPage.push([...currentRow]);
        }

        // Agregar página parcial
        if (currentPage.length > 0) {
            this.pages.push({
                rows: [...currentPage],
                pageWidth,
                pageHeight,
                margins,
                imagesPerRow,
            });
        }

        // Guardar metadata
        this.layoutInfo = {
            pageWidth,
            pageHeight,
            usableWidth,
            usableHeight,
            imageWidth,
            imageHeight,
            spacing,
            margins,
            imagesPerRow,
            rowsPerPage,
            imagesPerPage,
            totalPages: this.pages.length,
            totalImages: this.images.length,
        };
    }

    /**
     * Renderiza la vista previa
     */
    render() {
        if (!this.container) return;

        if (!this.config || this.images.length === 0) {
            this.renderEmptyState();
            return;
        }

        if (this.pages.length === 0) {
            this.renderEmptyState();
            return;
        }

        const scale = this.options.scale;
        const info = this.layoutInfo;

        this.container.innerHTML = `
            <div class="layout-preview-wrapper">
                <!-- Info header -->
                <div class="layout-info">
                    <span class="layout-info-item">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        ${info.totalPages} ${info.totalPages === 1 ? 'página' : 'páginas'}
                    </span>
                    <span class="layout-info-item">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        ${info.totalImages} ${info.totalImages === 1 ? 'imagen' : 'imágenes'}
                    </span>
                    <span class="layout-info-item">
                        ${info.imagesPerRow} x fila
                    </span>
                </div>

                <!-- Pages container -->
                <div class="layout-pages" role="list" aria-label="Páginas del documento">
                    ${this.pages.map((page, pageIndex) => this.renderPage(page, pageIndex, scale)).join('')}
                </div>

                <!-- Page size indicator -->
                <div class="layout-size-indicator">
                    ${this.config.page_size.toUpperCase()} - ${this.config.page_orientation === 'horizontal' ? 'Horizontal' : 'Vertical'}
                </div>
            </div>
        `;
    }

    /**
     * Renderiza una página
     */
    renderPage(page, pageIndex, scale) {
        const pxPerCm = 37.8; // Aproximación: 96dpi / 2.54
        const pageWidthPx = page.pageWidth * pxPerCm * scale;
        const pageHeightPx = page.pageHeight * pxPerCm * scale;
        const marginsPx = page.margins * pxPerCm * scale;

        return `
            <div class="layout-page"
                 role="listitem"
                 aria-label="Página ${pageIndex + 1}"
                 style="width: ${pageWidthPx}px; height: ${pageHeightPx}px;">

                <!-- Page number -->
                <span class="layout-page-number">${pageIndex + 1}</span>

                <!-- Content area -->
                <div class="layout-page-content"
                     style="margin: ${marginsPx}px;">
                    ${page.rows.map(row => this.renderRow(row, scale)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Renderiza una fila de imágenes
     */
    renderRow(row, scale) {
        const pxPerCm = 37.8;
        const spacing = (this.layoutInfo.spacing * pxPerCm * scale);

        return `
            <div class="layout-row" style="gap: ${spacing}px; margin-bottom: ${spacing}px;">
                ${row.map(item => this.renderImagePlaceholder(item, scale)).join('')}
            </div>
        `;
    }

    /**
     * Renderiza un placeholder de imagen
     */
    renderImagePlaceholder(item, scale) {
        const pxPerCm = 37.8;
        const widthPx = item.width * pxPerCm * scale;
        const heightPx = item.height * pxPerCm * scale;
        const hasBorder = this.config.borders;

        // Usar thumbnail si está disponible
        const thumbnailStyle = item.image?.data
            ? `background-image: url(${item.image.data}); background-size: cover; background-position: center;`
            : '';

        return `
            <div class="layout-image ${hasBorder ? 'with-border' : ''}"
                 style="width: ${widthPx}px; height: ${heightPx}px; ${thumbnailStyle}"
                 title="Imagen ${item.index + 1}: ${item.image?.name || 'Sin nombre'}">
                ${!item.image?.data ? `<span class="layout-image-number">${item.index + 1}</span>` : ''}
            </div>
        `;
    }

    /**
     * Renderiza estado vacío
     */
    renderEmptyState() {
        this.container.innerHTML = `
            <div class="layout-preview-empty">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
                </svg>
                <p class="text-gray-500 text-sm">Agrega imágenes para ver la vista previa</p>
                <p class="text-gray-400 text-xs mt-1">El layout se actualizará automáticamente</p>
            </div>
        `;
    }

    /**
     * Obtiene información del layout calculado
     * @returns {Object|null}
     */
    getLayoutInfo() {
        return this.layoutInfo || null;
    }

    /**
     * Obtiene el número de páginas
     * @returns {number}
     */
    getPageCount() {
        return this.pages.length;
    }

    /**
     * Limpia la vista previa
     */
    clear() {
        this.config = null;
        this.images = [];
        this.pages = [];
        this.layoutInfo = null;
        this.renderEmptyState();
    }

    /**
     * Muestra/oculta la vista previa
     * @param {boolean} visible
     */
    setVisible(visible) {
        if (this.container) {
            this.container.style.display = visible ? '' : 'none';
        }
    }
}
