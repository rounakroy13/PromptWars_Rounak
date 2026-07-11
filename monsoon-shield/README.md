# 🌧️ MonsoonShield AI

**GenAI-powered Monsoon Preparedness & Citizen Assistance Platform**

MonsoonShield AI is a comprehensive solution that helps individuals, families, and communities prepare for the monsoon season using Generative AI powered by Groq. It provides personalized preparedness plans, weather-aware guidance, emergency checklists, travel advisories, safety recommendations, multilingual assistance, and real-time alerts before, during, and after severe weather events.

![MonsoonShield AI](https://img.shields.io/badge/Powered%20by-Groq%20AI-blue)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![License](https://img.shields.io/badge/License-MIT-yellow)
![WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-brightgreen)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

## 🎯 Features

### 1. **Personalized Preparedness Plans**
- Custom plans based on family size, housing type, location
- Budget-conscious recommendations with cost estimates in INR
- Special considerations for children, elderly, and pets

### 2. **Emergency Guidance**
- Real-time emergency instructions for floods, lightning, landslides
- SOS feature with one-tap access to emergency contacts
- Step-by-step first aid and evacuation procedures

### 3. **Emergency Checklists**
- Customized checklists based on family needs
- Shopping lists with estimated costs
- Priority-based organization (Critical, High, Medium, Low)

### 4. **Travel Advisory**
- Route safety assessments
- Mode-specific recommendations (road, rail, air)
- Alternative route suggestions
- Vehicle preparation tips

### 5. **Health Guide**
- Disease prevention (dengue, malaria, cholera, typhoid)
- Food and water safety tips
- Mental health support during prolonged monsoons
- Child and elderly care recommendations

### 6. **Weather Alerts**
- Real-time weather-aware guidance
- Activity recommendations based on conditions
- Timing suggestions for outdoor activities

### 7. **Recovery Help**
- Post-monsoon damage assessment guidance
- Insurance claim procedures
- Government relief scheme information
- Home repair prioritization

### 8. **Multilingual Support**
- 11 Indian languages supported:
  - English, Hindi, Tamil, Telugu, Bengali
  - Marathi, Gujarati, Kannada, Malayalam
  - Punjabi, Odia

### 9. **Community Preparedness**
- Community-level planning tools
- Volunteer coordination guides
- Resource pooling strategies
- Evacuation route planning

### 10. **Accessibility (WCAG 2.1 AA Compliant)**
- Screen reader support with ARIA labels
- Keyboard navigation
- Skip navigation links
- Focus management for modals
- Reduced motion preferences
- High contrast mode support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Groq API key ([Get one here](https://console.groq.com))

### Installation

1. **Clone the repository**
   ```bash
   cd PromptWars_Rounak/monsoon-shield
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your Groq API key
   ```

4. **Start the server**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🚂 Deploy to Railway

### One-Click Deployment

1. Click the "Deploy on Railway" button above
2. Connect your GitHub account
3. Add the environment variable `GROQ_API_KEY`
4. Deploy!

### Manual Deployment

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   cd PromptWars_Rounak/monsoon-shield
   railway init
   ```

4. **Add Environment Variables**
   ```bash
   railway variables set GROQ_API_KEY=your_groq_api_key_here
   ```

5. **Deploy**
   ```bash
   railway up
   ```

6. **Get your deployment URL**
   ```bash
   railway domain
   ```

### Railway Configuration Files

The project includes these Railway-specific files:
- `railway.json` - Railway deployment configuration
- `Procfile` - Process file for Railway
- `nixpacks.toml` - Nixpacks build configuration

### Required Environment Variables on Railway

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Your Groq API key | Yes |
| `PORT` | Automatically set by Railway | Auto |
| `NODE_ENV` | Set to `production` | Auto |

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Your Groq API key | Yes |
| `PORT` | Server port (default: 3000) | No |
| `OPENWEATHER_API_KEY` | For real-time weather data | No |

## 📡 API Endpoints

### Chat Endpoint
```
POST /api/chat
```
Main conversational endpoint for all queries.

**Request Body:**
```json
{
  "message": "How should I prepare my home for monsoon?",
  "mode": "preparedness",
  "context": {
    "location": "Mumbai",
    "familySize": "4"
  },
  "language": "english"
}
```

### Health Check
```
GET /api/health
```
Returns service health status.

### Personalized Plan
```
POST /api/preparedness-plan
```
Generates a comprehensive personalized monsoon preparedness plan.

### Emergency SOS
```
POST /api/emergency-sos
```
Provides immediate emergency guidance with emergency contacts.

### Emergency Checklist
```
POST /api/emergency-checklist
```
Generates customized emergency checklists.

### Travel Advisory
```
POST /api/travel-advisory
```
Provides travel safety guidance during monsoon.

### Health Guidance
```
POST /api/health-guidance
```
Monsoon health tips and disease prevention.

### Weather Alerts
```
POST /api/weather-alerts
```
Real-time weather-aware guidance.

### Recovery Guidance
```
POST /api/recovery-guidance
```
Post-monsoon damage recovery help.

### Translation
```
POST /api/translate
```
Translates content to supported Indian languages.

### Community Plan
```
POST /api/community-plan
```
Community-level preparedness planning.

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

## 🏗️ Project Structure

```
monsoon-shield/
├── server.js           # Express server with all API endpoints
├── package.json        # Project dependencies
├── .env.example        # Environment variables template
├── .gitignore          # Git ignore rules
├── README.md           # Project documentation
├── railway.json        # Railway deployment config
├── Procfile            # Process file for deployment
├── nixpacks.toml       # Nixpacks build config
├── vitest.config.js    # Test configuration
├── test/
│   ├── server.test.js  # API test cases
│   └── setup.js        # Test setup
└── public/
    ├── index.html      # Main HTML page (WCAG 2.1 AA)
    ├── styles.css      # CSS styles with accessibility
    └── app.js          # Frontend JavaScript with a11y
```

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **AI**: Groq (Llama 3.3 70B Versatile)
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Styling**: Custom CSS with dark theme
- **Icons**: Font Awesome 6
- **Testing**: Vitest, Supertest
- **Deployment**: Railway

## ♿ Accessibility Features

- **Skip Navigation**: Skip to main content link
- **ARIA Roles**: Proper semantic roles (banner, main, navigation)
- **Focus Management**: Modal focus trapping and restoration
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Live region announcements
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **High Contrast**: Supports `prefers-contrast: high`
- **Keyboard Shortcuts**: `/` to focus chat, `Escape` to close modals

## 📱 Features Breakdown

### Modes Available

| Mode | Description | Use Case |
|------|-------------|----------|
| `preparedness` | General preparation guidance | Before monsoon season |
| `emergency` | Real-time emergency help | During emergencies |
| `checklist` | Generate checklists | Planning phase |
| `travel` | Travel safety | Planning trips |
| `health` | Health guidance | Disease prevention |
| `realtime` | Weather-based guidance | Daily planning |
| `recovery` | Post-damage help | After monsoon damage |

### Emergency Contacts (India)

| Service | Number |
|---------|--------|
| NDRF | 9711077372 |
| Police | 100 |
| Ambulance | 102 |
| Fire | 101 |
| Disaster Management | 1078 |

## 🌐 Supported Languages

1. English
2. हिंदी (Hindi)
3. தமிழ் (Tamil)
4. తెలుగు (Telugu)
5. বাংলা (Bengali)
6. मराठी (Marathi)
7. ગુજરાતી (Gujarati)
8. ಕನ್ನಡ (Kannada)
9. മലയാളം (Malayalam)
10. ਪੰਜਾਬੀ (Punjabi)
11. ଓଡ଼ିଆ (Odia)

## 🔒 Security Considerations

- API keys are stored in environment variables
- No sensitive data is stored on the client side
- Context data stored in localStorage can be cleared by users
- CORS enabled for API security

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue in the repository.

---

**Built with ❤️ for Monsoon Safety by Rounak**

*Powered by Groq GenAI*