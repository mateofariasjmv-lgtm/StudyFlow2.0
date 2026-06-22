const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const taskController = require('../controllers/taskController');
const protect = require('../middleware/auth');

// Rutas Públicas
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Rutas Privadas Protegidas
router.get('/auth/profile', protect, authController.getProfile);
router.put('/auth/profile', protect, authController.updateProfile);
router.post('/auth/sync-stats', protect, authController.syncStats);

// Rutas CRUD
router.get('/tasks', protect, taskController.getTasks);
router.post('/tasks', protect, taskController.createTask);
router.put('/tasks/:id', protect, taskController.updateTask);
router.delete('/tasks/:id', protect, taskController.deleteTask);

module.exports = router;