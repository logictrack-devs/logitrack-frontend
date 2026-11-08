import { jwtDecode } from 'jwt-decode';
import { toast } from '../ui/toast.js';

const TOKEN_KEY = 'logitrack_jwt_token';
let logoutTimer = null;

/**
 * Guarda el token JWT y programa el cierre automático al vencer.
 */
export function setToken(token) {
    if (!token) return;
    localStorage.setItem(TOKEN_KEY, token);
    setupAutoLogout(token);
    window.dispatchEvent(new CustomEvent('session:change', { detail: { token } }));
}

/**
 * Obtiene el token actual. Si ya venció, cierra la sesión automáticamente.
 */
export function getToken() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    if (isTokenExpired(token)) {
        logout('Tu sesión ha expirado. Inicia sesión nuevamente.');
        return null;
    }

    return token;
}

/**
 * Decodifica el payload del JWT.
 */
export function getPayload() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    try {
        return jwtDecode(token);
    } catch (err) {
        console.error('Error al decodificar token JWT:', err);
        return null;
    }
}

/**
 * Obtiene el usuario autenticado actual con sus roles normalizados.
 */
export function getUser() {
    const payload = getPayload();
    if (!payload) return null;

    // Normalizar lista de roles (removiendo el prefijo ROLE_ si viene)
    let rawRoles = payload.roles || payload.role || payload.authorities || [];
    if (!Array.isArray(rawRoles)) {
        rawRoles = [rawRoles];
    }

    const roles = rawRoles.map(r => {
        const str = String(r);
        return str.startsWith('ROLE_') ? str.substring(5).toUpperCase() : str.toUpperCase();
    });

    return {
        username: payload.sub || payload.username || 'Usuario',
        roles: roles,
        exp: payload.exp
    };
}

/**
 * Valida si el usuario tiene alguno de los roles requeridos.
 */
export function hasRole(requiredRoles) {
    const user = getUser();
    if (!user) return false;

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const list = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const normalized = list.map(r => String(r).toUpperCase());

    return user.roles.some(role => normalized.includes(role));
}

/**
 * Retorna true si hay un usuario logueado con token vigente.
 */
export function isAuthenticated() {
    const token = localStorage.getItem(TOKEN_KEY);
    return Boolean(token && !isTokenExpired(token));
}

/**
 * Valida si el token ha superado su fecha de expiración.
 */
export function isTokenExpired(token) {
    try {
        const decoded = jwtDecode(token);
        if (!decoded.exp) return false;
        // Margen de 5 segundos
        return Date.now() >= (decoded.exp * 1000) - 5000;
    } catch {
        return true;
    }
}

/**
 * Programa el cierre de sesión exacto cuando venza el token.
 */
function setupAutoLogout(token) {
    if (logoutTimer) {
        clearTimeout(logoutTimer);
        logoutTimer = null;
    }

    try {
        const decoded = jwtDecode(token);
        if (!decoded.exp) return;

        const msRestantes = (decoded.exp * 1000) - Date.now();

        if (msRestantes <= 0) {
            logout('Tu sesión ha expirado.');
            return;
        }

        logoutTimer = setTimeout(() => {
            logout('Tu sesión ha expirado por límite de tiempo. Inicia sesión nuevamente.');
        }, msRestantes);

        console.info(`[Session] Sesión válida. Expira en ${Math.round(msRestantes / 1000)} segundos.`);
    } catch (err) {
        console.error('[Session] Error calculando vencimiento:', err);
    }
}

/**
 * Cierra la sesión activa, borra el token y redirige a #/login.
 */
export function logout(mensaje) {
    if (logoutTimer) {
        clearTimeout(logoutTimer);
        logoutTimer = null;
    }

    localStorage.removeItem(TOKEN_KEY);

    if (mensaje) {
        toast.warning(mensaje);
    }

    window.dispatchEvent(new CustomEvent('session:logout'));

    // Redirige al login si no estamos ya allí
    if (window.location.hash !== '#/login') {
        window.location.hash = '#/login';
    }
}

/**
 * Inicializa la sesión al arrancar la app.
 */
export function initSession() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        if (isTokenExpired(token)) {
            logout('Tu sesión previa ha expirado.');
        } else {
            setupAutoLogout(token);
        }
    }
}
