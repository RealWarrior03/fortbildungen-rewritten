const express = require('express');
const router = express.Router();
const db = require('../config/database');
const adminAuth = require('../middleware/adminAuth');
const userAuth = require('../middleware/userAuth');

// Alle Personen abrufen (nur Admin)
router.get('/', adminAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM persons ORDER BY name'
    );
    res.json(rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Personen:', error);
    res.status(500).json({ message: 'Server-Fehler beim Abrufen der Personen' });
  }
});

// Person nach E-Mail suchen
router.get('/search', async (req, res) => {
  try {
    const searchQuery = req.query.q;
    if (!searchQuery || searchQuery.length < 2) {
      return res.json([]);
    }

    const [persons] = await db.query(
      `SELECT id, name, email, department 
       FROM persons 
       WHERE name LIKE ? OR email LIKE ? OR department LIKE ?
       LIMIT 10`,
      [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`]
    );

    res.json(persons);
  } catch (error) {
    console.error('Fehler bei der Personensuche:', error);
    res.status(500).json({ message: 'Fehler bei der Personensuche' });
  }
});

// Aktuell eingeloggtes AD-Profil abrufen
router.get('/me', userAuth, async (req, res) => {
  try {
    const email = String(req.userData.email || '').trim();
    if (!email) {
      return res.status(400).json({ message: 'Im Token ist keine E-Mail hinterlegt.' });
    }

    return res.json({
      subject: req.userData.subject,
      username: req.userData.username,
      name: String(req.userData.displayName || req.userData.username || email).trim(),
      email,
      department: ''
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des eigenen Profils:', error);
    return res.status(500).json({ message: 'Server-Fehler beim Abrufen der Person' });
  }
});

// Einzelne Person abrufen
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM persons WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Person nicht gefunden' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Fehler beim Abrufen der Person:', error);
    res.status(500).json({ message: 'Server-Fehler beim Abrufen der Person' });
  }
});

// Neue Person erstellen
router.post('/', async (req, res) => {
  try {
    const { name, email, department } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO persons (name, email, department) VALUES (?, ?, ?)',
      [name, email, department]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      email,
      department
    });
  } catch (error) {
    console.error('Fehler beim Erstellen der Person:', error);
    res.status(500).json({ message: 'Fehler beim Erstellen der Person' });
  }
});

// Person aktualisieren (nur Admin)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, email, department } = req.body;
    
    const [result] = await db.query(
      'UPDATE persons SET name = ?, email = ?, department = ? WHERE id = ?',
      [name, email, department, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Person nicht gefunden' });
    }
    
    res.json({ message: 'Person erfolgreich aktualisiert' });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Person:', error);
    res.status(500).json({ message: 'Server-Fehler beim Aktualisieren der Person' });
  }
});

// Person löschen (nur Admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM persons WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Person nicht gefunden' });
    }
    
    res.json({ message: 'Person erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen der Person:', error);
    res.status(500).json({ message: 'Server-Fehler beim Löschen der Person' });
  }
});

module.exports = router;