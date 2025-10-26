// api/menu.js
const { pool } = require('./db_config');

const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
};

const handler = async (req) => { // Menggunakan handler bernama untuk ekspor tunggal
    const id_toko = req.queryStringParameters?.id || 0;
    
    if (req.method === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: { ...HEADERS, 'Access-Control-Allow-Methods': 'GET, OPTIONS' },
            body: ''
        };
    }
    
    if (!id_toko) {
        return {
            statusCode: 400,
            headers: HEADERS,
            body: JSON.stringify({ message: "ID Toko tidak ditemukan." })
        };
    }
    
    try {
        const [rows] = await pool.execute(
            `SELECT id_menu AS id, nama_produk, harga, stok 
             FROM menu 
             WHERE id_toko = ? AND stok > 0`,
            [id_toko]
        );
        
        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify(rows)
        };
    } catch (error) {
        console.error("Error fetching menu:", error);
        return {
            statusCode: 500,
            headers: HEADERS,
            body: JSON.stringify({ message: "Gagal memuat menu.", error: error.message })
        };
    }
};

module.exports = handler; // EKSPOR STANDAR UNTUK SERVERLESS FUNCTIONS