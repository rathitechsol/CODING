class GeminiInsightPopup {
    constructor() {
        this.isAuthenticated = false;
        this.apiKey = null;
        this.init();
    }

    async init() {
        await this.checkAuthStatus();
        this.bindEvents();
        this.updateUI();
    }

    async checkAuthStatus() {
        try {
            const result = await chrome.storage.local.get(['isAuthenticated', 'apiKey', 'userInfo']);
            this.isAuthenticated = result.isAuthenticated || false;
            this.apiKey = result.apiKey || null;
            this.userInfo = result.userInfo || null;
            
            if (this.isAuthenticated && this.apiKey) {
                this.updateStatus('connected', 'Connected to Gemini');
            } else {
                this.updateStatus('disconnected', 'Not connected');
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            this.updateStatus('disconnected', 'Error checking connection');
        }
    }

    bindEvents() {
        document.getElementById('loginBtn').addEventListener('click', () => this.handleLogin());
        document.getElementById('activateOverlayBtn').addEventListener('click', () => this.activateOverlay());
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
        document.getElementById('backToMainBtn').addEventListener('click', () => this.showMain());
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());
        document.getElementById('saveApiKeyBtn').addEventListener('click', () => this.saveApiKey());
        document.getElementById('changeHotkeyBtn').addEventListener('click', () => this.changeHotkey());
    }

    async handleLogin() {
        try {
            this.updateStatus('connecting', 'Connecting...');
            
            // For demo purposes, we'll use a simple API key approach
            // In production, you'd implement proper OAuth2 flow
            const apiKey = prompt('Enter your Gemini API key:');
            if (apiKey) {
                await chrome.storage.local.set({
                    isAuthenticated: true,
                    apiKey: apiKey,
                    userInfo: { email: 'user@example.com', name: 'User' }
                });
                
                this.isAuthenticated = true;
                this.apiKey = apiKey;
                this.updateStatus('connected', 'Connected to Gemini');
                this.updateUI();
            } else {
                this.updateStatus('disconnected', 'Authentication cancelled');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.updateStatus('disconnected', 'Authentication failed');
        }
    }

    async handleLogout() {
        try {
            await chrome.storage.local.clear();
            this.isAuthenticated = false;
            this.apiKey = null;
            this.userInfo = null;
            this.updateStatus('disconnected', 'Signed out');
            this.updateUI();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    async activateOverlay() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if it's a valid tab
            if (!tab || !tab.id) {
                alert('No active tab found. Please try again.');
                return;
            }
            
            // Check if it's a chrome:// page
            if (tab.url && tab.url.startsWith('chrome://')) {
                alert('This extension cannot be used on Chrome internal pages. Please navigate to a regular website.');
                return;
            }
            
            // Try to send message to content script
            try {
                await chrome.tabs.sendMessage(tab.id, { action: 'activateOverlay' });
                window.close();
            } catch (messageError) {
                // Content script might not be loaded, try to inject it
                console.log('Content script not found, injecting...');
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });
                
                // Wait a moment for injection to complete
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Try sending message again
                await chrome.tabs.sendMessage(tab.id, { action: 'activateOverlay' });
                window.close();
            }
        } catch (error) {
            console.error('Error activating overlay:', error);
            alert('Error activating overlay. Please refresh the page and try again.');
        }
    }

    showSettings() {
        document.getElementById('mainSection').style.display = 'none';
        document.getElementById('settingsSection').style.display = 'block';
        document.getElementById('apiKeyInput').value = this.apiKey || '';
    }

    showMain() {
        document.getElementById('settingsSection').style.display = 'none';
        document.getElementById('mainSection').style.display = 'block';
    }

    async saveApiKey() {
        const apiKey = document.getElementById('apiKeyInput').value.trim();
        if (apiKey) {
            try {
                await chrome.storage.local.set({ apiKey: apiKey });
                this.apiKey = apiKey;
                this.updateStatus('connected', 'API key saved');
            } catch (error) {
                console.error('Error saving API key:', error);
                alert('Error saving API key');
            }
        }
    }

    async changeHotkey() {
        const currentHotkey = document.getElementById('hotkeyInput').value;
        const newHotkey = prompt(
            `Enter new hotkey combination:\n\n` +
            `Examples:\n` +
            `• Ctrl+Shift+G\n` +
            `• Alt+Q\n` +
            `• Ctrl+Alt+Space\n` +
            `• F1\n` +
            `• Ctrl+Plus\n\n` +
            `Current hotkey: ${currentHotkey}`,
            currentHotkey
        );
        
        if (newHotkey && newHotkey !== currentHotkey) {
            try {
                // Normalize the hotkey (handle common variations)
                const normalizedHotkey = this.normalizeHotkey(newHotkey);
                
                // Validate hotkey format
                if (this.validateHotkey(normalizedHotkey)) {
                    await chrome.storage.local.set({ hotkey: normalizedHotkey });
                    document.getElementById('hotkeyInput').value = normalizedHotkey;
                    this.updateStatus('connected', 'Hotkey updated');
                    
                    // Update the command in the manifest (this would require extension reload)
                    this.showHotkeyUpdateMessage();
                } else {
                    alert(
                        'Invalid hotkey format!\n\n' +
                        'Valid examples:\n' +
                        '• Ctrl+Shift+G\n' +
                        '• Alt+Q\n' +
                        '• Ctrl+Alt+Space\n' +
                        '• F1\n' +
                        '• Ctrl+Plus\n\n' +
                        'Make sure to use valid modifier keys (Ctrl, Alt, Shift, Cmd) and valid keys (A-Z, 0-9, F1-F12, etc.)'
                    );
                }
            } catch (error) {
                console.error('Error updating hotkey:', error);
                alert('Error updating hotkey');
            }
        }
    }

    normalizeHotkey(hotkey) {
        // Normalize common variations
        return hotkey
            .replace(/\s+/g, '') // Remove spaces
            .replace(/control/gi, 'Ctrl')
            .replace(/command/gi, 'Cmd')
            .replace(/meta/gi, 'Cmd')
            .replace(/\+/g, '+') // Ensure proper separator
            .split('+')
            .map(part => {
                // Handle special cases
                if (part.toLowerCase() === 'space') return 'Space';
                if (part.toLowerCase() === 'enter') return 'Enter';
                if (part.toLowerCase() === 'tab') return 'Tab';
                if (part.toLowerCase() === 'escape') return 'Escape';
                if (part.toLowerCase() === 'backspace') return 'Backspace';
                if (part.toLowerCase() === 'delete') return 'Delete';
                if (part.toLowerCase() === 'insert') return 'Insert';
                if (part.toLowerCase() === 'home') return 'Home';
                if (part.toLowerCase() === 'end') return 'End';
                if (part.toLowerCase() === 'pageup') return 'PageUp';
                if (part.toLowerCase() === 'pagedown') return 'PageDown';
                if (part.toLowerCase() === 'arrowup' || part.toLowerCase() === 'up') return 'ArrowUp';
                if (part.toLowerCase() === 'arrowdown' || part.toLowerCase() === 'down') return 'ArrowDown';
                if (part.toLowerCase() === 'arrowleft' || part.toLowerCase() === 'left') return 'ArrowLeft';
                if (part.toLowerCase() === 'arrowright' || part.toLowerCase() === 'right') return 'ArrowRight';
                if (part.toLowerCase() === 'plus') return 'Plus';
                if (part.toLowerCase() === 'minus') return 'Minus';
                if (part.toLowerCase() === 'equal') return 'Equal';
                
                // Handle F keys
                if (part.match(/^f\d+$/i)) {
                    return part.toUpperCase();
                }
                
                // Handle numbers
                if (part.match(/^\d+$/)) {
                    return part;
                }
                
                // Handle letters
                if (part.match(/^[a-z]$/i)) {
                    return part.toUpperCase();
                }
                
                // Capitalize first letter of each part
                return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
            })
            .join('+');
    }

    validateHotkey(hotkey) {
        // More flexible validation for hotkey format
        const validModifiers = ['Ctrl', 'Alt', 'Shift', 'Cmd', 'Meta', 'Control', 'Command'];
        const validKeys = [
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
            'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
            'Space', 'Enter', 'Tab', 'Escape', 'Backspace', 'Delete', 'Insert', 'Home', 'End', 'PageUp', 'PageDown',
            'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
            'Plus', 'Minus', 'Equal', 'BracketLeft', 'BracketRight', 'Semicolon', 'Quote', 'Backquote', 'Backslash', 'Comma', 'Period', 'Slash',
            'Up', 'Down', 'Left', 'Right', 'UpArrow', 'DownArrow', 'LeftArrow', 'RightArrow'
        ];
        
        const parts = hotkey.split('+').map(part => part.trim());
        
        // Allow single keys (like F1, Escape, etc.)
        if (parts.length === 1) {
            return validKeys.includes(parts[0]);
        }
        
        if (parts.length < 2) return false;
        
        // Check if all parts except the last are valid modifiers
        for (let i = 0; i < parts.length - 1; i++) {
            if (!validModifiers.includes(parts[i])) {
                return false;
            }
        }
        
        // Last part should be a valid key
        const lastPart = parts[parts.length - 1];
        return validKeys.includes(lastPart);
    }

    showHotkeyUpdateMessage() {
        const message = document.createElement('div');
        message.className = 'hotkey-message';
        message.innerHTML = `
            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 12px; border-radius: 6px; margin-top: 12px; font-size: 12px; color: #155724;">
                <strong>Note:</strong> The extension needs to be reloaded for the new hotkey to take effect. 
                Go to chrome://extensions/ and click the reload button for this extension.
            </div>
        `;
        
        const settingsSection = document.getElementById('settingsSection');
        settingsSection.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 5000);
    }

    updateStatus(status, text) {
        const indicator = document.getElementById('statusIndicator');
        const dot = indicator.querySelector('.status-dot');
        const textElement = document.getElementById('statusText');
        
        dot.className = `status-dot ${status}`;
        textElement.textContent = text;
    }

    updateUI() {
        const authSection = document.getElementById('authSection');
        const mainSection = document.getElementById('mainSection');
        
        if (this.isAuthenticated) {
            authSection.style.display = 'none';
            mainSection.style.display = 'block';
            this.loadStats();
        } else {
            authSection.style.display = 'block';
            mainSection.style.display = 'none';
        }
    }

    async loadStats() {
        try {
            const result = await chrome.storage.local.get(['queriesCount', 'lastUsed', 'hotkey']);
            document.getElementById('queriesCount').textContent = result.queriesCount || 0;
            document.getElementById('lastUsed').textContent = result.lastUsed || '--';
            document.getElementById('hotkeyInput').value = result.hotkey || 'Alt+Q';
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GeminiInsightPopup();
});
