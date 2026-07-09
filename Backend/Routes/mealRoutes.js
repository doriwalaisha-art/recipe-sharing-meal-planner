const express = require("express");
const router = express.Router();
const mealPlanController = require('../Controllers/mealPlanController');
const { protect } = require('../Middlewear/authMiddlewear');


router.get('/',protect, mealPlanController.getMeals);

router.post('/',protect, mealPlanController.addMeal);

router.delete('/:id',protect, mealPlanController.deleteMeal);

module.exports = router;