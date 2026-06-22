const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: [true, 'El texto de la tarea es requerido'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  priority: {
    type: String,
    enum: ['alta', 'media', 'baja'],
    default: 'media'
  },
  category: {
    type: String,
    enum: ['Académica', 'Personal', 'Proyecto'],
    default: 'Académica'
  },
  subject: {
    type: String,
    default: 'General'
  },
  done: {
    type: Boolean,
    default: false
  },
  dueDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Task', TaskSchema);