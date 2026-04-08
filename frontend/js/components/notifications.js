/**
 * Sistema de Notificaciones Toast
 *
 * Muestra notificaciones elegantes al usuario con animaciones
 * y auto-cierre configurable.
 */

import { NOTIFICATION_DURATION } from '../utils/constants.js';
import { escapeHtml, generateId } from '../utils/helpers.js';

export class Notifications {
    /**
     * @param {string} containerId - ID del contenedor de notificaciones
     * @param {Object} options - Opciones de configuración
     */
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            maxNotifications: 5,
            position: 'top-right',
            ...options,
        };
        this.notifications = new Map();

        this.init();
    }

    /**
     * Inicializa el componente
     */
    init() {
        if (!this.container) {
            console.error('Notifications: contenedor no encontrado');
            return;
        }

        // Asegurar estilos del contenedor
        this.container.setAttribute('role', 'alert');
        this.container.setAttribute('aria-live', 'polite');
    }

    /**
     * Muestra una notificación
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo: success, error, warning, info
     * @param {number|null} duration - Duración en ms (null = permanente)
     * @returns {string} - ID de la notificación
     */
    show(message, type = 'info', duration = null) {
        // Determinar duración
        const notificationDuration = duration ?? NOTIFICATION_DURATION[type] ?? 4000;

        // Limitar número de notificaciones
        if (this.notifications.size >= this.options.maxNotifications) {
            const oldestId = this.notifications.keys().next().value;
            this.remove(oldestId);
        }

        // Crear notificación
        const id = generateId('notif');
        const notification = this.createNotification(id, message, type);

        // Agregar al DOM
        this.container.appendChild(notification);
        this.notifications.set(id, notification);

        // Auto-cerrar
        if (notificationDuration > 0) {
            const timeout = setTimeout(() => this.remove(id), notificationDuration);
            notification.dataset.timeout = timeout;
        }

        return id;
    }

    /**
     * Crea el elemento de notificación
     */
    createNotification(id, message, type) {
        const div = document.createElement('div');
        div.id = id;
        div.className = `notification ${type}`;
        div.setAttribute('role', 'alert');

        // Iconos SVG según el tipo
        const icons = {
            success: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>`,
            error: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>`,
            warning: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>`,
            info: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>`,
        };

        div.innerHTML = `
            ${icons[type] || icons.info}
            <span class="flex-1 text-sm">${escapeHtml(message)}</span>
            <button
                class="close-btn p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
                aria-label="Cerrar notificación"
                type="button"
            >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        `;

        // Event listener para cerrar
        const closeBtn = div.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => this.remove(id));

        // Pausar auto-cierre al hover
        div.addEventListener('mouseenter', () => {
            if (div.dataset.timeout) {
                clearTimeout(parseInt(div.dataset.timeout));
            }
        });

        div.addEventListener('mouseleave', () => {
            const remainingTime = NOTIFICATION_DURATION[type] ?? 4000;
            div.dataset.timeout = setTimeout(() => this.remove(id), remainingTime / 2);
        });

        return div;
    }

    /**
     * Elimina una notificación con animación
     * @param {string} id - ID de la notificación
     */
    remove(id) {
        const notification = this.notifications.get(id);
        if (!notification || notification.classList.contains('removing')) return;

        // Cancelar timeout si existe
        if (notification.dataset.timeout) {
            clearTimeout(parseInt(notification.dataset.timeout));
        }

        // Agregar clase de animación de salida
        notification.classList.add('removing');

        // Remover después de la animación
        setTimeout(() => {
            notification.remove();
            this.notifications.delete(id);
        }, 300);
    }

    /**
     * Elimina todas las notificaciones
     */
    clear() {
        this.notifications.forEach((_, id) => this.remove(id));
    }

    // Métodos de conveniencia
    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }

    /**
     * Muestra una notificación de carga que debe cerrarse manualmente
     * @param {string} message - Mensaje de carga
     * @returns {Function} - Función para cerrar la notificación
     */
    loading(message = 'Procesando...') {
        const id = this.show(message, 'info', null); // null = permanente

        return (successMessage) => {
            this.remove(id);
            if (successMessage) {
                this.success(successMessage);
            }
        };
    }
}
