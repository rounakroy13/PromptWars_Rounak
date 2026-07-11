/**
 * @fileoverview Express middleware configurations
 * Security, rate limiting, compression, and logging middleware
 */

import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { appConfig, securityConfig, rateLimitConfig } from '../config/index.js';
import logger, { logRequest, logSecurity } from '../utils/logger.js';

/**
 * Helmet security headers configuration
 * @returns {Function} Helmet middleware
 */
export function helmetMiddleware() {
    return helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"],
                frameSrc: ["'none'"],
                objectSrc: ["'none'"]
            }
        },
        crossOriginEmbedderPolicy: false
    });
}

/**
 * CORS configuration middleware
 * @returns {Function} CORS middleware
 */
export function corsMiddleware() {
    return cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, curl)
            if (!origin) {
                return callback(null, true);
            }

            if (securityConfig.corsOrigins.includes(origin) || appConfig.isDev) {
                callback(null, true);
            } else {
                logSecurity('CORS blocked', { origin });
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
        maxAge: 86400 // 24 hours
    });
}

/**
 * Creates a rate limiter with custom configuration
 * @param {Object} options - Rate limiter options
 * @param {number} options.max - Maximum requests
 * @param {string} options.message - Rate limit message
 * @param {string} [options.name='general'] - Limiter name for logging
 * @returns {Function} Rate limiter middleware
 */
export function createRateLimiter({ max, message, name = 'general' }) {
    return rateLimit({
        windowMs: rateLimitConfig.windowMs,
        max,
        message: {
            error: 'Rate limit exceeded',
            message,
            retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res, _next, options) => {
            logSecurity(`${name} rate limit exceeded`, { ip: req.ip });
            res.status(429).json(options.message);
        }
    });
}

/**
 * General API rate limiter
 * @type {Function}
 */
export const generalLimiter = createRateLimiter({
    max: rateLimitConfig.maxRequests,
    message: 'Please wait before making more requests',
    name: 'General'
});

/**
 * AI endpoint rate limiter (stricter)
 * @type {Function}
 */
export const aiLimiter = createRateLimiter({
    max: rateLimitConfig.aiMaxRequests,
    message: 'Too many AI requests. Please wait.',
    name: 'AI'
});

/**
 * Emergency endpoint rate limiter (more lenient)
 * @type {Function}
 */
export const emergencyLimiter = createRateLimiter({
    max: rateLimitConfig.emergencyMaxRequests,
    message: 'Please call emergency services directly: NDRF: 9711077372, Police: 100',
    name: 'Emergency'
});

/**
 * Compression middleware configuration
 * @returns {Function} Compression middleware
 */
export function compressionMiddleware() {
    return compression({
        filter: (req, res) => {
            if (req.headers['x-no-compression']) {
                return false;
            }
            return compression.filter(req, res);
        },
        level: 6 // Balanced compression level
    });
}

/**
 * Request logging middleware
 * @returns {Function} Logging middleware
 */
export function requestLogger() {
    return (req, res, next) => {
        const start = Date.now();

        res.on('finish', () => {
            const duration = Date.now() - start;
            logRequest(req, res, duration);
        });

        next();
    };
}

/**
 * Async handler wrapper for route handlers
 * Catches errors and passes them to the error handler
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped handler
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} _next - Next function
 */
export function errorHandler(err, req, res, _next) {
    logger.error('Unhandled error', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method
    });

    res.status(500).json({
        error: 'Internal server error',
        message: appConfig.isDev ? err.message : 'Something went wrong'
    });
}

/**
 * 404 Not Found handler
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export function notFoundHandler(req, res) {
    res.status(404).json({
        error: 'Not found',
        message: 'The requested resource was not found'
    });
}

export default {
    helmetMiddleware,
    corsMiddleware,
    createRateLimiter,
    generalLimiter,
    aiLimiter,
    emergencyLimiter,
    compressionMiddleware,
    requestLogger,
    asyncHandler,
    errorHandler,
    notFoundHandler
};