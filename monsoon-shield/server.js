import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import NodeCache from 'node-cache';
import xss from 'xss';
import winston from 'winston';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================
// LOGGING CONFIGURATION
// ============================================
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'monsoon-shield' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// ============================================
// CONFIGURATION VALIDATION
// ============================================
const requiredEnvVars = ['GROQ_API_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    logger.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
}

// Validate API key format (basic check)
if (process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.startsWith('gsk_')) {
    logger.warn('GROQ_API_KEY does not appear to be in the expected format (should start with gsk_)');
}

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================
// CACHE CONFIGURATION
// ============================================
const cache = new NodeCache({
    stdTTL: 300,
    checkperiod: 60,
    useClones: false
});

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || NODE_ENV === 'development') {
            callback(null, true);
        } else {
            logger.warn(`Blocked CORS request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400
}));

// Rate limiting - General API
const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 30,
    message: { error: 'Too many requests', message: 'Please wait before making more requests', retryAfter: 60 },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json(options.message);
    }
});

// Stricter rate limiting for AI endpoints
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: 'AI rate limit exceeded', message: 'Too many AI requests. Please wait.', retryAfter: 60 },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        logger.warn(`AI rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json(options.message);
    }
});

// Emergency endpoint has more lenient limits
const emergencyLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: {
        error: 'Rate limit exceeded',
        message: 'Please call emergency services directly: NDRF: 9711077372, Police: 100',
        emergencyContacts: { NDRF: '9711077372', Police: '100', Ambulance: '102' }
    }
});

app.use('/api/', generalLimiter);

// Compression
app.use(compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    },
    level: 6
}));

// Body parsing with size limits
app.use(express.json({ limit: '10kb', strict: true }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Static files with caching
app.use(express.static(join(__dirname, 'public'), {
    maxAge: NODE_ENV === 'production' ? '1d' : 0,
    etag: true,
    lastModified: true
}));

// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        logger.info({
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${Date.now() - start}ms`,
            ip: req.ip
        });
    });
    next();
});

// ============================================
// INPUT SANITIZATION
// ============================================
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return xss(input.trim().substring(0, 2000));
};

const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
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
};

const VALID_MODES = ['preparedness', 'emergency', 'travel', 'health', 'multilingual', 'checklist', 'realtime', 'recovery'];
const validateMode = (mode) => VALID_MODES.includes(mode) ? mode : 'preparedness';

const VALID_LANGUAGES = ['english', 'hindi', 'tamil', 'telugu', 'bengali', 'marathi', 'gujarati', 'kannada', 'malayalam', 'punjabi', 'odia'];
const validateLanguage = (lang) => VALID_LANGUAGES.includes(lang?.toLowerCase()) ? lang.toLowerCase() : 'english';

// ============================================
// GROQ CLIENT
// ============================================
let groq;
try {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    logger.info('Groq client initialized successfully');
} catch (error) {
    logger.error('Failed to initialize Groq client:', error);
    process.exit(1);
}

// ============================================
// OPTIMIZED SYSTEM PROMPTS
// ============================================
const SYSTEM_PROMPTS = {
    preparedness: `You are MonsoonShield AI, a monsoon preparedness expert for India/South Asia. Expertise: Home waterproofing, drainage, electrical safety, emergency kits, document protection, health/hygiene, vehicle safety, agricultural prep. Guidelines: Practical advice, clear sections/bullets, costs in INR, consider user context.`,
    
    emergency: `You are MonsoonShield Emergency AI. Role: Life-saving instructions, evacuation, first aid, flood/lightning/landslide safety. Be calm, clear, concise. Prioritize safety. Contacts: NDRF: 9711077372, Police: 100, Ambulance: 102.`,
    
    travel: `You are MonsoonShield Travel Advisory AI. Expertise: Road safety, flight/train disruptions, route planning, vehicle prep. Provide location-aware advice with backup plans and emergency contacts.`,
    
    health: `You are MonsoonShield Health AI. Expertise: Waterborne diseases (cholera, typhoid), vector-borne (dengue, malaria), food safety, skin infections. Medically accurate, easy to understand. Always recommend consulting doctors for serious symptoms.`,
    
    multilingual: `You are MonsoonShield Multilingual AI. Languages: Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, English. Detect user's language and respond accordingly while maintaining safety information.`,
    
    checklist: `You are MonsoonShield Checklist AI. Customize based on: Family, living situation, location, medical needs, budget. Format: ☐ checkboxes, organize by priority, include costs in INR.`,
    
    realtime: `You are MonsoonShield Real-time AI. Role: Interpret weather alerts, hourly recommendations, activity suggestions, severe weather alerts. Be proactive, use 24-hour format.`,
    
    recovery: `You are MonsoonShield Recovery AI. Expertise: Damage assessment, insurance claims, government relief (SDRF/NDRF), repairs, water damage restoration, mold prevention. Be empathetic, provide step-by-step guidance.`
};

// ============================================
// CACHE HELPERS
// ============================================
const generateCacheKey = (endpoint, params) => {
    const sorted = Object.keys(params).sort().map(k => `${k}:${params[k]}`).join('|');
    return `${endpoint}:${sorted}`;
};

const getCachedResponse = (key) => cache.get(key);
const setCachedResponse = (key, value, ttl = 300) => cache.set(key, value, ttl);

// ============================================
// ERROR HANDLER
// ============================================
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ============================================
// API ENDPOINTS
// ============================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'MonsoonShield API',
        version: '1.1.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        cache: { keys: cache.keys().length, hits: cache.getStats().hits, misses: cache.getStats().misses }
    });
});

