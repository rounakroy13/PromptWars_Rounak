import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

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

// Import the app after mocking
let app;

describe('MonsoonShield API Tests', () => {
    beforeAll(async () => {
        // Dynamically import the app after mocks are set up
        const module = await import('../server.js');
        app = module.default;
    });

    describe('Health Check Endpoint', () => {
        it('should return health status', async () => {
            const response = await request(app).get('/api/health');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'ok');
            expect(response.body).toHaveProperty('service', 'MonsoonShield API');
        });
    });

    describe('Chat Endpoint - /api/chat', () => {
        it('should return error when message is not provided', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({});
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Message is required');
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
                        message: 'Test message',
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
                    message: 'Test message',
                    mode: 'unknown_mode'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        it('should include weather data in context', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({
                    message: 'What should I do today?',
                    mode: 'realtime',
                    context: {
                        weatherData: {
                            temperature: 28,
                            humidity: 90,
                            rainfall: 50
                        }
                    }
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
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
                    familySize: 5,
                    hasChildren: true,
                    hasElderly: true,
                    hasPets: false,
                    housingType: 'Independent House',
                    floor: 'Ground Floor',
                    hasBasement: false,
                    budget: 15000,
                    healthConditions: 'Diabetes in family',
                    vehicleType: 'Car'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('plan');
            expect(response.body.generatedFor).toHaveProperty('location', 'Chennai');
            expect(response.body.generatedFor).toHaveProperty('familySize', 5);
        });

        it('should generate preparedness plan in regional language', async () => {
            const response = await request(app)
                .post('/api/preparedness-plan')
                .send({
                    location: 'Kolkata',
                    language: 'bengali'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        it('should handle plan for family with pets', async () => {
            const response = await request(app)
                .post('/api/preparedness-plan')
                .send({
                    location: 'Hyderabad',
                    familySize: 3,
                    hasPets: true
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
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
                    familySize: 6,
                    specialNeeds: 'Infant and elderly wheelchair user'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('type', 'flood');
        });

        it('should generate checklist in regional language', async () => {
            const response = await request(app)
                .post('/api/emergency-checklist')
                .send({
                    checklistType: 'evacuation',
                    language: 'marathi'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
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

        it('should handle travel advisory with minimal data', async () => {
            const response = await request(app)
                .post('/api/travel-advisory')
                .send({});
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        it('should handle train travel advisory', async () => {
            const response = await request(app)
                .post('/api/travel-advisory')
                .send({
                    origin: 'Delhi',
                    destination: 'Agra',
                    modeOfTravel: 'Train'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        it('should handle flight travel advisory', async () => {
            const response = await request(app)
                .post('/api/travel-advisory')
                .send({
                    origin: 'Bangalore',
                    destination: 'Goa',
                    modeOfTravel: 'Flight',
                    weatherConditions: 'Cyclone warning'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
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

        it('should provide health guidance for children', async () => {
            const response = await request(app)
                .post('/api/health-guidance')
                .send({
                    concernType: 'waterborne diseases',
                    ageGroup: 'Child (5-12 years)'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        it('should provide health guidance in regional language', async () => {
            const response = await request(app)
                .post('/api/health-guidance')
                .send({
                    concernType: 'malaria prevention',
                    language: 'tamil'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        it('should provide health guidance for elderly', async () => {
            const response = await request(app)
                .post('/api/health-guidance')
                .send({
                    concernType: 'respiratory issues',
                    ageGroup: 'Elderly (65+)',
                    existingConditions: 'Asthma, hypertension'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        it('should handle health guidance with minimal data', async () => {
            const response = await request(app)
                .post('/api/health-guidance')
                .send({});
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
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
                        rainfall: 45,
                        windSpeed: 25
                    },
                    alertLevel: 'Orange'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('alerts');
            expect(response.body).toHaveProperty('location', 'Delhi');
        });

        it('should handle weather alerts with minimal data', async () => {
            const response = await request(app)
                .post('/api/weather-alerts')
                .send({
                    location: 'Bangalore'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        it('should handle red alert level', async () => {
            const response = await request(app)
                .post('/api/weather-alerts')
                .send({
                    location: 'Uttarakhand',
                    alertLevel: 'Red',
                    weatherData: {
                        rainfall: 150,
                        windSpeed: 60
                    }
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        it('should handle weather alerts in regional language', async () => {
            const response = await request(app)
                .post('/api/weather-alerts')
                .send({
                    location: 'Ahmedabad',
                    language: 'gujarati'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
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

        it('should provide recovery guidance with minimal data', async () => {
            const response = await request(app)
                .post('/api/recovery-guidance')
                .send({});
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        it('should provide recovery guidance in regional language', async () => {
            const response = await request(app)
                .post('/api/recovery-guidance')
                .send({
                    damageType: 'Roof damage',
                    severity: 'Moderate',
                    language: 'kannada'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        it('should handle recovery for uninsured property', async () => {
            const response = await request(app)
                .post('/api/recovery-guidance')
                .send({
                    damageType: 'Complete house damage',
                    severity: 'Severe',
                    insuranceStatus: 'No insurance',
                    location: 'Bihar'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });
    });

    describe('Translation Endpoint - /api/translate', () => {
        it('should translate text to target language', async () => {
            const response = await request(app)
                .post('/api/translate')
                .send({
                    text: 'Stay indoors during heavy rain. Keep emergency supplies ready.',
                    targetLanguage: 'Hindi',
                    context: 'monsoon safety'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('original');
            expect(response.body).toHaveProperty('translation');
            expect(response.body).toHaveProperty('targetLanguage', 'Hindi');
        });

        it('should return error when text is missing', async () => {
            const response = await request(app)
                .post('/api/translate')
                .send({
                    targetLanguage: 'Hindi'
                });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Text and target language are required');
        });

        it('should return error when target language is missing', async () => {
            const response = await request(app)
                .post('/api/translate')
                .send({
                    text: 'Test text'
                });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Text and target language are required');
        });

        it('should translate to multiple regional languages', async () => {
            const languages = ['Tamil', 'Telugu', 'Bengali', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Odia'];
            
            for (const lang of languages) {
                const response = await request(app)
                    .post('/api/translate')
                    .send({
                        text: 'Boil water before drinking during monsoon.',
                        targetLanguage: lang
                    });
                
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('success', true);
                expect(response.body).toHaveProperty('targetLanguage', lang);
            }
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
            expect(response.body.emergencyContacts).toHaveProperty('FireBrigade', '101');
            expect(response.body.emergencyContacts).toHaveProperty('DisasterManagement', '1078');
        });

        it('should provide emergency contacts even with minimal data', async () => {
            const response = await request(app)
                .post('/api/emergency-sos')
                .send({});
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('emergencyContacts');
        });

        it('should support regional language in emergency', async () => {
            const response = await request(app)
                .post('/api/emergency-sos')
                .send({
                    emergencyType: 'Landslide warning',
                    language: 'malayalam'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('emergencyContacts');
        });

        it('should handle different emergency types', async () => {
            const emergencyTypes = ['Flash flood', 'Landslide', 'Lightning strike', 'Building collapse', 'Stranded in flood water'];
            
            for (const emergencyType of emergencyTypes) {
                const response = await request(app)
                    .post('/api/emergency-sos')
                    .send({
                        emergencyType,
                        location: 'Test Location'
                    });
                
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('emergencyContacts');
            }
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

        it('should generate community plan with minimal data', async () => {
            const response = await request(app)
                .post('/api/community-plan')
                .send({});
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        it('should handle different community types', async () => {
            const communityTypes = ['Slum area', 'High-rise apartments', 'Rural village', 'Industrial area', 'Coastal community'];
            
            for (const communityType of communityTypes) {
                const response = await request(app)
                    .post('/api/community-plan')
                    .send({
                        communityType
                    });
                
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('success', true);
            }
        });

        it('should generate community plan in regional language', async () => {
            const response = await request(app)
                .post('/api/community-plan')
                .send({
                    communityType: 'Village',
                    population: '200 families',
                    language: 'odia'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
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
        });
    });
});

// Additional unit tests for utility functions and edge cases
describe('Edge Cases and Input Validation', () => {
    let app;

    beforeAll(async () => {
        const module = await import('../server.js');
        app = module.default;
    });

    describe('Input Sanitization', () => {
        it('should handle very long messages', async () => {
            const longMessage = 'A'.repeat(5000);
            const response = await request(app)
                .post('/api/chat')
                .send({
                    message: longMessage
                });
            
            expect(response.status).toBe(200);
        });

        it('should handle special characters in input', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({
                    message: 'What about <script>alert("xss")</script> monsoon?'
                });
            
            expect(response.status).toBe(200);
        });

        it('should handle unicode characters', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({
                    message: '🌧️ मानसून 🌊 বর্ষা 🌪️'
                });
            
            expect(response.status).toBe(200);
        });

        it('should handle empty strings in optional fields', async () => {
            const response = await request(app)
                .post('/api/preparedness-plan')
                .send({
                    location: '',
                    familySize: '',
                    housingType: ''
                });
            
            expect(response.status).toBe(200);
        });

        it('should handle null values in optional fields', async () => {
            const response = await request(app)
                .post('/api/preparedness-plan')
                .send({
                    location: null,
                    familySize: null
                });
            
            expect(response.status).toBe(200);
        });
    });

    describe('Content Type Handling', () => {
        it('should handle JSON content type', async () => {
            const response = await request(app)
                .post('/api/chat')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({ message: 'Test' }));
            
            expect(response.status).toBe(200);
        });
    });

    describe('Response Format Validation', () => {
        it('should return valid timestamp format', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({ message: 'Test' });
            
            expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });

        it('should return consistent response structure for chat', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({ message: 'Test' });
            
            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('response');
            expect(response.body).toHaveProperty('mode');
            expect(response.body).toHaveProperty('timestamp');
        });

        it('should return emergency contacts in SOS response', async () => {
            const response = await request(app)
                .post('/api/emergency-sos')
                .send({});
            
            const contacts = response.body.emergencyContacts;
            expect(Object.keys(contacts).length).toBeGreaterThan(0);
        });
    });
});
