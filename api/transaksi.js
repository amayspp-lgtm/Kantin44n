// api/transaksi.js
const { pool } = require('./db_config');

const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
};

exports.handler = async (req) => {
    // Penanganan pre-flight CORS
    if (req.method === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                ...HEADERS,
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: ''
        };
    }
    
    let connection;
    try {
        const data = JSON.parse(req.body);
        const { id_toko, total_harga, metode_pembayaran, items } = data;
        
        if (!id_toko || !total_harga || !metode_pembayaran || !items || items.length === 0) {
            return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ message: "Data pesanan tidak lengkap." }) };
        }
        
        connection = await pool.getConnection();
        await connection.beginTransaction(); // Mulai Transaksi
        
        // 1. INSERT ke tabel Transaksi
        const status = (metode_pembayaran === 'QRIS' ? 'Menunggu Pembayaran' : 'Diproses');
        const [resultTransaksi] = await connection.execute(
            `INSERT INTO transaksi (id_toko, total_harga, metode_pembayaran, status_transaksi) 
             VALUES (?, ?, ?, ?)`,
            [id_toko, total_harga, metode_pembayaran, status]
        );
        const id_transaksi_baru = resultTransaksi.insertId;
        
        // 2. INSERT ke tabel Detail Transaksi & UPDATE Stok
        for (const item of items) {
            // Periksa Stok
            const [stokCheck] = await connection.execute(
                `SELECT stok FROM menu WHERE id_menu = ?`, [item.id]
            );
            
            if (stokCheck.length === 0 || stokCheck[0].stok < item.jumlah) {
                // Batalkan transaksi jika stok tidak cukup
                throw new Error(`Stok tidak cukup untuk ID Menu: ${item.id}`);
            }
            
            // Insert Detail Transaksi
            await connection.execute(
                `INSERT INTO detail_transaksi (id_transaksi, id_menu, jumlah, harga_satuan) 
                 VALUES (?, ?, ?, ?)`,
                [id_transaksi_baru, item.id, item.jumlah, item.harga]
            );
            
            // Update Stok
            await connection.execute(
                `UPDATE menu SET stok = stok - ? WHERE id_menu = ?`,
                [item.jumlah, item.id]
            );
        }
        
        await connection.commit(); // Konfirmasi semua operasi
        
        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({ message: "Pesanan berhasil dibuat", id_transaksi: id_transaksi_baru })
        };
        
    } catch (error) {
        if (connection) await connection.rollback(); // Batalkan semua jika ada error
        console.error("Error saat memproses transaksi:", error);
        
        return {
            statusCode: 500,
            headers: HEADERS,
            body: JSON.stringify({ message: "Gagal memproses pesanan: " + error.message })
        };
    } finally {
        if (connection) connection.release();
    }
};