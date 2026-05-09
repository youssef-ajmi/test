// Context Menu

const ContextMenu = {
    currentFile: null,
    
    show(x, y, file) {
        this.currentFile = file;
        const menu = document.getElementById('context-menu');
        
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.classList.remove('hidden');
        
        // Setup menu actions
        menu.querySelectorAll('.context-menu-item').forEach(item => {
            item.onclick = () => this.handleAction(item.dataset.action);
        });
        
        // Close on click outside
        setTimeout(() => {
            document.addEventListener('click', this.hideOnOutsideClick);
        }, 100);
    },
    
    hide() {
        const menu = document.getElementById('context-menu');
        menu.classList.add('hidden');
        document.removeEventListener('click', this.hideOnOutsideClick);
    },
    
    hideOnOutsideClick: (e) => {
        const menu = document.getElementById('context-menu');
        if (!menu.contains(e.target)) {
            menu.classList.add('hidden');
            document.removeEventListener('click', ContextMenu.hideOnOutsideClick);
        }
    },
    
    handleAction(action) {
        if (!this.currentFile) return;
        
        switch(action) {
            case 'open':
                if (this.currentFile.is_directory) {
                    if (window.FinderApp) FinderApp.openFolder(this.currentFile.path);
                } else {
                    fetch('/api/files/open', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ path: this.currentFile.path })
                    });
                }
                break;
                
            case 'delete':
                if (confirm(`Delete "${this.currentFile.name}"?`)) {
                    fetch('/api/files/delete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ path: this.currentFile.path })
                    }).then(() => {
                        App.loadDesktopFiles();
                        App.showNotification('Deleted', 'Item moved to trash', 'info');
                    });
                }
                break;
                
            case 'rename':
                const newName = prompt('New name:', this.currentFile.name);
                if (newName && newName !== this.currentFile.name) {
                    fetch('/api/files/rename', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            old_path: this.currentFile.path,
                            new_name: newName
                        })
                    }).then(() => {
                        App.loadDesktopFiles();
                    });
                }
                break;
                
            case 'copy':
                navigator.clipboard.writeText(this.currentFile.path);
                App.showNotification('Copied', 'Path copied to clipboard', 'info');
                break;
                
            case 'properties':
                const size = this.currentFile.is_directory ? 
                    'Folder' : 
                    (this.currentFile.size / 1024).toFixed(2) + ' KB';
                alert(`${this.currentFile.name}\n\nSize: ${size}\nModified: ${this.currentFile.modified}\nPath: ${this.currentFile.path}`);
                break;
        }
        
        this.hide();
    }
};

window.ContextMenu = ContextMenu;
