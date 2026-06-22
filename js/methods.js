/* ============================================================
   StudyFlow+ — js/methods.js
   Plantillas interactivas para cada Método de Estudio.
   Cada método abre su PROPIA interfaz personalizada.
   Persistencia automática en localStorage (sf_method_*).
   ============================================================ */

window.SF = window.SF || {};

const MethodTemplates = {

  _active: null,         // método abierto actualmente
  _saveTimer: null,

  /* ── Abrir una plantilla en un overlay modal ── */
  open(methodId) {
    this._active = methodId;
    const overlay = this._ensureOverlay();
    const body = document.getElementById('method-template-body');
    const titleEl = document.getElementById('method-template-title');

    const meta = this._meta(methodId);
    titleEl.innerHTML = `<span style="font-size:1.3rem">${meta.emoji}</span> ${meta.name}`;

    body.innerHTML = this._renderTemplate(methodId);
    overlay.classList.remove('hidden');
    this._mountTemplate(methodId);

    if (window.SF.Toast) SF.Toast.info(`Plantilla "${meta.name}" abierta. Tu progreso se guarda automáticamente.`);
  },

  close() {
    const overlay = document.getElementById('method-template-overlay');
    if (overlay) overlay.classList.add('hidden');
    this._active = null;
  },

  _meta(id) {
    return {
      pomodoro: { emoji: '🍅', name: 'Técnica Pomodoro', color: '#ef4444' },
      feynman:  { emoji: '💡', name: 'Método Feynman', color: '#f59e0b' },
      cornell:  { emoji: '📝', name: 'Apuntes Cornell', color: '#6366f1' },
      mindmap:  { emoji: '🧠', name: 'Mapa Mental', color: '#10b981' },
      spaced:   { emoji: '🔄', name: 'Repetición Espaciada', color: '#a855f7' },
      recall:   { emoji: '🎯', name: 'Recall Activo', color: '#06b6d4' },
    }[id] || { emoji: '📚', name: 'Método', color: '#6366f1' };
  },

  _ensureOverlay() {
    let overlay = document.getElementById('method-template-overlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'method-template-overlay';
    overlay.className = 'modal-overlay hidden';
    overlay.innerHTML = `
      <div class="method-template-card">
        <div class="method-template-header">
          <h3 id="method-template-title"></h3>
          <div style="display:flex;gap:8px;align-items:center">
            <span class="method-saved-badge" id="method-saved-badge">
              <i class="ri-checkbox-circle-line"></i> Guardado
            </span>
            <button class="icon-btn" id="method-template-close"><i class="ri-close-line"></i></button>
          </div>
        </div>
        <div class="method-template-body" id="method-template-body"></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#method-template-close').addEventListener('click', () => this.close());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this.close(); });
    return overlay;
  },

  _flashSaved() {
    const badge = document.getElementById('method-saved-badge');
    if (!badge) return;
    badge.classList.add('flash');
    setTimeout(() => badge.classList.remove('flash'), 600);
  },

  /* ── Persistencia ── */
  _load(id) {
    try { return JSON.parse(localStorage.getItem('sf_method_' + id) || '{}'); }
    catch { return {}; }
  },
  _save(id, data) {
    localStorage.setItem('sf_method_' + id, JSON.stringify(data));
    this._flashSaved();
  },
  _autosave(id, getData) {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._save(id, getData()), 600);
  },

  /* ════════════════════════════════════════════════════════
     RENDER por método
  ════════════════════════════════════════════════════════ */
  _renderTemplate(id) {
    switch (id) {
      case 'pomodoro': return this._tplPomodoro();
      case 'feynman':  return this._tplFeynman();
      case 'cornell':  return this._tplCornell();
      case 'mindmap':  return this._tplMindmap();
      case 'spaced':   return this._tplSpaced();
      case 'recall':   return this._tplRecall();
      default: return '<p>Plantilla no disponible.</p>';
    }
  },
  _mountTemplate(id) {
    switch (id) {
      case 'pomodoro': return this._mountPomodoro();
      case 'feynman':  return this._mountFeynman();
      case 'cornell':  return this._mountCornell();
      case 'mindmap':  return this._mountMindmap();
      case 'spaced':   return this._mountSpaced();
      case 'recall':   return this._mountRecall();
    }
  },

  /* ───────────────────────── 🍅 POMODORO ───────────────────────── */
  _tplPomodoro() {
    const d = this._load('pomodoro');
    return `
    <div class="mt-intro">Temporizador enfocado con registro de productividad. Tu sesión se guarda automáticamente.</div>
    <div class="pomo-template">
      <div class="pomo-template-timer">
        <div class="pomo-tpl-time" id="ptpl-time">25:00</div>
        <div class="pomo-tpl-phase" id="ptpl-phase">Sesión de estudio</div>
        <div class="timer-controls" style="justify-content:center;margin-top:16px">
          <button class="timer-btn tbtn-reset" id="ptpl-reset"><i class="ri-refresh-line"></i></button>
          <button class="timer-btn tbtn-start" id="ptpl-start"><i class="ri-play-fill"></i></button>
          <button class="timer-btn tbtn-pause hidden" id="ptpl-pause"><i class="ri-pause-fill"></i></button>
        </div>
      </div>
      <div class="pomo-template-stats">
        <div class="mt-stat"><div class="mt-stat-val" id="ptpl-completed">${d.completed || 0}</div><div class="mt-stat-lbl">Sesiones completadas</div></div>
        <div class="mt-stat"><div class="mt-stat-val" id="ptpl-shorts">${d.shorts || 0}</div><div class="mt-stat-lbl">Descansos cortos</div></div>
        <div class="mt-stat"><div class="mt-stat-val" id="ptpl-longs">${d.longs || 0}</div><div class="mt-stat-lbl">Descansos largos</div></div>
        <div class="mt-stat"><div class="mt-stat-val" id="ptpl-minutes">${d.minutes || 0}</div><div class="mt-stat-lbl">Minutos enfocados</div></div>
      </div>
    </div>
    <div class="mt-field">
      <label>📋 Registro de productividad — ¿en qué trabajaste?</label>
      <textarea id="ptpl-log" class="field-input" rows="3" placeholder="Ej: Repasé el capítulo 3 de Biología...">${this._esc(d.log || '')}</textarea>
    </div>`;
  },

  _mountPomodoro() {
    const id = 'pomodoro';
    let running = false, interval = null, phase = 'work', remaining = 25 * 60, completed = this._load(id).completed || 0;
    const cfg = { work: 25, short: 5, long: 15 };

    const timeEl  = document.getElementById('ptpl-time');
    const phaseEl = document.getElementById('ptpl-phase');
    const startB  = document.getElementById('ptpl-start');
    const pauseB  = document.getElementById('ptpl-pause');
    const resetB  = document.getElementById('ptpl-reset');

    const render = () => {
      const m = String(Math.floor(remaining / 60)).padStart(2, '0');
      const s = String(remaining % 60).padStart(2, '0');
      if (timeEl) timeEl.textContent = `${m}:${s}`;
    };

    const persist = (patch = {}) => {
      const cur = this._load(id);
      this._save(id, { ...cur, completed,
        minutes: (cur.minutes || 0) + (patch.addMin || 0),
        shorts: (cur.shorts || 0) + (patch.addShort || 0),
        longs:  (cur.longs  || 0) + (patch.addLong  || 0),
        log: document.getElementById('ptpl-log')?.value || cur.log || '',
      });
      const el = (x) => document.getElementById(x);
      const fresh = this._load(id);
      if (el('ptpl-completed')) el('ptpl-completed').textContent = fresh.completed || 0;
      if (el('ptpl-shorts'))    el('ptpl-shorts').textContent    = fresh.shorts || 0;
      if (el('ptpl-longs'))     el('ptpl-longs').textContent     = fresh.longs || 0;
      if (el('ptpl-minutes'))   el('ptpl-minutes').textContent   = fresh.minutes || 0;
    };

    const tick = () => {
      remaining--;
      render();
      if (remaining <= 0) {
        clearInterval(interval); running = false;
        startB.classList.remove('hidden'); pauseB.classList.add('hidden');
        if (phase === 'work') {
          completed++;
          persist({ addMin: cfg.work });
          // sincroniza minutos reales de enfoque con backend (evento real, no duplica)
          SF.Api.syncStats({ minutes: cfg.work, pomodoros: 1, sessions: 1, xp: 50 }).catch(() => {});
          const isLong = completed % 4 === 0;
          phase = isLong ? 'long' : 'short';
          remaining = (isLong ? cfg.long : cfg.short) * 60;
          phaseEl.textContent = isLong ? 'Descanso largo' : 'Descanso corto';
          persist(isLong ? { addLong: 1 } : { addShort: 1 });
          if (SF.Toast) SF.Toast.success('¡Pomodoro completado! Hora de descansar 🎉');
          if (SF.Notif) SF.Notif.add({ title: '🍅 Pomodoro completado', msg: `${cfg.work} minutos de enfoque. Toma un descanso.`, urgency: 4 });
        } else {
          phase = 'work';
          remaining = cfg.work * 60;
          phaseEl.textContent = 'Sesión de estudio';
          if (SF.Toast) SF.Toast.info('Descanso terminado. ¿Listo para otra sesión?');
        }
        render();
      }
    };

    startB?.addEventListener('click', () => {
      if (running) return;
      running = true;
      startB.classList.add('hidden'); pauseB.classList.remove('hidden');
      interval = setInterval(tick, 1000);
    });
    pauseB?.addEventListener('click', () => {
      running = false; clearInterval(interval);
      startB.classList.remove('hidden'); pauseB.classList.add('hidden');
    });
    resetB?.addEventListener('click', () => {
      running = false; clearInterval(interval);
      phase = 'work'; remaining = cfg.work * 60;
      phaseEl.textContent = 'Sesión de estudio';
      startB.classList.remove('hidden'); pauseB.classList.add('hidden');
      render();
    });
    document.getElementById('ptpl-log')?.addEventListener('input', () => this._autosave(id, () => ({ ...this._load(id), log: document.getElementById('ptpl-log').value })));
    render();
  },

  /* ───────────────────────── 💡 FEYNMAN ───────────────────────── */
  _tplFeynman() {
    const d = this._load('feynman');
    const gaps = (d.gaps && d.gaps.length) ? d.gaps : [''];
    return `
    <div class="mt-intro">Aprende explicando con tus propias palabras. Si no puedes explicarlo simple, aún no lo entiendes.</div>
    <div class="mt-field">
      <label>1️⃣ Concepto a estudiar</label>
      <input id="fey-concept" class="field-input" placeholder="Ej: La fotosíntesis" value="${this._esc(d.concept || '')}">
    </div>
    <div class="mt-field">
      <label>2️⃣ Explícalo como si enseñaras a un niño</label>
      <textarea id="fey-explain" class="field-input" rows="5" placeholder="Usa palabras simples, sin tecnicismos...">${this._esc(d.explain || '')}</textarea>
    </div>
    <div class="mt-field">
      <label>3️⃣ Detecta vacíos de conocimiento <button class="mt-add-btn" id="fey-add-gap"><i class="ri-add-line"></i> Añadir</button></label>
      <div id="fey-gaps">
        ${gaps.map((g, i) => `<div class="mt-gap-row">
          <input class="field-input fey-gap" data-i="${i}" placeholder="¿Qué no quedó claro?" value="${this._esc(g)}">
          <button class="icon-btn fey-del-gap" data-i="${i}" style="width:34px;height:34px;color:var(--toast-error)"><i class="ri-close-line"></i></button>
        </div>`).join('')}
      </div>
    </div>
    <div class="mt-field">
      <label>4️⃣ Explicación final mejorada</label>
      <textarea id="fey-final" class="field-input" rows="5" placeholder="Reescribe la explicación llenando los vacíos...">${this._esc(d.final || '')}</textarea>
    </div>
    <button class="btn-primary" id="fey-save" style="width:100%"><i class="ri-save-line"></i> Guardar explicación</button>`;
  },

  _mountFeynman() {
    const id = 'feynman';
    const collect = () => ({
      concept: document.getElementById('fey-concept')?.value || '',
      explain: document.getElementById('fey-explain')?.value || '',
      final:   document.getElementById('fey-final')?.value || '',
      gaps: Array.from(document.querySelectorAll('.fey-gap')).map(i => i.value).filter(v => v.trim()),
    });
    ['fey-concept','fey-explain','fey-final'].forEach(x =>
      document.getElementById(x)?.addEventListener('input', () => this._autosave(id, collect)));
    document.querySelectorAll('.fey-gap').forEach(i => i.addEventListener('input', () => this._autosave(id, collect)));

    document.getElementById('fey-add-gap')?.addEventListener('click', () => {
      const wrap = document.getElementById('fey-gaps');
      const i = wrap.children.length;
      const row = document.createElement('div');
      row.className = 'mt-gap-row';
      row.innerHTML = `<input class="field-input fey-gap" data-i="${i}" placeholder="¿Qué no quedó claro?">
        <button class="icon-btn fey-del-gap" data-i="${i}" style="width:34px;height:34px;color:var(--toast-error)"><i class="ri-close-line"></i></button>`;
      wrap.appendChild(row);
      row.querySelector('.fey-gap').addEventListener('input', () => this._autosave(id, collect));
      row.querySelector('.fey-del-gap').addEventListener('click', () => { row.remove(); this._save(id, collect()); });
      row.querySelector('.fey-gap').focus();
    });
    document.querySelectorAll('.fey-del-gap').forEach(b =>
      b.addEventListener('click', () => { b.closest('.mt-gap-row').remove(); this._save(id, collect()); }));

    document.getElementById('fey-save')?.addEventListener('click', () => {
      this._save(id, collect());
      if (SF.Toast) SF.Toast.success('Explicación Feynman guardada correctamente.');
      SF.Api.syncStats({ xp: 15 }).catch(() => {});
    });
  },

  /* ───────────────────────── 📝 CORNELL ───────────────────────── */
  _tplCornell() {
    const d = this._load('cornell');
    return `
    <div class="mt-intro">Sistema de apuntes estructurado: ideas clave, notas detalladas y un resumen final.</div>
    <div class="mt-field">
      <label>📚 Materia / Tema</label>
      <input id="cor-topic" class="field-input" placeholder="Ej: Historia — Revolución Francesa" value="${this._esc(d.topic || '')}">
    </div>
    <div class="cornell-grid">
      <div class="cornell-cues">
        <div class="cornell-label">💡 Ideas clave / Preguntas</div>
        <textarea id="cor-cues" class="field-input" placeholder="Palabras clave, preguntas, conceptos principales...">${this._esc(d.cues || '')}</textarea>
      </div>
      <div class="cornell-notes">
        <div class="cornell-label">📝 Apuntes detallados</div>
        <textarea id="cor-notes" class="field-input" placeholder="Toma tus notas completas aquí durante la clase...">${this._esc(d.notes || '')}</textarea>
      </div>
    </div>
    <div class="cornell-summary">
      <div class="cornell-label">📌 Resumen</div>
      <textarea id="cor-summary" class="field-input" rows="3" placeholder="Resume todo en 2-3 frases con tus propias palabras...">${this._esc(d.summary || '')}</textarea>
    </div>
    <button class="btn-primary" id="cor-save" style="width:100%"><i class="ri-save-line"></i> Guardar apuntes Cornell</button>`;
  },

  _mountCornell() {
    const id = 'cornell';
    const collect = () => ({
      topic:   document.getElementById('cor-topic')?.value || '',
      cues:    document.getElementById('cor-cues')?.value || '',
      notes:   document.getElementById('cor-notes')?.value || '',
      summary: document.getElementById('cor-summary')?.value || '',
    });
    ['cor-topic','cor-cues','cor-notes','cor-summary'].forEach(x =>
      document.getElementById(x)?.addEventListener('input', () => this._autosave(id, collect)));
    document.getElementById('cor-save')?.addEventListener('click', () => {
      this._save(id, collect());
      if (SF.Toast) SF.Toast.success('Apuntes Cornell guardados correctamente.');
      SF.Api.syncStats({ xp: 15 }).catch(() => {});
    });
  },

  /* ───────────────────────── 🧠 MAPA MENTAL ───────────────────────── */
  _tplMindmap() {
    const d = this._load('mindmap');
    const central = d.central || '';
    const nodes = d.nodes || [];
    return `
    <div class="mt-intro">Organiza ideas conectadas desde un concepto central. Versión funcional basada en tarjetas conectadas.</div>
    <div class="mt-field">
      <label>🎯 Nodo central</label>
      <input id="mm-central" class="field-input" placeholder="Ej: Sistema Solar" value="${this._esc(central)}">
    </div>
    <div class="mindmap-canvas" id="mm-canvas">
      <div class="mm-central-node" id="mm-central-display">${this._esc(central) || 'Tu idea central'}</div>
      <div class="mm-branches" id="mm-branches">
        ${nodes.map((n, i) => this._mmBranchHTML(n, i)).join('')}
      </div>
    </div>
    <button class="mt-add-btn-lg" id="mm-add"><i class="ri-add-line"></i> Añadir rama / subnodo</button>
    <button class="btn-primary" id="mm-save" style="width:100%;margin-top:12px"><i class="ri-save-line"></i> Guardar mapa mental</button>`;
  },

  _mmBranchHTML(n, i) {
    const subs = n.subs || [];
    return `<div class="mm-branch" data-i="${i}">
      <div class="mm-branch-head">
        <input class="field-input mm-node" data-i="${i}" placeholder="Rama principal" value="${this._esc(n.text || '')}">
        <button class="icon-btn mm-add-sub" data-i="${i}" title="Añadir subnodo" style="width:34px;height:34px"><i class="ri-node-tree"></i></button>
        <button class="icon-btn mm-del-node" data-i="${i}" title="Eliminar" style="width:34px;height:34px;color:var(--toast-error)"><i class="ri-close-line"></i></button>
      </div>
      <div class="mm-subs" data-i="${i}">
        ${subs.map((s, j) => `<div class="mm-sub"><input class="field-input mm-subnode" data-i="${i}" data-j="${j}" placeholder="Subnodo" value="${this._esc(s)}"><button class="mm-del-sub" data-i="${i}" data-j="${j}"><i class="ri-close-line"></i></button></div>`).join('')}
      </div>
    </div>`;
  },

  _mountMindmap() {
    const id = 'mindmap';
    const collect = () => {
      const central = document.getElementById('mm-central')?.value || '';
      const nodes = Array.from(document.querySelectorAll('.mm-branch')).map(branch => {
        const i = branch.dataset.i;
        const text = branch.querySelector('.mm-node')?.value || '';
        const subs = Array.from(branch.querySelectorAll('.mm-subnode')).map(s => s.value).filter(v => v.trim());
        return { text, subs };
      }).filter(n => n.text.trim() || n.subs.length);
      return { central, nodes };
    };

    const reRender = () => {
      const data = collect();
      this._save(id, data);
      const body = document.getElementById('method-template-body');
      body.innerHTML = this._tplMindmap();
      this._mountMindmap();
    };

    const central = document.getElementById('mm-central');
    central?.addEventListener('input', () => {
      const disp = document.getElementById('mm-central-display');
      if (disp) disp.textContent = central.value || 'Tu idea central';
      this._autosave(id, collect);
    });

    document.querySelectorAll('.mm-node, .mm-subnode').forEach(i =>
      i.addEventListener('input', () => this._autosave(id, collect)));

    document.getElementById('mm-add')?.addEventListener('click', () => {
      const data = collect();
      data.nodes.push({ text: '', subs: [] });
      this._save(id, data);
      const body = document.getElementById('method-template-body');
      body.innerHTML = this._tplMindmap();
      this._mountMindmap();
    });

    document.querySelectorAll('.mm-add-sub').forEach(b => b.addEventListener('click', () => {
      const data = collect();
      const i = parseInt(b.dataset.i);
      if (data.nodes[i]) { data.nodes[i].subs = data.nodes[i].subs || []; data.nodes[i].subs.push(''); }
      this._save(id, data);
      const body = document.getElementById('method-template-body');
      body.innerHTML = this._tplMindmap();
      this._mountMindmap();
    }));

    document.querySelectorAll('.mm-del-node').forEach(b => b.addEventListener('click', () => {
      const data = collect(); data.nodes.splice(parseInt(b.dataset.i), 1);
      this._save(id, data);
      const body = document.getElementById('method-template-body');
      body.innerHTML = this._tplMindmap(); this._mountMindmap();
    }));

    document.querySelectorAll('.mm-del-sub').forEach(b => b.addEventListener('click', () => {
      const data = collect();
      const i = parseInt(b.dataset.i), j = parseInt(b.dataset.j);
      if (data.nodes[i]?.subs) data.nodes[i].subs.splice(j, 1);
      this._save(id, data);
      const body = document.getElementById('method-template-body');
      body.innerHTML = this._tplMindmap(); this._mountMindmap();
    }));

    document.getElementById('mm-save')?.addEventListener('click', () => {
      this._save(id, collect());
      if (SF.Toast) SF.Toast.success('Mapa mental guardado correctamente.');
      SF.Api.syncStats({ xp: 15 }).catch(() => {});
    });
  },

  /* ───────────────────────── 🔄 REPETICIÓN ESPACIADA ───────────────────────── */
  _tplSpaced() {
    const d = this._load('spaced');
    const items = d.items || [];
    return `
    <div class="mt-intro">Repasa en intervalos crecientes (1, 3, 7, 15, 30 días) para fijar la memoria a largo plazo.</div>
    <div class="spaced-form">
      <input id="sp-topic" class="field-input" placeholder="Tema estudiado (ej: Verbos irregulares)" style="flex:2">
      <input id="sp-date" type="date" class="field-input" style="flex:1">
      <button class="btn-primary" id="sp-add"><i class="ri-add-line"></i> Generar plan</button>
    </div>
    <div class="spaced-list" id="sp-list">
      ${items.length ? items.map((it, i) => this._spacedItemHTML(it, i)).join('') :
        '<div class="empty-state" style="padding:32px"><i class="ri-calendar-line"></i><p>Sin temas. Añade uno para generar su calendario de repasos.</p></div>'}
    </div>`;
  },

  _spacedItemHTML(it, i) {
    const today = new Date().toISOString().slice(0, 10);
    return `<div class="spaced-item">
      <div class="spaced-item-head">
        <div><div class="spaced-topic">${this._esc(it.topic)}</div>
        <div class="spaced-start">Estudiado: ${new Date(it.date).toLocaleDateString('es-EC',{day:'numeric',month:'short',year:'numeric'})}</div></div>
        <button class="icon-btn sp-del" data-i="${i}" style="width:30px;height:30px;color:var(--toast-error)"><i class="ri-delete-bin-line"></i></button>
      </div>
      <div class="spaced-reviews">
        ${it.reviews.map(r => {
          const done = r.done;
          const overdue = !done && r.date < today;
          const isToday = r.date === today;
          return `<div class="spaced-review ${done ? 'done' : ''} ${overdue ? 'overdue' : ''} ${isToday ? 'today' : ''}"
            data-i="${i}" data-rdate="${r.date}">
            <i class="${done ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'}"></i>
            <span>+${r.interval}d · ${new Date(r.date).toLocaleDateString('es-EC',{day:'numeric',month:'short'})}</span>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  },

  _mountSpaced() {
    const id = 'spaced';
    document.getElementById('sp-date').value = new Date().toISOString().slice(0, 10);

    const refresh = () => {
      const body = document.getElementById('method-template-body');
      body.innerHTML = this._tplSpaced();
      this._mountSpaced();
    };

    document.getElementById('sp-add')?.addEventListener('click', () => {
      const topic = document.getElementById('sp-topic')?.value.trim();
      const date = document.getElementById('sp-date')?.value;
      if (!topic) { if (SF.Toast) SF.Toast.warning('Escribe el tema estudiado.'); return; }
      if (!date)  { if (SF.Toast) SF.Toast.warning('Selecciona la fecha de estudio.'); return; }

      const intervals = [1, 3, 7, 15, 30];
      const base = new Date(date);
      const reviews = intervals.map(iv => {
        const dt = new Date(base); dt.setDate(dt.getDate() + iv);
        return { interval: iv, date: dt.toISOString().slice(0, 10), done: false };
      });

      const data = this._load(id);
      data.items = data.items || [];
      data.items.unshift({ topic, date, reviews });
      this._save(id, data);
      if (SF.Toast) SF.Toast.success('Calendario de repasos generado.');
      SF.Api.syncStats({ xp: 10 }).catch(() => {});
      refresh();
    });

    document.querySelectorAll('.spaced-review').forEach(el => el.addEventListener('click', () => {
      const data = this._load(id);
      const i = parseInt(el.dataset.i);
      const rdate = el.dataset.rdate;
      const rev = data.items[i]?.reviews.find(r => r.date === rdate);
      if (rev) rev.done = !rev.done;
      this._save(id, data);
      refresh();
    }));

    document.querySelectorAll('.sp-del').forEach(b => b.addEventListener('click', () => {
      const data = this._load(id);
      data.items.splice(parseInt(b.dataset.i), 1);
      this._save(id, data);
      refresh();
    }));
  },

  /* ───────────────────────── 🎯 RECALL ACTIVO ───────────────────────── */
  _tplRecall() {
    const d = this._load('recall');
    return `
    <div class="mt-intro">Cierra el libro y escribe lo que recuerdas. Luego compara y corrige. Refuerza las conexiones neuronales.</div>
    <div class="mt-field">
      <label>📚 Tema estudiado</label>
      <input id="rec-topic" class="field-input" placeholder="Ej: Las leyes de Newton" value="${this._esc(d.topic || '')}">
    </div>
    <div class="mt-field">
      <label>🧠 Lo que recuerdo (sin mirar apuntes)</label>
      <textarea id="rec-remember" class="field-input" rows="5" placeholder="Escribe todo lo que recuerdes de memoria...">${this._esc(d.remember || '')}</textarea>
    </div>
    <div class="recall-two-col">
      <div class="mt-field">
        <label>❌ Lo que olvidé</label>
        <textarea id="rec-forgot" class="field-input" rows="4" placeholder="Tras revisar, ¿qué se te escapó?">${this._esc(d.forgot || '')}</textarea>
      </div>
      <div class="mt-field">
        <label>✏️ Corrección</label>
        <textarea id="rec-correction" class="field-input" rows="4" placeholder="Versión corregida y completa">${this._esc(d.correction || '')}</textarea>
      </div>
    </div>
    <div class="mt-field">
      <label>🏁 Resultado final (resumen)</label>
      <textarea id="rec-result" class="field-input" rows="3" placeholder="Tu comprensión consolidada del tema">${this._esc(d.result || '')}</textarea>
    </div>
    <button class="btn-primary" id="rec-save" style="width:100%"><i class="ri-save-line"></i> Guardar sesión de Recall</button>`;
  },

  _mountRecall() {
    const id = 'recall';
    const collect = () => ({
      topic:      document.getElementById('rec-topic')?.value || '',
      remember:   document.getElementById('rec-remember')?.value || '',
      forgot:     document.getElementById('rec-forgot')?.value || '',
      correction: document.getElementById('rec-correction')?.value || '',
      result:     document.getElementById('rec-result')?.value || '',
    });
    ['rec-topic','rec-remember','rec-forgot','rec-correction','rec-result'].forEach(x =>
      document.getElementById(x)?.addEventListener('input', () => this._autosave(id, collect)));
    document.getElementById('rec-save')?.addEventListener('click', () => {
      this._save(id, collect());
      if (SF.Toast) SF.Toast.success('Sesión de Recall Activo guardada correctamente.');
      SF.Api.syncStats({ xp: 15 }).catch(() => {});
    });
  },

  _esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  },
};

window.SF.Methods = MethodTemplates;
