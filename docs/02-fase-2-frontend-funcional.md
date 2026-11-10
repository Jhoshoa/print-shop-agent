# Fase 2: Frontend Funcional

> **Objetivo:** Crear la interfaz de usuario web para el generador de documentos
> **Duración estimada de desarrollo:** 3-4 horas
> **Resultado:** Interfaz web funcional con drag & drop de imágenes

---

## Tabla de Contenidos

1. [Checklist de Tareas](#checklist-de-tareas)
2. [Estructura del Frontend](#estructura-del-frontend)
3. [HTML Principal](#html-principal)
4. [Estilos CSS](#estilos-css)
5. [JavaScript - Módulo Principal](#javascript---módulo-principal)
6. [JavaScript - Componente Dropzone](#javascript---componente-dropzone)
7. [JavaScript - Grid de Imágenes](#javascript---grid-de-imágenes)
8. [JavaScript - Cliente API](#javascript---cliente-api)
9. [JavaScript - Utilidades](#javascript---utilidades)
10. [JavaScript - Notificaciones](#javascript---notificaciones)
11. [Verificación de la Fase](#verificación-de-la-fase)

---

## Checklist de Tareas

- [ ] Crear estructura de carpetas del frontend
- [ ] Implementar HTML principal con layout responsive
- [ ] Crear estilos CSS con TailwindCSS
- [ ] Implementar componente Dropzone (drag & drop)
- [ ] Implementar grid de imágenes con preview
- [ ] Crear cliente API para comunicación con backend
- [ ] Implementar sistema de notificaciones
- [ ] Agregar estados de carga y feedback visual
- [ ] Probar flujo completo: arrastrar → generar → descargar

---

## Estructura del Frontend

```
frontend/
├── index.html              # Página principal
├── css/
│   └── styles.css          # Estilos personalizados
└── js/
    ├── app.js              # Módulo principal (entry point)
    ├── components/
    │   ├── dropzone.js     # Componente drag & drop
    │   ├── imageGrid.js    # Grid de imágenes cargadas
    │   ├── optionsPanel.js # Panel de opciones (Fase 3)
    │   └── notifications.js# Sistema de notificaciones
    ├── services/
    │   └── api.js          # Cliente HTTP para el backend
    └── utils/
        ├── constants.js    # Constantes
        └── helpers.js      # Funciones auxiliares
```

---

## HTML Principal

### frontend/index.html

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generador de Documentos - Print Shop</title>

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📄</text></svg>">

    <!-- TailwindCSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Tailwind Config -->
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: {
                            50: '#eff6ff',
                            100: '#dbeafe',
                            200: '#bfdbfe',
                            300: '#93c5fd',
                            400: '#60a5fa',
                            500: '#3b82f6',
                            600: '#2563eb',
                            700: '#1d4ed8',
                            800: '#1e40af',
                            900: '#1e3a8a',
                        }
                    }
                }
            }
        }
    </script>

    <!-- Custom Styles -->
    <link rel="stylesheet" href="css/styles.css">
</head>
<body class="bg-gray-50 min-h-screen">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-5xl mx-auto px-4 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="text-3xl">📄</span>
                    <div>
                        <h1 class="text-xl font-bold text-gray-800">
                            Generador de Documentos
                        </h1>
                        <p class="text-sm text-gray-500">
                            Arrastra tus imágenes y genera documentos Word
                        </p>
                    </div>
                </div>
                <button
                    id="btn-options"
                    class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Opciones avanzadas"
                >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z">
                        </path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z">
                        </path>
                    </svg>
                </button>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-5xl mx-auto px-4 py-6">
        <!-- Notifications Container -->
        <div id="notifications" class="fixed top-4 right-4 z-50 space-y-2"></div>

        <!-- Dropzone -->
        <section id="dropzone-section" class="mb-6">
            <div
                id="dropzone"
                class="dropzone border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer transition-all duration-200 bg-white hover:border-primary-400 hover:bg-primary-50"
            >
                <div class="dropzone-content">
                    <div class="mb-4">
                        <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z">
                            </path>
                        </svg>
                    </div>
                    <p class="text-lg font-medium text-gray-700 mb-1">
                        Arrastra las imágenes aquí
                    </p>
                    <p class="text-sm text-gray-500 mb-4">
                        o haz clic para seleccionar archivos
                    </p>
                    <p class="text-xs text-gray-400">
                        Formatos: JPG, PNG, WEBP (máx. 100 imágenes)
                    </p>
                </div>

                <!-- Hidden file input -->
                <input
                    type="file"
                    id="file-input"
                    class="hidden"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
                >
            </div>
        </section>

        <!-- Images Grid -->
        <section id="images-section" class="mb-6 hidden">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <!-- Header -->
                <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">🖼️</span>
                        <span class="font-medium text-gray-700">
                            Imágenes cargadas: <span id="image-count" class="text-primary-600">0</span>
                        </span>
                    </div>
                    <button
                        id="btn-clear"
                        class="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16">
                            </path>
                        </svg>
                        Limpiar todo
                    </button>
                </div>

                <!-- Grid -->
                <div id="images-grid" class="p-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    <!-- Images will be inserted here -->
                </div>
            </div>
        </section>

        <!-- Quick Options -->
        <section id="options-section" class="mb-6 hidden">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <!-- Page Size -->
                    <div>
                        <label for="page-size" class="block text-sm font-medium text-gray-700 mb-1">
                            Tamaño de hoja
                        </label>
                        <select
                            id="page-size"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="carta" selected>Carta</option>
                            <option value="a4">A4</option>
                            <option value="a3">A3</option>
                            <option value="oficio">Oficio</option>
                            <option value="legal">Legal</option>
                        </select>
                    </div>

                    <!-- Image Width -->
                    <div>
                        <label for="image-width" class="block text-sm font-medium text-gray-700 mb-1">
                            Ancho de imagen (cm)
                        </label>
                        <input
                            type="number"
                            id="image-width"
                            value="10"
                            min="1"
                            max="30"
                            step="0.5"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                    </div>

                    <!-- Images per Row -->
                    <div>
                        <label for="images-per-row" class="block text-sm font-medium text-gray-700 mb-1">
                            Imágenes por fila
                        </label>
                        <select
                            id="images-per-row"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="auto" selected>Automático</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                        </select>
                    </div>
                </div>

                <!-- Filename -->
                <div class="mt-4">
                    <label for="filename" class="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del archivo
                    </label>
                    <input
                        type="text"
                        id="filename"
                        placeholder="documento"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                </div>
            </div>
        </section>

        <!-- Generate Button -->
        <section id="generate-section" class="mb-6 hidden">
            <button
                id="btn-generate"
                class="w-full py-4 px-6 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                    </path>
                </svg>
                <span id="btn-generate-text">Generar Documento</span>
            </button>
        </section>

        <!-- Result Section -->
        <section id="result-section" class="hidden">
            <div class="bg-green-50 border border-green-200 rounded-xl p-6">
                <div class="flex items-start gap-4">
                    <div class="flex-shrink-0">
                        <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z">
                            </path>
                        </svg>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-green-800 mb-1">
                            Documento generado exitosamente
                        </h3>
                        <p class="text-green-700 mb-4">
                            <span id="result-filename" class="font-medium"></span>
                            (<span id="result-pages"></span> páginas, <span id="result-size"></span>)
                        </p>
                        <div class="flex flex-wrap gap-3">
                            <a
                                id="btn-download"
                                href="#"
                                class="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                            >
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4">
                                    </path>
                                </svg>
                                Descargar documento
                            </a>
                            <button
                                id="btn-new"
                                class="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 transition-colors"
                            >
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 4v16m8-8H4">
                                    </path>
                                </svg>
                                Nuevo documento
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <!-- Footer -->
    <footer class="mt-auto py-4 text-center text-sm text-gray-500">
        <p>Print Shop Generator v1.0.0</p>
    </footer>

    <!-- Loading Overlay -->
    <div id="loading-overlay" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
        <div class="bg-white rounded-xl p-6 shadow-xl flex flex-col items-center">
            <div class="loading-spinner mb-4"></div>
            <p id="loading-text" class="text-gray-700 font-medium">Procesando...</p>
        </div>
    </div>

    <!-- Scripts -->
    <script type="module" src="js/app.js"></script>
</body>
</html>
```

---

## Estilos CSS

### frontend/css/styles.css

```css
/**
 * Estilos personalizados para Print Shop Generator
 * Complementa TailwindCSS con animaciones y efectos específicos
 */

/* ============================================
   VARIABLES CSS
   ============================================ */
:root {
    --color-primary: #3b82f6;
    --color-primary-dark: #2563eb;
    --color-success: #10b981;
    --color-error: #ef4444;
    --color-warning: #f59e0b;
    --transition-fast: 150ms ease;
    --transition-normal: 200ms ease;
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

/* ============================================
   DROPZONE
   ============================================ */
.dropzone {
    min-height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.dropzone.dragover {
    border-color: var(--color-primary);
    background-color: #eff6ff;
    transform: scale(1.01);
}

.dropzone.dragover .dropzone-content {
    pointer-events: none;
}

.dropzone.dragover svg {
    color: var(--color-primary);
    transform: scale(1.1);
}

.dropzone svg {
    transition: transform var(--transition-normal), color var(--transition-normal);
}

/* ============================================
   IMAGE GRID
   ============================================ */
.image-item {
    position: relative;
    aspect-ratio: 1;
    border-radius: 0.5rem;
    overflow: hidden;
    background-color: #f3f4f6;
    cursor: pointer;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.image-item:hover {
    transform: scale(1.05);
    box-shadow: var(--shadow-md);
    z-index: 10;
}

.image-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.image-item .remove-btn {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 20px;
    height: 20px;
    background-color: rgba(239, 68, 68, 0.9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity var(--transition-fast);
    cursor: pointer;
}

.image-item:hover .remove-btn {
    opacity: 1;
}

.image-item .remove-btn svg {
    width: 12px;
    height: 12px;
    color: white;
}

.image-item .image-number {
    position: absolute;
    bottom: 2px;
    left: 2px;
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 4px;
}

/* ============================================
   LOADING SPINNER
   ============================================ */
.loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #e5e7eb;
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* ============================================
   NOTIFICATIONS
   ============================================ */
.notification {
    padding: 1rem;
    border-radius: 0.5rem;
    box-shadow: var(--shadow-md);
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    max-width: 400px;
    animation: slideIn 0.3s ease;
}

.notification.success {
    background-color: #ecfdf5;
    border: 1px solid #a7f3d0;
    color: #065f46;
}

.notification.error {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
}

.notification.warning {
    background-color: #fffbeb;
    border: 1px solid #fde68a;
    color: #92400e;
}

.notification.info {
    background-color: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1e40af;
}

.notification .close-btn {
    margin-left: auto;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity var(--transition-fast);
}

.notification .close-btn:hover {
    opacity: 1;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}

.notification.removing {
    animation: slideOut 0.3s ease forwards;
}

/* ============================================
   BUTTON STATES
   ============================================ */
button:disabled {
    cursor: not-allowed;
}

.btn-loading {
    position: relative;
    color: transparent !important;
}

.btn-loading::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    top: 50%;
    left: 50%;
    margin-left: -10px;
    margin-top: -10px;
    border: 2px solid white;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

/* ============================================
   RESPONSIVE ADJUSTMENTS
   ============================================ */
@media (max-width: 640px) {
    .dropzone {
        min-height: 150px;
        padding: 1.5rem;
    }

    .dropzone svg {
        width: 3rem;
        height: 3rem;
    }

    #images-grid {
        grid-template-columns: repeat(4, 1fr);
    }
}

/* ============================================
   SCROLLBAR STYLING
   ============================================ */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* ============================================
   FOCUS STATES (Accessibility)
   ============================================ */
button:focus-visible,
input:focus-visible,
select:focus-visible,
a:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

/* ============================================
   PRINT STYLES
   ============================================ */
@media print {
    header, footer, #dropzone-section, #generate-section {
        display: none;
    }
}
```

---

## JavaScript - Módulo Principal

### frontend/js/app.js

```javascript
/**
 * Print Shop Generator - Módulo Principal
 *
 * Entry point de la aplicación. Inicializa componentes y maneja el flujo principal.
 */

import { Dropzone } from './components/dropzone.js';
import { ImageGrid } from './components/imageGrid.js';
import { Notifications } from './components/notifications.js';
import { ApiClient } from './services/api.js';
import { formatFileSize } from './utils/helpers.js';

class App {
    constructor() {
        // Estado de la aplicación
        this.images = [];
        this.isProcessing = false;

        // Componentes
        this.notifications = null;
        this.dropzone = null;
        this.imageGrid = null;
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

        console.log('Print Shop Generator initialized');
    }

    /**
     * Cachea referencias a elementos del DOM
     */
    cacheElements() {
        this.elements = {
            // Sections
            imagesSection: document.getElementById('images-section'),
            optionsSection: document.getElementById('options-section'),
            generateSection: document.getElementById('generate-section'),
            resultSection: document.getElementById('result-section'),

            // Buttons
            btnClear: document.getElementById('btn-clear'),
            btnGenerate: document.getElementById('btn-generate'),
            btnGenerateText: document.getElementById('btn-generate-text'),
            btnDownload: document.getElementById('btn-download'),
            btnNew: document.getElementById('btn-new'),
            btnOptions: document.getElementById('btn-options'),

            // Inputs
            pageSize: document.getElementById('page-size'),
            imageWidth: document.getElementById('image-width'),
            imagesPerRow: document.getElementById('images-per-row'),
            filename: document.getElementById('filename'),

            // Result
            resultFilename: document.getElementById('result-filename'),
            resultPages: document.getElementById('result-pages'),
            resultSize: document.getElementById('result-size'),

            // Others
            imageCount: document.getElementById('image-count'),
            imagesGrid: document.getElementById('images-grid'),
            loadingOverlay: document.getElementById('loading-overlay'),
            loadingText: document.getElementById('loading-text'),
        };
    }

    /**
     * Inicializa componentes de la aplicación
     */
    initComponents() {
        // Notificaciones
        this.notifications = new Notifications('notifications');

        // API Client
        this.api = new ApiClient();

        // Dropzone
        this.dropzone = new Dropzone('dropzone', 'file-input', {
            onFilesAdded: (files) => this.handleFilesAdded(files),
            onError: (message) => this.notifications.error(message),
        });

        // Image Grid
        this.imageGrid = new ImageGrid('images-grid', {
            onRemove: (index) => this.handleImageRemove(index),
        });
    }

    /**
     * Vincula event listeners
     */
    bindEvents() {
        // Clear button
        this.elements.btnClear?.addEventListener('click', () => this.clearAll());

        // Generate button
        this.elements.btnGenerate?.addEventListener('click', () => this.generateDocument());

        // New document button
        this.elements.btnNew?.addEventListener('click', () => this.startNew());

        // Options button (toggle avanzado - Fase 3)
        this.elements.btnOptions?.addEventListener('click', () => {
            this.notifications.info('Opciones avanzadas disponibles en la próxima versión');
        });
    }

    /**
     * Carga configuración por defecto desde el servidor
     */
    async loadDefaults() {
        try {
            const config = await this.api.getDefaults();

            if (config?.defaults) {
                this.elements.pageSize.value = config.defaults.page_size || 'carta';
                this.elements.imageWidth.value = config.defaults.image_width_cm || 10;
                this.elements.imagesPerRow.value = config.defaults.images_per_row || 'auto';
            }
        } catch (error) {
            console.warn('Could not load defaults:', error);
            // Usar valores por defecto del HTML
        }
    }

    /**
     * Maneja archivos agregados desde el dropzone
     */
    async handleFilesAdded(files) {
        if (files.length === 0) return;

        // Validar límite
        const totalImages = this.images.length + files.length;
        if (totalImages > 100) {
            this.notifications.warning(`Máximo 100 imágenes. Se agregarán solo ${100 - this.images.length}.`);
            files = files.slice(0, 100 - this.images.length);
        }

        this.showLoading('Cargando imágenes...');

        try {
            // Convertir archivos a base64
            const newImages = await Promise.all(
                Array.from(files).map(file => this.fileToBase64(file))
            );

            // Agregar al estado
            this.images.push(...newImages);

            // Actualizar UI
            this.updateImagesUI();

            this.notifications.success(`${files.length} imagen(es) agregada(s)`);

        } catch (error) {
            console.error('Error loading images:', error);
            this.notifications.error('Error al cargar algunas imágenes');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Convierte un archivo a base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                resolve({
                    data: reader.result,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                });
            };

            reader.onerror = () => reject(new Error(`Error reading ${file.name}`));

            reader.readAsDataURL(file);
        });
    }

    /**
     * Maneja eliminación de una imagen
     */
    handleImageRemove(index) {
        this.images.splice(index, 1);
        this.updateImagesUI();

        if (this.images.length === 0) {
            this.notifications.info('Todas las imágenes eliminadas');
        }
    }

    /**
     * Actualiza la UI de imágenes
     */
    updateImagesUI() {
        const hasImages = this.images.length > 0;

        // Mostrar/ocultar secciones
        this.elements.imagesSection.classList.toggle('hidden', !hasImages);
        this.elements.optionsSection.classList.toggle('hidden', !hasImages);
        this.elements.generateSection.classList.toggle('hidden', !hasImages);
        this.elements.resultSection.classList.add('hidden');

        // Actualizar contador
        this.elements.imageCount.textContent = this.images.length;

        // Actualizar grid
        this.imageGrid.render(this.images);

        // Actualizar botón generar
        this.elements.btnGenerateText.textContent =
            `Generar Documento (${this.images.length} imagen${this.images.length !== 1 ? 'es' : ''})`;
    }

    /**
     * Genera el documento
     */
    async generateDocument() {
        if (this.images.length === 0) {
            this.notifications.warning('Agrega al menos una imagen');
            return;
        }

        if (this.isProcessing) return;

        this.isProcessing = true;
        this.showLoading('Generando documento...');
        this.setButtonLoading(true);

        try {
            // Preparar datos
            const imageData = this.images.map(img => img.data);

            const config = {
                page_size: this.elements.pageSize.value,
                image_width_cm: parseFloat(this.elements.imageWidth.value) || 10,
                images_per_row: this.elements.imagesPerRow.value,
                filename: this.elements.filename.value || 'documento',
            };

            // Llamar API
            const result = await this.api.generateDocument(imageData, config);

            if (result.success) {
                this.showResult(result);
                this.notifications.success('Documento generado exitosamente');
            } else {
                throw new Error(result.error || 'Error desconocido');
            }

        } catch (error) {
            console.error('Error generating document:', error);
            this.notifications.error(error.message || 'Error al generar el documento');
        } finally {
            this.isProcessing = false;
            this.hideLoading();
            this.setButtonLoading(false);
        }
    }

    /**
     * Muestra el resultado de la generación
     */
    showResult(result) {
        this.elements.resultFilename.textContent = result.filename;
        this.elements.resultPages.textContent = result.pages;
        this.elements.resultSize.textContent = formatFileSize(result.file_size_kb * 1024);

        // Configurar botón de descarga
        this.elements.btnDownload.href = this.api.getDownloadUrl(result.filename);
        this.elements.btnDownload.download = result.filename;

        // Mostrar sección de resultado
        this.elements.generateSection.classList.add('hidden');
        this.elements.resultSection.classList.remove('hidden');
    }

    /**
     * Limpia todas las imágenes
     */
    clearAll() {
        this.images = [];
        this.updateImagesUI();
        this.elements.resultSection.classList.add('hidden');
    }

    /**
     * Inicia un nuevo documento
     */
    startNew() {
        this.clearAll();
        this.elements.filename.value = '';

        // Scroll al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Muestra el overlay de carga
     */
    showLoading(text = 'Procesando...') {
        this.elements.loadingText.textContent = text;
        this.elements.loadingOverlay.classList.remove('hidden');
    }

    /**
     * Oculta el overlay de carga
     */
    hideLoading() {
        this.elements.loadingOverlay.classList.add('hidden');
    }

    /**
     * Establece estado de carga del botón
     */
    setButtonLoading(loading) {
        const btn = this.elements.btnGenerate;
        btn.disabled = loading;
        btn.classList.toggle('btn-loading', loading);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();

    // Exponer para debugging (solo en desarrollo)
    if (window.location.hostname === 'localhost') {
        window.app = app;
    }
});
```

---

## JavaScript - Componente Dropzone

### frontend/js/components/dropzone.js

```javascript
/**
 * Componente Dropzone
 *
 * Maneja el arrastrar y soltar de archivos, así como la selección manual.
 */

export class Dropzone {
    /**
     * @param {string} dropzoneId - ID del elemento dropzone
     * @param {string} inputId - ID del input file
     * @param {Object} callbacks - Callbacks para eventos
     */
    constructor(dropzoneId, inputId, callbacks = {}) {
        this.dropzone = document.getElementById(dropzoneId);
        this.input = document.getElementById(inputId);
        this.callbacks = callbacks;

        this.acceptedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'image/bmp'
        ];

        this.maxFileSize = 10 * 1024 * 1024; // 10MB

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
    }

    /**
     * Vincula eventos del dropzone
     */
    bindEvents() {
        // Click para abrir selector de archivos
        this.dropzone.addEventListener('click', () => this.input.click());

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
    }

    /**
     * Maneja entrada de drag
     */
    handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropzone.classList.add('dragover');
    }

    /**
     * Maneja dragover
     */
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropzone.classList.add('dragover');
    }

    /**
     * Maneja salida de drag
     */
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();

        // Solo remover clase si salimos del dropzone
        if (!this.dropzone.contains(e.relatedTarget)) {
            this.dropzone.classList.remove('dragover');
        }
    }

    /**
     * Maneja el drop de archivos
     */
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropzone.classList.remove('dragover');

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
     * Procesa los archivos seleccionados
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
                errors.push(`${file.name}: ${validation.error}`);
            }
        }

        // Reportar errores
        if (errors.length > 0) {
            const message = errors.length === 1
                ? errors[0]
                : `${errors.length} archivos rechazados`;

            this.callbacks.onError?.(message);
            console.warn('Archivos rechazados:', errors);
        }

        // Procesar archivos válidos
        if (validFiles.length > 0) {
            this.callbacks.onFilesAdded?.(validFiles);
        }
    }

    /**
     * Valida un archivo
     */
    validateFile(file) {
        // Validar tipo
        if (!this.acceptedTypes.includes(file.type)) {
            return {
                valid: false,
                error: 'Formato no soportado'
            };
        }

        // Validar tamaño
        if (file.size > this.maxFileSize) {
            return {
                valid: false,
                error: `Archivo muy grande (máx. ${this.maxFileSize / 1024 / 1024}MB)`
            };
        }

        return { valid: true };
    }
}
```

---

## JavaScript - Grid de Imágenes

### frontend/js/components/imageGrid.js

```javascript
/**
 * Componente ImageGrid
 *
 * Muestra las imágenes cargadas en un grid con opción de eliminar.
 */

export class ImageGrid {
    /**
     * @param {string} containerId - ID del contenedor del grid
     * @param {Object} callbacks - Callbacks para eventos
     */
    constructor(containerId, callbacks = {}) {
        this.container = document.getElementById(containerId);
        this.callbacks = callbacks;
        this.images = [];
    }

    /**
     * Renderiza el grid de imágenes
     * @param {Array} images - Array de objetos imagen con {data, name}
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
     * Crea un elemento de imagen
     */
    createImageItem(image, index) {
        const div = document.createElement('div');
        div.className = 'image-item';
        div.title = image.name;

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
            this.removeImage(index);
        });
        div.appendChild(removeBtn);

        return div;
    }

    /**
     * Elimina una imagen
     */
    removeImage(index) {
        this.callbacks.onRemove?.(index);
    }

    /**
     * Limpia el grid
     */
    clear() {
        this.images = [];
        this.container.innerHTML = '';
    }
}
```

---

## JavaScript - Cliente API

### frontend/js/services/api.js

```javascript
/**
 * Cliente API
 *
 * Maneja la comunicación con el backend FastAPI.
 */

