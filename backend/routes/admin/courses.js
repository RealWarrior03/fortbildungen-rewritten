const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const adminAuth = require('../../middleware/adminAuth');
const { normalizeGroupName } = require('../../services/courseAccess');

// Alle Routen mit Admin-Auth schützen
router.use(adminAuth);

// Alle Kurse abrufen
router.get('/', async (req, res) => {
    try {
        const [courses] = await db.query(`
            SELECT 
                c.*,
                COUNT(DISTINCT s.id) as session_count,
                COUNT(DISTINCT r.id) as registration_count
            FROM courses c
            LEFT JOIN sessions s ON c.id = s.course_id
            LEFT JOIN registrations r ON s.id = r.session_id
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `);
        res.json(courses);
    } catch (error) {
        console.error('Fehler beim Abrufen der Kurse:', error);
        res.status(500).json({ message: 'Fehler beim Abrufen der Kurse' });
    }
});

// Einzelnen Kurs abrufen
router.get('/:id', async (req, res) => {
    try {
        const [courses] = await db.query(`
            SELECT 
                c.*,
                COUNT(DISTINCT s.id) as session_count,
                COUNT(DISTINCT r.id) as registration_count
            FROM courses c
            LEFT JOIN sessions s ON c.id = s.course_id
            LEFT JOIN registrations r ON s.id = r.session_id
            WHERE c.id = ?
            GROUP BY c.id
        `, [req.params.id]);

        if (courses.length === 0) {
            return res.status(404).json({ message: 'Kurs nicht gefunden' });
        }

        res.json(courses[0]);
    } catch (error) {
        console.error('Fehler beim Abrufen des Kurses:', error);
        res.status(500).json({ message: 'Fehler beim Abrufen des Kurses' });
    }
});

// Neuen Kurs erstellen
router.post('/', async (req, res) => {
    try {
        const {
            title_de,
            title_en,
            description_de,
            description_en,
            ad_group,
            active
        } = req.body;

        const normalizedTitleDe = String(title_de || '').trim();
        const normalizedTitleEn = String(title_en || '').trim() || normalizedTitleDe;
        const normalizedDescriptionDe = String(description_de || '').trim();
        const normalizedDescriptionEn = String(description_en || '').trim() || null;
        const normalizedAdGroup = normalizeGroupName(ad_group);

        // Validierung
        if (!normalizedTitleDe) {
            return res.status(400).json({ message: 'Deutscher Titel ist erforderlich' });
        }

        if (!normalizedAdGroup) {
            return res.status(400).json({ message: 'AD-Gruppe ist erforderlich' });
        }

        const [result] = await db.query(`
            INSERT INTO courses (
                title_de, 
                title_en, 
                description_de, 
                description_en, 
                ad_group,
                active
            ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
            normalizedTitleDe,
            normalizedTitleEn,
            normalizedDescriptionDe || null,
            normalizedDescriptionEn,
            normalizedAdGroup,
            active !== undefined ? active : true
        ]);

        const [newCourse] = await db.query('SELECT * FROM courses WHERE id = ?', [result.insertId]);
        res.status(201).json(newCourse[0]);
    } catch (error) {
        console.error('Fehler beim Erstellen des Kurses:', error);
        res.status(500).json({ message: 'Fehler beim Erstellen des Kurses' });
    }
});

// Kurs aktualisieren
router.put('/:id', async (req, res) => {
    try {
        const {
            title_de,
            title_en,
            description_de,
            description_en,
            ad_group,
            active
        } = req.body;

        const normalizedTitleDe = String(title_de || '').trim();
        const normalizedTitleEn = String(title_en || '').trim() || normalizedTitleDe;
        const normalizedDescriptionDe = String(description_de || '').trim();
        const normalizedDescriptionEn = String(description_en || '').trim() || null;
        const normalizedAdGroup = normalizeGroupName(ad_group);

        // Validierung
        if (!normalizedTitleDe) {
            return res.status(400).json({ message: 'Deutscher Titel ist erforderlich' });
        }

        if (!normalizedAdGroup) {
            return res.status(400).json({ message: 'AD-Gruppe ist erforderlich' });
        }

        await db.query(`
            UPDATE courses 
            SET 
                title_de = ?,
                title_en = ?,
                description_de = ?,
                description_en = ?,
                ad_group = ?,
                active = ?
            WHERE id = ?
        `, [
            normalizedTitleDe,
            normalizedTitleEn,
            normalizedDescriptionDe || null,
            normalizedDescriptionEn,
            normalizedAdGroup,
            active !== undefined ? active : true,
            req.params.id
        ]);

        const [updatedCourse] = await db.query('SELECT * FROM courses WHERE id = ?', [req.params.id]);

        if (updatedCourse.length === 0) {
            return res.status(404).json({ message: 'Kurs nicht gefunden' });
        }

        res.json(updatedCourse[0]);
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Kurses:', error);
        res.status(500).json({ message: 'Fehler beim Aktualisieren des Kurses' });
    }
});

// Kurs löschen
router.delete('/:id', async (req, res) => {
    try {
        // Prüfen, ob es aktive Registrierungen gibt
        const [registrations] = await db.query(`
            SELECT COUNT(*) as count
            FROM sessions s
            JOIN registrations r ON s.id = r.session_id
            WHERE s.course_id = ?
        `, [req.params.id]);

        if (registrations[0].count > 0) {
            return res.status(400).json({
                message: 'Dieser Kurs kann nicht gelöscht werden, da bereits Anmeldungen existieren'
            });
        }

        // Erst zugehörige Sessions löschen
        await db.query('DELETE FROM sessions WHERE course_id = ?', [req.params.id]);

        // Dann den Kurs löschen
        const [result] = await db.query('DELETE FROM courses WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Kurs nicht gefunden' });
        }

        res.json({ message: 'Kurs erfolgreich gelöscht' });
    } catch (error) {
        console.error('Fehler beim Löschen des Kurses:', error);
        res.status(500).json({ message: 'Fehler beim Löschen des Kurses' });
    }
});

module.exports = router; 