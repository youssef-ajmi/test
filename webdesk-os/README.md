# 🖥️ WebDesk OS - macOS-style Desktop as Lively Wallpaper

A Flask-powered local web application that mimics macOS, rendered by Lively Wallpaper as an interactive desktop background with real system integration.

## 📋 Features

### Core Features
- **macOS-style Interface**: Menu bar, dock with magnification, draggable/resizable windows
- **Real Desktop Integration**: Shows your actual Windows desktop files and folders
- **File Management**: Open, delete, rename files through the interface
- **Application Launchers**: Launch real Windows applications from the dock or Launchpad
- **Spotlight Search**: Quick search for apps and files (Cmd/Ctrl + Space)

### Built-in Apps
- **Terminal**: Command-line interface with built-in commands and system command execution
- **Notes**: Persistent note-taking app with localStorage
- **Calculator**: Full-featured calculator
- **Weather**: Real-time weather using Open-Meteo API
- **Settings**: Customize theme, dock position/size, clock format
- **Finder**: File browser with icon and list views

### System Integration
- Real-time clock with date display
- Battery status monitoring
- CPU usage indicator
- File system watching for live updates
- WebSocket-based real-time communication

## 🚀 Installation

### Prerequisites
1. **Python 3.8+** installed on your system
2. **Lively Wallpaper** installed from Microsoft Store or GitHub

### Setup Steps

1. **Clone or download this project** to a folder on your computer

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the server**:
   - Double-click `start.bat` (Windows)
   - Or run: `python app.py`

4. **Configure Lively Wallpaper**:
   - Open Lively Wallpaper
   - Click "Add Wallpaper" → "Enter URL"
   - Enter: `http://127.0.0.1:5000`
   - Set interaction mode to "Interactive"

## 📁 Project Structure

```
webdesk-os/
├── app.py                 # Flask backend server
├── config.json            # User settings (auto-created)
├── requirements.txt       # Python dependencies
├── start.bat             # Windows startup script
│
├── templates/
│   └── index.html        # Main HTML page
│
├── static/
│   ├── css/
│   │   ├── main.css      # Global styles
│   │   ├── desktop.css   # Desktop icons
│   │   ├── window.css    # Window styles
│   │   ├── dock.css      # Dock & Launchpad
│   │   ├── menu.css      # Menu bar
│   │   └── finder.css    # File browser
│   │
│   ├── js/
│   │   ├── core.js       # Main application logic
│   │   ├── window.js     # Window management
│   │   ├── dock.js       # Dock & Spotlight
│   │   ├── menu.js       # Menu bar
│   │   ├── context-menu.js
│   │   ├── notifications.js
│   │   └── apps/
│   │       ├── terminal.js
│   │       ├── calculator.js
│   │       ├── notes.js
│   │       ├── weather.js
│   │       ├── settings.js
│   │       └── finder.js
│   │
│   └── assets/           # Icons, wallpapers, sounds
│
└── modules/              # Python backend modules
```

## 🎮 Usage

### Keyboard Shortcuts
- **Cmd/Ctrl + Space**: Open Spotlight Search
- **Escape**: Close dialogs/deselect
- **Delete**: Delete selected files

### Dock
- Click icons to launch apps
- Hover for magnification effect
- Running apps show a dot indicator

### Desktop
- Double-click files to open them
- Right-click for context menu
- Drag to select multiple files
- Ctrl+click to toggle selection

### Windows
- Drag titlebar to move
- Resize from edges/corners
- Red/Yellow/Green buttons: Close/Minimize/Maximize

## ⚙️ Configuration

Settings are stored in `config.json`:

```json
{
    "theme": "dark",
    "dock_position": "bottom",
    "dock_size": "medium",
    "clock_format": "12h",
    "pinned_apps": ["finder", "terminal", "notes", "calculator"]
}
```

Or use the Settings app in the UI!

## 🔐 Security

- Server binds only to `127.0.0.1` (localhost)
- No external network access
- Path validation prevents directory traversal
- Confirmation dialogs for destructive actions

## 🛠️ Technologies

| Component | Technology |
|-----------|------------|
| Backend | Flask + Flask-SocketIO |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Real-time | WebSocket (Socket.IO) |
| System Info | psutil |
| File Watching | watchdog |
| Display | Lively Wallpaper (WebView) |

## 📝 Notes

- This creates an overlay on top of Windows, not a replacement OS
- Performance depends on your system and WebView renderer
- Keep Windows taskbar visible for easy access to system functions
- For best experience, set Lively Wallpaper to "Performance" mode when gaming

## 🐛 Troubleshooting

**Server won't start:**
- Check if port 5000 is available
- Ensure Python is in PATH
- Try running as administrator

**Wallpaper not showing:**
- Verify Flask server is running (check console)
- In Lively Wallpaper, set "Web Page" as source type
- Enable "Allow user interaction"

**Files not appearing:**
- Check that your Desktop folder has files
- The app shows files from `%USERPROFILE%\Desktop`

## 📄 License

MIT License - Feel free to modify and distribute!

## 🙏 Credits

Inspired by macOS design language. Built for the community by the community.

---

**Enjoy your new macOS-style desktop on Windows!** 🍎✨
