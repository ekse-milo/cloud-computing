const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

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

// Search Quotes by Author directly from MySQL DB container
app.get('/api/search', async (req, res) => {
    try {
        const authorQuery = req.query.author ? req.query.author.trim() : '';
        const connection = getPool();
        
        let rows;
        if (!authorQuery) {
            [rows] = await connection.query('SELECT * FROM quotes ORDER BY id ASC');
        } else {
            const sql = 'SELECT * FROM quotes WHERE LOWER(author) LIKE LOWER(?) ORDER BY id ASC';
            [rows] = await connection.query(sql, [`%${authorQuery}%`]);
        }

        // Format data numeric fields correctly
        const formattedRows = rows.map(r => ({
            ...r,
            id: String(r.id),
            price: parseFloat(r.price),
            characterCount: parseInt(r.characterCount, 10)
        }));

        res.json(formattedRows);
    } catch (error) {
        console.error('Error querying MySQL database in search-service:', error);
        res.status(500).json({ error: 'Database search query failed', details: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'search-service' });
});

app.listen(PORT, () => {
    console.log(`Search Microservice running on port ${PORT}`);
});
