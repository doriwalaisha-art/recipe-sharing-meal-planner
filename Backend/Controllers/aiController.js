require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const generateRecipe = async (req, res) => {
    try {
        const { title, description } = req.body;

        if(!title || title.trim() === "" ) {
            return res.status(400).json({
                message : "Title is required"
            });
        }
        const prompt = `You are a professional chef.
        Generate recipe ingredients and cooking instructions.
        
        Recipe Title : ${title}
        Recipe Description : ${description || "No description provided"}

        Guidelines:
        1. Keep the cooking instructions concise, clear, and easy to read.
        2. Each instruction step must be short and direct (maximum 1-2 sentences per step).
        3. Do not include overly lengthy descriptions; focus on actionable steps.

        Return only valid JSON.

        Format:
        {
          "ingredients": [
            "Ingredient 1",
            "Ingredient 2"
          ],
          "instructions": [
            "Step 1",
            "Step 2"
          ]
        }

        Do not write markdown.
        Do not write explanation.
        Do not use \`\`\`json.
        Return only JSON.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        let text = response.text.trim();

        //remove markdown
        text = text.replace(/```json/g, "");
        text = text.replace(/```/g, "").trim();
    
        const recipe = JSON.parse(text);
        res.status(200).json(recipe);
    
    }catch(error) {
        console.log("Gemini Error:", error);

        res.status(500).json({
            message: "Failed to generate recipe."
        });

    }
};

module.exports = {
    generateRecipe
};