import { API_BASE_URL } from '../utils/constants.js';

export class ApiClient {
    constructor(baseUrl = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    /**
     * Realiza una petición al API
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);

            // Parsear respuesta
            const data = await response.json();

            // Verificar errores HTTP
            if (!response.ok) {
                throw new Error(data.detail?.error || data.error || `HTTP ${response.status}`);
            }

            return data;

        } catch (error) {
            // Re-throw con mensaje más claro
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                throw new Error('No se puede conectar con el servidor. Verifica que esté ejecutándose.');
            }
            throw error;
        }
    }

    /**
     * GET request
     */
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    /**
     * Obtiene la configuración por defecto
     */
    async getDefaults() {
        return this.get('/api/config/defaults');
    }

    /**
     * Obtiene los tamaños de página disponibles
     */
    async getPageSizes() {
        return this.get('/api/config/page-sizes');
    }

    /**
     * Genera un documento
     * @param {Array<string>} images - Imágenes en base64
     * @param {Object} config - Configuración del documento
     */
    async generateDocument(images, config) {
        return this.post('/api/generator/generate', {
            images,
            config,
        });
    }

    /**
     * Lista los archivos generados
     */
    async listFiles(limit = 20) {
        return this.get(`/api/generator/files?limit=${limit}`);
    }

    /**
     * Obtiene la URL de descarga de un archivo
     */
    getDownloadUrl(filename) {
        return `${this.baseUrl}/api/generator/download/${encodeURIComponent(filename)}`;
    }

    /**
     * Verifica el estado del servidor
     */
    async healthCheck() {
        return this.get('/api/health');
    }
}
```

---

## JavaScript - Utilidades

### frontend/js/utils/constants.js

```javascript
/**
 * Constantes de la aplicación
 */

// URL base del API (misma que sirve el frontend)
export const API_BASE_URL = window.location.origin;

// Límites
export const MAX_IMAGES = 100;
export const MAX_FILE_SIZE_MB = 10;

// Formatos soportados
export const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];

