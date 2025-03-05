const express = require('express');
const router = express.Router();
const db = require('../config/database');
const adminAuth = require('../middleware/adminAuth');

// Alle Termine abrufen
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT s.*, c.title_de, c.title_en FROM sessions s JOIN courses c ON s.course_id = c.id'
    );
    res.json(rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Termine:', error);
    res.status(500).json({ message: 'Server-Fehler beim Abrufen der Termine' });
  }
});

// Termine für einen bestimmten Kurs abrufen
router.get('/course/:courseId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM sessions WHERE course_id = ? ORDER BY date_time',
      [req.params.courseId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Termine:', error);
    res.status(500).json({ message: 'Server-Fehler beim Abrufen der Termine' });
  }
});

// Einzelnen Termin abrufen
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM sessions WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Termin nicht gefunden' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Fehler beim Abrufen des Termins:', error);
    res.status(500).json({ message: 'Server-Fehler beim Abrufen des Termins' });
  }
});

// Verfügbare Plätze für einen Termin abrufen
router.get('/:id/available', async (req, res) => {
  try {
    const [session] = await db.query(
      'SELECT max_participants FROM sessions WHERE id = ?',
      [req.params.id]
    );
    
    if (session.length === 0) {
      return res.status(404).json({ message: 'Termin nicht gefunden' });
    }
    
    const [registrations] = await db.query(
      'SELECT COUNT(*) as count FROM registrations WHERE session_id = ?',
      [req.params.id]
    );
    
    const available = session[0].max_participants - registrations[0].count;
    
    res.json({ 
      sessionId: parseInt(req.params.id),
      maxParticipants: session[0].max_participants,
      registered: registrations[0].count,
      available: available
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der verfügbaren Plätze:', error);
    res.status(500).json({ message: 'Server-Fehler beim Abrufen der verfügbaren Plätze' });
  }
});

// Neuen Termin erstellen (nur Admin)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { course_id, date_time, location, max_participants } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO sessions (course_id, date_time, location, max_participants) VALUES (?, ?, ?, ?)',
      [course_id, date_time, location, max_participants]
    );
    
    res.status(201).json({ 
      message: 'Termin erfolgreich erstellt', 
      sessionId: result.insertId 
    });
  } catch (error) {
    console.error('Fehler beim Erstellen des Termins:', error);
    res.status(500).json({ message: 'Server-Fehler beim Erstellen des Termins' });
  }
});

// Termin aktualisieren (nur Admin)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { course_id, date_time, location, max_participants } = req.body;
    
    const [result] = await db.query(
      'UPDATE sessions SET course_id = ?, date_time = ?, location = ?, max_participants = ? WHERE id = ?',
      [course_id, date_time, location, max_participants, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Termin nicht gefunden' });
    }
    
    res.json({ message: 'Termin erfolgreich aktualisiert' });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Termins:', error);
    res.status(500).json({ message: 'Server-Fehler beim Aktualisieren des Termins' });
  }
});

// Termin löschen (nur Admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM sessions WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Termin nicht gefunden' });
    }
    
    res.json({ message: 'Termin erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Termins:', error);
    res.status(500).json({ message: 'Server-Fehler beim Löschen des Termins' });
  }
});

module.exports = router;