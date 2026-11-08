
const COURIER_URL =
    'http://localhost:8066/applications/apicourier/api/v1/repartidores';

// Función reutilizable para comunicarnos con Courier.
async function peticionCourier(ruta, token, opciones = {}) {
    if (!token) {
        throw new Error('No hay una sesión iniciada.');
    }

    const respuesta = await fetch(`${COURIER_URL}${ruta}`, {
        ...opciones,
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            ...(opciones.body ? { 'Content-Type': 'application/json' } : {})
        }
    });

    // Leemos la respuesta del backend.
    const resultado = await respuesta.json().catch(() => null);

    if (respuesta.status === 401) {
        throw new Error('La sesión venció. Iniciá sesión nuevamente.');
    }

    if (respuesta.status === 403) {
        throw new Error('No tenés permisos para realizar esta operación.');
    }

    if (!respuesta.ok) {
        throw new Error(
            resultado?.mensaje ||
            resultado?.message ||
            `Error de Courier: ${respuesta.status}`
        );
    }

    return resultado;
}

// GET: listar repartidores con paginación.
export function listarRepartidores(token, pagina = 0, tamanio = 5) {
    const parametros = new URLSearchParams({
        page: String(pagina),
        size: String(tamanio)
    });

    return peticionCourier(`/paginado?${parametros}`, token);
}

// GET: consultar repartidores disponibles.
export function listarDisponibles(token) {
    return peticionCourier('/disponibles', token);
}

// POST: registrar un nuevo repartidor.
export function registrarRepartidor(token, datos) {
    return peticionCourier('', token, {
        method: 'POST',
        body: JSON.stringify(datos)
    });
}

// PUT: modificar nombre y vehículo.
export function editarRepartidor(token, id, datos) {
    return peticionCourier(`/${encodeURIComponent(id)}`, token, {
        method: 'PUT',
        body: JSON.stringify(datos)
    });
}

// PATCH: cambiar estado del repartidor.
export function cambiarEstadoRepartidor(token, id, estado) {
    return peticionCourier(
        `/${encodeURIComponent(id)}/estado?estado=${encodeURIComponent(estado)}`,
        token,
        { method: 'PATCH' }
    );
}
