/* ============================================================
   StudyFlow+ — js/planner.js
   Planificador Inteligente: Día, Semana, Mes
   ============================================================ */

window.SF = window.SF || {};

const PlannerManager = {

  _currentView: 'week',   // 'day' | 'week' | 'month'
  _currentDate: new Date(),

  /* ─── RENDER VIEW ─── */
  renderView() {
    return `
    <div class="view-title">📅 Planificador Inteligente</div>
    <div class="view-subtitle">Organiza tus tareas, visualiza tu agenda.</div>

    <div class="planner-toolbar">
      <div class="view-tabs">
        <button class="vtab ${this._currentView === 'day' ? 'active' : ''}" data-pview="day">Día</button>
        <button class="vtab ${this._currentView === 'week' ? 'active' : ''}" data-pview="week">Semana</button>
        <button class="vtab ${this._currentView === 'month' ? 'active' : ''}" data-pview="month">Mes</button>
      </div>

      <div class="period-nav">
        <button id="prev-period"><i class="ri-arrow-left-s-line"></i></button>
        <span id="period-label"></span>
        <button id="next-period"><i class="ri-arrow-right-s-line"></i></button>
      </div>

      <div class="planner-filters">
        <select id="filter-priority">
          <option value="">Todas las prioridades</option>
          <option value="alta">🔴 Alta</option>
          <option value="media">🟡 Media</option>
          <option value="baja">🟢 Baja</option>
        </select>
        <input type="text" id="planner-search" placeholder="🔍 Buscar tarea...">
      </div>

      <button class="btn-primary" id="planner-new-task">
        <i class="ri-add-line"></i> Nueva Tarea
      </button>
    </div>

    <div id="planner-content"></div>`;
  },

  /* ─── MOUNT ─── */
  mount() {
    document.querySelectorAll('[data-pview]').forEach(btn => {
      btn.addEventListener('click', () => {
        this._currentView = btn.dataset.pview;
        document.querySelectorAll('[data-pview]').forEach(b => b.classList.toggle('active', b.dataset.pview === this._currentView));
        this._renderContent();
      });
    });

    document.getElementById('prev-period')?.addEventListener('click', () => this._navigate(-1));
    document.getElementById('next-period')?.addEventListener('click', () => this._navigate(1));

    document.getElementById('planner-new-task')?.addEventListener('click', () => {
      SF.Tasks.openModal();
    });

    document.getElementById('filter-priority')?.addEventListener('change', () => this._renderContent());
    document.getElementById('planner-search')?.addEventListener('input',  () => this._renderContent());

    document.addEventListener('sf:tasks-updated', () => {
      if (document.getElementById('planner-content')) this._renderContent();
    });

    this._renderContent();
  },

  _navigate(dir) {
    const v = this._currentView;
    if (v === 'day') {
      this._currentDate.setDate(this._currentDate.getDate() + dir);
    } else if (v === 'week') {
      this._currentDate.setDate(this._currentDate.getDate() + dir * 7);
    } else {
      this._currentDate.setMonth(this._currentDate.getMonth() + dir);
    }
    this._renderContent();
  },

  _getFilteredTasks() {
    let tasks = SF.Tasks.getAll();
    const priority = document.getElementById('filter-priority')?.value || '';
    const search   = (document.getElementById('planner-search')?.value || '').toLowerCase();
    if (priority) tasks = tasks.filter(t => t.priority === priority);
    if (search)   tasks = tasks.filter(t => t.text.toLowerCase().includes(search));
    return tasks;
  },

  /* ─── RENDER CONTENT ─── */
  _renderContent() {
    const el = document.getElementById('planner-content');
    if (!el) return;

    const label = document.getElementById('period-label');
    const tasks  = this._getFilteredTasks();

    if (this._currentView === 'month') {
      if (label) label.textContent = this._currentDate.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
      el.innerHTML = this._renderMonth(tasks);
    } else if (this._currentView === 'week') {
      const { start, end } = this._weekRange(this._currentDate);
      if (label) label.textContent = `${start.toLocaleDateString('es-EC',{day:'numeric',month:'short'})} – ${end.toLocaleDateString('es-EC',{day:'numeric',month:'short',year:'numeric'})}`;
      el.innerHTML = this._renderWeek(start, tasks);
    } else {
      if (label) label.textContent = this._currentDate.toLocaleDateString('es-EC', { weekday:'long', day:'numeric', month:'long' });
      el.innerHTML = this._renderDay(this._currentDate, tasks);
    }

    // Attach task row listeners
    el.querySelectorAll('.planner-task-row[data-taskid]').forEach(row => {
      row.addEventListener('click', () => SF.Tasks.openModal(row.dataset.taskid));
    });
    el.querySelectorAll('.ptask-check').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = el.dataset.id;
        const done = el.dataset.done === 'true';
        SF.Tasks.toggle(id, done);
      });
    });
    el.querySelectorAll('.ptask-del').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        SF.Tasks.delete(el.dataset.id);
      });
    });
  },

  /* ─── MONTH VIEW ─── */
  _renderMonth(tasks) {
    const year  = this._currentDate.getFullYear();
    const month = this._currentDate.getMonth();
    const first = new Date(year, month, 1);
    const last  = new Date(year, month + 1, 0);
    const startDow = (first.getDay() + 6) % 7; // Monday first

    const days = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
    let html = `<div class="cal-grid">
      <div class="cal-weekdays">${days.map(d => `<div class="cal-wd">${d}</div>`).join('')}</div>
      <div class="cal-days">`;

    const today = new Date().toISOString().slice(0, 10);

    // Blank cells before first day
    for (let i = 0; i < startDow; i++) html += '<div class="cal-day other-month"></div>';

    for (let d = 1; d <= last.getDate(); d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday = dateStr === today;
      const dayTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate).toISOString().slice(0,10) === dateStr);
      const dots = dayTasks.slice(0, 3).map(t => {
        const colors = { alta: 'var(--red)', media: 'var(--yellow)', baja: 'var(--green)' };
        return `<span class="cal-dot" style="background:${colors[t.priority]||'var(--accent)'}"></span>`;
      }).join('');
      html += `<div class="cal-day${isToday ? ' today' : ''}" data-date="${dateStr}">
        <div class="cal-day-num">${d}</div>
        ${dots}
        ${dayTasks.length > 3 ? `<div style="font-size:0.6rem;color:var(--text-muted)">+${dayTasks.length-3}</div>` : ''}
      </div>`;
    }

    html += '</div></div>';
    return html;
  },

  /* ─── WEEK VIEW ─── */
  _renderWeek(startOfWeek, tasks) {
    const today = new Date().toISOString().slice(0, 10);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      days.push(d);
    }

    const hasAny = days.some(d => tasks.some(t => t.dueDate && new Date(t.dueDate).toISOString().slice(0,10) === d.toISOString().slice(0,10)));
    if (!hasAny) {
      return `<div class="planner-list">${days.map(d => this._daySection(d, [], today)).join('')}</div>`;
    }

    return `<div class="planner-list">${days.map(d => {
      const ds = d.toISOString().slice(0, 10);
      const dt = tasks.filter(t => t.dueDate && new Date(t.dueDate).toISOString().slice(0,10) === ds);
      return this._daySection(d, dt, today);
    }).join('')}</div>`;
  },

  /* ─── DAY VIEW ─── */
  _renderDay(date, tasks) {
    const today = new Date().toISOString().slice(0, 10);
    const ds = date.toISOString().slice(0, 10);
    const dayTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate).toISOString().slice(0,10) === ds);
    // Also show tasks with no due date on "today"
    const noDue = (ds === today) ? tasks.filter(t => !t.dueDate) : [];
    const all = [...dayTasks, ...noDue];
    return `<div class="planner-list">${this._daySection(date, all, today)}</div>`;
  },

  _daySection(date, tasks, todayStr) {
    const ds   = date.toISOString().slice(0, 10);
    const isToday = ds === todayStr;
    const label = isToday
      ? '📍 Hoy'
      : date.toLocaleDateString('es-EC', { weekday:'long', day:'numeric', month:'short' });

    let inner = '';
    if (tasks.length === 0) {
      inner = `<div style="padding:14px 16px;font-size:0.8rem;color:var(--text-muted)">Sin tareas para este día.</div>`;
    } else {
      inner = tasks.map(t => this._taskRow(t)).join('');
    }

    return `
      <div class="planner-day-section">
        <div class="planner-day-label" style="${isToday ? 'color:var(--accent)' : ''}">${label}</div>
        <div class="planner-day-tasks">${inner}</div>
      </div>`;
  },

  _taskRow(t) {
    const pdCls = `pd-${t.priority || 'baja'}`;
    return `
      <div class="planner-task-row" data-taskid="${t._id}">
        <div class="ptask-check task-check ${t.done ? 'done' : ''}"
             data-id="${t._id}" data-done="${t.done}"
             title="${t.done ? 'Marcar pendiente' : 'Completar'}"></div>
        <div class="priority-dot ${pdCls}"></div>
        <div class="planner-task-text ${t.done ? 'done-text' : ''}">${this._esc(t.text)}</div>
        <div class="planner-task-info">
          ${t.subject ? `<i class="ri-book-line"></i>${this._esc(t.subject)}` : ''}
        </div>
        <div class="task-actions" style="opacity:1">
          <button class="icon-btn ptask-del" data-id="${t._id}"
            style="width:26px;height:26px;font-size:.8rem;color:var(--red)" title="Eliminar">
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>
      </div>`;
  },

  _weekRange(date) {
    const d = new Date(date);
    const dow = (d.getDay() + 6) % 7; // Monday=0
    d.setDate(d.getDate() - dow);
    d.setHours(0, 0, 0, 0);
    const start = new Date(d);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    const end = new Date(d);
    return { start, end };
  },

  _esc(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  },
};

window.SF.Planner = PlannerManager;
