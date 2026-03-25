const express = require('express');
const router = express.Router();
const db = require('../config/database');
const adminAuth = require('../middleware/adminAuth');

// Alle aktiven Kurse abrufen
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM courses WHERE active = true'
    );
    res.json(rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Kurse:', error);
    res.status(500).json({ message: 'Server-Fehler beim Abrufen der Kurse' });
  }
});

// Einzelnen Kurs abrufen
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM courses WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Kurs nicht gefunden' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Fehler beim Abrufen des Kurses:', error);
    res.status(500).json({ message: 'Server-Fehler beim Abrufen des Kurses' });
  }
});

// Neuen Kurs erstellen (nur Admin)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { title_de, title_en, description_de, description_en, active } = req.body;
    const normalizedTitleDe = String(title_de || '').trim();
    const normalizedTitleEn = String(title_en || '').trim() || normalizedTitleDe;
    const normalizedDescriptionDe = String(description_de || '').trim() || null;
    const normalizedDescriptionEn = String(description_en || '').trim() || null;

    if (!normalizedTitleDe) {
      return res.status(400).json({ message: 'Deutscher Titel ist erforderlich' });
    }
    
    const [result] = await db.query(
      'INSERT INTO courses (title_de, title_en, description_de, description_en, active) VALUES (?, ?, ?, ?, ?)',
      [normalizedTitleDe, normalizedTitleEn, normalizedDescriptionDe, normalizedDescriptionEn, active || true]
    );
    
    res.status(201).json({ 
      message: 'Kurs erfolgreich erstellt', 
      courseId: result.insertId 
    });
  } catch (error) {
    console.error('Fehler beim Erstellen des Kurses:', error);
    res.status(500).json({ message: 'Server-Fehler beim Erstellen des Kurses' });
  }
});

// Kurs aktualisieren (nur Admin)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { title_de, title_en, description_de, description_en, active } = req.body;
    const normalizedTitleDe = String(title_de || '').trim();
    const normalizedTitleEn = String(title_en || '').trim() || normalizedTitleDe;
    const normalizedDescriptionDe = String(description_de || '').trim() || null;
    const normalizedDescriptionEn = String(description_en || '').trim() || null;

    if (!normalizedTitleDe) {
      return res.status(400).json({ message: 'Deutscher Titel ist erforderlich' });
    }
    
    const [result] = await db.query(
      'UPDATE courses SET title_de = ?, title_en = ?, description_de = ?, description_en = ?, active = ? WHERE id = ?',
      [normalizedTitleDe, normalizedTitleEn, normalizedDescriptionDe, normalizedDescriptionEn, active, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Kurs nicht gefunden' });
    }
    
    res.json({ message: 'Kurs erfolgreich aktualisiert' });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Kurses:', error);
    res.status(500).json({ message: 'Server-Fehler beim Aktualisieren des Kurses' });
  }
});

// Kurs löschen (nur Admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM courses WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Kurs nicht gefunden' });
    }
    
    res.json({ message: 'Kurs erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Kurses:', error);
    res.status(500).json({ message: 'Server-Fehler beim Löschen des Kurses' });
  }
});

module.exports = router;