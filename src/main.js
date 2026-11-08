import './style.css';
import { initSession } from './auth/session.js';
import { initRouter } from './router.js';

console.info('🚀 Inicializando LogiTrack Frontend...');

// 1. Inicializa el ciclo de vida de la sesión (timers de vencimiento automático)
initSession();

// 2. Inicializa el enrutador SPA por hash (#/login, #/envios, #/repartidores, #/sinacceso)
initRouter();
