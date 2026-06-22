const mongoose = require('mongoose');

const connectDB = async () => {
    try {

        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI no está configurada en las variables de entorno');
        }

        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log('=================================');
        console.log(' MongoDB conectado correctamente');
        console.log(` Host: ${conn.connection.host}`);
        console.log('=================================');

    } catch (error) {

        console.error('=================================');
        console.error(' Error conectando MongoDB');
        console.error(error.message);
        console.error('=================================');

        process.exit(1);
    }
};

module.exports = connectDB;