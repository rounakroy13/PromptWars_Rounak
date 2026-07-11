/**
 * @fileoverview Application configuration module
 * Centralizes all configuration settings with validation
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * @typedef {Object} AppConfig
 * @property {number} port - Server port
 * @property {string} nodeEnv - Node environment
 * @property {boolean} isDev - Is development environment
 * @property {boolean} isProd - Is production environment
 */

/**
 * @typedef {Object} ApiConfig
 * @property {string} groqApiKey - Groq API key
 * @property {string} [openWeatherApiKey] - OpenWeatherMap API key
 */

/**
 * @typedef {Object} RateLimitConfig
 * @property {number} windowMs - Rate limit window in milliseconds
 * @property {number} maxRequests - Maximum requests per window
 * @property {number} aiMaxRequests - Maximum AI requests per window
 * @property {number} emergencyMaxRequests - Maximum emergency requests per window
 */

/**
 * @typedef {Object} CacheConfig
 * @property {number} stdTTL - Standard TTL in seconds
 * @property {number} checkPeriod - Check period in seconds
 */

/**
 * @typedef {Object} SecurityConfig
 * @property {string[]} corsOrigins - Allowed CORS origins
 * @property {string} requestBodyLimit - Request body size limit
 */

/**
 * Application configuration
 * @type {AppConfig}
 */
export const appConfig = {
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    get isDev() {
        return this.nodeEnv === 'development';
    },
    get isProd() {
        return this.nodeEnv === 'production';
    }
};

/**
 * API configuration
 * @type {ApiConfig}
 */
export const apiConfig = {
    groqApiKey: process.env.GROQ_API_KEY,
    openWeatherApiKey: process.env.OPENWEATHER_API_KEY
};

/**
 * Rate limiting configuration
 * @type {RateLimitConfig}
 */
export const rateLimitConfig = {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 30,
    aiMaxRequests: 10,
    emergencyMaxRequests: 20
};

/**
 * Cache configuration
 * @type {CacheConfig}
 */
export const cacheConfig = {
    stdTTL: 300,
    checkPeriod: 60
};

/**
 * Default CORS origins (production + development)
 */
const DEFAULT_CORS_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://monsoon-shield-production.up.railway.app'
];

/**
 * Security configuration
 * @type {SecurityConfig}
 */
export const securityConfig = {
    corsOrigins: process.env.CORS_ORIGIN
        ? [...new Set([...DEFAULT_CORS_ORIGINS, ...process.env.CORS_ORIGIN.split(',').map(o => o.trim())])]
        : DEFAULT_CORS_ORIGINS,
    requestBodyLimit: '10kb'
};

/**
 * Validates required configuration
 * @throws {Error} If required configuration is missing
 */
export function validateConfig() {
    const required = ['GROQ_API_KEY'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Validate API key format
    if (apiConfig.groqApiKey && !apiConfig.groqApiKey.startsWith('gsk_')) {
        console.warn('Warning: GROQ_API_KEY does not appear to be in the expected format');
    }
}

/**
 * Valid modes for the chat endpoint
 * @type {string[]}
 */
export const VALID_MODES = [
    'preparedness',
    'emergency',
    'travel',
    'health',
    'multilingual',
    'checklist',
    'realtime',
    'recovery'
];

/**
 * Valid languages for the application
 * @type {string[]}
 */
export const VALID_LANGUAGES = [
    'english',
    'hindi',
    'tamil',
    'telugu',
    'bengali',
    'marathi',
    'gujarati',
    'kannada',
    'malayalam',
    'punjabi',
    'odia'
];

export default {
    app: appConfig,
    api: apiConfig,
    rateLimit: rateLimitConfig,
    cache: cacheConfig,
    security: securityConfig,
    VALID_MODES,
    VALID_LANGUAGES,
    validateConfig
};
