const Task = require('../models/Task');

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ dueDate: 1 });
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { text, description, priority, category, subject, dueDate } = req.body;
    const newTask = await Task.create({
      user: req.user.id,
      text,
      description,
      priority,
      category,
      subject,
      dueDate
    });
    res.status(201).json({ success: true, task: newTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    let task = await Task.findById(id);

    if (!task || task.user.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Tarea no encontrada o no autorizada' });
    }

    task = await Task.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task || task.user.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Tarea no encontrada o no autorizada' });
    }

    await task.deleteOne();
    res.json({ success: true, message: 'Tarea eliminada de la base de datos' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};