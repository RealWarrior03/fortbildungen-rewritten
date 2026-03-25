-- Migration: Englischfelder fuer Kurse optional machen
-- Hinweis: Vorher Backup erstellen.

ALTER TABLE courses
  MODIFY title_en VARCHAR(200) NULL;

-- Optional: Bestehende Leerwerte sinnvoll auffuellen
UPDATE courses
SET title_en = title_de
WHERE title_en IS NULL OR TRIM(title_en) = '';
