const { GoogleGenAI } = require("@google/genai");

const MODEL_NAME = "gemini-flash-latest";

const withTimeout = (promise, ms) =>
    Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`AI request timed out after ${ms / 1000}s`)), ms)
        ),
    ]);

// Attempt generateContent with the stable model
const attemptGenerate = async (ai, prompt) => {
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { 
            responseMimeType: "application/json",
            maxOutputTokens: 2048
        },
    });
    return response;
};

// Auto-retry helper for 429 rate limits
const attemptGenerateWithRetry = async (ai, prompt, retries = 3) => {
    try {
        const response = await withTimeout(attemptGenerate(ai, prompt), 25000);
        return response;
    } catch (error) {
        const isRateLimit = error.status === 429 || 
                            error.message?.toLowerCase().includes("quota") || 
                            error.message?.toLowerCase().includes("limit") ||
                            error.message?.toLowerCase().includes("exhausted");

        if (isRateLimit && retries > 0) {
            // Parse retry delay from error message, e.g. "Please retry in 19.74s" or "retryDelay: 19s"
            let waitMs = 15000; // Default fallback to 15 seconds
            const match = error.message?.match(/retry in\s+(\d+(\.\d+)?)/i) || error.message?.match(/retryDelay":\s*"(\d+)/i);
            if (match) {
                const parsedSec = parseFloat(match[1]);
                waitMs = Math.ceil(parsedSec) * 1000 + 1500; // Add 1.5 second safety buffer
            }
            console.warn(`[AI Chat] Rate limited. Waiting ${waitMs / 1000}s before retrying... (${retries} attempts left). Error details: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, waitMs));
            return attemptGenerateWithRetry(ai, prompt, retries - 1);
        }
        throw error;
    }
};

// Helper to clean Markdown wrapper
const parseJSONResponse = (text) => {
    let clean = text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
    return JSON.parse(clean);
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

        const ai = new GoogleGenAI({ apiKey });
        let prompt = "";

        if (action === "generate") {
            prompt = `
You are a Professional Chef and AI Recipe Generator.
Your task is to take the following recipe draft details and generate a complete, high-quality, professional food recipe.

Recipe Draft Details:
${JSON.stringify(recipeDraft, null, 2)}

Strict Rules:
1. If description is "__generate__", generate an appetizing and professional description. Otherwise, use the user's exact description.
2. If ingredients is "__generate__", generate a realistic and complete list of ingredients with measurements. Otherwise, parse the user's ingredient text into a clean array of strings (split by commas/newlines and format them nicely).
3. If instructions is "__generate__", generate clear, step-by-step cooking steps. Otherwise, parse the user's instructions text into a clean array of step strings (split by commas/steps/dots and format them nicely).

Strictly output ONLY valid JSON matching this schema. Do not output any other text, markdown blocks, or explanation.

{
  "title": "Clean Title of the Recipe",
  "description": "Appetizing description.",
  "cookingTime": ${recipeDraft.cookingTime ? parseInt(recipeDraft.cookingTime) : 30},
  "servings": ${recipeDraft.servings ? parseInt(recipeDraft.servings) : 2},
  "difficulty": "${recipeDraft.difficulty || "Medium"}",
  "estimatedCalories": 350,
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
You are a Professional Chef. Modifying an existing recipe based on the user's instruction.
Modify ONLY the necessary parts of the recipe based on the instruction. Preserve the other parts.

Current Recipe:
${JSON.stringify(currentRecipe, null, 2)}

User Instruction:
"${instruction}"

Strictly output ONLY valid JSON matching this schema.

{
  "title": "Clean Title",
  "description": "Appetizing description.",
  "cookingTime": 30,
  "servings": 2,
  "difficulty": "Medium",
  "estimatedCalories": 350,
  "ingredients": [
    "ingredients list"
  ],
  "instructions": [
    "instructions list"
  ],
  "tips": [
    "tips list"
  ],
  "nutrition": {
    "protein": "protein value",
    "carbs": "carbs value",
    "fat": "fat value",
    "fiber": "fiber value"
  },
  "tags": ["tags"]
}
`;
        } else if (action === "variation") {
            prompt = `
You are a Professional Chef. Convert the following recipe into a "${variation}" variation (e.g., Jain style, Dhaba Style, High Protein, Healthy, Low Oil, Restaurant Style).
Adjust ingredients, instructions, tips, and nutrition fields appropriately.

Current Recipe:
${JSON.stringify(currentRecipe, null, 2)}

Strictly output ONLY valid JSON matching this schema.

{
  "title": "New Title",
  "description": "Description",
  "cookingTime": 30,
  "servings": 2,
  "difficulty": "Medium",
  "estimatedCalories": 350,
  "ingredients": [
    "adapted ingredients"
  ],
  "instructions": [
    "adapted instructions"
  ],
  "tips": [
    "adapted tips"
  ],
  "nutrition": {
    "protein": "protein",
    "carbs": "carbs",
    "fat": "fat",
    "fiber": "fiber"
  },
  "tags": ["tags"]
}
`;
        } else if (action === "regenerate_field") {
            prompt = `
You are a Professional Chef. You need to regenerate ONLY the field "${fieldToRegenerate}" (which can be either "ingredients", "instructions", or "entire") for the current recipe.
If it is "entire", completely regenerate a fresh version of the recipe.
If it is "ingredients" or "instructions", improve or vary that specific array while keeping the rest of the recipe the same.

Current Recipe:
${JSON.stringify(currentRecipe, null, 2)}

Strictly output ONLY valid JSON matching the full recipe schema.

{
  "title": "Title",
  "description": "Description",
  "cookingTime": 30,
  "servings": 2,
  "difficulty": "Medium",
  "estimatedCalories": 350,
  "ingredients": [
    "ingredients"
  ],
  "instructions": [
    "instructions"
  ],
  "tips": [
    "tips"
  ],
  "nutrition": {
    "protein": "protein",
    "carbs": "carbs",
    "fat": "fat",
    "fiber": "fiber"
  },
  "tags": ["tags"]
}
`;
        } else {
            return res.status(400).json({ success: false, message: "Invalid action type." });
        }

        console.log(`[AI Chat] Requesting Gemini using model: ${MODEL_NAME}`);
        const response = await attemptGenerateWithRetry(ai, prompt);
        console.log(`[AI Chat] Generation successful`);
        const result = parseJSONResponse(response.text);
        return res.status(200).json({ success: true, recipe: result });

    } catch (error) {
        console.error("[AI Chat Studio Error]", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to process AI chat request."
        });
    }
};

module.exports = { chatWithAI };
