const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const adminAuth = require('../middleware/adminAuth');
const { authenticateAdmin } = require('../services/adAuth');
require('dotenv').config();

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Benutzername und Passwort sind erforderlich' });
    }

    const adUser = await authenticateAdmin(username, password);

    const token = jwt.sign(
      {
        sub: adUser.userPrincipalName,
        username: adUser.username,
        displayName: adUser.displayName,
        groups: adUser.groups,
        roles: ['admin']
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      message: 'Authentifizierung erfolgreich',
      token,
      username: adUser.username,
      displayName: adUser.displayName,
      groups: adUser.groups
    });
  } catch (error) {
    console.error('Login-Fehler:', error);
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }

    res.status(500).json({ message: 'Server-Fehler beim Login' });
  }
});

// Dashboard-Daten abrufen
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    // Anzahl der Kurse
    const [coursesCount] = await db.query(
      'SELECT COUNT(*) as count FROM courses WHERE active = true'
    );
    
    // Anzahl der Termine
    const [sessionsCount] = await db.query(
      'SELECT COUNT(*) as count FROM sessions'
    );
    
    // Anzahl der Anmeldungen
    const [registrationsCount] = await db.query(
      'SELECT COUNT(*) as count FROM registrations'
    );
    
    // Anzahl der Personen
    const [personsCount] = await db.query(
      'SELECT COUNT(*) as count FROM persons'
    );
    
    // Neueste Anmeldungen
    const [latestRegistrations] = await db.query(`
      SELECT 
        r.id,
        r.registration_time,
        COALESCE(r.user_display_name, p.name) as name,
        COALESCE(r.user_email, p.email) as email,
        c.title_de,
        c.title_en,
        s.date_time
      FROM registrations r
      LEFT JOIN persons p ON r.person_id = p.id
      JOIN sessions s ON r.session_id = s.id
      JOIN courses c ON s.course_id = c.id
      ORDER BY r.registration_time DESC
      LIMIT 5
    `);
    
    res.json({
      counts: {
        courses: coursesCount[0].count,
        sessions: sessionsCount[0].count,
        registrations: registrationsCount[0].count,
        persons: personsCount[0].count
      },
      latestRegistrations
    });
  } catch (error) {
    console.error('Dashboard-Fehler:', error);
    res.status(500).json({ message: 'Server-Fehler beim Abrufen der Dashboard-Daten' });
  }
});

// Admin-Passwort ändern
router.put('/change-password', adminAuth, async (req, res) => {
  return res.status(501).json({
    message: 'Passwortwechsel erfolgt zentral im Active Directory und nicht in dieser Anwendung.'
  });
});

module.exports = router;