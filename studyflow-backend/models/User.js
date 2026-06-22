const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre completo es obligatorio'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El correo electrónico es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  settings: {
    theme: { type: String, default: 'light' },
    school: { type: String, default: '' },
    grade: { type: String, default: '3ro de Bachillerato' }
  },
  stats: {
    streak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: String, default: '' },
    minutes: { type: Number, default: 0 },
    pomodoros: { type: Number, default: 0 },
    sessions: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    xp: { type: Number, default: 0 }
  },
  weekData: {
    type: [Number],
    default: [0, 0, 0, 0, 0, 0, 0] // Lunes a Domingo
  },
  lastLogin: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('User', UserSchema);