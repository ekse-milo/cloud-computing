const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// Serve cartService.js static file
app.use(express.static(path.join(__dirname, 'public')));

app.get('/cartService.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cartService.js'));
});

app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'cart-service', usesLocalStorage: true });
});

app.listen(PORT, () => {
    console.log(`Cart Microservice running on port ${PORT}`);
});
