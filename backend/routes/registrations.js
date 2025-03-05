const express = require('express');
const router = express.Router();
const db = require('../config/database');
const adminAuth = require('../middleware/adminAuth');
const ipCheck = require('../middleware/ipCheck');

// Alle Anmeldungen abrufen (nur Admin)
router.get('/', adminAuth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, p.name, p.email, p.department, 
             s.date_time, s.location, 
             c.title_de, c.title_en
      FROM registrations r
      JOIN persons p ON r.person_id = p.id
      JOIN sessions s ON r.session_id = s.id
      JOIN courses c ON s.course_id = c.id
      ORDER BY r.registration_time DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Anmeldungen:', error);
    res.status(500).json({ message: 'Server-Fehler beim Abrufen der Anmeldungen' });
  }
});

// Anmeldungen für einen bestimmten Termin abrufen (nur Admin)
router.get('/session/:sessionId', adminAuth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, p.name, p.email, p.department
      FROM registrations r
      JOIN persons p ON r.person_id = p.id
      WHERE r.session_id = ?
      ORDER BY r.registration_time
    `, [req.params.sessionId]);
    res.json(rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Anmeldungen:', error);
    res.status(500).json({ message: 'Server-Fehler beim Abrufen der Anmeldungen' });
  }
});

// Anmeldungen für eine bestimmte Person abrufen
router.get('/person/:email', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, s.date_time, s.location, c.title_de, c.title_en
      FROM registrations r
      JOIN persons p ON r.person_id = p.id
      JOIN sessions s ON r.session_id = s.id
      JOIN courses c ON s.course_id = c.id
      WHERE p.email = ?
      ORDER BY s.date_time
    `, [req.params.email]);
    res.json(rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Anmeldungen:', error);
    res.status(500).json({ message: 'Server-Fehler beim Abrufen der Anmeldungen' });
  }
});

// Einzelne Anmeldung abrufen
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, p.name, p.email, p.department, 
             s.date_time, s.location, s.course_id,
             c.title_de, c.title_en
      FROM registrations r
      JOIN persons p ON r.person_id = p.id
      JOIN sessions s ON r.session_id = s.id
      JOIN courses c ON s.course_id = c.id
      WHERE r.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Anmeldung nicht gefunden' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Fehler beim Abrufen der Anmeldung:', error);
    res.status(500).json({ message: 'Server-Fehler beim Abrufen der Anmeldung' });
  }
});

// Neue Anmeldung erstellen
router.post('/', async (req, res) => {
  try {
    const { person_id, session_id } = req.body;
    const clientIp = req.clientIp;
    
    // Prüfen, ob noch Plätze verfügbar sind
    const [session] = await db.query(
      'SELECT max_participants FROM sessions WHERE id = ?',
      [session_id]
    );
    
    if (session.length === 0) {
      return res.status(404).json({ message: 'Termin nicht gefunden' });
    }
    
    const [registrations] = await db.query(
      'SELECT COUNT(*) as count FROM registrations WHERE session_id = ?',
      [session_id]
    );
    
    if (registrations[0].count >= session[0].max_participants) {
      return res.status(400).json({ message: 'Keine freien Plätze mehr verfügbar' });
    }
    
    // Anmeldung erstellen
    const [result] = await db.query(
      'INSERT INTO registrations (person_id, session_id, registration_ip) VALUES (?, ?, ?)',
      [person_id, session_id, clientIp]
    );
    
    res.status(201).json({ 
      message: 'Anmeldung erfolgreich erstellt', 
      registrationId: result.insertId 
    });
  } catch (error) {
    console.error('Fehler beim Erstellen der Anmeldung:', error);
    
    // Prüfen, ob es ein Unique-Key-Constraint-Fehler ist
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Diese Person ist bereits für diesen Termin angemeldet' });
    }
    
    res.status(500).json({ message: 'Server-Fehler beim Erstellen der Anmeldung' });
  }
});

// Anmeldung aktualisieren (nur vom selben IP oder Admin)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { session_id } = req.body;
    const clientIp = req.clientIp;
    
    // Prüfen, ob die Anmeldung existiert und vom selben IP kommt
    const [registration] = await db.query(
      'SELECT registration_ip FROM registrations WHERE id = ?',
      [id]
    );
    
    if (registration.length === 0) {
      return res.status(404).json({ message: 'Anmeldung nicht gefunden' });
    }
    
    // Wenn nicht Admin und nicht vom selben IP, dann Zugriff verweigern
    const isAdmin = req.headers.authorization && req.headers.authorization.startsWith('Bearer ');
    if (!isAdmin && registration[0].registration_ip !== clientIp) {
      return res.status(403).json({ 
        message: 'Sie können nur Anmeldungen bearbeiten, die von diesem Computer aus erstellt wurden' 
      });
    }
    
    // Prüfen, ob noch Plätze verfügbar sind
    const [session] = await db.query(
      'SELECT max_participants FROM sessions WHERE id = ?',
      [session_id]
    );
    
    if (session.length === 0) {
      return res.status(404).json({ message: 'Termin nicht gefunden' });
    }
    
    const [registrations] = await db.query(
      'SELECT COUNT(*) as count FROM registrations WHERE session_id = ?',
      [session_id]
    );
    
    if (registrations[0].count >= session[0].max_participants) {
      return res.status(400).json({ message: 'Keine freien Plätze mehr verfügbar' });
    }
    
    // Anmeldung aktualisieren
    const [result] = await db.query(
      'UPDATE registrations SET session_id = ? WHERE id = ?',
      [session_id, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Anmeldung nicht gefunden' });
    }
    
    res.json({ message: 'Anmeldung erfolgreich aktualisiert' });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Anmeldung:', error);
    res.status(500).json({ message: 'Server-Fehler beim Aktualisieren der Anmeldung' });
  }
});

// Anmeldung löschen (nur vom selben IP oder Admin)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const clientIp = req.clientIp;
    
    // Prüfen, ob die Anmeldung existiert und vom selben IP kommt
    const [registration] = await db.query(
      'SELECT registration_ip FROM registrations WHERE id = ?',
      [id]
    );
    
    if (registration.length === 0) {
      return res.status(404).json({ message: 'Anmeldung nicht gefunden' });
    }
    
    // Wenn nicht Admin und nicht vom selben IP, dann Zugriff verweigern
    const isAdmin = req.headers.authorization && req.headers.authorization.startsWith('Bearer ');
    if (!isAdmin && registration[0].registration_ip !== clientIp) {
      return res.status(403).json({ 
        message: 'Sie können nur Anmeldungen löschen, die von diesem Computer aus erstellt wurden' 
      });
    }
    
    // Anmeldung löschen
    const [result] = await db.query(
      'DELETE FROM registrations WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Anmeldung nicht gefunden' });
    }
    
    res.json({ message: 'Anmeldung erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen der Anmeldung:', error);
    res.status(500).json({ message: 'Server-Fehler beim Löschen der Anmeldung' });
  }
});

module.exports = router;