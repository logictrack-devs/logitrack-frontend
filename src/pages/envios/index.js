import { http } from '../../api/http.js';
import { hasRole, getUser } from '../../auth/session.js';
import { toast } from '../../ui/toast.js';

let filtroActual = 'TODOS';
let enviosCache = [];

/**
 * Módulo de Gestión de Envíos (Sprint 4 - FE-5)
 * Implementa las 6 pantallas / flujos requeridos:
 * 1. Listado de envíos con filtros y tarifa
 * 2. Registrar nuevo envío (JSON en Body con origen y destino)
 * 3. Detalle completo de envío e historial de trazabilidad
 * 4. Asignar repartidor disponible (Solo ADMIN)
 * 5. Cambiar estado (PENDIENTE -> EN_RUTA -> ENTREGADO)
 * 6. Cancelar envío (POST /{id}/cancelar con manejo de 409)
 */
export function renderEnvios(container) {
    const user = getUser() || { username: 'Usuario', roles: [] };
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

            <!-- Pantalla 1: Filtro por Estado -->
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

            <!-- Pantalla 1: Tabla de Envíos -->
            <div id="envios-card" class="table-card hidden">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Estado</th>
                                <th>Cliente / Destino</th>
                                <th>Tarifa</th>
                                <th>Dimensiones & Peso</th>
                                <th>Repartidor</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="envios-tbody"></tbody>
                    </table>
                </div>
            </div>

            <!-- Pantalla 1: Estado Vacío -->
            <div id="envios-empty" class="empty-state hidden">
                <div class="empty-icon">📭</div>
                <h3>No hay envíos para mostrar</h3>
                <p id="envios-empty-msg">No se encontraron envíos con el estado seleccionado.</p>
            </div>
        </div>

        <!-- ============================================================
             PANTALLA 2: Modal Registrar Envío (JSON Body)
             ============================================================ -->
        <div id="modal-nuevo-envio" class="modal-overlay hidden">
            <div class="modal-card modal-xl">
                <div class="modal-header">
                    <h3>📦 Registrar Nuevo Envío</h3>
                    <button class="modal-close-btn" id="close-modal-envio">&times;</button>
                </div>
                <form id="form-nuevo-envio" class="modal-body">
                    <!-- Cliente solicitante -->
                    <div class="form-group">
                        <label for="env-cliente-id">Identificador del Cliente (UUID) *</label>
                        <input 
                            type="text" 
                            id="env-cliente-id" 
                            required 
                            placeholder="Ej: d8b2c450-4d51-40ff-9ab0-cb3e7784f18a"
                            ${!isAdmin ? 'placeholder="Se vinculará a tu cuenta de cliente"' : ''}
                        />
                        <small class="field-hint">UUID del cliente registrado en el sistema</small>
                    </div>

                    <!-- Dimensiones y Peso en 4 columnas -->
                    <div class="form-section-title">📐 Dimensiones del Paquete</div>
                    <div class="form-row-4">
                        <div class="form-group">
                            <label for="env-peso">Peso (kg) *</label>
                            <input type="number" id="env-peso" step="0.1" min="0.1" required placeholder="5.0" />
                        </div>
                        <div class="form-group">
                            <label for="env-largo">Largo (cm) *</label>
                            <input type="number" id="env-largo" step="0.1" min="1" required placeholder="30.0" />
                        </div>
                        <div class="form-group">
                            <label for="env-ancho">Ancho (cm) *</label>
                            <input type="number" id="env-ancho" step="0.1" min="1" required placeholder="15.0" />
                        </div>
                        <div class="form-group">
                            <label for="env-alto">Alto (cm) *</label>
                            <input type="number" id="env-alto" step="0.1" min="1" required placeholder="20.0" />
                        </div>
                    </div>

                    <!-- 2 Columnas paralelas: Origen y Destino -->
                    <div class="form-grid-2col">
                        <!-- Columna Izquierda: Origen -->
                        <div class="form-col-box">
                            <div class="form-section-title" style="margin-top:0;">📍 Dirección de Origen</div>
                            <div class="form-row">
                                <div class="form-group" style="flex: 2;">
                                    <label for="orig-calle">Calle *</label>
                                    <input type="text" id="orig-calle" required placeholder="Ej: Av. Belgrano" />
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label for="orig-numero">Número *</label>
                                    <input type="text" id="orig-numero" required placeholder="450" />
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group col-half">
                                    <label for="orig-ciudad">Ciudad *</label>
                                    <input type="text" id="orig-ciudad" required placeholder="San Salvador de Jujuy" />
                                </div>
                                <div class="form-group col-half">
                                    <label for="orig-cp">Código Postal *</label>
                                    <input type="text" id="orig-cp" required placeholder="4600" />
                                </div>
                            </div>
                        </div>

                        <!-- Columna Derecha: Destino -->
                        <div class="form-col-box">
                            <div class="form-section-title" style="margin-top:0;">🏁 Dirección de Destino</div>
                            <div class="form-row">
                                <div class="form-group" style="flex: 2;">
                                    <label for="dest-calle">Calle *</label>
                                    <input type="text" id="dest-calle" required placeholder="Ej: Necochea" />
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label for="dest-numero">Número *</label>
                                    <input type="text" id="dest-numero" required placeholder="1025" />
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group col-half">
                                    <label for="dest-ciudad">Ciudad *</label>
                                    <input type="text" id="dest-ciudad" required placeholder="San Salvador de Jujuy" />
                                </div>
                                <div class="form-group col-half">
                                    <label for="dest-cp">Código Postal *</label>
                                    <input type="text" id="dest-cp" required placeholder="4600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" id="cancel-nuevo-envio">Cancelar</button>
                        <button type="submit" class="btn btn-primary" id="btn-submit-envio">Guardar Envío</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- ============================================================
             PANTALLA 3: Modal Detalle del Envío con Historial
             ============================================================ -->
        <div id="modal-detalle-envio" class="modal-overlay hidden">
            <div class="modal-card modal-lg">
                <div class="modal-header">
                    <h3 id="det-titulo">🔍 Detalle del Envío</h3>
                    <button class="modal-close-btn" id="close-modal-detalle">&times;</button>
                </div>
                <div class="modal-body" id="det-contenido">
                    <div class="loading-state">
                        <div class="spinner"></div>
                        <p>Cargando información del envío...</p>
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" id="close-detalle-btn">Cerrar</button>
                </div>
            </div>
        </div>

        <!-- ============================================================
             PANTALLA 4: Modal Asignar Repartidor (Solo ADMIN)
             ============================================================ -->
        <div id="modal-asignar-repartidor" class="modal-overlay hidden">
            <div class="modal-card">
                <div class="modal-header">
                    <h3>🛵 Asignar Repartidor a Envío</h3>
                    <button class="modal-close-btn" id="close-modal-asignar">&times;</button>
                </div>
                <form id="form-asignar-repartidor" class="modal-body">
                    <input type="hidden" id="asig-envio-id" />
                    <p class="modal-info-text">
                        Envío: <strong id="asig-codigo-lbl"></strong>
                    </p>

                    <div class="form-group">
                        <label for="asig-repartidor-select">Selecciona un Repartidor Disponible (Courier Service) *</label>
                        <select id="asig-repartidor-select" required>
                            <option value="">Cargando repartidores disponibles...</option>
                        </select>
                        <small class="field-hint">Solo se listan repartidores en estado ACTIVO y disponibles</small>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" id="cancel-asignar">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Confirmar Asignación</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Referencias a elementos principales
    const loadingEl = container.querySelector('#envios-loading');
    const tableCard = container.querySelector('#envios-card');
    const tbody = container.querySelector('#envios-tbody');
    const emptyEl = container.querySelector('#envios-empty');
    const btnRefrescar = container.querySelector('#btn-refrescar');
    const filterTabs = container.querySelectorAll('.filter-tab');

    // ============================================================
    // PANTALLA 1: Carga y renderizado del Listado de Envíos
    // ============================================================
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
            const tarifaFormatted = formatearMoneda(calcularTarifa(envio));

            // Destino o Cliente
            let destinoInfo = '';
            if (envio.destino && envio.destino.ciudad) {
                destinoInfo = `<br><span class="dim-text">📍 ${escapeHtml(envio.destino.ciudad)}</span>`;
            }
            const clienteLabel = envio.nombreCliente 
                ? `<strong>${escapeHtml(envio.nombreCliente)}</strong>${destinoInfo}` 
                : (envio.clienteId ? `<code class="uuid-chip">${envio.clienteId.substring(0, 8)}...</code>${destinoInfo}` : '<span class="text-muted">No asignado</span>');

            const repartidorLabel = envio.repartidorId 
                ? `🛵 <code class="uuid-chip">${envio.repartidorId.substring(0, 8)}...</code>` 
                : `<span class="text-muted">Sin asignar</span>`;

            // Acciones según estado y roles
            let accionesHtml = `
                <button class="btn btn-sm btn-outline btn-detalle" data-id="${envio.id}" title="Ver detalle completo e historial">
                    🔍 Detalle
                </button>
            `;

            // Pantalla 4: Asignar repartidor (Solo ADMIN y estado PENDIENTE)
            if (envio.estado === 'PENDIENTE' && isAdmin) {
                accionesHtml += `
                    <button class="btn btn-sm btn-outline btn-asignar" data-id="${envio.id}" data-codigo="${escapeHtml(envio.codigoSeguimiento)}" title="Asignar repartidor">
                        🛵 Asignar
                    </button>
                `;
            }

            // Pantalla 5: Transiciones de Estado (PENDIENTE -> EN_RUTA -> ENTREGADO)
            if (envio.estado === 'PENDIENTE' && envio.repartidorId && (isAdmin || isRepartidor)) {
                accionesHtml += `
                    <button class="btn btn-sm btn-info btn-transicionar" data-id="${envio.id}" data-estado="EN_RUTA" title="Poner en ruta">
                        🚀 A Ruta
                    </button>
                `;
            } else if (envio.estado === 'EN_RUTA' && (isAdmin || isRepartidor)) {
                accionesHtml += `
                    <button class="btn btn-sm btn-success btn-transicionar" data-id="${envio.id}" data-estado="ENTREGADO" title="Marcar como entregado">
                        ✅ Entregar
                    </button>
                `;
            }

            // Pantalla 6: Cancelar Envío (Solo PENDIENTE, ADMIN o CLIENTE dueño)
            if (envio.estado === 'PENDIENTE' && (isAdmin || isCliente)) {
                accionesHtml += `
                    <button class="btn btn-sm btn-danger btn-cancelar" data-id="${envio.id}" data-codigo="${escapeHtml(envio.codigoSeguimiento)}" title="Cancelar envío">
                        ✕ Cancelar
                    </button>
                `;
            }

            return `
                <tr>
                    <td>
                        <strong class="tracking-code">${escapeHtml(envio.codigoSeguimiento)}</strong>
                    </td>
                    <td>${estadoBadge}</td>
                    <td>${clienteLabel}</td>
                    <td><strong class="table-tariff">${tarifaFormatted}</strong></td>
                    <td>
                        <span class="dim-text">${envio.peso || 0} kg</span> &bull; 
                        <span class="dim-text">${envio.largo || 0}x${envio.ancho || 0}x${envio.alto || 0} cm</span>
                    </td>
                    <td>${repartidorLabel}</td>
                    <td class="table-actions">
                        <div class="btn-group">
                            ${accionesHtml}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Vincular eventos de la tabla
        tbody.querySelectorAll('.btn-detalle').forEach(btn => {
            btn.addEventListener('click', () => abrirModalDetalle(btn.dataset.id));
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

    // ============================================================
    // PANTALLA 2: Registrar Envío (POST con Body JSON)
    // ============================================================
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

        // Origen
        const origen = {
            calle: container.querySelector('#orig-calle').value.trim(),
            numero: container.querySelector('#orig-numero').value.trim(),
            ciudad: container.querySelector('#orig-ciudad').value.trim(),
            codigoPostal: container.querySelector('#orig-cp').value.trim()
        };

        // Destino
        const destino = {
            calle: container.querySelector('#dest-calle').value.trim(),
            numero: container.querySelector('#dest-numero').value.trim(),
            ciudad: container.querySelector('#dest-ciudad').value.trim(),
            codigoPostal: container.querySelector('#dest-cp').value.trim()
        };

        // Construcción del JSON Body según EnvioCreateRequestDto
        const payload = {
            clienteId: clienteId,
            peso: peso,
            largo: largo,
            ancho: ancho,
            alto: alto,
            origen: origen,
            destino: destino
        };

        try {
            const btnSubmit = formNuevoEnvio.querySelector('button[type="submit"]');
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Registrando...';

            // POST con JSON en el Body a través del Gateway
            const nuevo = await http.post('/applications/apishipment/api/v1/envios', payload);
            
            toast.success(`Envío ${nuevo && nuevo.codigoSeguimiento ? nuevo.codigoSeguimiento : ''} registrado con éxito.`);
            modalNuevoEnvio.classList.add('hidden');
            formNuevoEnvio.reset();
            cargarEnvios();

        } catch (err) {
            console.error('Error registrando envío:', err);
            // http.js ya muestra toast de error con el mensaje de validación del backend
        } finally {
            const btnSubmit = formNuevoEnvio.querySelector('button[type="submit"]');
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'Guardar Envío';
            }
        }
    });

    // ============================================================
    // PANTALLA 3: Detalle del Envío e Historial de Trazabilidad
    // ============================================================
    const modalDetalle = container.querySelector('#modal-detalle-envio');
    const detTitulo = container.querySelector('#det-titulo');
    const detContenido = container.querySelector('#det-contenido');

    async function abrirModalDetalle(envioId) {
        modalDetalle.classList.remove('hidden');
        detContenido.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Cargando información del envío...</p>
            </div>
        `;

        try {
            // Consulta de detalle e historial en paralelo
            const [envio, historial] = await Promise.all([
                http.get(`/applications/apishipment/api/v1/envios/${envioId}`),
                http.get(`/applications/apishipment/api/v1/envios/${envioId}/historial`).catch(() => [])
            ]);

            detTitulo.textContent = `🔍 Detalle del Envío ${envio.codigoSeguimiento || ''}`;

            const tarifa = formatearMoneda(calcularTarifa(envio));
            const estadoBadge = getBadgePorEstado(envio.estado);
            const origenStr = formatearDireccion(envio.origen);
            const destinoStr = formatearDireccion(envio.destino);

            // Generar timeline de historial
            let timelineHtml = '<p class="text-muted">Aún no hay cambios de estado registrados para este envío.</p>';
            if (Array.isArray(historial) && historial.length > 0) {
                timelineHtml = `
                    <div class="timeline">
                        ${historial.map((item, idx) => `
                            <div class="timeline-item">
                                <div class="timeline-badge">${idx + 1}</div>
                                <div class="timeline-content">
                                    <div class="timeline-header">
                                        <span class="timeline-transition">
                                            ${item.estadoAnterior ? `<span class="badge badge-sm">${escapeHtml(item.estadoAnterior)}</span> &rarr;` : ''} 
                                            <strong class="badge badge-sm ${getBadgeClass(item.estadoNuevo)}">${escapeHtml(item.estadoNuevo)}</strong>
                                        </span>
                                        <span class="timeline-date">${item.fechaCambio ? new Date(item.fechaCambio).toLocaleString() : 'Fecha no registrada'}</span>
                                    </div>
                                    ${item.observacion ? `<p class="timeline-obs">${escapeHtml(item.observacion)}</p>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            detContenido.innerHTML = `
                <div class="detail-grid">
                    <!-- Caja 1: Información General -->
                    <div class="detail-card-box">
                        <h4>📦 Datos del Envío</h4>
                        <div class="detail-row">
                            <span class="detail-label">Código:</span>
                            <span class="detail-value"><code>${escapeHtml(envio.codigoSeguimiento)}</code></span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Estado actual:</span>
                            <span class="detail-value">${estadoBadge}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Tarifa calculada:</span>
                            <span class="detail-value"><span class="tarifa-badge">${tarifa}</span></span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Dimensiones:</span>
                            <span class="detail-value">${envio.largo || 0} x ${envio.ancho || 0} x ${envio.alto || 0} cm</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Peso:</span>
                            <span class="detail-value">${envio.peso || 0} kg</span>
                        </div>
                    </div>

                    <!-- Caja 2: Participantes -->
                    <div class="detail-card-box">
                        <h4>👤 Cliente y Repartidor</h4>
                        <div class="detail-row">
                            <span class="detail-label">Cliente:</span>
                            <span class="detail-value">${envio.nombreCliente ? escapeHtml(envio.nombreCliente) : '<span class="text-muted">No indicado</span>'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Email Cliente:</span>
                            <span class="detail-value">${envio.emailCliente ? escapeHtml(envio.emailCliente) : '<span class="text-muted">No indicado</span>'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">ID Cliente:</span>
                            <span class="detail-value"><code class="uuid-chip">${envio.clienteId ? escapeHtml(envio.clienteId) : 'Sin ID'}</code></span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Repartidor Asignado:</span>
                            <span class="detail-value">${envio.repartidorId ? `🛵 <code class="uuid-chip">${escapeHtml(envio.repartidorId)}</code>` : '<span class="text-muted">Sin repartidor</span>'}</span>
                        </div>
                    </div>
                </div>

                <!-- Caja 3: Rutas -->
                <div class="detail-grid">
                    <div class="detail-card-box">
                        <h4>📍 Origen</h4>
                        <p class="detail-address">${origenStr}</p>
                    </div>
                    <div class="detail-card-box">
                        <h4>🏁 Destino</h4>
                        <p class="detail-address">${destinoStr}</p>
                    </div>
                </div>

                <!-- Caja 4: Historial de Trazabilidad -->
                <div class="detail-card-box">
                    <h4>📋 Historial de Estados</h4>
                    ${timelineHtml}
                </div>
            `;

        } catch (err) {
            detContenido.innerHTML = `<p class="error-text">No se pudo cargar el detalle del envío: ${escapeHtml(err.message)}</p>`;
        }
    }

    container.querySelector('#close-modal-detalle')?.addEventListener('click', () => modalDetalle.classList.add('hidden'));
    container.querySelector('#close-detalle-btn')?.addEventListener('click', () => modalDetalle.classList.add('hidden'));

    // ============================================================
    // PANTALLA 4: Asignar Repartidor (Solo ADMIN)
    // ============================================================
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
            // Consulta de repartidores disponibles a Courier Service vía Gateway
            const repartidores = await http.get('/applications/apicourier/api/v1/repartidores/disponibles');
            if (!Array.isArray(repartidores) || repartidores.length === 0) {
                selectRepartidores.innerHTML = '<option value="">No hay repartidores disponibles en este momento</option>';
                return;
            }

            selectRepartidores.innerHTML = `
                <option value="">-- Selecciona un repartidor activo --</option>
                ${repartidores.map(r => `
                    <option value="${r.id}">${escapeHtml(r.nombre)} (${escapeHtml(r.tipoVehiculo || 'Vehículo')}) - ACTIVO</option>
                `).join('')}
            `;
        } catch (err) {
            selectRepartidores.innerHTML = `<option value="">Error cargando repartidores desde Courier Service</option>`;
        }
    }

    formAsignar?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const envioId = inputAsigEnvioId.value;
        const repartidorId = selectRepartidores.value;

        if (!repartidorId) {
            toast.warning('Por favor selecciona un repartidor disponible.');
            return;
        }

        try {
            // Endpoint exacto: PATCH /applications/apishipment/api/v1/envios/{id}/asignar-repartidor/{rid}
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

    // ============================================================
    // PANTALLA 5: Cambiar Estado del Envío (PATCH /{id}/estado)
    // Recorrido demostración: PENDIENTE -> EN_RUTA -> ENTREGADO
    // ============================================================
    async function transicionarEstado(envioId, nuevoEstado) {
        const confirmMsg = nuevoEstado === 'EN_RUTA' 
            ? '¿Confirmas poner este envío EN RUTA hacia el destino del cliente?' 
            : '¿Confirmas que el paquete ha sido ENTREGADO al destinatario?';

        if (!confirm(confirmMsg)) return;

        try {
            await http.patch(`/applications/apishipment/api/v1/envios/${envioId}/estado`, {
                nuevoEstado: nuevoEstado,
                observacion: `Transición realizada por el usuario ${user.username} a estado ${nuevoEstado}`
            });

            toast.success(`Estado actualizado exitosamente a: ${nuevoEstado}`);
            cargarEnvios();
        } catch (err) {
            console.error('Error cambiando estado del envío:', err);
        }
    }

    // ============================================================
    // PANTALLA 6: Cancelar Envío (POST /{id}/cancelar con manejo de 409)
    // ============================================================
    async function cancelarEnvio(envioId, codigoSeguimiento) {
        if (!confirm(`¿Estás seguro de cancelar el envío ${codigoSeguimiento}? Esta acción es irreversible.`)) {
            return;
        }

        try {
            // Endpoint exacto requerido: POST /applications/apishipment/api/v1/envios/{id}/cancelar
            await http.post(`/applications/apishipment/api/v1/envios/${envioId}/cancelar`);
            toast.success(`El envío ${codigoSeguimiento} ha sido cancelado.`);
            cargarEnvios();

        } catch (err) {
            console.error('Error cancelando envío:', err);
            // Si el backend devuelve 409 Conflict, http.js ya lanzó el error con err.status = 409
            if (err.status === 409) {
                toast.warning(`Conflicto (409): No se puede cancelar el envío porque ya no se encuentra en estado PENDIENTE.`);
            }
            // Sincronizar de todos modos la lista para refrescar el estado real
            cargarEnvios();
        }
    }

    // Carga inicial al montar la vista
    cargarEnvios();
}

// ============================================================
// FUNCIONES AUXILIARES DE FORMATEO Y SEGURIDAD
// ============================================================

/**
 * Calcula la tarifa estimada o devuelve la fijada por el backend.
 * Fórmula oficial: base 1000 + (peso * 200) + (largo * ancho * alto * 0.1)
 */
function calcularTarifa(envio) {
    if (envio.tarifa != null && envio.tarifa > 0) {
        return envio.tarifa;
    }
    const peso = Number(envio.peso) || 0;
    const largo = Number(envio.largo) || 0;
    const ancho = Number(envio.ancho) || 0;
    const alto = Number(envio.alto) || 0;
    const tarifa = 1000.0 + (peso * 200.0) + (largo * ancho * alto * 0.1);
    return Math.round(tarifa * 100) / 100;
}

/**
 * Formatea un número como moneda argentina ($ ARS).
 */
function formatearMoneda(monto) {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(monto);
}

/**
 * Genera el Badge visual según el estado del envío.
 */
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

/**
 * Formatea un objeto Direccion a texto legible y seguro.
 */
function formatearDireccion(dir) {
    if (!dir) return '<span class="text-muted">No especificada</span>';
    const partes = [];
    if (dir.calle) {
        partes.push(`${escapeHtml(dir.calle)} ${dir.numero ? escapeHtml(String(dir.numero)) : ''}`.trim());
    }
    if (dir.ciudad) partes.push(escapeHtml(dir.ciudad));
    if (dir.codigoPostal) partes.push(`(CP ${escapeHtml(String(dir.codigoPostal))})`);
    return partes.join(', ') || '<span class="text-muted">No especificada</span>';
}

/**
 * Sanitiza texto para evitar inyecciones HTML / XSS.
 */
function escapeHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
}
