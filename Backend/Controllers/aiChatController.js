require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

// Single stable model configuration
const MODEL_NAME = "gemini-flash-latest";

// Timeout wrapper: rejects after ms milliseconds
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

// Parse and validate AI response text
const parseAIResponse = (text) => {
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

    if (!result.type || !result.reply || !result.action) {
        throw new Error("AI response missing required fields (type, reply, action)");
    }

    if (!result.recipe) {
        result.recipe = {};
    }

    return result;
};

const chatWithAI = async (req, res) => {
    try {
        const { message, recipe } = req.body;

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

        console.log(`[AI Chat] Requesting Gemini using model: ${MODEL_NAME}`);
        const response = await withTimeout(attemptGenerate(ai, prompt), 25000);
        console.log(`[AI Chat] Generation successful`);

        const result = parseAIResponse(response.text);
        return res.status(200).json(result);
    } catch (error) {
        console.error("[AI Chat Error]", error);

        const statusCode = error?.status || 500;
        let errorMessage = error?.message || "AI Chat Failed";

        if (error?.status === 429) {
            errorMessage = "AI is busy right now. Please wait a moment and try again.";
        } else if (error?.status === 503) {
            errorMessage = "AI service is temporarily unavailable. Please try again shortly.";
        }

        res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
            success: false,
            message: errorMessage
        });
    }
};

module.exports = { chatWithAI };
