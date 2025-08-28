// Dashboard Configuration
const CONFIG = {
    searchEngines: {
        google: 'https://www.google.com/search?q=',
        github: 'https://github.com/search?q='
    },
    defaultSettings: {
        theme: 'light',
        accentColor: '#8B5CF6',
        widgetOpacity: 0.9,
        showTimeWidget: true,
        showCalendarWidget: true,
        showTodoWidget: true,
        showQuickLinksWidget: true,
        showSystemWidget: true,
        showWeatherWidget: true,
        showImageDisplayerWidget: true,
        showBookmarksWidget: true
    },
    defaultQuickLinks: [
        { name: 'Google Drive', url: 'https://drive.google.com', icon: 'fab fa-google-drive' },
        { name: 'Gmail', url: 'https://mail.google.com', icon: 'fas fa-envelope' },
        { name: 'GitHub', url: 'https://github.com', icon: 'fab fa-github' },
        { name: 'Twitter', url: 'https://twitter.com', icon: 'fab fa-twitter' },
        { name: 'Calendar', url: 'https://calendar.google.com', icon: 'fas fa-calendar' },
        { name: 'World Time', url: 'https://worldtimeapi.org', icon: 'fas fa-globe' }
    ]
};

// Dashboard Class
class Dashboard {
    constructor() {
        this.settings = { ...CONFIG.defaultSettings };
        this.todos = [];
        this.quickLinks = [...CONFIG.defaultQuickLinks];
        this.bookmarks = [];
        this.currentDate = new Date();
        this.init();
    }

    async init() {
        await this.loadSettings();
        await this.loadTodos();
        await this.loadQuickLinks();
        await this.loadBookmarks();
        this.setupEventListeners();
        this.initializeWidgets();
        this.startUpdates();
    }

