import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// System prompts for different features
const SYSTEM_PROMPTS = {
    preparedness: `You are MonsoonShield AI, an expert in monsoon preparedness and disaster management. 
    You help individuals, families, and communities prepare for the monsoon season in India and South Asia.
    
    Your expertise includes:
    - Home preparation (waterproofing, drainage, electrical safety)
    - Emergency kit preparation
    - Document and valuable protection
    - Health and hygiene during monsoons
    - Vehicle and transportation safety
    - Agricultural preparedness
    - Community-level preparedness
    
    Always provide practical, actionable advice. Consider the user's location, family size, and specific concerns.
    Format your response with clear sections and bullet points for easy reading.
    Include estimated costs where applicable (in INR).`,

    emergency: `You are MonsoonShield Emergency AI, specializing in real-time emergency guidance during severe weather events.
    
    Your role:
    - Provide immediate, life-saving instructions
    - Guide evacuation procedures
    - First aid for weather-related injuries
    - Flood safety protocols
    - Lightning safety
    - Landslide awareness
    - Power outage management
    
    Be calm, clear, and concise. Prioritize safety above all else.
    Always recommend contacting emergency services (NDRF: 9711077372, SDMA) for serious situations.`,

    travel: `You are MonsoonShield Travel Advisory AI, helping users navigate monsoon travel challenges.
    
    Your expertise:
    - Road safety during monsoons
    - Flight and train disruption guidance
    - Route planning for safer travel
    - Vehicle preparation for monsoon driving
    - Travel insurance recommendations
    - Destination-specific monsoon information
    - Public transport alternatives
    
    Provide specific, location-aware advice. Include backup plans and emergency contacts.`,

    health: `You are MonsoonShield Health AI, focusing on monsoon-related health concerns.
    
    Your expertise:
    - Waterborne disease prevention (cholera, typhoid, jaundice)
    - Vector-borne disease prevention (dengue, malaria, chikungunya)
    - Food safety during monsoons
    - Skin infections and fungal issues
    - Respiratory problems
    - Mental health during prolonged monsoons
    - Children and elderly care
    
    Provide medically accurate but easy-to-understand advice. Always recommend consulting a doctor for serious symptoms.`,

    multilingual: `You are MonsoonShield Multilingual AI. You can communicate in multiple Indian languages.
    
    Supported languages:
    - Hindi (हिंदी)
    - Tamil (தமிழ்)
    - Telugu (తెలుగు)
    - Bengali (বাংলা)
    - Marathi (मराठी)
    - Gujarati (ગુજરાતી)
    - Kannada (ಕನ್ನಡ)
    - Malayalam (മലയാളം)
    - Punjabi (ਪੰਜਾਬੀ)
    - Odia (ଓଡ଼ିଆ)
    - English
    
    Detect the user's preferred language and respond in that language.
    If asked to translate, provide accurate translations while maintaining the essential safety information.`,

    checklist: `You are MonsoonShield Checklist AI, creating personalized emergency and preparedness checklists.
    
    You create customized checklists based on:
    - Family composition (children, elderly, pets)
    - Living situation (apartment, house, ground floor, upper floor)
    - Location (coastal, hilly, urban, rural)
    - Medical needs
    - Budget constraints
    - Time available for preparation
    
    Format checklists with checkboxes (☐) and organize by category and priority.
    Include shopping lists with estimated costs in INR.`,

    realtime: `You are MonsoonShield Real-time AI, providing weather-aware guidance based on current conditions.
    
    When given weather data, you:
    - Interpret weather alerts and warnings
    - Provide hourly recommendations
    - Suggest activities based on weather windows
    - Alert users to upcoming severe weather
    - Guide timing for outdoor activities
    - Recommend when to stay indoors
    
    Be proactive and specific about timing. Use the 24-hour format for clarity.`,

    recovery: `You are MonsoonShield Recovery AI, helping users recover after monsoon damage.
    
    Your expertise:
    - Damage assessment guidance
    - Insurance claim procedures
    - Government relief schemes (SDRF, NDRF assistance)
    - Home repair prioritization
    - Water damage restoration
    - Mold prevention and removal
    - Document replacement procedures
    - Mental health support resources
    
    Be empathetic while providing practical step-by-step guidance.`
};

// API Endpoints

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'MonsoonShield API' });
});

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, mode = 'preparedness', context = {}, language = 'english' } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.preparedness;
        
        let enhancedPrompt = systemPrompt;
        
        // Add context to system prompt
        if (context.location) {
            enhancedPrompt += `\n\nUser's location: ${context.location}`;
        }
        if (context.familySize) {
            enhancedPrompt += `\nFamily size: ${context.familySize}`;
        }
        if (context.housingType) {
            enhancedPrompt += `\nHousing type: ${context.housingType}`;
        }
        if (context.weatherData) {
            enhancedPrompt += `\nCurrent weather: ${JSON.stringify(context.weatherData)}`;
        }
        if (language !== 'english') {
            enhancedPrompt += `\n\nIMPORTANT: Respond in ${language}. The user prefers communication in ${language}.`;
        }

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: enhancedPrompt },
                { role: 'user', content: message }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 2048,
            top_p: 1,
            stream: false
        });

        const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';

        res.json({
            success: true,
            response,
            mode,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({
            error: 'Failed to process request',
            message: error.message
        });
    }
});

