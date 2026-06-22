/* ============================================================
   StudyFlow+ — studyflow-backend/controllers/authController.js
   Autenticación completa: register · login · profile · syncStats
   ============================================================ */

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/* ── Helper: generate JWT ── */
const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

/* ── Helper: safe user object (no password) ── */
const safeUser = (u) => ({
  _id:      u._id,
  name:     u.name,
  email:    u.email,
  stats:    u.stats,
  settings: u.settings,
});

/* ════════════════════════════════════════════════════════════
   POST /api/auth/register
   Body: { name, email, password }
════════════════════════════════════════════════════════════ */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres.' });

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing)
      return res.status(400).json({ success: false, message: 'Este correo ya está registrado.' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password: hashed,
      stats: { minutes: 0, pomodoros: 0, sessions: 0, tasksCompleted: 0, streak: 0, xp: 0 },
    });

    const token = generateToken(user._id);
    return res.status(201).json({ success: true, token, user: safeUser(user) });

  } catch (err) {
    console.error('[register]', err.message);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

/* ════════════════════════════════════════════════════════════
   POST /api/auth/login
   Body: { email, password }
════════════════════════════════════════════════════════════ */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Correo y contraseña son obligatorios.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user)
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });

    // Update streak
    const today = new Date().toISOString().slice(0, 10);
    const lastLogin = user.lastLogin ? new Date(user.lastLogin).toISOString().slice(0, 10) : null;
    if (lastLogin) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);
      if (lastLogin === yStr) {
        user.stats.streak = (user.stats.streak || 0) + 1;
      } else if (lastLogin !== today) {
        user.stats.streak = 1;
      }
    } else {
      user.stats.streak = 1;
    }
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    return res.json({ success: true, token, user: safeUser(user) });

  } catch (err) {
    console.error('[login]', err.message);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

/* ════════════════════════════════════════════════════════════
   GET /api/auth/profile  (protected)
════════════════════════════════════════════════════════════ */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user)
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });

    return res.json({ success: true, user: safeUser(user) });
  } catch (err) {
    console.error('[getProfile]', err.message);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

/* ════════════════════════════════════════════════════════════
   PUT /api/auth/profile  (protected)
   Body: { name?, school? }
   'school' se guarda en el campo YA EXISTENTE settings.school del modelo.
   No se modifica la estructura del esquema.
════════════════════════════════════════════════════════════ */
const updateProfile = async (req, res) => {
  try {
    const { name, school } = req.body;
    const update = {};
    if (name?.trim()) update.name = name.trim();
    if (typeof school === 'string') update['settings.school'] = school.trim();

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user)
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });

    return res.json({ success: true, user: safeUser(user) });
  } catch (err) {
    console.error('[updateProfile]', err.message);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

/* ════════════════════════════════════════════════════════════
   POST /api/auth/sync-stats  (protected)
   Body: { minutes?, pomodoros?, sessions?, tasksCompleted?, xp? }
   Increments stats atomically.
════════════════════════════════════════════════════════════ */
const syncStats = async (req, res) => {
  try {
    const { minutes = 0, pomodoros = 0, sessions = 0, tasksCompleted = 0, xp = 0 } = req.body;

    const inc = {};
    if (minutes       > 0) inc['stats.minutes']        = minutes;
    if (pomodoros     > 0) inc['stats.pomodoros']       = pomodoros;
    if (sessions      > 0) inc['stats.sessions']        = sessions;
    if (tasksCompleted> 0) inc['stats.tasksCompleted']  = tasksCompleted;
    if (xp            > 0) inc['stats.xp']              = xp;

    if (Object.keys(inc).length === 0)
      return res.json({ success: true, message: 'Nada que sincronizar.' });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: inc },
      { new: true }
    ).select('-password');

    if (!user)
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });

    return res.json({ success: true, user: safeUser(user) });
  } catch (err) {
    console.error('[syncStats]', err.message);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

module.exports = { register, login, getProfile, updateProfile, syncStats };
