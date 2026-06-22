require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const apiRoutes = require('./routes/api');

const app = express();


// ===============================
// CONEXIÓN BASE DE DATOS
// ===============================
connectDB();


// ===============================
// MIDDLEWARES
// ===============================

app.use(cors({
    origin: [
        'https://studyfloowww.netlify.app',
        'http://localhost:5000',
        'http://127.0.0.1:5500'
    ],
    methods: [
        'GET',
        'POST',
        'PUT',
        'DELETE',
        'OPTIONS'
    ],
    allowedHeaders: [
        'Content-Type',
        'Authorization'
    ],
    credentials: true
}));


// ===============================
// RUTA DE PRUEBA RENDER
// ===============================

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🚀 StudyFlow API funcionando correctamente',
        status: 'online'
    });
});


// ===============================
// RUTAS API
// ===============================

app.use('/api', apiRoutes);


// ===============================
// ERROR 404
// ===============================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});


// ===============================
// SERVIDOR
// ===============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`
=================================
 StudyFlow Backend iniciado
 Puerto: ${PORT}
 Estado: ONLINE
=================================
`);
});