// Main chat endpoint
app.post('/api/chat', aiLimiter, asyncHandler(async (req, res) => {
    const { message, mode = 'preparedness', context = {}, language = 'english' } = req.body;

    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Invalid request', message: 'Message is required' });
    }

    const sanitizedMessage = sanitizeInput(message);
    const sanitizedContext = sanitizeObject(context);
    const validatedMode = validateMode(mode);
    const validatedLanguage = validateLanguage(language);

    if (sanitizedMessage.length < 2) {
        return res.status(400).json({ error: 'Invalid request', message: 'Message too short' });
    }

    // Check cache
    const cacheKey = generateCacheKey('chat', { msg: sanitizedMessage.substring(0, 50), mode: validatedMode, lang: validatedLanguage });
    if (validatedMode !== 'emergency') {
        const cached = getCachedResponse(cacheKey);
        if (cached) return res.json({ ...cached, cached: true });
    }

    let systemPrompt = SYSTEM_PROMPTS[validatedMode] || SYSTEM_PROMPTS.preparedness;
    if (sanitizedContext.location) systemPrompt += `\nUser location: ${sanitizedContext.location}`;
    if (validatedLanguage !== 'english') systemPrompt += `\nRespond in ${validatedLanguage}.`;

    const completion = await groq.chat.completions.create({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: sanitizedMessage }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 2048
    });

    const response = completion.choices[0]?.message?.content || 'Unable to generate response. Please try again.';
    const result = { success: true, response, mode: validatedMode, timestamp: new Date().toISOString() };

    if (validatedMode !== 'emergency') setCachedResponse(cacheKey, result, 300);
    res.json(result);
}));

