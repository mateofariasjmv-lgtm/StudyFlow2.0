const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[MongoDB] Base de Datos Conectada: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Error de Conexión]: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;