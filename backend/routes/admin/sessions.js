// const express = require('express');
const express = require('express');
const router = express.Router();
// const db = require('../../config/database');
const db = require('../../config/database');
// const adminAuth = require('../../middleware/adminAuth');
const adminAuth = require('../../middleware/adminAuth');
const { format } = require('date-fns');

// Alle Routen mit Admin-Auth schützen
router.use(adminAuth);

// Alle Termine abrufen
router.get('/', async (req, res) => {
    try {
        const [sessions] = await db.query(`
            SELECT 
                s.*,
                c.title_de as course_title_de,
                c.title_en as course_title_en,
                COUNT(r.id) as participant_count
            FROM sessions s
            LEFT JOIN courses c ON s.course_id = c.id
            LEFT JOIN registrations r ON s.id = r.session_id
            GROUP BY s.id
            ORDER BY s.date_time ASC
        `);

        res.json(sessions);
    } catch (error) {
        console.error('Fehler beim Abrufen der Termine:', error);
        res.status(500).json({ message: 'Fehler beim Abrufen der Termine' });
    }
});

// Einzelnen Termin abrufen
router.get('/:id', async (req, res) => {
    try {
        const [sessions] = await db.query(`
            SELECT 
                s.*,
                c.title_de as course_title_de,
                c.title_en as course_title_en,
                c.max_participants,
                COUNT(r.id) as participant_count
            FROM sessions s
            LEFT JOIN courses c ON s.course_id = c.id
            LEFT JOIN registrations r ON s.id = r.session_id
            WHERE s.id = ?
            GROUP BY s.id
        `, [req.params.id]);

        if (sessions.length === 0) {
            return res.status(404).json({ message: 'Termin nicht gefunden' });
        }

        res.json(sessions[0]);
    } catch (error) {
        console.error('Fehler beim Abrufen des Termins:', error);
        res.status(500).json({ message: 'Fehler beim Abrufen des Termins' });
    }
});

// Neuen Termin erstellen
router.post('/', async (req, res) => {
    const connection = await db.getConnection();
    try {
        console.log('Starting transaction');

        await connection.beginTransaction();

        const {
            course_id,
            date_time,
            location,
            max_participants
        } = req.body;

        // Validierung
        if (!course_id || !date_time || !location || !max_participants) {
            return res.status(400).json({ message: 'Pflichtfelder fehlen' });
        }

        console.log('Checking course');

        // Prüfen ob der Kurs existiert
        const [courses] = await connection.query(
            'SELECT id FROM courses WHERE id = ?',
            [course_id]
        );

        if (courses.length === 0) {
            return res.status(400).json({ message: 'Ungültiger Kurs' });
        }

        // Prüfen ob der Zeitpunkt in der Zukunft liegt
        if (new Date(date_time) <= new Date()) {
            return res.status(400).json({ message: 'Termin muss in der Zukunft liegen' });
        }

        console.log('Creating session:');

        const [result] = await connection.query(`
            INSERT INTO sessions (
                course_id,
                date_time,
                location,
                max_participants
            ) VALUES (?, ?, ?, ?)
        `, [
            course_id,
            format(date_time, 'yyyy-MM-dd HH:mm:ss'),
            location,
            max_participants
        ]);

        await connection.commit();

        console.log('Session created:', result.id);

        const [newSession] = await connection.query(
            'SELECT * FROM sessions WHERE id = ?',
            [result.id]
        );

        res.status(201).json(newSession[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Fehler beim Erstellen des Termins:', error);
        res.status(500).json({ message: 'Fehler beim Erstellen des Termins' });
    } finally {
        connection.release();
    }
});

// Termin aktualisieren
router.put('/:id', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const {
            course_id,
            date_time,
            location,
            max_participants
        } = req.body;

        // Validierung
        if (!course_id || !date_time || !location || !max_participants) {
            return res.status(400).json({ message: 'Pflichtfelder fehlen' });
        }

        // Prüfen ob der Termin existiert und Teilnehmerzahl abrufen
        const [sessions] = await connection.query(`
            SELECT s.*, COUNT(r.id) as participant_count
            FROM sessions s
            LEFT JOIN registrations r ON s.id = r.session_id
            WHERE s.id = ?
            GROUP BY s.id
        `, [req.params.id]);

        if (sessions.length === 0) {
            return res.status(404).json({ message: 'Termin nicht gefunden' });
        }

        const session = sessions[0];

        // Wenn es Teilnehmer gibt, darf der Kurs nicht geändert werden
        if (session.participant_count > 0 && session.course_id !== course_id) {
            return res.status(400).json({
                message: 'Kurs kann nicht geändert werden, da bereits Teilnehmer angemeldet sind'
            });
        }

        await connection.query(`
            UPDATE sessions
            SET 
                course_id = ?,
                date_time = ?,
                location = ?,
                max_participants = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            course_id,
            date_time,
            location,
            max_participants,
            req.params.id
        ]);

        await connection.commit();

        const [updatedSession] = await connection.query(
            'SELECT * FROM sessions WHERE id = ?',
            [req.params.id]
        );

        res.json(updatedSession[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Fehler beim Aktualisieren des Termins:', error);
        res.status(500).json({ message: 'Fehler beim Aktualisieren des Termins' });
    } finally {
        connection.release();
    }
});

// Termin löschen
router.delete('/:id', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Prüfen ob es Anmeldungen gibt
        const [registrations] = await connection.query(
            'SELECT COUNT(*) as count FROM registrations WHERE session_id = ?',
            [req.params.id]
        );

        if (registrations[0].count > 0) {
            return res.status(400).json({
                message: 'Termin kann nicht gelöscht werden, da bereits Teilnehmer angemeldet sind'
            });
        }

        const [result] = await connection.query(
            'DELETE FROM sessions WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Termin nicht gefunden' });
        }

        await connection.commit();
        res.json({ message: 'Termin erfolgreich gelöscht' });
    } catch (error) {
        await connection.rollback();
        console.error('Fehler beim Löschen des Termins:', error);
        res.status(500).json({ message: 'Fehler beim Löschen des Termins' });
    } finally {
        connection.release();
    }
});

// Teilnehmer eines Termins abrufen
router.get('/:id/participants', async (req, res) => {
    try {
        const [participants] = await db.query(`
            SELECT 
                r.id as registration_id,
                p.*,
                r.registration_time as registration_date
            FROM registrations r
            JOIN persons p ON r.person_id = p.id
            WHERE r.session_id = ?
            ORDER BY r.registration_time ASC
        `, [req.params.id]);

        res.json(participants);
    } catch (error) {
        console.error('Fehler beim Abrufen der Teilnehmer:', error);
        res.status(500).json({ message: 'Fehler beim Abrufen der Teilnehmer' });
    }
});

module.exports = router; 