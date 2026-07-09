const mongoose = require('mongoose');

const mealPlanSchema = new mongoose.Schema({
    userId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required : true
    },

    date : {
        type : Date,
        required : true
    },

    mealType : {
        type : String,
        enum : ['Breakfast', 'Lunch', 'Dinner','Snack','Dessert'],
        required : true
    },

    recipeId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Recipe',
        required : true
    },

    collaborators : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ]

},{ timestamps : true});

module.exports = mongoose.model('MealPlan', mealPlanSchema);