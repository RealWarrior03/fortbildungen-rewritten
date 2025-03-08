const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const adminAuth = require('../../middleware/adminAuth');

// Alle Routen mit Admin-Auth schützen
router.use(adminAuth);

// Alle Personen abrufen
router.get('/', async (req, res) => {
    try {
        const [persons] = await db.query(
            'SELECT id, name, email, department, created_at, updated_at FROM persons ORDER BY name'
        );
        res.json(persons);
    } catch (error) {
        console.error('Fehler beim Abrufen der Personen:', error);
        res.status(500).json({ message: 'Fehler beim Abrufen der Personen' });
    }
});

// Eine einzelne Person abrufen
router.get('/:id', async (req, res) => {
    try {
        const [persons] = await db.query(
            'SELECT id, name, email, department, created_at, updated_at FROM persons WHERE id = ?',
            [req.params.id]
        );

        if (persons.length === 0) {
            return res.status(404).json({ message: 'Person nicht gefunden' });
        }

        res.json(persons[0]);
    } catch (error) {
        console.error('Fehler beim Abrufen der Person:', error);
        res.status(500).json({ message: 'Fehler beim Abrufen der Person' });
    }
});

// Neue Person erstellen
router.post('/', async (req, res) => {
    try {
        const { name, email, department } = req.body;

        // Validierung
        if (!name || !email) {
            return res.status(400).json({ message: 'Name und E-Mail sind erforderlich' });
        }

        // Prüfen, ob E-Mail bereits existiert
        const [existingPersons] = await db.query(
            'SELECT id FROM persons WHERE email = ?',
            [email]
        );

        if (existingPersons.length > 0) {
            return res.status(400).json({ message: 'Diese E-Mail-Adresse ist bereits registriert' });
        }

        const [result] = await db.query(
            'INSERT INTO persons (name, email, department) VALUES (?, ?, ?)',
            [name, email, department]
        );

        const [newPerson] = await db.query(
            'SELECT id, name, email, department, created_at, updated_at FROM persons WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json(newPerson[0]);
    } catch (error) {
        console.error('Fehler beim Erstellen der Person:', error);
        res.status(500).json({ message: 'Fehler beim Erstellen der Person' });
    }
});

// Person aktualisieren
router.put('/:id', async (req, res) => {
    try {
        const { name, email, department } = req.body;
        const personId = req.params.id;

        // Validierung
        if (!name || !email) {
            return res.status(400).json({ message: 'Name und E-Mail sind erforderlich' });
        }

        // Prüfen, ob E-Mail bereits existiert (außer bei der aktuellen Person)
        const [existingPersons] = await db.query(
            'SELECT id FROM persons WHERE email = ? AND id != ?',
            [email, personId]
        );

        if (existingPersons.length > 0) {
            return res.status(400).json({ message: 'Diese E-Mail-Adresse ist bereits registriert' });
        }

        await db.query(
            'UPDATE persons SET name = ?, email = ?, department = ? WHERE id = ?',
            [name, email, department, personId]
        );

        const [updatedPerson] = await db.query(
            'SELECT id, name, email, department, created_at, updated_at FROM persons WHERE id = ?',
            [personId]
        );

        if (updatedPerson.length === 0) {
            return res.status(404).json({ message: 'Person nicht gefunden' });
        }

        res.json(updatedPerson[0]);
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Person:', error);
        res.status(500).json({ message: 'Fehler beim Aktualisieren der Person' });
    }
});

// Person löschen
router.delete('/:id', async (req, res) => {
    try {
        const personId = req.params.id;

        // Prüfen, ob Person in Registrierungen verwendet wird
        const [registrations] = await db.query(
            'SELECT id FROM registrations WHERE person_id = ?',
            [personId]
        );

        if (registrations.length > 0) {
            return res.status(400).json({ 
                message: 'Diese Person kann nicht gelöscht werden, da sie bereits für Kurse angemeldet ist' 
            });
        }

        const [result] = await db.query(
            'DELETE FROM persons WHERE id = ?',
            [personId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Person nicht gefunden' });
        }

        res.json({ message: 'Person erfolgreich gelöscht' });
    } catch (error) {
        console.error('Fehler beim Löschen der Person:', error);
        res.status(500).json({ message: 'Fehler beim Löschen der Person' });
    }
});

module.exports = router; 