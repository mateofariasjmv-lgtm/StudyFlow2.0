/* ============================================================
   StudyFlow+ — js/services.js
   API Service Layer — conecta con el backend Express/MongoDB
   ============================================================ */

const API_BASE = 'const API_URL = "https://tu-backend.onrender.com";';

const ApiService = {

  /* ── Auth Helpers ── */
  getToken()       { return localStorage.getItem('sf_jwt_token'); },
  setToken(t)      { localStorage.setItem('sf_jwt_token', t); },
  clearToken()     { localStorage.removeItem('sf_jwt_token'); localStorage.removeItem('sf_user'); },

  getUser() {
    try { return JSON.parse(localStorage.getItem('sf_user') || 'null'); }
    catch { return null; }
  },
  setUser(u)   { localStorage.setItem('sf_user', JSON.stringify(u)); },

  isLoggedIn() { return !!this.getToken() && !!this.getUser(); },

  /* ── Generic Request ── */
  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const resp = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      const msg = data.message || `Error ${resp.status}`;
      throw new Error(msg);
    }
    return data;
  },

  /* ── Auth ── */
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) this.setToken(data.token);
    if (data.user)  this.setUser(data.user);
    return data;
  },

  async register(name, email, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    if (data.token) this.setToken(data.token);
    if (data.user)  this.setUser(data.user);
    return data;
  },

  async getProfile() {
    const data = await this.request('/auth/profile', { method: 'GET' });
    if (data.user) this.setUser(data.user);
    return data;
  },

  async updateProfile(profileData) {
    const data = await this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    if (data.user) this.setUser(data.user);
    return data;
  },

  async syncStats(statsData) {
    return this.request('/auth/sync-stats', {
      method: 'POST',
      body: JSON.stringify(statsData)
    });
  },

  /* ── Tasks ── */
  async getTasks()             { return this.request('/tasks', { method: 'GET' }); },
  async createTask(taskData)   { return this.request('/tasks', { method: 'POST', body: JSON.stringify(taskData) }); },
  async updateTask(id, data)   { return this.request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteTask(id)         { return this.request(`/tasks/${id}`, { method: 'DELETE' }); },
};

window.SF = window.SF || {};
window.SF.Api = ApiService;
