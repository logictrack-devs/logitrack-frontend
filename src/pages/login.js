import { http } from '../api/http.js';
import { setToken, isAuthenticated, getUser } from '../auth/session.js';
import { toast } from '../ui/toast.js';

export function renderLogin(container) {
    // Si ya está autenticado, redirigir a envíos
    if (isAuthenticated()) {
        window.location.hash = '#/envios';
        return;
    }

    container.innerHTML = `
        <div class="login-wrapper">
            <div class="login-card">
                <div class="login-header">
                    <div class="logo-box">🚚</div>
                    <h1>LogiTrack</h1>
                    <p class="subtitle">Ingreso al Sistema de Gestión Logística</p>
                </div>

                <form id="login-form" class="login-form" novalidate>
                    <div class="form-group">
                        <label for="username">Usuario</label>
                        <input 
                            type="text" 
                            id="username" 
                            name="username" 
                            placeholder="Ej: admin o tu_usuario" 
                            required 
                            autocomplete="username"
                        />
                    </div>

                    <div class="form-group">
                        <label for="password">Contraseña</label>
                        <input 
                            type="password" 
                            id="password" 
                            name="password" 
                            placeholder="••••••••" 
                            required 
                            autocomplete="current-password"
                        />
                    </div>

                    <div id="login-error" class="form-alert hidden"></div>

                    <button type="submit" id="login-submit-btn" class="btn btn-primary btn-block">
                        <span class="btn-text">Iniciar Sesión</span>
                        <span class="btn-spinner hidden">Iniciando...</span>
                    </button>
                </form>

                <div class="login-help">
                    <p class="help-title">💡 Usuarios de prueba:</p>
                    <div class="cred-chips">
                        <button type="button" class="chip-btn" data-user="admin" data-pass="admin123">
                            👑 Admin: <code>admin</code>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const form = container.querySelector('#login-form');
    const usernameInput = container.querySelector('#username');
    const passwordInput = container.querySelector('#password');
    const errorBox = container.querySelector('#login-error');
    const submitBtn = container.querySelector('#login-submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');

    // Botones rápidos para rellenar usuario de prueba
    container.querySelectorAll('.chip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            usernameInput.value = btn.dataset.user;
            passwordInput.value = btn.dataset.pass;
            usernameInput.focus();
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorBox.classList.add('hidden');
        errorBox.textContent = '';

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            errorBox.textContent = 'Por favor ingresa usuario y contraseña.';
            errorBox.classList.remove('hidden');
            return;
        }

        // Estado de carga
        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        btnSpinner.classList.remove('hidden');

        try {
            const data = await http.post('/applications/apisecurity/api/auth/login', {
                username,
                password
            });

            if (data && data.token) {
                setToken(data.token);
                const user = getUser();
                toast.success(`¡Bienvenido/a, ${user ? user.username : username}!`);
                window.location.hash = '#/envios';
            } else {
                throw new Error('Respuesta inválida del servidor (sin token)');
            }

        } catch (err) {
            console.error('Error al iniciar sesión:', err);
            errorBox.textContent = err.message || 'Credenciales incorrectas o servidor no disponible';
            errorBox.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnSpinner.classList.add('hidden');
        }
    });

    usernameInput.focus();
}
