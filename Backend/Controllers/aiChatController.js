require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

// Model configuration with gemini-flash-latest as the primary stable model to prevent 404 errors
const MODELS = ["gemini-flash-latest", "gemini-3.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];

// Timeout wrapper: rejects after ms milliseconds
const withTimeout = (promise, ms) =>
    Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`AI request timed out after ${ms / 1000}s`)), ms)
        ),
    ]);

// Attempt generateContent with a single model
const attemptGenerate = async (ai, model, prompt) => {
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { 
            responseMimeType: "application/json",
            maxOutputTokens: 2048
        },
    });
    return response;
};

// Parse and validate AI response text
const parseAIResponse = (text) => {
    // Strip any accidental markdown fences
    let clean = text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

    let result;
    try {
        result = JSON.parse(clean);
    } catch {
        throw new Error("AI returned malformed JSON: " + clean.slice(0, 200));
    }

    // Validate required top-level fields
    if (!result.type || !result.reply || !result.action) {
        throw new Error("AI response missing required fields (type, reply, action)");
    }

    // Ensure recipe object always exists
    if (!result.recipe) {
        result.recipe = {};
    }

    return result;
};

const chatWithAI = async (req, res) => {
    try {
        const { message, recipe } = req.body;

        // --- Input validation ---
        if (!message || typeof message !== "string" || message.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Message is required",
            });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                success: false,
                message: "GEMINI_API_KEY is not configured on the server.",
            });
        }

        const ai = new GoogleGenAI({ apiKey });

        // --- Clean recipe: strip large base64 images to avoid token overflow ---
        const cleanRecipe = recipe ? { ...recipe } : {};
        if (
            cleanRecipe.image &&
            typeof cleanRecipe.image === "string" &&
            cleanRecipe.image.length > 500
        ) {
            cleanRecipe.image = "uploaded_image_placeholder";
        }

        const recipeStateStr =
            cleanRecipe && Object.keys(cleanRecipe).length > 0
                ? JSON.stringify(cleanRecipe)
                : "Empty";

        // --- Build prompt ---
        const prompt = `
You are an Expert AI Recipe Assistant and Professional Chef.
The user is building a recipe through conversation step-by-step.

Required Recipe Fields: title, description, category, cookingTime, servings, difficulty, image, ingredients, instructions.

Current Recipe State:
${recipeStateStr}

User Message:
${message.trim()}

----------------------------------
STRICT RULES
----------------------------------

1. Extract any valid recipe fields from the user's message and merge them into the Current Recipe State. Understand natural language (e.g. "I want to make Pizza, it takes 30 mins" → title: "Pizza", cookingTime: 30).
2. If the user says "Generate everything" or similar, generate realistic values for: description, cookingTime (number in minutes), servings (number), difficulty, ingredients (array), instructions (array). Do NOT generate category or image.
3. If asked to generate a specific missing field (e.g. "Generate ingredients"), generate it and add to state.
4. After updating the state, check which required fields are STILL MISSING (null, empty string, empty array, or not present).
5. If there are missing fields, pick the FIRST missing one in this order: title, description, category, cookingTime, servings, difficulty, ingredients, instructions, image.
   - Missing "category" → ask_category. Use EXACTLY one of: Breakfast, Brunch, Lunch, Dinner, Dessert, Snacks, Beverages, Salad, Soup, Vegetarian, Non-Vegetarian, Vegan, Healthy, High-Protein, Quick Meals, Jain
   - Missing "difficulty" → ask_difficulty. Use EXACTLY one of: Easy, Medium, Hard
   - Missing "image" → ask_image
   - Any other missing field → ask_text
   - Set type to "update"
6. If ALL required fields are present and non-empty, set type to "complete", reply "Your recipe is ready! 🎉", action to "ready".
7. Modifications: if user wants to change a field, update it and re-evaluate.
8. Off-topic cooking questions: answer helpfully, type "update", action "ask_text", preserve recipe state.
9. Completely unrelated to cooking: type "invalid", reply "Please ask something related to your recipe or cooking.", action "ask_text".

IMPORTANT FIELD TYPES:
- cookingTime MUST be a number (minutes), not a string.
- servings MUST be a number, not a string.
- ingredients MUST be an array of strings.
- instructions MUST be an array of strings.
- category MUST be one of the exact values listed above.
- difficulty MUST be one of: Easy, Medium, Hard.

Return ONLY valid JSON. No markdown. No \`\`\`json. No explanation outside JSON.

{
  "type": "update" | "complete" | "invalid",
  "reply": "Your conversational response here",
  "action": "ask_text" | "ask_category" | "ask_difficulty" | "ask_image" | "ready",
  "recipe": {
    "title": "string or null",
    "description": "string or null",
    "category": "string or null",
    "cookingTime": number_or_null,
    "servings": number_or_null,
    "difficulty": "string or null",
    "image": "string or null",
    "ingredients": ["string"] or [],
    "instructions": ["string"] or []
  }
}
`;

        // --- Attempt with primary model, fallback to secondary ---
        let response = null;
        let lastError = null;

        for (const model of MODELS) {
            try {
                console.log(`[AI Chat] Trying model: ${model}`);
                response = await withTimeout(attemptGenerate(ai, model, prompt), 25000);
                console.log(`[AI Chat] Success with model: ${model}`);
                break;
            } catch (err) {
                console.warn(`[AI Chat] Model ${model} failed:`, err.message);
                lastError = err;
            }
        }

        if (!response) {
            throw lastError || new Error("All AI models failed");
        }

        // --- Parse and validate response ---
        const result = parseAIResponse(response.text);

        return res.status(200).json(result);
    } catch (error) {
        console.error("[AI Chat Error]", {
            message: error.message,
            status: error?.status,
            stack: error?.stack?.split("\n")[0],
        });

        const statusCode =
            error?.status >= 400 && error?.status < 600 ? error.status : 500;

        // Map specific Gemini error codes to user-friendly messages
        let userMessage = "AI Chat Failed. Please try again.";
        if (error?.status === 429) {
            userMessage = "AI is busy right now. Please wait a moment and try again.";
        } else if (error?.status === 503) {
            userMessage = "AI service is temporarily unavailable. Please try again shortly.";
        } else if (error.message?.includes("timed out")) {
            userMessage = "AI took too long to respond. Please try again.";
        } else if (error.message?.includes("malformed JSON")) {
            userMessage = "AI returned an unexpected response. Please try again.";
        } else if (error?.status === 404) {
            userMessage = "AI model not available. Please contact support.";
        }

        res.status(statusCode === 429 ? 503 : statusCode).json({
            success: false,
            message: userMessage,
        });
    }
};

module.exports = { chatWithAI };
