require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

let CURRENT_MODEL = "gemini-2.5-flash";

const withTimeout = (promise, ms) =>
    Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`AI request timed out after ${ms / 1000}s`)), ms)
        ),
    ]);


const attemptGenerate = async (ai, payload) => {
    try {
        const response = await ai.models.generateContent({
            ...payload,
            model: CURRENT_MODEL
        });
        return response;
    } catch (error) {
        if (error.status === 404 && CURRENT_MODEL === "gemini-2.5-flash") {
            console.warn("[AI Generate] gemini-2.5-flash not available (404). Falling back to gemini-flash-latest...");
            CURRENT_MODEL = "gemini-flash-latest";
            return attemptGenerate(ai, payload);
        }
        throw error;
    }
};

// Auto-retry helper for 429 rate limits with exponential backoff (1st retry: 2s, 2nd retry: 5s)
const attemptGenerateWithRetry = async (ai, payload, timeoutMs = 25000, retries = 2, delayMs = 2000) => {
    try {
        const response = await withTimeout(attemptGenerate(ai, payload), timeoutMs);
        return response;
    } catch (error) {
        const isRateLimit = error.status === 429 || 
                            error.message?.toLowerCase().includes("quota") || 
                            error.message?.toLowerCase().includes("limit") ||
                            error.message?.toLowerCase().includes("exhausted");

        if (isRateLimit && retries > 0) {
            const nextDelay = retries === 2 ? 5000 : 10000;
            console.warn(`[AI Generate] Rate limited. Retrying in ${delayMs / 1000}s... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            return attemptGenerateWithRetry(ai, payload, timeoutMs, retries - 1, nextDelay);
        }
        throw error;
    }
};

const generateRecipe = async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title || title.trim() === "") {
            return res.status(400).json({ success: false, error: "Title is required" });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ success: false, error: "GEMINI_API_KEY is not configured." });
        }

        const ai = new GoogleGenAI({ apiKey });

        // --- Step 1: Validate it's a food recipe ---
        const validationPrompt = `
You are a food validation assistant.
Determine whether the following title and description describe a real food recipe.

Recipe Title: ${title}
Recipe Description: ${description || "No description"}

Reply with ONLY one word: YES or NO.
YES → if the title and description are about a food recipe or dish.
NO → if they are names of people, places, random words, meaningless text, numbers, greetings, objects, animals, movies, sports, or anything that is not a recipe.
`;

        console.log(`[AI Generate] Requesting validation using model: ${CURRENT_MODEL}`);
        const validationResponse = await attemptGenerateWithRetry(
            ai,
            { 
                contents: validationPrompt,
                config: { maxOutputTokens: 10 }
            },
            15000
        );

        const validation = validationResponse.text.trim().toUpperCase();
        if (validation !== "YES") {
            return res.status(400).json({
                success: false,
                error: "Please enter a valid recipe title and description related to food.",
            });
        }

        // --- Step 2: Generate recipe ---
        const prompt = `
You are an expert chef and recipe generator.

Recipe Title: ${title}
Recipe Description: ${description || "No description provided"}

Rules:
1. Generate suitable ingredients and cooking instructions for this recipe.
2. Ingredients must contain ingredient names with quantities.
3. Instructions must be short, clear, and beginner-friendly.
4. Each instruction contains only one cooking action.
5. Do NOT generate stories, tips, notes, or nutrition facts.
6. Return ONLY valid JSON. No markdown. No \`\`\`json.

{
  "success": true,
  "ingredients": ["Ingredient 1", "Ingredient 2"],
  "instructions": ["Step 1", "Step 2"]
}
`;

        console.log(`[AI Generate] Generating recipe using model: ${CURRENT_MODEL}`);
        const recipeResponse = await attemptGenerateWithRetry(
            ai,
            { 
                contents: prompt,
                config: { 
                    responseMimeType: "application/json",
                    maxOutputTokens: 2048 
                }
            },
            25000
        );

        let text = recipeResponse.text
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

        const recipe = JSON.parse(text);
        res.status(200).json(recipe);
    } catch (error) {
        console.error("[AI Generate Error]", error);

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

        res.status(500).json({ success: false, error: error.message || "Failed to generate recipe. Please try again." });
    }
};

module.exports = { generateRecipe };