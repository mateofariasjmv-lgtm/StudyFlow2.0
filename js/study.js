/* ============================================================
   StudyFlow+ — js/study.js
   Método de Estudio: técnicas, estrategias personalizadas y notas
   ============================================================ */

window.SF = window.SF || {};

const StudyManager = {

  _favorites: [],
  _notes: [],

  _techniques: [
    {
      id: 'pomodoro',
      name: 'Técnica Pomodoro',
      desc: 'Divide el estudio en bloques de 25 minutos con descansos de 5 minutos para mantener el foco.',
      icon: 'ri-timer-flash-line',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.12)',
      difficulty: 1,
      steps: [
        'Elige una tarea a realizar.',
        'Configura el temporizador en 25 minutos.',
        'Trabaja en la tarea hasta que suene la alarma.',
        'Toma un descanso de 5 minutos.',
        'Cada 4 pomodoros, toma un descanso de 15-30 minutos.',
      ],
    },
    {
      id: 'feynman',
      name: 'Método Feynman',
      desc: 'Aprende explicando el concepto con tus propias palabras, como si se lo explicaras a un niño.',
      icon: 'ri-lightbulb-flash-line',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      difficulty: 2,
      steps: [
        'Elige un concepto que deseas entender.',
        'Explícalo en papel con palabras simples, sin tecnicismos.',
        'Identifica los vacíos en tu explicación.',
        'Vuelve al material original para llenar esos vacíos.',
        'Simplifica y usa analogías hasta que suene claro.',
      ],
    },
    {
      id: 'cornell',
      name: 'Apuntes Cornell',
      desc: 'Sistema de notas estructurado en columnas: ideas principales, notas detalladas y resumen final.',
      icon: 'ri-file-list-2-line',
      color: '#6366f1',
      bg: 'rgba(99,102,241,0.12)',
      difficulty: 2,
      steps: [
        'Divide la página: columna izquierda (preguntas) y derecha (notas).',
        'Durante la clase escribe notas en la columna derecha.',
        'Luego formula preguntas clave en la columna izquierda.',
        'Resume la clase en la parte inferior de la hoja.',
        'Repasa cubriendo las notas y respondiendo tus preguntas.',
      ],
    },
    {
      id: 'mindmap',
      name: 'Mapas Mentales',
      desc: 'Representación visual de ideas conectadas desde un concepto central para facilitar la memorización.',
      icon: 'ri-mind-map',
      color: '#10b981',
      bg: 'rgba(16,185,129,0.12)',
      difficulty: 2,
      steps: [
        'Escribe el tema central en el medio de la hoja.',
        'Añade ramas principales con los subtemas más importantes.',
        'Añade sub-ramas con detalles, fechas o ejemplos.',
        'Usa colores, íconos o dibujos para reforzar la memoria.',
        'Revisa el mapa completado para consolidar el aprendizaje.',
      ],
    },
    {
      id: 'spaced',
      name: 'Repetición Espaciada',
      desc: 'Repasa el material en intervalos crecientes de tiempo para fortalecer la memoria a largo plazo.',
      icon: 'ri-calendar-check-line',
      color: '#a855f7',
      bg: 'rgba(168,85,247,0.12)',
      difficulty: 3,
      steps: [
        'Aprende el material por primera vez.',
        'Repasa al día siguiente.',
        'Repasa a los 3 días siguientes.',
        'Repasa a la semana.',
        'Repasa al mes. Ajusta los intervalos según tu recuerdo.',
      ],
    },
    {
      id: 'recall',
      name: 'Recall Activo',
      desc: 'En lugar de releer, cierra el libro y escribe todo lo que recuerdas. Refuerza las conexiones neurales.',
      icon: 'ri-brain-line',
      color: '#06b6d4',
      bg: 'rgba(6,182,212,0.12)',
      difficulty: 3,
      steps: [
        'Lee una sección del material una sola vez.',
        'Cierra el libro y escribe todo lo que recuerdas.',
        'Compara tus notas con el material original.',
        'Identifica lo que olvidaste y reléelo.',
        'Repite el proceso hasta que puedas recordar todo.',
      ],
    },
  ],

  /* ─── RENDER VIEW ─── */
  renderView() {
    this._load();
    return `
    <div class="view-title">📚 Método de Estudio</div>
    <div class="view-subtitle">Elige técnicas, estrategias y registra tu progreso de aprendizaje.</div>

    <div class="study-header">
      <div>
        <p style="font-size:0.875rem;color:var(--text-secondary)">
          ${this._favorites.length > 0
            ? `Tienes <strong style="color:var(--accent)">${this._favorites.length}</strong> técnicas favoritas.`
            : 'Marca tus técnicas favoritas para acceso rápido.'}
        </p>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn-secondary" id="show-favorites-btn">
          <i class="ri-star-line"></i> Solo favoritas
        </button>
        <button class="btn-primary" id="add-custom-btn">
          <i class="ri-add-line"></i> Técnica personalizada
        </button>
      </div>
    </div>

    <div class="techniques-grid" id="techniques-grid">
      ${this._renderTechniqueCards(this._techniques)}
    </div>

    <div class="card mt-6">
      <div class="card-header">
        <h3><i class="ri-pencil-line"></i> Notas de Sesión</h3>
      </div>
      <div class="study-notes-wrap">
        <div class="note-form-card">
          <h3 style="font-size:0.875rem;font-weight:600;margin-bottom:14px">
            <i class="ri-add-circle-line" style="color:var(--accent)"></i> Nueva nota
          </h3>
          <div class="field-group" style="margin-bottom:10px">
            <label>Técnica utilizada</label>
            <select class="field-input" id="note-method">
              ${this._techniques.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
              <option value="otra">Otra</option>
            </select>
          </div>
          <div class="field-group" style="margin-bottom:10px">
            <label>Materia / Tema</label>
            <input class="field-input" type="text" id="note-subject" placeholder="Ej: Álgebra — Ecuaciones">
          </div>
          <div class="field-group" style="margin-bottom:12px">
            <label>Notas *</label>
            <textarea class="field-input" id="note-text" rows="4" placeholder="Escribe lo que aprendiste, dificultades encontradas..."></textarea>
          </div>
          <button class="btn-primary" id="save-note-btn" style="width:100%">
            <i class="ri-save-line"></i> Guardar nota
          </button>
        </div>
        <div class="notes-list-card">
          <h3 style="font-size:0.875rem;font-weight:600;margin-bottom:14px">
            <i class="ri-history-line" style="color:var(--accent)"></i> Historial
          </h3>
          <div id="notes-list">
            ${this._renderNotes()}
          </div>
        </div>
      </div>
    </div>`;
  },

  _renderTechniqueCards(list) {
    return list.map(t => `
      <div class="technique-card ${this._favorites.includes(t.id) ? 'favorited' : ''}" data-technique="${t.id}">
        <div class="tc-top">
          <div class="technique-icon" style="background:${t.bg};color:${t.color}">
            <i class="${t.icon}"></i>
          </div>
          <button class="fav-btn ${this._favorites.includes(t.id) ? 'active' : ''}" data-fav="${t.id}" title="Favorita">
            <i class="${this._favorites.includes(t.id) ? 'ri-star-fill' : 'ri-star-line'}"></i>
          </button>
        </div>
        <div class="technique-name">${t.name}</div>
        <div class="technique-desc">${t.desc}</div>
        <div class="technique-difficulty">
          ${[1,2,3].map(d => `<div class="diff-dot${d <= t.difficulty ? ' filled' : ''}"></div>`).join('')}
          <span class="diff-label">${['Fácil','Intermedio','Avanzado'][t.difficulty-1]}</span>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn-secondary toggle-steps-btn" data-tid="${t.id}" style="flex:1;justify-content:center;font-size:0.8rem;padding:7px">
            <i class="ri-list-check"></i> Ver pasos
          </button>
          <button class="btn-primary use-technique-btn" data-tid="${t.id}" style="flex:1;justify-content:center;font-size:0.8rem;padding:7px">
            <i class="ri-play-fill"></i> Usar
          </button>
        </div>
        <div class="technique-steps" id="steps-${t.id}">
          <ol>${t.steps.map(s => `<li>${s}</li>`).join('')}</ol>
        </div>
      </div>`).join('');
  },

  _renderNotes() {
    if (this._notes.length === 0) {
      return `<div class="empty-state" style="padding:20px"><i class="ri-sticky-note-line"></i><p>Sin notas guardadas</p></div>`;
    }
    return this._notes.slice(0, 15).map(n => `
      <div class="note-item">
        <div class="note-item-method">${n.method}</div>
        ${n.subject ? `<div style="font-size:0.75rem;color:var(--accent);margin-bottom:3px">${this._esc(n.subject)}</div>` : ''}
        <div class="note-item-text">${this._esc(n.text)}</div>
        <div class="note-item-date">${new Date(n.date).toLocaleDateString('es-EC',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
        <button class="note-delete" data-noteid="${n.id}" title="Eliminar"><i class="ri-close-line"></i></button>
      </div>`).join('');
  },

  /* ─── MOUNT ─── */
  mount() {
    // Listeners de las tarjetas (favoritas, pasos, usar)
    this._attachCardListeners();

    // Show only favorites (estado en la instancia, NO en un closure que se reinicia)
    this._showingFav = false;
    document.getElementById('show-favorites-btn')?.addEventListener('click', () => {
      this._showingFav = !this._showingFav;
      const grid = document.getElementById('techniques-grid');
      const btn = document.getElementById('show-favorites-btn');
      if (!grid) return;
      if (this._showingFav) {
        const favList = this._techniques.filter(t => this._favorites.includes(t.id));
        grid.innerHTML = favList.length > 0
          ? this._renderTechniqueCards(favList)
          : `<div class="empty-state" style="grid-column:1/-1"><i class="ri-star-line"></i><p>Sin favoritas aún. Marca algunas técnicas con ⭐</p></div>`;
        if (btn) btn.innerHTML = '<i class="ri-layout-grid-line"></i> Ver todas';
      } else {
        grid.innerHTML = this._renderTechniqueCards(this._techniques);
        if (btn) btn.innerHTML = '<i class="ri-star-line"></i> Solo favoritas';
      }
      // Solo re-enlazamos los listeners de las tarjetas (no todo mount()).
      this._attachCardListeners();
    });

    // Add custom technique
    document.getElementById('add-custom-btn')?.addEventListener('click', () => {
      const name = prompt('Nombre de tu técnica personalizada:');
      if (!name?.trim()) return;
      const desc = prompt('Descripción breve:') || '';
      const custom = {
        id: 'custom_' + Date.now(),
        name: name.trim(),
        desc: desc.trim(),
        icon: 'ri-lightbulb-line',
        color: '#6366f1',
        bg: 'rgba(99,102,241,0.12)',
        difficulty: 1,
        steps: ['Define tus pasos personalizados.'],
      };
      this._techniques.push(custom);
      this._showingFav = false;
      const grid = document.getElementById('techniques-grid');
      if (grid) grid.innerHTML = this._renderTechniqueCards(this._techniques);
      const btn = document.getElementById('show-favorites-btn');
      if (btn) btn.innerHTML = '<i class="ri-star-line"></i> Solo favoritas';
      this._attachCardListeners();
    });

    // Save note
    document.getElementById('save-note-btn')?.addEventListener('click', () => this._saveNote());

    // Delete notes
    document.querySelectorAll('.note-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._deleteNote(btn.dataset.noteid);
      });
    });
  },

  /* ─── Listeners de tarjetas (re-utilizable tras cada re-render) ─── */
  _attachCardListeners() {
    // Favorites
    document.querySelectorAll('.fav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._toggleFavorite(btn.dataset.fav);
      });
    });

    // Toggle steps
    document.querySelectorAll('.toggle-steps-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const steps = document.getElementById(`steps-${btn.dataset.tid}`);
        if (steps) steps.classList.toggle('open');
        btn.innerHTML = steps?.classList.contains('open')
          ? '<i class="ri-list-check"></i> Ocultar'
          : '<i class="ri-list-check"></i> Ver pasos';
      });
    });

    // Use technique → abre la plantilla interactiva
    document.querySelectorAll('.use-technique-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tid = btn.dataset.tid;
        const known = ['pomodoro','feynman','cornell','mindmap','spaced','recall'];
        if (known.includes(tid) && window.SF.Methods) {
          SF.Methods.open(tid);
        } else if (window.SF.Toast) {
          SF.Toast.info('Esta técnica personalizada aún no tiene plantilla interactiva.');
        }
      });
    });
  },

  _toggleFavorite(id) {
    if (this._favorites.includes(id)) {
      this._favorites = this._favorites.filter(f => f !== id);
    } else {
      this._favorites.push(id);
    }
    this._save();
    // Update button state
    const btn = document.querySelector(`.fav-btn[data-fav="${id}"]`);
    if (btn) {
      btn.classList.toggle('active', this._favorites.includes(id));
      btn.innerHTML = `<i class="${this._favorites.includes(id) ? 'ri-star-fill' : 'ri-star-line'}"></i>`;
    }
    const card = document.querySelector(`.technique-card[data-technique="${id}"]`);
    if (card) card.classList.toggle('favorited', this._favorites.includes(id));
  },

  _saveNote() {
    const method  = document.getElementById('note-method')?.value || '';
    const subject = document.getElementById('note-subject')?.value.trim() || '';
    const text    = document.getElementById('note-text')?.value.trim() || '';
    if (!text) { SF.Toast?.warning('Escribe alguna nota primero.'); return; }

    const t = this._techniques.find(x => x.id === method);
    const note = {
      id: Date.now().toString(),
      method: t?.name || method,
      subject, text,
      date: Date.now(),
    };
    this._notes.unshift(note);
    this._save();

    document.getElementById('note-text').value = '';
    document.getElementById('note-subject').value = '';

    const list = document.getElementById('notes-list');
    if (list) list.innerHTML = this._renderNotes();
    this._reattachNoteDeletes();

    if (window.SF.Toast) SF.Toast.success('Nota de estudio guardada correctamente.');
  },

  _deleteNote(id) {
    this._notes = this._notes.filter(n => n.id !== id);
    this._save();
    const list = document.getElementById('notes-list');
    if (list) list.innerHTML = this._renderNotes();
    this._reattachNoteDeletes();
  },

  _reattachNoteDeletes() {
    document.querySelectorAll('.note-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._deleteNote(btn.dataset.noteid);
      });
    });
  },

  _load() {
    try {
      const d = JSON.parse(localStorage.getItem('sf_study') || '{}');
      this._favorites = d.favorites || [];
      this._notes     = d.notes || [];
    } catch { this._favorites = []; this._notes = []; }
  },

  _save() {
    localStorage.setItem('sf_study', JSON.stringify({ favorites: this._favorites, notes: this._notes }));
  },

  _esc(s) {
    const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML;
  },
};

window.SF.Study = StudyManager;
