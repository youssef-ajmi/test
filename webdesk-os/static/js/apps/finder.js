// Finder App (File Browser)

const FinderApp = {
    window: null,
    currentPath: '',
    history: [],
    historyIndex: -1,
    
    open() {
        if (this.window) {
            WindowManager.restoreWindow(this.window);
            return;
        }
        
        this.openFolder(App.desktopFiles.length > 0 ? App.desktopFiles[0]?.path?.split(/[\\/]/).slice(0, -1).join('/') : '');
    },
    
    async openFolder(path) {
        if (!path) path = await this.getHomePath();
        
        this.currentPath = path;
        
        const content = `
            <div class="finder-window">
                <div class="finder-sidebar">
                    <div class="sidebar-section">
                        <div class="sidebar-section-title">Favorites</div>
                        <div class="sidebar-item" onclick="FinderApp.openFolder('${await this.getDesktopPath()}')">
                            <span class="sidebar-item-icon">🖥️</span> Desktop
                        </div>
                        <div class="sidebar-item" onclick="FinderApp.openFolder('${await this.getDocumentsPath()}')">
                            <span class="sidebar-item-icon">📄</span> Documents
                        </div>
                        <div class="sidebar-item" onclick="FinderApp.openFolder('${await this.getDownloadsPath()}')">
                            <span class="sidebar-item-icon">⬇️</span> Downloads
                        </div>
                    </div>
                    <div class="sidebar-section">
                        <div class="sidebar-section-title">Locations</div>
                        <div class="sidebar-item" onclick="FinderApp.openFolder('/')">
                            <span class="sidebar-item-icon">💾</span> Computer
                        </div>
                    </div>
                </div>
                <div class="finder-main">
                    <div class="finder-toolbar">
                        <button class="finder-nav-btn" id="finder-back" onclick="FinderApp.navigateBack()">←</button>
                        <button class="finder-nav-btn" id="finder-forward" onclick="FinderApp.navigateForward()">→</button>
                        <input type="text" class="finder-path-input" value="${path}" id="finder-path" onchange="FinderApp.navigateTo(this.value)">
                        <div class="finder-view-toggle">
                            <button class="view-btn active" onclick="FinderApp.setView('icon')">⊞</button>
                            <button class="view-btn" onclick="FinderApp.setView('list')">☰</button>
                        </div>
                    </div>
                    <div class="finder-breadcrumb" id="finder-breadcrumb"></div>
                    <div class="finder-content-area" id="finder-content">
                        <div style="color: var(--text-secondary); text-align: center; padding: 40px;">Loading...</div>
                    </div>
                </div>
            </div>
        `;
        
        this.window = WindowManager.createWindow('Finder', content, {
            width: 800,
            height: 550
        });
        
        this.loadFolder(path);
    },
    
    async getDesktopPath() {
        try {
            const resp = await fetch('/api/desktop/files');
            const data = await resp.json();
            if (data.files[0]) {
                return data.files[0].path.split(/[\\/]/).slice(0, -1).join('/');
            }
        } catch {}
        return '~/Desktop';
    },
    
    async getDocumentsPath() {
        return '~/Documents';
    },
    
    async getDownloadsPath() {
        return '~/Downloads';
    },
    
    async getHomePath() {
        return '~';
    },
    
    async loadFolder(path) {
        const content = document.getElementById('finder-content');
        if (!content) return;
        
        try {
            // For now, show desktop files or demo data
            const response = await fetch('/api/desktop/files');
            const data = await response.json();
            
            if (data.success) {
                this.renderFiles(data.files, content);
                this.updateBreadcrumb(path);
                
                // Add to history
                this.history = this.history.slice(0, this.historyIndex + 1);
                this.history.push(path);
                this.historyIndex++;
            }
        } catch (error) {
            content.innerHTML = `<div style="color: var(--danger-color);">Error loading folder: ${error.message}</div>`;
        }
    },
    
    renderFiles(files, container) {
        const view = container.dataset.view || 'icon';
        
        if (files.length === 0) {
            container.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 40px;">Folder is empty</div>';
            return;
        }
        
        if (view === 'list') {
            container.innerHTML = `
                <table class="finder-list-view">
                    <thead>
                        <tr class="header-row">
                            <th class="file-col-icon"></th>
                            <th class="file-col-name">Name</th>
                            <th class="file-col-date">Date Modified</th>
                            <th class="file-col-size">Size</th>
                            <th class="file-col-kind">Kind</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${files.map(f => `
                            <tr ondblclick="FinderApp.fileDoubleClick('${f.path}', ${f.is_directory})">
                                <td class="file-col-icon">${this.getFileIcon(f)}</td>
                                <td>${f.name}</td>
                                <td>${new Date(f.modified).toLocaleDateString()}</td>
                                <td>${f.is_directory ? '-' : (f.size / 1024).toFixed(1) + ' KB'}</td>
                                <td>${f.is_directory ? 'Folder' : f.extension.toUpperCase() || 'File'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            container.innerHTML = `
                <div class="finder-icon-view">
                    ${files.map(f => `
                        <div class="finder-file-icon" ondblclick="FinderApp.fileDoubleClick('${f.path}', ${f.is_directory})">
                            <div class="file-icon">${this.getFileIcon(f)}</div>
                            <div class="file-name">${f.name}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    },
    
    getFileIcon(file) {
        if (file.is_directory) return '📁';
        const ext = file.extension.toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) return '🖼️';
        if (['.mp4', '.avi', '.mov'].includes(ext)) return '🎬';
        if (['.mp3', '.wav'].includes(ext)) return '🎵';
        if (['.txt', '.doc', '.pdf'].includes(ext)) return '📄';
        return '📄';
    },
    
    fileDoubleClick(path, isDirectory) {
        if (isDirectory) {
            this.openFolder(path);
        } else {
            fetch('/api/files/open', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path })
            });
        }
    },
    
    navigateTo(path) {
        const input = document.getElementById('finder-path');
        if (input) this.openFolder(input.value);
    },
    
    navigateBack() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.openFolder(this.history[this.historyIndex]);
        }
    },
    
    navigateForward() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.openFolder(this.history[this.historyIndex]);
        }
    },
    
    setView(view) {
        const container = document.getElementById('finder-content');
        if (!container) return;
        
        container.dataset.view = view;
        
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        // Reload with new view
        this.loadFolder(this.currentPath);
    },
    
    updateBreadcrumb(path) {
        const breadcrumb = document.getElementById('finder-breadcrumb');
        if (!breadcrumb) return;
        
        const parts = path.split(/[\\/]/).filter(p => p);
        breadcrumb.innerHTML = parts.map((part, i) => {
            const fullPath = parts.slice(0, i + 1).join('/');
            return `<span class="breadcrumb-item" onclick="FinderApp.openFolder('${fullPath}')">${part}</span>` +
                   (i < parts.length - 1 ? '<span class="breadcrumb-separator"> › </span>' : '');
        }).join('') || '<span class="breadcrumb-item">Home</span>';
    },
    
    close() {
        if (this.window) {
            WindowManager.closeWindow(this.window);
            this.window = null;
        }
    }
};

window.FinderApp = FinderApp;
