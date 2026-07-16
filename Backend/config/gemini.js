// Configuration and variables for Gemini API
module.exports = {
    // Current model used for generation
    currentModel: "gemini-2.5-flash",
    // Fallback model if the 2.5 flash is unavailable
    fallbackModel: "gemini-flash-latest",
    // Max tokens configuration for responses
    maxOutputTokens: 1500
};
