/* ============================================================
   StudyFlow+ — app.js
   Main SPA: Router · Auth · Dashboard · Navigation
   ============================================================ */

window.SF = window.SF || {};

/* ════════════════════════════════════════════════════════════
   APP STATE
════════════════════════════════════════════════════════════ */
let _currentView = 'dashboard';

const VIEW_TITLES = {
  dashboard:     'Dashboard',
  planner:       'Planificador Inteligente',
  concentration: 'Centro de Concentración',
  templates:     'Plantillas',
  study:         'Método de Estudio',
  reading:       'Reto de Lectura',
  videos:        'Videos',
  settings:      'Configuración',
};

/* Expose navigate globally so study.js / templates can call it */
SF._navigate = navigate;

/* ════════════════════════════════════════════════════════════
   BOOT
════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  _setCurrentDate();
  _setupGlobalSearch();
  _setupMobileMenu();
  _setupSidebarNav();
  _setupNotificationPanel();
  _setupAuthModal();
  _setupTaskModal();

  SF.Notif.init();

  if (SF.Api.isLoggedIn()) {
    await _bootAuthenticated();
  } else {
    _showAuthModal();
  }
});

/* ════════════════════════════════════════════════════════════
   AUTHENTICATED BOOT
════════════════════════════════════════════════════════════ */
async function _bootAuthenticated() {
  _hideAuthModal();

  // Load user data
  let user = SF.Api.getUser();
  _updateUserUI(user);

  // Refresh profile from server (async, don't block)
  SF.Api.getProfile().then(data => {
    if (data.user) {
      user = data.user;
      _updateUserUI(user);
    }
  }).catch(() => {});

  // Load tasks
  await SF.Tasks.load();

  // Navigate to dashboard
  navigate('dashboard');

  // Re-check notifications after tasks load
  setTimeout(() => SF.Notif.checkDueDates(), 1000);
}

/* ════════════════════════════════════════════════════════════
   NAVIGATION ROUTER
════════════════════════════════════════════════════════════ */
function navigate(view) {
  if (!SF.Api.isLoggedIn()) { _showAuthModal(); return; }

  _currentView = view;
  const container = document.getElementById('app-view');
  if (!container) return;

  // Update sidebar active state
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === view);
  });

  // Update page title
  document.getElementById('page-title').textContent = VIEW_TITLES[view] || view;

  // Render view
  container.innerHTML = '<div class="spinner"></div>';

  requestAnimationFrame(() => {
    switch (view) {
      case 'dashboard':     _renderDashboard(container); break;
      case 'planner':       _renderModule(SF.Planner,  container); break;
      case 'concentration': _renderModule(SF.Timer,    container); break;
      case 'templates':     _renderTemplates(container); break;
      case 'study':         _renderModule(SF.Study,   container); break;
      case 'reading':       _renderModule(SF.Reading, container); break;
      case 'videos':        _renderVideos(container); break;
      case 'settings':      _renderSettings(container); break;
      default:              container.innerHTML = '<p style="padding:32px">Vista no encontrada.</p>';
    }
  });

  // Close mobile sidebar
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('mobileOverlay')?.classList.add('hidden');
}

function _renderModule(mod, container) {
  container.innerHTML = mod.renderView();
  mod.mount();
}

