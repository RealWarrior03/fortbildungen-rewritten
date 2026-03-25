const express = require('express');
const jwt = require('jsonwebtoken');
const userAuth = require('../middleware/userAuth');
const { authenticateUser } = require('../services/adAuth');
require('dotenv').config();

const router = express.Router();

function normalizeConfiguredAdminGroups(value) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function extractCn(entry) {
  const match = /^cn=([^,]+)/i.exec(String(entry || '').trim());
  return match ? match[1].toLowerCase() : String(entry || '').trim().toLowerCase();
}

function resolveRoles(groups) {
  const normalizedUserGroups = (groups || []).map((group) => String(group).trim().toLowerCase());
  const configuredAdminGroups = normalizeConfiguredAdminGroups(process.env.AD_ADMIN_GROUPS);
  const configuredAdminGroupCns = configuredAdminGroups.map(extractCn);

  const isAdmin = configuredAdminGroups.some((configured) => normalizedUserGroups.includes(configured))
    || configuredAdminGroupCns.some((configuredCn) => normalizedUserGroups.includes(configuredCn));

  return isAdmin ? ['user', 'admin'] : ['user'];
}

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Benutzername und Passwort sind erforderlich' });
    }

    const user = await authenticateUser(username, password);
    const roles = resolveRoles(user.groups);

    const token = jwt.sign(
      {
        sub: user.userPrincipalName,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        groups: user.groups,
        roles
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.json({
      message: 'Authentifizierung erfolgreich',
      token,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      roles
    });
  } catch (error) {
    console.error('User-Login-Fehler:', error);
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Server-Fehler beim Login' });
  }
});

router.get('/me', userAuth, (req, res) => {
  return res.json(req.userData);
});

module.exports = router;