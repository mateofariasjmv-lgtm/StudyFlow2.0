require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const apiRoutes = require('./routes/api');

const app = express();

// Conectar a Base de Datos
connectDB();

// Middlewares Globales
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Inyección de Endpoints
app.use('/api', apiRoutes);

// Manejo de errores 404 globales
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta API no encontrada' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Server] Corriendo perfectamente en puerto http://localhost:${PORT}`);
});