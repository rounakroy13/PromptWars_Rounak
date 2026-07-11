/**
 * @fileoverview Type definitions for the MonsoonShield application
 * Uses JSDoc for TypeScript-like type checking in JavaScript
 */

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 * @typedef {import('express').RequestHandler} RequestHandler
 * @typedef {import('express').ErrorRequestHandler} ErrorRequestHandler
 */

/**
 * @typedef {Object} PreparednessData
 * @property {string} [location] - User's location
 * @property {string} [familySize] - Family size
 * @property {string} [housingType] - Type of housing
 * @property {string} [floor] - Floor level
 * @property {string} [budget] - Budget in INR
 * @property {string} [healthConditions] - Health conditions
 * @property {string} [vehicleType] - Vehicle type
 * @property {boolean} hasChildren - Has children
 * @property {boolean} hasElderly - Has elderly members
 * @property {boolean} hasPets - Has pets
 * @property {boolean} hasBasement - Has basement
 * @property {string} language - Response language
 */

/**
 * @typedef {Object} EmergencyData
 * @property {string} [emergencyType] - Type of emergency
 * @property {string} [location] - Location
 * @property {string} [situation] - Situation description
 * @property {string} [peopleAffected] - Number of people affected
 * @property {string} language - Response language
 */

/**
 * @typedef {Object} ChatContext
 * @property {string} [location] - User's location
 * @property {string} [familySize] - Family size
 * @property {string} [housingType] - Housing type
 * @property {Object} [weatherData] - Weather data
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Success status
 * @property {string} [response] - AI response
 * @property {string} [error] - Error message
 * @property {string} [message] - Additional message
 * @property {string} timestamp - ISO timestamp
 * @property {boolean} [cached] - Whether response is cached
 */

/**
 * @typedef {Object} HealthCheckResponse
 * @property {string} status - Server status
 * @property {string} service - Service name
 * @property {string} version - API version
 * @property {string} timestamp - ISO timestamp
 * @property {number} uptime - Server uptime in seconds
 * @property {string} environment - Node environment
 * @property {Object} cache - Cache statistics
 */

/**
 * @typedef {Object} EmergencyContacts
 * @property {string} NDRF - NDRF contact
 * @property {string} Police - Police contact
 * @property {string} Ambulance - Ambulance contact
 * @property {string} Fire - Fire contact
 * @property {string} Disaster - Disaster management contact
 */

/**
 * @typedef {Object} CacheStats
 * @property {number} keys - Number of cached keys
 * @property {number} hits - Cache hits
 * @property {number} misses - Cache misses
 * @property {string} hitRate - Hit rate percentage
 */

export {};
