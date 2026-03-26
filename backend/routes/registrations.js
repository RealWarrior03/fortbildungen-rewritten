const express = require('express');
const router = express.Router();
const db = require('../config/database');
const adminAuth = require('../middleware/adminAuth');
const userAuth = require('../middleware/userAuth');
const { canUserAccessCourseByGroup, userHasAdminRole } = require('../services/courseAccess');

async function getSessionAndCourseForAccess(sessionId) {
  const [rows] = await db.query(
    `SELECT s.id, s.max_participants, c.id AS course_id, c.active, c.ad_group
     FROM sessions s
     JOIN courses c ON s.course_id = c.id
     WHERE s.id = ?`,
    [sessionId]
  );

  return rows[0] || null;
}

// Alle Anmeldungen abrufen (nur Admin)
router.get('/', adminAuth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, 
        COALESCE(r.user_display_name, p.name) as name,
        COALESCE(r.user_email, p.email) as email,
        p.department,
             s.date_time, s.location, 
             c.title_de, c.title_en
      FROM registrations r
      LEFT JOIN persons p ON r.person_id = p.id
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
      SELECT r.*, 
             COALESCE(r.user_display_name, p.name) as name,
             COALESCE(r.user_email, p.email) as email,
             p.department
      FROM registrations r
      LEFT JOIN persons p ON r.person_id = p.id
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
      JOIN sessions s ON r.session_id = s.id
      JOIN courses c ON s.course_id = c.id
      LEFT JOIN persons p ON r.person_id = p.id
      WHERE r.user_email = ? OR p.email = ?
      ORDER BY s.date_time
    `, [req.params.email, req.params.email]);
    res.json(rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Anmeldungen:', error);
    res.status(500).json({ message: 'Server-Fehler beim Abrufen der Anmeldungen' });
  }
});

// Eigene Anmeldungen des eingeloggten Benutzers abrufen
router.get('/me', userAuth, async (req, res) => {
  try {
    const userEmail = String(req.userData.email || '').trim();
    const userSub = String(req.userData.subject || '').trim();

    if (!userSub && !userEmail) {
      return res.status(400).json({ message: 'Im Token fehlt eine eindeutige Benutzeridentitaet.' });
    }

    const conditions = [];
    const params = [];

    if (userSub) {
      conditions.push('r.user_sub = ?');
      params.push(userSub);
    }

    if (userEmail) {
      conditions.push('r.user_email = ?');
      params.push(userEmail);
    }

    const [rows] = await db.query(`
      SELECT r.*, s.date_time, s.location, c.title_de, c.title_en
      FROM registrations r
      JOIN sessions s ON r.session_id = s.id
      JOIN courses c ON s.course_id = c.id
      WHERE ${conditions.join(' OR ')}
      ORDER BY s.date_time
    `, params);

    res.json(rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der eigenen Anmeldungen:', error);
    res.status(500).json({ message: 'Server-Fehler beim Abrufen der eigenen Anmeldungen' });
  }
});

// Einzelne Anmeldung abrufen
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, 
        COALESCE(r.user_display_name, p.name) as name,
        COALESCE(r.user_email, p.email) as email,
        p.department,
             s.date_time, s.location, s.course_id,
             c.title_de, c.title_en
      FROM registrations r
      LEFT JOIN persons p ON r.person_id = p.id
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
router.post('/', userAuth, async (req, res) => {
  try {
    const { session_id } = req.body;
    const clientIp = req.clientIp;
    const userSub = String(req.userData.subject || '').trim();
    const userEmail = String(req.userData.email || '').trim();
    const userDisplayName = String(req.userData.displayName || req.userData.username || userEmail).trim();

    if (!session_id) {
      return res.status(400).json({ message: 'session_id ist erforderlich' });
    }

    if (!userSub && !userEmail) {
      return res.status(400).json({ message: 'Im Token fehlt eine eindeutige Benutzeridentitaet.' });
    }
    
    const sessionWithCourse = await getSessionAndCourseForAccess(session_id);

    if (!sessionWithCourse) {
      return res.status(404).json({ message: 'Termin nicht gefunden' });
    }

    if (!sessionWithCourse.active) {
      return res.status(400).json({ message: 'Dieser Kurs ist nicht aktiv.' });
    }

    if (!canUserAccessCourseByGroup(req.userData, sessionWithCourse.ad_group)) {
      return res.status(403).json({ message: 'Sie sind fuer diese Fortbildung nicht freigeschaltet.' });
    }
    
    const [registrations] = await db.query(
      'SELECT COUNT(*) as count FROM registrations WHERE session_id = ?',
      [session_id]
    );
    
    if (registrations[0].count >= sessionWithCourse.max_participants) {
      return res.status(400).json({ message: 'Keine freien Plätze mehr verfügbar' });
    }
    
    // Anmeldung erstellen
    const [result] = await db.query(
      `INSERT INTO registrations 
       (session_id, registration_ip, user_sub, user_email, user_display_name) 
       VALUES (?, ?, ?, ?, ?)`,
      [session_id, clientIp, userSub || null, userEmail || null, userDisplayName || null]
    );
    
    res.status(201).json({ 
      message: 'Anmeldung erfolgreich erstellt', 
      registrationId: result.insertId 
    });
  } catch (error) {
    console.error('Fehler beim Erstellen der Anmeldung:', error);
    
    // Prüfen, ob es ein Unique-Key-Constraint-Fehler ist
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Sie sind bereits für diesen Termin angemeldet' });
    }
    
    res.status(500).json({ message: 'Server-Fehler beim Erstellen der Anmeldung' });
  }
});

// Anmeldung aktualisieren (nur vom selben IP oder Admin)
router.put('/:id', userAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { session_id } = req.body;
    const userSub = String(req.userData.subject || '').trim();
    const userEmail = String(req.userData.email || '').trim();
    const isAdmin = userHasAdminRole(req.userData);
    
    // Prüfen, ob die Anmeldung existiert und vom selben IP kommt
    const [registration] = await db.query(
      'SELECT user_sub, user_email FROM registrations WHERE id = ?',
      [id]
    );
    
    if (registration.length === 0) {
      return res.status(404).json({ message: 'Anmeldung nicht gefunden' });
    }
    
    const isOwnerBySub = userSub && registration[0].user_sub && registration[0].user_sub === userSub;
    const isOwnerByEmail = userEmail && registration[0].user_email && registration[0].user_email === userEmail;

    if (!isAdmin && !isOwnerBySub && !isOwnerByEmail) {
      return res.status(403).json({ 
        message: 'Sie können nur Ihre eigenen Anmeldungen bearbeiten.' 
      });
    }
    
    const sessionWithCourse = await getSessionAndCourseForAccess(session_id);

    if (!sessionWithCourse) {
      return res.status(404).json({ message: 'Termin nicht gefunden' });
    }

    if (!sessionWithCourse.active) {
      return res.status(400).json({ message: 'Dieser Kurs ist nicht aktiv.' });
    }

    if (!canUserAccessCourseByGroup(req.userData, sessionWithCourse.ad_group)) {
      return res.status(403).json({ message: 'Sie sind fuer diese Fortbildung nicht freigeschaltet.' });
    }
    
    const [registrations] = await db.query(
      'SELECT COUNT(*) as count FROM registrations WHERE session_id = ?',
      [session_id]
    );
    
    if (registrations[0].count >= sessionWithCourse.max_participants) {
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
router.delete('/:id', userAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userSub = String(req.userData.subject || '').trim();
    const userEmail = String(req.userData.email || '').trim();
    const isAdmin = userHasAdminRole(req.userData);
    
    // Prüfen, ob die Anmeldung existiert und vom selben IP kommt
    const [registration] = await db.query(
      'SELECT user_sub, user_email FROM registrations WHERE id = ?',
      [id]
    );
    
    if (registration.length === 0) {
      return res.status(404).json({ message: 'Anmeldung nicht gefunden' });
    }
    
    const isOwnerBySub = userSub && registration[0].user_sub && registration[0].user_sub === userSub;
    const isOwnerByEmail = userEmail && registration[0].user_email && registration[0].user_email === userEmail;

    if (!isAdmin && !isOwnerBySub && !isOwnerByEmail) {
      return res.status(403).json({ 
        message: 'Sie können nur Ihre eigenen Anmeldungen loeschen.' 
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