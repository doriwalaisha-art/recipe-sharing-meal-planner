const Recipe = require('../Models/Recipe')
const Like = require('../Models/Likes')
const User = require('../Models/User')

const createRecipe = async (req, res) => {
    try{
        let title = req.body.title;
        let description = req.body.description;
        let category = req.body.category;
        let cookingTime = req.body.cookingTime;
        let servings = req.body.servings;
        let difficulty = req.body.difficulty;
        let collaboratorEmail = req.body.collaboratorEmail;
        console.log("Collaborator Email:", collaboratorEmail);

        let ingredients = req.body.ingredients;
        let instructions = req.body.instructions;

        console.log("ing",req.body);
        if(!Array.isArray(ingredients)) {
            ingredients = JSON.parse(ingredients);
        }

        if(!Array.isArray(instructions)) {
            instructions = JSON.parse(instructions);
        }

        let collaborators = [];
        if (collaboratorEmail) {
            const collaborator = await User.findOne({
                email : collaboratorEmail
              
            });
            console.log("Collaborator Found:", collaborator);

            if(!collaborator) {
                return res.status(404).json({
                    message : "Collaborator not found"
                });
            }
            if(collaborator._id.toString() === req.user._id.toString()) {
                return res.status(400).json({
                    message : "You can not collaborate with yourself"
                });
            }
            collaborators.push(collaborator._id);
            console.log("Collaborators Array:", collaborators);
        }

        const recipe = await Recipe.create({
            title: title,
            description: description,
            category: category,
            image: req.file ? req.file.path : (req.body.image || ""),
            ingredients: ingredients,
            instructions: instructions,
            cookingTime: cookingTime,
            servings: servings,
            difficulty: difficulty,
            author: req.user._id,
            collaborators : collaborators
        });
        console.log("Recipe Created successfully");
        res.status(201).json(recipe);
    }catch (error) {
        console.log("create recipe error",error);

        res.status(500).json({
            message : error.message
        });
    }
       
};

const getRecipes = async (req, res) => {
    try {
        const { search, category, sort } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { ingredients: { $regex: search, $options: 'i' } }
            ];
        }

        if(category) {
            if (category != "All"){
                query.category = category;
            }
        }

        let recipesQuery = Recipe.find(query);
        recipesQuery = recipesQuery
        .populate('author', 'name profileImage')
        .populate('collaborators', 'name profileImage');

        if (sort === 'latest') {
            recipesQuery = recipesQuery.sort({ createdAt: -1 });
        }

        else if (sort === 'oldest') {
            recipesQuery = recipesQuery.sort({ createdAt: 1 });
        }

        else if (sort === 'popular') {
            recipesQuery = recipesQuery.sort({ likes: -1 });
        }

        else {
            recipesQuery = recipesQuery.sort({ createdAt: -1 });
        }

        const recipes = await recipesQuery;

        if (req.user) {
            const userLikes = await Like.find({ 
                userId: req.user._id 
            }).select('recipeId');

            let likeIds = [];
            for(let i = 0; i < userLikes.length; i++) {
                likeIds.push(userLikes[i].recipeId.toString());
            }

            let recipeWithStatus = [];

            for(let i = 0; i < recipes.length; i++) {
                let recipe = recipes[i];
                let isLiked = false;

                if(likeIds.includes(recipe._id.toString())) {
                    isLiked = true;
                }
                recipeWithStatus.push({
                    ...recipe._doc,
                    isLiked: isLiked
                });
            }
            return res.json(recipeWithStatus);
        }
        res.json(recipes);
    } catch (error) {
        console.log(error);
        res.status(500).json({message: error.message});
    }
};


const getRecipeById = async (req, res) => {
   try{
        let recipeId = req.params.id;

        const recipe = await Recipe.findById(recipeId)
        .populate("author","name profileImage")
        .populate("collaborators", "name profileImage");

        if(!recipe){
            return res.status(404).json({
                message : "Recipe not found"
            });
        }

        if (req.user) {
            const existingLike = await Like.findOne({ userId: req.user._id, recipeId: recipe._id });
            return res.json({
                ...recipe._doc,
                isLiked: !!existingLike
            });
        }
        res.json(recipe);
    }catch (error) {
        res.status(500).json({message : error.message});
    }
};

const updateRecipe = async (req, res) => {
    try {
        
        if (!req.user) {
            return res.status(401).json({ 
                message: 'User not authenticated' 
            });
        }

        let recipeId = req.params.id;

        const recipe = await Recipe.findById(recipeId);

        if (!recipe) {
            return res.status(404).json({ 
                message: 'Recipe Not Found'
            });
        }

        const isAuthor = recipe.author.toString() === req.user._id.toString();

        const isCollaborator = recipe.collaborators.some(
            id => id.toString() === req.user._id.toString()
        );

        if(!isAuthor && !isCollaborator) {
            return res.status(403).json({
                message: "you don't have permission to edit this recipe."
            });
        }

        const title = req.body.title;
        const description = req.body.description;
        const category = req.body.category;
        const cookingTime = req.body.cookingTime;
        const servings = req.body.servings;
        const difficulty = req.body.difficulty;

        let ingredients = req.body.ingredients;
        let instructions = req.body.instructions;

        if(!Array.isArray(ingredients)) {
            ingredients = JSON.parse(ingredients || "[]");
        }

        if(!Array.isArray(instructions)) {
            instructions = JSON.parse(instructions || "[]");
        }

        const updatedData = {
            title : title,
            description : description,
            category : category,
            cookingTime : cookingTime,
            servings : servings,
            difficulty : difficulty,
            ingredients : ingredients,
            instructions : instructions
        };

        if(req.file) {
            updatedData.image = req.file.path;
        }

        const updatedRecipe = await Recipe.findByIdAndUpdate(
            recipeId,
            updatedData,
            { new : true }
        );
        res.json(updatedRecipe);
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ message: "Server Error: " + error.message });
    }
};

const deleteRecipe = async (req, res) => {
    try {
    
        if (!req.user || !req.user._id) {
            return res.status(401).json({ 
                message: 'User authentication failed. Please login again.' 
            });
        }

        const recipeId = req.params.id;

        const recipe = await Recipe.findById(recipeId);
        
        if (!recipe) {
            return res.status(404).json({
                message: 'Recipe Not Found' 
            });
        }

        if (!recipe.author) {
            return res.status(500).json({ 
                message: 'This recipe has no author so it cannot be deleted.' 
            });
        }

        if(recipe.author.toString() != req.user._id.toString()) {
            return res.status(401).json({
                message : "you can only delete your own recipes."
            });
        }

        await Recipe.findByIdAndDelete(recipeId);

        res.json({ message: 'Recipe removed successfully' });
    } catch (error) {
        console.error("Delete error:", error); 
        res.status(500).json({ message: "Server Error: " + error.message });
    }
};


module.exports = {
    createRecipe,
    getRecipes,
    getRecipeById,
    updateRecipe,
    deleteRecipe
}