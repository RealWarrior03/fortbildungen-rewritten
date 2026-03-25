const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentifizierung fehlgeschlagen' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const validRoles = Array.isArray(decodedToken.roles)
      ? decodedToken.roles
      : [];

    if (!validRoles.includes('user') && !validRoles.includes('admin')) {
      return res.status(403).json({ message: 'Keine Berechtigung' });
    }

    req.userData = {
      subject: decodedToken.sub,
      username: decodedToken.username,
      displayName: decodedToken.displayName,
      email: decodedToken.email || '',
      groups: decodedToken.groups || [],
      roles: validRoles
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentifizierung fehlgeschlagen' });
  }
};