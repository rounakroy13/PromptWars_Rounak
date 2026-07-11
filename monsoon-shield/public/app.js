// MonsoonShield AI - Frontend Application
// WCAG 2.1 AA Compliant - CSP Safe (No inline event handlers)

// Global State
let currentMode = 'preparedness';
let userContext = {};
let selectedLanguage = 'english';
let isLoading = false;
let lastFocusedElement = null;

// Mode configurations
const MODE_CONFIG = {
    preparedness: {
        title: 'Preparedness Assistant',
        description: 'Get personalized monsoon preparedness guidance',
        icon: 'fa-shield-alt'
    },
    emergency: {
        title: 'Emergency Help',
        description: 'Immediate guidance for monsoon emergencies',
        icon: 'fa-first-aid'
    },
    checklist: {
        title: 'Emergency Checklists',
        description: 'Generate customized preparedness checklists',
        icon: 'fa-tasks'
    },
    travel: {
        title: 'Travel Advisory',
        description: 'Safe travel guidance during monsoon season',
        icon: 'fa-route'
    },
    health: {
        title: 'Health Guide',
        description: 'Monsoon health tips and disease prevention',
        icon: 'fa-heartbeat'
    },
    realtime: {
        title: 'Weather Alerts',
        description: 'Real-time weather guidance and alerts',
        icon: 'fa-cloud-sun-rain'
    },
    recovery: {
        title: 'Recovery Help',
        description: 'Post-monsoon damage recovery guidance',
        icon: 'fa-tools'
    }
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    loadSavedContext();
    initializeEventListeners();
    autoResizeTextarea();
    initVoiceRecognition();
    initAccessibility();
});

// Event Listeners - All attached programmatically (CSP compliant)
function initializeEventListeners() {
    // Language selector
    const langSelect = document.getElementById('language-select');
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            selectedLanguage = e.target.value;
            localStorage.setItem('monsoonshield-language', selectedLanguage);
            if (recognition) {
                recognition.lang = getVoiceLanguage();
            }
        });
        // Load saved language
        const savedLanguage = localStorage.getItem('monsoonshield-language');
        if (savedLanguage) {
            selectedLanguage = savedLanguage;
            langSelect.value = savedLanguage;
        }
    }

    // Chat input
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('input', autoResizeTextarea);
        chatInput.addEventListener('keydown', handleKeyDown);
    }

    // Send button
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    // Voice button
    const voiceBtn = document.getElementById('voice-btn');
    if (voiceBtn) {
        voiceBtn.addEventListener('click', toggleVoiceInput);
    }

    // Stop voice button
    const stopVoiceBtn = document.getElementById('stop-voice-btn');
    if (stopVoiceBtn) {
        stopVoiceBtn.addEventListener('click', stopVoiceInput);
    }

    // SOS button in header
    const sosBtnHeader = document.getElementById('sos-btn-header');
    if (sosBtnHeader) {
        sosBtnHeader.addEventListener('click', openSOSModal);
    }

    // SOS close button
    const sosCloseBtn = document.getElementById('sos-close-btn');
    if (sosCloseBtn) {
        sosCloseBtn.addEventListener('click', closeSOSModal);
    }

    // SOS form
    const sosForm = document.getElementById('sos-form');
    if (sosForm) {
        sosForm.addEventListener('submit', (e) => {
            e.preventDefault();
            getEmergencyHelp();
        });
    }

    // Context settings button
    const contextSettingsBtn = document.getElementById('context-settings-btn');
    if (contextSettingsBtn) {
        contextSettingsBtn.addEventListener('click', openContextModal);
    }

    // Context close button
    const contextCloseBtn = document.getElementById('context-close-btn');
    if (contextCloseBtn) {
        contextCloseBtn.addEventListener('click', closeContextModal);
    }

    // Context form
    const contextForm = document.getElementById('context-form');
    if (contextForm) {
        contextForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveContext();
        });
    }

    // My Plan button
    const myPlanBtn = document.getElementById('my-plan-btn');
    if (myPlanBtn) {
        myPlanBtn.addEventListener('click', openPersonalizedPlan);
    }

    // Plan close button
    const planCloseBtn = document.getElementById('plan-close-btn');
    if (planCloseBtn) {
        planCloseBtn.addEventListener('click', closePlanModal);
    }

    // Plan form
    const planForm = document.getElementById('plan-form');
    if (planForm) {
        planForm.addEventListener('submit', (e) => {
            e.preventDefault();
            generatePersonalizedPlan();
        });
    }

    // Community button
    const communityBtn = document.getElementById('community-btn');
    if (communityBtn) {
        communityBtn.addEventListener('click', openCommunityPlan);
    }

    // Community close button
    const communityCloseBtn = document.getElementById('community-close-btn');
    if (communityCloseBtn) {
        communityCloseBtn.addEventListener('click', closeCommunityModal);
    }

    // Community form
    const communityForm = document.getElementById('community-form');
    if (communityForm) {
        communityForm.addEventListener('submit', (e) => {
            e.preventDefault();
            generateCommunityPlan();
        });
    }

    // Navigation buttons (mode switching)
    document.querySelectorAll('.nav-btn[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            if (mode) {
                setMode(mode);
            }
        });
    });

    // Feature cards (quick prompts)
    document.querySelectorAll('.feature-card[data-prompt]').forEach(card => {
        card.addEventListener('click', () => {
            const prompt = card.dataset.prompt;
            if (prompt) {
                quickPrompt(prompt);
            }
        });
    });

    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape to close modals
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
        // / key to focus chat input
        if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
            e.preventDefault();
            document.getElementById('chat-input').focus();
            announceToScreenReader('Chat input focused. Type your message.');
        }
    });
}

