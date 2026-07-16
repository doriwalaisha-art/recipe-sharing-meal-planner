const { GoogleGenAI } = require("@google/genai");

let CURRENT_MODEL = "gemini-2.5-flash";

// Cache for session-based recipe draft deduplication (TTL: 30 minutes)
const recipeCache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

// Promise map to prevent simultaneous identical requests
const pendingRequests = new Map();

const getFromCache = (key) => {
    if (!recipeCache.has(key)) return null;
    const { value, expiry } = recipeCache.get(key);
    if (Date.now() > expiry) {
        recipeCache.delete(key);
        return null;
    }
    return value;
};

const setToCache = (key, value) => {
    recipeCache.set(key, {
        value,
        expiry: Date.now() + CACHE_TTL
    });
};

const withTimeout = (promise, ms) =>
    Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`AI request timed out after ${ms / 1000}s`)), ms)
        ),
    ]);

// Helper to clean Markdown wrapper and fix common JSON issues locally
const parseJSONResponse = (text) => {
    let clean = text.trim();
    if (clean.startsWith("```")) {
        clean = clean.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim();
    }

    // Fix smart quotes
    clean = clean.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");

    // Attempt direct parse first
    try {
        return JSON.parse(clean);
    } catch (e) {
        console.warn("[AI Chat] Direct JSON parsing failed. Attempting local repairs...");
    }

    // 1. Remove trailing commas before closing braces/brackets
    clean = clean.replace(/,\s*([\]}])/g, "$1");

    // 2. Escape actual newlines inside double-quoted string values
    let insideString = false;
    let repaired = "";
    for (let i = 0; i < clean.length; i++) {
        const char = clean[i];
        if (char === '"' && clean[i - 1] !== '\\') {
            insideString = !insideString;
            repaired += char;
        } else if ((char === '\n' || char === '\r') && insideString) {
            repaired += (char === '\n' ? '\\n' : '\\r');
        } else {
            repaired += char;
        }
    }
    clean = repaired;

    // 3. Safely append missing closing braces or brackets
    let openBraces = (clean.match(/{/g) || []).length;
    let closeBraces = (clean.match(/}/g) || []).length;
    let openBrackets = (clean.match(/\[/g) || []).length;
    let closeBrackets = (clean.match(/\]/g) || []).length;

    while (openBrackets > closeBrackets) {
        clean += ']';
        closeBrackets++;
    }
    while (openBraces > closeBraces) {
        clean += '}';
        closeBraces++;
    }

    try {
        return JSON.parse(clean);
    } catch (err) {
        console.error("[AI Chat] Failed to parse JSON even after repairs:\n", clean);
        throw err;
    }
};

