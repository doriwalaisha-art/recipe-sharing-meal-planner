require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: 'I want to make pizza',
    config: {
        responseMimeType: 'application/json'
    }
}).then(r => console.log('SUCCESS:', r.text)).catch(e => console.error('ERROR:', e.message));
