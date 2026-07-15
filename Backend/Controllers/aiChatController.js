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

        const prompt = `
           You are an Expert AI Recipe Assistant and Professional Chef.

            Your job is to understand the user's message and return ONLY valid JSON.

            Current Recipe:
            ${recipe ? JSON.stringify(recipe) : "No recipe available"}

            User Message:
            ${message}

            ----------------------------------
            RULES
            ----------------------------------

            1. If the user wants to CREATE a recipe

            Examples:

            - Create Paneer Pizza
            - Make Veg Biryani
            - I want Pasta
            - Make a healthy breakfast

            Return:

            {
              "type":"create",
              "reply":"Short friendly response.",
              "recipe":{
                  "title":"",
                  "description":"",
                  "prepTime":"20 mins",
                  "cookTime":"25 mins",
                  "difficulty":"Easy",
                  "servings":"4",
                  "ingredients":[
                    "..."
                  ],
                  "instructions":[
                    "..."
                  ]
              }
            }

            ALWAYS include EVERY field.

            Never leave any field empty.

            ----------------------------------

            2. If user wants to MODIFY the current recipe

            Examples

            Remove Onion

            Add Cheese

            Increase Servings

            Make it spicy

            Replace butter with olive oil

            Return

            {
            "type":"update",
            "reply":"Recipe updated successfully.",
            "recipe":{
                  "title":"",
                  "description":"",
                  "prepTime":"20 mins",
                  "cookTime":"25 mins",
                  "difficulty":"Easy",
                  "servings":"4",
                  "ingredients":[...],
                  "instructions":[...]
            }
            }

            Always return the COMPLETE updated recipe.

            Never return only changed fields.

            ----------------------------------

            3. If user asks cooking questions

            Examples

            Can I replace butter with oil?

            How do I make crispy fries?

            What cheese is best for pizza?

            Return

            {
            "type":"question",
            "reply":"Answer the question."
            }

            ----------------------------------

            4. If the message is NOT related to recipes or cooking

            Examples

            abc

            demo

            xyz

            12345

            hello

            good morning

            who are you

            what is node js

            movie

            cricket

            Return

            {
            "type":"invalid",
            "reply":"Please enter a valid recipe or cooking related request."
            }

            ----------------------------------

            IMPORTANT

            Return ONLY JSON.

            Never return markdown.

            Never return explanation.

            Never use \`\`\`json.
                        `;

        const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
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
    