// Tamaños de página
export const PAGE_SIZES = {
    carta: { width: 21.59, height: 27.94 },
    a4: { width: 21.0, height: 29.7 },
    a3: { width: 29.7, height: 42.0 },
    oficio: { width: 21.59, height: 35.56 },
    legal: { width: 21.59, height: 35.56 },
};

// Configuración por defecto
export const DEFAULT_CONFIG = {
    pageSize: 'carta',
    imageWidthCm: 10,
    imagesPerRow: 'auto',
    spacingCm: 0.5,
    marginsCm: 1.5,
    borders: false,
};
```

### frontend/js/utils/helpers.js

```javascript
/**
 * Funciones auxiliares
 */

/**
 * Formatea un tamaño de archivo en bytes a formato legible
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} - Tamaño formateado (ej: "1.5 MB")
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Genera un nombre de archivo único
 * @param {string} prefix - Prefijo del nombre
 * @returns {string} - Nombre único
 */
export function generateFilename(prefix = 'documento') {
    const now = new Date();
    const timestamp = now.toISOString()
        .replace(/[-:T]/g, '')
        .slice(0, 14);

    return `${prefix}_${timestamp}`;
}

/**
 * Debounce function
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 */
export function debounce(func, wait) {
    let timeout;

    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Sanitiza un string para usar como nombre de archivo
 * @param {string} str - String a sanitizar
 * @returns {string} - String sanitizado
 */
export function sanitizeFilename(str) {
    return str
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, '_')
        .slice(0, 100);
}