// Auto-resize textarea
function autoResizeTextarea() {
    const textarea = document.getElementById('chat-input');
    if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
}

// Handle keyboard events
function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Set current mode
function setMode(mode) {
    currentMode = mode;
    
    // Update navigation buttons
    document.querySelectorAll('.nav-btn[data-mode]').forEach(btn => {
        const isActive = btn.dataset.mode === mode;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    // Update mode header
    const config = MODE_CONFIG[mode];
    if (config) {
        document.getElementById('mode-title').textContent = config.title;
        document.getElementById('mode-description').textContent = config.description;
        
        const modeIcon = document.querySelector('.mode-icon');
        if (modeIcon) {
            modeIcon.className = `fas ${config.icon} mode-icon`;
        }

        // Clear chat and show relevant welcome message
        clearChat();
        
        // Announce mode change
        announceToScreenReader(`Switched to ${config.title} mode. ${config.description}`);
    }
}

// Clear chat messages
function clearChat() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    chatMessages.innerHTML = `
        <div class="welcome-message" role="region" aria-label="Welcome information">
            <div class="welcome-icon" aria-hidden="true">
                <i class="fas ${MODE_CONFIG[currentMode].icon}"></i>
            </div>
            <h2>${MODE_CONFIG[currentMode].title}</h2>
            <p>${MODE_CONFIG[currentMode].description}</p>
            <div class="feature-cards" role="list" aria-label="Quick action cards">
                ${getQuickPromptsForMode(currentMode)}
            </div>
        </div>
    `;
    
    // Re-attach event listeners to new feature cards
    chatMessages.querySelectorAll('.feature-card[data-prompt]').forEach(card => {
        card.addEventListener('click', () => {
            const prompt = card.dataset.prompt;
            if (prompt) {
                quickPrompt(prompt);
            }
        });
    });
}

// Get quick prompts based on mode
function getQuickPromptsForMode(mode) {
    const prompts = {
        preparedness: [
            { icon: 'fa-home', text: 'Home Preparation', prompt: 'How should I prepare my home for monsoon?' },
            { icon: 'fa-box-open', text: 'Emergency Kit', prompt: 'Create an emergency kit checklist for my family' },
            { icon: 'fa-water', text: 'Flood Prevention', prompt: 'How can I protect my home from flooding?' },
            { icon: 'fa-bolt', text: 'Electrical Safety', prompt: 'Electrical safety tips for monsoon season' }
        ],
        emergency: [
            { icon: 'fa-house-flood-water', text: 'Flooding', prompt: 'My area is flooding, what should I do immediately?' },
            { icon: 'fa-bolt', text: 'Lightning', prompt: 'How to stay safe during a lightning storm?' },
            { icon: 'fa-car', text: 'Stranded', prompt: 'I am stranded in my car during heavy rain' },
            { icon: 'fa-plug', text: 'Power Outage', prompt: 'Extended power outage during monsoon - what to do?' }
        ],
        checklist: [
            { icon: 'fa-medkit', text: 'First Aid Kit', prompt: 'Create a monsoon first aid kit checklist' },
            { icon: 'fa-file-alt', text: 'Documents', prompt: 'Important documents checklist to protect' },
            { icon: 'fa-utensils', text: 'Food & Water', prompt: 'Emergency food and water storage checklist' },
            { icon: 'fa-toolbox', text: 'Tools', prompt: 'Essential tools checklist for monsoon emergencies' }
        ],
        travel: [
            { icon: 'fa-car', text: 'Road Travel', prompt: 'Is it safe to travel by road during heavy rain?' },
            { icon: 'fa-plane', text: 'Flight Status', prompt: 'Tips for dealing with flight delays during monsoon' },
            { icon: 'fa-train', text: 'Train Travel', prompt: 'Train travel safety during monsoon season' },
            { icon: 'fa-motorcycle', text: 'Two Wheeler', prompt: 'Two-wheeler safety tips for monsoon riding' }
        ],
        health: [
            { icon: 'fa-virus', text: 'Diseases', prompt: 'Common monsoon diseases and prevention' },
            { icon: 'fa-apple-whole', text: 'Food Safety', prompt: 'Food safety tips during monsoon' },
            { icon: 'fa-mosquito', text: 'Mosquitoes', prompt: 'How to prevent dengue and malaria during monsoon?' },
            { icon: 'fa-baby', text: 'Child Care', prompt: 'Keeping children healthy during monsoon' }
        ],
        realtime: [
            { icon: 'fa-cloud-rain', text: 'Current Weather', prompt: 'What precautions should I take for todays weather?' },
            { icon: 'fa-umbrella', text: 'Going Out', prompt: 'Is it safe to go out today?' },
            { icon: 'fa-calendar', text: 'Week Ahead', prompt: 'What should I prepare for this weeks weather?' },
            { icon: 'fa-exclamation-triangle', text: 'Warnings', prompt: 'Are there any weather warnings for my area?' }
        ],
        recovery: [
            { icon: 'fa-house-crack', text: 'Damage Assessment', prompt: 'How to assess water damage in my home?' },
            { icon: 'fa-file-invoice-dollar', text: 'Insurance', prompt: 'How to file insurance claim for flood damage?' },
            { icon: 'fa-broom', text: 'Cleanup', prompt: 'Post-flood cleanup and sanitization steps' },
            { icon: 'fa-hand-holding-heart', text: 'Relief', prompt: 'How to apply for government disaster relief?' }
        ]
    };

    const modePrompts = prompts[mode] || prompts.preparedness;
    return modePrompts.map(p => `
        <button class="feature-card" data-prompt="${p.prompt.replace(/"/g, '&quot;')}" role="listitem">
            <i class="fas ${p.icon}" aria-hidden="true"></i>
            <span>${p.text}</span>
        </button>
    `).join('');
}

// Quick prompt
function quickPrompt(prompt) {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.value = prompt;
        sendMessage();
    }
}