// Preparedness plan endpoint
app.post('/api/preparedness-plan', aiLimiter, asyncHandler(async (req, res) => {
    const { location, familySize, hasChildren, hasElderly, hasPets, housingType, floor, hasBasement, budget, healthConditions, vehicleType, language = 'english' } = req.body;

    const data = {
        location: sanitizeInput(location),
        familySize: sanitizeInput(familySize),
        housingType: sanitizeInput(housingType),
        floor: sanitizeInput(floor),
        budget: sanitizeInput(budget),
        healthConditions: sanitizeInput(healthConditions),
        vehicleType: sanitizeInput(vehicleType),
        hasChildren: Boolean(hasChildren),
        hasElderly: Boolean(hasElderly),
        hasPets: Boolean(hasPets),
        hasBasement: Boolean(hasBasement),
        language: validateLanguage(language)
    };

    const prompt = `Create personalized monsoon preparedness plan:
Location: ${data.location || 'Not specified'}, Family: ${data.familySize || 'Not specified'}
Children: ${data.hasChildren ? 'Yes' : 'No'}, Elderly: ${data.hasElderly ? 'Yes' : 'No'}, Pets: ${data.hasPets ? 'Yes' : 'No'}
Housing: ${data.housingType || 'Not specified'}, Floor: ${data.floor || 'Not specified'}
Budget: ₹${data.budget || 'Flexible'}, Health: ${data.healthConditions || 'None'}, Vehicle: ${data.vehicleType || 'None'}
Include: Priority Actions, Home Prep Checklist, Emergency Kit with costs, Contacts, Weekly Tasks, Evacuation Plan.`;

    let systemPrompt = SYSTEM_PROMPTS.preparedness;
    if (data.language !== 'english') systemPrompt += `\nRespond in ${data.language}.`;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 3000
    });

    res.json({
        success: true,
        plan: completion.choices[0]?.message?.content || 'Unable to generate plan.',
        generatedFor: { location: data.location, familySize: data.familySize, housingType: data.housingType },
        timestamp: new Date().toISOString()
    });
}));

// Emergency checklist endpoint
app.post('/api/emergency-checklist', aiLimiter, asyncHandler(async (req, res) => {
    const { checklistType = 'general', familySize, specialNeeds, language = 'english' } = req.body;
    const data = {
        checklistType: sanitizeInput(checklistType),
        familySize: sanitizeInput(familySize),
        specialNeeds: sanitizeInput(specialNeeds),
        language: validateLanguage(language)
    };

    const prompt = `Generate ${data.checklistType} emergency checklist for monsoon. Family: ${data.familySize || '4'}, Needs: ${data.specialNeeds || 'None'}. Include: Essentials, Documents, Contacts, First Aid, Communication, Shelter. Format: ☐ checkbox, quantity, cost INR. Priority: CRITICAL/HIGH/MEDIUM/LOW.`;

    let systemPrompt = SYSTEM_PROMPTS.checklist;
    if (data.language !== 'english') systemPrompt += `\nRespond in ${data.language}.`;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.6,
        max_tokens: 2500
    });

    res.json({
        success: true,
        checklist: completion.choices[0]?.message?.content || 'Unable to generate checklist.',
        type: data.checklistType,
        timestamp: new Date().toISOString()
    });
}));

// Travel advisory endpoint
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

    let systemPrompt = SYSTEM_PROMPTS.travel;
    if (data.language !== 'english') systemPrompt += `\nRespond in ${data.language}.`;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 2000
    });

    res.json({
        success: true,
        advisory: completion.choices[0]?.message?.content || 'Unable to generate advisory.',
        route: { origin: data.origin, destination: data.destination },
        timestamp: new Date().toISOString()
    });
}));

// Health guidance endpoint
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

    let systemPrompt = SYSTEM_PROMPTS.health;
    if (data.language !== 'english') systemPrompt += `\nRespond in ${data.language}.`;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 2000
    });

    res.json({
        success: true,
        guidance: completion.choices[0]?.message?.content || 'Unable to generate guidance.',
        concernType: data.concernType,
        timestamp: new Date().toISOString()
    });
}));

// Weather alerts endpoint
app.post('/api/weather-alerts', aiLimiter, asyncHandler(async (req, res) => {
    const { location, weatherData, alertLevel, language = 'english' } = req.body;
    const data = {
        location: sanitizeInput(location),
        weatherData: sanitizeObject(weatherData),
        alertLevel: sanitizeInput(alertLevel),
        language: validateLanguage(language)
    };

    const prompt = `Weather analysis: Location: ${data.location || 'Not specified'}, Alert: ${data.alertLevel || 'Normal'}. Provide: Risk Assessment, Actions, 6-Hour Impact, Safety, Activities to Avoid, Improvement Timeline.`;

    let systemPrompt = SYSTEM_PROMPTS.realtime;
    if (data.language !== 'english') systemPrompt += `\nRespond in ${data.language}.`;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.6,
        max_tokens: 1500
    });

    res.json({
        success: true,
        alerts: completion.choices[0]?.message?.content || 'Unable to generate alerts.',
        location: data.location,
        timestamp: new Date().toISOString()
    });
}));

