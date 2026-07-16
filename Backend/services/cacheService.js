// Memory Cache and Request Deduplication Service
const recipeCache = new Map();
const pendingRequests = new Map();

// 30 minutes in milliseconds
const CACHE_TTL = 30 * 60 * 1000;

// Retrieve from cache if not expired
const getRecipeFromCache = (key) => {
    if (!recipeCache.has(key)) return null;
    
    const { value, expiry } = recipeCache.get(key);
    if (Date.now() > expiry) {
        recipeCache.delete(key);
        return null;
    }
    return value;
};

// Save result to cache
const saveRecipeToCache = (key, value) => {
    recipeCache.set(key, {
        value,
        expiry: Date.now() + CACHE_TTL
    });
};

// Handle parallel duplicate requests and caching wrapper
const getRecipe = async (cacheKey, apiCallFn) => {
    if (!cacheKey) {
        return await apiCallFn();
    }

    // Check Cache
    const cached = getRecipeFromCache(cacheKey);
    if (cached) {
        console.log("[Cache Service] Serving from cache");
        return cached;
    }

    // Check Pending Requests
    if (pendingRequests.has(cacheKey)) {
        console.log("[Cache Service] Sharing simultaneous request");
        return await pendingRequests.get(cacheKey);
    }

    // Create and track the request promise
    const requestPromise = apiCallFn().then(result => {
        saveRecipeToCache(cacheKey, result);
        pendingRequests.delete(cacheKey);
        return result;
    }).catch(err => {
        pendingRequests.delete(cacheKey);
        throw err;
    });

    pendingRequests.set(cacheKey, requestPromise);
    return await requestPromise;
};

module.exports = { getRecipe };
