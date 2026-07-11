// MonsoonShield AI - Frontend Application
// WCAG 2.1 AA Compliant

// Global State
let currentMode = 'preparedness';
let userContext = {};
let selectedLanguage = 'english';
let isLoading = false;
let lastFocusedElement = null; // For focus management

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
});

// Event Listeners
function initializeEventListeners() {
    // Language selector
    document.getElementById('language-select').addEventListener('change', (e) => {
        selectedLanguage = e.target.value;
        localStorage.setItem('monsoonshield-language', selectedLanguage);
    });

    // Load saved language
    const savedLanguage = localStorage.getItem('monsoonshield-language');
    if (savedLanguage) {
        selectedLanguage = savedLanguage;
        document.getElementById('language-select').value = savedLanguage;
    }

    // Chat input auto-resize
    const chatInput = document.getElementById('chat-input');
    chatInput.addEventListener('input', autoResizeTextarea);
}

// Auto-resize textarea
function autoResizeTextarea() {
    const textarea = document.getElementById('chat-input');
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
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
        btn.classList.remove('active');
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        }
    });

    // Update mode header
    const config = MODE_CONFIG[mode];
    document.getElementById('mode-title').textContent = config.title;
    document.getElementById('mode-description').textContent = config.description;
    
    const modeIcon = document.querySelector('.mode-icon');
    modeIcon.className = `fas ${config.icon} mode-icon`;

    // Clear chat and show relevant welcome message
    clearChat();
}

// Clear chat messages
function clearChat() {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = `
        <div class="welcome-message">
            <div class="welcome-icon">
                <i class="fas ${MODE_CONFIG[currentMode].icon}"></i>
            </div>
            <h2>${MODE_CONFIG[currentMode].title}</h2>
            <p>${MODE_CONFIG[currentMode].description}</p>
            <div class="feature-cards">
                ${getQuickPromptsForMode(currentMode)}
            </div>
        </div>
    `;
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

    return prompts[mode].map(p => `
        <div class="feature-card" onclick="quickPrompt('${p.prompt.replace(/'/g, "\\'")}')">
            <i class="fas ${p.icon}"></i>
            <span>${p.text}</span>
        </div>
    `).join('');
}

// Quick prompt
function quickPrompt(prompt) {
    document.getElementById('chat-input').value = prompt;
    sendMessage();
}

// Send message
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

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
    document.getElementById('send-btn').disabled = true;

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
        } else {
            addMessage('I apologize, but I encountered an error. Please try again.', 'assistant');
        }
    } catch (error) {
        console.error('Error:', error);
        hideTypingIndicator();
        addMessage('Unable to connect to the server. Please check your connection and try again.', 'assistant');
    }

    isLoading = false;
    document.getElementById('send-btn').disabled = false;
}

