
export function abrirFormularioRepartidor({
                                              repartidor = null,
                                              onGuardar
                                          }) {
    const esEdicion = repartidor !== null;

    // Creamos una ventana de formulario.
    const dialogo = document.createElement('dialog');
    dialogo.className = 'rep-dialogo';

    dialogo.innerHTML = `
    <form class="rep-formulario">
      <h2></h2>

      <label>
        Nombre del repartidor
        <input
          name="nombre"
          type="text"
          maxlength="100"
          required
        />
      </label>

      <label>
        Tipo de vehículo
        <input
          name="tipoVehiculo"
          type="text"
          placeholder="Ej.: Moto, Auto, Bicicleta"
          required
        />
      </label>

      <p class="rep-error" role="alert"></p>

      <div class="rep-formulario-acciones">
        <button type="button" class="rep-cancelar">
          Cancelar
        </button>

        <button type="submit" class="rep-guardar">
          Guardar
        </button>
      </div>
    </form>
  `;

    const formulario = dialogo.querySelector('form');
    const nombre = formulario.elements.namedItem('nombre');
    const vehiculo = formulario.elements.namedItem('tipoVehiculo');
    const error = dialogo.querySelector('.rep-error');
    const guardar = dialogo.querySelector('.rep-guardar');

    // Cambiamos el título según la operación.
    dialogo.querySelector('h2').textContent =
        esEdicion ? 'Editar repartidor' : 'Nuevo repartidor';

    // Si estamos editando, mostramos los datos actuales.
    if (esEdicion) {
        nombre.value = repartidor.nombre ?? '';
        vehiculo.value = repartidor.tipoVehiculo ?? '';
    }

    // Botón Cancelar.
    dialogo.querySelector('.rep-cancelar')
        .addEventListener('click', () => dialogo.close());

    // Botón Guardar.
    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const datos = {
            nombre: nombre.value.trim(),
            tipoVehiculo: vehiculo.value.trim()
        };

        if (!datos.nombre || !datos.tipoVehiculo) {
            error.textContent = 'Completá todos los campos.';
            return;
        }

        guardar.disabled = true;
        error.textContent = '';

        try {
            await onGuardar(datos);
            dialogo.close();
        } catch (e) {
            error.textContent =
                e.message || 'No se pudo guardar el repartidor.';
        } finally {
            guardar.disabled = false;
        }
    });

    dialogo.addEventListener('close', () => dialogo.remove());

    document.body.appendChild(dialogo);
    dialogo.showModal();
}
