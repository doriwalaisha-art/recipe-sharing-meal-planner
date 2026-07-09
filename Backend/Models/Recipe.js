const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({

    title : {
        type : String,
        required : true
    },

    description : {
        type : String,
        required : true
    },

    category : {
        type : String,
        enum : ['Breakfast','Brunch','Lunch','Snacks','Dinner','Dessert','Beverages','Salad','Soup','Vegetarian','Non-Vegetarian','Vegan','Healthy','High-Protein','Quick Meals','Jain'],
        required : true
    },

    image : {
        type : String,
        required : true
    },

    ingredients : [{
        type : String,
        required : true
    }],

    instructions : [{
        type : String,
        required : true
    }],

    cookingTime : {
        type : Number,
        required : true
    },

    servings : {
        type : Number,
        required : true
    },

    difficulty : {
        type : String,
        enum : ['Easy' , 'Medium' , 'Hard'],
        required : true
    },

    author: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },

    collaborators : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'User'
        }
    ],

    likes : {
        type : Number,
        default : 0
    },

    commentsCount : {
        type : Number,
        default : 0
    },

    createdAt : {
        type : Date,
        default : Date.now
    }
});

module.exports = mongoose.model('Recipe' , RecipeSchema);