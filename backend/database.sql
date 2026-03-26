-- Datenbank erstellen
CREATE DATABASE IF NOT EXISTS fortbildung_db;
USE fortbildung_db;

-- Tabelle für Personen
CREATE TABLE persons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (email)
);

-- Tabelle für Fortbildungen
CREATE TABLE courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title_de VARCHAR(200) NOT NULL,
    title_en VARCHAR(200),
    description_de TEXT,
    description_en TEXT,
    ad_group VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabelle für Termine
CREATE TABLE sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    date_time DATETIME NOT NULL,
    location VARCHAR(200),
    max_participants INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Tabelle für Anmeldungen
CREATE TABLE registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    person_id INT,
    session_id INT NOT NULL,
    user_sub VARCHAR(255),
    user_email VARCHAR(255),
    user_display_name VARCHAR(255),
    registration_ip VARCHAR(45) NOT NULL,
    registration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    UNIQUE KEY uq_registrations_user_sub_session (user_sub, session_id),
    KEY idx_registrations_user_email (user_email)
);

-- Tabelle für Administratoren
CREATE TABLE admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (username),
    UNIQUE KEY (email)
);

-- Beispiel-Admin einfügen (Passwort: admin123)
/*INSERT INTO admins (username, password_hash, email)
VALUES ('admin', '$2a$12$Ojf6Eq2qq.FODBzIaDN2NeTIa.O22A82bIH1p5264flru7JC29pfK', 'admin@example.com');*/