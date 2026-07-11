/**
 * @fileoverview MonsoonShield AI Server
 * Main entry point for the application - refactored to use modular architecture
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import modular components
import config, { appConfig, apiConfig, validateConfig } from './src/config/index.js';
import logger from './src/utils/logger.js';
import {
    sanitizeInput,
    sanitizeObject,
    validateMode,
    validateLanguage,
    isValidString,
    sanitizePreparednessData,
    sanitizeEmergencyData
} from './src/utils/sanitizer.js';
import { getPrompt, enhancePrompt, generatePreparednessPrompt, generateEmergencyPrompt } from './src/prompts/index.js';
import {
    helmetMiddleware,
    corsMiddleware,
    generalLimiter,
    aiLimiter,
    emergencyLimiter,
    compressionMiddleware,
    requestLogger,
    asyncHandler,
    errorHandler,
    notFoundHandler
} from './src/middleware/index.js';
import {
    generateCacheKey,
    getCachedResponse,
    setCachedResponse,
    getCacheStats,
    closeCache
} from './src/services/cache.js';

// External dependencies
import Groq from 'groq-sdk';

// ES Module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================
// CONFIGURATION VALIDATION
// ============================================
try {
    validateConfig();
    logger.info('Configuration validated successfully');
} catch (err) {
    logger.error(`Configuration error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
}

// Validate API key format (warning only)
if (apiConfig.groqApiKey && !apiConfig.groqApiKey.startsWith('gsk_')) {
    logger.warn('GROQ_API_KEY does not appear to be in the expected format (should start with gsk_)');
}

// ============================================
// EXPRESS APP SETUP
// ============================================
const app = express();

// ============================================
// GROQ CLIENT INITIALIZATION
// ============================================
/** @type {Groq} */
let groq;
try {
    groq = new Groq({ apiKey: apiConfig.groqApiKey });
    logger.info('Groq client initialized successfully');
} catch (err) {
    logger.error('Failed to initialize Groq client:', err);
    process.exit(1);
}

// ============================================
// MIDDLEWARE SETUP
// ============================================
app.use(helmetMiddleware());
app.use(corsMiddleware());
app.use(compressionMiddleware());
app.use(express.json({ limit: config.security.requestBodyLimit, strict: true }));
app.use(express.urlencoded({ extended: true, limit: config.security.requestBodyLimit }));
app.use(requestLogger());

// Static files with caching
app.use(express.static(join(__dirname, 'public'), {
    maxAge: appConfig.isProd ? '1d' : 0,
    etag: true,
    lastModified: true
}));

// Apply general rate limiter to all API routes
app.use('/api/', generalLimiter);

// ============================================
// GROQ API HELPER
// ============================================

/**
 * Default Groq API options
 */
const DEFAULT_GROQ_OPTIONS = {
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 2048
};

/**
 * Makes a chat completion request to Groq API
 * @param {string} systemPrompt - System prompt
 * @param {string} userMessage - User message
 * @param {Object} [options] - Additional options
 * @returns {Promise<string>} AI response
 */
async function getGroqCompletion(systemPrompt, userMessage, options = {}) {
    const completion = await groq.chat.completions.create({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ],
        ...DEFAULT_GROQ_OPTIONS,
        ...options
    });

    return completion.choices[0]?.message?.content || 'Unable to generate response. Please try again.';
}

// ============================================
// API ROUTES
// ============================================

/**
 * Health check endpoint
 */
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'MonsoonShield API',
        version: '1.2.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: appConfig.nodeEnv,
        cache: getCacheStats()
    });
});

/**
 * Main chat endpoint
 */
