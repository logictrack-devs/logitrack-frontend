
import { http } from '../../api/http.js';

// Ruta de repartidores a través de API Gateway.
const REPARTIDORES_URL =
    '/applications/apicourier/api/v1/repartidores';

// GET: listar repartidores con paginación.
export function listarRepartidores(pagina = 0, tamanio = 5) {
    const parametros = new URLSearchParams({
        page: String(pagina),
        size: String(tamanio)
    });

    return http.get(`${REPARTIDORES_URL}/paginado?${parametros}`);
}

// GET: obtener repartidores disponibles.
export function listarDisponibles() {
    return http.get(`${REPARTIDORES_URL}/disponibles`);
}

// POST: registrar un repartidor.
export function registrarRepartidor(datos) {
    return http.post(REPARTIDORES_URL, datos);
}

// PUT: editar un repartidor existente.
export function editarRepartidor(id, datos) {
    return http.put(
        `${REPARTIDORES_URL}/${encodeURIComponent(id)}`,
        datos
    );
}

// PATCH: activar o desactivar un repartidor.
export function cambiarEstadoRepartidor(id, estado) {
    return http.patch(
        `${REPARTIDORES_URL}/${encodeURIComponent(id)}/estado?estado=${encodeURIComponent(estado)}`,
        null
    );
}
