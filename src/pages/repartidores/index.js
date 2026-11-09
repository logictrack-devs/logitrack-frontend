
import { hasRole } from '../../auth/session.js';
import { toast } from '../../ui/toast.js';
import {
    listarRepartidores,
    registrarRepartidor,
    editarRepartidor,
    cambiarEstadoRepartidor
} from './courierApi.js';

export async function renderRepartidores(container) {
    const isAdmin = hasRole('ADMIN');
    let paginaActual = 0;
    const tamanioPagina = 5;
    let repartidoresActuales = new Map();
    let idEnEdicion = null;

    container.innerHTML = `
        <style>
            .rep-tabla-scroll { overflow-x: auto; }
            .rep-tabla-scroll .data-table {
                width: 100%;
                min-width: 720px;
            }
            .rep-tabla-scroll .uuid-chip {
                white-space: normal;
                overflow-wrap: anywhere;
            }
            .rep-acciones {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
            }
            .rep-acciones .btn {
                padding: 6px 10px;
                font-size: 0.85rem;
            }
            .rep-paginacion {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 12px;
                padding: 14px 16px;
            }
            .rep-paginacion-botones {
                display: flex;
                gap: 8px;
            }
        </style>

        <div class="page-container">
            <div class="page-header">
                <div>
                    <h2>🛵 Gestión de Repartidores</h2>
                    <p class="subtitle">
                        Consulta y gestión de repartidores
                    </p>
                </div>
                ${isAdmin ? `
                    <button
                        type="button"
                        id="btn-nuevo-repartidor"
                        class="btn btn-primary">
                        + Registrar Repartidor
                    </button>
                ` : ''}
            </div>

            <div
                id="repartidores-loading"
                class="loading-state">
                Cargando lista de repartidores...
            </div>

            <div
                id="repartidores-content"
                class="table-card hidden">

                <div class="rep-tabla-scroll">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Tipo Vehículo</th>
                                <th>Estado</th>
                                <th>ID del Repartidor</th>
                                ${isAdmin ? '<th>Acciones</th>' : ''}
                            </tr>
                        </thead>
                        <tbody id="repartidores-tbody"></tbody>
                    </table>
                </div>

                <div class="rep-paginacion">
                    <span id="rep-info-pagina">
                        Página 1 de 1
                    </span>

                    <div class="rep-paginacion-botones">
                        <button
                            type="button"
                            id="rep-btn-anterior"
                            class="btn btn-secondary"
                            disabled>
                            Anterior
                        </button>

                        <button
                            type="button"
                            id="rep-btn-siguiente"
                            class="btn btn-secondary"
                            disabled>
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>

            <div
                id="repartidores-empty"
                class="empty-state hidden">
                <p>
                    No se encontraron repartidores registrados.
                </p>
            </div>
        </div>

        ${isAdmin ? `
            <div
                id="modal-repartidor"
                class="modal-overlay hidden">

                <div
                    class="modal-card"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="rep-titulo-modal">

                    <div class="modal-header">
                        <h3 id="rep-titulo-modal">
                            Registrar Nuevo Repartidor
                        </h3>

                        <button
                            type="button"
                            class="modal-close-btn"
                            id="close-modal-repartidor"
                            aria-label="Cerrar">
                            &times;
                        </button>
                    </div>

                    <form
                        id="form-repartidor"
                        class="modal-body">

                        <div class="form-group">
                            <label for="rep-nombre">
                                Nombre Completo *
                            </label>

                            <input
                                type="text"
                                id="rep-nombre"
                                required
                                placeholder="Ej: Carlos Gómez" />
                        </div>

                        <div class="form-group">
                            <label for="rep-vehiculo">
                                Tipo de Vehículo *
                            </label>

                            <select
                                id="rep-vehiculo"
                                required>
                                <option value="MOTO">
                                    Moto 🏍️
                                </option>
                                <option value="BICICLETA">
                                    Bicicleta 🚲
                                </option>
                                <option value="AUTO">
                                    Auto 🚗
                                </option>
                                <option value="CAMIONETA">
                                    Camioneta 🚚
                                </option>
                            </select>
                        </div>

                        <div class="modal-actions">
                            <button
                                type="button"
                                class="btn btn-secondary"
                                id="cancel-repartidor">
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                class="btn btn-primary"
                                id="guardar-repartidor">
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        ` : ''}
    `;

    const loadingEl = container.querySelector(
        '#repartidores-loading'
    );
    const contentEl = container.querySelector(
        '#repartidores-content'
    );
    const tbody = container.querySelector(
        '#repartidores-tbody'
    );
    const emptyEl = container.querySelector(
        '#repartidores-empty'
    );
    const infoPagina = container.querySelector(
        '#rep-info-pagina'
    );
    const btnAnterior = container.querySelector(
        '#rep-btn-anterior'
    );
    const btnSiguiente = container.querySelector(
        '#rep-btn-siguiente'
    );

    async function cargarRepartidores() {
        loadingEl.classList.remove('hidden');
        contentEl.classList.add('hidden');
        emptyEl.classList.add('hidden');

        btnAnterior.disabled = true;
        btnSiguiente.disabled = true;

        try {
            const pagina = await listarRepartidores(
                paginaActual,
                tamanioPagina
            );

            const repartidores = Array.isArray(pagina?.content)
                ? pagina.content
                : [];

            const totalPaginas =
                Number(pagina?.totalPages) || 0;

            repartidoresActuales = new Map(
                repartidores.map(r => [String(r.id), r])
            );

            loadingEl.classList.add('hidden');

            infoPagina.textContent = totalPaginas === 0
                ? 'Sin páginas disponibles'
                : `Página ${paginaActual + 1} de ${totalPaginas}`;

            btnAnterior.disabled = paginaActual === 0;
            btnSiguiente.disabled =
                paginaActual >= totalPaginas - 1;

            if (repartidores.length === 0) {
                tbody.innerHTML = '';

                emptyEl.innerHTML = `
                    <p>
                        No se encontraron repartidores registrados.
                    </p>
                `;

                emptyEl.classList.remove('hidden');
                return;
            }

            tbody.innerHTML = repartidores.map(r => {
                const activo = r.estado === 'ACTIVO';

                const proximoEstado = activo
                    ? 'INACTIVO'
                    : 'ACTIVO';

                return `
                    <tr>
                        <td>
                            <strong>
                                ${escapeHtml(r.nombre || 'Sin nombre')}
                            </strong>
                        </td>

                        <td>
                            ${escapeHtml(
                    r.tipoVehiculo || 'No especificado'
                )}
                        </td>

                        <td>
                            <span class="badge ${
                    activo
                        ? 'badge-success'
                        : 'badge-warning'
                }">
                                ${escapeHtml(
                    r.estado || 'DESCONOCIDO'
                )}
                            </span>
                        </td>

                        <td>
                            <code class="uuid-chip">
                                ${escapeHtml(r.id)}
                            </code>
                        </td>

                        ${isAdmin ? `
                            <td>
                                <div class="rep-acciones">
                                    <button
                                        type="button"
                                        class="btn btn-secondary"
                                        data-accion="editar"
                                        data-id="${escapeHtml(r.id)}">
                                        Editar
                                    </button>

                                    <button
                                        type="button"
                                        class="btn btn-secondary"
                                        data-accion="estado"
                                        data-id="${escapeHtml(r.id)}"
                                        ${
                    r.estado !== 'ACTIVO' &&
                    r.estado !== 'INACTIVO'
                        ? 'disabled'
                        : ''
                }>
                                        ${
                    proximoEstado === 'ACTIVO'
                        ? 'Activar'
                        : 'Desactivar'
                }
                                    </button>
                                </div>
                            </td>
                        ` : ''}
                    </tr>
                `;
            }).join('');

            contentEl.classList.remove('hidden');

        } catch (err) {
            loadingEl.classList.add('hidden');

            emptyEl.innerHTML = `
                <p class="error-text">
                    No se pudo cargar repartidores:
                    ${escapeHtml(err.message)}
                </p>
            `;

            emptyEl.classList.remove('hidden');
            console.error('Error cargando repartidores:', err);
        }
    }

    // PAGINACIÓN

    btnAnterior.addEventListener('click', () => {
        if (paginaActual > 0) {
            paginaActual--;
            cargarRepartidores();
        }
    });

    btnSiguiente.addEventListener('click', () => {
        if (!btnSiguiente.disabled) {
            paginaActual++;
            cargarRepartidores();
        }
    });

    // ACCIONES EXCLUSIVAS DE ADMIN

    if (isAdmin) {
        const modal = container.querySelector(
            '#modal-repartidor'
        );
        const form = container.querySelector(
            '#form-repartidor'
        );
        const inputNombre = container.querySelector(
            '#rep-nombre'
        );
        const selectVehiculo = container.querySelector(
            '#rep-vehiculo'
        );
        const tituloModal = container.querySelector(
            '#rep-titulo-modal'
        );
        const btnGuardar = container.querySelector(
            '#guardar-repartidor'
        );

        function abrirModal(repartidor = null) {
            form.reset();

            idEnEdicion = repartidor
                ? String(repartidor.id)
                : null;

            tituloModal.textContent = repartidor
                ? 'Editar Repartidor'
                : 'Registrar Nuevo Repartidor';

            btnGuardar.textContent = repartidor
                ? 'Guardar cambios'
                : 'Guardar';

            if (repartidor) {
                inputNombre.value = repartidor.nombre || '';

                selectVehiculo.value =
                    repartidor.tipoVehiculo || 'MOTO';
            }

            modal.classList.remove('hidden');
            inputNombre.focus();
        }

        function cerrarModal() {
            modal.classList.add('hidden');
            form.reset();
            idEnEdicion = null;
        }

        container.querySelector(
            '#btn-nuevo-repartidor'
        ).addEventListener('click', () => abrirModal());

        container.querySelector(
            '#close-modal-repartidor'
        ).addEventListener('click', cerrarModal);

        container.querySelector(
            '#cancel-repartidor'
        ).addEventListener('click', cerrarModal);

        // REGISTRAR O EDITAR

        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const datos = {
                nombre: inputNombre.value.trim(),
                tipoVehiculo: selectVehiculo.value
            };

            if (!datos.nombre) return;

            btnGuardar.disabled = true;

            try {
                if (idEnEdicion) {
                    await editarRepartidor(idEnEdicion, datos);

                    toast.success(
                        'Repartidor actualizado correctamente.'
                    );
                } else {
                    await registrarRepartidor(datos);

                    toast.success(
                        'Repartidor registrado exitosamente.'
                    );

                    paginaActual = 0;
                }

                cerrarModal();
                await cargarRepartidores();

            } catch (err) {
                console.error(
                    'Error guardando repartidor:',
                    err
                );
            } finally {
                btnGuardar.disabled = false;
            }
        });

        // BOTONES DE LA TABLA

        tbody.addEventListener('click', async (event) => {
            const boton = event.target.closest(
                'button[data-accion]'
            );

            if (!boton || boton.disabled) return;

            const repartidor = repartidoresActuales.get(
                boton.dataset.id
            );

            if (!repartidor) return;

            // EDITAR

            if (boton.dataset.accion === 'editar') {
                abrirModal(repartidor);
                return;
            }

            // ACTIVAR O DESACTIVAR

            if (boton.dataset.accion === 'estado') {
                const nuevoEstado =
                    repartidor.estado === 'ACTIVO'
                        ? 'INACTIVO'
                        : 'ACTIVO';

                const accion = nuevoEstado === 'ACTIVO'
                    ? 'activar'
                    : 'desactivar';

                const confirmado = window.confirm(
                    `¿Querés ${accion} a ${repartidor.nombre}?`
                );

                if (!confirmado) return;

                boton.disabled = true;

                try {
                    await cambiarEstadoRepartidor(
                        repartidor.id,
                        nuevoEstado
                    );

                    toast.success(
                        `Repartidor ${
                            nuevoEstado === 'ACTIVO'
                                ? 'activado'
                                : 'desactivado'
                        } correctamente.`
                    );

                    await cargarRepartidores();

                } catch (err) {
                    console.error(
                        'Error cambiando estado del repartidor:',
                        err
                    );
                    boton.disabled = false;
                }
            }
        });
    }

    await cargarRepartidores();
}

function escapeHtml(valor) {
    const div = document.createElement('div');
    div.textContent = String(valor ?? '');
    return div.innerHTML;
}
