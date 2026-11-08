import { http } from '../../api/http.js';
import { hasRole, getUser } from '../../auth/session.js';
import { toast } from '../../ui/toast.js';

let filtroActual = 'TODOS';
let enviosCache = [];

export function renderEnvios(container) {
    const user = getUser();
    const isAdmin = hasRole('ADMIN');
    const isRepartidor = hasRole('REPARTIDOR');
    const isCliente = hasRole('CLIENTE');

    container.innerHTML = `
        <div class="page-container">
            <!-- Encabezado de la página -->
            <div class="page-header">
                <div>
                    <h2>📦 Módulo de Envíos</h2>
                    <p class="subtitle">Gestión del ciclo de vida: PENDIENTE &rarr; EN RUTA &rarr; ENTREGADO</p>
                </div>
                <div class="page-actions">
                    <button id="btn-refrescar" class="btn btn-outline" title="Refrescar lista">
                        🔄 Actualizar
                    </button>
                    ${(isAdmin || isCliente) ? `
                        <button id="btn-nuevo-envio" class="btn btn-primary">
                            + Nuevo Envío
                        </button>
                    ` : ''}
                </div>
            </div>

            <!-- Barra de Filtros por Estado -->
            <div class="filters-bar">
                <span class="filter-label">Filtrar por estado:</span>
                <div class="filter-tabs">
                    <button class="filter-tab ${filtroActual === 'TODOS' ? 'active' : ''}" data-estado="TODOS">Todos</button>
                    <button class="filter-tab ${filtroActual === 'PENDIENTE' ? 'active' : ''}" data-estado="PENDIENTE">⏳ Pendientes</button>
                    <button class="filter-tab ${filtroActual === 'EN_RUTA' ? 'active' : ''}" data-estado="EN_RUTA">🚚 En Ruta</button>
                    <button class="filter-tab ${filtroActual === 'ENTREGADO' ? 'active' : ''}" data-estado="ENTREGADO">✅ Entregados</button>
                    <button class="filter-tab ${filtroActual === 'CANCELADO' ? 'active' : ''}" data-estado="CANCELADO">❌ Cancelados</button>
                </div>
            </div>

            <!-- Estado de Carga -->
            <div id="envios-loading" class="loading-state">
                <div class="spinner"></div>
                <p>Cargando envíos desde el servicio...</p>
            </div>

            <!-- Tabla de Envíos -->
            <div id="envios-card" class="table-card hidden">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Cliente</th>
                                <th>Dimensiones & Peso</th>
                                <th>Estado</th>
                                <th>Repartidor</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="envios-tbody"></tbody>
                    </table>
                </div>
            </div>

            <!-- Estado Vacío -->
            <div id="envios-empty" class="empty-state hidden">
                <div class="empty-icon">📭</div>
                <h3>No hay envíos para mostrar</h3>
                <p id="envios-empty-msg">No se encontraron envíos con el estado seleccionado.</p>
            </div>
        </div>

        <!-- MODAL: Nuevo Envío -->
        <div id="modal-nuevo-envio" class="modal-overlay hidden">
            <div class="modal-card">
                <div class="modal-header">
                    <h3>Nuevo Registro de Envío</h3>
                    <button class="modal-close-btn" id="close-modal-envio">&times;</button>
                </div>
                <form id="form-nuevo-envio" class="modal-body">
                    <div class="form-group">
                        <label for="env-cliente-id">UUID del Cliente *</label>
                        <input 
                            type="text" 
                            id="env-cliente-id" 
                            required 
                            placeholder="Ej: d8b2c450-4d51-40ff-9ab0-cb3e7784f18a"
                        />
                        <small class="field-hint">Identificador único del cliente solicitante</small>
                    </div>

                    <div class="form-row">
                        <div class="form-group col-half">
                            <label for="env-peso">Peso (kg) *</label>
                            <input type="number" id="env-peso" step="0.1" min="0.1" required placeholder="5.5" />
                        </div>
                        <div class="form-group col-half">
                            <label for="env-alto">Alto (cm) *</label>
                            <input type="number" id="env-alto" step="0.1" min="1" required placeholder="20.0" />
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group col-half">
                            <label for="env-ancho">Ancho (cm) *</label>
                            <input type="number" id="env-ancho" step="0.1" min="1" required placeholder="15.0" />
                        </div>
                        <div class="form-group col-half">
                            <label for="env-largo">Largo (cm) *</label>
                            <input type="number" id="env-largo" step="0.1" min="1" required placeholder="30.0" />
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" id="cancel-nuevo-envio">Cancelar</button>
                        <button type="submit" class="btn btn-primary" id="btn-submit-envio">Crear Envío</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- MODAL: Asignar Repartidor -->
        <div id="modal-asignar-repartidor" class="modal-overlay hidden">
            <div class="modal-card">
                <div class="modal-header">
                    <h3>Asignar Repartidor a Envío</h3>
                    <button class="modal-close-btn" id="close-modal-asignar">&times;</button>
                </div>
                <form id="form-asignar-repartidor" class="modal-body">
                    <input type="hidden" id="asig-envio-id" />
                    <p class="modal-info-text">
                        Envío: <strong id="asig-codigo-lbl"></strong>
                    </p>

                    <div class="form-group">
                        <label for="asig-repartidor-select">Selecciona un Repartidor Activo *</label>
                        <select id="asig-repartidor-select" required>
                            <option value="">Cargando repartidores disponibles...</option>
                        </select>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" id="cancel-asignar">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Confirmar Asignación</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- MODAL: Historial de Estados -->
        <div id="modal-historial" class="modal-overlay hidden">
            <div class="modal-card modal-lg">
                <div class="modal-header">
                    <h3>Historial de Trazabilidad del Envío</h3>
                    <button class="modal-close-btn" id="close-modal-historial">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="historial-meta" class="historial-meta"></div>
                    <div id="historial-timeline" class="timeline"></div>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" id="close-historial-btn">Cerrar</button>
                </div>
            </div>
        </div>
    `;

    // Elementos del DOM
    const loadingEl = container.querySelector('#envios-loading');
    const tableCard = container.querySelector('#envios-card');
    const tbody = container.querySelector('#envios-tbody');
    const emptyEl = container.querySelector('#envios-empty');
    const btnRefrescar = container.querySelector('#btn-refrescar');
    const filterTabs = container.querySelectorAll('.filter-tab');

    // Cargar envíos desde el backend
    async function cargarEnvios() {
        loadingEl.classList.remove('hidden');
        tableCard.classList.add('hidden');
        emptyEl.classList.add('hidden');

        try {
            let url = '/applications/apishipment/api/v1/envios';
            if (filtroActual !== 'TODOS') {
                url += `?estado=${filtroActual}`;
            }

            const data = await http.get(url);
            enviosCache = Array.isArray(data) ? data : [];

            renderTabla();

        } catch (err) {
            console.error('Error al cargar envíos:', err);
            emptyEl.classList.remove('hidden');
            emptyEl.querySelector('#envios-empty-msg').textContent = 
                `Error al consultar el servicio de envíos: ${err.message}`;
        } finally {
            loadingEl.classList.add('hidden');
        }
    }

    function renderTabla() {
        if (enviosCache.length === 0) {
            tableCard.classList.add('hidden');
            emptyEl.classList.remove('hidden');
            emptyEl.querySelector('#envios-empty-msg').textContent = 
                filtroActual === 'TODOS' 
                    ? 'Aún no hay ningún envío registrado en el sistema.' 
                    : `No hay envíos registrados con estado ${filtroActual}.`;
            return;
        }

        emptyEl.classList.add('hidden');
        tableCard.classList.remove('hidden');

        tbody.innerHTML = enviosCache.map(envio => {
            const estadoBadge = getBadgePorEstado(envio.estado);
            const clienteLabel = envio.nombreCliente 
                ? `<strong>${escapeHtml(envio.nombreCliente)}</strong>` 
                : (envio.clienteId ? `<code class="uuid-chip">${envio.clienteId.substring(0, 8)}...</code>` : '<span class="text-muted">No asignado</span>');

            const repartidorLabel = envio.repartidorId 
                ? `🛵 <code class="uuid-chip">${envio.repartidorId.substring(0, 8)}...</code>` 
                : `<span class="text-muted">Sin repartidor</span>`;

            // Botones de acción según estado y rol
            let accionesHtml = `
                <button class="btn btn-sm btn-icon btn-historial" data-id="${envio.id}" data-codigo="${envio.codigoSeguimiento}" title="Ver historial">
                    📋 Historial
                </button>
            `;

            if (envio.estado === 'PENDIENTE') {
                if (isAdmin) {
                    accionesHtml += `
                        <button class="btn btn-sm btn-outline btn-asignar" data-id="${envio.id}" data-codigo="${envio.codigoSeguimiento}" title="Asignar repartidor">
                            🛵 Asignar
                        </button>
                    `;
                }

                // Iniciar ruta si ya tiene repartidor asignado
                if (envio.repartidorId && (isAdmin || isRepartidor)) {
                    accionesHtml += `
                        <button class="btn btn-sm btn-info btn-transicionar" data-id="${envio.id}" data-estado="EN_RUTA" title="Poner en ruta">
                            🚀 A Ruta
                        </button>
                    `;
                }

                if (isAdmin || isCliente) {
                    accionesHtml += `
                        <button class="btn btn-sm btn-danger btn-cancelar" data-id="${envio.id}" data-codigo="${envio.codigoSeguimiento}" title="Cancelar envío">
                            ✕ Cancelar
                        </button>
                    `;
                }
            } else if (envio.estado === 'EN_RUTA') {
                if (isAdmin || isRepartidor) {
                    accionesHtml += `
                        <button class="btn btn-sm btn-success btn-transicionar" data-id="${envio.id}" data-estado="ENTREGADO" title="Marcar como entregado">
                            ✅ Entregado
                        </button>
                    `;
                }
            }

            return `
                <tr>
                    <td>
                        <strong class="tracking-code">${escapeHtml(envio.codigoSeguimiento)}</strong>
                    </td>
                    <td>${clienteLabel}</td>
                    <td>
                        <span class="dim-text">${envio.peso || 0} kg</span> &bull; 
                        <span class="dim-text">${envio.largo || 0}x${envio.ancho || 0} cm</span>
                    </td>
                    <td>${estadoBadge}</td>
                    <td>${repartidorLabel}</td>
                    <td class="table-actions">
                        <div class="btn-group">
                            ${accionesHtml}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Vincular eventos de los botones de la tabla
        tbody.querySelectorAll('.btn-historial').forEach(btn => {
            btn.addEventListener('click', () => abrirModalHistorial(btn.dataset.id, btn.dataset.codigo));
        });

        tbody.querySelectorAll('.btn-asignar').forEach(btn => {
            btn.addEventListener('click', () => abrirModalAsignar(btn.dataset.id, btn.dataset.codigo));
        });

        tbody.querySelectorAll('.btn-transicionar').forEach(btn => {
            btn.addEventListener('click', () => transicionarEstado(btn.dataset.id, btn.dataset.estado));
        });

        tbody.querySelectorAll('.btn-cancelar').forEach(btn => {
            btn.addEventListener('click', () => cancelarEnvio(btn.dataset.id, btn.dataset.codigo));
        });
    }

    // Filtros por estado
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            filtroActual = tab.dataset.estado;
            cargarEnvios();
        });
    });

    btnRefrescar?.addEventListener('click', () => cargarEnvios());

    // Transición de estado (PATCH /api/v1/envios/{id}/estado)
    async function transicionarEstado(envioId, nuevoEstado) {
        const confirmMsg = nuevoEstado === 'EN_RUTA' 
            ? '¿Deseas poner este envío EN RUTA hacia su destino?' 
            : '¿Confirmas que el paquete ha sido ENTREGADO al destinatario?';

        if (!confirm(confirmMsg)) return;

        try {
            await http.patch(`/applications/apishipment/api/v1/envios/${envioId}/estado`, {
                nuevoEstado: nuevoEstado,
                observacion: `Cambio de estado realizado por ${user.username} a ${nuevoEstado}`
            });

            toast.success(`Envío actualizado al estado: ${nuevoEstado}`);
            cargarEnvios();
        } catch (err) {
            console.error('Error cambiando estado:', err);
        }
    }

    // Cancelar envío
    async function cancelarEnvio(envioId, codigoSeguimiento) {
        if (!confirm(`¿Estás seguro de cancelar el envío ${codigoSeguimiento}? Esta acción no se puede deshacer.`)) {
            return;
        }

        try {
            await http.patch(`/applications/apishipment/api/v1/envios/${envioId}/estado`, {
                nuevoEstado: 'CANCELADO',
                observacion: `Cancelado por el usuario ${user.username}`
            });

            toast.success(`El envío ${codigoSeguimiento} ha sido cancelado.`);
            cargarEnvios();
        } catch (err) {
            console.error('Error cancelando envío:', err);
        }
    }

    // Modal Asignar Repartidor
    const modalAsignar = container.querySelector('#modal-asignar-repartidor');
    const formAsignar = container.querySelector('#form-asignar-repartidor');
    const selectRepartidores = container.querySelector('#asig-repartidor-select');
    const lblAsigCodigo = container.querySelector('#asig-codigo-lbl');
    const inputAsigEnvioId = container.querySelector('#asig-envio-id');

    async function abrirModalAsignar(envioId, codigo) {
        inputAsigEnvioId.value = envioId;
        lblAsigCodigo.textContent = codigo;
        selectRepartidores.innerHTML = '<option value="">Cargando repartidores disponibles...</option>';
        modalAsignar.classList.remove('hidden');

        try {
            const repartidores = await http.get('/applications/apicourier/api/v1/repartidores/disponibles');
            if (!Array.isArray(repartidores) || repartidores.length === 0) {
                selectRepartidores.innerHTML = '<option value="">No hay repartidores disponibles en este momento</option>';
                return;
            }

            selectRepartidores.innerHTML = `
                <option value="">-- Selecciona un repartidor --</option>
                ${repartidores.map(r => `
                    <option value="${r.id}">${escapeHtml(r.nombre)} (${r.tipoVehiculo || 'Vehículo'}) - ACTIVO</option>
                `).join('')}
            `;
        } catch (err) {
            selectRepartidores.innerHTML = `<option value="">Error cargando repartidores</option>`;
        }
    }

    formAsignar?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const envioId = inputAsigEnvioId.value;
        const repartidorId = selectRepartidores.value;

        if (!repartidorId) {
            toast.warning('Por favor selecciona un repartidor.');
            return;
        }

        try {
            await http.patch(`/applications/apishipment/api/v1/envios/${envioId}/asignar-repartidor/${repartidorId}`);
            toast.success('Repartidor asignado con éxito al envío.');
            modalAsignar.classList.add('hidden');
            cargarEnvios();
        } catch (err) {
            console.error('Error asignando repartidor:', err);
        }
    });

    container.querySelector('#close-modal-asignar')?.addEventListener('click', () => modalAsignar.classList.add('hidden'));
    container.querySelector('#cancel-asignar')?.addEventListener('click', () => modalAsignar.classList.add('hidden'));

    // Modal Historial
    const modalHistorial = container.querySelector('#modal-historial');
    const timelineEl = container.querySelector('#historial-timeline');
    const metaEl = container.querySelector('#historial-meta');

    async function abrirModalHistorial(envioId, codigo) {
        modalHistorial.classList.remove('hidden');
        metaEl.innerHTML = `<p>Envío: <strong>${escapeHtml(codigo)}</strong></p>`;
        timelineEl.innerHTML = '<p class="loading-text">Consultando historial de estados...</p>';

        try {
            const historial = await http.get(`/applications/apishipment/api/v1/envios/${envioId}/historial`);

            if (!Array.isArray(historial) || historial.length === 0) {
                timelineEl.innerHTML = '<p class="text-muted">Aún no hay cambios de estado registrados para este envío.</p>';
                return;
            }

            timelineEl.innerHTML = historial.map((item, idx) => `
                <div class="timeline-item">
                    <div class="timeline-badge">${idx + 1}</div>
                    <div class="timeline-content">
                        <div class="timeline-header">
                            <span class="timeline-transition">
                                ${item.estadoAnterior ? `<span class="badge badge-sm">${item.estadoAnterior}</span> &rarr;` : ''} 
                                <strong class="badge badge-sm ${getBadgeClass(item.estadoNuevo)}">${item.estadoNuevo}</strong>
                            </span>
                            <span class="timeline-date">${item.fechaCambio ? new Date(item.fechaCambio).toLocaleString() : 'Fecha desconocida'}</span>
                        </div>
                        ${item.observacion ? `<p class="timeline-obs">${escapeHtml(item.observacion)}</p>` : ''}
                    </div>
                </div>
            `).join('');

        } catch (err) {
            timelineEl.innerHTML = `<p class="error-text">No se pudo cargar el historial: ${escapeHtml(err.message)}</p>`;
        }
    }

    container.querySelector('#close-modal-historial')?.addEventListener('click', () => modalHistorial.classList.add('hidden'));
    container.querySelector('#close-historial-btn')?.addEventListener('click', () => modalHistorial.classList.add('hidden'));

    // Modal Nuevo Envío
    const modalNuevoEnvio = container.querySelector('#modal-nuevo-envio');
    const btnNuevoEnvio = container.querySelector('#btn-nuevo-envio');
    const formNuevoEnvio = container.querySelector('#form-nuevo-envio');

    btnNuevoEnvio?.addEventListener('click', () => {
        formNuevoEnvio.reset();
        modalNuevoEnvio.classList.remove('hidden');
    });

    container.querySelector('#close-modal-envio')?.addEventListener('click', () => modalNuevoEnvio.classList.add('hidden'));
    container.querySelector('#cancel-nuevo-envio')?.addEventListener('click', () => modalNuevoEnvio.classList.add('hidden'));

    formNuevoEnvio?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const clienteId = container.querySelector('#env-cliente-id').value.trim();
        const peso = parseFloat(container.querySelector('#env-peso').value);
        const alto = parseFloat(container.querySelector('#env-alto').value);
        const ancho = parseFloat(container.querySelector('#env-ancho').value);
        const largo = parseFloat(container.querySelector('#env-largo').value);

        const params = new URLSearchParams({
            clienteId,
            peso,
            alto,
            ancho,
            largo
        });

        try {
            const nuevo = await http.post(`/applications/apishipment/api/v1/envios?${params.toString()}`);
            toast.success(`Envío ${nuevo ? nuevo.codigoSeguimiento : ''} creado correctamente.`);
            modalNuevoEnvio.classList.add('hidden');
            formNuevoEnvio.reset();
            cargarEnvios();
        } catch (err) {
            console.error('Error registrando envío:', err);
        }
    });

    // Carga inicial
    cargarEnvios();
}

function getBadgePorEstado(estado) {
    const estadoStr = String(estado || 'PENDIENTE').toUpperCase();
    const map = {
        PENDIENTE: '<span class="badge badge-warning">⏳ PENDIENTE</span>',
        EN_RUTA: '<span class="badge badge-info">🚚 EN RUTA</span>',
        ENTREGADO: '<span class="badge badge-success">✅ ENTREGADO</span>',
        CANCELADO: '<span class="badge badge-danger">❌ CANCELADO</span>'
    };
    return map[estadoStr] || `<span class="badge badge-default">${escapeHtml(estadoStr)}</span>`;
}

function getBadgeClass(estado) {
    const estadoStr = String(estado || '').toUpperCase();
    const map = {
        PENDIENTE: 'badge-warning',
        EN_RUTA: 'badge-info',
        ENTREGADO: 'badge-success',
        CANCELADO: 'badge-danger'
    };
    return map[estadoStr] || 'badge-default';
}

function escapeHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}