/* ════════════════════════════════════════════════════════════
   DASHBOARD VIEW
════════════════════════════════════════════════════════════ */
function _renderDashboard(container) {
  const user = SF.Api.getUser() || {};
  const stats = user.stats || {};
  const tasks = SF.Tasks.getAll();
  const pending = tasks.filter(t => !t.done);
  const completedCount = tasks.filter(t => t.done).length; // DERIVADO del estado real
  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate).toISOString().slice(0, 10) === today);

  // Métodos utilizados = plantillas de estudio con datos guardados
  const methodIds = ['pomodoro','feynman','cornell','mindmap','spaced','recall'];
  const methodsUsed = methodIds.filter(m => {
    try { const d = JSON.parse(localStorage.getItem('sf_method_' + m) || '{}'); return Object.keys(d).length > 0; }
    catch { return false; }
  }).length;

  // Week data for bar chart
  const weekBars = _buildWeekBars(tasks);

  // Recent activity
  const recentActivity = _buildActivity(tasks);

  const hours = Math.round((stats.minutes || 0) / 60 * 10) / 10;

  container.innerHTML = `
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon si-purple"><i class="ri-timer-flash-line"></i></div>
      <div class="stat-info">
        <h3>Tiempo de Enfoque</h3>
        <div class="stat-number">${hours}<span class="stat-unit"> hrs</span></div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon si-orange"><i class="ri-focus-3-line"></i></div>
      <div class="stat-info">
        <h3>Pomodoros</h3>
        <div class="stat-number">${stats.pomodoros || 0}</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon si-green"><i class="ri-checkbox-circle-line"></i></div>
      <div class="stat-info">
        <h3>Tareas Completadas</h3>
        <div class="stat-number">${completedCount}</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon si-blue"><i class="ri-fire-line"></i></div>
      <div class="stat-info">
        <h3>Racha Actual</h3>
        <div class="stat-number">${stats.streak || 0}<span class="stat-unit"> días</span></div>
      </div>
    </div>
  </div>

  <div class="dashboard-grid">
    <!-- Left column -->
    <div class="dashboard-col">

      <div class="card">
        <div class="card-header">
          <h2><i class="ri-task-line"></i> Tareas de Hoy</h2>
          <button class="btn-primary" id="dash-new-task" style="font-size:0.8rem;padding:6px 14px">
            <i class="ri-add-line"></i> Nueva
          </button>
        </div>
        <div id="dash-tasks-list"></div>
        <div style="margin-top:12px;text-align:center">
          <button class="btn-secondary" id="dash-see-all" style="font-size:0.8rem;padding:7px 20px;width:100%">
            Ver todas las tareas <i class="ri-arrow-right-line"></i>
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2><i class="ri-bar-chart-grouped-line"></i> Progreso Semanal</h2>
          <span style="font-size:0.75rem;color:var(--text-muted)">Tareas completadas</span>
        </div>
        <div class="week-bars" id="week-bars-container">
          ${weekBars}
        </div>
      </div>

    </div>

    <!-- Right column -->
    <div class="dashboard-col">

      <div class="card">
        <div class="card-header">
          <h2><i class="ri-pulse-line"></i> Actividad Reciente</h2>
        </div>
        <div id="dash-activity">
          ${recentActivity}
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2><i class="ri-rocket-line"></i> Acceso Rápido</h2>
        </div>
        <div class="quick-actions">
          <button class="quick-action-btn" data-nav="concentration">
            <i class="ri-focus-3-line"></i>
            <span>Iniciar Pomodoro</span>
          </button>
          <button class="quick-action-btn" data-nav="planner">
            <i class="ri-calendar-schedule-line"></i>
            <span>Planificador</span>
          </button>
          <button class="quick-action-btn" data-nav="study">
            <i class="ri-book-open-line"></i>
            <span>Métodos</span>
          </button>
          <button class="quick-action-btn" data-nav="reading">
            <i class="ri-book-2-line"></i>
            <span>Lecturas</span>
          </button>
        </div>
      </div>

      <div class="card" style="background:linear-gradient(135deg,rgba(99,102,241,0.12),rgba(168,85,247,0.08));border-color:rgba(99,102,241,0.3)">
        <div style="display:flex;align-items:center;gap:14px">
          <div style="font-size:2.2rem">🎓</div>
          <div>
            <div style="font-size:0.95rem;font-weight:700;margin-bottom:4px">
              ${user.name ? `¡Hola, ${user.name.split(' ')[0]}!` : '¡Bienvenido!'}
            </div>
            <div style="font-size:0.8rem;color:var(--text-secondary);line-height:1.5">
              Llevas <strong style="color:var(--accent)">${stats.xp || 0} XP</strong> acumulados.
              ${pending.length > 0 ? `Tienes <strong style="color:var(--yellow)">${pending.length} tareas</strong> pendientes.` : '¡Todas las tareas al día! 🎉'}
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>`;

  // Render task list
  SF.Tasks.renderList(todayTasks.length > 0 ? todayTasks : pending, 'dash-tasks-list');

  // Listeners
  document.getElementById('dash-new-task')?.addEventListener('click', () => SF.Tasks.openModal());
  document.getElementById('dash-see-all')?.addEventListener('click', () => navigate('planner'));
  document.querySelectorAll('.quick-action-btn[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.nav));
  });

  // Re-render tasks when updated
  document.addEventListener('sf:tasks-updated', () => {
    if (_currentView !== 'dashboard') return;
    const fresh = SF.Tasks.getAll();
    const t2    = fresh.filter(t => !t.done).slice(0, 5);
    SF.Tasks.renderList(t2, 'dash-tasks-list');
  }, { once: true });
}

