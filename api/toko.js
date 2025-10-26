// api/toko.js
const { pool } = require('./db_config');

const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
};

const handler = async (req) => { // Menggunakan handler bernama untuk ekspor tunggal
    // Penanganan pre-flight CORS (OPTIONS request)
    if (req.method === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                ...HEADERS,
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: ''
        };
    }
    
    try {
        const [rows] = await pool.execute(
            `SELECT 
                id_toko AS id, 
                nama_toko AS nama, 
                deskripsi, 
                qr_qris_path AS qr_qris 
             FROM toko`
        );
        
        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify(rows)
        };
    } catch (error) {
        console.error("Error fetching toko:", error);
        return {
            statusCode: 500,
            headers: HEADERS,
            body: JSON.stringify({ message: "Gagal memuat data toko.", error: error.message })
        };
    }
};

module.exports = handler; // EKSPOR STANDAR UNTUK SERVERLESS FUNCTIONS