// Personalized preparedness plan endpoint
app.post('/api/preparedness-plan', async (req, res) => {
    try {
        const {
            location,
            familySize,
            hasChildren,
            hasElderly,
            hasPets,
            housingType,
            floor,
            hasBasement,
            budget,
            healthConditions,
            vehicleType,
            language = 'english'
        } = req.body;

        const userContext = `
        Create a comprehensive, personalized monsoon preparedness plan for:
        - Location: ${location || 'Not specified'}
        - Family Size: ${familySize || 'Not specified'}
        - Children in household: ${hasChildren ? 'Yes' : 'No'}
        - Elderly in household: ${hasElderly ? 'Yes' : 'No'}
        - Pets: ${hasPets ? 'Yes' : 'No'}
        - Housing Type: ${housingType || 'Not specified'}
        - Floor Level: ${floor || 'Not specified'}
        - Has Basement: ${hasBasement ? 'Yes' : 'No'}
        - Budget: ₹${budget || 'Flexible'}
        - Health Conditions: ${healthConditions || 'None specified'}
        - Vehicle: ${vehicleType || 'None'}

        Provide a detailed plan with:
        1. Priority Actions (do immediately)
        2. Home Preparation Checklist
        3. Emergency Kit Items with costs
        4. Important Contacts and Resources
        5. Weekly Maintenance Tasks during Monsoon
        6. Emergency Evacuation Plan (if applicable)
        `;

        let systemPrompt = SYSTEM_PROMPTS.preparedness;
        if (language !== 'english') {
            systemPrompt += `\n\nIMPORTANT: Respond in ${language}.`;
        }

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContext }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 3000,
            top_p: 1,
            stream: false
        });

        const plan = completion.choices[0]?.message?.content || 'Unable to generate plan. Please try again.';

        res.json({
            success: true,
            plan,
            generatedFor: { location, familySize, housingType },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Preparedness Plan API Error:', error);
        res.status(500).json({
            error: 'Failed to generate preparedness plan',
            message: error.message
        });
    }
});

// Emergency checklist endpoint
app.post('/api/emergency-checklist', async (req, res) => {
    try {
        const { 
            checklistType = 'general',
            familySize,
            specialNeeds,
            language = 'english'
        } = req.body;

        const checklistPrompt = `
        Generate a detailed ${checklistType} emergency checklist for monsoon season.
        Family size: ${familySize || 'Average family of 4'}
        Special needs: ${specialNeeds || 'None'}
        
        Include:
        1. Essential Items (water, food, medicines)
        2. Documents to Secure
        3. Emergency Contacts
        4. First Aid Supplies
        5. Communication Tools
        6. Shelter Supplies
        7. Personal Items
        
        Format each item with ☐ checkbox, quantity needed, and estimated cost in INR.
        Organize by priority: CRITICAL, HIGH, MEDIUM, LOW
        `;

        let systemPrompt = SYSTEM_PROMPTS.checklist;
        if (language !== 'english') {
            systemPrompt += `\n\nIMPORTANT: Respond in ${language}.`;
        }

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: checklistPrompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.6,
            max_tokens: 2500,
            top_p: 1,
            stream: false
        });

        const checklist = completion.choices[0]?.message?.content || 'Unable to generate checklist.';

        res.json({
            success: true,
            checklist,
            type: checklistType,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Checklist API Error:', error);
        res.status(500).json({
            error: 'Failed to generate checklist',
            message: error.message
        });
    }
});

// Travel advisory endpoint
app.post('/api/travel-advisory', async (req, res) => {
    try {
        const {
            origin,
            destination,
            travelDate,
            modeOfTravel,
            weatherConditions,
            language = 'english'
        } = req.body;

        const travelPrompt = `
        Provide a comprehensive monsoon travel advisory:
        - From: ${origin || 'Not specified'}
        - To: ${destination || 'Not specified'}
        - Date: ${travelDate || 'Upcoming days'}
        - Mode of Travel: ${modeOfTravel || 'Not specified'}
        - Current Weather Conditions: ${weatherConditions || 'Monsoon season'}
        
        Include:
        1. Safety Assessment (Safe/Caution/Avoid)
        2. Route Recommendations
        3. Weather Forecast Impact
        4. Essential Items to Carry
        5. Emergency Contacts for Route
        6. Alternative Routes/Modes
        7. Timing Recommendations
        8. Vehicle Preparation Tips (if applicable)
        `;

        let systemPrompt = SYSTEM_PROMPTS.travel;
        if (language !== 'english') {
            systemPrompt += `\n\nIMPORTANT: Respond in ${language}.`;
        }

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: travelPrompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 2000,
            top_p: 1,
            stream: false
        });

        const advisory = completion.choices[0]?.message?.content || 'Unable to generate travel advisory.';

        res.json({
            success: true,
            advisory,
            route: { origin, destination },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Travel Advisory API Error:', error);
        res.status(500).json({
            error: 'Failed to generate travel advisory',
            message: error.message
        });
    }
});

