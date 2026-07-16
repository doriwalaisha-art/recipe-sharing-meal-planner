require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey : process.env.GEMINI_API_KEY
});

const chatWithAI = async (req, res) => {
    try {
        const { message , recipe } = req.body;

        if(!message || message.trim() === "") {
            return res.status(400).json({
                success : false,
                message : "Message is required"
            });
        }

        const cleanRecipe = { ...recipe };
        if (cleanRecipe.image && cleanRecipe.image.length > 200) {
            cleanRecipe.image = "uploaded_image_placeholder";
        }

        const prompt = `
           You are an Expert AI Recipe Assistant and Professional Chef.
           The user is building a recipe through conversation step-by-step.

           Required Recipe Fields: Title, Description, Category, Cooking Time, Servings, Difficulty, Image, Ingredients, Instructions.

           Current Recipe State:
           ${cleanRecipe && Object.keys(cleanRecipe).length > 0 ? JSON.stringify(cleanRecipe) : "Empty"}

           User Message:
           ${message}

           ----------------------------------
           RULES
           ----------------------------------

           1. Extract any valid recipe fields provided by the user in their message and ADD them to the Current Recipe State. Understand natural language (e.g. "I want to make Pizza. It takes 30 mins" -> Title: Pizza, Cooking Time: 30 mins).
           2. If the user asks to "Generate everything", generate realistic content for: description, cookingTime, servings, difficulty, ingredients, instructions. DO NOT generate category or image.
           3. If the user asks to generate a specific missing field (e.g. "Generate ingredients"), generate it and add it to the state.
           4. Determine the updated recipe state based on the rules above.
           5. Check the updated recipe state to see which required fields are STILL MISSING.
           6. If there are missing fields, choose the FIRST missing field and formulate a natural language question asking the user for it.
              - If the missing field is "Category", your reply must ask them to choose a category, and set action to "ask_category".
              - If the missing field is "Difficulty", your reply must ask them to choose a difficulty level, and set action to "ask_difficulty".
              - If the missing field is "Image", your reply must ask them to upload an image, and set action to "ask_image".
              - For all other missing fields, set action to "ask_text".
              - Set type to "update".
           7. If ALL required fields (Title, Description, Category, Cooking Time, Servings, Difficulty, Image, Ingredients, Instructions) are present, set type to "complete", reply "Your recipe is ready!", and action to "ready".
           8. If the user wants to MODIFY a field, update the field in the recipe state, and then evaluate again what is missing (or complete).
           9. If the message is a cooking question not related to building this recipe, just answer it and set type to "update", action to "ask_text".
           10. If the message is completely unrelated to cooking, set type to "invalid", reply "Please enter a valid recipe or cooking related request.", and action to "ask_text".

           Return ONLY valid JSON in the following format:
           {
              "type": "update" | "complete" | "invalid",
              "reply": "Your conversational response",
              "action": "ask_text" | "ask_category" | "ask_difficulty" | "ask_image" | "ready",
              "recipe": {
                  "title": "...",
                  "description": "...",
                  "category": "...",
                  "cookingTime": "...",
                  "servings": "...",
                  "difficulty": "...",
                  "image": "...",
                  "ingredients": ["..."],
                  "instructions": ["..."]
              }
           }

           IMPORTANT: Return ONLY JSON. Never return markdown. Never use \`\`\`json. The "recipe" object MUST contain ALL fields you currently know about.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        let text = response.text.trim();

        text = text.replace(/```json/g, "");
        text = text.replace(/```/g, "").trim();

        const result = JSON.parse(text);

        return res.status(200).json(result);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "AI Chat Failed"
        });

    }

};

module.exports = {
    chatWithAI
};
    
