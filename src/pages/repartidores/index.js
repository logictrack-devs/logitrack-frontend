
import './repartidores.css';
import { abrirFormularioRepartidor } from './formulario.js';
const POR_PAGINA = 5;

export function renderRepartidores(container, opciones = {}) {
    let datos = opciones.repartidores ?? [];
    let pagina = 1;

    // Construimos la estructura HTML de la pantalla.
    container.innerHTML = `
    <section class="rep-modulo">
      <header class="rep-encabezado">
        <div>
          <p>LOGITRACK / COURIER</p>
          <h1>Gestión de repartidores</h1>
          <p>Consultá y administrá los repartidores.</p>
        </div>
        <button type="button" id="rep-nuevo">+ Nuevo repartidor</button>
      </header>

      <p class="rep-aviso">
        Vista de prueba con datos ficticios.
      </p>

      <div class="rep-panel">
        <div class="rep-filtros">
          <label>
            Buscar repartidor
            <input
              id="rep-buscar"
              type="search"
              placeholder="Nombre o vehículo"
            />
          </label>

          <label>
            Estado
            <select id="rep-estado">
              <option value="TODOS">Todos</option>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </label>
        </div>

        <table class="rep-tabla">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Vehículo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="rep-filas"></tbody>
        </table>

        <footer class="rep-paginacion">
          <span id="rep-resumen"></span>
          <div>
            <button id="rep-anterior">Anterior</button>
            <span id="rep-pagina"></span>
            <button id="rep-siguiente">Siguiente</button>
          </div>
        </footer>
      </div>
    </section>
  `;

    const buscar = container.querySelector('#rep-buscar');
    const filtro = container.querySelector('#rep-estado');
    const filas = container.querySelector('#rep-filas');
    const resumen = container.querySelector('#rep-resumen');
    const paginaTexto = container.querySelector('#rep-pagina');
    const anterior = container.querySelector('#rep-anterior');
    const siguiente = container.querySelector('#rep-siguiente');
    const nuevo = container.querySelector('#rep-nuevo');
    // Agrega una celda a la tabla de forma segura.
    function agregarCelda(fila, valor) {
        const celda = document.createElement('td');
        celda.textContent = String(valor ?? '—');
        fila.appendChild(celda);
    }

    // Actualiza la tabla según la búsqueda, filtro y página.
    function mostrarRepartidores() {
        const texto = buscar.value.toLowerCase().trim();
        const estado = filtro.value;

        const filtrados = datos.filter((repartidor) => {
            const nombre = String(repartidor.nombre ?? '').toLowerCase();
            const vehiculo = String(repartidor.tipoVehiculo ?? '').toLowerCase();

            const coincideBusqueda =
                nombre.includes(texto) || vehiculo.includes(texto);

            const coincideEstado =
                estado === 'TODOS' || repartidor.estado === estado;

            return coincideBusqueda && coincideEstado;
        });

        const totalPaginas = Math.max(
            1,
            Math.ceil(filtrados.length / POR_PAGINA)
        );

        pagina = Math.min(pagina, totalPaginas);

        const inicio = (pagina - 1) * POR_PAGINA;
        const visibles = filtrados.slice(inicio, inicio + POR_PAGINA);

        filas.replaceChildren();

        if (visibles.length === 0) {
            const fila = document.createElement('tr');
            const celda = document.createElement('td');
            celda.colSpan = 5;
            celda.textContent = 'No se encontraron repartidores.';
            fila.appendChild(celda);
            filas.appendChild(fila);
        }

        visibles.forEach((repartidor) => {
            const fila = document.createElement('tr');

            agregarCelda(fila, repartidor.id);
            agregarCelda(fila, repartidor.nombre);
            agregarCelda(fila, repartidor.tipoVehiculo);
            agregarCelda(fila, repartidor.estado);

            const acciones = document.createElement('td');


            const editar = document.createElement('button');
            editar.textContent = 'Editar';

            editar.addEventListener('click', () => {
                abrirFormularioRepartidor({
                    repartidor: repartidor,

                    onGuardar: async (datosFormulario) => {

                        // Buscamos al repartidor por su ID y actualizamos sus datos.
                        datos = datos.map((r) => {
                            if (r.id === repartidor.id) {
                                return {
                                    ...r,
                                    nombre: datosFormulario.nombre,
                                    tipoVehiculo: datosFormulario.tipoVehiculo
                                };
                            }

                            return r;
                        });

                        // Actualizamos la tabla.
                        mostrarRepartidores();
                    }
                });
            });



            const cambiarEstado = document.createElement('button');

            cambiarEstado.textContent =
                repartidor.estado === 'ACTIVO' ? 'Desactivar' : 'Activar';

            cambiarEstado.addEventListener('click', () => {
                // Determinamos cuál será el nuevo estado.
                const nuevoEstado =
                    repartidor.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

                // Buscamos al repartidor por su ID y cambiamos su estado.
                datos = datos.map((r) => {
                    if (r.id === repartidor.id) {
                        return {
                            ...r,
                            estado: nuevoEstado
                        };
                    }

                    return r;
                });

                // Actualizamos la tabla para mostrar el cambio.
                mostrarRepartidores();
            });


            acciones.append(editar, cambiarEstado);
            fila.appendChild(acciones);

            filas.appendChild(fila);
        });

        resumen.textContent = `${filtrados.length} repartidores encontrados`;
        paginaTexto.textContent = `Página ${pagina} de ${totalPaginas}`;

        anterior.disabled = pagina === 1;
        siguiente.disabled = pagina === totalPaginas;
    }


    // Abrir formulario para registrar un repartidor.
    nuevo.addEventListener('click', () => {
        abrirFormularioRepartidor({
            onGuardar: async (datosFormulario) => {

                // Generamos un ID para el dato ficticio.
                const nuevoId = Math.max(
                    0,
                    ...datos.map(r => Number(r.id) || 0)
                ) + 1;

                // Agregamos el repartidor a la lista local.
                datos = [
                    {
                        id: nuevoId,
                        nombre: datosFormulario.nombre,
                        tipoVehiculo: datosFormulario.tipoVehiculo,
                        estado: 'ACTIVO'
                    },
                    ...datos
                ];

                // Limpiamos filtros para mostrar el nuevo registro.
                buscar.value = '';
                filtro.value = 'TODOS';
                pagina = 1;

                // Actualizamos la tabla.
                mostrarRepartidores();
            }
        });
    });


    buscar.addEventListener('input', () => {
        pagina = 1;
        mostrarRepartidores();
    });

    filtro.addEventListener('change', () => {
        pagina = 1;
        mostrarRepartidores();
    });

    anterior.addEventListener('click', () => {
        pagina--;
        mostrarRepartidores();
    });

    siguiente.addEventListener('click', () => {
        pagina++;
        mostrarRepartidores();
    });

    mostrarRepartidores();

    // Permitirá actualizar los datos cuando conectemos Courier.
    return {
        setRepartidores(nuevosDatos) {
            datos = Array.isArray(nuevosDatos) ? nuevosDatos : [];
            pagina = 1;
            mostrarRepartidores();
        }
    };
}
