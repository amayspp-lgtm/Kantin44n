// api/db_config.js

const mysql = require('mysql2/promise');

// --- Konfigurasi Koneksi Database ---
const dbConfig = {
  // Kredensial dibaca dari Environment Variables (ENV)
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kantin_digital_db',
  port: process.env.DB_PORT || 3306,
  
  // --- KONFIGURASI SSL WAJIB UNTUK AIVENCLOUD/CLOUD DB ---
  ssl: {
    // Menggunakan sertifikat CA yang diatur di Vercel ENV
    ca: process.env.DB_CA_CERT,
    // Wajib: Mengaktifkan dan memvalidasi koneksi SSL
    rejectUnauthorized: true
  },
  
  // Konfigurasi pool untuk Serverless Functions
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Connection Pool (digunakan oleh Serverless Functions)
const pool = mysql.createPool(dbConfig);

// --- Ekspor Modul ---
module.exports = {
  pool
};