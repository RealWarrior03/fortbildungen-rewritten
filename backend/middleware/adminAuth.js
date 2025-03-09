const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.adminData = { adminId: decodedToken.adminId };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentifizierung fehlgeschlagen' });
  }
};