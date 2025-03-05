const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'fortbildung_user',
  password: process.env.DB_PASSWORD || 'fortbildung_password',
  database: process.env.DB_NAME || 'fortbildung_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;