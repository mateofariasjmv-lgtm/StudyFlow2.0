/* ============================================================
   StudyFlow+ — js/tasks.js
   Gestor de Tareas — CRUD contra MongoDB Atlas via ApiService
   ============================================================ */

window.SF = window.SF || {};

const TaskManager = {
  _tasks: [],

  /* ── Load from server ── */
  async load() {
    if (!SF.Api.isLoggedIn()) return;
    try {
      const data = await SF.Api.getTasks();
      if (data.success) {
        this._tasks = data.tasks || [];
        SF.Notif.checkDueDates();
      }
    } catch (e) {
      console.warn('[Tasks] No se pudo cargar desde el servidor:', e.message);
    }
    return this._tasks;
  },

  getAll()   { return this._tasks; },
  getPending(){ return this._tasks.filter(t => !t.done); },
  getDone()  { return this._tasks.filter(t => t.done); },

  getByDate(dateStr) {
    // dateStr like '2026-06-21'
    return this._tasks.filter(t => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate).toISOString().slice(0, 10) === dateStr;
    });
  },

  getForRange(startDate, endDate) {
    return this._tasks.filter(t => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d >= startDate && d <= endDate;
    });
  },

  /* ── Render task list view (for Dashboard) ── */
  renderList(tasks, containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (!tasks || tasks.length === 0) {
      el.innerHTML = `<div class="empty-state">
        <i class="ri-checkbox-circle-line"></i>
        <p>Sin tareas pendientes</p>
        <span>¡Excelente trabajo!</span>
      </div>`;
      return;
    }

    el.innerHTML = tasks.slice(0, 8).map(t => this._taskHTML(t)).join('');
    el.querySelectorAll('.task-check').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = el.dataset.id;
        const done = el.dataset.done === 'true';
        this.toggle(id, done);
      });
    });
    el.querySelectorAll('.btn-edit-task').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openModal(el.dataset.id);
      });
    });
    el.querySelectorAll('.btn-del-task').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.delete(el.dataset.id);
      });
    });
  },

  _taskHTML(t) {
    const due = t.dueDate ? this._dueLabel(t.dueDate) : null;
    return `
      <div class="task-item">
        <div class="task-check ${t.done ? 'done' : ''}"
             data-id="${t._id}" data-done="${t.done}" title="${t.done ? 'Marcar pendiente' : 'Marcar completada'}"></div>
        <div class="task-body">
          <div class="task-name ${t.done ? 'done-text' : ''}">${this._esc(t.text)}</div>
          <div class="task-meta">
            <span class="task-badge badge-${t.priority}">${t.priority}</span>
            ${t.subject ? `<span style="font-size:0.72rem;color:var(--text-muted)">${this._esc(t.subject)}</span>` : ''}
            ${due ? `<span class="task-due ${due.cls}"><i class="ri-time-line"></i>${due.label}</span>` : ''}
          </div>
        </div>
        <div class="task-actions">
          <button class="icon-btn btn-edit-task" data-id="${t._id}" title="Editar" style="width:28px;height:28px;font-size:.85rem">
            <i class="ri-edit-line"></i>
          </button>
          <button class="icon-btn btn-del-task" data-id="${t._id}" title="Eliminar" style="width:28px;height:28px;font-size:.85rem;color:var(--red)">
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>
      </div>`;
  },

  _dueLabel(dateStr) {
    const now = new Date();
    const due = new Date(dateStr);
    const diff = due - now;
    const h = diff / 3600000;
    if (diff < 0)       return { label: 'Vencida', cls: 'due-urgent1' };
    if (h <= 1)         return { label: 'En 1h', cls: 'due-urgent2' };
    if (h <= 24)        return { label: 'Hoy', cls: 'due-urgent2' };
    if (h <= 72)        return { label: `En ${Math.round(h/24)}d`, cls: 'due-urgent3' };
    const d = due.toLocaleDateString('es-EC', { day:'numeric', month:'short' });
    return { label: d, cls: '' };
  },

  _esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  },

  /* ── Modal ── */
  openModal(id = null) {
    const modal   = document.getElementById('task-modal');
    const title   = document.getElementById('task-modal-title');
    const form    = document.getElementById('task-form');

    if (!modal) return;
    form.reset();
    document.getElementById('task-edit-id').value = '';

    if (id) {
      const t = this._tasks.find(x => x._id === id);
      if (!t) return;
      title.innerHTML = `<i class="ri-edit-line"></i> Editar Tarea`;
      document.getElementById('task-edit-id').value  = t._id;
      document.getElementById('task-text').value     = t.text;
      document.getElementById('task-description').value = t.description || '';
      document.getElementById('task-priority').value = t.priority;
      document.getElementById('task-category').value = t.category;
      document.getElementById('task-subject').value  = t.subject || '';
      if (t.dueDate) {
        const local = new Date(t.dueDate);
        local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
        document.getElementById('task-due').value = local.toISOString().slice(0, 16);
      }
    } else {
      title.innerHTML = `<i class="ri-add-circle-line"></i> Nueva Tarea`;
      // Default due = tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 0, 0);
      tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
      document.getElementById('task-due').value = tomorrow.toISOString().slice(0, 16);
    }

    modal.classList.remove('hidden');
    document.getElementById('task-text').focus();
  },

  closeModal() {
    const modal = document.getElementById('task-modal');
    if (modal) modal.classList.add('hidden');
  },

  /* ── CRUD ── */
  async save(formData) {
    if (!SF.Api.isLoggedIn()) return;
    const id = formData.id;
    const payload = {
      text:        formData.text.trim(),
      description: formData.description.trim(),
      priority:    formData.priority,
      category:    formData.category,
      subject:     formData.subject.trim(),
      dueDate:     formData.dueDate || null,
    };

    try {
      let data;
      if (id) {
        data = await SF.Api.updateTask(id, payload);
        if (data.success) {
          const idx = this._tasks.findIndex(t => t._id === id);
          if (idx >= 0) this._tasks[idx] = data.task;
        }
      } else {
        data = await SF.Api.createTask(payload);
        if (data.success) this._tasks.unshift(data.task);
      }
      this.closeModal();
      SF.Notif.checkDueDates();
      this._refreshCurrentView();
      if (window.SF.Toast) SF.Toast.success(id ? 'Tarea actualizada correctamente.' : 'Tarea creada correctamente.');
    } catch (e) {
      if (window.SF.Toast) SF.Toast.error('No se pudo guardar: ' + e.message);
      else alert('No se pudo guardar la tarea: ' + e.message);
    }
  },

  async toggle(id, currentDone) {
    try {
      const data = await SF.Api.updateTask(id, { done: !currentDone });
      if (data.success) {
        const idx = this._tasks.findIndex(t => t._id === id);
        if (idx >= 0) this._tasks[idx] = data.task;
        // NOTE (fix CRÍTICO 1): No incrementamos un contador en MongoDB aquí.
        // "tareas completadas" se DERIVA del estado real (getDone().length),
        // por lo que marcar/desmarcar/re-marcar nunca duplica el conteo.
        if (!currentDone) {
          // Solo damos feedback visual; el conteo es derivado, no acumulado.
          if (window.SF.Toast) SF.Toast.success(`Completaste: "${data.task.text}"`);
        }
        this._refreshCurrentView();
      }
    } catch (e) {
      if (window.SF.Toast) SF.Toast.error('No se pudo actualizar la tarea.');
      console.error(e);
    }
  },

  async delete(id) {
    const task = this._tasks.find(t => t._id === id);
    if (!task) return;
    if (!confirm(`¿Eliminar "${task.text}"?`)) return;
    try {
      const data = await SF.Api.deleteTask(id);
      if (data.success) {
        this._tasks = this._tasks.filter(t => t._id !== id);
        this._refreshCurrentView();
        if (window.SF.Toast) SF.Toast.info('Tarea eliminada.');
      }
    } catch (e) {
      if (window.SF.Toast) SF.Toast.error('No se pudo eliminar: ' + e.message);
      else alert('No se pudo eliminar: ' + e.message);
    }
  },

  _refreshCurrentView() {
    // Emit custom event so current view can re-render task lists
    document.dispatchEvent(new CustomEvent('sf:tasks-updated'));
  },
};

window.SF.Tasks = TaskManager;
