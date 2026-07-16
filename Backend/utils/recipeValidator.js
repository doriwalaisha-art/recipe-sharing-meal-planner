// Utility to validate recipe schema and populate defaults
const validateRecipe = (obj, defaultTitle = "Untitled Recipe") => {
    if (!obj || typeof obj !== "object") {
        throw new Error("Parsed AI response is not a valid object.");
    }

    if (!obj.title) {
        obj.title = defaultTitle;
    }

    // Check essential fields
    if (!obj.description || typeof obj.description !== "string" || obj.description.trim() === "") {
        throw new Error("Missing essential field: description");
    }
    if (!obj.ingredients || !Array.isArray(obj.ingredients) || obj.ingredients.length === 0) {
        throw new Error("Missing essential field: ingredients");
    }
    if (!obj.instructions || !Array.isArray(obj.instructions) || obj.instructions.length === 0) {
        throw new Error("Missing essential field: instructions");
    }

    // Populate optional fields with sensible defaults
    obj.cookingTime = obj.cookingTime ? (parseInt(obj.cookingTime) || 30) : 30;
    obj.servings = obj.servings ? (parseInt(obj.servings) || 2) : 2;
    obj.difficulty = obj.difficulty || "Medium";
    obj.estimatedCalories = obj.estimatedCalories || "350 kcal";

    if (!obj.tips || !Array.isArray(obj.tips) || obj.tips.length === 0) {
        obj.tips = ["Serve hot and enjoy!"];
    }

    if (!obj.nutrition || typeof obj.nutrition !== "object") {
        obj.nutrition = {
            protein: "15g",
            carbs: "45g",
            fat: "10g",
            fiber: "4g"
        };
    } else {
        obj.nutrition.protein = obj.nutrition.protein || "—";
        obj.nutrition.carbs = obj.nutrition.carbs || "—";
        obj.nutrition.fat = obj.nutrition.fat || "—";
        obj.nutrition.fiber = obj.nutrition.fiber || "—";
    }

    if (!obj.tags || !Array.isArray(obj.tags) || obj.tags.length === 0) {
        obj.tags = [obj.difficulty];
    }

    return obj;
};

module.exports = { validateRecipe };
