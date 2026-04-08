/**
 * Panel de Historial de Documentos
 *
 * Muestra los documentos generados recientemente con opción
 * de descargarlos nuevamente.
 *
 * @version 1.0.0
 */

import { StorageService } from '../services/storage.js';
import { formatFileSize, formatDate } from '../utils/helpers.js';

export class HistoryPanel {
    /**
     * @param {string} containerId - ID del contenedor del panel
     * @param {Object} callbacks - Callbacks para eventos
     */
    constructor(containerId, callbacks = {}) {
        this.container = document.getElementById(containerId);
        this.callbacks = {
            onDownload: () => {},
            onClear: () => {},
            ...callbacks,
        };

        this.history = [];
        this.isExpanded = false;

        this.init();
    }

    /**
     * Inicializa el panel
     */
    init() {
        if (!this.container) {
            console.warn('HistoryPanel: contenedor no encontrado');
            return;
        }

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
     * @param {Object} doc - Documento generado
     */
    addDocument(doc) {
        StorageService.addToHistory(doc);
        this.loadHistory();
        this.render();
    }

    /**
     * Renderiza el panel completo
     */
    render() {
        if (!this.container) return;

        const hasHistory = this.history.length > 0;

        this.container.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <!-- Header colapsable -->
                <button
                    id="history-header"
                    type="button"
                    class="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    aria-expanded="${this.isExpanded}"
                    aria-controls="history-content"
                >
                    <div class="flex items-center gap-2">
                        <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span class="font-medium text-gray-700">Documentos recientes</span>
                        ${hasHistory ? `<span class="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">${this.history.length}</span>` : ''}
                    </div>
                    <svg id="history-chevron" class="w-5 h-5 text-gray-500 transition-transform duration-200 ${this.isExpanded ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </button>

                <!-- Contenido expandible -->
                <div id="history-content" class="${this.isExpanded ? '' : 'hidden'} border-t border-gray-200">
                    ${hasHistory ? this.renderHistoryList() : this.renderEmptyState()}
                </div>
            </div>
        `;

        this.bindEvents();
    }

    /**
     * Renderiza la lista de historial
     */
    renderHistoryList() {
        return `
            <div class="max-h-64 overflow-y-auto">
                <div class="divide-y divide-gray-100">
                    ${this.history.map((doc, index) => this.renderHistoryItem(doc, index)).join('')}
                </div>
            </div>
            <div class="px-4 py-2 bg-gray-50 border-t border-gray-100">
                <button
                    id="btn-clear-history"
                    type="button"
                    class="text-xs text-red-500 hover:text-red-600"
                >
                    Limpiar historial
                </button>
            </div>
        `;
    }

    /**
     * Renderiza un item del historial
     */
    renderHistoryItem(doc, index) {
        const timestamp = new Date(doc.timestamp);
        const formattedDate = this.formatRelativeDate(timestamp);
        const sizeFormatted = formatFileSize((doc.file_size_kb || 0) * 1024);

        return `
            <div class="flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors" data-index="${index}">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                    </div>
                    <div class="min-w-0">
                        <p class="text-sm font-medium text-gray-800 truncate" title="${doc.filename}">
                            ${doc.filename}
                        </p>
                        <p class="text-xs text-gray-500">
                            ${doc.images_placed || doc.pages || '?'} imgs · ${sizeFormatted} · ${formattedDate}
                        </p>
                    </div>
                </div>
                <button
                    class="btn-download-history p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                    data-filename="${doc.filename}"
                    title="Descargar ${doc.filename}"
                    type="button"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                </button>
            </div>
        `;
    }

    /**
     * Renderiza estado vacío
     */
    renderEmptyState() {
        return `
            <div class="text-center py-8 px-4">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p class="text-sm text-gray-500">No hay documentos recientes</p>
                <p class="text-xs text-gray-400 mt-1">Los documentos generados aparecerán aquí</p>
            </div>
        `;
    }

    /**
     * Formatea fecha relativa
     */
    formatRelativeDate(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'ahora';
        if (minutes < 60) return `hace ${minutes}m`;
        if (hours < 24) return `hace ${hours}h`;
        if (days < 7) return `hace ${days}d`;

        return date.toLocaleDateString('es-BO', {
            day: '2-digit',
            month: 'short',
        });
    }

    /**
     * Vincula eventos
     */
    bindEvents() {
        // Toggle panel
        const header = document.getElementById('history-header');
        header?.addEventListener('click', () => this.toggle());

        // Botones de descarga
        this.container.querySelectorAll('.btn-download-history').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const filename = btn.dataset.filename;
                if (filename) {
                    this.callbacks.onDownload(filename);
                }
            });
        });

        // Botón limpiar historial
        const clearBtn = document.getElementById('btn-clear-history');
        clearBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearHistory();
        });
    }

    /**
     * Toggle expansión del panel
     */
    toggle() {
        this.isExpanded = !this.isExpanded;
        this.render();
    }

    /**
     * Expande el panel
     */
    expand() {
        if (!this.isExpanded) {
            this.isExpanded = true;
            this.render();
        }
    }

    /**
     * Colapsa el panel
     */
    collapse() {
        if (this.isExpanded) {
            this.isExpanded = false;
            this.render();
        }
    }

    /**
     * Limpia el historial
     */
    clearHistory() {
        if (confirm('¿Eliminar todo el historial de documentos?')) {
            StorageService.clearHistory();
            this.history = [];
            this.render();
            this.callbacks.onClear();
        }
    }

    /**
     * Refresca el historial
     */
    refresh() {
        this.loadHistory();
        this.render();
    }

    /**
     * Obtiene el número de items en el historial
     */
    getCount() {
        return this.history.length;
    }
}