// Health guidance endpoint
app.post('/api/health-guidance', async (req, res) => {
    try {
        const {
            symptoms,
            concernType,
            ageGroup,
            existingConditions,
            language = 'english'
        } = req.body;

        const healthPrompt = `
        Provide monsoon health guidance for:
        - Concern Type: ${concernType || 'General monsoon health'}
        - Symptoms (if any): ${symptoms || 'None specified'}
        - Age Group: ${ageGroup || 'Adult'}
        - Existing Conditions: ${existingConditions || 'None'}
        
        Include:
        1. Assessment of the concern
        2. Immediate care steps
        3. Prevention measures
        4. When to see a doctor
        5. Home remedies (if applicable)
        6. Dietary recommendations
        7. Hygiene practices
        
        IMPORTANT: Always recommend consulting a healthcare professional for serious symptoms.
        `;

        let systemPrompt = SYSTEM_PROMPTS.health;
        if (language !== 'english') {
            systemPrompt += `\n\nIMPORTANT: Respond in ${language}.`;
        }

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: healthPrompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 2000,
            top_p: 1,
            stream: false
        });

        const guidance = completion.choices[0]?.message?.content || 'Unable to generate health guidance.';

        res.json({
            success: true,
            guidance,
            concernType,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Health Guidance API Error:', error);
        res.status(500).json({
            error: 'Failed to generate health guidance',
            message: error.message
        });
    }
});

// Real-time weather alerts endpoint
app.post('/api/weather-alerts', async (req, res) => {
    try {
        const {
            location,
            weatherData,
            alertLevel,
            language = 'english'
        } = req.body;

        const alertPrompt = `
        Analyze the current weather situation and provide guidance:
        - Location: ${location || 'Not specified'}
        - Weather Data: ${JSON.stringify(weatherData) || 'Not available'}
        - Alert Level: ${alertLevel || 'Normal'}
        
        Provide:
        1. Current Risk Assessment
        2. Immediate Actions Required
        3. Next 6-Hour Forecast Impact
        4. Safety Recommendations
        5. Activities to Avoid
        6. When to Expect Improvement
        `;

        let systemPrompt = SYSTEM_PROMPTS.realtime;
        if (language !== 'english') {
            systemPrompt += `\n\nIMPORTANT: Respond in ${language}.`;
        }

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: alertPrompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.6,
            max_tokens: 1500,
            top_p: 1,
            stream: false
        });

        const alerts = completion.choices[0]?.message?.content || 'Unable to generate weather alerts.';

        res.json({
            success: true,
            alerts,
            location,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Weather Alerts API Error:', error);
        res.status(500).json({
            error: 'Failed to generate weather alerts',
            message: error.message
        });
    }
});

// Post-monsoon recovery guidance endpoint
app.post('/api/recovery-guidance', async (req, res) => {
    try {
        const {
            damageType,
            severity,
            insuranceStatus,
            location,
            language = 'english'
        } = req.body;

        const recoveryPrompt = `
        Provide post-monsoon recovery guidance for:
        - Damage Type: ${damageType || 'General water damage'}
        - Severity: ${severity || 'Moderate'}
        - Insurance Status: ${insuranceStatus || 'Unknown'}
        - Location: ${location || 'Not specified'}
        
        Include:
        1. Immediate Safety Assessment
        2. Documentation Steps for Insurance
        3. Priority Repair Sequence
        4. Government Relief Options
        5. Professional Services Needed
        6. Timeline Expectations
        7. Cost Estimates (INR)
        8. Mental Health Resources
        `;

        let systemPrompt = SYSTEM_PROMPTS.recovery;
        if (language !== 'english') {
            systemPrompt += `\n\nIMPORTANT: Respond in ${language}.`;
        }

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: recoveryPrompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 2500,
            top_p: 1,
            stream: false
        });

        const guidance = completion.choices[0]?.message?.content || 'Unable to generate recovery guidance.';

        res.json({
            success: true,
            guidance,
            damageType,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Recovery Guidance API Error:', error);
        res.status(500).json({
            error: 'Failed to generate recovery guidance',
            message: error.message
        });
    }
});