/**
 * Espera un tiempo determinado
 * @param {number} ms - Milisegundos a esperar
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## JavaScript - Notificaciones

### frontend/js/components/notifications.js

```javascript
/**
 * Sistema de Notificaciones
 *
 * Muestra notificaciones toast al usuario.
 */

export class Notifications {
    /**
     * @param {string} containerId - ID del contenedor de notificaciones
     */
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.defaultDuration = 5000; // 5 segundos
    }

    /**
     * Muestra una notificación
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo: success, error, warning, info
     * @param {number} duration - Duración en ms (0 = permanente)
     */
    show(message, type = 'info', duration = this.defaultDuration) {
        const notification = this.createNotification(message, type);
        this.container.appendChild(notification);

        // Auto-cerrar después de la duración
        if (duration > 0) {
            setTimeout(() => this.remove(notification), duration);
        }

        return notification;
    }

    /**
     * Crea el elemento de notificación
     */
    createNotification(message, type) {
        const div = document.createElement('div');
        div.className = `notification ${type}`;

        // Icono según el tipo
        const icons = {
            success: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>`,
            error: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>`,
            warning: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>`,
            info: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>`,
        };

        div.innerHTML = `
            <span class="flex-shrink-0">${icons[type] || icons.info}</span>
            <span class="flex-1">${this.escapeHtml(message)}</span>
            <button class="close-btn" aria-label="Cerrar">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        `;

        // Botón cerrar
        const closeBtn = div.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => this.remove(div));

        return div;
    }

    /**
     * Elimina una notificación con animación
     */
    remove(notification) {
        if (!notification || notification.classList.contains('removing')) return;

        notification.classList.add('removing');

        setTimeout(() => {
            notification.remove();
        }, 300);
    }

    /**
     * Escapa HTML para prevenir XSS
     */
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
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
}
```

---

## Verificación de la Fase

### Checklist de verificación

```bash
# 1. Verificar estructura de archivos
frontend/
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── app.js
    ├── components/
    │   ├── dropzone.js
    │   ├── imageGrid.js
    │   └── notifications.js
    ├── services/
    │   └── api.js
    └── utils/
        ├── constants.js
        └── helpers.js