app.post('/api/chat', aiLimiter, asyncHandler(async (req, res) => {
    const { message, mode = 'preparedness', context = {}, language = 'english' } = req.body;

    if (!isValidString(message)) {
        return res.status(400).json({
            error: 'Invalid request',
            message: 'Message is required and must be at least 2 characters'
        });
    }

    const sanitizedMessage = sanitizeInput(message);
    const sanitizedContext = sanitizeObject(context);
    const validatedMode = validateMode(mode);
    const validatedLanguage = validateLanguage(language);

    // Check cache (skip for emergency mode)
    const cacheKey = generateCacheKey('chat', {
        msg: sanitizedMessage.substring(0, 50),
        mode: validatedMode,
        lang: validatedLanguage
    });

    if (validatedMode !== 'emergency') {
        const cached = getCachedResponse(cacheKey);
        if (cached) {
            return res.json({ ...cached, cached: true });
        }
    }

    // Build system prompt with context
    const systemPrompt = enhancePrompt(
        getPrompt(validatedMode),
        sanitizedContext,
        validatedLanguage
    );

    const response = await getGroqCompletion(systemPrompt, sanitizedMessage);

    const result = {
        success: true,
        response,
        mode: validatedMode,
        timestamp: new Date().toISOString()
    };

    // Cache non-emergency responses
    if (validatedMode !== 'emergency') {
        setCachedResponse(cacheKey, result);
    }

    res.json(result);
}));

/**
 * Preparedness plan endpoint
 */
app.post('/api/preparedness-plan', aiLimiter, asyncHandler(async (req, res) => {
    const data = sanitizePreparednessData(req.body);

    const prompt = generatePreparednessPrompt(data);
    const systemPrompt = enhancePrompt(getPrompt('preparedness'), {}, data.language);

    const response = await getGroqCompletion(systemPrompt, prompt, { max_tokens: 3000 });

    res.json({
        success: true,
        plan: response,
        generatedFor: {
            location: data.location,
            familySize: data.familySize,
            housingType: data.housingType
        },
        timestamp: new Date().toISOString()
    });
}));

/**
 * Emergency checklist endpoint
 */
app.post('/api/emergency-checklist', aiLimiter, asyncHandler(async (req, res) => {
    const { checklistType = 'general', familySize, specialNeeds, language = 'english' } = req.body;

    const data = {
        checklistType: sanitizeInput(checklistType),
        familySize: sanitizeInput(familySize),
        specialNeeds: sanitizeInput(specialNeeds),
        language: validateLanguage(language)
    };

    const prompt = `Generate ${data.checklistType} emergency checklist for monsoon. Family: ${data.familySize || '4'}, Needs: ${data.specialNeeds || 'None'}. Include: Essentials, Documents, Contacts, First Aid, Communication, Shelter. Format: ☐ checkbox, quantity, cost INR. Priority: CRITICAL/HIGH/MEDIUM/LOW.`;

    const systemPrompt = enhancePrompt(getPrompt('checklist'), {}, data.language);

    const response = await getGroqCompletion(systemPrompt, prompt, {
        temperature: 0.6,
        max_tokens: 2500
    });

    res.json({
        success: true,
        checklist: response,
        type: data.checklistType,
        timestamp: new Date().toISOString()
    });
}));

/**
 * Travel advisory endpoint
 */
app.post('/api/travel-advisory', aiLimiter, asyncHandler(async (req, res) => {
    const { origin, destination, travelDate, modeOfTravel, weatherConditions, language = 'english' } = req.body;

    const data = {
        origin: sanitizeInput(origin),
        destination: sanitizeInput(destination),
        travelDate: sanitizeInput(travelDate),
        modeOfTravel: sanitizeInput(modeOfTravel),
        weatherConditions: sanitizeInput(weatherConditions),
        language: validateLanguage(language)
    };

    const prompt = `Monsoon travel advisory: From ${data.origin || 'Not specified'} to ${data.destination || 'Not specified'}, Date: ${data.travelDate || 'Upcoming'}, Mode: ${data.modeOfTravel || 'Not specified'}. Include: Safety Assessment, Routes, Weather Impact, Essentials, Contacts, Alternatives, Timing.`;

    const systemPrompt = enhancePrompt(getPrompt('travel'), {}, data.language);

    const response = await getGroqCompletion(systemPrompt, prompt, { max_tokens: 2000 });

    res.json({
        success: true,
        advisory: response,
        route: { origin: data.origin, destination: data.destination },
        timestamp: new Date().toISOString()
    });
}));

