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
        '*'
    ],
    methods: [
        'GET',
        'POST',
        'PUT',
        'DELETE',
        'PATCH'
    ],
    allowedHeaders: [
        'Content-Type',
        'Authorization'
    ]
}));

app.use(express.json());


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