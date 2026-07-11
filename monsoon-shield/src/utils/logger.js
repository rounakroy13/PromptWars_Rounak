/**
 * @fileoverview Winston logger configuration
 * Provides structured logging with different levels for dev/prod
 */

import winston from 'winston';
import { appConfig } from '../config/index.js';

const { combine, timestamp, errors, json, colorize, simple, printf } = winston.format;

/**
 * Custom log format for development
 */
const devFormat = printf(({ level, message, timestamp: ts, ...metadata }) => {
    let msg = `${ts} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
});

/**
 * Create logger instance with environment-specific configuration
 * @type {winston.Logger}
 */
const logger = winston.createLogger({
    level: appConfig.isProd ? 'info' : 'debug',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        json()
    ),
    defaultMeta: { service: 'monsoon-shield' },
    transports: [
        new winston.transports.Console({
            format: appConfig.isDev
                ? combine(colorize(), timestamp({ format: 'HH:mm:ss' }), devFormat)
                : combine(timestamp(), json())
        })
    ]
});

/**
 * Log HTTP request details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} duration - Request duration in ms
 */
export function logRequest(req, res, duration) {
    logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('user-agent')?.substring(0, 100)
    });
}

/**
 * Log security-related events
 * @param {string} event - Security event type
 * @param {Object} details - Event details
 */
export function logSecurity(event, details) {
    logger.warn(`Security Event: ${event}`, details);
}

/**
 * Log API errors
 * @param {Error} error - Error object
 * @param {Object} [context] - Additional context
 */
export function logError(error, context = {}) {
    logger.error('Application Error', {
        message: error.message,
        stack: error.stack,
        ...context
    });
}

/**
 * Log cache operations
 * @param {string} operation - Cache operation (hit, miss, set)
 * @param {string} key - Cache key
 */
export function logCache(operation, key) {
    logger.debug(`Cache ${operation}`, { key: key.substring(0, 50) });
}

export default logger;