```

### Probar el frontend

```bash
# 1. Asegurarse de que el backend está corriendo
cd backend
python -m uvicorn app.main:app --reload

# 2. Abrir en el navegador
# http://localhost:8000
```

### Tests manuales a realizar

| Test | Pasos | Resultado esperado |
|------|-------|-------------------|
| Carga de página | Abrir localhost:8000 | Página carga sin errores |
| Drag & drop | Arrastrar imágenes al dropzone | Imágenes aparecen en el grid |
| Click para seleccionar | Click en dropzone, seleccionar archivos | Imágenes se agregan |
| Eliminar imagen | Click en X de una imagen | Imagen se elimina del grid |
| Limpiar todo | Click en "Limpiar todo" | Todas las imágenes se eliminan |
| Generar documento | Agregar imágenes, click "Generar" | Documento se genera, aparece resultado |
| Descargar | Click en "Descargar documento" | Archivo .docx se descarga |
| Nuevo documento | Click en "Nuevo documento" | UI se resetea |
| Archivo inválido | Arrastrar archivo .txt | Mensaje de error |
| Archivo grande | Arrastrar imagen > 10MB | Mensaje de error |

### Verificar consola del navegador

Abrir DevTools (F12) y verificar:
- [ ] Sin errores JavaScript en consola
- [ ] Requests a /api/* exitosos (tab Network)
- [ ] Imágenes cargan correctamente

---

## Próximos Pasos

Una vez completada esta fase, continúa con:

**[Fase 3: Opciones Avanzadas](./03-fase-3-opciones-avanzadas.md)**

---

*Fase 2: Frontend Funcional - Print Shop Generator*
