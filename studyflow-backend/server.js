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
// CONFIGURACIÓN CORS
// ===============================

const allowedOrigins = [
    'https://proyectojmv.netlify.app',
    'https://studyfloowww.netlify.app',
    'http://localhost:5000',
    'http://127.0.0.1:5500'
];


app.use(cors({
    origin: function(origin, callback) {

        // Permitir Postman, Render y peticiones sin origen
        if (!origin) {
            return callback(null, true);
        }


        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }


        return callback(null, false);
    },

    methods: [
        'GET',
        'POST',
        'PUT',
        'DELETE',
        'PATCH',
        'OPTIONS'
    ],

    allowedHeaders: [
        'Content-Type',
        'Authorization'
    ],

    credentials: true
}));


// Permitir preflight CORS
app.options('*', cors());


// ===============================
// MIDDLEWARE JSON
// ===============================

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
        message: 'Ruta API no encontrada'
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