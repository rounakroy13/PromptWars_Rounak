/**
 * MonsoonShield AI - Frontend Application
 * WCAG 2.1 AA Compliant - CSP Safe (No inline event handlers)
 * @version 2.0.0
 * @author MonsoonShield Team
 */

'use strict';

// ============================================
// CONSTANTS
// ============================================

/** @type {Object.<string, {title: string, description: string, icon: string}>} */
const MODE_CONFIG = Object.freeze({
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
});

/** @type {Object.<string, string>} */
const LANGUAGE_MAP = Object.freeze({
    english: 'en-IN',
    hindi: 'hi-IN',
    tamil: 'ta-IN',
    telugu: 'te-IN',
    bengali: 'bn-IN',
    marathi: 'mr-IN',
    gujarati: 'gu-IN',
    kannada: 'kn-IN',
    malayalam: 'ml-IN',
    punjabi: 'pa-IN',
    odia: 'or-IN'
});

/** @type {Object.<string, Array<{icon: string, text: string, prompt: string}>>} */
const QUICK_PROMPTS = Object.freeze({
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
});

const STORAGE_KEYS = Object.freeze({
    CONTEXT: 'monsoonshield-context',
    LANGUAGE: 'monsoonshield-language'
});

const API_ENDPOINTS = Object.freeze({
    CHAT: '/api/chat',
    EMERGENCY_SOS: '/api/emergency-sos',
    PREPAREDNESS_PLAN: '/api/preparedness-plan',
    COMMUNITY_PLAN: '/api/community-plan'
});

// ============================================
// APPLICATION STATE
// ============================================

/**
 * @typedef {Object} AppState
 * @property {string} currentMode - Current application mode
 * @property {Object} userContext - User context data
 * @property {string} selectedLanguage - Selected language
 * @property {boolean} isLoading - Loading state
 * @property {Element|null} lastFocusedElement - Last focused element for modal management
 */

/** @type {AppState} */
const state = {
    currentMode: 'preparedness',
    userContext: {},
    selectedLanguage: 'english',
    isLoading: false,
    lastFocusedElement: null
};

/** @type {SpeechRecognition|null} */
let recognition = null;

/** @type {boolean} */
let isListening = false;

// ============================================
// DOM UTILITIES
// ============================================

/**
 * Safely get an element by ID
 * @param {string} id - Element ID
 * @returns {HTMLElement|null}
 */
const getElement = (id) => document.getElementById(id);

/**
 * Safely get element value
 * @param {string} id - Element ID
 * @returns {string}
 */
const getElementValue = (id) => {
    const el = getElement(id);
    return el ? (el.value || '') : '';
};

/**
 * Safely set element value
 * @param {string} id - Element ID
 * @param {string} value - Value to set
 */
const setElementValue = (id, value) => {
    const el = getElement(id);
    if (el) el.value = value;
};

/**
 * Safely get checkbox checked state
 * @param {string} id - Element ID
 * @returns {boolean}
 */
const getCheckboxValue = (id) => {
    const el = getElement(id);
    return el ? el.checked : false;
};

/**
 * Safely set checkbox checked state
 * @param {string} id - Element ID
 * @param {boolean} checked - Checked state
 */
const setCheckboxValue = (id, checked) => {
    const el = getElement(id);
    if (el) el.checked = checked;
};

/**
 * Add click event listener to element
 * @param {string} id - Element ID
 * @param {Function} handler - Event handler
 */
const addClickHandler = (id, handler) => {
    const el = getElement(id);
    if (el) el.addEventListener('click', handler);
};

/**
 * Add submit event listener to form
 * @param {string} id - Form ID
 * @param {Function} handler - Event handler
 */
const addSubmitHandler = (id, handler) => {
    const el = getElement(id);
    if (el) {
        el.addEventListener('submit', (e) => {
            e.preventDefault();
            handler(e);
        });
    }
};

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', () => {
    loadSavedContext();
    loadSavedLanguage();
    initializeEventListeners();
    initVoiceRecognition();
    initAccessibility();
    autoResizeTextarea();
    console.log('MonsoonShield AI initialized successfully');
});