// Send message
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input?.value?.trim();

    if (!message || isLoading) return;

    // Clear input
    input.value = '';
    autoResizeTextarea();

    // Remove welcome message if present
    const welcome = document.querySelector('.welcome-message');
    if (welcome) {
        welcome.remove();
    }

    // Add user message
    addMessage(message, 'user');

    // Show typing indicator
    showTypingIndicator();

    isLoading = true;
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) sendBtn.disabled = true;

    announceToScreenReader('Message sent. Waiting for response.');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                mode: currentMode,
                context: userContext,
                language: selectedLanguage
            })
        });

        const data = await response.json();
        hideTypingIndicator();

        if (data.success) {
            addMessage(data.response, 'assistant');
            announceToScreenReader('New response received from MonsoonShield AI');
        } else {
            addMessage('I apologize, but I encountered an error. Please try again.', 'assistant');
        }
    } catch (error) {
        console.error('Error:', error);
        hideTypingIndicator();
        addMessage('Unable to connect to the server. Please check your connection and try again.', 'assistant');
    }

    isLoading = false;
    const sendBtnEnd = document.getElementById('send-btn');
    if (sendBtnEnd) sendBtnEnd.disabled = false;
}

// Add message to chat
function addMessage(content, type) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const avatar = type === 'assistant' 
        ? '<i class="fas fa-cloud-rain"></i>' 
        : '<i class="fas fa-user"></i>';

    const formattedContent = formatMessage(content);

    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">${formattedContent}</div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Format message content
