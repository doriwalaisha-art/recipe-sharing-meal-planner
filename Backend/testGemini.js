require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function testGemini() {
    try {

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Give ingredients for Margherita Pizza in JSON array only."
        });

        console.log(response.text);

    } catch (error) {
        console.log(error);
    }
}

testGemini();