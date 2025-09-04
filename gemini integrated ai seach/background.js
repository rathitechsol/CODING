class GeminiAPI {
    constructor() {
        this.apiKey = null;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
        this.init();
    }

    async init() {
        await this.loadApiKey();
        this.setupMessageListener();
    }

    async loadApiKey() {
        try {
            const result = await chrome.storage.local.get(['apiKey']);
            this.apiKey = result.apiKey;
        } catch (error) {
            console.error('Error loading API key:', error);
        }
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'processWithGemini') {
                this.processWithGemini(request.textContent, request.pageContext, request.selection, request.aiAction)
                    .then(response => sendResponse(response))
                    .catch(error => sendResponse({ success: false, error: error.message }));
                return true; // Keep message channel open for async response
            }
        });
    }

    async processWithGemini(textContent, pageContext, selection, aiAction = 'solve') {
        try {
            if (!this.apiKey) {
                throw new Error('API key not found. Please authenticate first.');
            }

            // Update stats
            await this.updateStats();

            // Create context-aware prompts based on the action
            const prompts = {
                solve: `Please solve the problem or answer the question in the following content. Provide a clear, step-by-step solution.

Page: ${pageContext.title}
URL: ${pageContext.url}

Content:
${textContent}

Please provide a detailed solution.`,
                
                summarize: `Please provide a concise summary of the following content. Focus on the key points and main ideas.

Page: ${pageContext.title}
URL: ${pageContext.url}

Content:
${textContent}

Please provide a clear, well-structured summary.`,
                
                explain: `Please explain the following content in simple terms. Break down complex concepts and provide context.

Page: ${pageContext.title}
URL: ${pageContext.url}

Content:
${textContent}

Please provide a clear explanation that helps understand the content.`,
                
                read: `Please analyze and provide insights about the following content. Identify the main topics, key information, and any important details.

Page: ${pageContext.title}
URL: ${pageContext.url}

Content:
${textContent}

Please provide a comprehensive analysis of the content.`,
                
                chat: `You are Gemini, a helpful AI assistant. The user is asking you a question. Please provide a helpful, accurate, and detailed response.

Current page context:
- Title: ${pageContext.title}
- URL: ${pageContext.url}
- Domain: ${pageContext.domain}

User's question: ${textContent}

Please respond naturally and helpfully to the user's question.`
            };

            const prompt = prompts[aiAction] || prompts.solve;

            // Prepare the request for Gemini API
            const requestBody = {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
            };

            const response = await fetch(`${this.baseUrl}/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const answer = data.candidates[0].content.parts[0].text;
                return {
                    success: true,
                    answer: answer
                };
            } else {
                throw new Error('No valid response from Gemini API');
            }

        } catch (error) {
            console.error('Gemini API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updateStats() {
        try {
            const result = await chrome.storage.local.get(['queriesCount', 'lastUsed']);
            const queriesCount = (result.queriesCount || 0) + 1;
            const lastUsed = new Date().toLocaleTimeString();
            
            await chrome.storage.local.set({
                queriesCount: queriesCount,
                lastUsed: lastUsed
            });
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }
}

// Initialize the API handler
const geminiAPI = new GeminiAPI();

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Gemini Insight extension installed');
        // Set default settings
        chrome.storage.local.set({
            queriesCount: 0,
            lastUsed: '--',
            hotkey: 'Ctrl+Shift+G'
        });
    }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
    if (command === 'activate-overlay') {
        // Send message to active tab to activate sidebar
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'activateSidebar' });
            }
        });
    }
});

// Handle tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
        // Inject content script
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        }).catch(() => {
            // Page not suitable for injection
        });
    }
});
