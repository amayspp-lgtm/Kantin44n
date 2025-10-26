// api/toko.js (SOLUSI TEST UNTUK ISOLASI DEPENDENSI)
// Kita hanya mengembalikan JSON tanpa MENGIMPORT 'mysql2' atau 'db_config'.

const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
};

const handler = async (req) => {
    // Jika function ini berhasil, masalahnya 100% ada di file db_config.js atau mysql2
    
    // Simulasikan data toko yang sukses dimuat
    const mockToko = [
        { id: 1, nama: "TEST TOKO BERHASIL", deskripsi: "Data ini dari MOCK API.", qr_qris: "qris_test.png" }
    ];
    
    return {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify(mockToko)
    };
};

module.exports = handler;