    // Settings Management
    async loadSettings() {
        try {
            const stored = await chrome.storage.sync.get('dashboardSettings');
            this.settings = { ...CONFIG.defaultSettings, ...stored.dashboardSettings };
            this.applySettings();
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

    applySettings() {
        // Apply theme
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        
        // Update theme toggle icon
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            icon.className = this.settings.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }

        // Apply accent color
        document.documentElement.style.setProperty('--accent-primary', this.settings.accentColor);
        
        // Apply widget opacity
        document.documentElement.style.setProperty('--bg-widget-opacity', this.settings.widgetOpacity);

        // Toggle widget visibility
        this.toggleWidgetVisibility();
    }

    toggleWidgetVisibility() {
        const widgets = {
            'time-widget': this.settings.showTimeWidget,
            'calendar-widget': this.settings.showCalendarWidget,
            'todo-widget': this.settings.showTodoWidget,
            'quick-links-widget': this.settings.showQuickLinksWidget,
            'system-widget': this.settings.showSystemWidget,
            'weather-widget': this.settings.showWeatherWidget,
            'image-displayer-widget': this.settings.showImageDisplayerWidget,
            'bookmarks-widget': this.settings.showBookmarksWidget
        };

        Object.entries(widgets).forEach(([className, visible]) => {
            const widget = document.querySelector(`.${className}`);
            if (widget) {
                widget.style.display = visible ? 'block' : 'none';
            }
        });
    }

    // Event Listeners
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchEngine = document.getElementById('searchEngine');
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.addEventListener('click', () => this.toggleTheme());

        // Settings modal
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsModal = document.getElementById('settingsModal');
        const closeSettings = document.getElementById('closeSettings');

        settingsBtn.addEventListener('click', () => this.openSettings());
        closeSettings.addEventListener('click', () => this.closeSettings());
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) this.closeSettings();
        });

        // Todo functionality
        const todoInput = document.getElementById('todoInput');
        const addTodoBtn = document.getElementById('addTodo');

        addTodoBtn.addEventListener('click', () => this.addTodo());
        todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });



        // Timezone selection
        const timezoneSelect = document.getElementById('timezoneSelect');
        timezoneSelect.addEventListener('change', () => this.updateWorldTime());

        // Settings form
        this.setupSettingsForm();
        
        // Quick Links management
        this.setupQuickLinksEventListeners();
        
        // Image Displayer functionality
        this.setupImageDisplayerEventListeners();
        
        // Bookmarks functionality
        this.setupBookmarksEventListeners();
    }

    // Search Functionality
    performSearch() {
        const query = document.getElementById('searchInput').value.trim();
        const engine = document.getElementById('searchEngine').value;
        
        if (query) {
            const searchUrl = CONFIG.searchEngines[engine] + encodeURIComponent(query);
            window.open(searchUrl, '_blank');
            document.getElementById('searchInput').value = '';
        }
    }

    // Theme Management
    toggleTheme() {
        this.settings.theme = this.settings.theme === 'light' ? 'dark' : 'light';
        this.applySettings();
        this.saveSettings();
    }

    // Settings Modal
    openSettings() {
        const modal = document.getElementById('settingsModal');
        modal.classList.add('show');
        this.populateSettingsForm();
    }

    closeSettings() {
        const modal = document.getElementById('settingsModal');
        modal.classList.remove('show');
    }

    setupSettingsForm() {
        const form = document.getElementById('settingsModal');
        const inputs = form.querySelectorAll('input');

        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.updateSetting(input);
            });
        });
    }

    populateSettingsForm() {
        // Widget visibility
        document.getElementById('showTimeWidget').checked = this.settings.showTimeWidget;
        document.getElementById('showCalendarWidget').checked = this.settings.showCalendarWidget;
        document.getElementById('showTodoWidget').checked = this.settings.showTodoWidget;
        document.getElementById('showQuickLinksWidget').checked = this.settings.showQuickLinksWidget;
        document.getElementById('showSystemWidget').checked = this.settings.showSystemWidget;
        document.getElementById('showWeatherWidget').checked = this.settings.showWeatherWidget;

        // Appearance
        document.getElementById('accentColor').value = this.settings.accentColor;
        document.getElementById('widgetOpacity').value = this.settings.widgetOpacity;
    }

    updateSetting(input) {
        const settingName = input.id;
        let value = input.type === 'checkbox' ? input.checked : input.value;

        if (input.type === 'range') {
            value = parseFloat(value);
        }

        this.settings[settingName] = value;
        this.applySettings();
        this.saveSettings();
    }

    // Todo Management
    async loadTodos() {
        try {
            const stored = await chrome.storage.sync.get('dashboardTodos');
            this.todos = stored.dashboardTodos || [];
            this.renderTodos();
        } catch (error) {
            console.error('Error loading todos:', error);
        }
    }

    async saveTodos() {
        try {
            await chrome.storage.sync.set({ dashboardTodos: this.todos });
        } catch (error) {
            console.error('Error saving todos:', error);
        }
    }

    addTodo() {
        const input = document.getElementById('todoInput');
        const text = input.value.trim();
        
        if (text) {
            const todo = {
                id: Date.now(),
                text: text,
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            this.todos.unshift(todo);
            this.saveTodos();
            this.renderTodos();
            input.value = '';
        }
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.renderTodos();
        }
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveTodos();
        this.renderTodos();
    }

    renderTodos() {
        const todoList = document.getElementById('todoList');
        todoList.innerHTML = '';

        this.todos.forEach(todo => {
            const todoItem = document.createElement('div');
            todoItem.className = 'todo-item';
            todoItem.innerHTML = `
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" onclick="dashboard.toggleTodo(${todo.id})">
                    ${todo.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <span class="todo-text ${todo.completed ? 'completed' : ''}">${todo.text}</span>
                <button class="todo-delete" onclick="dashboard.deleteTodo(${todo.id})">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            todoList.appendChild(todoItem);
        });
    }

    // Time Management
    updateTime() {
        const now = new Date();
        
        // Local time
        const localTime = document.getElementById('localTime');
        const localDate = document.getElementById('localDate');
        
        if (localTime) {
            localTime.textContent = now.toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
        
        if (localDate) {
            localDate.textContent = now.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }

        this.updateWorldTime();
    }

    updateWorldTime() {
        const timezoneSelect = document.getElementById('timezoneSelect');
        const worldTimeDisplay = document.getElementById('worldTime');
        
        if (!timezoneSelect || !worldTimeDisplay) return;

        const selectedTimezone = timezoneSelect.value;
        let time;

        if (selectedTimezone === 'local') {
            time = new Date();
        } else {
            try {
                time = new Date().toLocaleString('en-US', { timeZone: selectedTimezone });
                time = new Date(time);
            } catch (error) {
                time = new Date();
            }
        }

        worldTimeDisplay.textContent = time.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    // Date Display Management
    updateDateDisplay() {
        const bigDate = document.getElementById('bigDate');
        const dayName = document.getElementById('dayName');
        const dateQuote = document.getElementById('dateQuote');
        
        if (!bigDate || !dayName || !dateQuote) return;

        const today = new Date();
        
        // Update big date
        bigDate.textContent = today.getDate();
        
        // Update day name
        dayName.textContent = today.toLocaleDateString('en-US', { weekday: 'long' });
        
        // Update quote (rotating inspirational quotes)
        const quotes = [
            '"Every day is a new beginning."',
            '"Today is the first day of the rest of your life."',
            '"Make today amazing!"',
            '"Seize the day!"',
            '"Today is your day!"',
            '"Live in the moment."',
            '"Carpe diem!"',
            '"Today is full of possibilities."',
            '"Make it count!"',
            '"Today is a gift."'
        ];
        
        // Use the day of the year to select a quote (changes daily)
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const quoteIndex = dayOfYear % quotes.length;
        dateQuote.textContent = quotes[quoteIndex];
    }

    // System Monitor
    updateSystemMetrics() {
        // Simulate system metrics (in a real extension, you'd use chrome.system APIs)
        const cpuUsage = Math.floor(Math.random() * 30) + 20; // 20-50%
        const memoryUsage = Math.floor(Math.random() * 40) + 30; // 30-70%
        const storageUsage = Math.floor(Math.random() * 20) + 60; // 60-80%

        // Update CPU
        const cpuProgress = document.getElementById('cpuProgress');
        const cpuValue = document.getElementById('cpuValue');
        if (cpuProgress && cpuValue) {
            cpuProgress.style.width = `${cpuUsage}%`;
            cpuValue.textContent = `${cpuUsage}%`;
        }

        // Update Memory
        const memoryProgress = document.getElementById('memoryProgress');
        const memoryValue = document.getElementById('memoryValue');
        if (memoryProgress && memoryValue) {
            memoryProgress.style.width = `${memoryUsage}%`;
            memoryValue.textContent = `${memoryUsage}%`;
        }

        // Update Storage
        const storageProgress = document.getElementById('storageProgress');
        const storageValue = document.getElementById('storageValue');
        if (storageProgress && storageValue) {
            storageProgress.style.width = `${storageUsage}%`;
            storageValue.textContent = `${storageUsage}%`;
        }
    }

    // Widget Initialization
    initializeWidgets() {
        this.updateTime();
        this.updateDateDisplay();
        this.updateSystemMetrics();
    }

    // Start Updates
    startUpdates() {
        // Update time every second
        setInterval(() => this.updateTime(), 1000);
        
        // Update system metrics every 5 seconds
        setInterval(() => this.updateSystemMetrics(), 5000);
    }

    // Quick Links Management
    async loadQuickLinks() {
        try {
            const stored = await chrome.storage.sync.get('quickLinks');
            if (stored.quickLinks && stored.quickLinks.length > 0) {
                this.quickLinks = stored.quickLinks;
            }
            this.renderQuickLinks();
        } catch (error) {
            console.error('Error loading quick links:', error);
        }
    }

    async saveQuickLinks() {
        try {
            await chrome.storage.sync.set({ quickLinks: this.quickLinks });
        } catch (error) {
            console.error('Error saving quick links:', error);
        }
    }

    renderQuickLinks() {
        const quickLinksGrid = document.getElementById('quickLinksGrid');
        if (!quickLinksGrid) return;

        quickLinksGrid.innerHTML = '';
        
        this.quickLinks.forEach((link, index) => {
            const linkElement = document.createElement('a');
            linkElement.href = link.url;
            linkElement.className = 'quick-link';
            linkElement.target = '_blank';
            linkElement.innerHTML = `
                <i class="${link.icon}"></i>
                <span>${link.name}</span>
            `;
            quickLinksGrid.appendChild(linkElement);
        });
    }

    setupQuickLinksEventListeners() {
        const addQuickLinkBtn = document.getElementById('addQuickLink');
        const newLinkName = document.getElementById('newLinkName');
        const newLinkUrl = document.getElementById('newLinkUrl');
        const newLinkIcon = document.getElementById('newLinkIcon');

        if (addQuickLinkBtn) {
            addQuickLinkBtn.addEventListener('click', () => this.addQuickLink());
        }

        // Enable/disable add button based on form validity
        [newLinkName, newLinkUrl].forEach(input => {
            if (input) {
                input.addEventListener('input', () => this.validateQuickLinkForm());
            }
        });
    }

    validateQuickLinkForm() {
        const addBtn = document.getElementById('addQuickLink');
        const nameInput = document.getElementById('newLinkName');
        const urlInput = document.getElementById('newLinkUrl');

        if (addBtn && nameInput && urlInput) {
            const isValid = nameInput.value.trim() && urlInput.value.trim();
            addBtn.disabled = !isValid;
        }
    }

    addQuickLink() {
        const nameInput = document.getElementById('newLinkName');
        const urlInput = document.getElementById('newLinkUrl');
        const iconSelect = document.getElementById('newLinkIcon');

        if (!nameInput || !urlInput || !iconSelect) return;

        const name = nameInput.value.trim();
        const url = urlInput.value.trim();
        const icon = iconSelect.value;

        if (!name || !url) return;

        // Validate URL
        try {
            new URL(url);
        } catch {
            alert('Please enter a valid URL');
            return;
        }

        const newLink = { name, url, icon };
        this.quickLinks.push(newLink);
        this.saveQuickLinks();
        this.renderQuickLinks();
        this.renderQuickLinksList();

        // Clear form
        nameInput.value = '';
        urlInput.value = '';
        iconSelect.value = 'fas fa-link';
        this.validateQuickLinkForm();
    }

    renderQuickLinksList() {
        const quickLinksList = document.getElementById('quickLinksList');
        if (!quickLinksList) return;

        quickLinksList.innerHTML = '';

        this.quickLinks.forEach((link, index) => {
            const linkItem = document.createElement('div');
            linkItem.className = 'quick-link-item';
            linkItem.innerHTML = `
                <i class="${link.icon}"></i>
                <div class="link-info">
                    <div class="link-name">${link.name}</div>
                    <div class="link-url">${link.url}</div>
                </div>
                <div class="link-actions">
                    <button class="btn-edit" onclick="dashboard.editQuickLink(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="dashboard.deleteQuickLink(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            quickLinksList.appendChild(linkItem);
        });
    }

    editQuickLink(index) {
        const link = this.quickLinks[index];
        const linkItem = document.querySelector(`#quickLinksList .quick-link-item:nth-child(${index + 1})`);
        
        if (!linkItem) return;

        linkItem.className = 'quick-link-item editing';
        linkItem.innerHTML = `
            <i class="${link.icon}"></i>
            <div class="link-info">
                <input type="text" class="edit-name" value="${link.name}" maxlength="20">
                <input type="url" class="edit-url" value="${link.url}" required>
                <select class="edit-icon">
                    <option value="fas fa-link" ${link.icon === 'fas fa-link' ? 'selected' : ''}>🔗 Link</option>
                    <option value="fab fa-google-drive" ${link.icon === 'fab fa-google-drive' ? 'selected' : ''}>📁 Google Drive</option>
                    <option value="fas fa-envelope" ${link.icon === 'fas fa-envelope' ? 'selected' : ''}>📧 Email</option>
                    <option value="fab fa-github" ${link.icon === 'fab fa-github' ? 'selected' : ''}>🐙 GitHub</option>
                    <option value="fab fa-twitter" ${link.icon === 'fab fa-twitter' ? 'selected' : ''}>🐦 Twitter</option>
                    <option value="fas fa-calendar" ${link.icon === 'fas fa-calendar' ? 'selected' : ''}>📅 Calendar</option>
                    <option value="fas fa-globe" ${link.icon === 'fas fa-globe' ? 'selected' : ''}>🌍 Globe</option>
                    <option value="fab fa-youtube" ${link.icon === 'fab fa-youtube' ? 'selected' : ''}>📺 YouTube</option>
                    <option value="fab fa-facebook" ${link.icon === 'fab fa-facebook' ? 'selected' : ''}>📘 Facebook</option>
                    <option value="fab fa-instagram" ${link.icon === 'fab fa-instagram' ? 'selected' : ''}>📷 Instagram</option>
                    <option value="fab fa-linkedin" ${link.icon === 'fab fa-linkedin' ? 'selected' : ''}>💼 LinkedIn</option>
                    <option value="fab fa-reddit" ${link.icon === 'fab fa-reddit' ? 'selected' : ''}>🤖 Reddit</option>
                    <option value="fab fa-discord" ${link.icon === 'fab fa-discord' ? 'selected' : ''}>💬 Discord</option>
                    <option value="fab fa-slack" ${link.icon === 'fab fa-slack' ? 'selected' : ''}>💬 Slack</option>
                    <option value="fas fa-shopping-cart" ${link.icon === 'fas fa-shopping-cart' ? 'selected' : ''}>🛒 Shopping</option>
                    <option value="fas fa-newspaper" ${link.icon === 'fas fa-newspaper' ? 'selected' : ''}>📰 News</option>
                    <option value="fas fa-book" ${link.icon === 'fas fa-book' ? 'selected' : ''}>📚 Books</option>
                    <option value="fas fa-gamepad" ${link.icon === 'fas fa-gamepad' ? 'selected' : ''}>🎮 Games</option>
                    <option value="fas fa-music" ${link.icon === 'fas fa-music' ? 'selected' : ''}>🎵 Music</option>
                    <option value="fas fa-video" ${link.icon === 'fas fa-video' ? 'selected' : ''}>🎬 Video</option>
                    <option value="fas fa-code" ${link.icon === 'fas fa-code' ? 'selected' : ''}>💻 Code</option>
                    <option value="fas fa-palette" ${link.icon === 'fas fa-palette' ? 'selected' : ''}>🎨 Design</option>
                    <option value="fas fa-chart-line" ${link.icon === 'fas fa-chart-line' ? 'selected' : ''}>📈 Analytics</option>
                    <option value="fas fa-cloud" ${link.icon === 'fas fa-cloud' ? 'selected' : ''}>☁️ Cloud</option>
                    <option value="fas fa-home" ${link.icon === 'fas fa-home' ? 'selected' : ''}>🏠 Home</option>
                    <option value="fas fa-heart" ${link.icon === 'fas fa-heart' ? 'selected' : ''}>❤️ Health</option>
                    <option value="fas fa-car" ${link.icon === 'fas fa-car' ? 'selected' : ''}>🚗 Travel</option>
                    <option value="fas fa-graduation-cap" ${link.icon === 'fas fa-graduation-cap' ? 'selected' : ''}>🎓 Education</option>
                    <option value="fas fa-robot" ${link.icon === 'fas fa-robot' ? 'selected' : ''}>🤖 ChatGPT</option>
                    <option value="fas fa-brain" ${link.icon === 'fas fa-brain' ? 'selected' : ''}>🧠 Perplexity</option>
                </select>
            </div>
            <div class="link-actions">
                <button class="btn-save" onclick="dashboard.saveQuickLinkEdit(${index})">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn-cancel" onclick="dashboard.cancelQuickLinkEdit(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }

    saveQuickLinkEdit(index) {
        const linkItem = document.querySelector(`#quickLinksList .quick-link-item:nth-child(${index + 1})`);
        if (!linkItem) return;

        const nameInput = linkItem.querySelector('.edit-name');
        const urlInput = linkItem.querySelector('.edit-url');
        const iconSelect = linkItem.querySelector('.edit-icon');

        const name = nameInput.value.trim();
        const url = urlInput.value.trim();
        const icon = iconSelect.value;

        if (!name || !url) {
            alert('Please fill in all fields');
            return;
        }

        // Validate URL
        try {
            new URL(url);
        } catch {
            alert('Please enter a valid URL');
            return;
        }

        this.quickLinks[index] = {
            ...this.quickLinks[index],
            name,
            url,
            icon
        };

        this.saveQuickLinks();
        this.renderQuickLinks();
        this.renderQuickLinksList();
    }

    cancelQuickLinkEdit(index) {
        this.renderQuickLinksList();
    }

    deleteQuickLink(index) {
        if (confirm('Are you sure you want to delete this quick link?')) {
            this.quickLinks.splice(index, 1);
            this.saveQuickLinks();
            this.renderQuickLinks();
            this.renderQuickLinksList();
        }
    }

    // Override populateSettingsForm to include Quick Links
    populateSettingsForm() {
        // Existing settings population
        const checkboxes = {
            'showTimeWidget': this.settings.showTimeWidget,
            'showCalendarWidget': this.settings.showCalendarWidget,
            'showTodoWidget': this.settings.showTodoWidget,
            'showQuickLinksWidget': this.settings.showQuickLinksWidget,
            'showSystemWidget': this.settings.showSystemWidget,
            'showWeatherWidget': this.settings.showWeatherWidget,
            'showImageDisplayerWidget': this.settings.showImageDisplayerWidget,
            'showBookmarksWidget': this.settings.showBookmarksWidget
        };

        Object.entries(checkboxes).forEach(([id, checked]) => {
            const checkbox = document.getElementById(id);
            if (checkbox) checkbox.checked = checked;
        });

        const accentColor = document.getElementById('accentColor');
        if (accentColor) accentColor.value = this.settings.accentColor;

        const widgetOpacity = document.getElementById('widgetOpacity');
        if (widgetOpacity) widgetOpacity.value = this.settings.widgetOpacity;

        // Render Quick Links list
        this.renderQuickLinksList();
        this.validateQuickLinkForm();
    }

    // Image Displayer Methods
    setupImageDisplayerEventListeners() {
        const loadRandomImage = document.getElementById('loadRandomImage');
        const toggleImageDisplay = document.getElementById('toggleImageDisplay');
        const imageContainer = document.getElementById('imageContainer');
        const displayedImage = document.getElementById('displayedImage');
        const imagePlaceholder = document.getElementById('imagePlaceholder');

        if (loadRandomImage) {
            loadRandomImage.addEventListener('click', () => this.loadRandomImage());
        }

        if (toggleImageDisplay) {
            toggleImageDisplay.addEventListener('click', () => this.toggleImageDisplay());
        }

        if (imageContainer) {
            imageContainer.addEventListener('click', () => this.loadRandomImage());
        }
    }

    loadRandomImage() {
        const displayedImage = document.getElementById('displayedImage');
        const imagePlaceholder = document.getElementById('imagePlaceholder');
        const toggleBtn = document.getElementById('toggleImageDisplay');

        if (!displayedImage || !imagePlaceholder) return;

        // Generate a random number to get a different image
        const randomNum = Math.floor(Math.random() * 1000);
        const imageUrl = `https://picsum.photos/300/200?random=${randomNum}`;

        displayedImage.src = imageUrl;
        displayedImage.style.display = 'block';
        imagePlaceholder.style.display = 'none';

        // Update toggle button text
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide';
        }
    }

    toggleImageDisplay() {
        const displayedImage = document.getElementById('displayedImage');
        const imagePlaceholder = document.getElementById('imagePlaceholder');
        const toggleBtn = document.getElementById('toggleImageDisplay');

        if (!displayedImage || !imagePlaceholder || !toggleBtn) return;

        if (displayedImage.style.display === 'none') {
            displayedImage.style.display = 'block';
            imagePlaceholder.style.display = 'none';
            toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide';
        } else {
            displayedImage.style.display = 'none';
            imagePlaceholder.style.display = 'flex';
            toggleBtn.innerHTML = '<i class="fas fa-eye"></i> Show';
        }
    }

    // Bookmarks Methods
    async loadBookmarks() {
        try {
            const stored = await chrome.storage.sync.get('bookmarks');
            if (stored.bookmarks && stored.bookmarks.length > 0) {
                this.bookmarks = stored.bookmarks;
            }
            this.renderBookmarks();
        } catch (error) {
            console.error('Error loading bookmarks:', error);
        }
    }

    async saveBookmarks() {
        try {
            await chrome.storage.sync.set({ bookmarks: this.bookmarks });
        } catch (error) {
            console.error('Error saving bookmarks:', error);
        }
    }

    setupBookmarksEventListeners() {
        const addBookmarkBtn = document.getElementById('addBookmark');
        const bookmarkNameInput = document.getElementById('bookmarkName');
        const bookmarkUrlInput = document.getElementById('bookmarkUrl');

        if (addBookmarkBtn) {
            addBookmarkBtn.addEventListener('click', () => this.addBookmark());
        }

        if (bookmarkNameInput) {
            bookmarkNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addBookmark();
            });
        }

        if (bookmarkUrlInput) {
            bookmarkUrlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addBookmark();
            });
        }
    }

    addBookmark() {
        const nameInput = document.getElementById('bookmarkName');
        const urlInput = document.getElementById('bookmarkUrl');

        if (!nameInput || !urlInput) return;

        const name = nameInput.value.trim();
        const url = urlInput.value.trim();

        if (!name || !url) {
            alert('Please fill in both name and URL');
            return;
        }

        // Validate URL
        try {
            new URL(url);
        } catch {
            alert('Please enter a valid URL');
            return;
        }

        const newBookmark = { name, url, id: Date.now() };
        this.bookmarks.push(newBookmark);
        this.saveBookmarks();
        this.renderBookmarks();

        // Clear inputs
        nameInput.value = '';
        urlInput.value = '';
    }

    renderBookmarks() {
        const bookmarksList = document.getElementById('bookmarksList');
        if (!bookmarksList) return;

        bookmarksList.innerHTML = '';

        this.bookmarks.forEach((bookmark, index) => {
            const bookmarkItem = document.createElement('div');
            bookmarkItem.className = 'bookmark-item';
            bookmarkItem.innerHTML = `
                <i class="fas fa-bookmark"></i>
                <div class="bookmark-info">
                    <div class="bookmark-name">${bookmark.name}</div>
                    <a href="${bookmark.url}" target="_blank" class="bookmark-url">${bookmark.url}</a>
                </div>
                <div class="bookmark-actions">
                    <button class="bookmark-edit" onclick="dashboard.editBookmark(${index})" title="Edit bookmark">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="bookmark-delete" onclick="dashboard.deleteBookmark(${index})" title="Delete bookmark">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            bookmarksList.appendChild(bookmarkItem);
        });
    }

    editBookmark(index) {
        const bookmark = this.bookmarks[index];
        const bookmarkItem = document.querySelector(`#bookmarksList .bookmark-item:nth-child(${index + 1})`);
        
        if (!bookmarkItem) return;

        bookmarkItem.innerHTML = `
            <i class="fas fa-bookmark"></i>
            <div class="bookmark-info">
                <input type="text" class="edit-bookmark-name" value="${bookmark.name}" maxlength="30">
                <input type="url" class="edit-bookmark-url" value="${bookmark.url}" required>
            </div>
            <div class="bookmark-actions">
                <button class="bookmark-save" onclick="dashboard.saveBookmarkEdit(${index})" title="Save changes">
                    <i class="fas fa-check"></i>
                </button>
                <button class="bookmark-cancel" onclick="dashboard.cancelBookmarkEdit(${index})" title="Cancel">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }

    saveBookmarkEdit(index) {
        const bookmarkItem = document.querySelector(`#bookmarksList .bookmark-item:nth-child(${index + 1})`);
        if (!bookmarkItem) return;

        const nameInput = bookmarkItem.querySelector('.edit-bookmark-name');
        const urlInput = bookmarkItem.querySelector('.edit-bookmark-url');

        const name = nameInput.value.trim();
        const url = urlInput.value.trim();

        if (!name || !url) {
            alert('Please fill in all fields');
            return;
        }

        // Validate URL
        try {
            new URL(url);
        } catch {
            alert('Please enter a valid URL');
            return;
        }

        this.bookmarks[index] = {
            ...this.bookmarks[index],
            name,
            url
        };

        this.saveBookmarks();
        this.renderBookmarks();
    }

    cancelBookmarkEdit(index) {
        this.renderBookmarks();
    }

    deleteBookmark(index) {
        if (confirm('Are you sure you want to delete this bookmark?')) {
            this.bookmarks.splice(index, 1);
            this.saveBookmarks();
            this.renderBookmarks();
        }
    }
}

// Initialize Dashboard
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
});

// Global functions for event handlers
window.dashboard = dashboard;