function formatMessage(content) {
    let formatted = content
        .replace(/^### (.*$)/gm, '<h4>$1</h4>')
        .replace(/^## (.*$)/gm, '<h3>$1</h3>')
        .replace(/^# (.*$)/gm, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^- (.*$)/gm, '<li>$1</li>')
        .replace(/^• (.*$)/gm, '<li>$1</li>')
        .replace(/^(\d+)\. (.*$)/gm, '<li>$2</li>')
        .replace(/☐/g, '☐')
        .replace(/☑/g, '☑')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    formatted = '<p>' + formatted + '</p>';
    formatted = formatted.replace(/(<li>.*?<\/li>)+/gs, '<ul>$&</ul>');
    
    return formatted;
}

// Show typing indicator
function showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-avatar"><i class="fas fa-cloud-rain"></i></div>
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Modal functions
function openSOSModal() {
    lastFocusedElement = document.activeElement;
    document.getElementById('sos-modal').classList.add('active');
    trapFocusInModal('sos-modal');
    announceToScreenReader('Emergency SOS dialog opened. Use Tab to navigate, Escape to close.');
}

function closeSOSModal() {
    document.getElementById('sos-modal').classList.remove('active');
    restoreFocus();
    announceToScreenReader('Emergency dialog closed');
}

function openContextModal() {
    lastFocusedElement = document.activeElement;
    // Pre-fill with saved context
    if (userContext.location) {
        document.getElementById('context-location-input').value = userContext.location;
    }
    if (userContext.familySize) {
        document.getElementById('context-family-size').value = userContext.familySize;
    }
    if (userContext.housingType) {
        document.getElementById('context-housing').value = userContext.housingType;
    }
    document.getElementById('context-children').checked = userContext.hasChildren || false;
    document.getElementById('context-elderly').checked = userContext.hasElderly || false;
    document.getElementById('context-pets').checked = userContext.hasPets || false;
    if (userContext.healthConditions) {
        document.getElementById('context-health').value = userContext.healthConditions;
    }

    document.getElementById('context-modal').classList.add('active');
    trapFocusInModal('context-modal');
    announceToScreenReader('Settings dialog opened');
}

function closeContextModal() {
    document.getElementById('context-modal').classList.remove('active');
    restoreFocus();
    announceToScreenReader('Settings dialog closed');
}

function openPersonalizedPlan() {
    lastFocusedElement = document.activeElement;
    // Pre-fill with context if available
    if (userContext.location) {
        document.getElementById('plan-location').value = userContext.location;
    }
    if (userContext.familySize) {
        document.getElementById('plan-family-size').value = userContext.familySize;
    }
    
    document.getElementById('plan-result').style.display = 'none';
    document.getElementById('plan-modal').classList.add('active');
    trapFocusInModal('plan-modal');
    announceToScreenReader('Create personalized plan dialog opened');
}

function closePlanModal() {
    document.getElementById('plan-modal').classList.remove('active');
    restoreFocus();
    announceToScreenReader('Plan dialog closed');
}

function openCommunityPlan() {
    lastFocusedElement = document.activeElement;
    document.getElementById('community-result').style.display = 'none';
    document.getElementById('community-modal').classList.add('active');
    trapFocusInModal('community-modal');
    announceToScreenReader('Community plan dialog opened');
}

function closeCommunityModal() {
    document.getElementById('community-modal').classList.remove('active');
    restoreFocus();
    announceToScreenReader('Community plan dialog closed');
}

// Save context
function saveContext() {
    userContext = {
        location: document.getElementById('context-location-input').value,
        familySize: document.getElementById('context-family-size').value,
        housingType: document.getElementById('context-housing').value,
        hasChildren: document.getElementById('context-children').checked,
        hasElderly: document.getElementById('context-elderly').checked,
        hasPets: document.getElementById('context-pets').checked,
        healthConditions: document.getElementById('context-health').value
    };

    localStorage.setItem('monsoonshield-context', JSON.stringify(userContext));
    updateContextBadge();
    closeContextModal();
    showToast('Your context has been saved successfully!', 'success');
}

// Load saved context
function loadSavedContext() {
    const saved = localStorage.getItem('monsoonshield-context');
    if (saved) {
        userContext = JSON.parse(saved);
        updateContextBadge();
    }
}

// Update context badge
function updateContextBadge() {
    const badge = document.getElementById('context-badge');
    const locationSpan = document.getElementById('context-location');
    
    if (userContext.location && badge && locationSpan) {
        badge.style.display = 'flex';
        locationSpan.textContent = userContext.location;
    } else if (badge) {
        badge.style.display = 'none';
    }
}

// Get Emergency Help
async function getEmergencyHelp() {
    const emergencyType = document.getElementById('emergency-type').value;
    const situation = document.getElementById('emergency-situation').value;
    const location = document.getElementById('emergency-location').value;

    if (!emergencyType && !situation) {
        alert('Please select an emergency type or describe your situation');
        return;
    }

    closeSOSModal();
    setMode('emergency');

    const welcome = document.querySelector('.welcome-message');
    if (welcome) {
        welcome.remove();
    }

    const userMessage = `EMERGENCY: ${emergencyType || 'Urgent help needed'}\n${situation ? 'Situation: ' + situation : ''}\n${location ? 'Location: ' + location : ''}`;
    addMessage(userMessage, 'user');
    showTypingIndicator();

    announceToScreenReader('Processing emergency request. Please wait.', 'assertive');

    try {
        const response = await fetch('/api/emergency-sos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                emergencyType,
                situation,
                location,
                language: selectedLanguage
            })
        });

        const data = await response.json();
        hideTypingIndicator();

        if (data.success) {
            addMessage(data.instructions, 'assistant');
        } else {
            addMessage(`Please call emergency services immediately:\n- NDRF: 9711077372\n- Police: 100\n- Ambulance: 102\n- Fire: 101\n- Disaster Management: 1078`, 'assistant');
        }
    } catch (error) {
        hideTypingIndicator();
        addMessage(`Unable to connect. Please call emergency services:\n- NDRF: 9711077372\n- Police: 100\n- Ambulance: 102`, 'assistant');
    }

    announceToScreenReader('Emergency guidance received. Please review the instructions carefully.', 'assertive');
}

