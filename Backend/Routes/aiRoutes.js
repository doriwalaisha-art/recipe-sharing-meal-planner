const express = require('express');
const router = express.Router();

const { generateRecipe } = require('../Controllers/aiController');
const { protect } = require('../Middlewear/authMiddlewear');

router.post('/generate',protect,generateRecipe);

module.exports = router;