const express = require('express');
const router = express.Router();
const { toggleLike } = require('../Controllers/socialController');
const { protect } = require('../Middlewear/authMiddlewear');

router.put('/like/:recipeId',protect, toggleLike);


module.exports = router;