// Add message to chat
function addMessage(content, type) {
    const chatMessages = document.getElementById('chat-messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const avatar = type === 'assistant' 
        ? '<i class="fas fa-cloud-rain"></i>' 
        : '<i class="fas fa-user"></i>';

    // Format the content
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
    // Convert markdown-like formatting to HTML
    let formatted = content
        // Headers
        .replace(/^### (.*$)/gm, '<h4>$1</h4>')
        .replace(/^## (.*$)/gm, '<h3>$1</h3>')
        .replace(/^# (.*$)/gm, '<h3>$1</h3>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Lists
        .replace(/^- (.*$)/gm, '<li>$1</li>')
        .replace(/^• (.*$)/gm, '<li>$1</li>')
        .replace(/^(\d+)\. (.*$)/gm, '<li>$2</li>')
        // Checkboxes
        .replace(/☐/g, '☐')
        .replace(/☑/g, '☑')
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    // Wrap in paragraphs
    formatted = '<p>' + formatted + '</p>';
    
    // Wrap consecutive list items in ul
    formatted = formatted.replace(/(<li>.*?<\/li>)+/gs, '<ul>$&</ul>');
    
    return formatted;
}

// Show typing indicator
function showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
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
    document.getElementById('sos-modal').classList.add('active');
}

function closeSOSModal() {
    document.getElementById('sos-modal').classList.remove('active');
}

function openContextModal() {
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
}

function closeContextModal() {
    document.getElementById('context-modal').classList.remove('active');
}

function openPersonalizedPlan() {
    // Pre-fill with context if available
    if (userContext.location) {
        document.getElementById('plan-location').value = userContext.location;
    }
    if (userContext.familySize) {
        document.getElementById('plan-family-size').value = userContext.familySize;
    }
    
    document.getElementById('plan-result').style.display = 'none';
    document.getElementById('plan-modal').classList.add('active');
}

function closePlanModal() {
    document.getElementById('plan-modal').classList.remove('active');
}

function openCommunityPlan() {
    document.getElementById('community-result').style.display = 'none';
    document.getElementById('community-modal').classList.add('active');
}

function closeCommunityModal() {
    document.getElementById('community-modal').classList.remove('active');
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

    // Save to localStorage
    localStorage.setItem('monsoonshield-context', JSON.stringify(userContext));

    // Update context badge
    updateContextBadge();

    closeContextModal();
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
    
    if (userContext.location) {
        badge.style.display = 'flex';
        locationSpan.textContent = userContext.location;
    } else {
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

    // Switch to emergency mode
    setMode('emergency');

    // Remove welcome message
    const welcome = document.querySelector('.welcome-message');
    if (welcome) {
        welcome.remove();
    }

    // Add user message
    const userMessage = `EMERGENCY: ${emergencyType || 'Urgent help needed'}\n${situation ? 'Situation: ' + situation : ''}\n${location ? 'Location: ' + location : ''}`;
    addMessage(userMessage, 'user');

    // Show typing indicator
    showTypingIndicator();

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
}

// Generate Personalized Plan
async function generatePersonalizedPlan() {
    const planResult = document.getElementById('plan-result');
    const planLoading = document.getElementById('plan-loading');
    const planContent = document.getElementById('plan-content');

    // Get form data
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

    // Show loading
    planResult.style.display = 'block';
    planLoading.style.display = 'flex';
    planContent.style.display = 'none';

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
}

// Generate Community Plan
async function generateCommunityPlan() {
    const communityResult = document.getElementById('community-result');
    const communityLoading = document.getElementById('community-loading');
    const communityContent = document.getElementById('community-content');

    // Get form data
    const communityData = {
        communityType: document.getElementById('community-type').value,
        population: document.getElementById('community-population').value,
        riskFactors: document.getElementById('community-risks').value,
        existingResources: document.getElementById('community-resources').value,
        language: selectedLanguage
    };

    // Show loading
    communityResult.style.display = 'block';
    communityLoading.style.display = 'flex';
    communityContent.style.display = 'none';

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
}

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
});

// Voice Input using Web Speech API
let recognition = null;
let isListening = false;

// Initialize voice recognition
function initVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = getVoiceLanguage();
        
        recognition.onstart = () => {
            isListening = true;
            document.getElementById('voice-btn').classList.add('listening');
            document.getElementById('voice-status').style.display = 'flex';
            document.getElementById('voice-icon').className = 'fas fa-stop';
        };
        
        recognition.onend = () => {
            isListening = false;
            document.getElementById('voice-btn').classList.remove('listening');
            document.getElementById('voice-status').style.display = 'none';
            document.getElementById('voice-icon').className = 'fas fa-microphone';
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
            if (finalTranscript) {
                chatInput.value = finalTranscript;
                autoResizeTextarea();
            } else if (interimTranscript) {
                chatInput.value = interimTranscript;
                chatInput.placeholder = 'Listening...';
            }
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            stopVoiceInput();
            
            if (event.error === 'not-allowed') {
                alert('Microphone access denied. Please enable microphone permissions in your browser settings.');
            } else if (event.error === 'no-speech') {
                // No speech detected, just stop quietly
            } else {
                alert('Voice input error: ' + event.error);
            }
        };
        
        return true;
    }
    return false;
}

// Get voice language based on selected language
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

// Toggle voice input
function toggleVoiceInput() {
    if (isListening) {
        stopVoiceInput();
    } else {
        startVoiceInput();
    }
}

// Start voice input
async function startVoiceInput() {
    // First check/request microphone permission
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop the stream immediately, we just needed permission
        stream.getTracks().forEach(track => track.stop());
    } catch (err) {
        console.error('Microphone permission error:', err);
        alert('🎤 Microphone Access Required\n\nTo use voice input:\n1. Click the lock/info icon in browser address bar\n2. Allow microphone access\n3. Reload the page and try again');
        return;
    }

    if (!recognition) {
        if (!initVoiceRecognition()) {
            alert('Voice input is not supported in your browser. Please try Chrome or Edge.');
            return;
        }
    }
    
    // Update language before starting
    recognition.lang = getVoiceLanguage();
    
    try {
        recognition.start();
    } catch (error) {
        console.error('Error starting voice recognition:', error);
        if (error.message.includes('already started')) {
            recognition.stop();
        }
    }
}

