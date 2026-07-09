const mongoose = require("mongoose");
const User = require("../Models/User");
const Recipe = require("../Models/Recipe");
const Like = require("../Models/Likes");

const getProfile = async (req, res) => {

    try {

        let userId;

        if (!req.params.id || req.params.id === "me") {
            if (!req.user) {
                return res.status(401).json({message : "Not authorized"})
            }
            userId = req.user._id;
        }
        else {
            userId = req.params.id;
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ message: "Invalid user ID format" });
            }
        }

    
        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }


        const userRecipes = await Recipe.find({
            author: userId
        }).sort({
            createdAt: -1
        });

        let recipesWithStatus = [];
        if (req.user) {
            const userLikes = await Like.find({ 
                userId: req.user._id 
            }).select('recipeId');

            const likeIds = userLikes.map(l => l.recipeId.toString());

            recipesWithStatus = userRecipes.map(recipe => ({
                ...recipe._doc,
                isLiked: likeIds.includes(recipe._id.toString())
            }));
        } else {
            recipesWithStatus = userRecipes;
        }

    
        const totalLikesData = await Recipe.aggregate([
            {
                $match: {
                    author: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $group: {
                    _id: null,
                    totalLikes: {
                        $sum: "$likes"
                    }
                }
            }
        ]);

        let totalLikes = 0;

        if (totalLikesData.length > 0) {
            totalLikes = totalLikesData[0].totalLikes;
        }

        res.status(200).json({
            user: user,
            recipes: recipesWithStatus,
            stats: {
                totalRecipes: userRecipes.length,
                totalLikes: totalLikes
            }
        });

    }
    catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

const updateProfile = async (req,res) => {
    try{
        const {name, bio} = req.body;

        const updatedData = {
            name : name,
            bio : bio
        };

        if(req.file) {
            updatedData.profileImage = req.file.path;
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            updatedData,{new:true}
        ).select("-password");

        if(!updatedUser) {
            return res.status(404).json({message : "user not found"});
        }
        res.status(200).json(updatedUser);
    }catch(error) {
        res.status(500).json({message : error.message});
    }
};

module.exports = {
    getProfile,
    updateProfile
};