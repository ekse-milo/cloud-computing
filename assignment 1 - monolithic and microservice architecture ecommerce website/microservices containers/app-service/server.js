const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MySQL Database connection setup
const dbConfig = {
    host: process.env.DB_HOST || 'mysql-db',
    user: process.env.DB_USER || 'quote_user',
    password: process.env.DB_PASSWORD || 'quote_password',
    database: process.env.DB_NAME || 'quotes_db',
    port: parseInt(process.env.DB_PORT || '3306', 10)
};

let pool;
function getPool() {
    if (!pool) {
        pool = mysql.createPool({
            ...dbConfig,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }
    return pool;
}

// REST API: Get All Quotes from MySQL DB Container
app.get('/api/quotes', async (req, res) => {
    try {
        const connection = getPool();
        const [rows] = await connection.query('SELECT * FROM quotes ORDER BY id ASC');
        
        // Format data numeric fields correctly
        const formattedRows = rows.map(r => ({
            ...r,
            id: String(r.id),
            price: parseFloat(r.price),
            characterCount: parseInt(r.characterCount, 10)
        }));

        res.json(formattedRows);
    } catch (error) {
        console.error('Error querying MySQL database in app-service:', error);
        res.status(500).json({ error: 'Failed to fetch quotes from database', details: error.message });
    }
});

// REST API: Get Single Quote by ID from MySQL DB Container
app.get('/api/quotes/:id', async (req, res) => {
    try {
        const connection = getPool();
        const [rows] = await connection.query('SELECT * FROM quotes WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Quote not found' });
        }
        const r = rows[0];
        res.json({
            ...r,
            id: String(r.id),
            price: parseFloat(r.price),
            characterCount: parseInt(r.characterCount, 10)
        });
    } catch (error) {
        console.error('Error fetching single quote from MySQL DB:', error);
        res.status(500).json({ error: 'Failed to fetch quote from database', details: error.message });
    }
});

// Gateway Route: Proxy /api/search requests to Search Microservice container
app.get('/api/search', (req, res) => {
    const searchHost = process.env.SEARCH_SERVICE_HOST || 'search-service';
    const searchPort = process.env.SEARCH_SERVICE_PORT || 3002;
    const authorParam = req.query.author ? `?author=${encodeURIComponent(req.query.author)}` : '';
    
    const options = {
        hostname: searchHost,
        port: searchPort,
        path: `/api/search${authorParam}`,
        method: 'GET'
    };

    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
        console.error('Error proxying to search-service:', err);
        res.status(502).json({ error: 'Search service unavailable', details: err.message });
    });

    proxyReq.end();
});

// Serve static web app assets
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'app-service' });
});

app.listen(PORT, () => {
    console.log(`App Microservice running on port ${PORT}`);
});
