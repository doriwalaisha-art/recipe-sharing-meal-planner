const Like = require('../Models/Likes');
const Recipe = require('../Models/Recipe');

exports.toggleLike = async (req, res) => {
    console.log("LIKE REQUEST RECEIVED!"); 
    console.log("User ID:", req.user?._id);
    console.log("Recipe ID:", req.params.recipeId);
    try{
        const { recipeId } = req.params;
        const userId = req.user._id;

        const existingLike = await Like.findOne({ userId, recipeId });

        if(existingLike) {
            await Like.findByIdAndDelete(existingLike._id);
            await Recipe.findByIdAndUpdate(recipeId, { $inc: { likes: -1 }});
            console.log(` Successfully UNLIKED recipe ${recipeId}`);
            return res.status(200).json({
                liked : false,
                message : "Recipe Unliked"
            });
        }else {
            await Like.create({ userId, recipeId });
            await Recipe.findByIdAndUpdate(recipeId, { $inc : { likes : 1 }});
            console.log(` Successfully LIKED recipe ${recipeId}`);
            return res.status(201).json({
                liked : true,
                message : "Recipe Liked Successfully"
            });
        }
    } catch (error) {
        console.error(" DATABASE ERROR:", error);
        console.error("LIKE ERROR:", error); 
        res.status(500).json({ message : error.message })
    }  
};