// Validate essential fields and populate optional fields with defaults in Node.js
const ensureRecipeSchema = (obj, defaultTitle = "Untitled Recipe") => {
    if (!obj || typeof obj !== "object") {
        throw new Error("Parsed response is not a valid JSON object.");
    }

    if (!obj.title) {
        obj.title = defaultTitle;
    }

    // Essential fields: throw error if missing
    if (!obj.description || typeof obj.description !== "string" || obj.description.trim() === "") {
        throw new Error("Missing essential field: description");
    }
    if (!obj.ingredients || !Array.isArray(obj.ingredients) || obj.ingredients.length === 0) {
        throw new Error("Missing essential field: ingredients");
    }
    if (!obj.instructions || !Array.isArray(obj.instructions) || obj.instructions.length === 0) {
        throw new Error("Missing essential field: instructions");
    }

    // Optional fields: supply sensible defaults
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

// Attempt generateContent with dynamic fallback to gemini-flash-latest on 404
const attemptGenerate = async (ai, prompt) => {
    try {
        const response = await ai.models.generateContent({
            model: CURRENT_MODEL,
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                maxOutputTokens: 1500
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

// Auto-retry helper ONLY for 429 rate limits, network timeouts, and connectivity errors
const attemptGenerateWithRetry = async (ai, prompt, retries = 2, delayMs = 2000) => {
    try {
        const response = await withTimeout(attemptGenerate(ai, prompt), 25000);
        return response;
    } catch (error) {
        const isRateLimit = error.status === 429 || 
                            error.message?.toLowerCase().includes("quota") || 
                            error.message?.toLowerCase().includes("limit") ||
                            error.message?.toLowerCase().includes("exhausted") ||
                            error.message?.toLowerCase().includes("timeout") ||
                            error.message?.toLowerCase().includes("fetch");

        if (isRateLimit && retries > 0) {
            const nextDelay = retries === 2 ? 5000 : 10000;
            console.warn(`[AI Chat] Rate limited/timeout. Retrying in ${delayMs / 1000}s... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            return attemptGenerateWithRetry(ai, prompt, retries - 1, nextDelay);
        }
        throw error;
    }
};

const executeWithDeduplication = async (cacheKey, apiCallFn) => {
    if (!cacheKey) return await apiCallFn();

    const cached = getFromCache(cacheKey);
    if (cached) {
        console.log("[AI Chat] Serving from TTL cache");
        return cached;
    }

    if (pendingRequests.has(cacheKey)) {
        console.log("[AI Chat] Sharing simultaneous pending request");
        return await pendingRequests.get(cacheKey);
    }

    const requestPromise = apiCallFn().then(result => {
        setToCache(cacheKey, result);
        pendingRequests.delete(cacheKey);
        return result;
    }).catch(err => {
        pendingRequests.delete(cacheKey);
        throw err;
    });

    pendingRequests.set(cacheKey, requestPromise);
    return await requestPromise;
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

        const cacheKey = JSON.stringify({ action, recipeDraft, currentRecipe, instruction, variation, fieldToRegenerate });

        const result = await executeWithDeduplication(cacheKey, async () => {
            const ai = new GoogleGenAI({ apiKey });
            let prompt = "";

            if (action === "generate") {
                const userDescription = (recipeDraft.description && recipeDraft.description !== "Let AI Generate") 
                    ? `Use this description: "${recipeDraft.description}"` 
                    : "Generate an appetizing description.";

                const userIngredients = (recipeDraft.ingredients && recipeDraft.ingredients !== "Let AI Generate")
                    ? `Use these specific ingredients: ${recipeDraft.ingredients}`
                    : "Generate realistic ingredients with exact quantities.";

                const userInstructions = (recipeDraft.instructions && recipeDraft.instructions !== "Let AI Generate")
                    ? `Use these specific instructions/steps as a base: ${recipeDraft.instructions}`
                    : "Generate step-by-step instructions.";

                prompt = `
You are a Professional Chef. Generate a recipe JSON matching the details below.

Recipe Details:
- Title: ${recipeDraft.title}
- Category: ${recipeDraft.category || "Dinner"}
- Cooking Time: ${recipeDraft.cookingTime || "30"} minutes
- Servings: ${recipeDraft.servings || "2"}
- Difficulty: ${recipeDraft.difficulty || "Medium"}

Requirements:
1. Description: ${userDescription}
2. Ingredients: ${userIngredients}
3. Instructions: ${userInstructions}

Strictly return ONLY valid JSON matching this schema:
{
  "title": "${recipeDraft.title}",
  "description": "Appetizing description.",
  "cookingTime": ${recipeDraft.cookingTime ? parseInt(recipeDraft.cookingTime) : 30},
  "servings": ${recipeDraft.servings ? parseInt(recipeDraft.servings) : 2},
  "difficulty": "${recipeDraft.difficulty || "Medium"}",
  "estimatedCalories": "350 kcal",
  "ingredients": ["2 cups Basmati Rice"],
  "instructions": ["Step 1"],
  "tips": ["Chef tip 1"],
  "nutrition": {"protein": "15g", "carbs": "45g", "fat": "10g", "fiber": "4g"},
  "tags": ["Tag1"]
}
`;
            } else if (action === "edit") {
                prompt = `
You are a Professional Chef. Modify the existing recipe based on the user's instruction. Preserve all other parts.

Current Recipe:
${JSON.stringify(currentRecipe, null, 2)}

User Instruction:
"${instruction}"

Strictly return ONLY a valid JSON object matching the schema.
`;
            } else if (action === "variation") {
                prompt = `
You are a Professional Chef. Convert the following recipe into a "${variation}" variation.

Current Recipe:
${JSON.stringify(currentRecipe, null, 2)}

Strictly return ONLY a valid JSON object matching the schema.
`;
            } else if (action === "regenerate_field") {
                prompt = `
You are a Professional Chef. Regenerate ONLY the field "${fieldToRegenerate}" (ingredients, instructions, or entire) for the current recipe.

Current Recipe:
${JSON.stringify(currentRecipe, null, 2)}

Strictly return ONLY a valid JSON object matching the schema.
`;
            } else {
                throw new Error("Invalid action type.");
            }

            console.log(`[AI Chat] Requesting Gemini using model: ${CURRENT_MODEL}`);
            const response = await attemptGenerateWithRetry(ai, prompt);
            console.log(`[AI Chat] Generation successful`);
            
            const rawObj = parseJSONResponse(response.text);
            return ensureRecipeSchema(rawObj, recipeDraft?.title || currentRecipe?.title);
        });

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
            error: error.message || "Failed to process AI chat request. Please try again."
        });
    }
};

const generateRecipeFromStudio = async (req, res) => {
    try {
        const { recipeDraft } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                success: false,
                error: "GEMINI_API_KEY is not configured on the server."
            });
        }

        const cacheKey = JSON.stringify({ action: "generateRecipeFromStudio", recipeDraft });

        const result = await executeWithDeduplication(cacheKey, async () => {
            const ai = new GoogleGenAI({ apiKey });

            const generateDescription = recipeDraft.description === "__AUTO__";
            const generateIngredients = recipeDraft.ingredients === "__AUTO__";
            const generateInstructions = recipeDraft.instructions === "__AUTO__";

            let instructionsList = [];
            if (!generateInstructions) {
                instructionsList = recipeDraft.instructions.split(/\r?\n/).map(i => i.trim()).filter(Boolean);
            }

            let ingredientsList = [];
            if (!generateIngredients) {
                ingredientsList = recipeDraft.ingredients.split(/,/).map(i => i.trim()).filter(Boolean);
            }

            const prompt = `
You are a Professional Chef and AI Recipe Generator.
Generate or complete a high-quality recipe matching the details below.

Recipe Details:
- Title: ${recipeDraft.title}
- Category: ${recipeDraft.category}
- Cooking Time: ${recipeDraft.cookingTime} minutes
- Servings: ${recipeDraft.servings}
- Difficulty: ${recipeDraft.difficulty}

Your generation instructions:
1. Description: ${generateDescription ? "Generate an appetizing description." : `MUST USE this exact description: "${recipeDraft.description}"`}
2. Ingredients: ${generateIngredients ? "Generate a realistic list of ingredients with exact quantities." : `MUST USE these exact ingredients: ${JSON.stringify(ingredientsList)}`}
3. Instructions: ${generateInstructions ? "Generate clear step-by-step instructions." : `MUST USE these exact instructions: ${JSON.stringify(instructionsList)}`}

Strictly return ONLY a valid JSON object matching this schema:
{
  "title": "${recipeDraft.title}",
  "description": "Appetizing description.",
  "cookingTime": ${parseInt(recipeDraft.cookingTime) || 30},
  "servings": ${parseInt(recipeDraft.servings) || 2},
  "difficulty": "${recipeDraft.difficulty}",
  "estimatedCalories": "350 kcal",
  "ingredients": ["exact quantity and ingredient (e.g. 2 cups Basmati Rice)"],
  "instructions": ["Step 1"],
  "tips": ["Chef tip 1"],
  "nutrition": {"protein": "15g", "carbs": "45g", "fat": "10g", "fiber": "4g"},
  "tags": ["${recipeDraft.category}", "${recipeDraft.difficulty}"]
}
`;

            console.log(`[AI Studio] Generating recipe from studio using model: ${CURRENT_MODEL}`);
            const response = await attemptGenerateWithRetry(ai, prompt);
            
            const rawObj = parseJSONResponse(response.text);
            const verified = ensureRecipeSchema(rawObj, recipeDraft.title);

            // Force manual input preservation
            if (!generateDescription) {
                verified.description = recipeDraft.description;
            }
            if (!generateIngredients) {
                verified.ingredients = ingredientsList;
            }
            if (!generateInstructions) {
                verified.instructions = instructionsList;
            }

            return verified;
        });

        return res.status(200).json({ success: true, recipe: result });

    } catch (error) {
        console.error("[AI Studio Error]", error);

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
            error: error.message || "Failed to generate recipe. Please try again."
        });
    }
};

module.exports = { chatWithAI, generateRecipeFromStudio };