function _buildWeekBars(tasks) {
  const days = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const todayDow = (new Date().getDay() + 6) % 7;
  const monday = new Date();
  monday.setDate(monday.getDate() - todayDow);
  monday.setHours(0, 0, 0, 0);

  const counts = days.map((_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const ds = d.toISOString().slice(0, 10);
    return tasks.filter(t => t.done && t.dueDate && new Date(t.dueDate).toISOString().slice(0, 10) === ds).length;
  });

  const max = Math.max(...counts, 1);

  return days.map((d, i) => {
    const h = Math.max(8, Math.round((counts[i] / max) * 72));
    return `
      <div class="week-bar-wrap">
        <div class="week-bar${i === todayDow ? ' today' : ''}" style="height:${h}px" title="${d}: ${counts[i]} tareas"></div>
        <span class="week-bar-label">${d}</span>
      </div>`;
  }).join('');
}

function _buildActivity(tasks) {
  const recent = tasks.filter(t => t.done).slice(0, 5);
  if (recent.length === 0) {
    return `<div class="empty-state" style="padding:20px"><i class="ri-calendar-line"></i><p>Sin actividad reciente</p></div>`;
  }
  const colors = { alta: 'var(--red)', media: 'var(--yellow)', baja: 'var(--green)' };
  return recent.map(t => `
    <div class="activity-item">
      <div class="activity-dot" style="background:${colors[t.priority]||'var(--accent)'}"></div>
      <span class="activity-text">Completaste: ${_esc(t.text)}</span>
      <span class="activity-time">${t.dueDate ? new Date(t.dueDate).toLocaleDateString('es-EC',{day:'numeric',month:'short'}) : '—'}</span>
    </div>`).join('');
}

/* ════════════════════════════════════════════════════════════
   TEMPLATES HUB VIEW
════════════════════════════════════════════════════════════ */
function _renderTemplates(container) {
  container.innerHTML = `
  <div class="templates-hub-header">
    <div class="view-title">📋 Plantillas</div>
    <div class="view-subtitle">Elige una herramienta y comienza a estudiar con más intención.</div>
  </div>
  <div class="templates-grid">
    ${[
      { view:'planner', color:'#6366f1', icon:'ri-calendar-schedule-line', title:'📅 Planificador Inteligente',
        desc:'Organiza tus tareas y visualiza tu agenda en vistas de día, semana y mes.',
        pills:['Agenda Diaria','Vista Semanal','Calendario Mensual','Filtros'] },
      { view:'concentration', color:'#ef4444', icon:'ri-focus-3-line', title:'🎯 Centro de Concentración',
        desc:'Usa la técnica Pomodoro o el cronómetro para mantener el foco y registrar tus sesiones.',
        pills:['Pomodoro','Cronómetro','Historial de Sesiones','Estadísticas'] },
      { view:'study', color:'#f59e0b', icon:'ri-book-open-line', title:'📚 Método de Estudio',
        desc:'Explora 6 técnicas de estudio probadas, marca tus favoritas y añade notas de sesión.',
        pills:['6 Técnicas','Favoritas','Notas','Técnicas Personalizadas'] },
      { view:'reading', color:'#10b981', icon:'ri-book-2-line', title:'📖 Reto de Lectura',
        desc:'Establece una meta mensual de libros, registra tu progreso y lleva un historial de lecturas.',
        pills:['Meta Mensual','Mis Libros','Progreso','Estadísticas'] },
    ].map(t => `
      <div class="template-card" style="--tc-color:${t.color}">
        <div class="tc-icon"><i class="${t.icon}"></i></div>
        <div class="tc-body">
          <h3>${t.title}</h3>
          <p>${t.desc}</p>
          <div class="tc-features">${t.pills.map(p => `<span class="tc-pill">${p}</span>`).join('')}</div>
        </div>
        <button class="tc-btn" data-nav="${t.view}">
          Abrir <i class="ri-arrow-right-line"></i>
        </button>
      </div>`).join('')}
  </div>`;

  container.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.nav));
  });
}