// Generate Personalized Plan
async function generatePersonalizedPlan() {
    const planResult = document.getElementById('plan-result');
    const planLoading = document.getElementById('plan-loading');
    const planContent = document.getElementById('plan-content');

    const planData = {
        location: document.getElementById('plan-location').value,
        familySize: document.getElementById('plan-family-size').value,
        housingType: document.getElementById('plan-housing').value,
        floor: document.getElementById('plan-floor').value,
        hasChildren: document.getElementById('plan-children').checked,
        hasElderly: document.getElementById('plan-elderly').checked,
        hasPets: document.getElementById('plan-pets').checked,
        hasBasement: document.getElementById('plan-basement').checked,
        budget: document.getElementById('plan-budget').value,
        vehicleType: document.getElementById('plan-vehicle').value,
        healthConditions: document.getElementById('plan-health').value,
        language: selectedLanguage
    };

    if (!planData.location) {
        alert('Please enter your location');
        return;
    }

    planResult.style.display = 'block';
    planLoading.style.display = 'flex';
    planContent.style.display = 'none';

    announceToScreenReader('Generating your personalized plan. Please wait.');

    try {
        const response = await fetch('/api/preparedness-plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(planData)
        });

        const data = await response.json();

        planLoading.style.display = 'none';
        planContent.style.display = 'block';

        if (data.success) {
            planContent.innerHTML = formatMessage(data.plan);
        } else {
            planContent.innerHTML = '<p>Unable to generate plan. Please try again.</p>';
        }
    } catch (error) {
        planLoading.style.display = 'none';
        planContent.style.display = 'block';
        planContent.innerHTML = '<p>Error connecting to server. Please check your connection.</p>';
    }

    announceToScreenReader('Your personalized plan is ready.');
    if (planContent) {
        planContent.focus();
    }
}

