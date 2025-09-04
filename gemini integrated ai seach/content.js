class ScreenOverlay {
    constructor() {
        this.isActive = false;
        this.overlay = null;
        this.sidebar = null;
        this.selection = null;
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;
        this.isSelecting = false;
        this.currentMode = null;
        this.currentAnswer = null;
        this.init();
    }

    init() {
        this.createOverlay();
        this.bindEvents();
        this.listenForMessages();
    }

    createOverlay() {
        // Remove existing overlays if they exist
        const existingOverlay = document.getElementById('gemini-overlay');
        const existingSidebar = document.getElementById('gemini-sidebar');
        
        if (existingOverlay) {
            existingOverlay.remove();
        }
        if (existingSidebar) {
            existingSidebar.remove();
        }
        
        // Create overlay container
        this.overlay = document.createElement('div');
        this.overlay.id = 'gemini-overlay';
        this.overlay.innerHTML = `
            <div class="overlay-backdrop"></div>
            <div class="selection-tool">
                <div class="crosshair"></div>
                <div class="selection-box"></div>
                <div class="action-panel">
                    <div class="ai-options">
                        <button class="ai-btn solve-btn" data-action="solve">
                            <span class="icon">🧠</span>
                            Solve
                        </button>
                        <button class="ai-btn summarize-btn" data-action="summarize">
                            <span class="icon">📝</span>
                            Summarize
                        </button>
                        <button class="ai-btn explain-btn" data-action="explain">
                            <span class="icon">💡</span>
                            Explain
                        </button>
                        <button class="ai-btn read-btn" data-action="read">
                            <span class="icon">📖</span>
                            Read
                        </button>
                    </div>
                    <button class="cancel-btn">Cancel</button>
                </div>
            </div>
            <div class="answer-panel" style="display: none;">
                <div class="answer-header">
                    <h3>Gemini Answer</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="answer-content">
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>Analyzing your selection...</p>
                    </div>
                </div>
            </div>
        `;
        
        // Create sidebar container
        this.sidebar = document.createElement('div');
        this.sidebar.id = 'gemini-sidebar';
        this.sidebar.innerHTML = `
            <div class="sidebar-backdrop"></div>
            <div class="sidebar-container">
                <div class="sidebar-header">
                    <div class="header-content">
                        <h3>Gemini Insight</h3>
                        <div class="header-actions">
                            <button class="minimize-btn" title="Minimize">−</button>
                            <button class="close-btn" title="Close">&times;</button>
                        </div>
                    </div>
                </div>
                
                <div class="sidebar-content">
                    <div class="chat-mode" id="chatMode">
                        <div class="chat-header">
                            <h4>Chat with Gemini</h4>
                            <p>Ask any question or select content to analyze</p>
                        </div>
                        
                        <div class="chat-container">
                            <div class="chat-messages" id="chatMessages">
                                <div class="welcome-message">
                                    <div class="message bot-message">
                                        <div class="message-avatar">🤖</div>
                                        <div class="message-content">
                                            <p>Hello! I'm Gemini. You can ask me anything or select content on the page to analyze. How can I help you today?</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="chat-input-container">
                                <div class="input-wrapper">
                                    <textarea id="chatInput" placeholder="Ask me anything..." rows="1"></textarea>
                                    <button id="sendButton" class="send-btn">
                                        <span class="send-icon">➤</span>
                                    </button>
                                </div>
                                <div class="quick-actions">
                                    <button class="quick-btn" data-action="solve">🧠 Solve</button>
                                    <button class="quick-btn" data-action="summarize">📝 Summarize</button>
                                    <button class="quick-btn" data-action="explain">💡 Explain</button>
                                    <button class="quick-btn" data-action="read">📖 Read</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="selection-mode" id="selectionMode" style="display: none;">
                        <div class="mode-header">
                            <h4>Select Content to Analyze</h4>
                            <p>Click and drag to select any area on the page</p>
                        </div>
                        <div class="selection-tool">
                            <div class="crosshair"></div>
                            <div class="selection-box"></div>
                        </div>
                        <div class="action-panel" id="actionPanel">
                            <div class="ai-options">
                                <button class="ai-btn solve-btn" data-action="solve">
                                    <span class="icon">🧠</span>
                                    <span class="label">Solve</span>
                                </button>
                                <button class="ai-btn summarize-btn" data-action="summarize">
                                    <span class="icon">📝</span>
                                    <span class="label">Summarize</span>
                                </button>
                                <button class="ai-btn explain-btn" data-action="explain">
                                    <span class="icon">💡</span>
                                    <span class="label">Explain</span>
                                </button>
                                <button class="ai-btn read-btn" data-action="read">
                                    <span class="icon">📖</span>
                                    <span class="label">Read</span>
                                </button>
                            </div>
                            <button class="cancel-btn">Back to Chat</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.sidebar);
    }

    bindEvents() {
        // Overlay events
        const overlay = this.overlay;
        const overlayBackdrop = overlay.querySelector('.overlay-backdrop');
        const overlayCancelBtn = overlay.querySelector('.cancel-btn');
        const overlayCloseBtn = overlay.querySelector('.close-btn');
        const overlayAiButtons = overlay.querySelectorAll('.ai-btn');

        // Sidebar events
        const sidebar = this.sidebar;
        const sidebarBackdrop = sidebar.querySelector('.sidebar-backdrop');
        const sidebarCancelBtn = sidebar.querySelector('.cancel-btn');
        const sidebarCloseBtn = sidebar.querySelector('.close-btn');
        const minimizeBtn = sidebar.querySelector('.minimize-btn');
        const newSelectionBtns = sidebar.querySelectorAll('.new-selection-btn');
        const copyBtn = sidebar.querySelector('.copy-btn');
        const sidebarAiButtons = sidebar.querySelectorAll('.ai-btn');
        
        // Chat events
        const chatInput = sidebar.querySelector('#chatInput');
        const sendButton = sidebar.querySelector('#sendButton');
        const quickButtons = sidebar.querySelectorAll('.quick-btn');

        // Mouse events for selection (both overlay and sidebar)
        overlayBackdrop.addEventListener('mousedown', (e) => this.startSelection(e));
        sidebarBackdrop.addEventListener('mousedown', (e) => this.startSelection(e));
        document.addEventListener('mousemove', (e) => this.updateSelection(e));
        document.addEventListener('mouseup', (e) => this.endSelection(e));

        // Overlay button events
        overlayAiButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                this.solveSelection(action, 'overlay');
            });
        });
        
        overlayCancelBtn.addEventListener('click', () => this.deactivateOverlay());
        overlayCloseBtn.addEventListener('click', () => this.deactivateOverlay());

        // Sidebar button events
        sidebarAiButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                this.solveSelection(action, 'sidebar');
            });
        });
        
        sidebarCancelBtn.addEventListener('click', () => this.deactivateSidebar());
        sidebarCloseBtn.addEventListener('click', () => this.deactivateSidebar());
        minimizeBtn.addEventListener('click', () => this.minimize());
        
        newSelectionBtns.forEach(btn => {
            btn.addEventListener('click', () => this.startNewSelection());
        });
        
        copyBtn.addEventListener('click', () => this.copyAnswer());

        // Chat event handlers
        sendButton.addEventListener('click', () => this.sendMessage());
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        chatInput.addEventListener('input', () => this.autoResizeTextarea());
        
        quickButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                this.startSelectionMode(action);
            });
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                this.deactivate();
            }
        });
    }

    listenForMessages() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            try {
                if (request.action === 'activateOverlay') {
                    this.activateOverlay();
                    sendResponse({ success: true });
                } else if (request.action === 'activateSidebar') {
                    this.activateSidebar();
                    sendResponse({ success: true });
                } else {
                    sendResponse({ success: false, error: 'Unknown action' });
                }
            } catch (error) {
                console.error('Error handling message:', error);
                sendResponse({ success: false, error: error.message });
            }
            return true; // Keep message channel open for async response
        });
    }

    activateOverlay() {
        try {
            console.log('Activating overlay...');
            this.isActive = true;
            this.currentMode = 'overlay';
            this.overlay.style.display = 'block';
            this.sidebar.style.display = 'none';
            document.body.style.overflow = 'hidden';
            this.showInstructions();
            console.log('Overlay activated successfully');
        } catch (error) {
            console.error('Error in activateOverlay:', error);
            throw error;
        }
    }

    activateSidebar() {
        this.isActive = true;
        this.currentMode = 'sidebar';
        this.sidebar.style.display = 'block';
        this.overlay.style.display = 'none';
        
        // Slide in animation
        setTimeout(() => {
            this.sidebar.classList.add('active');
        }, 10);
        
        this.showChatMode();
    }

    deactivate() {
        this.isActive = false;
        this.currentMode = null;
        
        if (this.overlay.style.display !== 'none') {
            this.deactivateOverlay();
        }
        if (this.sidebar.style.display !== 'none') {
            this.deactivateSidebar();
        }
    }

    deactivateOverlay() {
        this.isActive = false;
        this.overlay.style.display = 'none';
        document.body.style.overflow = '';
        this.resetSelection();
    }

    deactivateSidebar() {
        this.isActive = false;
        this.sidebar.classList.remove('active');
        
        // Hide after animation
        setTimeout(() => {
            this.sidebar.style.display = 'none';
        }, 300);
        
        this.resetSelection();
        this.showSelectionMode();
    }

    minimize() {
        this.overlay.classList.toggle('minimized');
    }

    showChatMode() {
        const chatMode = this.sidebar.querySelector('#chatMode');
        const selectionMode = this.sidebar.querySelector('#selectionMode');
        
        chatMode.style.display = 'block';
        selectionMode.style.display = 'none';
        this.resetSelection();
    }

    showSelectionMode(action = null) {
        const chatMode = this.sidebar.querySelector('#chatMode');
        const selectionMode = this.sidebar.querySelector('#selectionMode');
        
        chatMode.style.display = 'none';
        selectionMode.style.display = 'block';
        this.resetSelection();
        
        if (action) {
            this.pendingAction = action;
        }
    }

    showResultMode() {
        const selectionMode = this.sidebar.querySelector('#selectionMode');
        const resultMode = this.sidebar.querySelector('#resultMode');
        
        selectionMode.style.display = 'none';
        resultMode.style.display = 'block';
    }

    startNewSelection() {
        this.showChatMode();
        this.resetSelection();
    }

    startSelectionMode(action) {
        this.showSelectionMode(action);
    }

    showInstructions() {
        const instructions = document.createElement('div');
        instructions.className = 'instructions';
        instructions.innerHTML = `
            <div class="instructions-content">
                <h3>Select an area to analyze</h3>
                <p>Click and drag to select the question or problem you want to solve</p>
                <p><strong>Press ESC to cancel</strong></p>
            </div>
        `;
        
        // Append to the overlay backdrop
        const backdrop = this.overlay.querySelector('.overlay-backdrop');
        if (backdrop) {
            backdrop.appendChild(instructions);
        } else {
            this.overlay.appendChild(instructions);
        }
        
        setTimeout(() => {
            if (instructions.parentNode) {
                instructions.remove();
            }
        }, 3000);
    }

    startSelection(e) {
        if (!this.isActive) return;
        
        this.isSelecting = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.endX = e.clientX;
        this.endY = e.clientY;
        
        this.updateSelectionBox();
    }

    updateSelection(e) {
        if (!this.isSelecting || !this.isActive) return;
        
        this.endX = e.clientX;
        this.endY = e.clientY;
        this.updateSelectionBox();
    }

    endSelection(e) {
        if (!this.isSelecting || !this.isActive) return;
        
        this.isSelecting = false;
        this.endX = e.clientX;
        this.endY = e.clientY;
        
        // Calculate selection bounds
        const left = Math.min(this.startX, this.endX);
        const top = Math.min(this.startY, this.endY);
        const width = Math.abs(this.endX - this.startX);
        const height = Math.abs(this.endY - this.startY);
        
        if (width > 10 && height > 10) {
            this.selection = { left, top, width, height };
            this.showActionPanel();
        } else {
            this.resetSelection();
        }
    }

    updateSelectionBox() {
        const selectionBox = this.overlay.querySelector('.selection-box');
        const left = Math.min(this.startX, this.endX);
        const top = Math.min(this.startY, this.endY);
        const width = Math.abs(this.endX - this.startX);
        const height = Math.abs(this.endY - this.startY);
        
        selectionBox.style.left = left + 'px';
        selectionBox.style.top = top + 'px';
        selectionBox.style.width = width + 'px';
        selectionBox.style.height = height + 'px';
        selectionBox.style.display = 'block';
    }

    resetSelection() {
        const selectionBox = this.overlay.querySelector('.selection-box');
        const actionPanel = this.overlay.querySelector('.action-panel');
        
        selectionBox.style.display = 'none';
        actionPanel.style.display = 'none';
        this.selection = null;
    }

    showActionPanel() {
        const actionPanel = this.overlay.querySelector('.action-panel');
        const left = Math.min(this.startX, this.endX);
        const top = Math.min(this.startY, this.endY);
        const width = Math.abs(this.endX - this.startX);
        
        actionPanel.style.left = (left + width / 2 - 100) + 'px';
        actionPanel.style.top = (top - 60) + 'px';
        actionPanel.style.display = 'flex';
    }

    async solveSelection(action = 'solve', mode = 'overlay') {
        if (!this.selection) return;
        
        try {
            if (mode === 'sidebar') {
                this.showResultMode();
                this.showLoading();
            } else {
                this.showAnswerPanel();
                this.showLoading();
            }
            
            // Extract text content from the selected area
            const { textContent, pageContext } = await this.extractPageContent();
            
            // Send to background script for API call
            const response = await chrome.runtime.sendMessage({
                action: 'processWithGemini',
                textContent: textContent,
                pageContext: pageContext,
                selection: this.selection,
                aiAction: action
            });
            
            if (response.success) {
                this.showAnswer(response.answer, action, mode);
            } else {
                this.showError(response.error, mode);
            }
        } catch (error) {
            console.error('Error processing selection:', error);
            this.showError('Failed to process your selection. Please try again.', mode);
        }
    }

    async captureSelection() {
        return new Promise(async (resolve) => {
            try {
                // First, try to extract text content from the selected area
                const textContent = this.extractTextFromSelection();
                
                // Create a canvas for visual representation
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = this.selection.width;
                canvas.height = this.selection.height;
                
                // Fill background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, this.selection.width, this.selection.height);
                
                // Add border
                ctx.strokeStyle = '#667eea';
                ctx.lineWidth = 2;
                ctx.strokeRect(1, 1, this.selection.width - 2, this.selection.height - 2);
                
                // Add text content if available
                if (textContent) {
                    ctx.fillStyle = '#374151';
                    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    
                    // Wrap text to fit in the selection
                    const lines = this.wrapText(ctx, textContent, this.selection.width - 20);
                    const lineHeight = 16;
                    const startY = 10;
                    
                    lines.forEach((line, index) => {
                        if (index * lineHeight < this.selection.height - 20) {
                            ctx.fillText(line, 10, startY + (index * lineHeight));
                        }
                    });
                } else {
                    // Fallback visual representation
                    ctx.fillStyle = '#6b7280';
                    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('Selected Area', this.selection.width / 2, this.selection.height / 2);
                }
                
                resolve({ canvas, textContent });
            } catch (error) {
                console.error('Error capturing selection:', error);
                // Fallback to simple canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = this.selection.width;
                canvas.height = this.selection.height;
                ctx.fillStyle = '#f8f9fa';
                ctx.fillRect(0, 0, this.selection.width, this.selection.height);
                resolve({ canvas, textContent: null });
            }
        });
    }

    extractTextFromSelection() {
        try {
            const elements = document.elementsFromPoint(
                this.selection.left + this.selection.width / 2,
                this.selection.top + this.selection.height / 2
            );
            
            // Find the best element that contains text
            let bestElement = null;
            let maxTextLength = 0;
            
            for (const element of elements) {
                const rect = element.getBoundingClientRect();
                if (this.isElementInSelection(rect)) {
                    const text = element.innerText || element.textContent || '';
                    if (text.length > maxTextLength && text.trim().length > 0) {
                        maxTextLength = text.length;
                        bestElement = element;
                    }
                }
            }
            
            if (bestElement) {
                return bestElement.innerText || bestElement.textContent || '';
            }
            
            // Fallback: try to get text from all elements in the selection
            const allElements = document.querySelectorAll('*');
            let extractedText = '';
            
            allElements.forEach(element => {
                const rect = element.getBoundingClientRect();
                if (this.isElementInSelection(rect)) {
                    const text = element.innerText || element.textContent || '';
                    if (text.trim().length > 0 && !extractedText.includes(text)) {
                        extractedText += text + ' ';
                    }
                }
            });
            
            return extractedText.trim();
        } catch (error) {
            console.error('Error extracting text:', error);
            return null;
        }
    }

    isElementInSelection(rect) {
        return !(rect.right < this.selection.left || 
                rect.left > this.selection.right || 
                rect.bottom < this.selection.top || 
                rect.top > this.selection.bottom);
    }

    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    async extractPageContent() {
        try {
            // Get the page title and URL for context
            const pageContext = {
                title: document.title,
                url: window.location.href,
                domain: window.location.hostname
            };

            // Extract text from the selected area
            let selectedText = this.extractTextFromSelection();
            
            // If no text found in selection, try to get text from the entire page
            if (!selectedText || selectedText.trim().length < 10) {
                selectedText = this.extractTextFromPage();
            }

            // Get additional context from the page
            const pageText = this.extractTextFromPage();
            
            return {
                textContent: selectedText,
                pageContext: pageContext,
                fullPageText: pageText
            };
        } catch (error) {
            console.error('Error extracting page content:', error);
            return {
                textContent: 'Unable to extract content',
                pageContext: { title: document.title, url: window.location.href },
                fullPageText: ''
            };
        }
    }

    extractTextFromPage() {
        try {
            // Remove script and style elements
            const elementsToRemove = document.querySelectorAll('script, style, nav, header, footer, aside, .ad, .advertisement, .sidebar');
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = document.body.innerHTML;
            
            elementsToRemove.forEach(el => {
                const elements = tempDiv.querySelectorAll(el.tagName + (el.className ? '.' + el.className.split(' ').join('.') : ''));
                elements.forEach(e => e.remove());
            });

            // Extract text content
            let text = tempDiv.innerText || tempDiv.textContent || '';
            
            // Clean up the text
            text = text
                .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                .replace(/\n\s*\n/g, '\n') // Remove empty lines
                .trim();

            return text;
        } catch (error) {
            console.error('Error extracting page text:', error);
            return document.body.innerText || document.body.textContent || '';
        }
    }

    showAnswerPanel() {
        const answerPanel = this.overlay.querySelector('.answer-panel');
        answerPanel.style.display = 'block';
        answerPanel.style.left = '50%';
        answerPanel.style.top = '50%';
        answerPanel.style.transform = 'translate(-50%, -50%)';
    }

    hideAnswer() {
        const answerPanel = this.overlay.querySelector('.answer-panel');
        answerPanel.style.display = 'none';
    }

    showLoading() {
        if (this.currentMode === 'sidebar') {
            const resultContent = this.sidebar.querySelector('#resultContent');
            resultContent.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Analyzing your selection...</p>
                </div>
            `;
        } else {
            const answerContent = this.overlay.querySelector('.answer-content');
            answerContent.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Analyzing your selection...</p>
                </div>
            `;
        }
    }

    showAnswer(answer, action = 'solve', mode = 'overlay') {
        const actionTitles = {
            solve: 'Solution',
            summarize: 'Summary',
            explain: 'Explanation',
            read: 'Content Analysis'
        };
        
        if (mode === 'sidebar') {
            const resultIcon = this.sidebar.querySelector('#resultIcon');
            const resultTitle = this.sidebar.querySelector('#resultTitle');
            const resultContent = this.sidebar.querySelector('#resultContent');
            const resultActions = this.sidebar.querySelector('#resultActions');
            
            // Update header
            resultIcon.textContent = this.getActionIcon(action);
            resultTitle.textContent = actionTitles[action] || 'Response';
            
            // Update content
            resultContent.innerHTML = `
                <div class="answer-text">
                    <p>${answer}</p>
                </div>
            `;
            
            // Show actions
            resultActions.style.display = 'flex';
        } else {
            const answerContent = this.overlay.querySelector('.answer-content');
            answerContent.innerHTML = `
                <div class="answer-text">
                    <div class="action-header">
                        <span class="action-icon">${this.getActionIcon(action)}</span>
                        <h4>${actionTitles[action] || 'Response'}</h4>
                    </div>
                    <div class="answer-body">
                        <p>${answer}</p>
                    </div>
                </div>
                <div class="answer-actions">
                    <button class="copy-btn">Copy Answer</button>
                    <button class="new-selection-btn">New Selection</button>
                </div>
            `;
            
            // Bind new button events
            const copyBtn = answerContent.querySelector('.copy-btn');
            const newSelectionBtn = answerContent.querySelector('.new-selection-btn');
            
            copyBtn.addEventListener('click', () => this.copyAnswer(answer));
            newSelectionBtn.addEventListener('click', () => {
                this.hideAnswer();
                this.resetSelection();
            });
        }
        
        // Store answer for copying
        this.currentAnswer = answer;
    }

    getActionIcon(action) {
        const icons = {
            solve: '🧠',
            summarize: '📝',
            explain: '💡',
            read: '📖'
        };
        return icons[action] || '🤖';
    }

    showError(error, mode = 'overlay') {
        if (mode === 'sidebar') {
            const resultContent = this.sidebar.querySelector('#resultContent');
            resultContent.innerHTML = `
                <div class="error">
                    <div class="error-icon">⚠️</div>
                    <p>${error}</p>
                    <button class="retry-btn">Try Again</button>
                </div>
            `;
            
            const retryBtn = resultContent.querySelector('.retry-btn');
            retryBtn.addEventListener('click', () => {
                this.solveSelection('solve', 'sidebar');
            });
        } else {
            const answerContent = this.overlay.querySelector('.answer-content');
            answerContent.innerHTML = `
                <div class="error">
                    <div class="error-icon">⚠️</div>
                    <p>${error}</p>
                    <button class="retry-btn">Try Again</button>
                </div>
            `;
            
            const retryBtn = answerContent.querySelector('.retry-btn');
            retryBtn.addEventListener('click', () => {
                this.solveSelection('solve', 'overlay');
            });
        }
    }

    async copyAnswer() {
        if (!this.currentAnswer) return;
        
        try {
            await navigator.clipboard.writeText(this.currentAnswer);
            // Show brief success message
            const copyBtn = this.overlay.querySelector('.copy-btn');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        } catch (error) {
            console.error('Error copying text:', error);
        }
    }

    async sendMessage() {
        const chatInput = this.sidebar.querySelector('#chatInput');
        const message = chatInput.value.trim();
        
        if (!message) return;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input
        chatInput.value = '';
        this.autoResizeTextarea();
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Get page context
            const { textContent, pageContext } = await this.extractPageContent();
            
            // Send to background script for API call
            const response = await chrome.runtime.sendMessage({
                action: 'processWithGemini',
                textContent: message,
                pageContext: pageContext,
                selection: null,
                aiAction: 'chat'
            });
            
            // Remove typing indicator
            this.hideTypingIndicator();
            
            if (response.success) {
                this.addMessage(response.answer, 'bot');
            } else {
                this.addMessage('Sorry, I encountered an error. Please try again.', 'bot', true);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'bot', true);
        }
    }

    addMessage(content, sender, isError = false) {
        const chatMessages = this.sidebar.querySelector('#chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = sender === 'user' ? '👤' : '🤖';
        const messageClass = isError ? 'error-message' : '';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content ${messageClass}">
                <p>${content}</p>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    showTypingIndicator() {
        const chatMessages = this.sidebar.querySelector('#chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = this.sidebar.querySelector('#typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    autoResizeTextarea() {
        const chatInput = this.sidebar.querySelector('#chatInput');
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    }
}

// Initialize overlay when content script loads
const overlay = new ScreenOverlay();
