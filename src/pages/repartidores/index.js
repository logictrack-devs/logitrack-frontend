import { http } from '../../api/http.js';
import { hasRole } from '../../auth/session.js';
import { toast } from '../../ui/toast.js';

export async function renderRepartidores(container) {
    const isAdmin = hasRole('ADMIN');

    container.innerHTML = `
        <div class="page-container">
            <div class="page-header">
                <div>
                    <h2>🛵 Gestión de Repartidores</h2>
                    <p class="subtitle">Consulta de disponibilidad y estado de repartidores activos</p>
                </div>
                ${isAdmin ? `
                    <button id="btn-nuevo-repartidor" class="btn btn-primary">
                        + Registrar Repartidor
                    </button>
                ` : ''}
            </div>

            <div id="repartidores-loading" class="loading-state">
                Cargando lista de repartidores...
            </div>

            <div id="repartidores-content" class="table-card hidden">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Tipo Vehículo</th>
                            <th>Estado</th>
                            <th>ID del Repartidor</th>
                        </tr>
                    </thead>
                    <tbody id="repartidores-tbody"></tbody>
                </table>
            </div>

            <div id="repartidores-empty" class="empty-state hidden">
                <p>No se encontraron repartidores registrados o disponibles.</p>
            </div>
        </div>

        <!-- Modal Registrar Repartidor (Solo ADMIN) -->
        <div id="modal-repartidor" class="modal-overlay hidden">
            <div class="modal-card">
                <div class="modal-header">
                    <h3>Registrar Nuevo Repartidor</h3>
                    <button class="modal-close-btn" id="close-modal-repartidor">&times;</button>
                </div>
                <form id="form-nuevo-repartidor" class="modal-body">
                    <div class="form-group">
                        <label for="rep-nombre">Nombre Completo *</label>
                        <input type="text" id="rep-nombre" required placeholder="Ej: Carlos Gómez" />
                    </div>
                    <div class="form-group">
                        <label for="rep-vehiculo">Tipo de Vehículo *</label>
                        <select id="rep-vehiculo" required>
                            <option value="MOTO">Moto 🏍️</option>
                            <option value="BICICLETA">Bicicleta 🚲</option>
                            <option value="AUTO">Auto 🚗</option>
                            <option value="CAMIONETA">Camioneta 🚚</option>
                        </select>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" id="cancel-repartidor">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const loadingEl = container.querySelector('#repartidores-loading');
    const contentEl = container.querySelector('#repartidores-content');
    const tbody = container.querySelector('#repartidores-tbody');
    const emptyEl = container.querySelector('#repartidores-empty');

    async function cargarRepartidores() {
        loadingEl.classList.remove('hidden');
        contentEl.classList.add('hidden');
        emptyEl.classList.add('hidden');

        try {
            // Intentar traer los disponibles primero
            const repartidores = await http.get('/applications/apicourier/api/v1/repartidores/disponibles');

            loadingEl.classList.add('hidden');

            if (!Array.isArray(repartidores) || repartidores.length === 0) {
                emptyEl.classList.remove('hidden');
                return;
            }

            tbody.innerHTML = repartidores.map(r => `
                <tr>
                    <td><strong>${escapeHtml(r.nombre || 'Sin nombre')}</strong></td>
                    <td>${escapeHtml(r.tipoVehiculo || 'No especificado')}</td>
                    <td>
                        <span class="badge ${r.estado === 'ACTIVO' ? 'badge-success' : 'badge-warning'}">
                            ${r.estado || 'DESCONOCIDO'}
                        </span>
                    </td>
                    <td><code class="uuid-chip">${r.id}</code></td>
                </tr>
            `).join('');

            contentEl.classList.remove('hidden');

        } catch (err) {
            loadingEl.classList.add('hidden');
            emptyEl.classList.remove('hidden');
            emptyEl.innerHTML = `<p class="error-text">No se pudo cargar repartidores: ${escapeHtml(err.message)}</p>`;
        }
    }

    // Modal nuevo repartidor
    if (isAdmin) {
        const modal = container.querySelector('#modal-repartidor');
        const openBtn = container.querySelector('#btn-nuevo-repartidor');
        const closeBtn = container.querySelector('#close-modal-repartidor');
        const cancelBtn = container.querySelector('#cancel-repartidor');
        const form = container.querySelector('#form-nuevo-repartidor');

        const openModal = () => modal.classList.remove('hidden');
        const closeModal = () => {
            modal.classList.add('hidden');
            form.reset();
        };

        openBtn?.addEventListener('click', openModal);
        closeBtn?.addEventListener('click', closeModal);
        cancelBtn?.addEventListener('click', closeModal);

        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = container.querySelector('#rep-nombre').value.trim();
            const tipoVehiculo = container.querySelector('#rep-vehiculo').value;

            try {
                await http.post('/applications/apicourier/api/v1/repartidores', {
                    nombre,
                    tipoVehiculo
                });

                toast.success('Repartidor registrado exitosamente.');
                closeModal();
                cargarRepartidores();
            } catch (err) {
                console.error('Error registrando repartidor:', err);
            }
        });
    }

    cargarRepartidores();
}

function escapeHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}
