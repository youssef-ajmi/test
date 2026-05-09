// Dock and App Launcher

const Dock = {
    runningApps: new Set(),
    
    init() {
        this.setupDockItems();
    },
    
    setupDockItems() {
        const dockItems = document.querySelectorAll('.dock-item');
        
        dockItems.forEach(item => {
            item.addEventListener('click', () => {
                const app = item.dataset.app;
                this.launchApp(app);
            });
        });
    },
    
    launchApp(appName) {
        console.log('Launching app:', appName);
        
        switch(appName) {
            case 'finder':
                if (window.FinderApp) FinderApp.open();
                break;
            case 'launchpad':
                this.toggleLaunchpad();
                break;
            case 'terminal':
                if (window.TerminalApp) TerminalApp.open();
                break;
            case 'notes':
                if (window.NotesApp) NotesApp.open();
                break;
            case 'calculator':
                if (window.CalculatorApp) CalculatorApp.open();
                break;
            case 'weather':
                if (window.WeatherApp) WeatherApp.open();
                break;
            case 'settings':
                if (window.SettingsApp) SettingsApp.open();
                break;
            case 'trash':
                App.showNotification('Trash', 'Trash is empty', 'info');
                break;
        }
        
        // Mark app as running
        this.markRunning(appName);
    },
    
    markRunning(appName) {
        const item = document.querySelector(`.dock-item[data-app="${appName}"]`);
        if (item) {
            const dot = item.querySelector('.dock-dot');
            if (dot) dot.classList.remove('hidden');
        }
        this.runningApps.add(appName);
    },
    
    unmarkRunning(appName) {
        const item = document.querySelector(`.dock-item[data-app="${appName}"]`);
        if (item) {
            const dot = item.querySelector('.dock-dot');
            if (dot) dot.classList.add('hidden');
        }
        this.runningApps.delete(appName);
    },
    
    toggleLaunchpad() {
        const launchpad = document.getElementById('launchpad');
        if (launchpad.classList.contains('hidden')) {
            this.showLaunchpad();
        } else {
            this.hideLaunchpad();
        }
    },
    
    async showLaunchpad() {
        const launchpad = document.getElementById('launchpad');
        const grid = document.getElementById('launchpad-grid');
        
        // Load apps
        try {
            const response = await fetch('/api/apps/list');
            const data = await response.json();
            
            grid.innerHTML = '';
            
            if (data.success && data.apps.length > 0) {
                data.apps.forEach(app => {
                    const appEl = document.createElement('div');
                    appEl.className = 'launchpad-app';
                    appEl.innerHTML = `
                        <div class="icon">🚀</div>
                        <div class="name">${app.name}</div>
                    `;
                    appEl.addEventListener('click', () => {
                        fetch('/api/apps/launch', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ path: app.path })
                        });
                        this.hideLaunchpad();
                    });
                    grid.appendChild(appEl);
                });
            } else {
                grid.innerHTML = '<div style="color: white; text-align: center;">No apps found</div>';
            }
        } catch (error) {
            console.error('Failed to load apps:', error);
        }
        
        launchpad.classList.remove('hidden');
    },
    
    hideLaunchpad() {
        document.getElementById('launchpad').classList.add('hidden');
    }
};

// Spotlight Search
const Spotlight = {
    isOpen: false,
    results: [],
    
    init() {
        this.setupListeners();
    },
    
    setupListeners() {
        const input = document.getElementById('spotlight-input');
        
        input.addEventListener('input', (e) => {
            this.search(e.target.value);
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.code === 'Enter') {
                this.selectResult();
            } else if (e.code === 'Escape') {
                this.hide();
            }
        });
        
        document.getElementById('spotlight').addEventListener('click', (e) => {
            if (e.target.id === 'spotlight') {
                this.hide();
            }
        });
    },
    
    toggle() {
        if (this.isOpen) {
            this.hide();
        } else {
            this.show();
        }
    },
    
    show() {
        const spotlight = document.getElementById('spotlight');
        const input = document.getElementById('spotlight-input');
        
        spotlight.classList.remove('hidden');
        input.value = '';
        input.focus();
        this.results = [];
        document.getElementById('spotlight-results').innerHTML = '';
        this.isOpen = true;
    },
    
    hide() {
        document.getElementById('spotlight').classList.add('hidden');
        this.isOpen = false;
    },
    
    async search(query) {
        if (!query || query.length < 1) {
            document.getElementById('spotlight-results').innerHTML = '';
            return;
        }
        
        const resultsContainer = document.getElementById('spotlight-results');
        resultsContainer.innerHTML = '<div style="padding: 20px; color: var(--text-secondary);">Searching...</div>';
        
        try {
            // Search desktop files
            const files = App.desktopFiles.filter(f => 
                f.name.toLowerCase().includes(query.toLowerCase())
            );
            
            // Search apps
            const appsResponse = await fetch('/api/apps/list');
            const appsData = await appsResponse.json();
            const apps = appsData.success ? appsData.apps.slice(0, 10) : [];
            
            this.results = [
                ...files.map(f => ({ type: 'file', ...f })),
                ...apps.map(a => ({ type: 'app', ...a }))
            ].slice(0, 20);
            
            this.renderResults();
        } catch (error) {
            console.error('Search failed:', error);
            resultsContainer.innerHTML = '<div style="padding: 20px; color: var(--text-secondary);">Search error</div>';
        }
    },
    
    renderResults() {
        const container = document.getElementById('spotlight-results');
        
        if (this.results.length === 0) {
            container.innerHTML = '<div style="padding: 20px; color: var(--text-secondary);">No results found</div>';
            return;
        }
        
        container.innerHTML = '';
        
        this.results.forEach((result, index) => {
            const el = document.createElement('div');
            el.className = 'spotlight-result';
            el.dataset.index = index;
            
            const icon = result.type === 'app' ? '🚀' : (result.is_directory ? '📁' : '📄');
            const typeText = result.type === 'app' ? 'Application' : (result.is_directory ? 'Folder' : 'File');
            
            el.innerHTML = `
                <div class="spotlight-result-icon">${icon}</div>
                <div class="spotlight-result-info">
                    <div class="spotlight-result-name">${result.name}</div>
                    <div class="spotlight-result-type">${typeText}</div>
                </div>
            `;
            
            el.addEventListener('click', () => {
                if (result.type === 'app') {
                    fetch('/api/apps/launch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ path: result.path })
                    });
                } else {
                    if (result.is_directory) {
                        if (window.FinderApp) FinderApp.openFolder(result.path);
                    } else {
                        fetch('/api/files/open', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ path: result.path })
                        });
                    }
                }
                this.hide();
            });
            
            container.appendChild(el);
        });
    },
    
    selectResult() {
        const selected = document.querySelector('.spotlight-result.selected');
        if (selected) {
            selected.click();
        }
    }
};

window.Spotlight = Spotlight;
window.Dock = Dock;
window.toggleLaunchpad = () => Dock.toggleLaunchpad();
window.filterLaunchpad = () => {
    const query = document.getElementById('launchpad-search').value.toLowerCase();
    document.querySelectorAll('.launchpad-app').forEach(app => {
        const name = app.querySelector('.name').textContent.toLowerCase();
        app.style.display = name.includes(query) ? 'flex' : 'none';
    });
};

// Initialize dock
Dock.init();
Spotlight.init();