// Recovery guidance endpoint
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

    let systemPrompt = SYSTEM_PROMPTS.recovery;
    if (data.language !== 'english') systemPrompt += `\nRespond in ${data.language}.`;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 2500
    });

    res.json({
        success: true,
        guidance: completion.choices[0]?.message?.content || 'Unable to generate guidance.',
        damageType: data.damageType,
        timestamp: new Date().toISOString()
    });
}));

// Translation endpoint
app.post('/api/translate', aiLimiter, asyncHandler(async (req, res) => {
    const { text, targetLanguage, context = 'monsoon safety' } = req.body;
    
    if (!text || !targetLanguage) {
        return res.status(400).json({ error: 'Text and target language required' });
    }

    const sanitizedText = sanitizeInput(text);
    const validatedLang = validateLanguage(targetLanguage);

    const completion = await groq.chat.completions.create({
        messages: [
            { role: 'system', content: SYSTEM_PROMPTS.multilingual },
            { role: 'user', content: `Translate to ${validatedLang}: "${sanitizedText}"` }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 1500
    });

    res.json({
        success: true,
        original: sanitizedText,
        translation: completion.choices[0]?.message?.content || 'Unable to translate.',
        targetLanguage: validatedLang,
        timestamp: new Date().toISOString()
    });
}));

// Emergency SOS endpoint
app.post('/api/emergency-sos', emergencyLimiter, asyncHandler(async (req, res) => {
    const { emergencyType, location, situation, peopleAffected, language = 'english' } = req.body;
    const data = {
        emergencyType: sanitizeInput(emergencyType),
        location: sanitizeInput(location),
        situation: sanitizeInput(situation),
        peopleAffected: sanitizeInput(peopleAffected),
        language: validateLanguage(language)
    };

    const prompt = `EMERGENCY: ${data.emergencyType || 'Monsoon emergency'}, Location: ${data.location || 'Unknown'}, Situation: ${data.situation || 'Not described'}, People: ${data.peopleAffected || 'Unknown'}. Provide IMMEDIATE life-saving instructions: Priority Actions (5 min), Emergency Contacts NOW, What to Avoid, How to Signal Help, First Aid, Info for Rescuers.`;

    let systemPrompt = SYSTEM_PROMPTS.emergency;
    if (data.language !== 'english') systemPrompt += `\nRespond in ${data.language}. Be extra clear.`;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.5,
        max_tokens: 1500
    });

    res.json({
        success: true,
        instructions: completion.choices[0]?.message?.content || 'Call emergency services: NDRF: 9711077372',
        emergencyContacts: { NDRF: '9711077372', Police: '100', Ambulance: '102', Fire: '101', Disaster: '1078' },
        timestamp: new Date().toISOString()
    });
}));

// Community plan endpoint
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

    let systemPrompt = SYSTEM_PROMPTS.preparedness + ' Focus on community-level planning.';
    if (data.language !== 'english') systemPrompt += `\nRespond in ${data.language}.`;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 3000
    });

    res.json({
        success: true,
        plan: completion.choices[0]?.message?.content || 'Unable to generate plan.',
        communityType: data.communityType,
        timestamp: new Date().toISOString()
    });
}));

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found', message: 'The requested resource was not found' });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);
    server.close(() => {
        logger.info('HTTP server closed');
        cache.close();
        logger.info('Cache cleared');
        process.exit(0);
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const server = app.listen(PORT, () => {
    logger.info(`
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║   🌧️  MonsoonShield AI - Server Started                      ║
    ║                                                              ║
    ║   Local:    http://localhost:${PORT}                           ║
    ║   API:      http://localhost:${PORT}/api                       ║
    ║   Health:   http://localhost:${PORT}/api/health                ║
    ║                                                              ║
    ║   Security: ✅ Helmet, Rate Limiting, XSS Protection         ║
    ║   Caching:  ✅ Response caching enabled                       ║
    ║   Logging:  ✅ Winston logger active                          ║
    ║                                                              ║
    ║   Environment: ${NODE_ENV}                                    ║
    ║   Powered by Groq AI                                         ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    `);
});

export default app;