/**
 * Load saved user context from localStorage
 */
function loadSavedContext() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.CONTEXT);
        if (saved) {
            state.userContext = JSON.parse(saved);
            updateContextBadge();
        }
    } catch (error) {
        console.error('Error loading saved context:', error);
    }
}

/**
 * Load saved language preference from localStorage
 */
function loadSavedLanguage() {
    try {
        const savedLanguage = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
        if (savedLanguage && LANGUAGE_MAP[savedLanguage]) {
            state.selectedLanguage = savedLanguage;
            const langSelect = getElement('language-select');
            if (langSelect) langSelect.value = savedLanguage;
        }
    } catch (error) {
        console.error('Error loading saved language:', error);
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

/**
 * Initialize all event listeners (CSP compliant - no inline handlers)
 */
function initializeEventListeners() {
    // Language selector
    const langSelect = getElement('language-select');
    if (langSelect) {
        langSelect.addEventListener('change', handleLanguageChange);
    }

    // Chat input
    const chatInput = getElement('chat-input');
    if (chatInput) {
        chatInput.addEventListener('input', autoResizeTextarea);
        chatInput.addEventListener('keydown', handleChatKeyDown);
    }

    // Button handlers
    addClickHandler('send-btn', sendMessage);
    addClickHandler('voice-btn', toggleVoiceInput);
    addClickHandler('stop-voice-btn', stopVoiceInput);
    addClickHandler('sos-btn-header', openSOSModal);
    addClickHandler('sos-close-btn', closeSOSModal);
    addClickHandler('context-settings-btn', openContextModal);
    addClickHandler('context-close-btn', closeContextModal);
    addClickHandler('my-plan-btn', openPersonalizedPlan);
    addClickHandler('plan-close-btn', closePlanModal);
    addClickHandler('community-btn', openCommunityPlan);
    addClickHandler('community-close-btn', closeCommunityModal);

    // Form handlers
    addSubmitHandler('sos-form', getEmergencyHelp);
    addSubmitHandler('context-form', saveContext);
    addSubmitHandler('plan-form', generatePersonalizedPlan);
    addSubmitHandler('community-form', generateCommunityPlan);

    // Navigation buttons
    initNavigationButtons();

    // Feature cards
    initFeatureCards();

    // Global event listeners
    initGlobalEventListeners();
}

/**
 * Initialize navigation button event listeners
 */
function initNavigationButtons() {
    document.querySelectorAll('.nav-btn[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            if (mode && MODE_CONFIG[mode]) {
                setMode(mode);
            }
        });
    });
}

/**
 * Initialize feature card event listeners
 */
function initFeatureCards() {
    document.querySelectorAll('.feature-card[data-prompt]').forEach(card => {
        card.addEventListener('click', () => {
            const prompt = card.dataset.prompt;
            if (prompt) quickPrompt(prompt);
        });
    });
}

/**
 * Initialize global event listeners
 */
function initGlobalEventListeners() {
    // Close modals on backdrop click
    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList && e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleGlobalKeyDown);
}

/**
 * Handle language change
 * @param {Event} e - Change event
 */
function handleLanguageChange(e) {
    const target = e.target;
    if (target && target.value) {
        state.selectedLanguage = target.value;
        localStorage.setItem(STORAGE_KEYS.LANGUAGE, target.value);
        if (recognition) {
            recognition.lang = getVoiceLanguage();
        }
    }
}

/**
 * Handle chat input keydown
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleChatKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

/**
 * Handle global keydown events
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleGlobalKeyDown(e) {
    // Escape to close modals
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    // / key to focus chat input
    const activeTag = document.activeElement?.tagName;
    if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) {
        e.preventDefault();
        const chatInput = getElement('chat-input');
        if (chatInput) {
            chatInput.focus();
            announceToScreenReader('Chat input focused. Type your message.');
        }
    }
}

// ============================================
// MODE MANAGEMENT
// ============================================

/**
 * Set the current application mode
 * @param {string} mode - Mode identifier
 */