/**
 * Health guidance endpoint
 */
app.post('/api/health-guidance', aiLimiter, asyncHandler(async (req, res) => {
    const { symptoms, concernType, ageGroup, existingConditions, language = 'english' } = req.body;

    const data = {
        symptoms: sanitizeInput(symptoms),
        concernType: sanitizeInput(concernType),
        ageGroup: sanitizeInput(ageGroup),
        existingConditions: sanitizeInput(existingConditions),
        language: validateLanguage(language)
    };

    const prompt = `Monsoon health guidance: Concern: ${data.concernType || 'General'}, Symptoms: ${data.symptoms || 'None'}, Age: ${data.ageGroup || 'Adult'}, Conditions: ${data.existingConditions || 'None'}. Include: Assessment, Care, Prevention, When to see doctor, Remedies, Diet, Hygiene.`;

    const systemPrompt = enhancePrompt(getPrompt('health'), {}, data.language);

    const response = await getGroqCompletion(systemPrompt, prompt, { max_tokens: 2000 });

    res.json({
        success: true,
        guidance: response,
        concernType: data.concernType,
        timestamp: new Date().toISOString()
    });
}));

/**
 * Weather alerts endpoint
 */
app.post('/api/weather-alerts', aiLimiter, asyncHandler(async (req, res) => {
    const { location, weatherData, alertLevel, language = 'english' } = req.body;

    const data = {
        location: sanitizeInput(location),
        weatherData: sanitizeObject(weatherData),
        alertLevel: sanitizeInput(alertLevel),
        language: validateLanguage(language)
    };

    const prompt = `Weather analysis: Location: ${data.location || 'Not specified'}, Alert: ${data.alertLevel || 'Normal'}. Provide: Risk Assessment, Actions, 6-Hour Impact, Safety, Activities to Avoid, Improvement Timeline.`;

    const systemPrompt = enhancePrompt(getPrompt('realtime'), {}, data.language);

    const response = await getGroqCompletion(systemPrompt, prompt, {
        temperature: 0.6,
        max_tokens: 1500
    });

    res.json({
        success: true,
        alerts: response,
        location: data.location,
        timestamp: new Date().toISOString()
    });
}));

/**
 * Recovery guidance endpoint
 */
app.post('/api/recovery-guidance', aiLimiter, asyncHandler(async (req, res) => {
    const { damageType, severity, insuranceStatus, location, language = 'english' } = req.body;

    const data = {
        damageType: sanitizeInput(damageType),
        severity: sanitizeInput(severity),
        insuranceStatus: sanitizeInput(insuranceStatus),
        location: sanitizeInput(location),
        language: validateLanguage(language)
    };

    const prompt = `Post-monsoon recovery: Damage: ${data.damageType || 'Water damage'}, Severity: ${data.severity || 'Moderate'}, Insurance: ${data.insuranceStatus || 'Unknown'}. Include: Safety Assessment, Documentation, Repair Priority, Government Relief, Services, Timeline, Costs INR.`;

    const systemPrompt = enhancePrompt(getPrompt('recovery'), {}, data.language);

    const response = await getGroqCompletion(systemPrompt, prompt, { max_tokens: 2500 });

    res.json({
        success: true,
        guidance: response,
        damageType: data.damageType,
        timestamp: new Date().toISOString()
    });
}));

/**
 * Translation endpoint
 */
