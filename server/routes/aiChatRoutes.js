const express = require('express');
const router = express.Router();
const aiChatController = require('../controllers/aiChatController');

// ✨ CHAT MESSAGE ENDPOINT
router.post('/chat', aiChatController.handleChatMessage);

// ✨ GET USER CONTEXT
router.get('/context/:userId/:userRole', aiChatController.getUserContext);

// ✨ GET CHAT SUGGESTIONS
router.get('/suggestions/:userRole', aiChatController.getChatSuggestions);

module.exports = router; 