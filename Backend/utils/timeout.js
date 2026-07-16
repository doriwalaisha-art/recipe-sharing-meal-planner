// Helper to race a promise against a timeout duration
const withTimeout = (promise, ms) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`AI request timed out after ${ms / 1000}s`)), ms)
        ),
    ]);
};

module.exports = { withTimeout };