app.post('/api/translate', aiLimiter, asyncHandler(async (req, res) => {
    const { text, targetLanguage } = req.body;

    if (!text || !targetLanguage) {
        return res.status(400).json({
            error: 'Invalid request',
            message: 'Text and target language are required'
        });
    }

    const sanitizedText = sanitizeInput(text);
    const validatedLang = validateLanguage(targetLanguage);

    const response = await getGroqCompletion(
        getPrompt('multilingual'),
        `Translate to ${validatedLang}: "${sanitizedText}"`,
        { temperature: 0.3, max_tokens: 1500 }
    );

    res.json({
        success: true,
        original: sanitizedText,
        translation: response,
        targetLanguage: validatedLang,
        timestamp: new Date().toISOString()
    });
}));

/**
 * Emergency SOS endpoint
 */
app.post('/api/emergency-sos', emergencyLimiter, asyncHandler(async (req, res) => {
    const data = sanitizeEmergencyData(req.body);

    const prompt = generateEmergencyPrompt(data);
    const systemPrompt = enhancePrompt(getPrompt('emergency'), {}, data.language);

    const response = await getGroqCompletion(systemPrompt, prompt, {
        temperature: 0.5,
        max_tokens: 1500
    });

    res.json({
        success: true,
        instructions: response || 'Call emergency services: NDRF: 9711077372',
        emergencyContacts: {
            NDRF: '9711077372',
            Police: '100',
            Ambulance: '102',
            Fire: '101',
            Disaster: '1078'
        },
        timestamp: new Date().toISOString()
    });
}));

/**
 * Community plan endpoint
 */
app.post('/api/community-plan', aiLimiter, asyncHandler(async (req, res) => {
    const { communityType, population, riskFactors, existingResources, language = 'english' } = req.body;

    const data = {
        communityType: sanitizeInput(communityType),
        population: sanitizeInput(population),
        riskFactors: sanitizeInput(riskFactors),
        existingResources: sanitizeInput(existingResources),
        language: validateLanguage(language)
    };

    const prompt = `Community monsoon plan: Type: ${data.communityType || 'Residential'}, Population: ${data.population || 'Not specified'}, Risks: ${data.riskFactors || 'Standard'}, Resources: ${data.existingResources || 'Not specified'}. Include: Alert System, Volunteer Teams, Evacuation Routes, Resource Pooling, Vulnerable Support, Communication, Supplies, Authority Coordination, Recovery Plan.`;

    const systemPrompt = enhancePrompt(`${getPrompt('preparedness')  } Focus on community-level planning.`, {}, data.language);

    const response = await getGroqCompletion(systemPrompt, prompt, { max_tokens: 3000 });

    res.json({
        success: true,
        plan: response,
        communityType: data.communityType,
        timestamp: new Date().toISOString()
    });
}));

// ============================================
// STATIC ROUTES
// ============================================

/**
 * Serve main page
 */
app.get('/', (_req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
});

// ============================================
// ERROR HANDLING
// ============================================

// Global error handler
app.use(errorHandler);

// 404 handler
app.use(notFoundHandler);

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

/**
 * Handles graceful shutdown of the server
 * @param {string} signal - Signal received
 */
function gracefulShutdown(signal) {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    server.close(() => {
        logger.info('HTTP server closed');
        closeCache();
        logger.info('Cache cleared');
        process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// SERVER START
// ============================================

const server = app.listen(appConfig.port, () => {
    logger.info(`
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║   🌧️  MonsoonShield AI - Server Started                      ║
    ║                                                              ║
    ║   Local:    http://localhost:${appConfig.port}                           ║
    ║   API:      http://localhost:${appConfig.port}/api                       ║
    ║   Health:   http://localhost:${appConfig.port}/api/health                ║
    ║                                                              ║
    ║   Security: ✅ Helmet, Rate Limiting, XSS Protection         ║
    ║   Caching:  ✅ Response caching enabled                       ║
    ║   Logging:  ✅ Winston logger active                          ║
    ║                                                              ║
    ║   Environment: ${appConfig.nodeEnv}                                    ║
    ║   Powered by Groq AI                                         ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    `);
});

export default app;
