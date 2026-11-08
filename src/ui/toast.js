/**
 * Módulo de notificaciones Toast flotantes para feedback visual al usuario.
 */
class ToastManager {
    constructor() {
        this.container = null;
    }

    _getContainer() {
        if (!this.container || !document.body.contains(this.container)) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
        return this.container;
    }

    show(message, type = 'info', duration = 4000) {
        if (!message) return;

        const container = this._getContainer();
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const iconMap = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const icon = iconMap[type] || 'ℹ';

        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <div class="toast-message">${escapeHtml(message)}</div>
            <button class="toast-close" aria-label="Cerrar">&times;</button>
        `;

        const closeBtn = toast.querySelector('.toast-close');
        const removeToast = () => {
            toast.classList.add('toast-leaving');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.parentElement.removeChild(toast);
                }
            }, 300);
        };

        closeBtn.addEventListener('click', removeToast);

        container.appendChild(toast);

        if (duration > 0) {
            setTimeout(removeToast, duration);
        }
    }

    success(message, duration) {
        this.show(message, 'success', duration);
    }

    error(message, duration) {
        this.show(message, 'error', duration || 5000);
    }

    warning(message, duration) {
        this.show(message, 'warning', duration);
    }

    info(message, duration) {
        this.show(message, 'info', duration);
    }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export const toast = new ToastManager();
