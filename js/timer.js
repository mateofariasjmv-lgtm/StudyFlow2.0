/* ============================================================
   StudyFlow+ — js/timer.js
   Centro de Concentración: Pomodoro + Cronómetro
   ============================================================ */

window.SF = window.SF || {};

const TimerManager = {

  /* ─── STATE ─── */
  _mode: 'pomodoro',       // 'pomodoro' | 'chrono'
  _running: false,
  _interval: null,
  _minutes: 25, _seconds: 0,
  _totalSeconds: 25 * 60,
  _elapsed: 0,             // for chrono
  _chronoRunning: false,
  _chronoInterval: null,
  _laps: [],

  _pomodoroPhase: 'work',  // 'work' | 'short' | 'long'
  _pomoCycles: 0,
  _completedPomos: 0,

  _config: { work: 25, short: 5, long: 15, autoSwitch: true },

  _focusSessions: [],

  /* ─── RENDER VIEW ─── */
  renderView() {
    this._loadHistory();
    return `
    <div class="view-title">🎯 Centro de Concentración</div>
    <div class="view-subtitle">Mantén el enfoque. Estudia con intención.</div>

    <div class="concentration-grid">
      <!-- Timer card -->
      <div class="timer-card">
        <div class="mode-tabs" id="timer-mode-tabs">
          <button class="mtab active" data-timermode="pomodoro">
            <i class="ri-timer-flash-line"></i> Pomodoro
          </button>
          <button class="mtab" data-timermode="chrono">
            <i class="ri-stopwatch-line"></i> Cronómetro
          </button>
        </div>

        <!-- POMODORO -->
        <div id="pomo-section">
          <div class="timer-ring-wrap">
            <svg class="timer-ring" viewBox="0 0 220 220">
              <circle class="ring-track" cx="110" cy="110" r="95"/>
              <circle class="ring-fill" id="ring-fill" cx="110" cy="110" r="95"
                stroke-dasharray="597" stroke-dashoffset="0"/>
            </svg>
            <div class="timer-center">
              <div class="timer-time" id="pomo-display">25:00</div>
              <div class="timer-label" id="pomo-label">Sesión de Estudio</div>
            </div>
          </div>

          <div class="pomodoro-cycles" id="pomo-cycles">
            <div class="pomo-dot" title="Pomodoro 1"></div>
            <div class="pomo-dot" title="Pomodoro 2"></div>
            <div class="pomo-dot" title="Pomodoro 3"></div>
            <div class="pomo-dot" title="Pomodoro 4"></div>
          </div>

          <div class="timer-controls">
            <button class="timer-btn tbtn-reset" id="pomo-reset" title="Reiniciar">
              <i class="ri-refresh-line"></i>
            </button>
            <button class="timer-btn tbtn-start" id="pomo-start" title="Iniciar">
              <i class="ri-play-fill"></i>
            </button>
            <button class="timer-btn tbtn-pause hidden" id="pomo-pause" title="Pausar">
              <i class="ri-pause-fill"></i>
            </button>
            <button class="timer-btn tbtn-reset" id="pomo-skip" title="Saltar fase"
              style="background:var(--bg-surface-3)">
              <i class="ri-skip-forward-line"></i>
            </button>
          </div>

          <div style="font-size:0.75rem;color:var(--text-muted);text-align:center">
            🍅 Pomodoros hoy: <span id="pomo-count-today" style="color:var(--accent);font-weight:600">0</span>
          </div>
        </div>

        <!-- CRONÓMETRO -->
        <div id="chrono-section" class="hidden">
          <div class="chrono-display">
            <div class="chrono-time" id="chrono-display">00:00:00</div>
            <div class="timer-controls">
              <button class="timer-btn tbtn-reset" id="chrono-reset" title="Reiniciar">
                <i class="ri-refresh-line"></i>
              </button>
              <button class="timer-btn tbtn-start" id="chrono-start">
                <i class="ri-play-fill"></i>
              </button>
              <button class="timer-btn tbtn-pause hidden" id="chrono-pause">
                <i class="ri-pause-fill"></i>
              </button>
              <button class="timer-btn tbtn-reset" id="chrono-lap"
                style="background:var(--bg-surface-3);font-size:0.75rem" title="Vuelta">
                Vuelta
              </button>
            </div>
            <div class="chrono-laps" id="chrono-laps"></div>
          </div>
        </div>

        <!-- Pomodoro config -->
        <div class="card" style="width:100%">
          <div class="card-header">
            <h3><i class="ri-settings-3-line"></i> Configuración</h3>
          </div>
          <div class="form-row">
            <div class="field-group">
              <label>Trabajo (min)</label>
              <input class="field-input" type="number" id="cfg-work" min="1" max="90" value="${this._config.work}">
            </div>
            <div class="field-group">
              <label>Descanso corto</label>
              <input class="field-input" type="number" id="cfg-short" min="1" max="30" value="${this._config.short}">
            </div>
            <div class="field-group">
              <label>Descanso largo</label>
              <input class="field-input" type="number" id="cfg-long" min="1" max="60" value="${this._config.long}">
            </div>
          </div>
          <div style="margin-top:10px">
            <button class="btn-secondary" id="save-timer-cfg" style="width:100%">
              Aplicar configuración
            </button>
          </div>
        </div>
      </div>

      <!-- Right side: stats + history -->
      <div class="gap-section">

        <div class="card">
          <div class="card-header">
            <h3><i class="ri-bar-chart-2-line"></i> Estadísticas de Hoy</h3>
          </div>
          <div class="focus-stats-grid">
            <div class="focus-stat">
              <div class="focus-stat-val" id="stat-pomo-today">0</div>
              <div class="focus-stat-lbl">Pomodoros</div>
            </div>
            <div class="focus-stat">
              <div class="focus-stat-val" id="stat-min-today">0</div>
              <div class="focus-stat-lbl">Minutos</div>
            </div>
            <div class="focus-stat">
              <div class="focus-stat-val" id="stat-sessions-today">0</div>
              <div class="focus-stat-lbl">Sesiones</div>
            </div>
            <div class="focus-stat">
              <div class="focus-stat-val" id="stat-streak-focus">0</div>
              <div class="focus-stat-lbl">Racha (días)</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3><i class="ri-history-line"></i> Historial de Sesiones</h3>
            <button class="btn-text-sm" id="clear-history-btn">Limpiar</button>
          </div>
          <div id="session-history-list">
            <div class="empty-state" style="padding:20px">
              <i class="ri-timer-line"></i>
              <p>Sin sesiones registradas</p>
            </div>
          </div>
        </div>

      </div>
    </div>`;
  },

  /* ─── MOUNT (attach listeners after render) ─── */
  mount() {
    this._mounted = true;

    // Mode tabs
    document.querySelectorAll('[data-timermode]').forEach(btn => {
      btn.addEventListener('click', () => {
        this._switchMode(btn.dataset.timermode);
      });
    });

    // Pomodoro controls
    document.getElementById('pomo-start')?.addEventListener('click', () => this._pomoStart());
    document.getElementById('pomo-pause')?.addEventListener('click', () => this._pomoPause());
    document.getElementById('pomo-reset')?.addEventListener('click', () => this._pomoReset());
    document.getElementById('pomo-skip')?.addEventListener('click',  () => this._pomoSkip());

    // Chrono controls
    document.getElementById('chrono-start')?.addEventListener('click', () => this._chronoStart());
    document.getElementById('chrono-pause')?.addEventListener('click', () => this._chronoPause());
    document.getElementById('chrono-reset')?.addEventListener('click', () => this._chronoReset());
    document.getElementById('chrono-lap')?.addEventListener('click',   () => this._chronoLap());

    // Config
    document.getElementById('save-timer-cfg')?.addEventListener('click', () => this._saveConfig());

    // Clear history
    document.getElementById('clear-history-btn')?.addEventListener('click', () => {
      if (confirm('¿Limpiar el historial de sesiones?')) {
        this._focusSessions = [];
        this._saveHistory();
        this._renderHistory();
      }
    });

    this._updatePomoDisplay();
    this._renderHistory();
    this._renderTodayStats();
    this._renderCycles();
  },

  /* ─── MODE SWITCH ─── */
  _switchMode(mode) {
    this._mode = mode;
    document.querySelectorAll('[data-timermode]').forEach(b => b.classList.toggle('active', b.dataset.timermode === mode));
    document.getElementById('pomo-section').classList.toggle('hidden', mode !== 'pomodoro');
    document.getElementById('chrono-section').classList.toggle('hidden', mode !== 'chrono');
  },

  /* ─── POMODORO ─── */
  _pomoStart() {
    if (this._running) return;
    this._running = true;
    document.getElementById('pomo-start').classList.add('hidden');
    document.getElementById('pomo-pause').classList.remove('hidden');
    const sessionStart = Date.now();

    this._interval = setInterval(() => {
      if (this._seconds === 0) {
        if (this._minutes === 0) {
          clearInterval(this._interval);
          this._running = false;
          this._pomoPhaseComplete(sessionStart);
          return;
        }
        this._minutes--;
        this._seconds = 59;
      } else {
        this._seconds--;
      }
      this._updatePomoDisplay();
    }, 1000);
  },

  _pomoPause() {
    clearInterval(this._interval);
    this._running = false;
    document.getElementById('pomo-start').classList.remove('hidden');
    document.getElementById('pomo-pause').classList.add('hidden');
  },

  _pomoReset() {
    this._pomoPause();
    this._pomodoroPhase = 'work';
    this._minutes = this._config.work;
    this._seconds = 0;
    this._updatePomoDisplay();
    const fill = document.getElementById('ring-fill');
    if (fill) { fill.classList.remove('break'); fill.style.strokeDashoffset = '0'; }
    document.getElementById('pomo-label').textContent = 'Sesión de Estudio';
  },

  _pomoSkip() {
    clearInterval(this._interval);
    this._running = false;
    document.getElementById('pomo-start').classList.remove('hidden');
    document.getElementById('pomo-pause').classList.add('hidden');
    this._nextPhase();
  },

  async _pomoPhaseComplete(sessionStart) {
    document.getElementById('pomo-start').classList.remove('hidden');
    document.getElementById('pomo-pause').classList.add('hidden');

    if (this._pomodoroPhase === 'work') {
      this._completedPomos++;
      this._pomoCycles = (this._pomoCycles + 1) % 4;
      const mins = this._config.work;

      // Save session
      this._focusSessions.unshift({
        type: 'pomodoro',
        phase: 'work',
        duration: mins,
        startedAt: sessionStart,
        completedAt: Date.now(),
      });
      this._saveHistory();
      this._renderHistory();
      this._renderTodayStats();
      this._renderCycles();

      // Sync to backend
      try {
        await SF.Api.syncStats({ minutes: mins, pomodoros: 1, sessions: 1, xp: 50 });
        // Refresh user stats
        const u = SF.Api.getUser();
        if (u) {
          u.stats.minutes = (u.stats.minutes || 0) + mins;
          u.stats.pomodoros = (u.stats.pomodoros || 0) + 1;
          u.stats.sessions = (u.stats.sessions || 0) + 1;
          u.stats.xp = (u.stats.xp || 0) + 50;
          SF.Api.setUser(u);
        }
      } catch {}

      SF.Notif.add({
        title: '🍅 Pomodoro completado',
        msg: `Completaste ${mins} minutos de estudio. ¡Excelente! Es hora de descansar.`,
        urgency: 4,
      });
    } else {
      SF.Notif.add({
        title: '⏰ Descanso terminado',
        msg: 'El descanso ha terminado. ¿Listo para otro pomodoro?',
        urgency: 3,
      });
    }

    if (this._config.autoSwitch) this._nextPhase();
  },

  _nextPhase() {
    if (this._pomodoroPhase === 'work') {
      const isLong = this._completedPomos > 0 && this._completedPomos % 4 === 0;
      this._pomodoroPhase = isLong ? 'long' : 'short';
      this._minutes = isLong ? this._config.long : this._config.short;
      document.getElementById('pomo-label').textContent = isLong ? 'Descanso Largo' : 'Descanso Corto';
      const fill = document.getElementById('ring-fill');
      if (fill) fill.classList.add('break');
    } else {
      this._pomodoroPhase = 'work';
      this._minutes = this._config.work;
      document.getElementById('pomo-label').textContent = 'Sesión de Estudio';
      const fill = document.getElementById('ring-fill');
      if (fill) fill.classList.remove('break');
    }
    this._seconds = 0;
    this._updatePomoDisplay();
  },

  _updatePomoDisplay() {
    const m = String(this._minutes).padStart(2, '0');
    const s = String(this._seconds).padStart(2, '0');
    const el = document.getElementById('pomo-display');
    if (el) el.textContent = `${m}:${s}`;

    // Ring progress
    const fill = document.getElementById('ring-fill');
    if (fill) {
      const circ = 597; // 2πr = 2*π*95 ≈ 597
      const total = this._pomodoroPhase === 'work'
        ? this._config.work * 60
        : this._pomodoroPhase === 'short'
          ? this._config.short * 60
          : this._config.long * 60;
      const remaining = this._minutes * 60 + this._seconds;
      const offset = circ * (1 - remaining / total);
      fill.style.strokeDashoffset = offset;
    }
  },

  /* ─── CHRONO ─── */
  _chronoStart() {
    if (this._chronoRunning) return;
    this._chronoRunning = true;
    document.getElementById('chrono-start').classList.add('hidden');
    document.getElementById('chrono-pause').classList.remove('hidden');
    const startMs = Date.now() - this._elapsed;
    this._chronoInterval = setInterval(() => {
      this._elapsed = Date.now() - startMs;
      this._updateChronoDisplay();
    }, 100);
  },

  _chronoPause() {
    clearInterval(this._chronoInterval);
    this._chronoRunning = false;
    document.getElementById('chrono-start').classList.remove('hidden');
    document.getElementById('chrono-pause').classList.add('hidden');
  },

  _chronoReset() {
    this._chronoPause();
    this._elapsed = 0;
    this._laps = [];
    this._updateChronoDisplay();
    this._renderLaps();
  },

  _chronoLap() {
    if (!this._chronoRunning) return;
    this._laps.push(this._elapsed);
    this._renderLaps();
  },

  _updateChronoDisplay() {
    const el = document.getElementById('chrono-display');
    if (!el) return;
    el.textContent = this._formatMs(this._elapsed);
  },

  _renderLaps() {
    const el = document.getElementById('chrono-laps');
    if (!el) return;
    if (this._laps.length === 0) { el.innerHTML = ''; return; }
    el.innerHTML = this._laps.map((t, i) => `
      <div class="lap-item">
        <span class="lap-n">Vuelta ${i + 1}</span>
        <span class="lap-t">${this._formatMs(t)}</span>
      </div>`).join('');
  },

  _formatMs(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  },

  /* ─── CONFIG ─── */
  _saveConfig() {
    const w = parseInt(document.getElementById('cfg-work').value) || 25;
    const s = parseInt(document.getElementById('cfg-short').value) || 5;
    const l = parseInt(document.getElementById('cfg-long').value) || 15;
    this._config = { work: w, short: s, long: l, autoSwitch: true };
    this._pomoReset();
    if (window.SF.Toast) SF.Toast.success('Configuración aplicada.');
  },

  /* ─── HISTORY ─── */
  _loadHistory() {
    try {
      this._focusSessions = JSON.parse(localStorage.getItem('sf_focus_history') || '[]');
    } catch { this._focusSessions = []; }
  },

  _saveHistory() {
    const recent = this._focusSessions.slice(0, 100);
    localStorage.setItem('sf_focus_history', JSON.stringify(recent));
  },

  _renderHistory() {
    const el = document.getElementById('session-history-list');
    if (!el) return;
    if (this._focusSessions.length === 0) {
      el.innerHTML = `<div class="empty-state" style="padding:20px"><i class="ri-timer-line"></i><p>Sin sesiones registradas</p></div>`;
      return;
    }
    el.innerHTML = this._focusSessions.slice(0, 10).map(s => `
      <div class="session-item">
        <div class="session-icon"><i class="ri-focus-3-line"></i></div>
        <div class="session-info">
          <div class="session-name">${s.type === 'pomodoro' ? '🍅 Pomodoro' : '⏱ Cronómetro'}</div>
          <div class="session-sub">${new Date(s.completedAt).toLocaleTimeString('es-EC', { hour:'2-digit', minute:'2-digit' })}</div>
        </div>
        <div class="session-dur">${s.duration} min</div>
      </div>`).join('');
  },

  _renderTodayStats() {
    const today = new Date().toISOString().slice(0, 10);
    const todaySessions = this._focusSessions.filter(s =>
      new Date(s.completedAt).toISOString().slice(0, 10) === today
    );
    const pomos = todaySessions.filter(s => s.type === 'pomodoro').length;
    const mins  = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0);

    const p = document.getElementById('stat-pomo-today');
    const m = document.getElementById('stat-min-today');
    const ses = document.getElementById('stat-sessions-today');
    const cnt = document.getElementById('pomo-count-today');
    const streak = document.getElementById('stat-streak-focus');

    if (p) p.textContent = pomos;
    if (m) m.textContent = mins;
    if (ses) ses.textContent = todaySessions.length;
    if (cnt) cnt.textContent = pomos;
    const user = SF.Api.getUser();
    if (streak) streak.textContent = user?.stats?.streak || 0;
  },

  _renderCycles() {
    const dots = document.querySelectorAll('#pomo-cycles .pomo-dot');
    dots.forEach((dot, i) => dot.classList.toggle('done', i < (this._pomoCycles % 4)));
  },
};

window.SF.Timer = TimerManager;