// Stop voice input
function stopVoiceInput() {
    if (recognition && isListening) {
        recognition.stop();
    }
    isListening = false;
    document.getElementById('voice-btn').classList.remove('listening');
    document.getElementById('voice-status').style.display = 'none';
    document.getElementById('voice-icon').className = 'fas fa-microphone';
    document.getElementById('chat-input').placeholder = 'Ask about monsoon preparedness, safety tips, emergency guidance...';
}

// Update voice language when language selector changes
document.addEventListener('DOMContentLoaded', () => {
    const langSelect = document.getElementById('language-select');
    if (langSelect) {
        langSelect.addEventListener('change', () => {
            if (recognition) {
                recognition.lang = getVoiceLanguage();
            }
        });
    }
});

// Service Worker Registration (for PWA support)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker can be added for offline support
        console.log('MonsoonShield AI loaded successfully');
        
        // Initialize voice recognition
        initVoiceRecognition();
        
        // Initialize accessibility features
        initAccessibility();
    });
}

// ============================================
// ACCESSIBILITY FUNCTIONS (WCAG 2.1 AA)
// ============================================

/**
 * Initialize accessibility features
 */
function initAccessibility() {
    // Set up focus trap for modals
    setupModalFocusManagement();
    
    // Add keyboard navigation
    setupKeyboardNavigation();
    
    // Update ARIA states on navigation buttons
    updateNavButtonAria();
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
function announceToScreenReader(message, priority = 'polite') {
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
        liveRegion.setAttribute('aria-live', priority);
        liveRegion.textContent = message;
        
        // Clear after announcement
        setTimeout(() => {
            liveRegion.textContent = '';
        }, 1000);
    }
}

/**
 * Show toast notification (accessible)
 * @param {string} message - Message to show
 * @param {string} type - 'success', 'error', 'warning', or 'info'
 * @param {number} duration - Duration in ms
 */
function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}" aria-hidden="true"></i>
        <span>${message}</span>
        <button class="toast-close" aria-label="Close notification" onclick="this.parentElement.remove()">
            <i class="fas fa-times" aria-hidden="true"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, duration);
    
    // Also announce to screen readers
    announceToScreenReader(message, type === 'error' ? 'assertive' : 'polite');
}

/**
 * Setup modal focus management
 */
function setupModalFocusManagement() {
    // Override modal open/close functions to include focus management
    const originalOpenSOSModal = window.openSOSModal;
    window.openSOSModal = function() {
        lastFocusedElement = document.activeElement;
        originalOpenSOSModal();
        trapFocusInModal('sos-modal');
        announceToScreenReader('Emergency SOS dialog opened. Use Tab to navigate, Escape to close.');
    };
    
    const originalCloseSOSModal = window.closeSOSModal;
    window.closeSOSModal = function() {
        originalCloseSOSModal();
        restoreFocus();
        announceToScreenReader('Emergency dialog closed');
    };
    
    const originalOpenContextModal = window.openContextModal;
    window.openContextModal = function() {
        lastFocusedElement = document.activeElement;
        originalOpenContextModal();
        trapFocusInModal('context-modal');
        announceToScreenReader('Settings dialog opened');
    };
    
    const originalCloseContextModal = window.closeContextModal;
    window.closeContextModal = function() {
        originalCloseContextModal();
        restoreFocus();
        announceToScreenReader('Settings dialog closed');
    };
    
    const originalOpenPersonalizedPlan = window.openPersonalizedPlan;
    window.openPersonalizedPlan = function() {
        lastFocusedElement = document.activeElement;
        originalOpenPersonalizedPlan();
        trapFocusInModal('plan-modal');
        announceToScreenReader('Create personalized plan dialog opened');
    };
    
    const originalClosePlanModal = window.closePlanModal;
    window.closePlanModal = function() {
        originalClosePlanModal();
        restoreFocus();
        announceToScreenReader('Plan dialog closed');
    };
    
    const originalOpenCommunityPlan = window.openCommunityPlan;
    window.openCommunityPlan = function() {
        lastFocusedElement = document.activeElement;
        originalOpenCommunityPlan();
        trapFocusInModal('community-modal');
        announceToScreenReader('Community plan dialog opened');
    };
    
    const originalCloseCommunityModal = window.closeCommunityModal;
    window.closeCommunityModal = function() {
        originalCloseCommunityModal();
        restoreFocus();
        announceToScreenReader('Community plan dialog closed');
    };
}

/**
 * Trap focus within a modal
 * @param {string} modalId - ID of the modal
 */
function trapFocusInModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Focus first element
    setTimeout(() => firstElement.focus(), 100);
    
    // Handle tab key
    modal.addEventListener('keydown', function(e) {
        if (e.key !== 'Tab') return;
        
        if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    });
}

/**
 * Restore focus to the element that opened the modal
 */
function restoreFocus() {
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        setTimeout(() => lastFocusedElement.focus(), 100);
    }
}

/**
 * Setup keyboard navigation
 */
function setupKeyboardNavigation() {
    // Add keyboard support for feature cards
    document.addEventListener('keydown', (e) => {
        const target = e.target;
        
        // Handle Enter/Space on feature cards
        if (target.classList.contains('feature-card') && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            target.click();
        }
        
        // Handle arrow key navigation in nav buttons
        if (target.classList.contains('nav-btn')) {
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

/**
 * Update ARIA states on navigation buttons
 */
function updateNavButtonAria() {
    // Override setMode to update aria-pressed
    const originalSetMode = window.setMode;
    window.setMode = function(mode) {
        // Update aria-pressed states
        document.querySelectorAll('.nav-btn[data-mode]').forEach(btn => {
            btn.setAttribute('aria-pressed', btn.dataset.mode === mode ? 'true' : 'false');
        });
        
        originalSetMode(mode);
        
        // Announce mode change
        const config = MODE_CONFIG[mode];
        announceToScreenReader(`Switched to ${config.title} mode. ${config.description}`);
    };
}

/**
 * Enhanced addMessage with accessibility
 */
const originalAddMessage = window.addMessage;
window.addMessage = function(content, type) {
    originalAddMessage(content, type);
    
    // Announce new message
    if (type === 'assistant') {
        announceToScreenReader('New response received from MonsoonShield AI');
    }
};

/**
 * Enhanced saveContext with accessibility
 */
const originalSaveContext = window.saveContext;
window.saveContext = function() {
    originalSaveContext();
    showToast('Your context has been saved successfully!', 'success');
};

/**
 * Enhanced generatePersonalizedPlan with accessibility
 */
const originalGeneratePlan = window.generatePersonalizedPlan;
window.generatePersonalizedPlan = async function() {
    announceToScreenReader('Generating your personalized plan. Please wait.');
    await originalGeneratePlan();
    announceToScreenReader('Your personalized plan is ready.');
    
    // Focus on the result
    const planContent = document.getElementById('plan-content');
    if (planContent) {
        planContent.focus();
    }
};

/**
 * Enhanced generateCommunityPlan with accessibility
 */
const originalGenerateCommunityPlan = window.generateCommunityPlan;
window.generateCommunityPlan = async function() {
    announceToScreenReader('Generating community plan. Please wait.');
    await originalGenerateCommunityPlan();
    announceToScreenReader('Community plan is ready.');
    
    // Focus on the result
    const communityContent = document.getElementById('community-content');
    if (communityContent) {
        communityContent.focus();
    }
};

/**
 * Enhanced sendMessage with accessibility
 */
const originalSendMessage = window.sendMessage;
window.sendMessage = async function() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) {
        announceToScreenReader('Please enter a message before sending');
        return;
    }
    
    announceToScreenReader('Message sent. Waiting for response.');
    await originalSendMessage();
};

/**
 * Enhanced getEmergencyHelp with accessibility
 */
const originalGetEmergencyHelp = window.getEmergencyHelp;
window.getEmergencyHelp = async function() {
    announceToScreenReader('Processing emergency request. Please wait.', 'assertive');
    await originalGetEmergencyHelp();
    announceToScreenReader('Emergency guidance received. Please review the instructions carefully.', 'assertive');
};

/**
 * Enhanced voice input functions with accessibility
 */
const originalStartVoiceInput = window.startVoiceInput;
window.startVoiceInput = async function() {
    await originalStartVoiceInput();
    if (isListening) {
        announceToScreenReader('Voice input started. Speak now.', 'assertive');
        document.getElementById('voice-btn').setAttribute('aria-pressed', 'true');
    }
};

const originalStopVoiceInput = window.stopVoiceInput;
window.stopVoiceInput = function() {
    originalStopVoiceInput();
    announceToScreenReader('Voice input stopped');
    document.getElementById('voice-btn').setAttribute('aria-pressed', 'false');
};

// Add skip to chat functionality
document.addEventListener('DOMContentLoaded', () => {
    // Focus chat input when user presses / key
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
            e.preventDefault();
            document.getElementById('chat-input').focus();
            announceToScreenReader('Chat input focused. Type your message.');
        }
    });
});
