/* ============================================================
   StudyFlow+ — js/theme.js
   Sistema de temas: Modo Claro / Modo Oscuro
   Cambio instantáneo + persistencia en localStorage
   ============================================================ */

window.SF = window.SF || {};

const ThemeManager = {

  _key: 'sf_theme',
  _current: 'dark',

  /* ── Init (llamar lo antes posible para evitar parpadeo) ── */
  init() {
    const saved = localStorage.getItem(this._key);
    this._current = (saved === 'light' || saved === 'dark') ? saved : 'dark';
    this.apply(this._current, false);
  },

  get() { return this._current; },

  apply(theme, notify = true) {
    this._current = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', this._current);
    localStorage.setItem(this._key, this._current);

    // Update any theme toggles on screen
    document.querySelectorAll('[data-theme-toggle]').forEach(el => {
      el.checked = (this._current === 'light');
    });
    document.querySelectorAll('[data-theme-label]').forEach(el => {
      el.textContent = this._current === 'light' ? 'Modo Claro' : 'Modo Oscuro';
    });

    if (notify && window.SF.Toast) {
      SF.Toast.info(`Tema cambiado a ${this._current === 'light' ? 'modo claro ☀️' : 'modo oscuro 🌙'}`);
    }
  },

  toggle() {
    this.apply(this._current === 'light' ? 'dark' : 'light');
  },
};

window.SF.Theme = ThemeManager;

// Aplica el tema inmediatamente al cargar el script (antes de DOMContentLoaded)
// para minimizar el parpadeo (FOUC).
try { ThemeManager.init(); } catch (e) {}
