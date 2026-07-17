
const { callGeminiWithRetry } = require("../services/geminiService");
const { buildPromptForChat, buildPromptForStudio } = require("../services/promptService");
const { getRecipe } = require("../services/cacheService");
const { parseAndRepairJSON } = require("../utils/jsonParser");
const { validateRecipe } = require("../utils/recipeValidator");

const getApiKeyOrError = (processEnv) => {
    const key = processEnv.GEMINI_API_KEY;
    if (!key) {
        throw new Error("GEMINI_API_KEY is not configured on the server.");
    }
    return key;
};

const isRateLimitError = (error) => {
    return error.status === 429 || 
           error.message?.toLowerCase().includes("quota") || 
           error.message?.toLowerCase().includes("limit") ||
           error.message?.toLowerCase().includes("exhausted");
};


const chatWithAI = async (req, res) => {
    try {
        const { action, recipeDraft, currentRecipe, instruction, variation, fieldToRegenerate } = req.body;
        const apiKey = getApiKeyOrError(process.env);

        const cacheKey = JSON.stringify({ action, recipeDraft, currentRecipe, instruction, variation, fieldToRegenerate });

        const result = await getRecipe(cacheKey, async () => {
          
            const prompt = buildPromptForChat(req.body);
            const response = await callGeminiWithRetry(apiKey, prompt);
            const rawObj = parseAndRepairJSON(response.text);
            const defaultTitle = recipeDraft?.title || currentRecipe?.title;
            return validateRecipe(rawObj, defaultTitle);
        });

        return res.status(200).json({ success: true, recipe: result });

    } catch (error) {
        console.error("[AI Chat Controller Error]", error);

        if (isRateLimitError(error)) {
            return res.status(429).json({
                success: false,
                error: "AI service is temporarily unavailable. Please try again later."
            });
        }

        return res.status(500).json({
            success: false,
            error: error.message || "Failed to process AI chat request. Please try again."
        });
    }
};


const generateRecipeFromStudio = async (req, res) => {
    try {
        const { recipeDraft } = req.body;
        const apiKey = getApiKeyOrError(process.env);

        const cacheKey = JSON.stringify({ action: "generateRecipeFromStudio", recipeDraft });
        const result = await getRecipe(cacheKey, async () => {
            const studioPromptInfo = buildPromptForStudio(recipeDraft);
            
            const response = await callGeminiWithRetry(apiKey, studioPromptInfo.prompt);
        
            const rawObj = parseAndRepairJSON(response.text);

            const verified = validateRecipe(rawObj, recipeDraft.title);

            if (!studioPromptInfo.generateDescription) {
                verified.description = recipeDraft.description;
            }
            if (!studioPromptInfo.generateIngredients) {
                verified.ingredients = studioPromptInfo.ingredientsList;
            }
            if (!studioPromptInfo.generateInstructions) {
                verified.instructions = studioPromptInfo.instructionsList;
            }

            return verified;
        });

        return res.status(200).json({ success: true, recipe: result });

    } catch (error) {
        console.error("[AI Studio Controller Error]", error);

        if (isRateLimitError(error)) {
            return res.status(429).json({
                success: false,
                error: "AI service is temporarily unavailable. Please try again later."
            });
        }

        return res.status(500).json({
            success: false,
            error: error.message || "Failed to generate recipe. Please try again."
        });
    }
};

module.exports = { chatWithAI, generateRecipeFromStudio };
