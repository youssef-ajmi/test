// Menu Bar and System Controls

const MenuBar = {
    init() {
        this.setupMenuItems();
        this.startSystemInfoUpdates();
    },
    
    setupMenuItems() {
        // Apple menu click
        document.querySelector('.apple-menu').addEventListener('click', () => {
            this.showAppleMenu();
        });
        
        // Setup system status icons
        document.getElementById('wifi-icon').addEventListener('click', () => {
            App.showNotification('Network', 'WiFi Connected', 'info');
        });
        
        document.getElementById('battery-icon').addEventListener('click', () => {
            this.showBatteryInfo();
        });
        
        document.getElementById('volume-icon').addEventListener('click', () => {
            App.showNotification('Volume', 'Volume: 100%', 'info');
        });
    },
    
    showAppleMenu() {
        const menu = document.createElement('div');
        menu.className = 'menu-dropdown';
        menu.style.left = '10px';
        menu.innerHTML = `
            <div class="menu-dropdown-item">About This Mac<span class="shortcut"></span></div>
            <div class="menu-dropdown-divider"></div>
            <div class="menu-dropdown-item">System Preferences<span class="shortcut">⌘,</span></div>
            <div class="menu-dropdown-item">App Store...</div>
            <div class="menu-dropdown-divider"></div>
            <div class="menu-dropdown-item">Recent Items</div>
            <div class="menu-dropdown-item">Force Quit...<span class="shortcut">⌥⌘Esc</span></div>
            <div class="menu-dropdown-divider"></div>
            <div class="menu-dropdown-item" onclick="location.reload()">Restart WebDesk</div>
            <div class="menu-dropdown-item" onclick="alert('Shutdown would be called here')">Shut Down...</div>
        `;
        
        document.body.appendChild(menu);
        
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    },
    
    async showBatteryInfo() {
        try {
            const response = await fetch('/api/system/info');
            const data = await response.json();
            
            if (data.battery) {
                App.showNotification(
                    'Battery', 
                    `${data.battery.percent}% ${data.battery.plugged ? '(Charging)' : ''}`, 
                    'info'
                );
            } else {
                App.showNotification('Battery', 'No battery detected', 'info');
            }
        } catch (error) {
            console.error('Failed to get battery info:', error);
        }
    },
    
    startSystemInfoUpdates() {
        // Update system info every 5 seconds
        setInterval(async () => {
            try {
                const response = await fetch('/api/system/info');
                const data = await response.json();
                
                // Update battery icon
                const batteryIcon = document.getElementById('battery-icon');
                if (data.battery) {
                    let icon = '🔋';
                    if (data.battery.percent < 20) icon = '🪫';
                    if (data.battery.plugged) icon = '🔌';
                    batteryIcon.textContent = icon;
                    batteryIcon.title = `${data.battery.percent}%`;
                }
                
                // Update volume icon based on usage
                const cpuUsage = data.cpu_percent;
                if (cpuUsage > 80) {
                    document.getElementById('wifi-icon').textContent = '🔥';
                } else {
                    document.getElementById('wifi-icon').textContent = '📶';
                }
                
            } catch (error) {
                console.error('Failed to update system info:', error);
            }
        }, 5000);
    }
};

window.MenuBar = MenuBar;
MenuBar.init();
