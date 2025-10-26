// api/db_config.js

const mysql = require('mysql2/promise');

// --- Konfigurasi Koneksi Database ---
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kantin_digital_db',
  port: process.env.DB_PORT || 3306, // Port database
  
  // Konfigurasi pool untuk Serverless Functions
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// --- Ekspor Modul ---
module.exports = {
  pool
};