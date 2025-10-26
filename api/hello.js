// api/hello.js

const HEADERS = {
    'Access-Control-Allow-Origin': '*', 
    'Content-Type': 'application/json'
};

const handler = async (req) => {
    // Fungsi yang sangat simpel tanpa dependensi eksternal
    return {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify({
            status: "success",
            message: "Hello dari Vercel! Function dasar berjalan.",
            timestamp: new Date().toISOString()
        })
    };
};

module.exports = handler;