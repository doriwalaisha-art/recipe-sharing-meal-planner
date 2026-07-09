const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema({

    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true
    },

    recipeId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Recipe',
        required : true
    }
},{ timestamps : true });

LikeSchema.index({ userId : 1, recipeId : 1}, {unique : true});

module.exports = mongoose.model('Like',LikeSchema);