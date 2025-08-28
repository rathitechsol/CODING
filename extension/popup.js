// Popup Configuration
const POPUP_CONFIG = {
    defaultSettings: {
        theme: 'light',
        accentColor: '#8B5CF6'
    }
};

// Popup Class
class Popup {
    constructor() {
        this.settings = { ...POPUP_CONFIG.defaultSettings };
        this.init();
    }

    async init() {
        await this.loadSettings();
        await this.loadQuickLinks();
        this.setupEventListeners();
        this.updateStats();
        this.startUpdates();
    }

    // Settings Management
    async loadSettings() {
        try {
            const stored = await chrome.storage.sync.get('dashboardSettings');
            if (stored.dashboardSettings) {
                this.settings = { ...POPUP_CONFIG.defaultSettings, ...stored.dashboardSettings };
                this.applyTheme();
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings() {
        try {
            await chrome.storage.sync.set({ dashboardSettings: this.settings });
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        this.updateThemeButton();
    }

    updateThemeButton() {
        const themeBtn = document.getElementById('themeToggle');
        const icon = themeBtn.querySelector('i');
        const text = themeBtn.querySelector('span');

        if (this.settings.theme === 'dark') {
            icon.className = 'fas fa-sun';
            text.textContent = 'Switch to Light Mode';
        } else {
            icon.className = 'fas fa-moon';
            text.textContent = 'Switch to Dark Mode';
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Open new tab button
        const openNewTabBtn = document.getElementById('openNewTab');
        openNewTabBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'chrome://newtab' });
            window.close();
        });

        // Open settings button
        const openSettingsBtn = document.getElementById('openSettings');
        openSettingsBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'chrome://newtab' });
            window.close();
        });

        // Theme toggle
        const themeBtn = document.getElementById('themeToggle');
        themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Theme Management
    async toggleTheme() {
        this.settings.theme = this.settings.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        await this.saveSettings();
    }

    // Stats Management
    async updateStats() {
        await this.updateTodoCount();
        this.updateCurrentTime();
    }

    async updateTodoCount() {
        try {
            const stored = await chrome.storage.sync.get('dashboardTodos');
            const todos = stored.dashboardTodos || [];
            const activeTodos = todos.filter(todo => !todo.completed).length;
            
            const todoCountElement = document.getElementById('todoCount');
            if (todoCountElement) {
                todoCountElement.textContent = activeTodos;
            }
        } catch (error) {
            console.error('Error updating todo count:', error);
        }
    }

    updateCurrentTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const currentTimeElement = document.getElementById('currentTime');
        if (currentTimeElement) {
            currentTimeElement.textContent = timeString;
        }
    }

    // Start Updates
    startUpdates() {
        // Update time every second
        setInterval(() => this.updateCurrentTime(), 1000);
        
        // Update stats every 30 seconds
        setInterval(() => this.updateStats(), 30000);
    }

    // Quick Links Management
    async loadQuickLinks() {
        try {
            const stored = await chrome.storage.sync.get('quickLinks');
            if (stored.quickLinks && stored.quickLinks.length > 0) {
                this.quickLinks = stored.quickLinks;
            } else {
                // Use default quick links if none stored
                this.quickLinks = [
                    { name: 'Google Drive', url: 'https://drive.google.com', icon: 'fab fa-google-drive' },
                    { name: 'Gmail', url: 'https://mail.google.com', icon: 'fas fa-envelope' },
                    { name: 'GitHub', url: 'https://github.com', icon: 'fab fa-github' },
                    { name: 'Calendar', url: 'https://calendar.google.com', icon: 'fas fa-calendar' }
                ];
            }
            this.renderQuickLinks();
        } catch (error) {
            console.error('Error loading quick links:', error);
        }
    }

    renderQuickLinks() {
        const quickLinksGrid = document.getElementById('popupQuickLinksGrid');
        if (!quickLinksGrid) return;

        quickLinksGrid.innerHTML = '';
        
        // Show only first 4 quick links in popup for space
        const linksToShow = this.quickLinks.slice(0, 4);
        
        linksToShow.forEach((link) => {
            const linkElement = document.createElement('a');
            linkElement.href = link.url;
            linkElement.className = 'link-item';
            linkElement.target = '_blank';
            linkElement.innerHTML = `
                <i class="${link.icon}"></i>
                <span>${link.name}</span>
            `;
            quickLinksGrid.appendChild(linkElement);
        });
    }
}

// Initialize Popup
document.addEventListener('DOMContentLoaded', () => {
    new Popup();
});
