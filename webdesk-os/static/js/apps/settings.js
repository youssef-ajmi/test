// Settings App

const SettingsApp = {
    window: null,
    currentCategory: 'general',
    
    open() {
        if (this.window) {
            WindowManager.restoreWindow(this.window);
            return;
        }
        
        const content = `
            <div class="settings-container">
                <div class="settings-sidebar">
                    <div class="settings-category ${this.currentCategory === 'general' ? 'active' : ''}" onclick="SettingsApp.showCategory('general')">
                        <span>🔧</span> General
                    </div>
                    <div class="settings-category ${this.currentCategory === 'appearance' ? 'active' : ''}" onclick="SettingsApp.showCategory('appearance')">
                        <span>🎨</span> Appearance
                    </div>
                    <div class="settings-category ${this.currentCategory === 'dock' ? 'active' : ''}" onclick="SettingsApp.showCategory('dock')">
                        <span>⚓</span> Dock
                    </div>
                    <div class="settings-category ${this.currentCategory === 'desktop' ? 'active' : ''}" onclick="SettingsApp.showCategory('desktop')">
                        <span>🖥️</span> Desktop
                    </div>
                </div>
                <div class="settings-content" id="settings-content"></div>
            </div>
        `;
        
        this.window = WindowManager.createWindow('Settings', content, {
            width: 650,
            height: 450
        });
        
        this.showCategory('general');
    },
    
    showCategory(category) {
        this.currentCategory = category;
        const content = document.getElementById('settings-content');
        if (!content) return;
        
        // Update sidebar
        document.querySelectorAll('.settings-category').forEach(el => {
            el.classList.remove('active');
        });
        document.querySelector(`.settings-category[onclick*="${category}"]`)?.classList.add('active');
        
        // Render content
        switch(category) {
            case 'general':
                content.innerHTML = this.renderGeneral();
                break;
            case 'appearance':
                content.innerHTML = this.renderAppearance();
                break;
            case 'dock':
                content.innerHTML = this.renderDock();
                break;
            case 'desktop':
                content.innerHTML = this.renderDesktop();
                break;
        }
    },
    
    renderGeneral() {
        return `
            <div class="setting-group">
                <h3>About WebDesk OS</h3>
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">🖥️</div>
                    <div style="font-size: 18px; font-weight: 600;">WebDesk OS</div>
                    <div style="color: var(--text-secondary);">Version 1.0.0</div>
                    <div style="margin-top: 20px; font-size: 13px; color: var(--text-secondary);">
                        A macOS-style desktop environment<br>running as Lively Wallpaper
                    </div>
                </div>
            </div>
            <div class="setting-group">
                <h3>System Info</h3>
                <div class="setting-item">
                    <label>Platform</label>
                    <span style="color: var(--text-secondary);">${navigator.platform}</span>
                </div>
                <div class="setting-item">
                    <label>Browser</label>
                    <span style="color: var(--text-secondary);">${navigator.userAgent.split(' ').pop()}</span>
                </div>
            </div>
        `;
    },
    
    renderAppearance() {
        const config = App.config || {};
        return `
            <div class="setting-group">
                <h3>Theme</h3>
                <div class="setting-item">
                    <label>Dark Mode</label>
                    <label class="toggle-switch">
                        <input type="checkbox" ${config.theme !== 'light' ? 'checked' : ''} onchange="SettingsApp.toggleTheme(this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>
            <div class="setting-group">
                <h3>Clock Format</h3>
                <div class="setting-item">
                    <label>12-Hour Clock</label>
                    <label class="toggle-switch">
                        <input type="checkbox" ${config.clock_format === '12h' ? 'checked' : ''} onchange="SettingsApp.toggleClockFormat(this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>
        `;
    },
    
    renderDock() {
        const config = App.config || {};
        return `
            <div class="setting-group">
                <h3>Dock Position</h3>
                <div class="setting-item">
                    <label>Position</label>
                    <select class="setting-select" onchange="SettingsApp.setDockPosition(this.value)">
                        <option value="bottom" ${config.dock_position === 'bottom' ? 'selected' : ''}>Bottom</option>
                        <option value="left" ${config.dock_position === 'left' ? 'selected' : ''}>Left</option>
                        <option value="right" ${config.dock_position === 'right' ? 'selected' : ''}>Right</option>
                    </select>
                </div>
            </div>
            <div class="setting-group">
                <h3>Dock Size</h3>
                <div class="setting-item">
                    <label>Size</label>
                    <select class="setting-select" onchange="SettingsApp.setDockSize(this.value)">
                        <option value="small" ${config.dock_size === 'small' ? 'selected' : ''}>Small</option>
                        <option value="medium" ${config.dock_size === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="large" ${config.dock_size === 'large' ? 'selected' : ''}>Large</option>
                    </select>
                </div>
            </div>
        `;
    },
    
    renderDesktop() {
        return `
            <div class="setting-group">
                <h3>Desktop</h3>
                <div class="setting-item">
                    <label>Show Desktop Icons</label>
                    <label class="toggle-switch">
                        <input type="checkbox" checked onchange="document.getElementById('desktop-icons').style.display = this.checked ? 'grid' : 'none'">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>
            <div class="setting-group">
                <h3>Reset</h3>
                <button onclick="localStorage.clear(); location.reload();" style="padding: 10px 20px; background: var(--danger-color); color: white; border: none; border-radius: 6px; cursor: pointer;">
                    Reset All Settings
                </button>
            </div>
        `;
    },
    
    toggleTheme(isDark) {
        App.config.theme = isDark ? 'dark' : 'light';
        document.body.classList.toggle('light-theme', !isDark);
        App.saveConfig();
    },
    
    toggleClockFormat(is12Hour) {
        App.config.clock_format = is12Hour ? '12h' : '24h';
        App.updateClock();
        App.saveConfig();
    },
    
    setDockPosition(position) {
        App.config.dock_position = position;
        const dockContainer = document.getElementById('dock-container');
        dockContainer.className = '';
        if (position !== 'bottom') {
            dockContainer.classList.add(position);
        }
        App.saveConfig();
    },
    
    setDockSize(size) {
        App.config.dock_size = size;
        const dock = document.getElementById('dock');
        dock.className = '';
        if (size !== 'medium') {
            dock.classList.add(size);
        }
        App.saveConfig();
    },
    
    close() {
        if (this.window) {
            WindowManager.closeWindow(this.window);
            this.window = null;
        }
    }
};

window.SettingsApp = SettingsApp;