/* ════════════════════════════════════════════════════════════
   VIDEOS VIEW
════════════════════════════════════════════════════════════ */
function _renderVideos(container) {
  // Canal de Pablo Lomelí — técnicas de estudio, memorización y productividad.
  const CHANNEL   = 'https://www.youtube.com/pablolomeli';
  const PLAYLIST  = 'https://www.youtube.com/playlist?list=PLHR3PC5gXKOFKwj974H7XLZNBiRn8SoKP';

  const videos = [
    { emoji:'🧠', title:'Técnicas de estudio para dominar cualquier tema', category:'Técnicas',     url: CHANNEL },
    { emoji:'🧩', title:'Técnicas de memorización y mnemotecnia',          category:'Memoria',      url: CHANNEL },
    { emoji:'📖', title:'Lectura veloz: lee más rápido y comprende mejor',  category:'Lectura',      url: CHANNEL },
    { emoji:'🥷', title:'Curso de técnicas de estudio (serie completa)',    category:'Curso',        url: PLAYLIST },
    { emoji:'🏋️', title:'Gimnasia cerebral y ejercicios para la memoria',  category:'Cerebro',      url: CHANNEL },
    { emoji:'⚡', title:'Hábitos y productividad para estudiar mejor',      category:'Productividad', url: CHANNEL },
  ];

  container.innerHTML = `
  <div class="view-title">🎬 Videos Educativos</div>
  <div class="view-subtitle">Técnicas de estudio del canal de <strong>Pablo Lomelí</strong> — el Ninja Cerebral.</div>

  <a href="${CHANNEL}" target="_blank" rel="noopener" class="yt-channel-banner">
    <div class="yt-channel-avatar"><i class="ri-youtube-fill"></i></div>
    <div class="yt-channel-info">
      <div class="yt-channel-name">Pablo Lomelí <i class="ri-verified-badge-fill" style="color:var(--accent);font-size:0.85rem"></i></div>
      <div class="yt-channel-desc">Técnicas de estudio, memorización y aprendizaje acelerado</div>
    </div>
    <div class="yt-channel-btn"><i class="ri-external-link-line"></i> Visitar canal</div>
  </a>

  <div class="videos-grid">
    ${videos.map(v => `
      <a href="${v.url}" target="_blank" rel="noopener" class="video-card">
        <div class="video-thumb">
          <div class="video-thumb-bg">${v.emoji}</div>
          <div class="video-play-btn"><i class="ri-play-fill"></i></div>
        </div>
        <div class="video-body">
          <div class="video-title">${v.title}</div>
          <div class="video-meta">
            <span style="background:var(--accent-dim);color:var(--accent);padding:1px 8px;border-radius:20px;font-size:0.65rem">${v.category}</span>
            &nbsp;·&nbsp; Pablo Lomelí
          </div>
        </div>
      </a>`).join('')}
  </div>`;
}