function setMode(mode) {
    if (!MODE_CONFIG[mode]) return;

    state.currentMode = mode;

    // Update navigation buttons
    document.querySelectorAll('.nav-btn[data-mode]').forEach(btn => {
        const isActive = btn.dataset.mode === mode;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
    });

    // Update mode header
    const config = MODE_CONFIG[mode];
    const modeTitle = getElement('mode-title');
    const modeDesc = getElement('mode-description');
    const modeIcon = document.querySelector('.mode-icon');

    if (modeTitle) modeTitle.textContent = config.title;
    if (modeDesc) modeDesc.textContent = config.description;
    if (modeIcon) modeIcon.className = `fas ${config.icon} mode-icon`;

    clearChat();
    announceToScreenReader(`Switched to ${config.title} mode. ${config.description}`);
}

// ============================================
// CHAT FUNCTIONALITY
// ============================================

/**
 * Auto-resize the textarea based on content
 */
function autoResizeTextarea() {
    const textarea = getElement('chat-input');
    if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 150)  }px`;
    }
}

/**
 * Clear chat and show welcome message for current mode
 */
function clearChat() {
    const chatMessages = getElement('chat-messages');
    if (!chatMessages) return;

    const config = MODE_CONFIG[state.currentMode];
    const prompts = QUICK_PROMPTS[state.currentMode] || QUICK_PROMPTS.preparedness;

    chatMessages.innerHTML = `
        <div class="welcome-message" role="region" aria-label="Welcome information">
            <div class="welcome-icon" aria-hidden="true">
                <i class="fas ${config.icon}"></i>
            </div>
            <h2>${config.title}</h2>
            <p>${config.description}</p>
            <div class="feature-cards" role="list" aria-label="Quick action cards">
                ${prompts.map(p => `
                    <button class="feature-card" data-prompt="${escapeHtml(p.prompt)}" role="listitem">
                        <i class="fas ${p.icon}" aria-hidden="true"></i>
                        <span>${p.text}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    // Re-attach event listeners to new feature cards
    chatMessages.querySelectorAll('.feature-card[data-prompt]').forEach(card => {
        card.addEventListener('click', () => {
            const prompt = card.dataset.prompt;
            if (prompt) quickPrompt(prompt);
        });
    });
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Execute a quick prompt
 * @param {string} prompt - Prompt text
 */
function quickPrompt(prompt) {
    const chatInput = getElement('chat-input');
    if (chatInput) {
        chatInput.value = prompt;
        sendMessage();
    }
}

/**
 * Send a chat message
 */
async function sendMessage() {
    const input = getElement('chat-input');
    const message = input?.value?.trim();

    if (!message || state.isLoading) return;

    input.value = '';
    autoResizeTextarea();

    // Remove welcome message
    const welcome = document.querySelector('.welcome-message');
    if (welcome) welcome.remove();

    addMessage(message, 'user');
    showTypingIndicator();

    state.isLoading = true;
    const sendBtn = getElement('send-btn');
    if (sendBtn) sendBtn.disabled = true;

    announceToScreenReader('Message sent. Waiting for response.');

    try {
        const response = await fetch(API_ENDPOINTS.CHAT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                mode: state.currentMode,
                context: state.userContext,
                language: state.selectedLanguage
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
        console.error('Chat error:', error);
        hideTypingIndicator();
        addMessage('Unable to connect to the server. Please check your connection.', 'assistant');
    }

    state.isLoading = false;
    if (sendBtn) sendBtn.disabled = false;
}

/**
 * Add a message to the chat
 * @param {string} content - Message content
 * @param {string} type - Message type ('user' or 'assistant')
 */
function addMessage(content, type) {
    const chatMessages = getElement('chat-messages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const avatar = type === 'assistant'
        ? '<i class="fas fa-cloud-rain"></i>'
        : '<i class="fas fa-user"></i>';

    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">${formatMessage(content)}</div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Format message content (markdown-like)
 * @param {string} content - Raw content
 * @returns {string} Formatted HTML
 */
function formatMessage(content) {
    return content
        .replace(/^### (.*$)/gm, '<h4>$1</h4>')
        .replace(/^## (.*$)/gm, '<h3>$1</h3>')
        .replace(/^# (.*$)/gm, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^- (.*$)/gm, '<li>$1</li>')
        .replace(/^• (.*$)/gm, '<li>$1</li>')
        .replace(/^(\d+)\. (.*$)/gm, '<li>$2</li>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/(<li>.*?<\/li>)+/gs, '<ul>$&</ul>');
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
    const chatMessages = getElement('chat-messages');
    if (!chatMessages) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-avatar"><i class="fas fa-cloud-rain"></i></div>
        <div class="message-content">
            <div class="typing-indicator"><span></span><span></span><span></span></div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Hide typing indicator
 */
function hideTypingIndicator() {
    const indicator = getElement('typing-indicator');
    if (indicator) indicator.remove();
}

// ============================================
// MODAL MANAGEMENT
// ============================================

/**
 * Open SOS modal
 */
function openSOSModal() {
    state.lastFocusedElement = document.activeElement;
    const modal = getElement('sos-modal');
    if (modal) {
        modal.classList.add('active');
        trapFocusInModal('sos-modal');
        announceToScreenReader('Emergency SOS dialog opened.');
    }
}

/**
 * Close SOS modal
 */
function closeSOSModal() {
    const modal = getElement('sos-modal');
    if (modal) modal.classList.remove('active');
    restoreFocus();
    announceToScreenReader('Emergency dialog closed');
}

/**
 * Open context settings modal
 */
function openContextModal() {
    state.lastFocusedElement = document.activeElement;

    // Pre-fill form
    setElementValue('context-location-input', state.userContext.location || '');
    setElementValue('context-family-size', state.userContext.familySize || '');
    setElementValue('context-housing', state.userContext.housingType || '');
    setElementValue('context-health', state.userContext.healthConditions || '');
    setCheckboxValue('context-children', state.userContext.hasChildren || false);
    setCheckboxValue('context-elderly', state.userContext.hasElderly || false);
    setCheckboxValue('context-pets', state.userContext.hasPets || false);

    const modal = getElement('context-modal');
    if (modal) {
        modal.classList.add('active');
        trapFocusInModal('context-modal');
        announceToScreenReader('Settings dialog opened');
    }
}

/**
 * Close context modal
 */
function closeContextModal() {
    const modal = getElement('context-modal');
    if (modal) modal.classList.remove('active');
    restoreFocus();
    announceToScreenReader('Settings dialog closed');
}

/**
 * Open personalized plan modal
 */
function openPersonalizedPlan() {
    state.lastFocusedElement = document.activeElement;

    setElementValue('plan-location', state.userContext.location || '');
    setElementValue('plan-family-size', state.userContext.familySize || '4');

    const result = getElement('plan-result');
    if (result) result.style.display = 'none';

    const modal = getElement('plan-modal');
    if (modal) {
        modal.classList.add('active');
        trapFocusInModal('plan-modal');
        announceToScreenReader('Create personalized plan dialog opened');
    }
}

/**
 * Close plan modal
 */
function closePlanModal() {
    const modal = getElement('plan-modal');
    if (modal) modal.classList.remove('active');
    restoreFocus();
    announceToScreenReader('Plan dialog closed');
}

/**
 * Open community plan modal
 */
function openCommunityPlan() {
    state.lastFocusedElement = document.activeElement;

    const result = getElement('community-result');
    if (result) result.style.display = 'none';

    const modal = getElement('community-modal');
    if (modal) {
        modal.classList.add('active');
        trapFocusInModal('community-modal');
        announceToScreenReader('Community plan dialog opened');
    }
}

/**
 * Close community modal
 */
function closeCommunityModal() {
    const modal = getElement('community-modal');
    if (modal) modal.classList.remove('active');
    restoreFocus();
    announceToScreenReader('Community plan dialog closed');
}

// ============================================
// CONTEXT & DATA MANAGEMENT
// ============================================

/**
 * Save user context
 */
function saveContext() {
    state.userContext = {
        location: getElementValue('context-location-input'),
        familySize: getElementValue('context-family-size'),
        housingType: getElementValue('context-housing'),
        hasChildren: getCheckboxValue('context-children'),
        hasElderly: getCheckboxValue('context-elderly'),
        hasPets: getCheckboxValue('context-pets'),
        healthConditions: getElementValue('context-health')
    };

    try {
        localStorage.setItem(STORAGE_KEYS.CONTEXT, JSON.stringify(state.userContext));
        updateContextBadge();
        closeContextModal();
        showToast('Your context has been saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving context:', error);
        showToast('Error saving context. Please try again.', 'error');
    }
}

/**
 * Update context badge display
 */
function updateContextBadge() {
    const badge = getElement('context-badge');
    const locationSpan = getElement('context-location');

    if (state.userContext.location && badge && locationSpan) {
        badge.style.display = 'flex';
        locationSpan.textContent = state.userContext.location;
    } else if (badge) {
        badge.style.display = 'none';
    }
}

// ============================================
// EMERGENCY & PLAN GENERATION
// ============================================

/**
 * Get emergency help
 */
async function getEmergencyHelp() {
    const emergencyType = getElementValue('emergency-type');
    const situation = getElementValue('emergency-situation');
    const location = getElementValue('emergency-location');

    if (!emergencyType && !situation) {
        alert('Please select an emergency type or describe your situation');
        return;
    }

    closeSOSModal();
    setMode('emergency');

    const welcome = document.querySelector('.welcome-message');
    if (welcome) welcome.remove();

    const userMessage = `EMERGENCY: ${emergencyType || 'Urgent help needed'}\n${situation ? `Situation: ${  situation}` : ''}\n${location ? `Location: ${  location}` : ''}`;
    addMessage(userMessage, 'user');
    showTypingIndicator();

    announceToScreenReader('Processing emergency request. Please wait.', 'assertive');

    try {
        const response = await fetch(API_ENDPOINTS.EMERGENCY_SOS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                emergencyType,
                situation,
                location,
                language: state.selectedLanguage
            })
        });

        const data = await response.json();
        hideTypingIndicator();

        addMessage(data.success ? data.instructions :
            'Please call emergency services immediately:\n- NDRF: 9711077372\n- Police: 100\n- Ambulance: 102\n- Fire: 101',
        'assistant');
    } catch (error) {
        console.error('Emergency help error:', error);
        hideTypingIndicator();
        addMessage('Unable to connect. Please call emergency services:\n- NDRF: 9711077372\n- Police: 100\n- Ambulance: 102', 'assistant');
    }

    announceToScreenReader('Emergency guidance received.', 'assertive');
}

/**
 * Generate personalized plan
 */
async function generatePersonalizedPlan() {
    const planResult = getElement('plan-result');
    const planLoading = getElement('plan-loading');
    const planContent = getElement('plan-content');

    const planData = {
        location: getElementValue('plan-location'),
        familySize: getElementValue('plan-family-size'),
        housingType: getElementValue('plan-housing'),
        floor: getElementValue('plan-floor'),
        hasChildren: getCheckboxValue('plan-children'),
        hasElderly: getCheckboxValue('plan-elderly'),
        hasPets: getCheckboxValue('plan-pets'),
        hasBasement: getCheckboxValue('plan-basement'),
        budget: getElementValue('plan-budget'),
        vehicleType: getElementValue('plan-vehicle'),
        healthConditions: getElementValue('plan-health'),
        language: state.selectedLanguage
    };

    if (!planData.location) {
        alert('Please enter your location');
        return;
    }

    if (planResult) planResult.style.display = 'block';
    if (planLoading) planLoading.style.display = 'flex';
    if (planContent) planContent.style.display = 'none';

    announceToScreenReader('Generating your personalized plan. Please wait.');

    try {
        const response = await fetch(API_ENDPOINTS.PREPAREDNESS_PLAN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(planData)
        });

        const data = await response.json();

        if (planLoading) planLoading.style.display = 'none';
        if (planContent) {
            planContent.style.display = 'block';
            planContent.innerHTML = data.success ? formatMessage(data.plan) : '<p>Unable to generate plan. Please try again.</p>';
            planContent.focus();
        }
    } catch (error) {
        console.error('Plan generation error:', error);
        if (planLoading) planLoading.style.display = 'none';
        if (planContent) {
            planContent.style.display = 'block';
            planContent.innerHTML = '<p>Error connecting to server. Please check your connection.</p>';
        }
    }

    announceToScreenReader('Your personalized plan is ready.');
}

/**
 * Generate community plan
 */
async function generateCommunityPlan() {
    const communityResult = getElement('community-result');
    const communityLoading = getElement('community-loading');
    const communityContent = getElement('community-content');

    const communityData = {
        communityType: getElementValue('community-type'),
        population: getElementValue('community-population'),
        riskFactors: getElementValue('community-risks'),
        existingResources: getElementValue('community-resources'),
        language: state.selectedLanguage
    };

    if (communityResult) communityResult.style.display = 'block';
    if (communityLoading) communityLoading.style.display = 'flex';
    if (communityContent) communityContent.style.display = 'none';

    announceToScreenReader('Generating community plan. Please wait.');

    try {
        const response = await fetch(API_ENDPOINTS.COMMUNITY_PLAN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(communityData)
        });

        const data = await response.json();

        if (communityLoading) communityLoading.style.display = 'none';
        if (communityContent) {
            communityContent.style.display = 'block';
            communityContent.innerHTML = data.success ? formatMessage(data.plan) : '<p>Unable to generate plan. Please try again.</p>';
            communityContent.focus();
        }
    } catch (error) {
        console.error('Community plan error:', error);
        if (communityLoading) communityLoading.style.display = 'none';
        if (communityContent) {
            communityContent.style.display = 'block';
            communityContent.innerHTML = '<p>Error connecting to server. Please check your connection.</p>';
        }
    }

    announceToScreenReader('Community plan is ready.');
}

// ============================================
// VOICE INPUT
// ============================================

/**
 * Initialize voice recognition
 * @returns {boolean} Whether initialization was successful
 */
function initVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = getVoiceLanguage();

    recognition.onstart = () => {
        isListening = true;
        const voiceBtn = getElement('voice-btn');
        const voiceStatus = getElement('voice-status');
        const voiceIcon = getElement('voice-icon');

        if (voiceBtn) {
            voiceBtn.classList.add('listening');
            voiceBtn.setAttribute('aria-pressed', 'true');
        }
        if (voiceStatus) voiceStatus.style.display = 'flex';
        if (voiceIcon) voiceIcon.className = 'fas fa-stop';
    };

    recognition.onend = () => {
        isListening = false;
        const voiceBtn = getElement('voice-btn');
        const voiceStatus = getElement('voice-status');
        const voiceIcon = getElement('voice-icon');

        if (voiceBtn) {
            voiceBtn.classList.remove('listening');
            voiceBtn.setAttribute('aria-pressed', 'false');
        }
        if (voiceStatus) voiceStatus.style.display = 'none';
        if (voiceIcon) voiceIcon.className = 'fas fa-microphone';
    };

    recognition.onresult = (event) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
        }

        const chatInput = getElement('chat-input');
        if (chatInput && finalTranscript) {
            chatInput.value = finalTranscript;
            autoResizeTextarea();
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopVoiceInput();
        if (event.error === 'not-allowed') {
            alert('Microphone access denied. Please enable microphone permissions.');
        }
    };

    return true;
}

/**
 * Get voice language code
 * @returns {string} Language code
 */
function getVoiceLanguage() {
    return LANGUAGE_MAP[state.selectedLanguage] || 'en-IN';
}

/**
 * Toggle voice input
 */
function toggleVoiceInput() {
    if (isListening) {
        stopVoiceInput();
    } else {
        startVoiceInput();
    }
}

/**
 * Start voice input
 */
async function startVoiceInput() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
    } catch (err) {
        console.error('Microphone permission error:', err);
        alert('Microphone access required. Please allow microphone access.');
        return;
    }

    if (!recognition && !initVoiceRecognition()) {
        alert('Voice input not supported in this browser. Please use Chrome or Edge.');
        return;
    }

    if (recognition) {
        recognition.lang = getVoiceLanguage();
        try {
            recognition.start();
            announceToScreenReader('Voice input started. Speak now.', 'assertive');
        } catch (error) {
            console.error('Error starting voice recognition:', error);
        }
    }
}

/**
 * Stop voice input
 */
function stopVoiceInput() {
    if (recognition && isListening) {
        recognition.stop();
    }
    isListening = false;

    const voiceBtn = getElement('voice-btn');
    const voiceStatus = getElement('voice-status');
    const voiceIcon = getElement('voice-icon');
    const chatInput = getElement('chat-input');

    if (voiceBtn) {
        voiceBtn.classList.remove('listening');
        voiceBtn.setAttribute('aria-pressed', 'false');
    }
    if (voiceStatus) voiceStatus.style.display = 'none';
    if (voiceIcon) voiceIcon.className = 'fas fa-microphone';
    if (chatInput) chatInput.placeholder = 'Ask about monsoon preparedness, safety tips, emergency guidance...';

    announceToScreenReader('Voice input stopped');
}

// ============================================
// ACCESSIBILITY
// ============================================

/**
 * Initialize accessibility features
 */
function initAccessibility() {
    setupKeyboardNavigation();
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
function announceToScreenReader(message, priority = 'polite') {
    const liveRegion = getElement('live-region');
    if (liveRegion) {
        liveRegion.setAttribute('aria-live', priority);
        liveRegion.textContent = message;
        setTimeout(() => { liveRegion.textContent = ''; }, 1000);
    }
}

/**
 * Show toast notification
 * @param {string} message - Message to show
 * @param {string} type - 'success', 'error', or 'info'
 * @param {number} duration - Duration in ms
 */
function showToast(message, type = 'info', duration = 5000) {
    const container = getElement('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');

    const iconClass = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    toast.innerHTML = `
        <i class="fas ${iconClass}" aria-hidden="true"></i>
        <span>${escapeHtml(message)}</span>
        <button class="toast-close" aria-label="Close"><i class="fas fa-times" aria-hidden="true"></i></button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) closeBtn.addEventListener('click', () => toast.remove());

    container.appendChild(toast);
    setTimeout(() => { if (toast.parentElement) toast.remove(); }, duration);

    announceToScreenReader(message, type === 'error' ? 'assertive' : 'polite');
}

