// WebDesk OS - Core Application

// Global state
const App = {
    socket: null,
    config: {},
    windows: [],
    activeWindow: null,
    zIndex: 100,
    desktopFiles: [],
    selectedFiles: [],
    isSelecting: false,
    selectionStart: null,
    
    // Initialize the application
    async init() {
        console.log('🖥️ WebDesk OS Initializing...');
        
        // Connect to WebSocket
        this.connectSocket();
        
        // Load configuration
        await this.loadConfig();
        
        // Initialize clock
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
        
        // Load desktop files
        await this.loadDesktopFiles();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize dock magnification
        this.initDockMagnification();
        
        // Show welcome notification
        this.showNotification('Welcome', 'WebDesk OS is ready!', 'info');
        
        console.log('✅ WebDesk OS Ready');
    },
    
    // WebSocket connection
    connectSocket() {
        this.socket = io('http://127.0.0.1:5000');
        
        this.socket.on('connect', () => {
            console.log('🔌 Connected to server');
        });
        
        this.socket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
        });
        
        this.socket.on('desktop_changed', (data) => {
            console.log('📁 Desktop changed:', data);
            this.loadDesktopFiles();
        });
        
        this.socket.on('command_result', (data) => {
            if (window.TerminalApp) {
                window.TerminalApp.handleCommandResult(data);
            }
        });
    },
    
    // Load configuration from server
    async loadConfig() {
        try {
            const response = await fetch('/api/config');
            this.config = await response.json();
            this.applyConfig();
        } catch (error) {
            console.error('Failed to load config:', error);
            this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        }
    },
    
    // Apply configuration
    applyConfig() {
        // Theme
        if (this.config.theme === 'light') {
            document.body.classList.add('light-theme');
        }
        
        // Dock position
        const dockContainer = document.getElementById('dock-container');
        dockContainer.className = '';
        if (this.config.dock_position !== 'bottom') {
            dockContainer.classList.add(this.config.dock_position);
        }
        
        // Dock size
        const dock = document.getElementById('dock');
        dock.className = '';
        if (this.config.dock_size !== 'medium') {
            dock.classList.add(this.config.dock_size);
        }
    },
    
    // Save configuration
    async saveConfig() {
        try {
            await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.config)
            });
        } catch (error) {
            console.error('Failed to save config:', error);
        }
    },
    
    // Load desktop files
    async loadDesktopFiles() {
        try {
            const response = await fetch('/api/desktop/files');
            const data = await response.json();
            if (data.success) {
                this.desktopFiles = data.files;
                this.renderDesktopIcons();
            }
        } catch (error) {
            console.error('Failed to load desktop files:', error);
        }
    },
    
    // Render desktop icons
    renderDesktopIcons() {
        const container = document.getElementById('desktop-icons');
        container.innerHTML = '';
        
        if (this.desktopFiles.length === 0) {
            container.innerHTML = `
                <div class="desktop-empty">
                    <div class="icon">📁</div>
                    <div>Desktop is empty</div>
                </div>
            `;
            return;
        }
        
        this.desktopFiles.forEach((file, index) => {
            const icon = document.createElement('div');
            icon.className = 'desktop-icon';
            icon.dataset.path = file.path;
            icon.dataset.index = index;
            
            const iconChar = this.getFileIcon(file);
            
            icon.innerHTML = `
                <div class="icon ${this.getIconClass(file)}">${iconChar}</div>
                <div class="label">${this.truncateName(file.name)}</div>
            `;
            
            icon.addEventListener('click', (e) => this.handleFileClick(e, file, index));
            icon.addEventListener('dblclick', () => this.handleFileDoubleClick(file));
            icon.addEventListener('contextmenu', (e) => this.handleFileContextMenu(e, file));
            
            container.appendChild(icon);
        });
    },
    
    // Get icon for file type
    getFileIcon(file) {
        if (file.is_directory) return '📁';
        
        const ext = file.extension.toLowerCase();
        const iconMap = {
            '.txt': '📄', '.doc': '📝', '.docx': '📝', '.pdf': '📕',
            '.jpg': '🖼️', '.jpeg': '🖼️', '.png': '🖼️', '.gif': '🖼️', '.bmp': '🖼️',
            '.mp4': '🎬', '.avi': '🎬', '.mov': '🎬', '.mkv': '🎬',
            '.mp3': '🎵', '.wav': '🎵', '.flac': '🎵',
            '.zip': '📦', '.rar': '📦', '.tar': '📦', '.gz': '📦',
            '.js': '💻', '.py': '💻', '.html': '🌐', '.css': '🎨',
            '.exe': '⚙️', '.app': '⚙️', '.lnk': '⚙️'
        };
        
        return iconMap[ext] || '📄';
    },
    
    // Get icon CSS class
    getIconClass(file) {
        if (file.is_directory) return 'icon-folder';
        
        const ext = file.extension.toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext)) return 'icon-image';
        if (['.mp4', '.avi', '.mov', '.mkv'].includes(ext)) return 'icon-video';
        if (['.mp3', '.wav', '.flac'].includes(ext)) return 'icon-audio';
        if (['.txt', '.doc', '.docx', '.pdf'].includes(ext)) return 'icon-document';
        if (['.zip', '.rar', '.tar', '.gz'].includes(ext)) return 'icon-archive';
        if (['.js', '.py', '.html', '.css'].includes(ext)) return 'icon-code';
        
        return 'icon-file';
    },
    
    // Truncate long filenames
    truncateName(name, maxLength = 15) {
        if (name.length <= maxLength) return name;
        const ext = name.slice(name.lastIndexOf('.'));
        const base = name.slice(0, name.lastIndexOf('.'));
        if (base.length + ext.length > maxLength) {
            return base.slice(0, maxLength - ext.length - 3) + '...' + ext;
        }
        return name;
    },
    
    // Handle file click
    handleFileClick(e, file, index) {
        if (e.shiftKey && this.selectedFiles.length > 0) {
            // Range select
            const lastIndex = this.selectedFiles[this.selectedFiles.length - 1];
            const start = Math.min(lastIndex, index);
            const end = Math.max(lastIndex, index);
            this.selectedFiles = [];
            for (let i = start; i <= end; i++) {
                this.selectedFiles.push(i);
            }
        } else if (e.ctrlKey || e.metaKey) {
            // Toggle selection
            const pos = this.selectedFiles.indexOf(index);
            if (pos > -1) {
                this.selectedFiles.splice(pos, 1);
            } else {
                this.selectedFiles.push(index);
            }
        } else {
            this.selectedFiles = [index];
        }
        
        this.updateSelectionUI();
    },
    
    // Handle file double-click
    handleFileDoubleClick(file) {
        if (file.is_directory) {
            // Open Finder window for folder
            if (window.FinderApp) {
                window.FinderApp.openFolder(file.path);
            }
        } else {
            // Open file with default application
            fetch('/api/files/open', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: file.path })
            }).then(r => r.json()).then(data => {
                if (!data.success) {
                    this.showNotification('Error', data.error, 'error');
                }
            });
        }
    },
    
    // Handle file context menu
    handleFileContextMenu(e, file) {
        e.preventDefault();
        if (window.ContextMenu) {
            window.ContextMenu.show(e.clientX, e.clientY, file);
        }
    },
    
    // Update selection UI
    updateSelectionUI() {
        document.querySelectorAll('.desktop-icon').forEach((icon, index) => {
            if (this.selectedFiles.includes(index)) {
                icon.classList.add('selected');
            } else {
                icon.classList.remove('selected');
            }
        });
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Desktop click to deselect
        document.getElementById('desktop').addEventListener('click', (e) => {
            if (e.target.id === 'desktop' || e.target.id === 'desktop-icons') {
                this.selectedFiles = [];
                this.updateSelectionUI();
            }
        });
        
        // Selection rectangle
        document.getElementById('desktop').addEventListener('mousedown', (e) => {
            if (e.target.id === 'desktop' || e.target.id === 'desktop-icons') {
                this.startSelection(e);
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Cmd/Ctrl + Space for Spotlight
            if ((e.metaKey || e.ctrlKey) && e.code === 'Space') {
                e.preventDefault();
                if (window.Spotlight) window.Spotlight.toggle();
            }
            
            // Escape to close things
            if (e.code === 'Escape') {
                this.selectedFiles = [];
                this.updateSelectionUI();
                if (window.ContextMenu) window.ContextMenu.hide();
                if (window.Spotlight) window.Spotlight.hide();
            }
            
            // Delete key
            if (e.code === 'Delete' || e.code === 'Backspace') {
                if (this.selectedFiles.length > 0 && !document.activeElement.tagName.match(/INPUT|TEXTAREA/)) {
                    this.deleteSelectedFiles();
                }
            }
        });
        
        // Clock click
        document.querySelector('.clock-container').addEventListener('click', () => {
            this.showNotification('Calendar', new Date().toLocaleDateString(), 'info');
        });
        
        // Control center
        document.getElementById('control-center-btn').addEventListener('click', () => {
            this.toggleControlCenter();
        });
    },
    
    // Start selection rectangle
    startSelection(e) {
        this.isSelecting = true;
        this.selectionStart = { x: e.clientX, y: e.clientY };
        
        const rect = document.getElementById('selection-rectangle');
        rect.style.left = e.clientX + 'px';
        rect.style.top = e.clientY + 'px';
        rect.style.width = '0';
        rect.style.height = '0';
        rect.classList.remove('hidden');
        
        document.addEventListener('mousemove', this.handleSelectionMove);
        document.addEventListener('mouseup', this.handleSelectionEnd);
    },
    
    handleSelectionMove: (e) => {
        if (!App.isSelecting) return;
        
        const rect = document.getElementById('selection-rectangle');
        const x = Math.min(App.selectionStart.x, e.clientX);
        const y = Math.min(App.selectionStart.y, e.clientY);
        const width = Math.abs(App.selectionStart.x - e.clientX);
        const height = Math.abs(App.selectionStart.y - e.clientY);
        
        rect.style.left = x + 'px';
        rect.style.top = y + 'px';
        rect.style.width = width + 'px';
        rect.style.height = height + 'px';
        
        // Check which icons are in the selection
        const selectRect = rect.getBoundingClientRect();
        document.querySelectorAll('.desktop-icon').forEach((icon, index) => {
            const iconRect = icon.getBoundingClientRect();
            if (
                iconRect.right >= selectRect.left &&
                iconRect.left <= selectRect.right &&
                iconRect.bottom >= selectRect.top &&
                iconRect.top <= selectRect.bottom
            ) {
                if (!App.selectedFiles.includes(index)) {
                    App.selectedFiles.push(index);
                }
            } else {
                App.selectedFiles = App.selectedFiles.filter(i => i !== index);
            }
        });
        App.updateSelectionUI();
    },
    
    handleSelectionEnd: () => {
        App.isSelecting = false;
        App.selectionStart = null;
        document.getElementById('selection-rectangle').classList.add('hidden');
        document.removeEventListener('mousemove', App.handleSelectionMove);
        document.removeEventListener('mouseup', App.handleSelectionEnd);
    },
    
    // Delete selected files
    async deleteSelectedFiles() {
        if (!confirm(`Delete ${this.selectedFiles.length} item(s)?`)) return;
        
        for (const index of this.selectedFiles) {
            const file = this.desktopFiles[index];
            if (file) {
                await fetch('/api/files/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: file.path })
                });
            }
        }
        
        this.selectedFiles = [];
        this.updateSelectionUI();
        this.loadDesktopFiles();
        this.showNotification('Deleted', 'Items moved to trash', 'info');
    },
    
    // Update clock
    updateClock() {
        const now = new Date();
        const timeEl = document.getElementById('clock-time');
        const dateEl = document.getElementById('clock-date');
        
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        if (this.config.clock_format === '12h') {
            hours = hours % 12 || 12;
            timeEl.textContent = `${hours}:${minutes} ${ampm}`;
        } else {
            timeEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes}`;
        }
        
        dateEl.textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },
    
    // Toggle control center
    toggleControlCenter() {
        const dropdown = document.getElementById('control-center-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
        }
    },
    
    // Initialize dock magnification
    initDockMagnification() {
        const dockItems = document.querySelectorAll('.dock-item');
        
        dockItems.forEach(item => {
            item.addEventListener('mousemove', (e) => {
                const rect = item.getBoundingClientRect();
                const mouseX = e.clientX - rect.left - rect.width / 2;
                const distance = Math.abs(mouseX);
                
                if (distance < 50) {
                    const scale = 1 + (50 - distance) / 100;
                    item.style.transform = `scale(${scale})`;
                }
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.transform = 'scale(1)';
            });
        });
    },
    
    // Show notification
    showNotification(title, message, type = 'info') {
        if (window.Notifications) {
            window.Notifications.show(title, message, type);
        }
    },
    
    // Create a new window
    createWindow(title, content, options = {}) {
        if (window.WindowManager) {
            return window.WindowManager.createWindow(title, content, options);
        }
        return null;
    },
    
    // Bring window to front
    bringToFront(windowEl) {
        this.zIndex++;
        windowEl.style.zIndex = this.zIndex;
        this.activeWindow = windowEl;
        
        document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
        windowEl.classList.add('focused');
    }
};

// Default configuration
const DEFAULT_CONFIG = {
    theme: 'dark',
    dock_position: 'bottom',
    dock_size: 'medium',
    icon_size: 'medium',
    clock_format: '12h',
    wallpaper: 'default',
    pinned_apps: ['finder', 'terminal', 'notes', 'calculator'],
    recent_apps: []
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
