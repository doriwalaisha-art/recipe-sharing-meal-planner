const express = require('express');
const router = express.Router();

const { generateRecipe } = require('../Controllers/aiController');
const { chatWithAI, generateRecipeFromStudio } = require('../Controllers/aiChatController');
const { protect } = require('../Middlewear/authMiddlewear');

router.post('/generate',protect,generateRecipe);
router.post('/chat',protect,chatWithAI);
router.post('/generate-recipe',protect,generateRecipeFromStudio);

module.exports = router;