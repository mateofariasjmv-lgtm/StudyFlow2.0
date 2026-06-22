/* ============================================================
   StudyFlow+ — js/notifications.js
   Sistema completo de notificaciones con Web Notifications API
   ============================================================ */

window.SF = window.SF || {};

const NotificationManager = {

  _list: [],
  _permission: 'default',
  _interval: null,

  /* ── Init ── */
  init() {
    const saved = localStorage.getItem('sf_notifications');
    if (saved) {
      try { this._list = JSON.parse(saved); } catch { this._list = []; }
    }
    this._requestPermission();
    this._startInterval();
    this.render();
    this.updateBadge();
  },

  async _requestPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      this._permission = 'granted';
    } else if (Notification.permission !== 'denied') {
      const p = await Notification.requestPermission();
      this._permission = p;
    } else {
      this._permission = Notification.permission;
    }
  },

  _startInterval() {
    // Check every 5 minutes
    if (this._interval) clearInterval(this._interval);
    this._interval = setInterval(() => this.checkDueDates(), 5 * 60 * 1000);
    // Also check on startup after a short delay
    setTimeout(() => this.checkDueDates(), 3000);
  },

  /* ── Check tasks for upcoming deadlines ──
     Umbrales: 24h · 12h · 1h · al vencer.
     Cada (tarea + umbral) se notifica UNA sola vez gracias a un registro
     persistente (sf_notif_fired), evitando recordatorios duplicados. ── */
  checkDueDates() {
    const tasks = window.SF.Tasks ? window.SF.Tasks.getAll() : [];
    if (!tasks.length) return;

    const now = Date.now();
    const fired = this._getFired();

    // Definición de umbrales (en horas). 0 = vencida.
    const thresholds = [
      { key: 'overdue', test: (h) => h < 0,            urgency: 1, label: (t) => `La tarea "${t.text}" ha vencido.` },
      { key: 'h1',      test: (h) => h >= 0 && h <= 1, urgency: 2, label: (t) => `"${t.text}" vence en menos de 1 hora.` },
      { key: 'h12',     test: (h) => h > 1  && h <= 12,urgency: 2, label: (t) => `"${t.text}" vence en menos de 12 horas.` },
      { key: 'h24',     test: (h) => h > 12 && h <= 24,urgency: 3, label: (t) => `"${t.text}" vence en menos de 24 horas.` },
    ];

    let changed = false;

    tasks.forEach(task => {
      if (task.done || !task.dueDate) return;
      const hours = (new Date(task.dueDate).getTime() - now) / 3600000;

      const match = thresholds.find(t => t.test(hours));
      if (!match) return;

      const fireKey = `${task._id}:${match.key}`;
      if (fired[fireKey]) return; // ya notificado este umbral

      this.add({ title: '🔔 Recordatorio de Tarea', msg: match.label(task), urgency: match.urgency, taskId: task._id });
      fired[fireKey] = now;
      changed = true;
    });

    // Limpia registros de tareas que ya no existen o expiraron (>7 días)
    const validIds = new Set(tasks.map(t => t._id));
    Object.keys(fired).forEach(k => {
      const tid = k.split(':')[0];
      if (!validIds.has(tid) || (now - fired[k]) > 7 * 24 * 3600000) { delete fired[k]; changed = true; }
    });

    if (changed) this._saveFired(fired);
  },

  _getFired() {
    try { return JSON.parse(localStorage.getItem('sf_notif_fired') || '{}'); }
    catch { return {}; }
  },
  _saveFired(obj) {
    try { localStorage.setItem('sf_notif_fired', JSON.stringify(obj)); } catch {}
  },

  /* ── Add notification ── */
  add({ title, msg, urgency = 0, taskId = null, icon = 'ri-notification-3-line' }) {
    // Anti-duplicado: ignora una notificación idéntica (mismo título+mensaje)
    // emitida en los últimos 60 segundos.
    const dup = this._list.find(n => n.title === title && n.msg === msg && (Date.now() - n.timestamp) < 60000);
    if (dup) return;

    const n = {
      id: Date.now() + Math.random(),
      title,
      msg,
      urgency,
      taskId,
      icon,
      read: false,
      timestamp: Date.now(),
    };
    this._list.unshift(n);
    // Keep max 50
    if (this._list.length > 50) this._list = this._list.slice(0, 50);
    this._save();
    this.render();
    this.updateBadge();
    this._pushBrowserNotif(title, msg, urgency);
  },

  _pushBrowserNotif(title, msg, urgency) {
    if (this._permission !== 'granted') return;
    try {
      const icons = { 1: '🔴', 2: '🟠', 3: '🟡', 4: '🟢' };
      new Notification(`${icons[urgency] || '🔔'} ${title}`, {
        body: msg,
        icon: '/favicon.ico',
        tag: `sf-${urgency}-${Date.now()}`,
      });
    } catch {}
  },

  /* ── Mark all read ── */
  markAllRead() {
    this._list.forEach(n => n.read = true);
    this._save();
    this.render();
    this.updateBadge();
  },

  markRead(id) {
    const n = this._list.find(x => x.id === id);
    if (n) { n.read = true; this._save(); this.render(); this.updateBadge(); }
  },

  clear() {
    this._list = [];
    this._save();
    this.render();
    this.updateBadge();
  },

  _save() {
    try { localStorage.setItem('sf_notifications', JSON.stringify(this._list)); } catch {}
  },

  /* ── Update badge counter ── */
  updateBadge() {
    const badge = document.getElementById('notif-badge');
    const unread = this._list.filter(n => !n.read).length;
    if (!badge) return;
    if (unread > 0) {
      badge.textContent = unread > 9 ? '9+' : unread;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  },

  /* ── Render panel ── */
  render() {
    const list = document.getElementById('notif-list');
    if (!list) return;

    if (this._list.length === 0) {
      list.innerHTML = `
        <div class="notif-empty">
          <i class="ri-notification-off-line"></i>
          <p>Sin notificaciones</p>
        </div>`;
      return;
    }

    const urgencyColor = { 1: 'urgency-1', 2: 'urgency-2', 3: 'urgency-3', 4: 'urgency-4' };

    list.innerHTML = this._list.map(n => `
      <div class="notif-item ${n.read ? 'read' : 'unread'} ${urgencyColor[n.urgency] || ''}"
           data-id="${n.id}" onclick="SF.Notif.markRead(${n.id})">
        ${!n.read ? '<div class="notif-unread-dot"></div>' : ''}
        <div class="notif-title">${n.title}</div>
        <div class="notif-msg">${n.msg}</div>
        <div class="notif-time">${this._timeAgo(n.timestamp)}</div>
      </div>
    `).join('');
  },

  _timeAgo(ts) {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Hace un momento';
    if (m < 60) return `Hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `Hace ${h}h`;
    return `Hace ${Math.floor(h / 24)} días`;
  },

  getUnreadCount() { return this._list.filter(n => !n.read).length; },
};

window.SF.Notif = NotificationManager;