/* ════════════════════════════════════════════════════════════
   SETTINGS VIEW
════════════════════════════════════════════════════════════ */
function _renderSettings(container) {
  const user = SF.Api.getUser() || {};

  container.innerHTML = `
  <div class="view-title">⚙️ Configuración</div>
  <div class="view-subtitle">Personaliza tu experiencia en StudyFlow+.</div>

  <div class="settings-grid">

    <div class="card">
      <div class="card-header"><h3><i class="ri-user-line"></i> Perfil</h3></div>
      <div class="field-group" style="margin-bottom:12px">
        <label>Nombre Completo</label>
        <input class="field-input" type="text" id="settings-name" value="${_esc(user.name || '')}">
      </div>
      <div class="field-group" style="margin-bottom:12px">
        <label>Unidad Educativa</label>
        <input class="field-input" type="text" id="settings-school"
          placeholder="Ej: Unidad Educativa Fiscal Vicente Rocafuerte"
          value="${_esc(user.settings?.school || '')}">
      </div>
      <div class="field-group" style="margin-bottom:16px">
        <label>Correo</label>
        <input class="field-input" type="email" value="${_esc(user.email || '')}" disabled style="opacity:0.6">
      </div>
      <button class="btn-primary" id="save-profile-btn" style="width:100%">
        <i class="ri-save-line"></i> Guardar cambios
      </button>
    </div>

    <div class="card">
      <div class="card-header"><h3><i class="ri-palette-line"></i> Apariencia</h3></div>
      <div class="setting-row">
        <div class="setting-info">
          <h4 data-theme-label>Modo Oscuro</h4>
          <p>Cambia entre tema claro y oscuro. Tu preferencia se guarda.</p>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" data-theme-toggle id="theme-toggle">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="theme-preview-row">
        <button class="theme-chip" data-set-theme="dark"><span class="chip-dot dark"></span> Oscuro</button>
        <button class="theme-chip" data-set-theme="light"><span class="chip-dot light"></span> Claro</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3><i class="ri-bar-chart-box-line"></i> Estadísticas</h3></div>
      <div class="setting-row">
        <div class="setting-info"><h4>Tiempo total de enfoque</h4></div>
        <span style="color:var(--accent);font-weight:600">${Math.round((user.stats?.minutes||0)/60*10)/10} hrs</span>
      </div>
      <div class="setting-row">
        <div class="setting-info"><h4>Pomodoros completados</h4></div>
        <span style="color:var(--accent);font-weight:600">${user.stats?.pomodoros||0}</span>
      </div>
      <div class="setting-row">
        <div class="setting-info"><h4>Sesiones de estudio</h4></div>
        <span style="color:var(--accent);font-weight:600">${user.stats?.sessions||0}</span>
      </div>
      <div class="setting-row">
        <div class="setting-info"><h4>Experiencia (XP)</h4></div>
        <span style="color:var(--purple);font-weight:600">${user.stats?.xp||0} XP</span>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3><i class="ri-notification-3-line"></i> Notificaciones</h3></div>
      <div class="setting-row">
        <div class="setting-info">
          <h4>Recordatorios de tareas</h4>
          <p>Notificaciones cuando una tarea está por vencer</p>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="toggle-task-notifs" checked>
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="setting-row">
        <div class="setting-info">
          <h4>Fin de Pomodoro</h4>
          <p>Alerta cuando termina un ciclo Pomodoro</p>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="toggle-pomo-notifs" checked>
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div style="margin-top:14px">
        <button class="btn-secondary" id="req-notif-permission" style="width:100%;justify-content:center;font-size:0.8rem">
          <i class="ri-notification-line"></i> Activar notificaciones del navegador
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3><i class="ri-database-2-line"></i> Datos</h3></div>
      <div class="setting-row">
        <div class="setting-info">
          <h4>Limpiar historial de sesiones</h4>
          <p>Elimina el historial de Pomodoros</p>
        </div>
        <button class="btn-danger" id="clear-sessions-btn">Limpiar</button>
      </div>
      <div class="setting-row">
        <div class="setting-info">
          <h4>Limpiar notificaciones</h4>
          <p>Vacía el panel de notificaciones</p>
        </div>
        <button class="btn-danger" id="clear-notifs-btn">Limpiar</button>
      </div>
      <div class="setting-row" style="border-bottom:none">
        <div class="setting-info">
          <h4 style="color:var(--red)">Cerrar Sesión</h4>
          <p>Salir de tu cuenta actual</p>
        </div>
        <button class="btn-danger" id="settings-logout-btn">Salir</button>
      </div>
    </div>

  </div>`;

  // Listeners
  document.getElementById('save-profile-btn')?.addEventListener('click', async () => {
    const name   = document.getElementById('settings-name').value.trim();
    const school = document.getElementById('settings-school')?.value.trim() || '';
    if (!name) { SF.Toast?.warning('El nombre no puede estar vacío.'); return; }
    try {
      // 'school' se mapea al campo existente settings.school del modelo User.
      await SF.Api.updateProfile({ name, school });
      _updateUserUI(SF.Api.getUser());
      SF.Toast?.success('Perfil actualizado correctamente.');
    } catch (e) { SF.Toast?.error('Error al guardar: ' + e.message); }
  });

  // Theme toggle (switch)
  document.getElementById('theme-toggle')?.addEventListener('change', (e) => {
    SF.Theme.apply(e.target.checked ? 'light' : 'dark');
  });
  // Theme chips
  document.querySelectorAll('[data-set-theme]').forEach(chip => {
    chip.addEventListener('click', () => SF.Theme.apply(chip.dataset.setTheme));
  });
  // Reflect current theme on render
  const tt = document.getElementById('theme-toggle');
  if (tt) tt.checked = (SF.Theme.get() === 'light');
  document.querySelectorAll('[data-theme-label]').forEach(el =>
    el.textContent = SF.Theme.get() === 'light' ? 'Modo Claro' : 'Modo Oscuro');

  document.getElementById('req-notif-permission')?.addEventListener('click', async () => {
    const p = await Notification.requestPermission().catch(() => 'denied');
    if (p === 'granted') SF.Toast?.success('Notificaciones del navegador activadas.');
    else SF.Toast?.warning('Permiso denegado. Actívalas en la configuración del navegador.');
  });

  document.getElementById('clear-sessions-btn')?.addEventListener('click', () => {
    if (confirm('¿Limpiar historial de sesiones?')) {
      localStorage.removeItem('sf_focus_history');
      SF.Toast?.info('Historial de sesiones limpiado.');
    }
  });

  document.getElementById('clear-notifs-btn')?.addEventListener('click', () => {
    SF.Notif.clear();
    SF.Toast?.info('Notificaciones limpiadas.');
  });

  document.getElementById('settings-logout-btn')?.addEventListener('click', () => _logout());
}

