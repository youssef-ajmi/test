// Window Manager

const WindowManager = {
    windows: [],
    zIndex: 100,
    
    createWindow(title, content, options = {}) {
        const template = document.getElementById('window-template');
        const windowEl = template.content.cloneNode(true).querySelector('.window');
        
        // Set properties
        windowEl.querySelector('.window-title').textContent = title;
        windowEl.querySelector('.window-content').innerHTML = content;
        
        // Position
        const offsetX = options.x || 100 + (this.windows.length * 30);
        const offsetY = options.y || 100 + (this.windows.length * 30);
        windowEl.style.left = offsetX + 'px';
        windowEl.style.top = offsetY + 'px';
        windowEl.style.zIndex = ++this.zIndex;
        
        if (options.width) windowEl.style.width = options.width + 'px';
        if (options.height) windowEl.style.height = options.height + 'px';
        
        // Add to DOM
        document.body.appendChild(windowEl);
        this.windows.push(windowEl);
        
        // Setup event listeners
        this.setupWindowListeners(windowEl, title);
        
        // Focus window
        this.focusWindow(windowEl);
        
        return windowEl;
    },
    
    setupWindowListeners(windowEl, title) {
        const titlebar = windowEl.querySelector('.window-titlebar');
        const closeBtn = windowEl.querySelector('.window-control.close');
        const minBtn = windowEl.querySelector('.window-control.minimize');
        const maxBtn = windowEl.querySelector('.window-control.maximize');
        
        // Dragging
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        
        titlebar.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('window-control')) return;
            isDragging = true;
            dragOffset.x = e.clientX - windowEl.offsetLeft;
            dragOffset.y = e.clientY - windowEl.offsetTop;
            this.focusWindow(windowEl);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            windowEl.style.left = (e.clientX - dragOffset.x) + 'px';
            windowEl.style.top = (e.clientY - dragOffset.y) + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        // Close button
        closeBtn.addEventListener('click', () => {
            this.closeWindow(windowEl);
        });
        
        // Minimize button
        minBtn.addEventListener('click', () => {
            this.minimizeWindow(windowEl);
        });
        
        // Maximize button
        maxBtn.addEventListener('click', () => {
            this.toggleMaximize(windowEl);
        });
        
        // Focus on click
        windowEl.addEventListener('mousedown', () => {
            this.focusWindow(windowEl);
        });
        
        // Resize handles
        this.setupResizeHandles(windowEl);
    },
    
    setupResizeHandles(windowEl) {
        const handles = windowEl.querySelectorAll('.window-resize-handle');
        let isResizing = false;
        let resizeDir = '';
        let startRect = {};
        let startPos = { x: 0, y: 0 };
        
        handles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                isResizing = true;
                resizeDir = handle.className.replace('window-resize-handle resize-', '');
                startRect = windowEl.getBoundingClientRect();
                startPos = { x: e.clientX, y: e.clientY };
            });
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const dx = e.clientX - startPos.x;
            const dy = e.clientY - startPos.y;
            
            if (resizeDir.includes('e')) {
                windowEl.style.width = Math.max(400, startRect.width + dx) + 'px';
            }
            if (resizeDir.includes('w')) {
                const newWidth = Math.max(400, startRect.width - dx);
                windowEl.style.width = newWidth + 'px';
                windowEl.style.left = (startRect.left + (startRect.width - newWidth)) + 'px';
            }
            if (resizeDir.includes('s')) {
                windowEl.style.height = Math.max(300, startRect.height + dy) + 'px';
            }
            if (resizeDir.includes('n')) {
                const newHeight = Math.max(300, startRect.height - dy);
                windowEl.style.height = newHeight + 'px';
                windowEl.style.top = (startRect.top + (startRect.height - newHeight)) + 'px';
            }
        });
        
        document.addEventListener('mouseup', () => {
            isResizing = false;
        });
    },
    
    focusWindow(windowEl) {
        this.zIndex++;
        windowEl.style.zIndex = this.zIndex;
        
        document.querySelectorAll('.window').forEach(w => {
            w.classList.remove('focused');
        });
        windowEl.classList.add('focused');
    },
    
    closeWindow(windowEl) {
        windowEl.remove();
        this.windows = this.windows.filter(w => w !== windowEl);
    },
    
    minimizeWindow(windowEl) {
        windowEl.classList.add('minimized');
    },
    
    toggleMaximize(windowEl) {
        windowEl.classList.toggle('maximized');
    },
    
    restoreWindow(windowEl) {
        windowEl.classList.remove('minimized');
        this.focusWindow(windowEl);
    }
};

window.WindowManager = WindowManager;
