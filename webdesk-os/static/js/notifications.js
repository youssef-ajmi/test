// Notification System

const Notifications = {
    notifications: [],
    id: 0,
    
    show(title, message, type = 'info', duration = 4000) {
        const id = this.id++;
        const notification = { id, title, message, type };
        this.notifications.push(notification);
        
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.style.cssText = `
            position: fixed;
            top: calc(var(--menu-bar-height) + 10px);
            right: 10px;
            background: var(--bg-primary);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            padding: 15px 20px;
            min-width: 280px;
            max-width: 350px;
            box-shadow: 0 10px 30px var(--shadow-color);
            z-index: 12000;
            transform: translateX(400px);
            transition: transform 0.3s ease-out;
        `;
        
        const iconMap = {
            info: 'ℹ️',
            success: '✅',
            error: '❌',
            warning: '⚠️'
        };
        
        toast.innerHTML = `
            <div style="display: flex; gap: 12px; align-items: start;">
                <div style="font-size: 20px;">${iconMap[type] || iconMap.info}</div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 14px; color: var(--text-primary); margin-bottom: 4px;">${title}</div>
                    <div style="font-size: 13px; color: var(--text-secondary);">${message}</div>
                </div>
                <button onclick="Notifications.dismiss(${id})" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 16px; padding: 0;">×</button>
            </div>
        `;
        
        document.getElementById('notification-area').appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(id);
            }, duration);
        }
        
        // Add to notification center
        this.addToCenter(title, message, type);
        
        return id;
    },
    
    dismiss(id) {
        const toast = Array.from(document.querySelectorAll('.toast-notification'))
            .find(el => el.textContent.includes(this.notifications.find(n => n.id === id)?.title || ''));
        
        if (toast) {
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }
        
        this.notifications = this.notifications.filter(n => n.id !== id);
    },
    
    addToCenter(title, message, type, time = new Date()) {
        const ncContent = document.getElementById('nc-content');
        
        const notif = document.createElement('div');
        notif.className = 'nc-notification';
        notif.innerHTML = `
            <div class="nc-notification-title">${title}</div>
            <div class="nc-notification-body">${message}</div>
            <div class="nc-notification-time">${time.toLocaleTimeString()}</div>
        `;
        
        ncContent.insertBefore(notif, ncContent.firstChild);
    },
    
    clear() {
        document.getElementById('notification-area').innerHTML = '';
        document.getElementById('nc-content').innerHTML = '';
        this.notifications = [];
    }
};

window.Notifications = Notifications;
window.toggleNotificationCenter = () => {
    const nc = document.getElementById('notification-center');
    nc.classList.toggle('hidden');
};
