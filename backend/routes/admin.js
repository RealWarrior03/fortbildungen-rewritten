const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const adminAuth = require('../middleware/adminAuth');
require('dotenv').config();

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const [admins] = await db.query(
      'SELECT * FROM admins WHERE username = ?',
      [username]
    );
    
    if (admins.length === 0) {
      return res.status(401).json({ message: 'Authentifizierung fehlgeschlagen (user not found)' });
    }
    
    const admin = admins[0];
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Authentifizierung fehlgeschlagen' });
    }
    
    const token = jwt.sign(
      { adminId: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Authentifizierung erfolgreich',
      token: token,
      adminId: admin.id,
      username: admin.username
    });
  } catch (error) {
    console.error('Login-Fehler:', error);
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
      SELECT r.id, r.registration_time, p.name, p.email, c.title_de, s.date_time
      FROM registrations r
      JOIN persons p ON r.person_id = p.id
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
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.adminData.adminId;
    
    // Admin aus der Datenbank abrufen
    const [admins] = await db.query(
      'SELECT * FROM admins WHERE id = ?',
      [adminId]
    );
    
    if (admins.length === 0) {
      return res.status(404).json({ message: 'Admin nicht gefunden' });
    }
    
    const admin = admins[0];
    
    // Aktuelles Passwort überprüfen
    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Aktuelles Passwort ist falsch' });
    }
    
    // Neues Passwort hashen und speichern
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await db.query(
      'UPDATE admins SET password_hash = ? WHERE id = ?',
      [hashedPassword, adminId]
    );
    
    res.json({ message: 'Passwort erfolgreich geändert' });
  } catch (error) {
    console.error('Fehler beim Ändern des Passworts:', error);
    res.status(500).json({ message: 'Server-Fehler beim Ändern des Passworts' });
  }
});

module.exports = router;