const express = require('express');
const router = express.Router();

const { generateRecipe } = require('../Controllers/aiController');
const { chatWithAI } = require('../Controllers/aiChatController');
const { protect } = require('../Middlewear/authMiddlewear');

router.post('/generate',protect,generateRecipe);
router.post('/chat',protect,chatWithAI);

module.exports = router;