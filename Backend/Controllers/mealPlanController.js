const MealPlan = require('../Models/MealPlan')
const Recipe = require('../Models/Recipe')

const addMeal = async (req,res) => {
    try {
        const date = req.body.date;
        const mealType = req.body.mealType;
        const recipeId = req.body.recipeId;

        const recipe = await Recipe.findById(recipeId);
       
        if(!recipe) {
            return res.status(404).json({
                message : "Recipe not found"
            });
        }

        let collaborators = [...recipe.collaborators];

        if (
            recipe.author.toString() !== req.user._id.toString() &&
            !collaborators.some(
                id => id.toString() === recipe.author.toString()
            )
        ) {
            collaborators.push(recipe.author);
        }

        const newMeal = new MealPlan({
            userId : req.user._id,
            date : date,
            mealType : mealType,
            recipeId : recipeId,

            collaborators : recipe.collaborators
        })
        const savedMeal = await newMeal.save();

        res.status(201).json(savedMeal);
    }catch (error) {
        res.status(500).json({message : error.message});
    }
};

const getMeals = async (req, res) => {
    try {
        const mealPlans = await MealPlan.find({
            $or:[
                {
                    userId : req.user._id
                },
                {
                    collaborators : req.user._id
                }
            ]
            
        })
        .populate('recipeId', 'title')
        .populate('userId','name');

        res.status(200).json(mealPlans);
    }catch (error) { 
        res.status(500).json({message : error.message});
    }
};

const deleteMeal = async (req,res) => {
    try {
        const mealId = req.params.id;

        const meal = await MealPlan.findById(mealId);
        if(!meal) {
            return res.status(404).json({message : "Meal not found"});
        }

        if(meal.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({message : "Not authorized"});
        }

        await MealPlan.findByIdAndDelete(mealId);
        res.status(200).json({message : "Meal removed from plan"});
    }catch(error) {
        res.status(500).json({message : error.message});
    }
};

module.exports = {
    addMeal,
    getMeals,
    deleteMeal
}