-- Migration: registrations von person_id auf AD-Identitaet erweitern
-- Hinweis: Vorher Backup erstellen.

ALTER TABLE registrations
  MODIFY person_id INT NULL,
  ADD COLUMN user_sub VARCHAR(255) NULL AFTER session_id,
  ADD COLUMN user_email VARCHAR(255) NULL AFTER user_sub,
  ADD COLUMN user_display_name VARCHAR(255) NULL AFTER user_email;

ALTER TABLE registrations
  ADD UNIQUE KEY uq_registrations_user_sub_session (user_sub, session_id),
  ADD KEY idx_registrations_user_email (user_email);

-- Optionaler Backfill aus legacy persons-Tabelle
UPDATE registrations r
JOIN persons p ON p.id = r.person_id
SET
  r.user_email = COALESCE(r.user_email, p.email),
  r.user_display_name = COALESCE(r.user_display_name, p.name)
WHERE r.user_email IS NULL OR r.user_display_name IS NULL;