// Generate Community Plan
async function generateCommunityPlan() {
    const communityResult = document.getElementById('community-result');
    const communityLoading = document.getElementById('community-loading');
    const communityContent = document.getElementById('community-content');

    const communityData = {
        communityType: document.getElementById('community-type').value,
        population: document.getElementById('community-population').value,
        riskFactors: document.getElementById('community-risks').value,
        existingResources: document.getElementById('community-resources').value,
        language: selectedLanguage
    };

    communityResult.style.display = 'block';
    communityLoading.style.display = 'flex';
    communityContent.style.display = 'none';

    announceToScreenReader('Generating community plan. Please wait.');

    try {
        const response = await fetch('/api/community-plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(communityData)
        });

        const data = await response.json();

        communityLoading.style.display = 'none';
        communityContent.style.display = 'block';

        if (data.success) {
            communityContent.innerHTML = formatMessage(data.plan);
        } else {
            communityContent.innerHTML = '<p>Unable to generate plan. Please try again.</p>';
        }
    } catch (error) {
        communityLoading.style.display = 'none';
        communityContent.style.display = 'block';
        communityContent.innerHTML = '<p>Error connecting to server. Please check your connection.</p>';
    }

    announceToScreenReader('Community plan is ready.');
    if (communityContent) {
        communityContent.focus();
    }
}

// Voice Input
let recognition = null;
let isListening = false;

function initVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = getVoiceLanguage();
        
        recognition.onstart = () => {
            isListening = true;
            const voiceBtn = document.getElementById('voice-btn');
            if (voiceBtn) {
                voiceBtn.classList.add('listening');
                voiceBtn.setAttribute('aria-pressed', 'true');
            }
            const voiceStatus = document.getElementById('voice-status');
            if (voiceStatus) voiceStatus.style.display = 'flex';
            const voiceIcon = document.getElementById('voice-icon');
            if (voiceIcon) voiceIcon.className = 'fas fa-stop';
        };
        
        recognition.onend = () => {
            isListening = false;
            const voiceBtn = document.getElementById('voice-btn');
            if (voiceBtn) {
                voiceBtn.classList.remove('listening');
                voiceBtn.setAttribute('aria-pressed', 'false');
            }
            const voiceStatus = document.getElementById('voice-status');
            if (voiceStatus) voiceStatus.style.display = 'none';
            const voiceIcon = document.getElementById('voice-icon');
            if (voiceIcon) voiceIcon.className = 'fas fa-microphone';
        };
        
        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                if (finalTranscript) {
                    chatInput.value = finalTranscript;
                    autoResizeTextarea();
                } else if (interimTranscript) {
                    chatInput.value = interimTranscript;
                    chatInput.placeholder = 'Listening...';
                }
            }
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            stopVoiceInput();
            
            if (event.error === 'not-allowed') {
                alert('Microphone access denied. Please enable microphone permissions in your browser settings.');
            }
        };
        
        return true;
    }
    return false;
}

