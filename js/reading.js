/* ============================================================
   StudyFlow+ — js/reading.js
   Reto de Lectura: meta mensual, libros, progreso
   ============================================================ */

window.SF = window.SF || {};

const ReadingManager = {

  _books: [],
  _goal: 5,
  _filterStatus: 'all',

  /* ─── RENDER VIEW ─── */
  renderView() {
    this._load();
    const completed  = this._books.filter(b => b.status === 'completado').length;
    const reading    = this._books.filter(b => b.status === 'leyendo').length;
    const want       = this._books.filter(b => b.status === 'quiero').length;
    const pct        = Math.min(100, Math.round((completed / this._goal) * 100)) || 0;

    return `
    <div class="view-title">📖 Reto de Lectura</div>
    <div class="view-subtitle">Establece tu meta mensual y registra los libros que lees.</div>

    <!-- Overview -->
    <div class="reading-overview">
      <div class="reading-goal-card">
        <h3><i class="ri-trophy-line" style="color:var(--yellow)"></i> Meta del Mes</h3>
        <div class="goal-nums">${completed} <span>/ ${this._goal} libros</span></div>
        <div class="progress-bar" style="margin:8px 0">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="progress-pct">${pct}% completado</div>
        <button class="btn-secondary" id="edit-goal-btn" style="margin-top:10px;font-size:0.78rem;padding:6px 14px">
          <i class="ri-edit-line"></i> Cambiar meta
        </button>
      </div>

      <div class="reading-goal-card">
        <h3><i class="ri-book-open-line" style="color:var(--blue)"></i> Leyendo Ahora</h3>
        <div class="goal-nums">${reading}</div>
        <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px">
          ${reading === 1 ? 'libro en progreso' : 'libros en progreso'}
        </div>
      </div>

      <div class="reading-goal-card">
        <h3><i class="ri-bookmark-line" style="color:var(--purple)"></i> Lista de Deseos</h3>
        <div class="goal-nums">${want}</div>
        <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px">
          ${want === 1 ? 'libro por leer' : 'libros por leer'}
        </div>
      </div>
    </div>

    <!-- Books header -->
    <div class="books-header">
      <div class="books-filter">
        <button class="bfilter ${this._filterStatus==='all'?'active':''}" data-bfilter="all">Todos (${this._books.length})</button>
        <button class="bfilter ${this._filterStatus==='leyendo'?'active':''}" data-bfilter="leyendo">Leyendo (${reading})</button>
        <button class="bfilter ${this._filterStatus==='completado'?'active':''}" data-bfilter="completado">Completados (${completed})</button>
        <button class="bfilter ${this._filterStatus==='quiero'?'active':''}" data-bfilter="quiero">Lista (${want})</button>
      </div>
      <button class="btn-primary" id="add-book-btn">
        <i class="ri-add-line"></i> Añadir Libro
      </button>
    </div>

    <!-- Books grid -->
    <div class="books-grid" id="books-grid">
      ${this._renderBooks()}
    </div>`;
  },

  _renderBooks() {
    const list = this._filterStatus === 'all'
      ? this._books
      : this._books.filter(b => b.status === this._filterStatus);

    if (list.length === 0) {
      const msgs = {
        all: 'Agrega tu primer libro para comenzar el reto.',
        leyendo: 'No tienes libros en progreso.',
        completado: 'Aún no has completado ningún libro este mes.',
        quiero: 'Tu lista de deseos está vacía.',
      };
      return `<div class="empty-state" style="grid-column:1/-1;padding:48px">
        <i class="ri-book-2-line"></i>
        <p>${msgs[this._filterStatus] || 'Sin libros.'}</p>
        <span>¡Añade un libro para empezar!</span>
      </div>`;
    }

    return list.map(b => this._bookCardHTML(b)).join('');
  },

  _bookCardHTML(b) {
    const spineColors = {
      quiero:     { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', emoji: '📌' },
      leyendo:    { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6', emoji: '📖' },
      completado: { bg: 'rgba(16,185,129,0.15)',  color: '#10b981', emoji: '✅' },
    };
    const style = spineColors[b.status] || spineColors.quiero;
    const badgeCls = `bs-${b.status}`;
    const statusLabel = { quiero: '📌 Quiero leer', leyendo: '📖 Leyendo', completado: '✅ Completado' };

    return `
    <div class="book-card" data-bookid="${b.id}">
      <div class="book-top">
        <div class="book-spine" style="background:${style.bg};color:${style.color}">
          ${style.emoji}
        </div>
        <div class="book-meta">
          <div class="book-title">${this._esc(b.title)}</div>
          <div class="book-author">${this._esc(b.author || 'Autor desconocido')}</div>
          ${b.pages ? `<div class="book-pages">${b.pages} págs.</div>` : ''}
        </div>
      </div>
      <span class="book-status-badge ${badgeCls}">${statusLabel[b.status]}</span>
      ${b.notes ? `<div class="book-notes-text">"${this._esc(b.notes)}"</div>` : ''}
      <div style="font-size:0.7rem;color:var(--text-muted)">
        Añadido ${new Date(b.createdAt).toLocaleDateString('es-EC',{day:'numeric',month:'short'})}
      </div>
      <div class="book-actions">
        ${b.status !== 'leyendo' && b.status !== 'completado'
          ? `<button class="btn-secondary book-status-btn" data-bid="${b.id}" data-status="leyendo"
               style="flex:1;font-size:0.75rem;padding:6px">
               <i class="ri-book-open-line"></i> Empezar
             </button>` : ''}
        ${b.status === 'leyendo'
          ? `<button class="btn-primary book-status-btn" data-bid="${b.id}" data-status="completado"
               style="flex:1;font-size:0.75rem;padding:6px">
               <i class="ri-check-line"></i> Completar
             </button>` : ''}
        <button class="icon-btn book-edit-btn" data-bid="${b.id}" title="Editar"
          style="width:30px;height:30px;font-size:.85rem">
          <i class="ri-edit-line"></i>
        </button>
        <button class="icon-btn book-del-btn" data-bid="${b.id}" title="Eliminar"
          style="width:30px;height:30px;font-size:.85rem;color:var(--red)">
          <i class="ri-delete-bin-line"></i>
        </button>
      </div>
    </div>`;
  },

  /* ─── MOUNT ─── */
  mount() {
    // Filter buttons
    document.querySelectorAll('[data-bfilter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this._filterStatus = btn.dataset.bfilter;
        document.querySelectorAll('[data-bfilter]').forEach(b => b.classList.toggle('active', b.dataset.bfilter === this._filterStatus));
        const grid = document.getElementById('books-grid');
        if (grid) grid.innerHTML = this._renderBooks();
        this._attachBookActions();
      });
    });

    // Add book button
    document.getElementById('add-book-btn')?.addEventListener('click', () => this._openBookModal());

    // Edit goal
    document.getElementById('edit-goal-btn')?.addEventListener('click', () => {
      const ng = parseInt(prompt('Nueva meta mensual (libros):', this._goal));
      if (ng && ng > 0) {
        this._goal = ng;
        this._save();
        const el = document.getElementById('app-view');
        if (el) {
          el.innerHTML = this.renderView();
          this.mount();
        }
      }
    });

    // Book modal form
    document.getElementById('close-book-modal')?.addEventListener('click', () => this._closeBookModal());
    document.getElementById('cancel-book-modal')?.addEventListener('click', () => this._closeBookModal());
    document.getElementById('book-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this._saveBook();
    });

    this._attachBookActions();
  },

  _attachBookActions() {
    // Status change buttons
    document.querySelectorAll('.book-status-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._changeStatus(btn.dataset.bid, btn.dataset.status);
      });
    });

    // Edit
    document.querySelectorAll('.book-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._openBookModal(btn.dataset.bid);
      });
    });

    // Delete
    document.querySelectorAll('.book-del-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._deleteBook(btn.dataset.bid);
      });
    });
  },

  /* ─── BOOK MODAL ─── */
  _openBookModal(id = null) {
    const modal = document.getElementById('book-modal');
    if (!modal) return;
    document.getElementById('book-form').reset();
    document.getElementById('book-edit-id').value = '';
    document.getElementById('book-modal-title').innerHTML = '<i class="ri-book-2-line"></i> Añadir Libro';

    if (id) {
      const b = this._books.find(x => x.id === id);
      if (!b) return;
      document.getElementById('book-modal-title').innerHTML = '<i class="ri-edit-line"></i> Editar Libro';
      document.getElementById('book-edit-id').value = b.id;
      document.getElementById('book-title').value  = b.title;
      document.getElementById('book-author').value = b.author || '';
      document.getElementById('book-pages').value  = b.pages || '';
      document.getElementById('book-status').value = b.status;
      document.getElementById('book-notes').value  = b.notes || '';
    }

    modal.classList.remove('hidden');
    document.getElementById('book-title').focus();
  },

  _closeBookModal() {
    const modal = document.getElementById('book-modal');
    if (modal) modal.classList.add('hidden');
  },

  _saveBook() {
    const id     = document.getElementById('book-edit-id').value;
    const title  = document.getElementById('book-title').value.trim();
    const author = document.getElementById('book-author').value.trim();
    const pages  = parseInt(document.getElementById('book-pages').value) || null;
    const status = document.getElementById('book-status').value;
    const notes  = document.getElementById('book-notes').value.trim();

    if (!title) { SF.Toast?.warning('El título es obligatorio.'); return; }

    if (id) {
      const idx = this._books.findIndex(b => b.id === id);
      if (idx >= 0) Object.assign(this._books[idx], { title, author, pages, status, notes });
    } else {
      this._books.unshift({ id: Date.now().toString(), title, author, pages, status, notes, createdAt: Date.now() });
    }

    if (status === 'completado') {
      SF.Notif.add({
        title: '📖 ¡Libro completado!',
        msg: `Terminaste "${title}". ¡Excelente lectura!`,
        urgency: 4,
      });
      SF.Api.syncStats({ xp: 30 }).catch(() => {});
    }

    this._save();
    this._closeBookModal();
    if (window.SF.Toast) SF.Toast.success(id ? 'Libro actualizado correctamente.' : 'Lectura registrada correctamente.');

    // Re-render view
    const view = document.getElementById('app-view');
    if (view) {
      view.innerHTML = this.renderView();
      this.mount();
    }
  },

  _changeStatus(id, newStatus) {
    const b = this._books.find(x => x.id === id);
    if (!b) return;
    b.status = newStatus;
    this._save();
    if (newStatus === 'completado') {
      SF.Notif.add({ title: '📖 ¡Libro completado!', msg: `¡Completaste "${b.title}"!`, urgency: 4 });
      if (window.SF.Toast) SF.Toast.success(`¡Completaste "${b.title}"! 📖`);
    }
    // Refresh
    const grid = document.getElementById('books-grid');
    if (grid) grid.innerHTML = this._renderBooks();
    this._attachBookActions();
    // Refresh stats
    const view = document.getElementById('app-view');
    if (view) { view.innerHTML = this.renderView(); this.mount(); }
  },

  _deleteBook(id) {
    const b = this._books.find(x => x.id === id);
    if (!b || !confirm(`¿Eliminar "${b.title}"?`)) return;
    this._books = this._books.filter(x => x.id !== id);
    this._save();
    const view = document.getElementById('app-view');
    if (view) { view.innerHTML = this.renderView(); this.mount(); }
  },

  /* ─── PERSIST ─── */
  _load() {
    try {
      const d = JSON.parse(localStorage.getItem('sf_reading') || '{}');
      this._books = d.books || [];
      this._goal  = d.goal  || 5;
    } catch { this._books = []; this._goal = 5; }
  },

  _save() {
    localStorage.setItem('sf_reading', JSON.stringify({ books: this._books, goal: this._goal }));
  },

  _esc(s) {
    const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML;
  },
};

window.SF.Reading = ReadingManager;
