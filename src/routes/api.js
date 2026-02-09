
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Route for the chat interface to send prompts
router.post('/chat', chatController.handleChat);
router.post('/sap/test', chatController.handleChat); // Alias for compatibility

// Manual Test Route
router.get('/test-sap', chatController.testConnection);

// Health check route
router.get('/health', chatController.healthCheck);

module.exports = router;
