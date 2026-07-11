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
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 * @typedef {import('express').RequestHandler} RequestHandler
 * @typedef {import('express').ErrorRequestHandler} ErrorRequestHandler
 */

/**
 * Helmet security headers configuration
 * @returns {RequestHandler} Helmet middleware
 */
export function helmetMiddleware() {
    return helmet({
        contentSecurityPolicy: {
            useDefaults: false,
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
                styleSrcAttr: ["'unsafe-inline'"],
                fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                scriptSrcAttr: ["'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'", 'https://monsoon-shield-production.up.railway.app'],
                frameSrc: ["'none'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                baseUri: ["'self'"],
                formAction: ["'self'"],
                frameAncestors: ["'self'"],
                upgradeInsecureRequests: []
            }
        },
        crossOriginEmbedderPolicy: false
    });
}

/**
 * CORS configuration middleware
 * @returns {RequestHandler} CORS middleware
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
 * @typedef {Object} RateLimiterOptions
 * @property {number} max - Maximum requests
 * @property {string} message - Rate limit message
 * @property {string} [name='general'] - Limiter name for logging
 */

/**
 * Creates a rate limiter with custom configuration
 * @param {RateLimiterOptions} options - Rate limiter options
 * @returns {RequestHandler} Rate limiter middleware
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
 * @type {RequestHandler}
 */
export const generalLimiter = createRateLimiter({
    max: rateLimitConfig.maxRequests,
    message: 'Please wait before making more requests',
    name: 'General'
});

/**
 * AI endpoint rate limiter (stricter)
 * @type {RequestHandler}
 */
export const aiLimiter = createRateLimiter({
    max: rateLimitConfig.aiMaxRequests,
    message: 'Too many AI requests. Please wait.',
    name: 'AI'
});

/**
 * Emergency endpoint rate limiter (more lenient)
 * @type {RequestHandler}
 */
export const emergencyLimiter = createRateLimiter({
    max: rateLimitConfig.emergencyMaxRequests,
    message: 'Please call emergency services directly: NDRF: 9711077372, Police: 100',
    name: 'Emergency'
});

/**
 * Compression middleware configuration
 * @returns {RequestHandler} Compression middleware
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
 * @returns {RequestHandler} Logging middleware
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
 * @param {function(Request, Response, NextFunction): Promise<any>} fn - Async route handler
 * @returns {RequestHandler} Wrapped handler
 */
export function asyncHandler(fn) {
    return /** @type {RequestHandler} */ ((req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    });
}

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} _next - Next function
 * @returns {void}
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
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @returns {void}
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