/* ════════════════════════════════════════════════════════════
   AUTH MODAL
════════════════════════════════════════════════════════════ */
function _setupAuthModal() {
  let authMode = 'login';

  const tabLogin    = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const groupName   = document.getElementById('group-name');
  const form        = document.getElementById('auth-form');
  const btnLabel    = document.getElementById('auth-btn-label');
  const errEl       = document.getElementById('auth-error');

  tabLogin?.addEventListener('click', () => {
    authMode = 'login';
    tabLogin.classList.add('active'); tabRegister.classList.remove('active');
    groupName.classList.add('hidden');
    btnLabel.textContent = 'Acceder al Panel';
    errEl.classList.add('hidden');
  });

  tabRegister?.addEventListener('click', () => {
    authMode = 'register';
    tabRegister.classList.add('active'); tabLogin.classList.remove('active');
    groupName.classList.remove('hidden');
    btnLabel.textContent = 'Crear Cuenta';
    errEl.classList.add('hidden');
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.classList.add('hidden');
    const submitBtn = document.getElementById('btn-auth-submit');
    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = 'Cargando...';

    const email    = document.getElementById('user-email').value.trim();
    const password = document.getElementById('user-password').value;
    const name     = document.getElementById('user-name')?.value.trim() || '';

    try {
      if (authMode === 'login') {
        await SF.Api.login(email, password);
      } else {
        if (!name) throw new Error('El nombre es obligatorio.');
        await SF.Api.register(name, email, password);
      }
      await _bootAuthenticated();
    } catch (err) {
      errEl.textContent = err.message || 'Ocurrió un error. Intenta de nuevo.';
      errEl.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.querySelector('span').textContent = authMode === 'login' ? 'Acceder al Panel' : 'Crear Cuenta';
    }
  });
}

function _showAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.style.display = 'flex';
}

function _hideAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.style.display = 'none';
}

