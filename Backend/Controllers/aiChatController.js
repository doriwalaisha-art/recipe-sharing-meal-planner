// AI Chat and Recipe Studio Controller
const { callGeminiWithRetry } = require("../services/geminiService");
const { buildPromptForChat, buildPromptForStudio } = require("../services/promptService");
const { getRecipe } = require("../services/cacheService");
const { parseAndRepairJSON } = require("../utils/jsonParser");
const { validateRecipe } = require("../utils/recipeValidator");

// Helper to check if API key is configured
const getApiKeyOrError = (processEnv) => {
    const key = processEnv.GEMINI_API_KEY;
    if (!key) {
        throw new Error("GEMINI_API_KEY is not configured on the server.");
    }
    return key;
};

// Helper to determine if an error is a 429 Rate Limit
const isRateLimitError = (error) => {
    return error.status === 429 || 
           error.message?.toLowerCase().includes("quota") || 
           error.message?.toLowerCase().includes("limit") ||
           error.message?.toLowerCase().includes("exhausted");
};

// Express handler for the Chatbot Recipe Editor / studio assistant
const chatWithAI = async (req, res) => {
    try {
        const { action, recipeDraft, currentRecipe, instruction, variation, fieldToRegenerate } = req.body;
        const apiKey = getApiKeyOrError(process.env);

        // Generate cache key for request deduplication and local cache lookup
        const cacheKey = JSON.stringify({ action, recipeDraft, currentRecipe, instruction, variation, fieldToRegenerate });

        // Retrieve recipe (either from Cache, pending request, or new Gemini call)
        const result = await getRecipe(cacheKey, async () => {
            // Build Prompt
            const prompt = buildPromptForChat(req.body);

            // Call Gemini
            const response = await callGeminiWithRetry(apiKey, prompt);

            // Parse response
            const rawObj = parseAndRepairJSON(response.text);

            // Validate schema
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

// Express handler for single-call Recipe generation from AI Studio
const generateRecipeFromStudio = async (req, res) => {
    try {
        const { recipeDraft } = req.body;
        const apiKey = getApiKeyOrError(process.env);

        // Generate cache key for request deduplication and local cache lookup
        const cacheKey = JSON.stringify({ action: "generateRecipeFromStudio", recipeDraft });

        // Retrieve recipe (either from Cache, pending request, or new Gemini call)
        const result = await getRecipe(cacheKey, async () => {
            // Build Prompt & get instructions/ingredients meta
            const studioPromptInfo = buildPromptForStudio(recipeDraft);
            
            // Call Gemini
            const response = await callGeminiWithRetry(apiKey, studioPromptInfo.prompt);
            
            // Parse response
            const rawObj = parseAndRepairJSON(response.text);

            // Validate schema
            const verified = validateRecipe(rawObj, recipeDraft.title);

            // Preserve manual inputs (do not allow Gemini to overwrite them)
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
