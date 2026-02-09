
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const apiRoutes = require('./routes/api');
const config = require('./config/sap_config');

const app = express();

// Middleware
app.use(cors()); // Enable CORS for frontend connection
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.send('ECC Migration Backend is Running. Use /api/chat to interact.');
});

// Start Server
const PORT = config.port;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`- Health Check: http://localhost:${PORT}/api/health`);
    console.log(`- Chat Endpoint: http://localhost:${PORT}/api/chat`);
});

module.exports = app;