/* ════════════════════════════════════════════════════════════
   TASK MODAL
════════════════════════════════════════════════════════════ */
function _setupTaskModal() {
  document.getElementById('close-task-modal')?.addEventListener('click', () => SF.Tasks.closeModal());
  document.getElementById('cancel-task-modal')?.addEventListener('click', () => SF.Tasks.closeModal());
  document.getElementById('task-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) SF.Tasks.closeModal();
  });

  document.getElementById('task-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    SF.Tasks.save({
      id:          document.getElementById('task-edit-id').value,
      text:        document.getElementById('task-text').value,
      description: document.getElementById('task-description').value,
      priority:    document.getElementById('task-priority').value,
      category:    document.getElementById('task-category').value,
      subject:     document.getElementById('task-subject').value,
      dueDate:     document.getElementById('task-due').value,
    });
  });
}

/* ════════════════════════════════════════════════════════════
   NOTIFICATION PANEL
════════════════════════════════════════════════════════════ */
function _setupNotificationPanel() {
  const notifBtn    = document.getElementById('notifBtn');
  const panel       = document.getElementById('notif-panel');
  const backdrop    = document.getElementById('panel-backdrop');
  const closeBtn    = document.getElementById('closeNotifPanel');
  const markAllBtn  = document.getElementById('markAllRead');

  function openPanel() {
    panel.classList.remove('hidden');
    backdrop.classList.remove('hidden');
    SF.Notif.render();
  }
  function closePanel() {
    panel.classList.add('hidden');
    backdrop.classList.add('hidden');
  }

  notifBtn?.addEventListener('click', () => {
    panel.classList.contains('hidden') ? openPanel() : closePanel();
  });
  closeBtn?.addEventListener('click', closePanel);
  backdrop?.addEventListener('click', closePanel);
  markAllBtn?.addEventListener('click', () => {
    SF.Notif.markAllRead();
    SF.Notif.updateBadge();
  });
}

/* ════════════════════════════════════════════════════════════
   SIDEBAR NAV
════════════════════════════════════════════════════════════ */
function _setupSidebarNav() {
  document.querySelectorAll('.menu-item[data-view]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(item.dataset.view);
    });
  });

  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', _logout);
}

function _logout() {
  if (!confirm('¿Cerrar sesión?')) return;
  SF.Api.clearToken();
  location.reload();
}

/* ════════════════════════════════════════════════════════════
   MOBILE MENU
════════════════════════════════════════════════════════════ */
function _setupMobileMenu() {
  const toggle  = document.getElementById('mobileToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobileOverlay');

  toggle?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('hidden');
  });
  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.add('hidden');
  });
}

/* ════════════════════════════════════════════════════════════
   GLOBAL SEARCH
════════════════════════════════════════════════════════════ */
function _setupGlobalSearch() {
  const input = document.getElementById('global-search');
  let timeout;
  input?.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const q = input.value.trim().toLowerCase();
      if (!q) return;
      // Navigate to planner with search
      navigate('planner');
      setTimeout(() => {
        const plannerSearch = document.getElementById('planner-search');
        if (plannerSearch) { plannerSearch.value = q; plannerSearch.dispatchEvent(new Event('input')); }
      }, 300);
    }, 400);
  });
}

/* ════════════════════════════════════════════════════════════
   USER UI
════════════════════════════════════════════════════════════ */
function _updateUserUI(user) {
  if (!user) return;
  const initial = (user.name || '?')[0].toUpperCase();
  const el = (id) => document.getElementById(id);
  if (el('user-display'))   el('user-display').textContent   = user.name || 'Estudiante';
  if (el('sidebar-avatar')) el('sidebar-avatar').textContent = initial;
  if (el('header-avatar'))  el('header-avatar').textContent  = initial;
  if (el('user-xp'))        el('user-xp').textContent        = `${user.stats?.xp || 0} XP`;
}

function _setCurrentDate() {
  const el = document.getElementById('current-date');
  if (!el) return;
  el.textContent = new Date().toLocaleDateString('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

/* ─── Utils ─── */
function _esc(s) {
  const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML;
}
