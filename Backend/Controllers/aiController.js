require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const MODELS = ["gemini-3.5-flash", "gemini-3.1-flash"];

const withTimeout = (promise, ms) =>
    Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`AI request timed out after ${ms / 1000}s`)), ms)
        ),
    ]);

const generateRecipe = async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title || title.trim() === "") {
            return res.status(400).json({ message: "Title is required" });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ message: "GEMINI_API_KEY is not configured." });
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

        let validationResponse = null;
        for (const model of MODELS) {
            try {
                validationResponse = await withTimeout(
                    ai.models.generateContent({ 
                        model, 
                        contents: validationPrompt,
                        config: { maxOutputTokens: 10 }
                    }),
                    15000
                );
                break;
            } catch (err) {
                console.warn(`[AI Generate] Validation model ${model} failed:`, err.message);
            }
        }

        if (!validationResponse) {
            return res.status(503).json({ message: "AI service unavailable. Please try again." });
        }

        const validation = validationResponse.text.trim().toUpperCase();
        if (validation !== "YES") {
            return res.status(400).json({
                message: "Please enter a valid recipe title and description related to food.",
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

        let recipeResponse = null;
        for (const model of MODELS) {
            try {
                recipeResponse = await withTimeout(
                    ai.models.generateContent({ 
                        model, 
                        contents: prompt,
                        config: { 
                            responseMimeType: "application/json",
                            maxOutputTokens: 2048 
                        }
                    }),
                    25000
                );
                break;
            } catch (err) {
                console.warn(`[AI Generate] Recipe model ${model} failed:`, err.message);
            }
        }

        if (!recipeResponse) {
            return res.status(503).json({ message: "AI service unavailable. Please try again." });
        }

        let text = recipeResponse.text
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

        const recipe = JSON.parse(text);
        res.status(200).json(recipe);
    } catch (error) {
        console.error("[AI Generate Error]", error.message);
        res.status(500).json({ message: "Failed to generate recipe. Please try again." });
    }
};

module.exports = { generateRecipe };