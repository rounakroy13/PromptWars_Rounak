/**
 * @fileoverview Cache service for API response caching
 * Uses node-cache for in-memory caching
 */

import NodeCache from 'node-cache';
import { cacheConfig } from '../config/index.js';
import { logCache } from '../utils/logger.js';

/**
 * Cache instance with configured TTL and check period
 * @type {NodeCache}
 */
const cache = new NodeCache({
    stdTTL: cacheConfig.stdTTL,
    checkperiod: cacheConfig.checkPeriod,
    useClones: false,
    deleteOnExpire: true
});

/**
 * Generates a cache key from endpoint and parameters
 * @param {string} endpoint - API endpoint name
 * @param {Object} params - Request parameters
 * @returns {string} Cache key
 */
export function generateCacheKey(endpoint, params) {
    const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}:${String(params[key]).substring(0, 50)}`)
        .join('|');
    return `${endpoint}:${sortedParams}`;
}

/**
 * Gets a cached response
 * @param {string} key - Cache key
 * @returns {*|undefined} Cached value or undefined
 */
export function getCachedResponse(key) {
    const value = cache.get(key);
    if (value !== undefined) {
        logCache('hit', key);
        return value;
    }
    logCache('miss', key);
    return undefined;
}

/**
 * Sets a cached response
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} [ttl=cacheConfig.stdTTL] - Time to live in seconds
 * @returns {boolean} True if successful
 */
export function setCachedResponse(key, value, ttl = cacheConfig.stdTTL) {
    const success = cache.set(key, value, ttl);
    if (success) {
        logCache('set', key);
    }
    return success;
}

/**
 * Deletes a cached response
 * @param {string} key - Cache key
 * @returns {number} Number of deleted entries
 */
export function deleteCachedResponse(key) {
    return cache.del(key);
}

/**
 * Clears all cached responses
 */
export function clearCache() {
    cache.flushAll();
}

/**
 * Gets cache statistics
 * @returns {Object} Cache statistics
 */
export function getCacheStats() {
    const stats = cache.getStats();
    return {
        keys: cache.keys().length,
        hits: stats.hits,
        misses: stats.misses,
        hitRate: stats.hits + stats.misses > 0
            ? `${((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2)  }%`
            : '0%'
    };
}

/**
 * Closes the cache (for graceful shutdown)
 */
export function closeCache() {
    cache.close();
}

/**
 * Cache middleware for Express routes
 * @param {Object} options - Cache options
 * @param {number} [options.ttl] - Time to live
 * @param {Function} [options.keyGenerator] - Custom key generator
 * @returns {Function} Express middleware
 */
export function cacheMiddleware(options = {}) {
    const { ttl, keyGenerator } = options;

    return (req, res, next) => {
        const key = keyGenerator
            ? keyGenerator(req)
            : generateCacheKey(req.path, req.body || {});

        const cachedResponse = getCachedResponse(key);
        if (cachedResponse) {
            return res.json({ ...cachedResponse, cached: true });
        }

        // Store original json method
        const originalJson = res.json.bind(res);

        // Override json method to cache response
        res.json = (body) => {
            if (res.statusCode === 200 && body.success) {
                setCachedResponse(key, body, ttl);
            }
            return originalJson(body);
        };

        next();
    };
}

export default {
    generateCacheKey,
    getCachedResponse,
    setCachedResponse,
    deleteCachedResponse,
    clearCache,
    getCacheStats,
    closeCache,
    cacheMiddleware,
    cache // Export raw cache for advanced usage
};
