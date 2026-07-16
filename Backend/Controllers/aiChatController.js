const { GoogleGenAI } = require("@google/genai");

let CURRENT_MODEL = "gemini-2.5-flash";

// Global in-memory cache for session-based recipe draft deduplication
const recipeCache = new Map();

const withTimeout = (promise, ms) =>
    Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`AI request timed out after ${ms / 1000}s`)), ms)
        ),
    ]);

// Helper to clean Markdown wrapper
const parseJSONResponse = (text) => {
    let clean = text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
    return JSON.parse(clean);
};

// Validate Gemini JSON schema
const isValidRecipeJSON = (obj) => {
    return obj && 
           typeof obj.description === "string" &&
           Array.isArray(obj.ingredients) &&
           Array.isArray(obj.instructions) &&
           Array.isArray(obj.tips) &&
           typeof obj.nutrition === "object" &&
           Array.isArray(obj.tags);
};

// Attempt generateContent with dynamic fallback to gemini-flash-latest on 404
const attemptGenerate = async (ai, prompt) => {
    try {
        const response = await ai.models.generateContent({
            model: CURRENT_MODEL,
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                maxOutputTokens: 2048
            },
        });
        return response;
    } catch (error) {
        if (error.status === 404 && CURRENT_MODEL === "gemini-2.5-flash") {
            console.warn("[AI Chat] gemini-2.5-flash not available (404). Falling back to gemini-flash-latest...");
            CURRENT_MODEL = "gemini-flash-latest";
            return attemptGenerate(ai, prompt);
        }
        throw error;
    }
};

