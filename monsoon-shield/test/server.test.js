import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';

// Mock the Groq SDK before importing the app
vi.mock('groq-sdk', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            chat: {
                completions: {
                    create: vi.fn().mockResolvedValue({
                        choices: [
                            {
                                message: {
                                    content: 'Mock AI response for testing purposes.'
                                }
                            }
                        ]
                    })
                }
            }
        }))
    };
});

// Mock winston to prevent console spam during tests
vi.mock('winston', () => ({
    createLogger: vi.fn(() => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn()
    })),
    format: {
        combine: vi.fn(),
        timestamp: vi.fn(),
        errors: vi.fn(),
        json: vi.fn(),
        colorize: vi.fn(),
        simple: vi.fn()
    },
    transports: {
        Console: vi.fn()
    }
}));

// Import the app after mocking
let app;

describe('MonsoonShield API Tests', () => {
    beforeAll(async () => {
        // Dynamically import the app after mocks are set up
        const module = await import('../server.js');
        app = module.default;
    });

    describe('Health Check Endpoint', () => {
        it('should return health status with cache info', async () => {
            const response = await request(app).get('/api/health');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'ok');
            expect(response.body).toHaveProperty('service', 'MonsoonShield API');
            expect(response.body).toHaveProperty('version', '1.1.0');
            expect(response.body).toHaveProperty('uptime');
            expect(response.body).toHaveProperty('cache');
        });
    });

    describe('Chat Endpoint - /api/chat', () => {
        it('should return error when message is not provided', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({});
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Invalid request');
            expect(response.body).toHaveProperty('message', 'Message is required');
        });

        it('should return error when message is too short', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({ message: 'A' });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Invalid request');
            expect(response.body).toHaveProperty('message', 'Message too short');
        });

        it('should handle chat request with default mode', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({
                    message: 'How do I prepare my home for monsoon?'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('response');
            expect(response.body).toHaveProperty('mode', 'preparedness');
            expect(response.body).toHaveProperty('timestamp');
        });

        it('should handle chat request with emergency mode', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({
                    message: 'There is flooding in my area!',
                    mode: 'emergency'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('mode', 'emergency');
        });

        it('should handle chat request with context', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({
                    message: 'What should I do?',
                    mode: 'preparedness',
                    context: {
                        location: 'Mumbai',
                        familySize: 4,
                        housingType: 'apartment'
                    }
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        it('should handle chat request with non-english language', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({
                    message: 'मुझे मानसून की तैयारी के बारे में बताएं',
                    mode: 'preparedness',
                    language: 'hindi'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        it('should handle all available chat modes', async () => {
            const modes = ['preparedness', 'emergency', 'travel', 'health', 'multilingual', 'checklist', 'realtime', 'recovery'];
            
            for (const mode of modes) {
                const response = await request(app)
                    .post('/api/chat')
                    .send({
                        message: 'Test message for mode testing',
                        mode
                    });
                
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('mode', mode);
            }
        });

        it('should fallback to preparedness mode for unknown mode', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({
                    message: 'Test message for unknown mode',
                    mode: 'unknown_mode'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('mode', 'preparedness');
        });
    });

    describe('Preparedness Plan Endpoint - /api/preparedness-plan', () => {
        it('should generate a preparedness plan with minimal data', async () => {
            const response = await request(app)
                .post('/api/preparedness-plan')
                .send({});
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('plan');
            expect(response.body).toHaveProperty('timestamp');
        });

        it('should generate a personalized preparedness plan', async () => {
            const response = await request(app)
                .post('/api/preparedness-plan')
                .send({
                    location: 'Chennai',
                    familySize: '5',
                    hasChildren: true,
                    hasElderly: true,
                    hasPets: false,
                    housingType: 'Independent House',
                    floor: 'Ground Floor',
                    hasBasement: false,
                    budget: '15000',
                    healthConditions: 'Diabetes in family',
                    vehicleType: 'Car'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('plan');
            expect(response.body.generatedFor).toHaveProperty('location', 'Chennai');
        });
    });

    describe('Emergency Checklist Endpoint - /api/emergency-checklist', () => {
        it('should generate a general checklist', async () => {
            const response = await request(app)
                .post('/api/emergency-checklist')
                .send({});
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('checklist');
            expect(response.body).toHaveProperty('type', 'general');
        });

        it('should generate a customized checklist', async () => {
            const response = await request(app)
                .post('/api/emergency-checklist')
                .send({
                    checklistType: 'flood',
                    familySize: '6',
                    specialNeeds: 'Infant and elderly wheelchair user'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('type', 'flood');
        });
    });

    describe('Travel Advisory Endpoint - /api/travel-advisory', () => {
        it('should generate travel advisory', async () => {
            const response = await request(app)
                .post('/api/travel-advisory')
                .send({
                    origin: 'Mumbai',
                    destination: 'Pune',
                    travelDate: '2026-07-15',
                    modeOfTravel: 'Car',
                    weatherConditions: 'Heavy rain expected'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('advisory');
            expect(response.body.route).toHaveProperty('origin', 'Mumbai');
            expect(response.body.route).toHaveProperty('destination', 'Pune');
        });
    });

    describe('Health Guidance Endpoint - /api/health-guidance', () => {
        it('should provide health guidance for symptoms', async () => {
            const response = await request(app)
                .post('/api/health-guidance')
                .send({
                    symptoms: 'Fever, body ache, fatigue',
                    concernType: 'dengue prevention',
                    ageGroup: 'Adult',
                    existingConditions: 'None'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('guidance');
            expect(response.body).toHaveProperty('concernType', 'dengue prevention');
        });
    });

    describe('Weather Alerts Endpoint - /api/weather-alerts', () => {
        it('should generate weather alerts with data', async () => {
            const response = await request(app)
                .post('/api/weather-alerts')
                .send({
                    location: 'Delhi',
                    weatherData: {
                        temperature: 28,
                        humidity: 85,
                        rainfall: 45
                    },
                    alertLevel: 'Orange'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('alerts');
            expect(response.body).toHaveProperty('location', 'Delhi');
        });
    });

    describe('Recovery Guidance Endpoint - /api/recovery-guidance', () => {
        it('should provide recovery guidance after flood', async () => {
            const response = await request(app)
                .post('/api/recovery-guidance')
                .send({
                    damageType: 'Flood damage to ground floor',
                    severity: 'Severe',
                    insuranceStatus: 'Has home insurance',
                    location: 'Kerala'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('guidance');
            expect(response.body).toHaveProperty('damageType', 'Flood damage to ground floor');
        });
    });

    describe('Translation Endpoint - /api/translate', () => {
        it('should translate text to target language', async () => {
            const response = await request(app)
                .post('/api/translate')
                .send({
                    text: 'Stay indoors during heavy rain.',
                    targetLanguage: 'hindi',
                    context: 'monsoon safety'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('original');
            expect(response.body).toHaveProperty('translation');
            expect(response.body).toHaveProperty('targetLanguage', 'hindi');
        });

        it('should return error when text is missing', async () => {
            const response = await request(app)
                .post('/api/translate')
                .send({
                    targetLanguage: 'hindi'
                });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Text and target language required');
        });

        it('should return error when target language is missing', async () => {
            const response = await request(app)
                .post('/api/translate')
                .send({
                    text: 'Test text'
                });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Text and target language required');
        });
    });

    describe('Emergency SOS Endpoint - /api/emergency-sos', () => {
        it('should provide emergency SOS response', async () => {
            const response = await request(app)
                .post('/api/emergency-sos')
                .send({
                    emergencyType: 'Flash flood',
                    location: 'Assam',
                    situation: 'Water level rising rapidly in our colony',
                    peopleAffected: '10-15 people'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('instructions');
            expect(response.body).toHaveProperty('emergencyContacts');
            expect(response.body.emergencyContacts).toHaveProperty('NDRF', '9711077372');
            expect(response.body.emergencyContacts).toHaveProperty('Police', '100');
            expect(response.body.emergencyContacts).toHaveProperty('Ambulance', '102');
            expect(response.body.emergencyContacts).toHaveProperty('Fire', '101');
            expect(response.body.emergencyContacts).toHaveProperty('Disaster', '1078');
        });

        it('should provide emergency contacts even with minimal data', async () => {
            const response = await request(app)
                .post('/api/emergency-sos')
                .send({});
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('emergencyContacts');
        });
    });

    describe('Community Plan Endpoint - /api/community-plan', () => {
        it('should generate community plan', async () => {
            const response = await request(app)
                .post('/api/community-plan')
                .send({
                    communityType: 'Residential colony',
                    population: '500 families',
                    riskFactors: 'Low-lying area, near river',
                    existingResources: 'Community hall, water pumps'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('plan');
            expect(response.body).toHaveProperty('communityType', 'Residential colony');
        });
    });

    describe('Static File Serving', () => {
        it('should serve the main page', async () => {
            const response = await request(app).get('/');
            
            expect(response.status).toBe(200);
        });
    });

    describe('Error Handling', () => {
        it('should handle 404 for unknown API routes', async () => {
            const response = await request(app).get('/api/unknown-endpoint');
            
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error', 'Not found');
        });
    });

    describe('Security Features', () => {
        it('should sanitize XSS in input', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({
                    message: 'What about <script>alert("xss")</script> monsoon?'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        it('should handle unicode characters safely', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({
                    message: '🌧️ मानसून 🌊 বর্ষা 🌪️'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        it('should validate language parameter', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({
                    message: 'Test message',
                    language: 'invalid_language'
                });
            
            expect(response.status).toBe(200);
            // Should fallback to english
        });

        it('should return valid timestamp format', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({ message: 'Test message' });
            
            expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });
    });
});
