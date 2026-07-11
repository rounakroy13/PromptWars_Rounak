/**
 * @fileoverview Input sanitization and validation utilities
 * Provides XSS protection and input validation
 */

import xss from 'xss';
import { VALID_MODES, VALID_LANGUAGES } from '../config/index.js';

/**
 * Maximum allowed input length
 * @constant {number}
 */
const MAX_INPUT_LENGTH = 2000;

/**
 * Sanitizes a string input to prevent XSS attacks
 * @param {*} input - Input to sanitize
 * @param {number} [maxLength=MAX_INPUT_LENGTH] - Maximum allowed length
 * @returns {string|*} Sanitized string or original value if not a string
 */
export function sanitizeInput(input, maxLength = MAX_INPUT_LENGTH) {
    if (typeof input !== 'string') {
        return input;
    }
    return xss(input.trim().substring(0, maxLength));
}

/**
 * Recursively sanitizes all string values in an object
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
export function sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => {
            if (typeof item === 'string') {
                return sanitizeInput(item);
            }
            if (typeof item === 'object') {
                return sanitizeObject(item);
            }
            return item;
        });
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeInput(value);
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

/**
 * Validates and returns a valid mode, defaults to 'preparedness'
 * @param {string} mode - Mode to validate
 * @returns {string} Valid mode
 */
export function validateMode(mode) {
    if (!mode || typeof mode !== 'string') {
        return 'preparedness';
    }
    const normalizedMode = mode.toLowerCase().trim();
    return VALID_MODES.includes(normalizedMode) ? normalizedMode : 'preparedness';
}

/**
 * Validates and returns a valid language, defaults to 'english'
 * @param {string} language - Language to validate
 * @returns {string} Valid language
 */
export function validateLanguage(language) {
    if (!language || typeof language !== 'string') {
        return 'english';
    }
    const normalizedLang = language.toLowerCase().trim();
    return VALID_LANGUAGES.includes(normalizedLang) ? normalizedLang : 'english';
}

/**
 * Validates that a string is not empty and meets minimum length
 * @param {string} value - Value to validate
 * @param {number} [minLength=2] - Minimum required length
 * @returns {boolean} True if valid
 */
export function isValidString(value, minLength = 2) {
    return typeof value === 'string' && value.trim().length >= minLength;
}

/**
 * Converts a value to boolean safely
 * @param {*} value - Value to convert
 * @returns {boolean} Boolean value
 */
export function toBoolean(value) {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        return ['true', '1', 'yes'].includes(value.toLowerCase());
    }
    return Boolean(value);
}

/**
 * Sanitizes preparedness plan input data
 * @param {Object} data - Raw input data
 * @returns {Object} Sanitized data object
 */
export function sanitizePreparednessData(data) {
    return {
        location: sanitizeInput(data.location),
        familySize: sanitizeInput(data.familySize),
        housingType: sanitizeInput(data.housingType),
        floor: sanitizeInput(data.floor),
        budget: sanitizeInput(data.budget),
        healthConditions: sanitizeInput(data.healthConditions),
        vehicleType: sanitizeInput(data.vehicleType),
        hasChildren: toBoolean(data.hasChildren),
        hasElderly: toBoolean(data.hasElderly),
        hasPets: toBoolean(data.hasPets),
        hasBasement: toBoolean(data.hasBasement),
        language: validateLanguage(data.language)
    };
}

/**
 * Sanitizes emergency data
 * @param {Object} data - Raw input data
 * @returns {Object} Sanitized data object
 */
export function sanitizeEmergencyData(data) {
    return {
        emergencyType: sanitizeInput(data.emergencyType),
        location: sanitizeInput(data.location),
        situation: sanitizeInput(data.situation),
        peopleAffected: sanitizeInput(data.peopleAffected),
        language: validateLanguage(data.language)
    };
}

export default {
    sanitizeInput,
    sanitizeObject,
    validateMode,
    validateLanguage,
    isValidString,
    toBoolean,
    sanitizePreparednessData,
    sanitizeEmergencyData
};