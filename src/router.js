import { isAuthenticated, hasRole } from './auth/session.js';
import { createLayout } from './ui/layout.js';
import { renderLogin } from './pages/login.js';
import { renderEnvios } from './pages/envios/index.js';
import { renderRepartidores } from './pages/repartidores/index.js';

/**
 * Definición de rutas del sistema con sus permisos y guardias.
 */
const routes = {
    '#/login': {
        public: true,
        render: (container) => renderLogin(container)
    },
    '#/envios': {
        auth: true,
        roles: ['ADMIN', 'REPARTIDOR', 'CLIENTE'],
        render: (container) => renderEnvios(container)
    },
    '#/repartidores': {
        auth: true,
        roles: ['ADMIN', 'REPARTIDOR'], // Clientes NO tienen acceso
        render: (container) => renderRepartidores(container)
    },
    '#/sinacceso': {
        auth: true,
        render: (container) => renderSinAcceso(container)
    }
};

/**
 * Pantalla de Acceso Denegado (403)
 */
function renderSinAcceso(container) {
    container.innerHTML = `
        <div class="forbidden-card">
            <div class="forbidden-icon">🚫</div>
            <h2>Acceso Restringido (403)</h2>
            <p>Tu rol de usuario actual no tiene los permisos necesarios para visualizar o modificar este recurso.</p>
            <div class="forbidden-actions">
                <a href="#/envios" class="btn btn-primary">Volver al panel de Envíos</a>
            </div>
        </div>
    `;
}

/**
 * Función central de navegación del router SPA.
 */
export function navigate() {
    let hash = window.location.hash || '#/login';

    // Manejo de ruta raíz o vacía
    if (hash === '' || hash === '#') {
        hash = isAuthenticated() ? '#/envios' : '#/login';
        window.location.hash = hash;
        return;
    }

    const route = routes[hash];

    // Si la ruta no existe, redirigir
    if (!route) {
        window.location.hash = isAuthenticated() ? '#/envios' : '#/login';
        return;
    }

    // Guardia 1: Si es pública (ej. login) pero ya está autenticado
    if (hash === '#/login' && isAuthenticated()) {
        window.location.hash = '#/envios';
        return;
    }

    // Guardia 2: Si requiere autenticación y NO está logueado
    if (route.auth && !isAuthenticated()) {
        window.location.hash = '#/login';
        return;
    }

    // Guardia 3: Si la ruta tiene restricción por rol
    if (route.roles && !hasRole(route.roles)) {
        window.location.hash = '#/sinacceso';
        return;
    }

    const app = document.querySelector('#app');
    if (!app) return;

    // Si la ruta es login, se renderiza sin layout
    if (hash === '#/login') {
        app.innerHTML = '';
        route.render(app);
        return;
    }

    // Rutas protegidas: se renderizan dentro del Layout
    const layout = createLayout(hash);
    app.innerHTML = layout.html;
    layout.bindEvents(app);

    const mainContainer = app.querySelector('#main-content');
    if (mainContainer) {
        route.render(mainContainer);
    }
}

/**
 * Inicializa el escucha de eventos de navegación.
 */
export function initRouter() {
    window.addEventListener('hashchange', navigate);
    window.addEventListener('session:change', navigate);
    window.addEventListener('session:logout', () => {
        window.location.hash = '#/login';
        navigate();
    });

    // Primera navegación
    navigate();
}
