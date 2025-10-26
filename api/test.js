// api/test.js

// Fungsi ini tidak menggunakan pool database
const HEADERS = {
    'Access-Control-Allow-Origin': '*', 
    'Content-Type': 'application/json'
};

const handler = async (req) => {
    // Penanganan pre-flight CORS
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
        const currentTime = new Date().toISOString();
        
        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({
                status: "success",
                message: "Vercel Function berjalan dengan sukses!",
                timestamp: currentTime,
                note: "Koneksi database MySQL TIDAK diuji di sini."
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: HEADERS,
            body: JSON.stringify({ status: "error", message: "Error tak terduga di function test." })
        };
    }
};

module.exports = handler; // Ekspor tunggal