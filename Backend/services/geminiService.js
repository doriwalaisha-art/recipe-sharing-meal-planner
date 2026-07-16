const { GoogleGenAI } = require("@google/genai");
const geminiConfig = require("../config/gemini");
const { withTimeout } = require("../utils/timeout");

// Attempt generation and fall back to fallback model on 404
const generateContent = async (ai, prompt, model) => {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                maxOutputTokens: geminiConfig.maxOutputTokens
            },
        });
        return response;
    } catch (error) {
        // Fallback model support
        if (error.status === 404 && model === geminiConfig.currentModel) {
            console.warn(`[Gemini Service] Model ${model} not available. Falling back to ${geminiConfig.fallbackModel}...`);
            return generateContent(ai, prompt, geminiConfig.fallbackModel);
        }
        throw error;
    }
};

// Retry helper for 429, timeouts, and network issues
const callGeminiWithRetry = async (apiKey, prompt, retries = 2, delayMs = 2000) => {
    const ai = new GoogleGenAI({ apiKey });
    
    try {
        const response = await withTimeout(generateContent(ai, prompt, geminiConfig.currentModel), 25000);
        return response;
    } catch (error) {
        const isRetryable = error.status === 429 || 
                            error.message?.toLowerCase().includes("quota") || 
                            error.message?.toLowerCase().includes("limit") ||
                            error.message?.toLowerCase().includes("exhausted") ||
                            error.message?.toLowerCase().includes("timeout") ||
                            error.message?.toLowerCase().includes("fetch");

        if (isRetryable && retries > 0) {
            const nextDelay = retries === 2 ? 5000 : 10000;
            console.warn(`[Gemini Service] Request retryable error. Retrying in ${delayMs / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            return callGeminiWithRetry(apiKey, prompt, retries - 1, nextDelay);
        }
        throw error;
    }
};

module.exports = { callGeminiWithRetry };
