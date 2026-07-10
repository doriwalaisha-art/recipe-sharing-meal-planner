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

        const validationPrompt = `
            You are a food validation assistant.
        
            Determine whether the following title and description describe a real food recipe.
        
            Recipe Title: ${title}
            Recipe Description: ${description || "No description"}
        
            Reply with ONLY one word.
        
            YES -> if the title and description are about a food recipe or dish.
        
            NO -> if they are names of people, places, random words, meaningless text, numbers, greetings, objects, animals, movies, sports, or anything that is not a recipe.
        
            Return only YES or NO.
        `;

        const validationResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: validationPrompt
        });

        const validation = validationResponse.text.trim().toUpperCase();

        if (validation !== "YES") {
            return res.status(400).json({
                message: "Please enter a valid recipe title and description related to food."
            });
        }   
               
        const prompt = `
            You are an expert chef and recipe validator.
                
            Your task is to first determine whether the given recipe title and description represent a real, meaningful food recipe.
                
            Recipe Title: ${title}
            Recipe Description: ${description || "No description provided"}
                
            Rules:
                
            1. If the title or description is meaningless, placeholder text, random words, numbers, unrelated to food, or does not describe a recipe (examples: "demo", "test", "abc", "xyz", "123", "hello", "sample", "qwerty"), DO NOT generate ingredients or instructions.
                
            Instead, return ONLY this JSON:
                
            {
              "success": false,
              "message": "Please enter a valid recipe title and description related to food."
            }
                
            2. If the title describes a real food item but the description is missing or short, intelligently generate suitable ingredients and cooking instructions based on the recipe title.
                
            3. If both the title and description describe a valid recipe, generate ingredients and cooking instructions that match the recipe accurately.
                
            4. Ingredients should contain only ingredient names with quantities.
                
            5. Instructions should be short, clear, and beginner-friendly.
                
            6. Each instruction must contain only one cooking action.
                
            7. Do not generate unnecessary stories, tips, notes, nutrition facts, or explanations.
                
            8. Return ONLY valid JSON.
                
            Output format for a valid recipe:
                
            {
              "success": true,
              "ingredients": [
                "Ingredient 1",
                "Ingredient 2"
              ],
              "instructions": [
                "Step 1",
                "Step 2"
              ]
            }
                
            Do NOT use markdown.
                
            Do NOT use \`\`\`json.
                
            Return ONLY JSON.
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