/**
 * Trap focus within a modal
 * @param {string} modalId - Modal element ID
 */
function trapFocusInModal(modalId) {
    const modal = getElement(modalId);
    if (!modal) return;

    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    setTimeout(() => first.focus(), 100);

    modal.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    });
}

/**
 * Restore focus to previously focused element
 */
function restoreFocus() {
    if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === 'function') {
        setTimeout(() => state.lastFocusedElement.focus(), 100);
    }
}

/**
 * Setup keyboard navigation
 */
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        const target = e.target;

        // Feature cards: Enter/Space to activate
        if (target && target.classList && target.classList.contains('feature-card') && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            target.click();
        }

        // Nav buttons: Arrow key navigation
        if (target && target.classList && target.classList.contains('nav-btn')) {
            const navButtons = Array.from(document.querySelectorAll('.nav-btn[data-mode]'));
            const currentIndex = navButtons.indexOf(target);

            if (currentIndex >= 0) {
                let nextIndex = currentIndex;
                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    nextIndex = (currentIndex + 1) % navButtons.length;
                } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    nextIndex = (currentIndex - 1 + navButtons.length) % navButtons.length;
                }
                if (nextIndex !== currentIndex) navButtons[nextIndex].focus();
            }
        }
    });
}

// Log successful load
console.log('MonsoonShield AI app.js loaded');
