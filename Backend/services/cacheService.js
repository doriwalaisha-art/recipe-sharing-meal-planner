
const recipeCache = new Map();
const pendingRequests = new Map();

const CACHE_TTL = 30 * 60 * 1000;


const getRecipeFromCache = (key) => {
    if (!recipeCache.has(key)) return null;
    
    const { value, expiry } = recipeCache.get(key);
    if (Date.now() > expiry) {
        recipeCache.delete(key);
        return null;
    }
    return value;
};

const saveRecipeToCache = (key, value) => {
    recipeCache.set(key, {
        value,
        expiry: Date.now() + CACHE_TTL
    });
};

const getRecipe = async (cacheKey, apiCallFn) => {
    if (!cacheKey) {
        return await apiCallFn();
    }


    const cached = getRecipeFromCache(cacheKey);
    if (cached) {
        console.log("[Cache Service] Serving from cache");
        return cached;
    }
    if (pendingRequests.has(cacheKey)) {
        console.log("[Cache Service] Sharing simultaneous request");
        return await pendingRequests.get(cacheKey);
    }
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
