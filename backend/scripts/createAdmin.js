require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function createAdmin(username, password, email) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);

    await db.query(
      'INSERT INTO admins (username, password_hash, email) VALUES (?, ?, ?)',
      [username, hashedPassword, email]
    );
    
    console.log('Admin-Benutzer erfolgreich erstellt!');
  } catch (error) {
    console.error('Fehler beim Erstellen des Admin-Benutzers:', error);
  } finally {
    process.exit();
  }
}

// Verwendung:
// node createAdmin.js admin admin123
const [,, username, password, email] = process.argv;
if (username && password && email) {
  createAdmin(username, password, email);
} else {
  console.log('Bitte Username, Passwort und Email angeben: node createAdmin.js <username> <password> <email>');
} 