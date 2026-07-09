const express = require('express');
const router = express.Router();
const { createRecipe, getRecipes, getRecipeById, updateRecipe,deleteRecipe} = require('../Controllers/recipeController');
const { protect, optionalProtect } = require('../Middlewear/authMiddlewear');
const { upload } = require('../config/cloudinary');

router.get('/', optionalProtect, getRecipes);
router.get('/:id', optionalProtect, getRecipeById);
router.post('/', protect, upload.single('image'), createRecipe);
router.put('/:id', protect, upload.single('image'), updateRecipe);
router.delete('/:id', protect, deleteRecipe);

module.exports = router;