// Auto-retry helper for 429 rate limits with exponential backoff (1st retry: 2s, 2nd retry: 5s)
const attemptGenerateWithRetry = async (ai, prompt, retries = 2, delayMs = 2000) => {
    try {
        const response = await withTimeout(attemptGenerate(ai, prompt), 25000);
        return response;
    } catch (error) {
        const isRateLimit = error.status === 429 || 
                            error.message?.toLowerCase().includes("quota") || 
                            error.message?.toLowerCase().includes("limit") ||
                            error.message?.toLowerCase().includes("exhausted");

        if (isRateLimit && retries > 0) {
            const nextDelay = retries === 2 ? 5000 : 10000;
            console.warn(`[AI Chat] Rate limited. Retrying in ${delayMs / 1000}s... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            return attemptGenerateWithRetry(ai, prompt, retries - 1, nextDelay);
        }
        throw error;
    }
};

const chatWithAI = async (req, res) => {
    try {
        const { action, recipeDraft, currentRecipe, instruction, variation, fieldToRegenerate } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                success: false,
                message: "GEMINI_API_KEY is not configured on the server."
            });
        }

        // Cache lookup for generate action
        let cacheKey = "";
        if (action === "generate" && recipeDraft) {
            cacheKey = JSON.stringify(recipeDraft);
            if (recipeCache.has(cacheKey)) {
                console.log("[AI Chat] Serving recipe from in-memory cache");
                return res.status(200).json({ success: true, recipe: recipeCache.get(cacheKey) });
            }
        }

        const ai = new GoogleGenAI({ apiKey });
        let prompt = "";

        if (action === "generate") {
            prompt = `
You are a Professional Chef and AI Recipe Generator.
Generate a complete, high-quality recipe matching the details below.

Recipe Details:
- Title: ${recipeDraft.title}
- Food Type: ${recipeDraft.foodType || "Veg"}
- Category: ${recipeDraft.category || "Dinner"}
- Cuisine: ${recipeDraft.cuisine || "Indian"}
- Cooking Time: ${recipeDraft.cookingTime || "30"} minutes
- Servings: ${recipeDraft.servings || "2"}
- Difficulty: ${recipeDraft.difficulty || "Medium"}
- Spice Level: ${recipeDraft.spiceLevel || "Medium"}
- Special Notes: ${recipeDraft.notes || "None"}

Strictly return ONLY a valid JSON object. No explanations. No markdown formatting.
JSON schema:
{
  "title": "${recipeDraft.title}",
  "description": "Appetizing description.",
  "cookingTime": ${recipeDraft.cookingTime ? parseInt(recipeDraft.cookingTime) : 30},
  "servings": ${recipeDraft.servings ? parseInt(recipeDraft.servings) : 2},
  "difficulty": "${recipeDraft.difficulty || "Medium"}",
  "estimatedCalories": "350 kcal",
  "ingredients": [
    "exact quantity and ingredient (e.g. 2 cups Basmati Rice)"
  ],
  "instructions": [
    "Step-by-step instruction 1",
    "Step-by-step instruction 2"
  ],
  "tips": [
    "Chef tip 1"
  ],
  "nutrition": {
    "protein": "15g",
    "carbs": "45g",
    "fat": "10g",
    "fiber": "4g"
  },
  "tags": ["Tag1", "Tag2"]
}
`;
        } else if (action === "edit") {
            prompt = `
You are a Professional Chef. Modify the existing recipe based on the user's instruction. Preserve other parts.

Current Recipe:
${JSON.stringify(currentRecipe, null, 2)}

User Instruction:
"${instruction}"

Strictly return ONLY a valid JSON object matching the recipe schema.
`;
        } else if (action === "variation") {
            prompt = `
You are a Professional Chef. Convert the following recipe into a "${variation}" variation.

Current Recipe:
${JSON.stringify(currentRecipe, null, 2)}

Strictly return ONLY a valid JSON object matching the recipe schema.
`;
        } else if (action === "regenerate_field") {
            prompt = `
You are a Professional Chef. Regenerate ONLY the field "${fieldToRegenerate}" (ingredients, instructions, or entire) for the current recipe.

Current Recipe:
${JSON.stringify(currentRecipe, null, 2)}

Strictly return ONLY a valid JSON object matching the recipe schema.
`;
        } else {
            return res.status(400).json({ success: false, message: "Invalid action type." });
        }

        console.log(`[AI Chat] Requesting Gemini using model: ${CURRENT_MODEL}`);
        let response = await attemptGenerateWithRetry(ai, prompt);
        console.log(`[AI Chat] Generation successful`);
        
        let result;
        try {
            result = parseJSONResponse(response.text);
        } catch (parseErr) {
            console.warn("[AI Chat] Failed to parse JSON response. Attempting one automatic regeneration...");
            response = await attemptGenerateWithRetry(ai, prompt + "\nStrictly output valid JSON. Fix any JSON formatting errors.");
            result = parseJSONResponse(response.text);
        }

        // Validate recipe JSON schema (only for generation)
        if (action === "generate" && !isValidRecipeJSON(result)) {
            console.warn("[AI Chat] Invalid recipe JSON schema. Attempting one automatic regeneration...");
            response = await attemptGenerateWithRetry(ai, prompt + "\nYour previous response was missing critical JSON fields. Please include all fields (description, ingredients, instructions, tips, nutrition, estimatedCalories, tags) properly.");
            result = parseJSONResponse(response.text);
            if (!isValidRecipeJSON(result)) {
                throw new Error("Generated recipe JSON did not match required schema.");
            }
        }

        // Store result in cache
        if (action === "generate" && cacheKey) {
            recipeCache.set(cacheKey, result);
        }

        return res.status(200).json({ success: true, recipe: result });

    } catch (error) {
        console.error("[AI Chat Studio Error]", error);

        const isRateLimit = error.status === 429 || 
                            error.message?.toLowerCase().includes("quota") || 
                            error.message?.toLowerCase().includes("limit") ||
                            error.message?.toLowerCase().includes("exhausted");

        if (isRateLimit) {
            return res.status(429).json({
                success: false,
                error: "AI service is temporarily unavailable. Please try again later."
            });
        }

        return res.status(500).json({
            success: false,
            error: "Failed to process AI chat request. Please try again."
        });
    }
};

module.exports = { chatWithAI };