// Multilingual translation endpoint
app.post('/api/translate', async (req, res) => {
    try {
        const {
            text,
            targetLanguage,
            context = 'monsoon safety'
        } = req.body;

        if (!text || !targetLanguage) {
            return res.status(400).json({ error: 'Text and target language are required' });
        }

        const translatePrompt = `
        Translate the following ${context} information to ${targetLanguage}:
        
        "${text}"
        
        Ensure:
        1. Accurate translation maintaining safety-critical information
        2. Use commonly understood terms
        3. Preserve formatting if present
        4. Add phonetic pronunciation for critical terms if helpful
        `;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: SYSTEM_PROMPTS.multilingual },
                { role: 'user', content: translatePrompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            max_tokens: 1500,
            top_p: 1,
            stream: false
        });

        const translation = completion.choices[0]?.message?.content || 'Unable to translate.';

        res.json({
            success: true,
            original: text,
            translation,
            targetLanguage,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Translation API Error:', error);
        res.status(500).json({
            error: 'Failed to translate',
            message: error.message
        });
    }
});

// Emergency SOS endpoint
app.post('/api/emergency-sos', async (req, res) => {
    try {
        const {
            emergencyType,
            location,
            situation,
            peopleAffected,
            language = 'english'
        } = req.body;

        const sosPrompt = `
        EMERGENCY SITUATION - Provide immediate guidance:
        - Emergency Type: ${emergencyType || 'Monsoon-related emergency'}
        - Location: ${location || 'Unknown'}
        - Situation: ${situation || 'Not described'}
        - People Affected: ${peopleAffected || 'Unknown'}
        
        Provide IMMEDIATE, LIFE-SAVING instructions:
        1. First Priority Actions (next 5 minutes)
        2. Emergency Contacts to Call NOW
        3. What to Avoid
        4. How to Signal for Help
        5. First Aid Steps
        6. Information to Provide to Rescuers
        
        BE CONCISE AND CLEAR - This is an emergency.
        `;

        let systemPrompt = SYSTEM_PROMPTS.emergency;
        if (language !== 'english') {
            systemPrompt += `\n\nIMPORTANT: Respond in ${language}. Be extra clear and simple.`;
        }

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: sosPrompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.5,
            max_tokens: 1500,
            top_p: 1,
            stream: false
        });

        const instructions = completion.choices[0]?.message?.content || 'Call emergency services immediately: NDRF: 9711077372';

        res.json({
            success: true,
            instructions,
            emergencyContacts: {
                NDRF: '9711077372',
                Police: '100',
                Ambulance: '102',
                FireBrigade: '101',
                DisasterManagement: '1078'
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Emergency SOS API Error:', error);
        // Even on error, provide emergency contacts
        res.status(500).json({
            error: 'System error - Please call emergency services directly',
            emergencyContacts: {
                NDRF: '9711077372',
                Police: '100',
                Ambulance: '102',
                FireBrigade: '101',
                DisasterManagement: '1078'
            }
        });
    }
});

// Community preparedness endpoint
app.post('/api/community-plan', async (req, res) => {
    try {
        const {
            communityType,
            population,
            riskFactors,
            existingResources,
            language = 'english'
        } = req.body;

        const communityPrompt = `
        Create a community-level monsoon preparedness plan:
        - Community Type: ${communityType || 'Residential colony'}
        - Approximate Population: ${population || 'Not specified'}
        - Risk Factors: ${riskFactors || 'Standard monsoon risks'}
        - Existing Resources: ${existingResources || 'Not specified'}
        
        Include:
        1. Community Alert System Setup
        2. Volunteer Team Formation
        3. Evacuation Routes and Assembly Points
        4. Resource Pooling Plan
        5. Vulnerable Population Support
        6. Communication Tree
        7. Emergency Supply Storage
        8. Coordination with Local Authorities
        9. Post-Monsoon Community Recovery Plan
        `;

        let systemPrompt = SYSTEM_PROMPTS.preparedness + '\n\nFocus on community-level planning and coordination.';
        if (language !== 'english') {
            systemPrompt += `\n\nIMPORTANT: Respond in ${language}.`;
        }

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: communityPrompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 3000,
            top_p: 1,
            stream: false
        });

        const plan = completion.choices[0]?.message?.content || 'Unable to generate community plan.';

        res.json({
            success: true,
            plan,
            communityType,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Community Plan API Error:', error);
        res.status(500).json({
            error: 'Failed to generate community plan',
            message: error.message
        });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║   🌧️  MonsoonShield AI - Server Started                      ║
    ║                                                              ║
    ║   Local:    http://localhost:${PORT}                           ║
    ║   API:      http://localhost:${PORT}/api                       ║
    ║                                                              ║
    ║   Powered by Groq AI                                         ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    `);
});

export default app;
