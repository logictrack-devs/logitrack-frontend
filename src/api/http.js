import { getToken, logout } from '../auth/session.js';
import { toast } from '../ui/toast.js';

// URL base del API Gateway
export const API_BASE_URL = 'http://localhost:8066';

/**
 * Cliente HTTP personalizado con:
 * - Inyección automática de token Bearer en headers.
 * - Manejo centralizado de 401 (logout + redirección al login).
 * - Manejo centralizado de 403 (redirección a #/sinacceso + toast).
 * - Notificación visual automática en caso de error del backend.
 */
async function request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const headers = new Headers(options.headers || {});

    // Interceptor: agrega Bearer Token si hay sesión activa
    const token = getToken();
    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // Configura Content-Type por defecto para objetos
    let body = options.body;
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
        if (!headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }
        body = JSON.stringify(body);
    }

    const config = {
        ...options,
        headers,
        body
    };

    try {
        const response = await fetch(url, config);

        // 401 Unauthorized -> Token inválido o vencido
        if (response.status === 401) {
            logout('Tu sesión ha expirado o no estás autorizado (401).');
            throw new Error('No autorizado');
        }

        // 403 Forbidden -> Rol insuficiente
        if (response.status === 403) {
            toast.error('Acceso denegado (403): No posees permisos para esta acción.');
            window.location.hash = '#/sinacceso';
            throw new Error('Acceso denegado');
        }

        // Manejo de respuestas no OK (400, 404, 500, etc.)
        if (!response.ok) {
            let errorMsg = `Error del servidor (${response.status})`;

            try {
                const errorData = await response.json();
                // Respuestas estándar de Spring Boot o nuestro ManejadorExcepcionesGlobal
                errorMsg = errorData.mensaje || errorData.error || errorData.message || errorMsg;
            } catch {
                // Si la respuesta no era JSON
                const text = await response.text().catch(() => null);
                if (text) errorMsg = text;
            }

            toast.error(errorMsg);
            const err = new Error(errorMsg);
            err.status = response.status;
            throw err;
        }

        // Si la respuesta es 204 No Content
        if (response.status === 204) {
            return null;
        }

        // Si no hay contenido
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return await response.json();
        }

        return await response.text();

    } catch (networkError) {
        // Errores de red (CORS, backend caído, etc.)
        if (networkError.message !== 'No autorizado' && networkError.message !== 'Acceso denegado') {
            console.error('[HTTP] Error de conexión:', networkError);
            toast.error(networkError.message || 'No se pudo conectar con el servidor.');
        }
        throw networkError;
    }
}

export const http = {
    get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
    post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
    put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
    patch: (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body }),
    delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' })
};
