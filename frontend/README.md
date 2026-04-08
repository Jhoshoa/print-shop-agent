# Print Shop Generator - Frontend

Interfaz web moderna para generar documentos Word a partir de imágenes. Construida con JavaScript vanilla (ES6 Modules) y TailwindCSS.

## Tecnologías

- **JavaScript ES6** - Módulos nativos del navegador
- **TailwindCSS** - Framework CSS utility-first (CDN)
- **HTML5** - Drag & Drop API, File API, Clipboard API

## Características

- Drag & drop de imágenes
- Pegar imágenes desde portapapeles (Ctrl+V)
- Reordenar imágenes arrastrándolas
- Vista previa del layout en tiempo real
- Panel de opciones avanzadas
- Historial de documentos generados
- Persistencia de configuración en localStorage
- Diseño responsive
- Accesibilidad (ARIA, navegación por teclado)

## Estructura del Proyecto

```
frontend/
├── index.html              # Página principal
├── css/
│   └── styles.css          # Estilos personalizados
├── js/
│   ├── app.js              # Módulo principal
│   ├── components/
│   │   ├── dropzone.js         # Zona de drag & drop
│   │   ├── imageGrid.js        # Grid básico de imágenes
│   │   ├── sortableImageGrid.js # Grid con reordenamiento
│   │   ├── notifications.js    # Sistema de notificaciones
│   │   ├── optionsPanel.js     # Panel de opciones
│   │   ├── historyPanel.js     # Panel de historial
│   │   └── layoutPreview.js    # Vista previa del layout
│   ├── services/
│   │   ├── api.js              # Cliente API
│   │   └── storage.js          # Servicio de localStorage
│   └── utils/
│       ├── constants.js        # Constantes globales
│       └── helpers.js          # Funciones de utilidad
└── README.md
```

## Ejecución

El frontend es servido por el backend de FastAPI. No requiere build ni servidor adicional.

### Iniciar la aplicación

```bash
# Desde la raíz del proyecto
cd backend
python -m uvicorn app.main:app --reload

# O usando el script
scripts\start.bat   # Windows
./scripts/start.sh  # Linux/Mac
```

Abrir en el navegador: **http://localhost:8000**

### Desarrollo sin backend

Para desarrollo del frontend sin backend, puedes usar cualquier servidor estático:

```bash
# Con Python
cd frontend
python -m http.server 3000

# Con Node.js (si tienes npx)
npx serve frontend -p 3000
```

> Nota: Sin el backend, las llamadas a la API fallarán.

## Componentes

### `app.js` - Módulo Principal
Coordina todos los componentes y maneja el estado global de la aplicación.

### `dropzone.js` - Zona de Carga
- Drag & drop de archivos
- Click para seleccionar archivos
- Pegar desde portapapeles (Ctrl+V)
- Validación de tipos y tamaños

### `sortableImageGrid.js` - Grid Reordenable
- Visualización de imágenes cargadas
- Drag & drop para reordenar
- Eliminación individual
- Navegación por teclado (flechas, Delete)

### `optionsPanel.js` - Panel de Opciones
- Tamaño de página (Carta, A4, A3, etc.)
- Orientación (Vertical/Horizontal)
- Ancho de imagen en cm
- Imágenes por fila (auto o fijo)
- Márgenes y espaciado
- Bordes opcionales
- Nombre del archivo
- Guardar/restaurar configuración

### `historyPanel.js` - Historial
- Últimos 20 documentos generados
- Información: nombre, páginas, tamaño, fecha
- Descarga directa
- Limpiar historial

### `layoutPreview.js` - Vista Previa
- Representación visual del documento
- Actualización en tiempo real
- Muestra páginas y distribución

### `notifications.js` - Notificaciones
- Tipos: success, error, warning, info
- Auto-cierre configurable
- Animaciones de entrada/salida

### `api.js` - Cliente API
- Comunicación con el backend
- Manejo de errores
- Timeout y reintentos

### `storage.js` - Almacenamiento
- Persistencia en localStorage
- Configuración del usuario
- Historial de documentos
- Preferencias de UI

## Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `O` | Abrir selector de archivos |
| `Ctrl + V` | Pegar imagen del portapapeles |
| `Ctrl + Enter` | Generar documento |
| `Escape` | Limpiar todas las imágenes |
| `Delete` | Eliminar imagen seleccionada |
| `←` `→` `↑` `↓` | Navegar entre imágenes |

## Personalización

### Colores (TailwindCSS)

Los colores principales se definen en `index.html`:

```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#eff6ff',
                    // ... hasta 900
                }
            }
        }
    }
}
```

### Variables CSS

En `css/styles.css`:

```css
:root {
    --color-primary: #3b82f6;
    --color-success: #10b981;
    --color-error: #ef4444;
    --transition-fast: 150ms ease;
    /* ... */
}
```

## localStorage Keys

| Key | Descripción |
|-----|-------------|
| `printshop_config` | Configuración del documento |
| `printshop_history` | Historial de documentos |
| `printshop_preferences` | Preferencias de UI |

## Límites

| Parámetro | Valor |
|-----------|-------|
| Máximo de imágenes | 100 |
| Tamaño máximo por imagen | 10 MB |
| Formatos soportados | JPG, PNG, WebP, GIF, BMP |
| Historial máximo | 20 documentos |

## Compatibilidad

### Navegadores Soportados
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Características Requeridas
- ES6 Modules
- CSS Grid
- Drag & Drop API
- File API
- Clipboard API
- localStorage

## Arquitectura de Componentes

```
┌─────────────────────────────────────────────────────┐
│                      app.js                         │
│                  (Coordinador)                      │
└──────────────────────┬──────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
       ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  dropzone   │ │ sortable    │ │  options    │
│             │ │ ImageGrid   │ │  Panel      │
└─────────────┘ └─────────────┘ └─────────────┘
       │               │               │
       │               │               │
       ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│notifications│ │  history    │ │  layout     │
│             │ │  Panel      │ │  Preview    │
└─────────────┘ └─────────────┘ └─────────────┘
                       │
           ┌───────────┴───────────┐
           ▼                       ▼
    ┌─────────────┐         ┌─────────────┐
    │   api.js    │         │ storage.js  │
    │  (Backend)  │         │(localStorage)│
    └─────────────┘         └─────────────┘
```

## Notas de Desarrollo

- Los módulos ES6 requieren que los archivos se sirvan desde un servidor (no file://)
- TailwindCSS se carga desde CDN para simplicidad
- No se requiere proceso de build
- Los estilos personalizados complementan a Tailwind
- El código sigue principios de accesibilidad (WCAG 2.1)