function getVoiceLanguage() {
    const langMap = {
        'english': 'en-IN',
        'hindi': 'hi-IN',
        'tamil': 'ta-IN',
        'telugu': 'te-IN',
        'bengali': 'bn-IN',
        'marathi': 'mr-IN',
        'gujarati': 'gu-IN',
        'kannada': 'kn-IN',
        'malayalam': 'ml-IN',
        'punjabi': 'pa-IN',
        'odia': 'or-IN'
    };
    return langMap[selectedLanguage] || 'en-IN';
}

function toggleVoiceInput() {
    if (isListening) {
        stopVoiceInput();
    } else {
        startVoiceInput();
    }
}

async function startVoiceInput() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
    } catch (err) {
        console.error('Microphone permission error:', err);
        alert('Microphone Access Required. Please allow microphone access and try again.');
        return;
    }

    if (!recognition) {
        if (!initVoiceRecognition()) {
            alert('Voice input is not supported in your browser. Please try Chrome or Edge.');
            return;
        }
    }
    
    recognition.lang = getVoiceLanguage();
    
    try {
        recognition.start();
        announceToScreenReader('Voice input started. Speak now.', 'assertive');
    } catch (error) {
        console.error('Error starting voice recognition:', error);
        if (error.message && error.message.includes('already started')) {
            recognition.stop();
        }
    }
}

function stopVoiceInput() {
    if (recognition && isListening) {
        recognition.stop();
    }
    isListening = false;
    
    const voiceBtn = document.getElementById('voice-btn');
    if (voiceBtn) {
        voiceBtn.classList.remove('listening');
        voiceBtn.setAttribute('aria-pressed', 'false');
    }
    const voiceStatus = document.getElementById('voice-status');
    if (voiceStatus) voiceStatus.style.display = 'none';
    const voiceIcon = document.getElementById('voice-icon');
    if (voiceIcon) voiceIcon.className = 'fas fa-microphone';
    
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.placeholder = 'Ask about monsoon preparedness, safety tips, emergency guidance...';
    }
    
    announceToScreenReader('Voice input stopped');
}

// Accessibility Functions
function initAccessibility() {
    setupKeyboardNavigation();
}

function announceToScreenReader(message, priority = 'polite') {
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
        liveRegion.setAttribute('aria-live', priority);
        liveRegion.textContent = message;
        setTimeout(() => {
            liveRegion.textContent = '';
        }, 1000);
    }
}

function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    
    const iconClass = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    toast.innerHTML = `
        <i class="fas ${iconClass}" aria-hidden="true"></i>
        <span>${message}</span>
        <button class="toast-close" aria-label="Close notification">
            <i class="fas fa-times" aria-hidden="true"></i>
        </button>
    `;
    
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => toast.remove());
    }
    
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, duration);
    
    announceToScreenReader(message, type === 'error' ? 'assertive' : 'polite');
}

function trapFocusInModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    setTimeout(() => firstElement.focus(), 100);
    
    modal.addEventListener('keydown', function(e) {
        if (e.key !== 'Tab') return;
        
        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    });
}

function restoreFocus() {
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        setTimeout(() => lastFocusedElement.focus(), 100);
    }
}

function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        const target = e.target;
        
        if (target.classList && target.classList.contains('feature-card') && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            target.click();
        }
        
        if (target.classList && target.classList.contains('nav-btn')) {
            const navButtons = Array.from(document.querySelectorAll('.nav-btn[data-mode]'));
            const currentIndex = navButtons.indexOf(target);
            
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % navButtons.length;
                navButtons[nextIndex].focus();
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const prevIndex = (currentIndex - 1 + navButtons.length) % navButtons.length;
                navButtons[prevIndex].focus();
            }
        }
    });
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        console.log('MonsoonShield AI loaded successfully');
    });
}
