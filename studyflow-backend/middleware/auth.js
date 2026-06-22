const jsonwebtoken = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Acceso denegado. No se proporcionó token de seguridad.' });
  }

  try {
    const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };// Inyectar ID del usuario en la petición consecutiva
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token de seguridad inválido o expirado' });
  }
};

module.exports = protect;