
import { renderRepartidores } from './index.js';

// Datos ficticios para probar la pantalla.
// Más adelante los reemplazaremos por datos reales de Courier.
const repartidoresDePrueba = [
    {
        id: 1,
        nombre: 'Juan Perez',
        tipoVehiculo: 'Moto',
        estado: 'ACTIVO'
    },
    {
        id: 2,
        nombre: 'Pedro Gomez',
        tipoVehiculo: 'Auto',
        estado: 'ACTIVO'
    },
    {
        id: 3,
        nombre: 'Ana Lopez',
        tipoVehiculo: 'Bicicleta',
        estado: 'INACTIVO'
    },
    {
        id: 4,
        nombre: 'Carlos Diaz',
        tipoVehiculo: 'Moto',
        estado: 'ACTIVO'
    },
    {
        id: 5,
        nombre: 'Lucia Torres',
        tipoVehiculo: 'Auto',
        estado: 'INACTIVO'
    },
    {
        id: 6,
        nombre: 'Martin Ruiz',
        tipoVehiculo: 'Moto',
        estado: 'ACTIVO'
    },
    {
        id: 7,
        nombre: 'Sofia Castro',
        tipoVehiculo: 'Bicicleta',
        estado: 'ACTIVO'
    }
];

// Buscamos el contenedor HTML donde se mostrará la pantalla.
const contenedor = document.querySelector('#app');

// Mostramos el módulo con los datos de prueba.
renderRepartidores(contenedor, {
    repartidores: repartidoresDePrueba
});
