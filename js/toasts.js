/* ============================================================
   StudyFlow+ — js/toasts.js
   Sistema de alertas (toasts) profesional
   Inspirado en Notion / Linear / Discord / ClickUp
   ============================================================ */

window.SF = window.SF || {};

const ToastManager = {

  _container: null,
  _idCounter: 0,

  _config: {
    success: { icon: 'ri-checkbox-circle-fill', color: 'var(--toast-success)', label: 'Éxito' },
    error:   { icon: 'ri-close-circle-fill',     color: 'var(--toast-error)',   label: 'Error' },
    warning: { icon: 'ri-error-warning-fill',    color: 'var(--toast-warning)', label: 'Advertencia' },
    info:    { icon: 'ri-information-fill',       color: 'var(--toast-info)',    label: 'Información' },
  },

  _ensureContainer() {
    if (this._container && document.body.contains(this._container)) return;
    let c = document.getElementById('sf-toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'sf-toast-container';
      c.className = 'sf-toast-container';
      document.body.appendChild(c);
    }
    this._container = c;
  },

  /* ── Public API ── */
  success(msg, title) { return this.show('success', msg, title); },
  error(msg, title)   { return this.show('error', msg, title); },
  warning(msg, title) { return this.show('warning', msg, title); },
  info(msg, title)    { return this.show('info', msg, title); },

  show(type = 'info', msg = '', title = null, duration = 4000) {
    this._ensureContainer();
    const cfg = this._config[type] || this._config.info;
    const id = `toast-${++this._idCounter}`;

    const toast = document.createElement('div');
    toast.className = `sf-toast sf-toast-${type}`;
    toast.id = id;
    toast.style.setProperty('--toast-accent', cfg.color);
    toast.innerHTML = `
      <div class="sf-toast-icon"><i class="${cfg.icon}"></i></div>
      <div class="sf-toast-body">
        <div class="sf-toast-title">${title || cfg.label}</div>
        <div class="sf-toast-msg">${this._esc(msg)}</div>
      </div>
      <button class="sf-toast-close" aria-label="Cerrar"><i class="ri-close-line"></i></button>
      <div class="sf-toast-progress"></div>
    `;

    this._container.appendChild(toast);

    // Force reflow then animate in
    requestAnimationFrame(() => toast.classList.add('sf-toast-in'));

    // Progress bar animation
    const progress = toast.querySelector('.sf-toast-progress');
    if (progress && duration > 0) {
      progress.style.transition = `transform ${duration}ms linear`;
      requestAnimationFrame(() => { progress.style.transform = 'scaleX(0)'; });
    }

    // Auto-dismiss
    let timer = duration > 0 ? setTimeout(() => this.dismiss(id), duration) : null;

    // Pause on hover
    toast.addEventListener('mouseenter', () => {
      if (timer) { clearTimeout(timer); timer = null; }
      if (progress) progress.style.transition = 'none';
    });
    toast.addEventListener('mouseleave', () => {
      if (duration > 0 && !timer) timer = setTimeout(() => this.dismiss(id), 1500);
    });

    // Close button
    toast.querySelector('.sf-toast-close')?.addEventListener('click', () => this.dismiss(id));

    return id;
  },

  dismiss(id) {
    const toast = document.getElementById(id);
    if (!toast) return;
    toast.classList.remove('sf-toast-in');
    toast.classList.add('sf-toast-out');
    setTimeout(() => toast.remove(), 320);
  },

  _esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  },
};

window.SF.Toast = ToastManager;
