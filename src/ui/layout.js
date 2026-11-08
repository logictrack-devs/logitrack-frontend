import { getUser, logout, hasRole } from '../auth/session.js';

/**
 * Renderiza el cascarón de la aplicación (Navbar superior, Contenedor principal, Notificaciones)
 * con navegación adaptativa según los roles del usuario logueado.
 */
export function createLayout(activeRoute) {
    const user = getUser();
    const isAdmin = hasRole('ADMIN');
    const isRepartidor = hasRole('REPARTIDOR');

    // Menú de navegación según permisos de rol
    const navLinks = [
        {
            hash: '#/envios',
            label: '📦 Envíos',
            visible: true // Visible para todos los usuarios autenticados
        },
        {
            hash: '#/repartidores',
            label: '🛵 Repartidores',
            visible: isAdmin || isRepartidor // Clientes no ven menú de repartidores
        }
    ];

    const roleBadgeClass = {
        ADMIN: 'badge-admin',
        REPARTIDOR: 'badge-courier',
        CLIENTE: 'badge-client'
    }[user?.roles?.[0]] || 'badge-default';

    const layoutHtml = `
        <header class="app-navbar">
            <div class="nav-brand">
                <span class="nav-logo">🚚</span>
                <span class="nav-title">LogiTrack</span>
            </div>

            <nav class="nav-menu">
                ${navLinks
                    .filter(link => link.visible)
                    .map(link => `
                        <a href="${link.hash}" class="nav-link ${activeRoute === link.hash ? 'active' : ''}">
                            ${link.label}
                        </a>
                    `).join('')}
            </nav>

            <div class="nav-user-area">
                <div class="user-chip">
                    <span class="user-name">👤 ${user ? user.username : 'Usuario'}</span>
                    <span class="badge ${roleBadgeClass}">${user?.roles?.[0] || 'SIN ROL'}</span>
                </div>
                <button id="logout-btn" class="btn btn-outline btn-sm" title="Cerrar Sesión">
                    Salir 🚪
                </button>
            </div>
        </header>

        <main id="main-content" class="app-main"></main>

        <footer class="app-footer">
            <p>LogiTrack Devs &bull; Sistema de Gestión Logística &bull; UNJU 2026</p>
        </footer>
    `;

    return {
        html: layoutHtml,
        bindEvents: (root) => {
            const logoutBtn = root.querySelector('#logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    logout('Has cerrado sesión correctamente.');
                });
            }
        }
    };
}
